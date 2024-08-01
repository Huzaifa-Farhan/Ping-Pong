// Enum for directions used in the game
var DIRECTION = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};

// Number of points needed to win each round and the colors for each round
var rounds = [5, 5, 3, 3, 2];
var colors = ['#403F4C', '#E84855', '#E7D481', '#3185FC', '#EFBCD5'];

// Constructor for the Ball object
var Ball = function (incrementedSpeed) {
    this.width = 18;
    this.height = 18;
    this.speed = incrementedSpeed || 4; // Initial speed
    this.reset(); // Set initial position and direction
};

// Reset the ball to the initial position and direction
Ball.prototype.reset = function () {
    this.x = (Pong.canvas.width / 2) - 9;
    this.y = (Pong.canvas.height / 2) - 9;
    this.moveX = DIRECTION.IDLE;
    this.moveY = DIRECTION.IDLE;
};

// Constructor for the Ai (player or AI opponent) object
var Ai = function (side) {
    this.width = 18;
    this.height = 180;
    this.x = side === 'left' ? 150 : Pong.canvas.width - 150; // Set position based on side
    this.y = (Pong.canvas.height / 2) - 35;
    this.score = 0;
    this.move = DIRECTION.IDLE;
    this.speed = 10; // Initial speed
};

// Main game object
var Game = {
    // Initialize the game
    initialize: function () {
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');

        this.canvas.width = 2400;
        this.canvas.height = 2000;

        // Scale canvas for display
        this.canvas.style.width = (this.canvas.width / 2) + 'px';
        this.canvas.style.height = (this.canvas.height / 2) + 'px';

        this.player = new Ai('left'); // Player object
        this.ai = new Ai('right'); // AI opponent object
        this.ball = new Ball(); // Ball object

        this.ai.speed = 4; // Slower AI
        this.running = this.over = false; // Game states
        this.turn = this.ai; // Start turn with AI
        this.timer = this.round = 0;
        this.color = '#e84855';

        this.menu(); // Show start menu
        this.listen(); // Set up event listeners
    },

    // Display end game menu with a message
    endGameMenu: function (text) {
        this.context.font = '45px Courier New';
        this.context.fillStyle = this.color;

        this.context.fillRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 48,
            700,
            100
        );

        this.context.fillStyle = '#ffffff';
        this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 15);

        setTimeout(() => {
            Pong = Object.assign({}, Game);
            Pong.initialize();
        }, 3000);
    },

    // Display the start menu
    menu: function () {
        this.draw();

        this.context.font = '50px Courier New';
        this.context.fillStyle = this.color;

        this.context.fillRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 48,
            700,
            100
        );

        this.context.fillStyle = '#ffffff';
        this.context.fillText('Press any key to begin', this.canvas.width / 2, this.canvas.height / 2 + 15);
    },

    // Update game elements (ball, player, AI)
    update: function () {
        if (!this.over) {
            this.updateBallPosition();
            this.updatePlayerPosition();
            this.updateAiPosition();
            this.checkCollisions();
            this.checkRoundEnd();
        }
    },

    // Update the ball's position
    updateBallPosition: function () {
        if (this.ball.x <= 0) this.resetTurn(this.ai, this.player);
        if (this.ball.x >= this.canvas.width - this.ball.width) this.resetTurn(this.player, this.ai);
        if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
        if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = DIRECTION.UP;

        if (this.turn && this.turnDelayIsOver()) {
            this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
            this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
            this.ball.y = Math.floor(Math.random() * (this.canvas.height - 200)) + 200;
            this.turn = null;
        }

        if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
        else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
        if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
        else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;
    },

    // Update the player's position
    updatePlayerPosition: function () {
        if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
        else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;

        if (this.player.y <= 0) this.player.y = 0;
        else if (this.player.y >= (this.canvas.height - this.player.height)) this.player.y = (this.canvas.height - this.player.height);
    },

    // Update the AI's position
    updateAiPosition: function () {
        if (this.ai.y > this.ball.y - (this.ai.height / 2)) {
            this.ai.y -= this.ai.speed / (this.ball.moveX === DIRECTION.RIGHT ? 1.5 : 4);
        }
        if (this.ai.y < this.ball.y - (this.ai.height / 2)) {
            this.ai.y += this.ai.speed / (this.ball.moveX === DIRECTION.RIGHT ? 1.5 : 4);
        }

        if (this.ai.y >= this.canvas.height - this.ai.height) this.ai.y = this.canvas.height - this.ai.height;
        else if (this.ai.y <= 0) this.ai.y = 0;
    },

    // Check for collisions with paddles
    checkCollisions: function () {
        if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
            if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
                this.ball.x = (this.player.x + this.ball.width);
                this.ball.moveX = DIRECTION.RIGHT;
            }
        }

        if (this.ball.x - this.ball.width <= this.ai.x && this.ball.x >= this.ai.x - this.ai.width) {
            if (this.ball.y <= this.ai.y + this.ai.height && this.ball.y + this.ball.height >= this.ai.y) {
                this.ball.x = (this.ai.x - this.ball.width);
                this.ball.moveX = DIRECTION.LEFT;
            }
        }
    },

    // Check if a round has ended and update the score
    checkRoundEnd: function () {
        if (this.player.score === rounds[this.round]) {
            if (!rounds[this.round + 1]) {
                this.over = true;
                setTimeout(() => { this.endGameMenu('Winner!'); }, 1000);
            } else {
                this.nextRound();
            }
        } else if (this.ai.score === rounds[this.round]) {
            this.over = true;
            setTimeout(() => { this.endGameMenu('Game Over!'); }, 1000);
        }
    },

    // Start the next round
    nextRound: function () {
        this.color = this.generateRoundColor(); // Change the color
        this.player.score = this.ai.score = 0;
        this.player.speed += 0.5;
        this.ai.speed += 1;
        this.ball.speed += 1;
        this.round += 1;
    },

    // Draw all game elements
    draw: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the background
        this.context.fillStyle = this.color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.fillStyle = '#ffffff';

        // Draw paddles and ball
        this.context.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.context.fillRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height);

        if (this.turnDelayIsOver()) {
            this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
        }

        // Draw the dashed line in the middle
        this.context.beginPath();
        this.context.setLineDash([7, 15]);
        this.context.moveTo(this.canvas.width / 2, this.canvas.height - 140);
        this.context.lineTo(this.canvas.width / 2, 140);
        this.context.lineWidth = 10;
        this.context.strokeStyle = '#ffffff';
        this.context.stroke();

        //Draw the dashed border around the entire game stage
        this.context.beginPath();
        this.context.setLineDash([7, 15]);
        this.context.moveTo(20, 20); // Top-left corner
        this.context.lineTo(this.canvas.width-20, 20); // Top-right corner
        this.context.lineTo(this.canvas.width - 20, this.canvas.height-20); // Bottom-right corner
        this.context.lineTo(20, this.canvas.height-20); // Bottom-left corner
        this.context.lineTo(20, 20); // Back to the top-left corner to complete the rectangle
        this.context.lineWidth = 10;
        this.context.strokeStyle = '#ffffff';
        this.context.stroke();


            // Draw the player scores and round information
            this.context.font = '100px Courier New';
            this.context.textAlign = 'center';
            
            // Draw the player score on the left side
            this.context.fillText(this.player.score.toString(), ((this.canvas.width) / 2) - 300, 200);
    
            // Draw the AI score on the right side
            this.context.fillText(this.ai.score.toString(), ((this.canvas.width) / 2) + 300, 200);
    
            // Change the font size for round information
            this.context.font = '40px Courier New';
    
            // Draw the current round number
            this.context.fillText('Round ' + (this.round + 1), (this.canvas.width) / 2, 55);
    
            // Draw the points required to win the round
            this.context.font = '40px Courier';
            this.context.fillText(
                rounds[this.round] ? rounds[this.round] : rounds[this.round - 1],
                this.canvas.width / 2,
                100
            );
        },
    
        // Main game loop function
        loop: function () {
            this.update(); // Update game state
            this.draw();   // Render the game
    
            // Continue the loop if the game is not over
            if (!this.over) requestAnimationFrame(this.loop.bind(this));
        },
    
        // Set up event listeners for keyboard input
        listen: function () {
            document.addEventListener('keydown', (key) => {
                if (!this.running) {
                    this.running = true;
                    window.requestAnimationFrame(this.loop.bind(this));
                }
    
                // Move player up or down based on key pressed
                if (key.keyCode === 38 || key.keyCode === 87) this.player.move = DIRECTION.UP;
                if (key.keyCode === 40 || key.keyCode === 83) this.player.move = DIRECTION.DOWN;
            });
    
            // Stop the player from moving when no key is pressed
            document.addEventListener('keyup', () => { this.player.move = DIRECTION.IDLE; });
        },
    
        // Reset the ball position and set who will start the next turn
        resetTurn: function (victor, loser) {
            this.ball.reset(); // Reset ball position
            this.turn = loser; // Set the player who did not score to start
            this.timer = (new Date()).getTime(); // Reset timer
            victor.score++; // Increment the victor's score
        },
    
        // Check if the delay between turns has passed
        turnDelayIsOver: function () {
            return ((new Date()).getTime() - this.timer >= 1000);
        },
    
        // Generate a new round color that is different from the current one
        generateRoundColor: function () {
            var newColor = colors[Math.floor(Math.random() * colors.length)];
            if (newColor === this.color) return this.generateRoundColor();
            return newColor;
        }
    };
    
    // Initialize the Pong game instance
    var Pong = Object.assign({}, Game);
    Pong.initialize();
    