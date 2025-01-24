class View {
    
    constructor() {
        this._widthCell = 50;
        this._heightCell = 12;
        this._canvas = document.getElementById('my_canvas');
        this.ctx = this._canvas.getContext('2d');
        this._hold_right = false;
        this._hold_left = false;
        
        this.player = { x: 50, y: 50 }; // Position initiale du joueur
        this.score = 0;
        this.scoreToTriggerBanner = 10000;
        this.bannerShown = false;
        this.Events();
    }

    BindSetDirection(callback) {
        this.b_SetDirection = callback;
    }

    Events() {
        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') {
                switch (evt.key) {
                    case 'ArrowLeft': // Move left.
                        this._hold_left = true;
                        this.b_SetDirection(-1);
                        break;
                    case 'ArrowRight': // Move right.
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

    Display(position, tiles, score) {
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
        const DOODLE_IMAGE = new Image();
        DOODLE_IMAGE.src = '../assets/lik-left@2x.png';
        this.ctx.drawImage(DOODLE_IMAGE, this.player.x, this.player.y, 40, 40);

        let scoreDisplay = document.getElementById('score');
        scoreDisplay.textContent = `Score: ${Math.floor(this.score)}`;

        if (!this.bannerShown && Math.floor(this.score) >= this.scoreToTriggerBanner) {
            const bannerPositionX = this._canvas.width / 2 - 150;

            this.ShowSuccessBanner(bannerPositionX);
        }
    }

    ShowSuccessBanner(positionX) {
        const banner = document.getElementById('success-banner');
        const bannerImage = banner.querySelector('img');
        
        // Affichage de la banderole progressivement
        if (banner.style.display === 'none') {
            banner.style.display = 'block';
            banner.style.transition = 'left 0.5s ease';  // Transition pour un affichage progressif
            banner.style.left = `${positionX}px`;  // Placer la bannière à la position calculée
        }
        
        // S'assurer que la bannière ne s'affiche qu'une seule fois
        this.bannerShown = true;
    }

    GameOver(score) {
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreDisplay = document.getElementById('final-score');
        const restartButton = document.getElementById('restart-btn');
    
        // Afficher l'écran de Game Over
        gameOverScreen.style.display = 'block';
    
        // Afficher le score final
        finalScoreDisplay.textContent = `Votre score final est : ${Math.floor(score)}`;
    
        // Ajouter un événement pour redémarrer le jeu
        restartButton.addEventListener('click', () => {
            location.reload(); // Recharger la page pour recommencer
        });
    }
}
