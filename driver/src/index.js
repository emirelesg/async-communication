/**
 * Driver Module
 * Capable of controlling multiple devices via Socket.IO.
 */

import IO from 'socket.io';
import cli from './Cli.js';
import MettlerToledoScaleDriver from './MettlerToledoScaleDriver.js';

const socket = IO();

// Contains all connected devices to the driver.
const pool = [];

// On every new connection add the scale to the pool of devices, and say
// hello to it.
socket.on('connection', (client) => {
  const scale = new MettlerToledoScaleDriver(client);
  pool.push(scale);
  scale.display('Hello from Mexico!');
  // Be sure to remove scale from pool when it disconnects.
  client.on('disconnect', () => pool.splice(pool.indexOf(scale), 1));
});

// All devices are controlled via key presses.
// Commands are sent sequentially to all devices. This means that device 1 must respond or
// timeout in order to send a request to device 2, and so on.
// This is done to make logs easier to read. Ideally, Promise.all would be used
// to speed this up.
cli.bindKey('1', 'Tare', () => {
  pool.reduce(
    (lastPromise, client) =>
      lastPromise.then(() => client.tare()).catch((err) => cli.warn(err)),
    Promise.resolve()
  );
});
cli.bindKey('2', 'Get Stable', () => {
  pool.reduce(
    (lastPromise, client) =>
      lastPromise.then(() => client.getStable()).catch((err) => cli.warn(err)),
    Promise.resolve()
  );
});
cli.bindKey('3', 'Get Now', () => {
  pool.reduce(
    (lastPromise, client) =>
      lastPromise.then(() => client.getNow()).catch((err) => cli.warn(err)),
    Promise.resolve()
  );
});
cli.bindKey('4', 'Reset', () => {
  pool.reduce(
    (lastPromise, client) =>
      lastPromise.then(() => client.reset()).catch((err) => cli.warn(err)),
    Promise.resolve()
  );
});

// Catch all exit posix codes and stop server gracefully.
// Also bind q key to exit.
function exit(signal) {
  socket.close(() => {
    cli.log('Stopped server.');
    process.exit(signal === 'ERR' ? 1 : 0);
  });
}
process.on('SIGINT', exit);
process.on('SIGUSR2', exit);
process.on('uncaughtException', (e) => {
  cli.warn(e);
  exit('ERR');
});
cli.bindKey('q', 'Quit', exit);

// Update the status bar with the current ip address and number of devices connected.
setInterval(() => {
  const { address, port } = socket.httpServer.address();
  let status = '';
  status += `Devices Connected: ${pool.length}\t`;
  status += `IP: ${address}${port}`;
  cli.status(status);
}, 100);

// Finally, start the server.
socket.listen(3000);
