import { World } from '../shared/world';
import { Player, Spawner, SpawnerHouse, Enemy, Road, Path, Barricade, Objective, ZombieHud } from './objects';
import { GameObjectAttributes, Box, TiledImage } from '../shared/objects';
import { ID_CONST } from '../shared/utility';
import { Colors } from '../shared/colors';
import { SceneImage } from '../shared/images';
import { Point } from '../shared/physics';
import { House } from './prefabs';
import { GameEventQueue } from '../shared/event-queue';
import { ObjectDestroyedEvent } from '../shared/events';
import { EnemyKilledEvent, BarricadeDestroyedEvent, SpawnerDestroyedEvent } from './events';
import { GenerateGuns } from './weapons';
import { PlayerStats } from './leveling';
import { Weapon } from '../shared/weapons';

const STREET_WIDTH = 40;
const COLS_X = [0, 340, 680, 1020];
const ROWS_Y = [0, 260, 520];
const GRID_W = COLS_X[COLS_X.length - 1] + STREET_WIDTH;
const GRID_H = ROWS_Y[ROWS_Y.length - 1] + STREET_WIDTH;
const SPUR_LENGTH = 300;

export class ZombieWorld extends World {
    player: Player;
    playerAttachedToCenter: boolean = true;
    round: number = 1;
    stats: PlayerStats = new PlayerStats();

    //built once and reused across rounds so repeated Player construction doesn't leak Mouse listeners
    weapons: Weapon[] = Object.values(GenerateGuns());

    subscribe() {
        super.subscribe();

        GameEventQueue.subscribe(ObjectDestroyedEvent, 'zombie-world', event => {
            if (event.data instanceof Enemy){
                GameEventQueue.notify(new EnemyKilledEvent(event.data, event.date), true);
            }
            else if (event.data instanceof Barricade) {
                GameEventQueue.notify(new BarricadeDestroyedEvent(event.data, event.date), true);
            }
            else if (event.data instanceof Spawner) {
                GameEventQueue.notify(new SpawnerDestroyedEvent(event.data, event.date), true);
            }
        });
    }

    setPlayer(player: Player){
        this.player = player;
    }

    loadImages() {
        this.addImage({
            src: 'zombie/RoadLine.png',
            catalog: 'zombie',
            name: 'road',
            height: 100,
            width: 100
        });

        this.addImage({
            src: 'zombie/Ground_Tile_Dark.png',
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100
        });
    }

    generateMap() {
        this.map = this.map.filter(ro => !ro.isDeleted());

        const round = this.round || 1;
        const spawnerCount = Math.min(2 + round, 4);
        const spawnerHealth = 30 + ((round - 1) * 10);
        const barricadeHealth = 20 + ((round - 1) * 8);
        const enemySpeedBase = 0.026 + ((round - 1) * 0.004);
        const enemySiteRange = 300 + ((round - 1) * 20);

        const roadX: SceneImage = {
            catalog: 'zombie',
            name: 'road',
            height: STREET_WIDTH,
            width: STREET_WIDTH,
            showPreviewRender: true,
            previewColor: Colors.Black,
            rotation: 90
        };

        const roadY: SceneImage = {
            catalog: 'zombie',
            name: 'road',
            height: STREET_WIDTH,
            width: STREET_WIDTH,
            showPreviewRender: true,
            previewColor: Colors.Black
        };

        //full-span streets: every horizontal/vertical road overlaps every road it crosses, so the
        //`stillHeld` fix in World.noCollisions lets the player walk through every junction
        ROWS_Y.forEach(y => {
            this.add(new Road(roadX, ID_CONST.Street, {x: 0, y}, {x: GRID_W, y: STREET_WIDTH}));
        });

        COLS_X.forEach(x => {
            this.add(new Road(roadY, ID_CONST.Street, {x, y: 0}, {x: STREET_WIDTH, y: GRID_H}));
        });

        //objective spur off the bottom-right corner, gated by a mandatory barricade
        const spurY = ROWS_Y[ROWS_Y.length - 1];
        const spurStartX = GRID_W;
        this.add(new Road(roadX, ID_CONST.Street, {x: spurStartX, y: spurY}, {x: SPUR_LENGTH, y: STREET_WIDTH}));

        const mandatoryBarricade = new Barricade(
            {x: spurStartX + (SPUR_LENGTH / 2) - 10, y: spurY},
            {x: 20, y: STREET_WIDTH},
            barricadeHealth
        );
        this.add(mandatoryBarricade);

        const objective = new Objective(
            {x: spurStartX + SPUR_LENGTH + 10, y: spurY},
            {x: 40, y: STREET_WIDTH}
        );
        this.add(objective);

        //optional shortcut barricades - destroying these just shortens the route, they don't gate the goal
        this.add(new Barricade({x: COLS_X[1], y: ROWS_Y[0] + 100}, {x: STREET_WIDTH, y: 20}, Math.round(barricadeHealth * 0.7)));
        this.add(new Barricade({x: COLS_X[2], y: ROWS_Y[1] + 100}, {x: STREET_WIDTH, y: 20}, Math.round(barricadeHealth * 0.7)));

        //spawner-houses: destroy or skip, skipping risks zombies piling up
        const spawnerPositions = [
            {x: 510, y: 130},
            {x: 850, y: 130},
            {x: 510, y: 390},
            {x: 850, y: 390},
        ];

        for (let i = 0; i < spawnerCount; i++) {
            const pos = spawnerPositions[i % spawnerPositions.length];
            this.add(new SpawnerHouse(pos, {
                rate: 3500,
                maxSpawns: 12 + (round * 2),
                totalHealth: spawnerHealth,
                enemySpeed: enemySpeedBase,
                enemySiteRange: enemySiteRange
            }));
        }

        //homes + driveways, tucked against the west boundary column so their door always faces a road
        this.add(new House(ID_CONST.House, {x: 100, y: 50}, {x: 200, y: 200}));
        this.add(new Path(ID_CONST.Path, {x: 0, y: 90}, {x: 100, y: STREET_WIDTH}));

        this.add(new House(ID_CONST.House, {x: 100, y: 310}, {x: 200, y: 200}));
        this.add(new Path(ID_CONST.Path, {x: 0, y: 350}, {x: 100, y: STREET_WIDTH}));

        //real world boundary - a plain, non-rendering box (CanvasBounds was a permanent no-op, see CLAUDE.md/plan notes)
        const boundsPos = {x: -60, y: -60};
        const boundsSize = {x: GRID_W + SPUR_LENGTH + 200, y: GRID_H + 120};
        const bounds = new Box(-1000, boundsPos, boundsSize);
        bounds.attributes.push(GameObjectAttributes.Holding);
        bounds.attributes.push(GameObjectAttributes.NoExit);
        this.add(bounds);

        const groundImage: SceneImage = {
            catalog: 'zombie',
            name: 'ground',
            height: 100,
            width: 100,
            showPreviewRender: true,
            previewColor: Colors.Ground
        };

        const ground = new TiledImage(groundImage, ID_CONST.Ground,
            {x: boundsPos.x - 200, y: boundsPos.y - 200},
            {x: boundsSize.x + 400, y: boundsSize.y + 400});
        this.add(ground);

        this.add(new ZombieHud());

        //player starts at the top-left intersection, camera anchored so the player renders at canvas center
        const player = new Player(this.weapons);
        player.attachPlayerToCenter = this.playerAttachedToCenter;
        player.pos = new Point((this.canvas.x / 2) - (player.width / 2), (this.canvas.y / 2) - (player.height / 2));
        this.add(player);
        this.setPlayer(player);

        const START = new Point(COLS_X[0] + (STREET_WIDTH / 2), ROWS_Y[0] + (STREET_WIDTH / 2));
        this.snapPos(player.pos.x - START.x, player.pos.y - START.y);
    }
}
