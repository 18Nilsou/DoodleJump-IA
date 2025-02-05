class BoardController {
    constructor() {
        this.canvasGrid = document.getElementById('canvas-grid');
        this.controllers = [];
        this.darwin = new Darwin(100, 50000);
        this.chart = null;
    }

    createPlayerInstance() {
        // Reset elements
        const gameOverScreen = document.getElementById('game-over');
        gameOverScreen.style.display = 'none';

        const winScreen = document.getElementById('win-screen');
        winScreen.style.display = 'none';

        // Add player game type elements
        const gameDiv = document.createElement('div');
        gameDiv.className = 'main-game-instance';

        const canvas = document.createElement('canvas');
        canvas.id = 'canvas-0';
        canvas.width = 250;
        canvas.height = 400;
        canvas.className = 'canvas-0';

        const score = document.createElement('p');
        score.textContent = 'Score: 0';
        score.id = 'score-0';

        const isAlive = document.createElement('p');
        isAlive.textContent = 'isAlive: true';
        isAlive.id = 'isAlive-0';

        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'button-container';
        buttonContainer.className = 'button-container';

        const newGameBtn = document.createElement('button');
        newGameBtn.className = 'button';
        newGameBtn.textContent = 'New Game';
        newGameBtn.onclick = () => this.startPlayerGame();

        const trainingBtn = document.createElement('button');
        trainingBtn.className = 'button';
        trainingBtn.textContent = 'Training';
        trainingBtn.onclick = () => this.startAIGame();

        buttonContainer.appendChild(newGameBtn);
        buttonContainer.appendChild(trainingBtn);

        gameDiv.appendChild(score);
        gameDiv.appendChild(isAlive);
        gameDiv.appendChild(canvas);
        gameDiv.appendChild(buttonContainer);

        return gameDiv;
    }

    createAIInstance(index) {
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

    async startAIGame() {
        this.clearGames();

        let chartDiv = document.getElementById('chart_div');
        chartDiv.style.display = 'block';

        let aiButtonContainer = document.getElementById('ai-button-container');
        if (aiButtonContainer === null) {
            const buttonContainer = document.createElement('div');
            buttonContainer.id = 'ai-button-container';
            buttonContainer.className = 'button-container';

            const newGameBtn = document.createElement('button');
            newGameBtn.className = 'button';
            newGameBtn.textContent = 'New Game';
            newGameBtn.onclick = () => this.startPlayerGame();

            const resetBtn = document.createElement('button');
            resetBtn.className = 'button';
            resetBtn.textContent = 'Reset';
            resetBtn.onclick = () => this.startAIGame();

            buttonContainer.appendChild(newGameBtn);
            buttonContainer.appendChild(resetBtn);

            let container = document.getElementById('container');
            container.insertBefore(buttonContainer, container.children[0]);
        } else {
            aiButtonContainer.style.display = 'flex'
        }

        google.charts.load('current', { 'packages': ['corechart'] });
        google.charts.setOnLoadCallback(() => {
            this.updateChart();
        });
        
        const layerNeural = [6,12,15,8,3];
        
        for (let generation = 0; generation < this.darwin.generation; generation++) {            
            if (generation === 0) {
                this.darwin.population = Array(this.darwin.nbrAI).fill(null).map(() => new AI(layerNeural));
            }

            await this.runGeneration();

            if (generation < this.darwin.generation - 1) {
                this.darwin.evolve(layerNeural);
            }
            this.updateChart();
        }
    }

    startPlayerGame() {
        this.clearGames();

        const chartDiv = document.getElementById('chart_div');
        chartDiv.style.display = 'none';

        let aiButtonContainer = document.getElementById('ai-button-container');
        if (aiButtonContainer !== null) {
            aiButtonContainer.style.display = 'none';
        }

        const gameDiv = this.createPlayerInstance();
        this.canvasGrid.appendChild(gameDiv);

        const model = new Model("player");
        const view = new View("player", 0);
        const controller = new Controller(model, view, "player");
        this.controllers.push(controller);
    }

    // Stop all the previous games
    clearGames() {
        this.resetChart();
        this.controllers.forEach(controller => controller.SetIsRunning(false));
        this.controllers = [];
        this.canvasGrid.innerHTML = '';
        const existingGame = document.querySelector('.main-game-instance');
        if (existingGame) {
            existingGame.remove();
        }
    }

    async runGeneration() {
        this.controllers = [];
        this.canvasGrid.innerHTML = '';

        // Créer une instance de jeu pour chaque AI
        for (let i = 0; i < this.darwin.nbrAI; i++) {
            const gameInstance = this.createAIInstance(i);
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

    updateChart() {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Generation');
        data.addColumn('number', 'Best Score');
        data.addColumn('number', 'Average Score');

        // add Data
        for (let i = 0; i < this.darwin.bestScore.length; i++) {
            data.addRow([i, this.darwin.bestScore[i], this.darwin.averageScore[i]]);
        }

        const options = {
            title: 'AI Performance Over Generations',
            curveType: 'function',
            legend: { position: 'bottom' },
            hAxis: {
                title: 'Generation',
                minValue: 0
            },
            vAxis: {
                title: 'Score',
                minValue: 0
            },
            animation: {
                duration: 500,
                easing: 'out'
            }
        };

        if (!this.chart) {
            this.chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        }
        this.chart.draw(data, options);
    }

    resetChart() {
        this.darwin.bestScore = [];
        this.darwin.averageScore = [];
        if (this.chart) {
            const data = new google.visualization.DataTable();
            data.addColumn('number', 'Generation');
            data.addColumn('number', 'Best Score');
            data.addColumn('number', 'Average Score');
    
            const options = {
                title: 'AI Performance Over Generations',
                curveType: 'function',
                legend: { position: 'bottom' },
                hAxis: {
                    title: 'Generation',
                    minValue: 0
                },
                vAxis: {
                    title: 'Score',
                    minValue: 0
                },
                animation: {
                    duration: 500,
                    easing: 'out'
                }
            };
    
            this.chart.draw(data, options);
        }
    }
    
}

class Controller {
    constructor(model, view, type) {
        this._model = model;
        this._view = view;
        this._type = type;
        this._isRunning = true;

        this._startTime = Date.now();
        this._lag = 0;
        this._fps = 60; // Frame rate.
        this._frameDuration = 1000 / this._fps; // Avec 60 frame par seconde, la frame va durer 16.7ms.

        this._model.BindDisplay(this.Display.bind(this));
        this._model.BindGameOver(this.GameOver.bind(this));
        this._view.BindSetDirection(this.SetDirection.bind(this));
        if (type === "player") {
            this._view.BindToggleAI(this.ToggleAI.bind(this));
        }
    
        this.Update();
    }

    ToggleAI() {
        this._model.toggleAI();
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

        while (this._lag >= this._frameDuration && this._isRunning) {
            this._isRunning = this._model.Move(this._fps, this._view._canvas);
            this._lag -= this._frameDuration;
        }

        requestAnimationFrame(this.Update.bind(this));
    }

    SetIsRunning() {
        this._isRunning = false;
    }
}