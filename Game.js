'use strict';
var Chess = require('./chess').Chess;
const VOTE_STAGE = 2;
const MOVE_STAGE = 1;
const IDLE = 0;
var io = null;
class Game {
    constructor(_io) {
        if(!io) {
            io = _io;
        }
        this.id = Math.floor((Math.random() * 100) + 1);
        this.gameState = IDLE;
        this.moveCandidates = {};
        this.countdown = 5;
        this.whiteNum = 0;
        this.blackNum = 0;
        //this.board = null;
        this.chess = new Chess();
    }

    update() {
        //console.log('game state', this.gameState);
        if(this.gameState == IDLE) {
            return;
        }
        else if(this.gameState == MOVE_STAGE) {
            if(Object.keys(this.moveCandidates).length != 0) {
                this.countdown --;
            }
            if(this.countdown <= 0) {
                this.gameState = VOTE_STAGE;
            }
        }
        else if(this.gameState == VOTE_STAGE) {
            console.log('game make move', this.id);
            var move = this.chooseMove();
            this.chess.move(move.msg.move);
            io.sockets.in(this.id).emit('move', move.msg);
            this.moveCandidates = {};
            this.countdown = 1;
            this.gameState = MOVE_STAGE;
        }

    }

    chooseMove() {
        for(var prop in this.moveCandidates) {
            return this.moveCandidates[prop];
        }
    }

    onMove(msg) {
        if(this.moveCandidates.hasOwnProperty(msg.board)) {
            this.moveCandidates[msg.board].votes ++;
        } else {
            this.moveCandidates[msg.board] = {
                msg: msg,
                votes: 1
            }
        }
        io.sockets.in(this.id).emit('newMove', msg);
    }

    onJoin(socket) {
        //this.board = this.chess.fen();
        var cfg = {game: this};
        cfg.fen=this.chess.fen();
       // console.log(this.board);
        if(this.whiteNum <= this.blackNum) {
            this.whiteNum ++;
            cfg.color= 'white';
        }
        else {
            this.blackNum ++;
            cfg.color= 'black';
        }
        console.log('color', cfg.color);
        socket.join(this.id);
        socket.gameId = this.id;
        socket.playerColor = cfg.color;
        socket.emit('joingame', cfg);
        if(this.gameState == IDLE) {
            this.gameState = MOVE_STAGE;
        }
    }

    onLogout(socket) {
        if(socket.playerColor == 'white') {
            this.whiteNum --;
        }
        else if(socket.playerColor =='black') {
            this.blackNum--;
        }
    }
}
module.exports = Game;