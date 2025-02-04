class Darwin{

    constructor(){
        this.nbrAI = 56;
        this.population = [];
        this.generation = 0;
        this.bestScore = [];
        this.averageScore = [];
    }

    evolve(layerNeural){

        this.bestScore.push(this.population.sort((a, b) => a.score - b.score)[0].score);
        this.averageScore.push(this.population.reduce((acc, ai) => acc + ai.score, 0) / this.nbrAI);

        //take the best 10% of the population and 5% ramdom (in the best 50%) and make them reproduce
        let parents = this.population.sort((a, b) => a.score - b.score).slice(0, 8);
        let randomAI = this.population.sort((a, b) => a.score - b.score).slice(8, 26);
        for (let i = parents.length; i < this.nbrAI; ++i) {
            parents.push(randomAI[Math.floor(Math.random() * randomAI.length)]);
        }
        let newPopulation = [];

        //everyone reproduce with everyone
        for (let i = 0; i < parents.length; ++i) {
            for (let j = 0; j < parents.length; ++j) {
                let child = new AI(layerNeural);
                for(let k = 0; k < child.matrix.length; ++k){
                    for(let z = 0; z < child.matrix[k].length; ++z){
                        //      node child = (      parent1 node      *   parent1 score  +      parent2 node       * parent2 score   )/ (parent1 score   + parent2 score)
                        child.matrix[k][z] = (parents[i].matrix[k][z] * parents[i].score + parents[j].matrix[k][z] * parents[j].score)/(parents[i].score + parents[j].score);
                        
                        //mutation
                        if(Math.random() < 0.1){
                            child.matrix[k][z] *= (Math.random() * 0.4) - 0.2;
                        }
                    }
                newPopulation.push(child);
                }
            }
        }
    }

}

class AI {

    constructor(layerNeural){
        this.score = 0;
        //layerNeural should start with 6 and end with 3
        this.layerNeural = layerNeural; // array with the number of neurons per layer, e.g., this.layerNeural[0] = 5, this.layerNeural[1] = 3 -> the first layer will have 5 neurons and the second 3
        this.matrix = this.setDefaultMatrix(); //matrix[n] matrice pour la n eme couche 

    }

    setDefaultMatrix(){
        let listMatrix = [];
        for (let i = 0; i < this.layerNeural.length-1; ++i) {
            let matrix = []
            for (let j = 0; j < this.layerNeural[i+1]; ++j) {
                let line = [];
                for (let z = 0; z < this.layerNeural[i]; ++z) {
                    line[z] = Math.random();
                }
                matrix[j] = line;
            }
            listMatrix[i] = matrix;
        }
        return listMatrix;
    }

    activateFunction(biasVector){
        for (let j = 0; j < biasVector.length; ++j) {
            biasVector[j] = biasVector[j] > 0 ? biasVector[j] : 0;
        } 
        return biasVector;
    }

    forward(vector, matrix, nbrNeural){

        let newVector = new Array(nbrNeural).fill(0);
       
        for (let j = 0; j < nbrNeural; ++j) {
            for (let i = 0; i < vector.length; ++i) {
                newVector[j] += vector[j] * matrix[j][i];
            }
        }
        return  newVector;
    }

    learn(vector){
        for (let i = 0; i < this.layerNeural.length - 1; ++i) {
            vector = this.forward(vector, this.matrix[i], this.layerNeural[i+1]);
            vector = this.activateFunction(vector);
        }
        return vector;
    }

    // Si 0 = bouge pas / 1 = gauche / 2 = droite
    choose(vector){
        let index = 0;
        for (let i = 0; i < vector.length; ++i) {
            if(vector[index] < vector[i]){
                index = i;
            }
        }
        return index;
    }
    
}

class Tile {

    constructor(x, y, width, height, type) {
        this.x = x;
        this.type = type
        this.direction = 1
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();

        switch (type) {
            case "move":
                this.image.src = "../assets/tuilequibouge.png";
                break;
            case "fragile":
                this.image.src = "../assets/tuilequitombe.png";
                this.touch = false;
                break;
            case "finish":
                this.image.src = "../assets/finish-tile.png";
                this.touch = false;
                break;
            default:
                this.image.src = "../assets/tuile.png";
                break;
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    checkCollisions(canvas) {
        if (this.x <= 0 || this.x + 50 >= canvas.width) {
            this.direction = - this.direction;
        }
    }

    move(speed) {
        this.x += this.direction * speed;
    }

}

class Model {

    static GRAVITY = 20;
    static JUMP_FORCE = 500;
    static SPEED = 200;
    static TYPE = ["basic", "move", "fragile"]
    static TIMEOUT_SECONDS = 10000; // Stop the game when the ai do not move for 10s

    constructor(gameType) {
        this.tiles = [];
        this._direction = 0;
        this._gravitySpeed = 0;
        this._position = { x: 100, y: 300 }; // Position de départ
        this.score = 0;
        this.gameType = gameType;
        this.timeoutID = undefined;
        this.isAlive = true;

        this.ai = new AI([6,4,3]);

        this._widthCell = 50; // Largeur des plateformes
        this._heightCell = 12; // Hauteur des plateformes

        this._finishLineGenerated = false;

        // Ajouter des plateformes initiales
        for (let i = 0; i < 6; i++) {
            this.addTile(
                Math.random() * 200, // Position aléatoire
                350 - i * 70, // Espacement vertical des plateformes
                "basic"
            );
        }
        this.addTile(this._position.x, this._position.y + 70, Model.TYPE[0])

        this._resetTimeout();
    }

    get position() {
        return this._position;
    }

    get direction() {
        return this._direction;
    }

    set direction(value) {
        this._direction = value;
    }

    BindDisplay(callback) {
        this.b_Display = callback;
    }

    BindGameOver(callback) {
        this.b_GameOver = callback;
    }

    checkBorder(canvas) {
        if (this.position.x - 40 >= canvas.width && this.direction === 1) {
            this.position.x = 0;
        }
        if (this.position.x + 40 <= 0 && this.direction === -1) {
            this.position.x = canvas.width - 40;
        }
    }

    checkGameOver(canvas) {
        return this.position.y >= canvas.height;
    }

    removeOldTiles(canvas) {
        this.tiles = this.tiles.filter((tile) => tile.y < canvas.height);
    }

    addTile(x, y, type, gameType) {
        const tile = new Tile(x, y, this._widthCell, this._heightCell, type);
        this.tiles.push(tile);
    }

    getType(score) {
        const rand = Math.random(); // Génère un nombre entre 0 et 1

        if (score < 3000) {
            return rand < 0.9 ? Model.TYPE[0] : (rand < 0.95 ? Model.TYPE[1] : Model.TYPE[2]); // 90% type[0], 5% type[1], 5% type[2]
        } else if (score < 5000) {
            return rand < 0.6 ? Model.TYPE[0] : (rand < 0.8 ? Model.TYPE[1] : Model.TYPE[2]); // 60% type[0], 20% type[1], 20% type[2]
        } else if (score < 7000) {
            return rand < 0.33 ? Model.TYPE[0] : (rand < 0.66 ? Model.TYPE[1] : Model.TYPE[2]); // 33% pour chaque type
        } else {
            return rand < 0.05 ? Model.TYPE[0] : (rand < 0.5 ? Model.TYPE[1] : Model.TYPE[2]); // 5% type[0], 45% type[1], 50% type[2]
        }
    }

    generateNewTiles(canvas, score) {
        // Diminuer le nombre de tuiles au fur et à mesure que le score augmente
        let maxTiles = Math.max(1, 10 - Math.floor(score / 1000)); // Ex: 10 tuiles au début, 1 à la fin

        if (this.tiles.length < maxTiles + 10) {
            const highestTileY = this.tiles.reduce((min, tile) => Math.min(min, tile.y), Infinity);
            let x = Math.random() * (canvas.width - this._widthCell);
            let y = highestTileY - (30 + Math.random() * 70); // Espacement aléatoire entre -30 et -100
            let type = this.getType(score);
            this.addTile(x, y, type);
        }
    }

    generateFinishLine(canvas) {
        const yPosition = -(canvas.height / 6); // Position at the top of the canvas

        const tile = new Tile(0, yPosition, canvas.width, canvas.height / 6, "finish");
        this.tiles.push(tile);
    }

    Move(fps, canvas) {
        
        if(this.score >= 10000) {
            this.isAlive = false;
        }

        if (!this.isAlive) {
            this.b_Display(this._position, this.tiles, this.score, null, this.isAlive);
            this.ai.score = this.score;    
            return;
        }
        
        if("ai" === this.gameType){
            this.moveAI();
        }
        

        if (this.score >= 9750 && !this._finishLineGenerated) { // Generate finish line and remove tiles above it
            this.generateFinishLine(canvas);
            this._finishLineGenerated = true;

            const finishLineY = this.tiles.find(tile => tile.type === "finish").y;
            this.tiles = this.tiles.filter(tile =>
                tile.type === "finish" || tile.y >= (finishLineY + 50)
            );
        }

        this._gravitySpeed += Model.GRAVITY;
        let distance = this._gravitySpeed / fps;

        // Gérer la gravité et le scrolling des plateformes
        if (this._position.y <= canvas.height / 2 && this._gravitySpeed < 0) {
            this.score += Math.abs(distance);   // To have a positive score
            this._resetTimeout(); // Reset the timeout when the doodle get score
            this.tiles.forEach((tile) => (tile.y -= distance));
        } else {
            this._position.y += distance;
        }

        this.tiles.forEach(function (tile) {
            if (tile.type === "move") {
                tile.checkCollisions(canvas);
                tile.move((Model.SPEED / fps));
            }
            if (tile.type === "fragile") {

                if (tile.touch === true) {
                    tile.y += distance * 1.25 + 10
                }
            }
        });

        // Mouvement horizontal
        this._position.x += this._direction * (Model.SPEED / fps);

        this.checkCollisions();

        this.checkBorder(canvas);

        if (this.checkGameOver(canvas)) {
            this.isAlive = false;
            this.b_GameOver();
            return;
        }

        this.removeOldTiles(canvas);

        if (!this._finishLineGenerated) {   // Generate new tiles until the finish line
            this.generateNewTiles(canvas, this.score);
        }

        let nearestTiles = null;
        if ("ai" === this.gameType) {
            nearestTiles = this._getNearestTiles(canvas);
        }

        this.b_Display(this._position, this.tiles, this.score, nearestTiles, this.isAlive);
    }

    _resetTimeout() {
        if("ai" !== this.gameType) { return; }
        
        if (typeof this.timeoutID === "number") {
            clearTimeout(this.timeoutID);
        }
    
        this.timeoutID = setTimeout(
            () => {
                console.log("Game Over due to timeout");
                this.isAlive = false;
            },
            Model.TIMEOUT_SECONDS
        );    
    }

    _getNearestTiles() {
        const distances = this.tiles.map((tile) => {
            // distance between the middle of the doodle and the middle of the tile
            const dx = this._position.x - (tile.x + tile.width / 2);
            const dy = this._position.y - (tile.y + tile.height / 2);
            return {
                tile: tile,
                distance: Math.sqrt(dx * dx + dy * dy),
            };
        });

        // Sort the tiles lists with their distance
        distances.sort((a, b) => a.distance - b.distance);

        // Get the 4 nearest tiles
        return distances.slice(0, 4);
    }

    _Jump() {
        this._gravitySpeed = -Model.JUMP_FORCE;
    }

    checkCollisions() {
        for (let tile of this.tiles) {
            if (
                this._gravitySpeed > 0 && // Le joueur tombe
                this._position.x + 40 > tile.x && // Bord gauche du joueur dépasse le bord gauche de la tuile
                this._position.x < tile.x + tile.width && // Bord droit du joueur ne dépasse pas le bord droit de la tuile
                this._position.y + 40 >= tile.y && // Le bas du joueur touche ou dépasse le haut de la tuile
                this._position.y + 40 <= tile.y + tile.height + 5 // Tolérance pour éviter des bugs
            ) {
                this._position.y = tile.y - 40; // Ajuster la position du joueur
                this._Jump();
                if (tile.type == "fragile") {
                    tile.touch = true;
                }
            }
        }
    }

    moveAI(){

        let nearestTiles = this._getNearestTiles()
        let vector = this.ai.learn([this.position.x, this.position.y, nearestTiles[0].distance, nearestTiles[1].distance, nearestTiles[2].distance, nearestTiles[3].distance ]);
        let direction = this.ai.choose(vector);
        
        if (direction === 1) {
            this.direction = -1;    
        }else if(direction === 2){
            this.direction = 1;
        }else if(direction === 0){
            this.direction = 0;
        }
    }
}
