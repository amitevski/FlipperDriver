
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + IntervalRunner is a high precision interval timer.                  +
 + It executes a runnable function using the event loop for            +
 + active, non-blocking waiting.                                       +
 +                                                                     +
 + IntervalRunner can be controlled with:                              +
 +  * start()                                                          +
 +  * stop()                                                           +
 +                                                                     +
 + To create an instance of interval runner utilize the                +
 + factory method:                                                     +
 +  createRunner(runnable, interval, callbacks)                        +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var Exceptions = require('./Exceptions');

var MILLISECONDS_PER_SECOND = 1000;
var NANOSECONDS_PER_SECOND = 1000000000;

function createRunner(runnable, interval, callbacks) {
    return new IntervalRunner(runnable, interval, callbacks);
}

/**
 * IntervalRunner checks each tick of the event loop if target time is reached.
 *
 * @param runnable Callback to be executed each tick.
 * @param interval Interval time in milliseconds as a positive number.
 * @param callbacks Object with 'start' and/or 'stop' callbacks. [optional]
 * @constructor
 */
function IntervalRunner(runnable, interval, callbacks) {
    this.runnable = runnable;
    this.interval = this.splitInterval(interval);
    this.callbacks = callbacks || {};

    this.running = false;
    this.targetTime = [0, 0];
}

/**
 * Splits a millisecond float into a second and a nanosecond component.
 */
IntervalRunner.prototype.splitInterval = function(milliSeconds) {
    var seconds = Math.floor(milliSeconds / MILLISECONDS_PER_SECOND);
    var nanosecondsPerMillisecond = (NANOSECONDS_PER_SECOND / MILLISECONDS_PER_SECOND);
    var nanoseconds = Math.floor(milliSeconds % MILLISECONDS_PER_SECOND * nanosecondsPerMillisecond);
    return [seconds, nanoseconds];
};

/**
 * Starts the Runner and calls start callback if provided.
 */
IntervalRunner.prototype.start = function() {
    if (this.running) { throw new Error(Exceptions.INTERVAL_RUNNING); }
    this.targetTime = process.hrtime();
    // Like setInterval the first execution is after the first interval, not immediately after starting it
    this.updateTargetTime();
    this.running = true;
    if (this.callbacks.start) { this.callbacks.start(); }
    (this.createTickTask())();
};

/**
 * Creates a callback function to be called once each iteration of the event loop.
 * Executes runnable if target time is reached.
 */
IntervalRunner.prototype.createTickTask = function() {
    var runner = this;
    return function tickTask() {
        if (runner.running) {
            var targetTime = runner.targetTime;
            var currentTime = process.hrtime();
            // Checks for smaller seconds or same seconds and smaller nanoseconds
            if (targetTime[0] < currentTime[0] || (targetTime[0] === currentTime[0] && targetTime[1] <= currentTime[1])) {
                // Create next target from old target, not from current time to avoid accumulating error
                runner.updateTargetTime();
                runner.runnable();
            }
            setImmediate(tickTask);
        }
    };
};

/**
 * Sums two arrays of seconds and nanoseconds with carry over.
 */
IntervalRunner.prototype.updateTargetTime = function() {
    var seconds = this.targetTime[0] + this.interval[0];
    var nanoseconds = this.targetTime[1] + this.interval[1];
    // Math.floor can be used as number is always positive
    this.targetTime[0] = seconds + Math.floor(nanoseconds / NANOSECONDS_PER_SECOND);
    this.targetTime[1] = nanoseconds % NANOSECONDS_PER_SECOND;
};

/**
 * Stops the Runner and calls stop callback if provided.
 */
IntervalRunner.prototype.stop = function() {
    if (!this.running) { throw new Error(Exceptions.INTERVAL_STOPPED); }
    this.running = false;
    if (this.callbacks.stop) { this.callbacks.stop(); }
};

module.exports.createRunner = createRunner;