class Tile {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.type = type
        this.direction = 1
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        console.log(this.type);
        switch (type) {
            case "move":
                this.image.src = "../assets/tuilequibouge.png";
                break;
            case "fragile":
                this.image.src = "../assets/tuilequitombe.png";
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
        if(this.x <= 0 || this.x + 50 >= canvas.width){
            this.direction = - this.direction;
        }
    }

    move(speed){
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

        // Ajouter des plateformes initiales
        for (let i = 0; i < 6; i++) {
            this.addTile(
                Math.random() * 200, // Position aléatoire
                350 - i * 70, // Espacement vertical des plateformes
                "basic"
            );
        }
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
        if (this.position.x + 40 >= canvas.width && this.direction === 1) {
            this.position.x = 0;
        }
        if (this.position.x <= 0 && this.direction === -1) {
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

    generateNewTiles(canvas) {
        if (this.tiles.length < 10) {
            const highestTileY = this.tiles.reduce((min, tile) => Math.min(min, tile.y), Infinity);
            let x = Math.random() * (canvas.width - this._widthCell);
            let y = highestTileY - 70; // Espacement au-dessus de la tuile la plus haute
            let type = this.getType();
            this.addTile(x, y, type);
        }
    }

    getType() {
        let scoreRatio = this.score / 10000; // Normalise entre 0 et 1
    
        // Probabilités ajustées en fonction du score
        let prob1 = Math.max(0.5 - scoreRatio * 0.5, 0);  // Diminue avec le score
        let prob2 = 0.3 + scoreRatio * 0.3;               // Augmente avec le score
        let prob3 = 0.2 + scoreRatio * 0.2;               // Augmente aussi
    
        let rand = Math.random(); // Nombre entre 0 et 1
    
        if (rand < prob1) return Model.TYPE[0];  // Plus probable au début
        if (rand < prob1 + prob2) return Model.TYPE[1]; // Devient plus fréquent avec le score
        return Model.TYPE[2];  // Plus fréquent avec un score élevé
    }

    Move(fps, canvas) {
        this._gravitySpeed += Model.GRAVITY;
        let distance = this._gravitySpeed / fps;

        // Gérer la gravité et le scrolling des plateformes
        if (this._position.y <= canvas.height / 2 && this._gravitySpeed < 0) {
            this.score += Math.abs(distance) * 5;   // To have a positive score
            this.tiles.forEach((tile) => (tile.y -= distance));
        } else {
            this._position.y += distance;
        }
        this.tiles.forEach(function(tuile){
            if (tuile.type === "move"){
                tuile.checkCollisions(canvas);
                tuile.move((Model.SPEED / fps));
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
        this.generateNewTiles(canvas);
        this.b_Display(this._position, this.tiles, this.score);
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
            }
        }
    }
}
