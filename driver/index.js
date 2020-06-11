
const io = require('socket.io')();

io.on('connection', client => {

  client.on('event', data => { console.log('event', data )});
  client.on('disconnect', () => { console.log('disconnected')});
});
io.listen(3000);

var x    = 10;