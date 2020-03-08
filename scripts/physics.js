var physics = {};

physics.check = function() {
    let x = 0;
    let y = 0;

    if(keyboardManager.isKeyDown(KEY_CONST.right)){
        x = 1;
    }
    if(keyboardManager.isKeyDown(KEY_CONST.down)){
        y = 1;
    }
    if(keyboardManager.isKeyDown(KEY_CONST.left)){
        x = -1;
    }
    if(keyboardManager.isKeyDown(KEY_CONST.up)){
        y = -1;
    }

    physics.movePlayer(x, y);

    Debug.keyboard("Keys down:", keyboardManager.downKeys);
}

physics.movePlayer = function(x, y){
    const movement = board.getMove(ID_CONST.Player, x, y);
    if (movement) {
        const movePlayer = function() {
            board.move(ID_CONST.Player, x, y, movement);
        };

        if (movement.destination !== ID_CONST.Grid){
            //check game states
            switch(movement.destination){
                case ID_CONST.Wall:
                    //no move
                    break;
                case ID_CONST.Enemy:
                    Debug.log("Lost Game");
                    Start();
                    break;
                case ID_CONST.Flag:
                    movePlayer();
                    Debug.log("Win Game");
                    score += 1;
                    difficulty += 1;
                    Start();
                    break;
                case ID_CONST.PowerUp:
                    //Enable PowerUP
                    Debug.log("Power Up");
                    difficulty - 2;
                    movePlayer();
                    break;
                default:
                    movePlayer();
                    break;
            }
        }
        else {
            movePlayer();
        }
    }
}

define(['./utility'], function() {
    return physics;
});