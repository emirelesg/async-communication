// Hardware

import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Hardware online');
  // socket.emit('response', `hello from ${socket.id}`);
});

socket.on('command', (data) => {
  console.log(`Received data: ${JSON.stringify(data)}`);
  const delay = Math.floor(Math.random() * 500);
  setTimeout(() => {
    console.log(`Sending data ${data}_ACK-${delay}`);
    socket.emit('response', `${data}_ACK-${delay}`);
  }, delay);
});
