import { LevelConst, lobby } from './lobby/lobby';
import { zombie } from './zombie/zombie';
import { memory } from './memory/memory';
import { grid } from './grid/grid';

var menuOptions = [
    {
        id: LevelConst.Grid,
        action: () => {
            lobby.Pause();
            grid.Play();
        },
        text: 'Grid'
    },
    {
        id: LevelConst.Zombie,
        action: () => {
            lobby.Pause();
            zombie.Play();
        },
        text: 'Zombie'
    },
    {
        id: LevelConst.Memory,
        action: () => {
            lobby.Pause();
            memory.Play();
        },
        text: 'Memory'
    },
    {
        id: LevelConst.HighScore,
        action: () => {
            lobby.Pause();
            console.log("Play highscores")
        },
        text: 'Highscores'
    }
]

lobby.SetMenu(menuOptions);
lobby.Play();