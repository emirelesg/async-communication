/**
 * Implements the command line interface, with three sections:
 * - Top status bar
 * - Body used for logging with scrolling functionality.
 * - Bottom command bar
 */
import blessed from 'blessed';
import moment from 'moment';

class CLI {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true
    });
    this.commands = [];
    this.top = blessed.box({
      top: 0,
      label: 'Status',
      tags: true,
      left: 0,
      border: {
        type: 'line'
      },
      width: '100%',
      height: 3,
      style: {
        fg: 'blue',
        bg: 'black'
      }
    });
    this.body = blessed.box({
      top: 3,
      left: 0,
      width: '100%',
      tags: true,
      height: this.screen.height - 4,
      border: {
        type: 'line'
      },
      label: 'Log',
      content: '',
      mouse: true,
      alwaysScroll: true,
      scrollable: true,
      scrollbar: {
        style: {
          bg: 'blue'
        }
      }
    });
    this.bottom = blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      tags: true,
      height: 1,
      style: {
        fg: 'white'
      }
    });
    this.screen.append(this.top);
    this.screen.append(this.body);
    this.screen.append(this.bottom);
    this.screen.on('resize', () => {
      this.top.emit('attach');
      this.bottom.emit('attach');
      this.body.emit('attach');
    });
  }

  /**
   * Updates the contents of the bottom box to the commands stored in the
   * commands array.
   */
  updateCommandsBox() {
    this.bottom.setContent(
      this.commands.reduce(
        (a, { key, label }) =>
          `${a}{black-fg}{white-bg}{bold}${key}{/}: ${label}\t`,
        ' '
      )
    );
    this.screen.render();
  }

  /**
   * Listen for key presses.
   * @param {string} key ASCII letter to listen for key press.
   * @param {string} label Label that will appear on the bottom bar.
   * @param {Function} func Callback function.
   */
  bindKey(key, label, func) {
    this.screen.key(key, (...args) => func(...args));
    this.commands.push({ key, label });
    this.updateCommandsBox();
  }

  /**
   * Sets the content of the top bar.
   * @param {string} text Text to place on the top bar.
   */
  status(text) {
    this.top.setContent(text);
    this.screen.render();
  }

  /**
   * Adds a line to the log and scrolls to the bottom.
   * @param {string} text String to add to the log.
   */
  log(text) {
    this.body.pushLine(`${moment().toISOString()} ${text}`);
    this.body.setScrollPerc(100);
    this.screen.render();
  }

  /**
   * Used to signal that traffic is incomming.
   * @param {string} text Text to append to the incomming symbol.
   */
  in(text) {
    this.log(`{magenta-fg}{bold} --> {/} ${text}`);
  }

  /**
   * Used to signal that traffic is outgoing.
   * @param {string} text Text to append to the outcomming symbol.
   */
  out(text) {
    this.log(`{cyan-fg}{bold} <-- {/} ${text}`);
  }

  /**
   * Used to alert the user of something.
   * @param {string} text Text to append to the warning symbol.
   */
  warn(text) {
    this.log(`{black-fg}{yellow-bg}Warning{/} ${text}`);
  }
}

export default new CLI();
