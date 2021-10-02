
(function () {

    WinJS.UI.processAll().then(function () {
      var socket, serverGame;
      var username, playerColor;
      var game, board;
      var usersOnline = [];
      var myGames = [];
      socket = io();
           
      //////////////////////////////
      // Socket.io handlers
      ////////////////////////////// 
      
      socket.on('login', function(msg) {

            myGames = msg.games;
            updateGamesList();
      });

      
      socket.on('gameremove', function(msg) {
            
      });
                  
      socket.on('joingame', function(msg) {
        console.log("joined as game id: " + msg.game.id );   
        playerColor = msg.color;
        initGame(msg);
        
        $('#page-lobby').hide();
        $('#page-game').show();
      });
        
      socket.on('move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
           game.move(msg.move);
           board.position(game.fen());
            var dataSource = $('#movelist')[0].winControl.itemDataSource;
            dataSource.beginEdits();
            dataSource.insertAtEnd("dfd", msg.move);
            dataSource.endEdits();
        }
      });

        socket.on('logout', function (msg) {

        });
        //////////////////////////////
      // Menus
      ////////////////////////////// 
      $('#login').on('click', function() {
        username = $('#username').val();
        
        if (username.length > 0) {
            $('#userLabel').text(username);
            socket.emit('login', username);
            
            $('#page-login').hide();
            $('#page-lobby').show();
        } 
      });
      
      $('#game-back').on('click', function() {
        socket.emit('login', username);
        
        $('#page-game').hide();
        $('#page-lobby').show();
      });
      
      $('#game-resign').on('click', function() {
        socket.emit('resign', {userId: username, gameId: serverGame.id});
        
        $('#page-game').hide();
        $('#page-lobby').show();
      });


    $('#movelist').on('iteminvoked', function(eventInfo) {
        console.log(eventInfo);
    });


      
      var updateGamesList = function() {
        document.getElementById('gamesList').innerHTML = '';
        $('#gamesList').append($('<button>')
                        .text('*new game')
                        .on('click', function() {
                          socket.emit('newGame',  game);
                        }));
        myGames.forEach(function(game) {
          $('#gamesList').append($('<button>')
                        .text('#'+ game)
                        .on('click', function() {
                          socket.emit('resumegame',  game);
                        }));
        });
      };

           
      //////////////////////////////
      // Chess Game
      ////////////////////////////// 
      
      var initGame = function (serverGameState) {
        serverGame = serverGameState.game; 
          console.log(serverGameState)
          var cfg = {
            draggable: true,
            showNotation: false,
            orientation: playerColor,
            position: serverGameState.fen,// serverGame.board ? serverGame.board : 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
          };
               
          game = new Chess(serverGameState.fen);//serverGame.board ? new Chess(serverGame.board) : new Chess();
          board = new ChessBoard('game-board', cfg);
      }
       
      // do not pick up pieces if the game is over
      // only pick up pieces for the side to move
      var onDragStart = function(source, piece, position, orientation) {

        if (game.game_over() === true ||
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
            (game.turn() !== playerColor[0])) {
          return false;
        }
      };  
      
     function checkValidMove(move) {
            var validMoves = game.moves({square: move.from, verbose: true});
        for(var i in validMoves) {
            if(validMoves[i].to == move.to) {
                return true;
            }
        }
         return false;
     }
      
      var onDrop = function(source, target) {
        // see if the move is legal
        var move = {
            color: playerColor[0],
            from: source,
            to: target
        }
        if(checkValidMove(move)) {
            socket.emit('move', {move: move, gameId: serverGame.id});
        }
      };
      
      // update the board position after the piece snap 
      // for castling, en passant, pawn promotion
      var onSnapEnd = function() {
        board.position(game.fen());
      };
    });
})();

