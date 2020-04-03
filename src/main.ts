import { LevelConst, lobby } from './lobby/lobby';
import { zombie } from './zombie/zombie';
import { memory } from './memory/memory';
import { grid } from './grid/grid';
import { KEY_CONST, _DEBUG } from './shared/utility';
import { Game } from './shared/game';

var gamesList: Game[] = [grid, zombie, memory, lobby];

window.addEventListener('keydown', ev => {
    if (ev.keyCode === KEY_CONST.menu){
        gamesList.forEach(game => {
            game.Pause();
            game.Restart();
        });

        lobby.Play();
    }
})

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
    }
    // {
    //     id: LevelConst.HighScore,
    //     action: () => {
    //         console.log("Play highscores")
    //     },
    //     text: 'Highscores'
    // }
]

lobby.SetMenu(menuOptions);
// lobby.Play();


export function Start() {
    lobby.Resize();
    lobby.Play();
}

export var _Debug = _DEBUG;