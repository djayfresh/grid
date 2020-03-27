define(function (require) {
    var zombieGame = require('./zombie/game');
    var lobby = require('./lobby/lobby');
    
    var menuOptions = [
        {
            id: LevelConst.Grid,
            action: () => {
                lobby.Pause();
                console.log("play grid");
            },
            text: 'Grid'
        },
        { 
            id: LevelConst.Zombie, 
            action: () => {
                lobby.Pause();
                zombieGame.Play();
            },
            text: 'Zombie'
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
});