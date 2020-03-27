define(function (require) {
    var zombieGame = require('./zombie/game');
    var lobby = require('./lobby/lobby');
    
    //zombieGame.Play();

    lobby.Play();
    lobby.onLevelSelect((id) => {
        console.log("Selected level", id);
        if (id === LevelConst.Zombie){
            zombieGame.Play();
        }
        else if (id === LevelConst.HighScore){
            console.log("Show highscores");
        }
    })
});