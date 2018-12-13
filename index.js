var port = 2000;
var playerNames = ["Mary", "Joe", "Peter", "Slinky"];

var WorldEntity = function(x, y, id) {
    var self = {
        x: x,
        y: y,
        id: id,
    };

    return self;
}

var worldEntities = [];

for(var i=0;i<10;i++) {
    worldEntities.push(new WorldEntity(i,i,i))
}

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(port);
console.log("Server started on port "+port)

var Player = function(socketid) {
    var self = {
        x: Math.floor(Math.random() * 500),
        y: Math.floor(Math.random() * 500),
        maxSpeed: 6,
        sid: socketid,
        name: playerNames[Math.floor(Math.random() * playerNames.length)],

        keyUp: false,
        keyDown: false,
        keyLeft: false,
        keyRight: false,
    }

    self.updatePosition = function() {
        if(self.keyLeft)
            self.x -= self.maxSpeed;
        if(self.keyRight)
            self.x += self.maxSpeed;
        if(self.keyUp)
            self.y -= self.maxSpeed;
        if(self.keyDown)
            self.y += self.maxSpeed;
    }

    return self;
}

var SOCKET_LIST = {};
var PLAYER_LIST = {};



var io = require("socket.io")(serv,{});
io.sockets.on("connection", function(socket) {
    console.log(socket.id + " connection from "+socket.handshake.address);

    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;
    SOCKET_LIST[socket.id] = socket;

    console.log("'" + player.name + "' (sid: " + player.sid + ") entered the game!");

    console.log("We now have " + Object.keys(PLAYER_LIST).length + " players online.");

    // SEND INITIAL DATA PACKET
    socket.emit("init", worldEntities);

    // DISCONNECT
    socket.on("disconnect", function() {
        console.log(socket.id + " disconnected.")
        delete PLAYER_LIST[socket.id];
        delete SOCKET_LIST[socket.id];
        console.log("We now have " + Object.keys(PLAYER_LIST).length + " players online.");
    });
    
    // KEYPRESS
    socket.on("keyPress", function(data) {
        console.log("keyPress for player " + player.sid);
        if(data.inputId === 'left')
            player.keyLeft = data.state;
        else if(data.inputId === 'right')
            player.keyRight = data.state;
        else if(data.inputId === 'up')
            player.keyUp = data.state;
        else if(data.inputId === 'down')
            player.keyDown = data.state;
    });

});


// MAIN LOOP!!!!
setInterval(function(){
    var pack = [];
    for(var i in PLAYER_LIST){
        var player = PLAYER_LIST[i];
        player.updatePosition();
        pack.push({
            x: player.x,
            y: player.y,
            sid: player.sid,
            name: player.name,
        });
    }
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000/25);
