class Card extends Rectangle {
    flipSpeed = 0.03;
    flipped = false;
    currentState = 0;

    locked = false;
    flipLocked = false;

    originalPos;
    originalBounds;
    originalColor;
    cardColor;

    get isFlipped () {
        return this.currentState === 1;
    }

    constructor(cardColor, x, y, w, h) {
        super(ID_CONST.Player, '#002200', x, y, w, h);

        this.originalPos = new Point(x, y);
        this.originalBounds = new Point(w, h);
        this.originalColor = this.color;
        this.cardColor = cardColor;
        this.quarterFlipPos = new Point(this.originalPos.x + (this.originalBounds.x / 4), this.originalPos.y);
        this.halfFlipPos = new Point(this.originalPos.x + (this.originalBounds.x / 2), this.originalPos.y);
    }

    Flip(forced) {
        if ((this.locked || this.flipLocked) && !forced) {
            return;
        }

        this.flipped = !this.flipped;
    }

    Lock() {
        this.Flip();
        this.originalColor = '#FFFFFF';
        this.locked = true;
    }

    update(_dt, _world) {
        if (this.flipped && this.currentState < 1){
            this.flipLocked = true;
            this.currentState += this.flipSpeed;

            if (this.currentState > 0.5){
                this.color = this.cardColor;
            }

            this._lerpCard();
            
        }
        else if (!this.flipped && this.currentState > 0){
            this.flipLocked = true;
            this.currentState -= this.flipSpeed;

            if (this.currentState < 0.5){
                this.color = this.originalColor;
            }

            this._lerpCard();
        }
        else {
            this.currentState = this.flipped ? 1 : 0;
            this.flipLocked = this.flipped;

            this.pos = this.originalPos;
            this.width = this.originalBounds.x;
        }
    }

    _lerpCard() {
        if (this.currentState <= 0.5){
            this.pos = Point.lerp(this.currentState * 2, this.originalPos, this.halfFlipPos);
            this.width = Physics.lerp(this.currentState * 2, this.originalBounds.x, 1);
        }
        else {
            this.pos = Point.lerp((this.currentState - 0.5) * 2, this.halfFlipPos, this.originalPos);
            this.width = Physics.lerp((this.currentState - 0.5) * 2, 1, this.originalBounds.x);
        }
    }
}

define(['../shared/renderer', '../shared/utility', '../shared/physics', '../shared/objects'], function (render) {
    return {
        GridPlayer,
        Point: render.Point
    }
});