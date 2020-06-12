// Driver

import IO from 'socket.io';
import MettlerToledoScale from './MettlerToledoScale.js';

const socket = IO();

socket.on('connection', async (client) => {
  const scale = new MettlerToledoScale(client);
  try {
    await scale.tare();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
    await scale.getStableWeightValue();
  } catch (err) {
    console.log('woops', err);
  }
});

socket.listen(3000);

socket.httpServer.on('listening', () => {
  const { port } = socket.httpServer.address();
  console.log('listening on port', port);
});

function exit(signal) {
  socket.close(() => {
    console.log('Closed server.');
    process.exit(signal === 'ERR' ? 1 : 0);
  });
}

process.on('SIGINT', exit);
process.on('SIGUSR2', exit);
process.on('uncaughtException', (e) => {
  console.error(e);
  exit('ERR');
});
