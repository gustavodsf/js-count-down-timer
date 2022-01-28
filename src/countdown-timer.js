const TimerStatesFreezed = Object.freeze({
  PAUSED: 'paused',
  RUNNING: 'running',
  FINISHED: 'finished',
});

class TimerStateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimerStateError';
  }
}


class CountdownTimer {

  constructor({ startTime, onFinish = () => {} }) {
    this.startTime = startTime;
    this.currentTime = startTime;
    this.onFinish = onFinish;
    this._currentTimeoutId = null;
    this._state = TimerStatesFreezed.PAUSED;
  }

  start() {
    if (this._state === TimerStatesFreezed.PAUSED) {
      this._state = TimerStatesFreezed.RUNNING;
      this._currentTimeoutId = setTimeout(() => this._tick(), this._getTickPeriod());
    } else {
      throw new TimerStateError(`Cannot start timer from state: '${this._state}'`);
    }
  }

  pause() {
    if (this._state === TimerStatesFreezed.RUNNING) {
      this._state = TimerStatesFreezed.PAUSED;
      this._clearTimeout();
    } else {
      throw new TimerStateError(`Cannot pause timer from state: '${this._state}'`);
    }
  }

  finish() {
    if (this._state === TimerStatesFreezed.RUNNING || this._state === TimerStatesFreezed.PAUSED) {
      this._state = TimerStatesFreezed.FINISHED;
      this.currentTime = 0;
      this._clearTimeout();

      if (this.onFinish) {
        this.onFinish();
      }
    } else {
      throw new TimerStateError(`Cannot finish timer from state: '${this._state}'`);
    }
  }


  _getFormattedTime() {
    const numDecimals = this._getNumExtraDecimalsToDisplay();

    // v1
    /*const hours   = Math.floor( this.currentTime / 3600 ) % 24;
    const minutes = Math.floor( this.currentTime / 60 );
    const seconds = (Math.floor(this.currentTime % 60)).toFixed(numDecimals);*/

    // v2
    let hours   = Math.floor( this.currentTime / 3600); 
    let minutes = Math.floor(( this.currentTime - (hours * 3600)) / 60); 
    let seconds =  (this.currentTime - (hours * 3600) - (minutes * 60)).toFixed(numDecimals); 
    
    // v3
    /*const hours = Math.floor(this.currentTime / 3600);
    const minutes = Math.floor(this.currentTime % 3600 / 60);
    const seconds = Math.floor(this.currentTime % 3600 % 60);*/


    let hoursStr = `${hours}`;
    let minutesStr = `${minutes}`;
    let secondsStr = `${seconds}`;

    if (hours < 10) {
      hoursStr = `0${hours}`;
    }

    if (minutes < 10 && hours >= 1) {
      minutesStr = `0${minutes}`;
    }

    if (seconds < 10 && (minutes >= 1 || hours >= 1)) {
      secondsStr = `0${seconds}`;
    }

    let timeParts = [];

    if (hours > 0) {
      timeParts.push(hoursStr);
    }

    if (minutes > 0 || hours > 0) {
      timeParts.push(minutesStr);
    }

    timeParts.push(secondsStr);

    return timeParts.join(':');
  }

  _clearTimeout() {
    clearTimeout(this._currentTimeoutId);
    this._currentTimeoutId = null;
  }

  _displayTime() {
    const maxDigitLength = this._getMaxDigitLength();
    const formattedTime = this._getFormattedTime();

    // Blank the current line and then display the current (formatted) time.
    process.stdout.write('\r' + ' '.repeat(maxDigitLength));
    process.stdout.write('\r' + formattedTime);
  }


  /*
   * Returns the number of milliseconds between ticks as a function of the
   * current time remaining. The closer the timer is to 0 the more frequently
   * we want to update the display. However, we never want the time between
   * redraws to exceed 1 second (1000 ms) or fall below 50 ms (to prevent flicker).
   */
  _getTickPeriod() {
    const tickScale = 1.1;
    return Math.max(Math.min(this.currentTime * tickScale, 1000), 50);
  }

  /*
   * Returns the number of extra decimal places we want to display in the final output
   * for the current time.
   *
   * We want 10 seconds and above to display without any extra decimal places, but anything
   * 9.9 seconds or lower to display an extra decimal place.
   *
   * For example:
   *   - 125.123 seconds should display as "2:05"
   *   -  72.123 seconds should display as "1:12"
   *   -  43.123 seconds should display as "43"
   *   -   8.123 seconds should display as "8.1"
   */
  _getNumExtraDecimalsToDisplay() {
    return this.currentTime <= 9.9 ? this._getExpandedDecimalLength() : 0;
  }

  /*
  *  Returns the number of extra decimal places we want to display (whenever we decide
  *  to do that).  This is only a function because (1) namespaced constants in JavaScript
  *  are a pain in the ass and (2) we use this constant in more than one place.
  */
  _getExpandedDecimalLength() {
    return 1;
  }


  /*
   * Returns the maximum string length that can be displayed by our timer.
   * This is necessary so that we can overwrite the time for display even as
   * its length changes.
   */
  _getMaxDigitLength() {
    const startHours = Math.floor( this.startTime / 3600 ) % 24;
    return startHours.toString().length + 1 +   // Hours and a colon
      2 + 1 +                                   // Minutes and a colon
      2 + 1 + this._getExpandedDecimalLength(); // Seconds, a decimal point, and decimals
  }

  _tick() {
    const start = Date.now();

    this._currentTimeoutId = setTimeout(() => {
      const duration = (Date.now() - start) / 1000;
      this.currentTime -= duration;

      if (this.currentTime <= 0) {
        console.log('');
        this.finish();
      } else {
        this._displayTime();
        this._tick();
      }
    }, this._getTickPeriod());
  }
}

module.exports = CountdownTimer;
