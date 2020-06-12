/**
 * Wrapper for a raw socket-io client that promisifies all socket-io messages.
 */
import events from 'events';

/**
 * Assumptions
 * The client will only respond to server commands.
 */

export default class ClientHandler {
  constructor(client) {
    this.RESPONSE_TIMEOUT = 400;
    this.socket = client;
    this.id = client.id;
    this.socket.on('response', this.onResponse.bind(this));
    this.socket.on('disconnect', this.onDisconnect.bind(this));
    this.queue = [];
    console.log(`${this.id} connected`);
  }

  onResponse(res) {
    console.log(`${this.id} response: ${JSON.stringify(res)}`);
    // Remove the first element of the queue and resolve the promise with the
    // received response.
    if (this.queue.length > 0) {
      const emitter = this.queue.shift();
      console.log(emitter);
      emitter.emit('resolve', res);
    }
  }

  onDisconnect() {
    console.log(`${this.id} disconnected`);
    // Reject all promises waiting for a response. Nothing will be received since
    // client has disconnected.
    this.queue.forEach((emitter) => emitter.emit('reject', 'NO_CONNECTION'));
    this.queue = [];
  }

  sendCommand(command) {
    if (this.socket.connected) {
      // Create a promise that can be resolved when a message is received.
      // The promise listens for resolve and reject events triggered by the
      // onResponse or onDisconnect methods.
      let evt = new events.EventEmitter();
      const responsePromise = new Promise((resolve, reject) => {
        // The promise has a timeout of RESPONSE_TIMEOUT.
        const id = setTimeout(() => {
          // Must remove queued element!!!!!!!!

          evt.removeAllListeners();
          evt = null;

          reject(new Error('TIMEOUT'));
        }, this.RESPONSE_TIMEOUT);
        evt.once('resolve', (msg) => {
          evt.removeAllListeners();
          // evt = null;
          clearTimeout(id);
          resolve(msg);
        });
        evt.once('reject', (err) => {
          evt.removeAllListeners();
          // evt = null;
          clearTimeout(id);
          reject(err);
        });
      });
      // The function to reject or resolve the promise via an event is pushed.
      this.queue.push(evt);

      // Command is sent at the end just to be sure listeners are up.
      console.log(`${this.id} Sending: ${command}`);
      this.socket.emit('command', command);
      return responsePromise;
    }
    return new Error('NO_CONNECTION');
  }
}
