class BoardController {
    constructor() {
        this.canvasGrid = document.getElementById('canvas-grid');
        this.mainCanvas = document.getElementById('canvas-0');
        this.controllers = [];
        this.darwin = new Darwin();
    }

    createGameInstance(index) {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-instance';
        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${index}`;
        canvas.width = 250;
        canvas.height = 400;
        canvas.className = 'mini-canvas';
        const score = document.createElement('p');
        score.textContent = 'Score: 0';
        score.id = `score-${index}`;
        const isAlive = document.createElement('p');
        isAlive.textContent = 'isAlive: true';
        isAlive.id = `isAlive-${index}`;
        gameDiv.appendChild(canvas);
        gameDiv.appendChild(score);
        gameDiv.appendChild(isAlive);
        return gameDiv;
    }

    async aiGame() {
        console.log('Starting AI training...');
        
        // Configuration initiale des couches neuronales
        const layerNeural = [6, 4, 3];
        
        for (let generation = 0; generation < this.darwin.generation; generation++) {
            console.log(`Generation ${generation + 1}/${this.darwin.generation}`);
            
            // Créer la population initiale si c'est la première génération
            if (generation === 0) {
                this.darwin.population = Array(this.darwin.nbrAI).fill(null).map(() => new AI(layerNeural));
            }
            
            // Créer et démarrer tous les jeux pour la génération actuelle
            await this.runGeneration();
            
            // Faire évoluer la population pour la prochaine génération
            if (generation < this.darwin.generation - 1) {
                this.darwin.evolve(layerNeural);
            }
        }
    }

    async runGeneration() {
        this.controllers = [];
        this.mainCanvas.style.display = 'none';
        this.canvasGrid.innerHTML = '';

        // Créer une instance de jeu pour chaque AI
        for (let i = 0; i < this.darwin.nbrAI; i++) {
            const gameInstance = this.createGameInstance(i);
            this.canvasGrid.appendChild(gameInstance);
            
            const model = new Model("ai");
            model.ai = this.darwin.population[i];
            const controller = new Controller(model, new View("ai", i), "ai");
            this.controllers.push(controller);
        }

        // Attendre que tous les AIs aient terminé
        return new Promise(resolve => {
            const checkAllDead = setInterval(() => {
                const allDead = this.controllers.every(controller => !controller._model.isAlive);
                if (allDead) {
                    clearInterval(checkAllDead);
                    // Mettre à jour la population avec les scores
                    this.darwin.population = this.controllers.map(controller => controller._model.ai);
                    resolve();
                }
            }, 100);
        });
    }

    playerGame() {
        let gameType = "player";
        this.mainCanvas.style.display = 'block';
        this.canvasGrid.innerHTML = '';
        const app = new Controller(new Model(gameType), new View(gameType, 0), gameType);
        this.controllers.push(app);
        app.Update();
    }
}

class Controller {
    constructor(model, view, type) {
        this._model = model;
        this._view = view;
        this._type = type;

        this._startTime = Date.now();
        this._lag = 0;
        this._fps = 60; // Frame rate.
        this._frameDuration = 1000 / this._fps; // Avec 60 frame par seconde, la frame va durer 16.7ms.

        this._model.BindDisplay(this.Display.bind(this));
        this._model.BindGameOver(this.GameOver.bind(this));
        this._view.BindSetDirection(this.SetDirection.bind(this));

        this.Update();
    }

    Display(position, tiles, score, nearestTiles, isAlive) {
        this._view.Display(position, tiles, score, nearestTiles, isAlive);
    }

    GameOver() {
        if ("player" === this._type) {
            this._view.GameOver(this._model.score);
        }
    }

    SetDirection(newDirection) {
        this._model.direction = newDirection;
    }

    Update() {
        let currentTime = Date.now();
        let deltaTime = currentTime - this._startTime;

        this._lag += deltaTime;
        this._startTime = currentTime;

        while (this._lag >= this._frameDuration) {
            this._model.Move(this._fps, this._view._canvas);
            this._lag -= this._frameDuration;
        }

        requestAnimationFrame(this.Update.bind(this));
    }
}