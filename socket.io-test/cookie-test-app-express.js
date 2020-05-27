var express      = require('express')
var cookieParser = require('cookie-parser')
 
var app = express()
//app.use(cookieParser())

var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.cokkieName;
  if (cookie === undefined)
  {
    // no: set a new cookie
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cokkieName',randomNumber, { maxAge: 900000, httpOnly: true });
  }

  next(); // <-- important!
});

app.get('/', function(req, res){
  res.sendfile('cookie-test-index.html');
});

app.get('/test', function(req, res){
  getSocket();
  res.send();
});

io.on('connection', function(socket){
  console.log('connected');
  console.log('a user connected');
  for(var i in io.sockets.connected) {
    var socket = io.sockets.connected[i].request.headers.cookie;
    console.log(socket);//result is : io=pYb2vzAd8wWWKb......
  }
});

http.listen(3001, function(){
  console.log('listening on *:3000');
});

function getSocket() {
  for(var i in io.sockets.connected) {
    var socket = io.sockets.connected[i].request.headers.cookie;
    console.log(socket);//result is : io=pYb2vzAd8wWWKb......
  }
}