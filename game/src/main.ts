import { lobby } from './lobby/lobby';
import { LevelConst } from './lobby/levels';
import { zombie } from './zombie/zombie';
import { memory } from './memory/memory';
import { grid } from './grid/grid';
import { KEY_CONST, _DEBUG, Key } from './shared/utility';
import { Game } from './shared/game';
import { ImageManager } from './shared/images';
import { GameCanvas } from './shared/canvas';
import { highscore } from './highscore/highscore';
import { GameEventQueue } from './shared/event-queue';
import { MenuLoadMainEvent } from './shared/events';
import { Analytics } from './shared/analytics';
import { HighScoreService } from './services/highscore.service';
import { HighScoreManager } from './highscore/manager';

const gamesList: Game[] = [grid, zombie, memory, lobby, highscore];
let selectedGame: Game = lobby;

function loadMainMenu() {
    gamesList.forEach(game => {
        game.Pause();
        game.Restart();
    });
    selectedGame = lobby;
    lobby.Play();

    Analytics.onGameChange('main_menu');
}

GameEventQueue.subscribe(MenuLoadMainEvent, 'main', () => {
    loadMainMenu();
});

HighScoreService.load();

window.addEventListener('keydown', ev => {
    if (ev.keyCode === KEY_CONST.menu){
        loadMainMenu();
    }
    if(ev.keyCode === KEY_CONST.pause){
        selectedGame.TogglePlayPause();
        Analytics.onEvent({
            action: 'main_menu',
            category: 'bounce',
            label: 'keyboard'
        }, 'pause');
    }
});

var menuOptions = [
    {
        id: LevelConst.Grid,
        action: () => {
            lobby.Pause();
            grid.Play();
            selectedGame = grid;

            Analytics.onGameChange(LevelConst[LevelConst.Grid]);
        },
        text: 'Grid'
    },
    {
        id: LevelConst.Zombie,
        action: () => {
            lobby.Pause();
            zombie.Play();
            selectedGame = zombie;

            Analytics.onGameChange(LevelConst[LevelConst.Zombie]);
        },
        text: 'Zombie'
    },
    {
        id: LevelConst.Memory,
        action: () => {
            lobby.Pause();
            memory.Play();
            selectedGame = memory;

            Analytics.onGameChange(LevelConst[LevelConst.Memory]);
        },
        text: 'Memory'
    },
    {
        id: LevelConst.HighScore,
        action: () => {
            lobby.Pause();
            highscore.Play();

            selectedGame = highscore;
            Analytics.onGameChange(LevelConst[LevelConst.HighScore]);
        },
        text: 'High Scores'
    }
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

    Analytics.onGameChange('main_menu');
}

export var _Debug = _DEBUG;