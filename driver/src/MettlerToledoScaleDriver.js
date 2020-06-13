/**
 * Implements the driver to interact with a Mettler Toledo Scale.
 * By using the ClientHandler a command can be sent and a response can be awaited.
 */
import ClientHandler from './ClientHandler.js';

export default class MettlerToledoScaleDriver extends ClientHandler {
  /**
   * Parses a response a Mettler Toledo Scale.
   * It assume the response has the format: IDXX_S_PARAM1_PARAM2\r\n
   * Where:
   * - IDXX is a 4 character unique code.
   * - S is a status character of the IDXX command.
   * - PARAM1 and PARAM2 are optional parameters.
   * @async
   * @param {string} command Un-escaped ascii command to send.
   * @returns {Object} response The parsed response object.
   * @returns {string} response.id String that identifies the type of command.
   * @returns {string} response.status Status of the command.
   * @return {[string]} response.params All aditional parameters provided by the device.
   *
   */
  async send(command) {
    const res = await this.sendCommand(`${command}\r\n`);
    let id = null;
    let status = null;
    let params = [];
    if (res && res !== '') {
      const split = res.trim().split('_');
      if (split.length > 0) {
        [id, status, ...params] = split;
      }
    }
    return {
      id,
      status,
      params
    };
  }

  /**
   * Set the message on the display.
   * @async
   * @param {string} text Text to send.
   * @returns {boolean} True if the command executed successfully.
   */
  async display(text) {
    if (text) {
      const { id, status } = await this.send(`D_${text}`);
      return id === 'D' && status === 'A';
    }
    throw new Error('Missing parameter(s).');
  }

  /**
   * Use the current value as the new zero point.
   * @async
   * @returns {boolean} True if the command executed successfully.
   */
  async tare() {
    const { id, status } = await this.send(`T`);
    return id === 'T' && status === 'S';
  }

  /**
   * Clear tare and current value.
   * @async
   * @returns {boolean} True if the command executed successfully.
   */
  async reset() {
    const { id, status } = await this.send(`R`);
    return id === 'R' && status === 'A';
  }

  /**
   * Gets the inmmediate value of the scale.
   * @async
   * @returns {number|null} If provided by the scale, the value is returned. Otherwise null.
   */
  async getNow() {
    const { id, status, params } = await this.send(`SI`);
    if (id === 'S' && (status === 'S' || status === 'D')) {
      if (params.length > 0) {
        return parseFloat(params[0]);
      }
    }
    return null;
  }

  /**
   * Gets the stable value of the scale.
   * @async
   * @returns {number|null} If provided by the scale, the value is returned. Otherwise null.
   */
  async getStable() {
    const { id, status, params } = await this.send(`S`);
    if (id === 'S' && status === 'S') {
      if (params.length > 0) {
        return parseFloat(params[0]);
      }
    }
    return null;
  }
}
