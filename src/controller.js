class Controller {
    constructor(model, view) {
        this._model = model;
        this._view = view;
        
        this._startTime     = Date.now();
        this._lag           = 0;
        this._fps           = 60; // Frame rate.
        this._frameDuration = 1000 / this._fps; // Avec 60 frame par seconde, la frame va durer 16.7ms.

        this._model.BindDisplay(this.Display.bind(this));
        this._model.BindGameOver(this.GameOver.bind(this));
        this._view.BindSetDirection(this.SetDirection.bind(this));

        this.Update();
    }

    Display(position, tiles, score) {
        this._view.Display(position, tiles, score);
    }

    GameOver() {
        this._view.GameOver(this._model.score);
    }    

    SetDirection(newDirection) {
        this._model.direction = newDirection;
    }
    
    Update() {
        let currentTime = Date.now();
        let deltaTime   = currentTime - this._startTime;
        
        this._lag += deltaTime;
        this._startTime = currentTime;

        while (this._lag >= this._frameDuration) {
            this._model.Move(this._fps, this._view._canvas);
            this._lag -= this._frameDuration;
        }
        
        requestAnimationFrame(this.Update.bind(this));
    }
}