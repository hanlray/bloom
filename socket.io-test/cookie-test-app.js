var koa      = require('koa')
//var cookieParser = require('cookie-parser')
 
var app = koa()
//app.use(cookieParser())

//var http = require('http').Server(app);

app.use(function *(next) {
  // check if client sent cookie
  var cookie = this.cookies.cokkieName;
  if (cookie === undefined)
  {
    // no: set a new cookie
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    this.cookie('cokkieName',randomNumber, { maxAge: 900000, httpOnly: true });
  }

  next(); // <-- important!
});

var router = require('koa-router')();
router.get('/', function *(next){
  this.sendFile('cookie-test-index.html');
});

router.get('/test', function *(next){
  getSocket();
  this.body = "";
});
app.use(router.routes()).use(router.allowedMethods());

var server = app.listen(3000, function(){
  console.log('listening on *:3000');
});
var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('connected');
  console.log('a user connected');
  for(var i in io.sockets.connected) {
    var socket = io.sockets.connected[i].request.headers.cookie;
    console.log(socket);//result is : io=pYb2vzAd8wWWKb......
  }
});

function getSocket() {
  for(var i in io.sockets.connected) {
    var socket = io.sockets.connected[i].request.headers.cookie;
    console.log(socket);//result is : io=pYb2vzAd8wWWKb......
  }
}