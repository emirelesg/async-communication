/**
 * Implements a fake Mettler Toledo Scale with a limited command set.
 * Features implemented:
 * - tare
 * - when the weight is changed, it will take 5000ms to stabilize. Random
 *  noise is added to the value during this period.
 * - reset (no command ack response is send to trigger a timeout on the driver)
 */

import cli from './Cli.js';

export default class MettlerToledoScaleSim {
  constructor() {
    // The current message in the display.
    this.display = '';
    // The current value that the user is measuring.
    // It is calculated by rawVal - tareVal.
    this.currentVal = 0;
    // The absolute value of the scale. This can't go negative.
    this.rawVal = 0;
    // The tare value of the scale.
    this.tareVal = 0;
    // State of the scale.
    this.isStable = true;
    // Properties of the measurement.
    this.resolution = 4;
    this.unit = 'g';
    // Time it takes to stabilize in milliseconds.
    this.timeToStabilize = 5000;
    // Loopup list for commands, keys are commands and values functions found in this class.
    this.commandLookup = {
      D: 'doDisplay',
      T: 'doTare',
      TA: 'doTareValue',
      SI: 'doSendWeightInmediate',
      S: 'doSendWeight',
      R: 'doReset'
    };
  }

  /**
   * Processes the command and matches the command to a function using the lookup object
   * commandLookup.
   * @param {string} raw The raw command received.
   * @returns {string|null} The response of the command. Null if the command has no match.
   */
  processCommand(raw) {
    if (raw && raw !== '') {
      cli.in(`${JSON.stringify(raw)}`);
      const split = raw.trim().split('_');
      if (split.length > 0) {
        const [id, ...params] = split;
        if (this.commandLookup[id]) {
          const response = this[this.commandLookup[id]](params);
          cli.out(`${response}`);
          return response;
        }
      }
    }
    return null;
  }

  /**
   * Set the raw value and make it unstable.
   * @param {number} val The new raw value of the scale.
   */
  setRawVal(val) {
    if (val !== this.rawVal) {
      this.rawVal = val;
      this.isStable = false;
      this.simulateNonStability(0);
    }
  }

  /**
   * Called every 10 ms after a raw value is modified. It adds random noise to the raw value
   * until the timeToStabilize has passed.
   * @param {number} elapsedTime The amount of time in milliseconds elapsed since a raw value was changed.
   */
  simulateNonStability(elapsedTime) {
    if (elapsedTime > this.timeToStabilize) this.isStable = true;
    const noise = this.isStable
      ? 0
      : Math.trunc(Math.random() * 10) / 1000 - 1 / 500;
    this.currentVal = this.rawVal - this.tareVal + noise;
    if (!this.isStable) {
      setTimeout(this.simulateNonStability.bind(this, elapsedTime + 10), 10);
    }
  }

  /**
   * Used to format the value for responses. Usually it would have a fixed character length,
   * but to simplify things it just fixes the resolution.
   * @return {string} The current value fixed to the defined resolution.
   */
  getCurrentValue() {
    return this.currentVal.toFixed(this.resolution);
  }

  /**
   * (D) Display command
   * Can return:
   * D_L: invalid parameters.
   * D_A: ack.
   * @param {[string]} params Parameters to the command.
   * @returns {string} Response to the command.
   */
  doDisplay(params) {
    cli.log(`COMMAND Display`);
    if (params.length !== 1) return 'D_L';
    const [display] = params;
    this.display = display;
    return 'D_A';
  }

  /**
   * (T) Tare command
   * Can return:
   * T_S_<current-value>_<unit>: the new value after tare.
   * T_I: can't execute since scale is not stable.
   * @returns {string} Response to the command.
   */
  doTare() {
    cli.log(`COMMAND Tare`);
    if (this.isStable) {
      this.tareVal = this.currentVal;
      this.currentVal = this.rawVal - this.tareVal;
      return `T_S_${this.getCurrentValue()}_${this.unit}`;
    }
    return 'T_I';
  }

  /**
   * (S) Send Stable Weight command
   * Can return:
   * S_S_<current-value>_<unit>: the current stable value.
   * S_I: can't execute since scale is not stable.
   * @returns {string} Response to the command.
   */
  doSendWeight() {
    cli.log(`COMMAND Send Stable Weight`);
    if (this.isStable) return `S_S_${this.getCurrentValue()}_${this.unit}`;
    return `S_I`;
  }

  /**
   * (S) Send Weight Now command
   * Can return:
   * S_S_<current-value>_<unit>: the current stable value.
   * S_D_<current-value>_<unit>: the current non-stable value.
   * @returns {string} Response to the command.
   */
  doSendWeightInmediate() {
    cli.log(`COMMAND Send Inmmediate Weight`);
    if (this.isStable) {
      return `S_S_${this.getCurrentValue()}_${this.unit}`;
    }
    return `S_D_${this.getCurrentValue()}_${this.unit}`;
  }

  /**
   * (R) Reset command
   * @returns {null} Trigger a timeout on the driver as a test-case.
   */
  doReset() {
    this.currentVal = 0;
    this.tareVal = 0;
    this.isStable = true;
  }
}
