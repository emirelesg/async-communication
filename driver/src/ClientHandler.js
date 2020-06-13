/**
 * Wrapper for a raw socket-io client that promisifies all socket-io messages.
 */
import { EventEmitter } from 'events';
import cli from './Cli.js';

/**
 * Assumptions
 * The client will only respond to server commands.
 */

export default class ClientHandler {
  constructor(client) {
    // If no response is received after this timeout, an error is thrown.
    this.RESPONSE_TIMEOUT = 1000;
    this.socket = client;
    this.id = client.id;
    this.evt = new EventEmitter();
    this.socket.on('response', this.onResponse.bind(this));
    this.socket.on('disconnect', this.onDisconnect.bind(this));
    cli.log(`${this.id} Connected`);
  }

  /**
   * Send the result to the waiting proimse. If no primses are waiting, then
   * the result is discarded.
   * @param {string} res Response received by SOCKET.IO.
   */
  onResponse(res) {
    if (this.evt.listenerCount('resolve') > 0) {
      cli.in(`${this.id} ${JSON.stringify(res)}`);
      this.evt.emit('resolve', res);
    }
  }

  /**
   * Reject any promise that is waiting for a result. It not done, a timeout error
   * will occurr.
   */
  onDisconnect() {
    cli.warn(`${this.id} Disconnected`);
    if (this.evt.listenerCount('reject') > 0) {
      this.evt.emit('reject', 'NO_CONNECTION');
    }
  }

  /**
   * Sends a command to the client and returns a promise that is resolved on
   * the next message received.
   * @async
   * @param {string} command The command to send. It is not further processed.
   * @returns {Promise<string>} The response of the client.
   */
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
      cli.out(`${this.id} ${JSON.stringify(command)}`);
      this.socket.emit('command', command);
      return responsePromise;
    }
    return new Error('NO_CONNECTION');
  }
}
