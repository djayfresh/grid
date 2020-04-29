import { Game } from '../shared/game';
import { Mouse, KeyboardManager, KEY_CONST } from '../shared/utility';
import { GameCanvas } from '../shared/canvas';
import { Rectangle } from '../shared/objects';
import { LevelConst } from '../lobby/levels';
import { GameEventQueue } from '../shared/event-queue';
import { PlayerJoinedEvent, PlayerMovedEvent, LobbyCreatedEvent, CreateLobbyEvent } from './events';
import { ImagesLoadedEvent } from '../shared/events';
import { ImageManager } from '../shared/images';
import { HockeyWorld } from './world';
import { Player } from '../zombie/objects';

class HockeyGame extends Game {
    world: HockeyWorld;
    mouse: Mouse;
    playerId: string;
    otherPlayer: Player;
    host: boolean;
    lobbyId?: string;

    constructor() {
        super();
    }

    RunRound() {
        if (this.world.player){
            const move = KeyboardManager.moves();

            //move the world
            const worldX = this.world.pos.x;
            const worldY = this.world.pos.y;
            
            const playerX = this.world.player.pos.x;
            const playerY = this.world.player.pos.y;
            const playerW = (this.world.player as Rectangle).width;
            const playerH = (this.world.player as Rectangle).height;
            const playerRect = { x: playerX, y: playerY, w: playerW, h: playerH };

            if (move.x !== 0 || move.y !== 0){
                GameEventQueue.notify(new PlayerMovedEvent({lobbyId: this.lobbyId, playerId: this.playerId, pos: this.world.player.pos}));
            }

            if (this.world.playerAttachedToCenter){
                this.world.validateMove(move, playerRect, { x: worldX, y: worldY }, (x, y) => this.world.setPos(x, y), () => this.world.setPos(worldX, worldY));
            }
            else {
                this.world.setPos(worldX, worldY);
            }
        }
    }

    _init() {
        super._init();

        if (!this._initialized){
            this.world = new HockeyWorld(LevelConst.Hockey);
            // this.world.loadImages();
            this.mouse.relative = true;
            this.Resize();
        
            KeyboardManager.track(KEY_CONST.down);
            KeyboardManager.track(KEY_CONST.up);
            KeyboardManager.track(KEY_CONST.left);
            KeyboardManager.track(KEY_CONST.right);
            KeyboardManager.track(KEY_CONST.x);
            KeyboardManager.track(KEY_CONST.r);
            KeyboardManager.track(KEY_CONST.j);

            GameEventQueue.subscribe(ImagesLoadedEvent, 'hockey-game', () => {
            });

            GameEventQueue.subscribe(LobbyCreatedEvent, 'hockey-game', event => {
                this.lobbyId = event.data.lobbyId;

                GameEventQueue.notify(new PlayerJoinedEvent({lobbyId: this.lobbyId, playerId: this.playerId }));

                this.world.reset();
                this.world.generateMap();
            });

            GameEventQueue.subscribe(PlayerJoinedEvent, 'hockey-game', event => {
                if (event.data.playerId === this.playerId){
                    return;
                }

                this.otherPlayer = new Player();
                this.world.add(this.otherPlayer);
            });

            GameEventQueue.subscribe(PlayerMovedEvent, 'hockey-game', event => {
                this.otherPlayer.setPos(event.data.pos.x, event.data.pos.y);
            });
        }
        this.playerId = '' + Math.round(Math.random() * 100);

        this.world.setPos(0, 0);

        this.roundDelay = 0;

        this.world.reset();
        this.world.setRoundStart(1);

        GameEventQueue.notify(new CreateLobbyEvent({gameId: LevelConst.Hockey}));

        if (ImageManager.getImages('zombie').every(i => i.isLoaded)){
            GameEventQueue.notify(new ImagesLoadedEvent([]));
        }

        GameCanvas.canvas.style.cursor = 'default';
    }

    Restart() {
        super.Restart();

        this.Resize();
    }
}

export var hockey = new HockeyGame();