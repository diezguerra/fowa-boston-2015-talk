var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var _ = require('lodash');

// Global timestamp and HoF
var timer = null;
var top10 = [];

var now = function now() {
  return new Date().getTime();
}

var newTimer = function newTimer(socket, reset) {

  // If no timer, reset, or time is up, create a new timestamp
  if(!timer || reset || now() - timer > 60 * 1000) {
    timer = now();
  }

  // Notify...

  // Only to the client that sent the event
  //socket.emit('timer', {timer: timer, ranking: top10});

  // To all the clients except the one that sent the event
  //socket.broadcast.emit('timer', {timer: timer, ranking: top10});

  // To all the clients full stop.
  io.emit('timer', {timer: timer, ranking: top10, clientsCount: io.engine.clientsCount});

}

io.on('connection', function(socket){
  console.log("Client connected");

  // Triggers a notify every time someone connects, so they get the state and
  // everyone else gets the updated clientsCount
  newTimer(socket);

  socket.on('click', function(data){

    // On click, add to hall of fame if within time
    if(now() - timer < 60 * 1000) {
      top10.push({player: data.player, record: (60 - (now() - timer) / 1000).toFixed(1)});
      console.log("Adding new top10!", top10[top10.length - 1]);
      top10 = _.take(_.sortByOrder(top10, ['record'], ['asc'], _.values), 10)
    }

    // Always reset counter after a click
    newTimer(socket, true);
  });
});


// We use express to send down static files...
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/fowabutton.css', function (req, res) {
  res.sendFile(__dirname + '/fowabutton.css');
});

// Awake the monster
server.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('FOWA button listening on http://%s:%s', host, port);
});
