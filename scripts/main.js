define(function (require) {
    var zombieGame = require('./zombie/zombie');
    var lobby = require('./lobby/lobby');
    var grid = require('./grid/grid');
    
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