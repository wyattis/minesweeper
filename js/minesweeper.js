/*global MersenneTwister*/
'use strict';

var twister = new MersenneTwister();

var SS = {PRELOAD: 0, READY: 1, PLAYING: 2, LOST: 3, WON: 4};

var minesweeper = {
    
    settings:{
        mine_count: 50,
        cols: 30,
        rows: 16
    },
    
    timer: undefined,
    status: SS.PRELOAD,
    state_history: [],
    mines: [],
    tiles: [],
    
    
    
    
    /*
     *  Starts the game setup once the settings are finalized
     */
    initialize: function(){
        
        minesweeper.remainingMines = this.settings.mine_count;
        
        minesweeper.load(function(){
            minesweeper.createMines(function(){
                minesweeper.calculateBoard(function(){
                    minesweeper.drawUI(function(){
                        minesweeper.ready();
                    });
                });
            });
        });
    },
    
    
    
    /*
     *  Load the game resources before the game starts
     */
    load: function(cb){

        cb();
    },
    
    
    
    /*
     *  This uses a mersenne-twister algorithm to create n number of mines at 
     *  random positions.
     */
    createMines: function(cb){

        var m =  minesweeper;
        var tile_count = m.settings.cols*m.settings.rows; // Total number of mines

        var mines_created = 0;
        
        // Loop until all of the mines are created.
        // TODO: don't allow the number of mines to exceed a certain ratio maybe 90% ?
        while (mines_created < m.settings.mine_count){
            
            var index = twister.random_int(0, tile_count - 1, true);  // random index
            // Check if the mine already exists. If not add to list of mines
            if(minesweeper.mines.indexOf(index) == -1){
                minesweeper.mines.push(index); 
                mines_created ++;
            }
            
        }
        
        
        cb();
    },
    
    
    
    
    
    /*
     *  Calculates all the values of all of the tiles
     */
    calculateBoard: function(cb){

        var m = minesweeper;
        var cols = m.settings.cols;
        var rows = m.settings.rows;
        
        

        for(var i=0; i < cols*rows; i++){
            
            var tile = {row: x_location(i, cols), col: y_location(i, cols), i:i};
            
            // Check if the index is a mine
            if(m.mines.indexOf(i) >= 0){
                // It is a mine
                tile.val = -1;
            }
            else{
                // It isn't a mine so we count the mines around it
                var to_check = calculateMatrix(i, cols, rows, true);
                var count = numberShared(to_check, m.mines);
                tile.val = count;
            }
            
            minesweeper.tiles[i] = tile;
        }
        
        cb();
    },
    
    
    drawUI: function(cb){
        // TODO: create the stats
        
        var m = minesweeper;
        
        // TODO: create the file menu
        var parent = document.getElementById('menu');
        
        // creates the HUD
        var parent = document.getElementById('stats');
        var div = document.createElement('div');
        div.id = 'remaining-mines';
        parent.appendChild(div);
        
        div = document.createElement('div');
        div.id = 'smiley';
        parent.appendChild(div);
        
        div = document.createElement('div');
        div.id = 'timer';
        parent.appendChild(div);
        

        
        // creates the mines
        parent = document.getElementById('minesweeper');
        
        for(var i=0; i<m.tiles.length; i++){
            
            div = document.createElement('div');
            div.className = 'tile tile-30';
            div.id = 'tile-' + i.toString();
            div.onclick =  function(event){
                event.preventDefault();
                minesweeper.reveal(this);
            };
            div.oncontextmenu = function(event){
                event.preventDefault();
                minesweeper.mark(this);
            };
            parent.appendChild(div);
        }
        
        parent = document.getElementsByClassName('minesweeper-container')[0];
        
        // Creates the popup message div
        div = document.createElement('div');
        div.id = 'popup';
        div.className = 'popup';
        parent.appendChild(div);
        
        cb();
    },
    
    
    /*
     *  Called when the game is ready to start
     */
    ready: function(){

        minesweeper.status = SS.READY;
        
    },
    
    
    /*
     *  Function that is called once the player starts playing
     */
    start: function(){
        
        minesweeper.timer.start();
        minesweeper.status = SS.PLAYING;
        
    },
    
    
    reveal: function(t){
        
        // Start the game if the status is READY
        if(minesweeper.status === SS.READY){
            minesweeper.start();
        }
        
        
        var m = minesweeper;
        
        var tile = m.getTile(t);
        
        if(!tile.clicked && m.status != SS.LOST){
            minesweeper.tiles[tile.i].clicked = true;
            if(tile.val == -1){
                m.explode(t);
            }
            else if(tile.val == 0){
                m.expand(tile);
            }
            else{
                m.makeActive(t, tile.val);
            }
        }


    },
    
    
    /*
     *  Get a tile from the tile array based on the dom id
     */
    getTile: function(dom){
        var index = parseInt(dom.id.replace('tile-', ''), 10);
        return minesweeper.tiles[index];  
    },
    
    
    /*
     *  Set a tile to be active
     */
    makeActive: function(t, text){
        
        var tile = minesweeper.getTile(t);
        
        minesweeper.tiles[tile.i].active = true;
        
        t.classList.toggle('active');
        if(text){
            t.textContent = text;  
        }
        
        t.onclick = null;
        t.oncontextmenu = null;
        
        minesweeper.checkWin();
        
    },
    
    
    
    /*
     *  Creates the spreading effect when a group of empty blocks is clicked
     */
    expand: function(initial_tile){
        
        var discovered = [];
        var s = minesweeper.settings;
        var ts = minesweeper.tiles;
        
        var tile = initial_tile;
        discovered.push(tile);
        var to_check = calculateMatrix(tile.i, s.cols, s.rows, true).map(function(i){return ts[i]});
        while(to_check.length > 0){
            tile = to_check.shift();
            // console.log(tile.i, to_check);
            if(discovered.indexOf(tile) == -1){
                if(tile.val == 0){
                    discovered.push(tile);
                    to_check = to_check.concat(calculateMatrix(tile.i, s.cols, s.rows, true).map(function(i){return ts[i]}));    
                }
                else if(tile.val > 0){
                    discovered.push(tile);
                }
            }
            // console.log(to_check.length);
        }
        
        
        minesweeper.spreadEffect(discovered);
        

    },


    
    
    /*
     *  Creates the spread effect "animation"
     */
    spreadEffect: function(tiles){
                //  The spread effect
        // console.log(tiles);
        var spread_steps = 50; // How many steps to change the tiles
        var spread_time = 200; // Time the that spread should take in ms
        var spread_chunk = Math.floor(tiles.length/spread_steps);  // How many tiles to change at a time
        var spread_delay = Math.floor(spread_time/spread_steps);  // How long to wait before grabbing the next chunk

        var spread_interval = setInterval(function(){
            
            var chunk_size = (tiles.length > spread_chunk && spread_chunk > 0) ? spread_chunk : tiles.length;
            
            for(var i=0; i < chunk_size; i++){
                var t = tiles.shift();
                var div = document.getElementById('tile-' + t.i.toString());
                
                if(t.val == 0){
                    minesweeper.makeActive(div);
                }
                else{
                    minesweeper.makeActive(div, t.val);
                }
            }


            // Exit interval
            if(tiles.length < 1){
                // console.log('cleared interval');
                clearInterval(spread_interval);
            }
            
        }, spread_delay);
    },
    
    
    
    /*
     *  Updates the state of the game
     */
    updateState: function(){
        var mineDiv = document.getElementById('remaining-mines');
        var smiley = document.getElementById('smiley');
        var popup = document.getElementById('popup');
        
        var markedCount = minesweeper.tiles.filter(function(i){return i.marked;}).length;
        mineDiv.textContent = minesweeper.settings.mine_count - markedCount;
        
        if(minesweeper.status == SS.WON){
            smiley.classList.add('won');
            popup.classList.add('show');
            popup.classList.add('won');
            popup.innerHTML = "<p>Congratulations!!! You're the winningest!</p>";
        }
        else if(minesweeper.status == SS.LOST){
            console.log(popup);
            smiley.classList.add('lost');
            popup.classList.add('show');
            popup.classList.add('lost');
            popup.innerHTML = '<p>You Lost!!!</p>';
        }
    },

    
    /*
     *  Called when the game has been lost
     */
    lose: function(){
        minesweeper.timer.stop();
        minesweeper.status = SS.LOST;
        minesweeper.updateState();
    },
    
    
    /*
     *  Reveal all of the mines
     */
    revealMines: function(){
        // TODO: reveal all of the mines
        
    },
    
    
    /*
     *  Called when the game has been won
     */
    win: function(){
        minesweeper.timer.stop();
        minesweeper.status = SS.WON;
        minesweeper.updateState();
    },

    
    /*
     *  Called when a mine explodes
     */
    explode: function(t){
        // TODO: end the game with an explosion!
        console.log(t);
        t.classList.add('active');
        t.classList.add('mine');
        minesweeper.lose();
    },
    
    
    /*
     *  Called when a tile is marked by the player
     */
    mark: function(t){
        // TODO: mark the clicked tile with a flag
        var tile = minesweeper.getTile(t);
        console.log(t.classList);
        t.classList.toggle('marked');
        
        minesweeper.tiles[tile.i].marked = !tile.marked;
        
        minesweeper.updateState();
    },
    
    
    /*
     *  Called to check if the player has won
     */
    checkWin: function(){
        
        var num_checked = minesweeper.tiles.filter(function(i){return i.active;}).length;
        
        if(num_checked == minesweeper.tiles.length - minesweeper.settings.mine_count){
            minesweeper.win();
        }
        
    },
    
    
    /*
     *  Called to update the timer display
     */
    updateTimer: function(timeEllapsed){
        var timer = document.getElementById('timer');
        timer.innerHTML = Math.round(timeEllapsed/1000);
        console.log(timeEllapsed);
    }
    
};

minesweeper.timer = new Timer(1000, minesweeper.updateTimer);


/*
 *  Holds the logic for calculating the number of surrounding mines. Has a series
 *  of if statements to account for the board edges
 */
function calculateMatrix(index, cols, rows, include_diagonals){
    
    include_diagonals = include_diagonals || false;
    
    var x_loc = x_location(index, cols);
    var y_loc = y_location(index, cols);
    
    // Check surrounding locations
    var surrounding_indices = [];
    
    
    // The first two blocks of if statements account for the 4 corners
    if(x_loc == cols - 1){
        // Right edge of board
        if(y_loc == 0){
            // Top right corner
            // console.log('Top Right', x_loc, y_loc);
            surrounding_indices = include_diagonals ? [index - 1, index + cols, index + cols - 1] : [index - 1, index + cols];
            
        }
        else if(y_loc == rows - 1){
            // Bottom right corner
            // console.log('Bottom Right', x_loc, y_loc);
            surrounding_indices = include_diagonals ? [index - 1, index - cols, index - cols - 1] : [index - 1, index - cols];
        }
        else{
            // Somewhere in the middle
            // console.log('Right Edge', x_loc, y_loc);
            surrounding_indices = include_diagonals ? [index - 1, index - cols, index - cols - 1, index + cols, index + cols - 1] : [index - 1, index - cols, index + cols];
        }
    }
    else if(x_loc == 0){
        // Left edge of the board
        if(y_loc == 0){
            // Top left corner
            // console.log('Top Left', x_loc, y_loc);
            surrounding_indices = include_diagonals ? [index + 1, index + cols, index + cols + 1] : [index + 1, index + cols];
        }
        else if(y_loc == rows - 1){
            // Bottom left corner
            // console.log('Bottom Left', x_loc, y_loc);
            surrounding_indices = include_diagonals ? [index + 1, index - cols, index - cols + 1] : [index + 1, index - cols];
        }
        else{
            // somewhere in the middle
            // console.log('Left Edge', x_loc, y_loc);
            surrounding_indices = include_diagonals ? [index + 1, index - cols, index - cols + 1, index + cols, index + cols + 1] : [index + 1, index - cols, index + cols];
        }
    }
    else if(y_loc == rows - 1){
        // Bottom row somewhere in the middel
        // console.log('Bottom Edge', x_loc, y_loc);
        surrounding_indices = include_diagonals ? [index - 1, index + 1, index - cols, index - cols - 1, index - cols + 1] : [index - 1, index + 1, index - cols];
    }
    else if(y_loc == 0){
        // Top row
        // console.log('Top Edge', x_loc, y_loc);
        surrounding_indices = include_diagonals ? [index - 1, index + 1, index + cols, index + cols - 1, index + cols + 1] : [index - 1, index + 1, index + cols];
    }
    else{
        // Somewhere in the middle
        // console.log('Middle', x_loc, y_loc);
        surrounding_indices = include_diagonals ? [index - 1, index + 1, index + cols, index + cols - 1, index + cols + 1, index - cols, index - cols - 1, index - cols + 1] : [index - 1, index + 1, index + cols, index - cols];
    }
    
    return surrounding_indices;

}

function x_location(index, cols){
    return index % cols;
}

function y_location(index, cols){
    return Math.floor(index/cols);
}

function numberShared(a, b) {
    
    var mine_count = 0;
    
    for(var i=0; i<a.length; i++){
        var val = a[i];
        
        if(b.indexOf(val) > -1){
            mine_count ++;
        }
        
    }
    
    return mine_count;
}

// Start the application once the window loads
window.onload = function(){
    
    minesweeper.initialize();
    
};



/*
 *  Timer class
 */

function Timer(interval, interval_callback, duration, finished_callback){
    
    this.duration = duration;
    this.interval = interval;
    this.interval_callback = interval_callback;
    this.finished_callback = finished_callback;
    
}


/*
 *  Updates the timer, decides if it's finished and calls relevant callbacks
 */
Timer.prototype.update = function(){
    if(this.interval_callback){
        
        var timeEllapsed = this.ellapsed();
        
        this.finished = this.duration ? timeEllapsed >= this.duration : false;
        
        if(this.finished){
            
            this.stop();
            
            if(this.finished_callback){
                this.finished_callback(timeEllapsed);
            }
        }
        else{
            this.interval_callback(timeEllapsed);
        }
        
    }
};


/*
 *  Starts the interval
 */
Timer.prototype.start = function(){
    
    this.startTime = new Date();
    var that = this;
    this.windowInterval = setInterval(function(){that.update()}, that.interval);
    
};


/*
 *  Returns the ellapsed time in milliseconds
 */
Timer.prototype.ellapsed = function(){
    
    return new Date() - this.startTime;
    
};


/*
 *  Clears the interval
 */
Timer.prototype.stop = function(){
    
    clearInterval(this.windowInterval);
    
};