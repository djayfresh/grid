// @vitest-environment happy-dom
import { flush, installFakeRooms } from '@djayfresh/engine-platform/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTogether } from '../src/together';

// "Play together" on the page, over the engine's in-memory rooms: the rooms
// script is only on playallday.games, so this is where the page side is tried.

const press = (label: string) => {
  const dialogs = [...document.querySelectorAll('pad-dialog')];
  const button = dialogs.flatMap((d) => [...d.shadowRoot!.querySelectorAll('button')]).find((b) => b.textContent === label);
  if (!button) throw new Error(`no ${label} button`);
  button.click();
};

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as { playallday?: unknown }).playallday;
  history.replaceState(null, '', '/');
});

describe('playing together', () => {
  it('has no button where there are no rooms', () => {
    const together = createTogether({ round: () => 'classic', onStart: vi.fn(), board: document.createElement('p') });
    expect(together.button).toBe(null);
    expect(together.inRoom).toBe(false);
  });

  it('hosts a room, lets a friend in by its link, and starts the same race on both', async () => {
    const fake = installFakeRooms();
    const hostStart = vi.fn();
    const hostBoard = document.createElement('p');
    const host = createTogether({ round: () => 'classic', onStart: hostStart, board: hostBoard });
    host.button!.click();
    press('Host a room');
    await flush();
    expect(host.hosting).toBe(true);
    const code = [...fake.hubs.keys()][0];

    // The friend opens the share link: ?room=<code>.
    history.replaceState(null, '', `/?room=${code}`);
    const friendStart = vi.fn();
    const friendBoard = document.createElement('p');
    const friend = createTogether({ round: () => 'other', onStart: friendStart, board: friendBoard });
    await flush();
    await flush();
    expect(friend.inRoom).toBe(true);
    expect(friend.hosting).toBe(false);
    expect(location.search).toBe('');

    host.startRace();
    await flush();
    expect(hostStart).toHaveBeenCalledTimes(1);
    const [seed, round] = hostStart.mock.calls[0];
    // The host's round, from the room's settings, whatever the friend's page had.
    expect(friendStart).toHaveBeenCalledWith(seed, round);
    expect(round).toBe('classic');

    friend.report(3, false);
    host.report(5, false);
    await flush();
    expect(hostBoard.hidden).toBe(false);
    expect(hostBoard.textContent).toMatch(/^You 5 · .+ 3$/);
    expect(friendBoard.textContent).toMatch(/^.+ 5 · You 3$/);
  });
});
