import IO from 'socket.io';

const io = IO();

io.on('connection', (client) => {
  client.on('event', (data) => {
    console.log('event', data);
  });
  client.on('disconnect', () => {
    console.log('disconnected');
  });
});
io.listen(3000);
