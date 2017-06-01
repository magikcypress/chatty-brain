'use strict';

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

const config = require('./config.json');

let port = process.env.PORT || config.port;

// Add class for natural-brain
let BrainChatty = require('./chatty-brain.js');
let brainchatty = new BrainChatty();
// Load natural-brain when launching the application
let learn = brainchatty.learn();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.on('username connect', function(users) {
    io.emit('username connect', users);
    io.emit('get users', users);
  });

  socket.on('get users', function(users) {
    io.emit('get users', users);
  });

  socket.on('username disconnect', function (users) {
    io.emit('username disconnect', users);
    io.emit('get users', users);
  });

  socket.on('chat message', function(msg){
    brainchatty.query(msg)
      .then((out) => {
        if (out.probability === 1) {
          io.emit('chat message', msg);
          let messages = [{bot: true, content: out.response}]
          io.emit('chat message', messages);
          // Save classified
          // brainchatty.save();
        // } else if (out.probability === 0.5) {
        //   io.emit('chat message', msg);
        //   io.emit('chat message', out.response);
        //   brainchatty.save();
        } else {
          io.emit('chat message', msg);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

// listen http server
http.listen(port, function(){
  console.log('listening on *:' + port);
});
