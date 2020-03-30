export enum Colors {
    White = '#FFFFFF',
    Black = '#000000',
    HoverDark = '#333333',
    Player = '#004600',
    Enemy = '#820027',
    PowerUp = '#005ac6',
    Flag = '#c6b600',
    Wall = '#441d00',
    Bullet = '#8e8702',
    Ground = '#043511',
    Environment = '#00405e'
}

export class Color {
    static randomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}