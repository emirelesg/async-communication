/**
 * Implements an interface to interact with a Mettler Toledo Scale.
 * By using the ClientHandler a command can be sent and a response can be awaited.
 */
import ClientHandler from './ClientHandler.js';

export default class MettlerToledoScale extends ClientHandler {
  // constructor(client) {
  //   super(client);
  // }

  async tare() {
    const res = await this.sendCommand('TARE');
    console.log(res);
    return true;
  }

  async getStableWeightValue() {
    const res = await this.sendCommand('S');
    console.log(res);
    return true;
  }
}
