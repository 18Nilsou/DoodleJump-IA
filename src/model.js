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

    constructor() {
        this.tiles = [];
        this._direction = 0;
        this._gravitySpeed = 0;
        this._position = { x: 100, y: 300 }; // Position de départ
        this.score = 0;

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

    addTile(x, y, type) {
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

    Move(fps, canvas, type) {
        if (this.score >= 10000) { // Stop the game
            return;
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
            this.b_GameOver();
            return;
        }

        this.removeOldTiles(canvas);

        if (!this._finishLineGenerated) {   // Generate new tiles until the finish line
            this.generateNewTiles(canvas, this.score);
        }

        let nearestTiles = null;
        if ("ai" === type) {
            nearestTiles = this._getNearestTiles(canvas);
        }

        this.b_Display(this._position, this.tiles, this.score, nearestTiles);
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
        return distances.slice(0, 4).map((item) => item.tile);
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
}
