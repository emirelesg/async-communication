/**
 * Hardware Module
 * Connects to a driver via Socket.IO and wait for commands.
 * Users can add fake-weights to the scale to simulate that
 * something has changed.
 */

import io from 'socket.io-client';
import cli from './Cli.js';
import MettlerToledoScaleSim from './MettlerToledoScaleSim.js';

// Create a fake scale.
const scale = new MettlerToledoScaleSim();

// Init connection to the driver. It will automatically reconnect if
// the connection is broken. Connection status is also logged.
const socket = io('http://localhost:3000');
socket.on('connect', () => {
  cli.log(`Connection to driver established.`);
});
socket.on('disconnect', () => {
  cli.warn(`Connection to driver lost.`);
});

// Handle new commands sent to the client. A random delay of 0 to 500ms
// is there to simulate any delays that the device could have.
socket.on('command', async (raw) => {
  const response = scale.processCommand(raw);
  if (response && response !== '') {
    setTimeout(
      () => socket.emit('response', `${response}\r\n`),
      Math.trunc(500 * Math.random())
    );
  }
});

// The following are the key bindings that control the weights on the scale.
// The scale must stabilize in order to change the weights.
cli.bindKey('x', 'Randomize', () => {
  if (scale.isStable) {
    cli.log(`Randomizing`);
    scale.setRawVal(Math.floor(Math.random() * 100));
  } else {
    cli.warn(`Wait for scale to stabilize.`);
  }
});
cli.bindKey('a', 'Add 1 g', () => {
  if (scale.isStable) {
    cli.log('Adding +1 g');
    scale.setRawVal(scale.rawVal + 1);
  } else {
    cli.warn(`Wait for scale to stabilize.`);
  }
});
cli.bindKey('r', 'Remove 1 g', () => {
  if (scale.isStable) {
    cli.log('Removing +1 g');
    scale.setRawVal(scale.rawVal - 1 > 0 ? scale.rawVal - 1 : 0);
  } else {
    cli.warn(`Wait for scale to stabilize.`);
  }
});

cli.bindKey('q', 'Quit', () => process.exit(0));

// Update the status bar with the current values of the scale.
setInterval(() => {
  let status = '';
  status += scale.isStable ? `{green-fg}` : `{red-fg}`;
  status += `${scale.getCurrentValue()} ${scale.unit}{/}\t`;
  status += `Tare: ${scale.tareVal}\t`;
  status += socket.connected
    ? `{green-fg}Connected to Driver!{/}\t`
    : `{red-fg}Not Connected to Driver{/}\t`;
  status += `ID: ${socket.id}`;
  cli.status(status);
  cli.screen.render();
}, 100);
