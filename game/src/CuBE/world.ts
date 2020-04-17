import { Rectangle, IGameObject } from "../shared/objects";
import { Colors } from "../shared/colors";
import { Debug } from "../shared/utility";

export function generateMap(world: any)  {
    console.log("Gen Map");
    const renderObjects: IGameObject[] = [];
    const cUbe = new Rectangle(0, Colors.Player, {x: -1, y: 1}, { x: 0.11, y: 0.11});
    world.add(cUbe);
    world.setPlayer(cUbe);
    world.playerAttachedToCenter = true;

    const eS = [
        {
            pos: {x: -1, y: -1, z: '2'},
            id: 17,
            color: Colors.Enemy
        },
        {
            pos: {x: -1, y: 1, z: '""'},
            id: 16,
            color: Colors.Enemy
        },
        {
            pos: {x: 0, y: 0, z: 0},
            id: undefined,
            color: Colors.Flag
        },
        {
            pos: {x: -1, y: 1, z: -2},
            id: 1,
            color: Colors.Flag
        }
    ];

    let e = 230980230000;
    let w:(e: any) => any;
        w = (w) => { console.log("CuBE - ADD", w); world.add(w.e); };
    let s: (number: number) => void;
    const log = s => console.log("CuBE - MAP: ", s, eS[e], "ES", eS, "U", cUbe, e, 0);
      s = log;
    const k = Object.keys(eS);

    console.log("e", e, "w", w, "s", s, "k", k, "eS", eS, "cUbe", cUbe);
    for(e = 0; e < eS.length; eS) {
        const s = eS[e];
        const o = eS[k[e]];
        const eN = new Rectangle(-2, Colors.Black, s.pos, {x: 1, y: 1});

        renderObjects.push(
            new Rectangle(17, Colors.Enemy, s.pos, {x: 0.1, y: 0.1}),
        );
        w({e: eN, s, o});

        log(s);
        log(o);

        e += 1;
    }
}