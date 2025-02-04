class View {

    constructor(gameType, id) {
        this._id = id;
        this._canvas = document.getElementById(`canvas-${this._id}`);
        this._widthCell = this._canvas.width/5;
        this._heightCell = this._widthCell/4;
        
        this.ctx = this._canvas.getContext('2d');
        this._hold_right = false;
        this._hold_left = false;
        this.gameType = gameType;

        this.player = { x: this._canvas.width/6, y: this._canvas.height/5 }; // Position initiale du joueur
        this.score = 0;
        this.scoreToTriggerBanner = 10000;

        this.DOODLE_IMAGE = new Image();
        this.DOODLE_IMAGE.src = '../assets/lik-left@2x.png';    // Default : left image

        if (gameType === "player") {
            this.createAIToggleButton();
        }

        this.Events();
    }

    createAIToggleButton() {

        let toggleBtn = document.getElementById('ai-toggle');
        if(toggleBtn === null) {
            toggleBtn = document.createElement('button');
            toggleBtn.textContent = "Enable AI";
            toggleBtn.className = 'button';
            toggleBtn.id = 'ai-toggle';
        }

        let buttonContainer = document.getElementById('button-container');
        buttonContainer.insertBefore(toggleBtn, buttonContainer.firstChild);

        toggleBtn.addEventListener('click', () => {
            if (this.b_ToggleAI) {
                this.b_ToggleAI();
                toggleBtn.textContent = toggleBtn.textContent === "Enable AI" ? "Disable AI" : "Enable AI";
            }
        });
    }

    BindToggleAI(callback) {
        this.b_ToggleAI = callback;
    }

    BindSetDirection(callback) {
        this.b_SetDirection = callback;
    }

    Events() {
        if("player" !== this.gameType) { return; }

        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') {
                switch (evt.key) {
                    case 'ArrowLeft': // Move left.
                        this.DOODLE_IMAGE.src = '../assets/lik-left@2x.png';
                        this._hold_left = true;
                        this.b_SetDirection(-1);
                        break;
                    case 'ArrowRight': // Move right.
                        this.DOODLE_IMAGE.src = '../assets/lik-right@2x.png';
                        this._hold_right = true;
                        this.b_SetDirection(1);
                        break;
                }
            }
        });

        document.addEventListener('keyup', (evt) => {
            switch (evt.key) {
                case 'ArrowLeft': // Move left.
                    if (!this._hold_right) {
                        this.b_SetDirection(0);
                    }
                    this._hold_left = false;
                    break;
                case 'ArrowRight': // Move right.
                    if (!this._hold_left) {
                        this.b_SetDirection(0);
                    }
                    this._hold_right = false;
                    break;
            }
        });
    }

    Display(position, tiles, score, nearestTiles, isAlive) {
        this.player.x = position.x;
        this.player.y = position.y;
        this.score = score;

        this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        const BACKGROUND_IMAGE = new Image();
        BACKGROUND_IMAGE.src = "../assets/bck@2x.png";
        this.ctx.drawImage(BACKGROUND_IMAGE, 0, 0, this._canvas.width, this._canvas.height);

        // Dessiner les tuiles
        tiles.forEach(tile => {
            tile.draw(this.ctx);
        });

        // Doodle
        this.ctx.drawImage(this.DOODLE_IMAGE, this.player.x, this.player.y, 40, 40);

        let scoreDisplay = document.getElementById(`score-${this._id}`);
        scoreDisplay.textContent = `Score: ${Math.floor(this.score)}`;

        let isAliveDisplay = document.getElementById(`isAlive-${this._id}`);
        isAliveDisplay.textContent = `isAlive: ${isAlive}`;

        if (Math.floor(this.score) >= 10000 && "player" === this.gameType) {
            this.WinGame(Math.floor(this.score));
        }

        if ("ai" === this.gameType && nearestTiles != null) {
            this.Vector(nearestTiles);
        }
    }

    Vector(nearestTiles) {
        nearestTiles.forEach(t => {
            const tile = t.tile;
            // Get the center of the tile
            const tileCenterX = tile.x + (tile.width / 2);
            const tileCenterY = tile.y + (tile.height / 2);

            // Get the center of the doodle (player)
            const doodleCenterX = this.player.x + (this._canvas.width / 12);
            const doodleCenterY = this.player.y + (this._canvas.width / 10);

            this.ctx.beginPath();
            this.ctx.moveTo(doodleCenterX, doodleCenterY);
            this.ctx.lineTo(tileCenterX, tileCenterY);
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        })
    }

    GameOver(score) {
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreDisplay = document.getElementById('final-score');
        const restartButton = document.getElementById('restart-btn');

        gameOverScreen.style.display = 'block';
        finalScoreDisplay.textContent = `Votre score final est : ${Math.floor(score)}`;

        restartButton.addEventListener('click', () => {
            location.reload(); // Recharger la page pour commencer une nouvelle partie
        });
    }


    WinGame(score) {
        const winScreen = document.getElementById('win-screen');
        const winScoreDisplay = document.getElementById('win-score');
        const restartButton = document.getElementById('restart-win-btn');

        winScreen.style.display = 'block';
        winScoreDisplay.textContent = `Votre score final est : ${score}`;

        restartButton.addEventListener('click', () => {
            location.reload(); // Recharger la page pour recommencer
        });
    }
}
