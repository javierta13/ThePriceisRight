var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io'),
    io = io.listen(server),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient;

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//directory where files all lie in
app.use('/', express.static(__dirname + '/'));

// home page
app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});









var users = {};
var userPlaying = {};
var numPlayers = 0;
var roundStarted = false;
var picked = "";
var x = 0;

/* http://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object/15106541 */
function pickRandomProperty() {
    var result;
    var count = 0;
    for (var prop in users)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}

// Socket.io 
io.on('connection', function(socket){
 
    socket.on("join", function(username, callback){
        users[socket.id] = username;
        console.log(users[socket.id] + ' has connected ' + socket.id);

        numPlayers += 1;

        if(roundStarted === false)
        {
            if(numPlayers >= 6)
            {

                roundStarted = true;

                for (i = 0; i < 5; i++) //pick 5 random users
                {
                    var already_picked = true;
                    

                    while(already_picked === true)
                    {
                        var broke = false;
                        picked = pickRandomProperty();
                        for(var k in userPlaying)
                        {                        
                            if(userPlaying.hasOwnProperty(k))
                            {
                                if(userPlaying[k] === picked)
                                {
                                    broke = true;
                                    break;
                                }
                            }
                        }
                        if(broke === false)
                        {
                            already_picked = false;
                            userPlaying[x] = picked;
                        }
                    }
                    console.log("picked: " + users[picked]);
                    userPlaying[x] = picked;
                    x += 1;
                }       
                for (var key in users) 
                {
                    var playing = false;
                    if (users.hasOwnProperty(key)) 
                    {
                        for(var key2 in userPlaying)
                        {

                            if(userPlaying.hasOwnProperty(key2))
                            {

                                if(key === userPlaying[key2])
                                {
                                    playing = true;
                                    io.to(key).emit("playing", users, userPlaying);
                                }
                            }
                        }
                    }
                    if(playing === false)
                    {
                        io.to(key).emit("spectating", users, userPlaying);
                    }
                }
            }
            else
            {
                socket.emit("waiting-room");
            }                
        }
        else
        {
            socket.emit("spectating", users, userPlaying);
        }
    });


    socket.on("disconnect", function(){
        console.log(users[socket.id] + " has left the server.");
        //io.emit("update-users", users[socket.id]);
        delete users[socket.id];
        //io.emit("update-people", users);
    });

});

// Express and Socket.io both listening on port 3000
server.listen(3000, function(){
  console.log('listening on *:3000');
});



console.log("server is now listening");
