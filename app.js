'use strict';
var express = require('express');
var app = express();
app.use(express.static('public'));
app.use(express.static('dashboard'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Game = require('./Game');
var port = process.env.PORT || 3000;

var users = {};
var activeGames = {};
app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/index.html');

});

app.get('/dashboard/', function(req, res) {
 res.sendFile(__dirname + '/dashboard/dashboard.html');
});

io.on('connection', function(socket) {
    console.log('new connection ' + socket);

    socket.on('login', function(userId) {
        console.log(userId + ' joining lobby');
        socket.userId = userId;

        if (!users[userId]) {
            console.log('creating new user');
            users[userId] = {userId: socket.userId, games:{}};
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
                console.log('gameid - ' + gameId);
            });
        }

        socket.emit('login', {users: {},
                              games: Object.keys(activeGames)});

        socket.broadcast.emit('joinlobby', socket.userId);
    });

    socket.on('newGame', function(gameId) {
        var game = new Game(io);
        activeGames[game.id] = game;
        activeGames[game.id].onJoin(socket);
    });

     socket.on('resumegame', function(gameId) {
         console.log('ready to resume game: ' + gameId);
        activeGames[gameId].onJoin(socket);

        console.log('resuming game: ' + gameId);
     });

    socket.on('move', function(msg) {

        activeGames[msg.gameId].onMove(msg);
        console.log(msg);
    });

    socket.on('vote', function(msg) {
        console.log(msg);
    });

    socket.on('disconnect', function(msg) {

      console.log(msg);
        if(activeGames.hasOwnProperty(socket.gameId)) {
            activeGames[socket.gameId].onLogout(socket);

        }
    });
});


function initGame() {
    var game = new Game(io);
    activeGames[game.id] = game;
}
function updateGames() {
    for(var gameId in activeGames) {
        activeGames[gameId].update();
    }
}
function run() {
    //initGame();
    setInterval(updateGames, 3000);
}
run();
http.listen(port, function() {
    console.log('listening on *: ' + port);
});