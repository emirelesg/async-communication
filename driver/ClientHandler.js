/**
 * Wrapper for a raw socket-io client that promisifies all socket-io messages.
 */
import { EventEmitter } from 'events';

/**
 * Assumptions
 * The client will only respond to server commands.
 */

export default class ClientHandler {
  constructor(client) {
    this.RESPONSE_TIMEOUT = 1000;
    this.socket = client;
    this.id = client.id;
    this.evt = new EventEmitter();
    this.socket.on('response', this.onResponse.bind(this));
    this.socket.on('disconnect', this.onDisconnect.bind(this));
    console.log(`${this.id} Connected`);
  }

  onResponse(res) {
    // Only process response if there are promises listening for a response.
    if (this.evt.listenerCount('resolve') > 0) {
      console.log(`${this.id} Response: ${JSON.stringify(res)}`);
      this.evt.emit('resolve', res);
    }
  }

  onDisconnect() {
    console.log(`${this.id} Disconnected`);
    this.evt.emit('reject', 'NO_CONNECTION');
  }

  sendCommand(command) {
    if (this.socket.connected) {
      // Create a promise that is resolved when a response to the command is received
      // within the timeout configured. Otherwise the promise is rejected.
      // The promise can also be rejected if the client disconnects.
      const { evt } = this;
      const responsePromise = new Promise((resolve, reject) => {
        const id = setTimeout(
          () => evt.emit('reject', 'TIMEOUT'),
          this.RESPONSE_TIMEOUT
        );
        evt.once('resolve', (msg) => {
          evt.removeAllListeners();
          clearTimeout(id);
          resolve(msg);
        });
        evt.once('reject', (err) => {
          evt.removeAllListeners();
          clearTimeout(id);
          reject(err);
        });
      });

      // Command is sent at the end just to be sure listeners inside the promise
      // are up.
      console.log(`${this.id} Sending: ${command}`);
      this.socket.emit('command', command);
      return responsePromise;
    }
    return new Error('NO_CONNECTION');
  }
}
