import { LevelConst, lobby } from './lobby/lobby';
import { zombie } from './zombie/zombie';
import { memory } from './memory/memory';
import { grid } from './grid/grid';
import { KEY_CONST, _DEBUG, Key } from './shared/utility';
import { Game } from './shared/game';
import { ImageManager } from './shared/images';
import { GameCanvas } from './shared/canvas';

const gamesList: Game[] = [grid, zombie, memory, lobby];
let selectedGame: Game = lobby;

window.addEventListener('keydown', ev => {
    if (ev.keyCode === KEY_CONST.menu){
        gamesList.forEach(game => {
            game.Pause();
            game.Restart();
        });

        selectedGame = lobby;
        lobby.Play();
    }
    if(ev.keyCode === KEY_CONST.pause){
        selectedGame.TogglePlayPause();
    }
});

var menuOptions = [
    {
        id: LevelConst.Grid,
        action: () => {
            lobby.Pause();
            grid.Play();
            selectedGame = grid;
        },
        text: 'Grid'
    },
    {
        id: LevelConst.Zombie,
        action: () => {
            lobby.Pause();
            zombie.Play();
            selectedGame = zombie;
        },
        text: 'Zombie'
    },
    {
        id: LevelConst.Memory,
        action: () => {
            lobby.Pause();
            memory.Play();
            selectedGame = memory;
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

export function SetCanvasId(canvasId: string){
    GameCanvas.id = canvasId; //TODO: Make multi-canvas work on same page
}

export function ImageAssets(baseUrl: string){
    ImageManager.baseUrl = baseUrl;
}

export function Start() {
    lobby.Resize();
    lobby.Play();
}

export var _Debug = _DEBUG;