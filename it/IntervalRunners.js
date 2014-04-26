
var Exceptions = require('../src/Exceptions'),
    IntervalRunner = require('../src/IntervalRunner');

function createNativeInterval(runnable, interval, callbacks) {
    return new NativeInterval(runnable, interval, callbacks);
}

function createNativeTimeout(runnable, interval, callbacks) {
    return new NativeTimeout(runnable, interval, callbacks);
}

function createSpinningRunner(runnable, callbacks) {
    return new SpinningRunner(runnable, callbacks);
}

function createIntervalRunner(runnable, interval, callbacks) {
    return IntervalRunner.createRunner(runnable, interval, callbacks);
}

/**
 * Simple runner using Node.JS' setInterval method.
 * Suffers from time drifting, as each call of the runnable is a little delayed.
 * This behavior leads to an increasing error.
 *
 * @param runnable Callback to be executed each tick.
 * @param interval Interval time in milliseconds as a positive number.
 * @param callbacks Object with 'start' and/or 'stop' callbacks. [optional]
 * @constructor
 */
function NativeInterval(runnable, interval, callbacks) {
    this.runnable = runnable;

    this.intervalMilliseconds = interval;
    this.callbacks = callbacks || {};

    this.intervalId = null;
}

/**
 * Starts the Runner and calls start callback if provided.
 */
NativeInterval.prototype.start = function() {
    if (this.intervalId) { throw new Error(Exceptions.INTERVAL_RUNNING); }
    this.intervalId = setInterval(this.runnable, this.intervalMilliseconds);
    if (this.callbacks.start) { this.callbacks.start(); }
};

/**
 * Stops the Runner and calls stop callback if provided.
 */
NativeInterval.prototype.stop = function() {
    if (!this.intervalId) { throw new Error(Exceptions.INTERVAL_STOPPED); }
    clearInterval(this.intervalId);
    if (this.callbacks.stop) { this.callbacks.stop(); }
};

// ===

/**
 * Simple runner using Node.JS' setTimeout method.
 * Suffers from time drifting, as each call of the runnable is a little delayed.
 * Error is much smaller as in NativeInterval.
 *
 * @param runnable Callback to be executed each tick.
 * @param interval Interval time in milliseconds as a positive number.
 * @param callbacks Object with 'start' and/or 'stop' callbacks. [optional]
 * @constructor
 */
function NativeTimeout(runnable, interval, callbacks) {
    this.runnable = runnable;

    this.intervalMilliseconds = interval;
    this.callbacks = callbacks || {};

    this.running = false;
}

/**
 * Starts the Runner and calls start callback if provided.
 */
NativeTimeout.prototype.start = function() {
    if (this.intervalId) { throw new Error(Exceptions.INTERVAL_RUNNING); }
    setTimeout(this.createTimeoutTask(), this.intervalMilliseconds);
    this.running = true;
    if (this.callbacks.start) { this.callbacks.start(); }
};

NativeTimeout.prototype.createTimeoutTask = function() {
    var runner = this;
    return function TimeoutTask() {
        if (runner.running) {
            setTimeout(TimeoutTask, runner.intervalMilliseconds);
            runner.runnable();
        }
    };
};

/**
 * Stops the Runner and calls stop callback if provided.
 */
NativeTimeout.prototype.stop = function() {
    if (!this.running) { throw new Error(Exceptions.INTERVAL_STOPPED); }
    this.running = false;
    if (this.callbacks.stop) { this.callbacks.stop(); }
};

// ===

/**
 * Spinning runner calls runnable once each tick of the event loop.
 * Useful to test if work load can be run fast enough.
 * If this runner finishes to slow, workload is to high.
 *
 * @param runnable Callback to be executed each tick.
 * @param callbacks Object with 'start' and/or 'stop' callbacks. [optional]
 * @constructor
 */
function SpinningRunner(runnable, callbacks) {
    this.runnable = runnable;
    this.callbacks = callbacks || {};

    this.running = false;
}

/**
 * Starts the Runner and calls start callback if provided.
 */
SpinningRunner.prototype.start = function() {
    if (this.running) { throw new Error(Exceptions.INTERVAL_RUNNING); }
    process.nextTick(this.createTickTask());
    this.running = true;
    if (this.callbacks.start) { this.callbacks.start(); }
};
/**
 * Creates a callback function to be called once each iteration of the event loop.
 */
SpinningRunner.prototype.createTickTask = function() {
    var runner = this;
    return function tickTask() {
        if (runner.running) {
            runner.runnable();
            setImmediate(tickTask);
        }
    };
};

/**
 * Stops the Runner and calls stop callback if provided.
 */
SpinningRunner.prototype.stop = function() {
    if (!this.running) { throw new Error(Exceptions.INTERVAL_STOPPED); }
    this.running = false;
    if (this.callbacks.stop) { this.callbacks.stop(); }
};

module.exports = {
    createNativeInterval: createNativeInterval,
    createNativeTimeout: createNativeTimeout,
    createSpinningRunner: createSpinningRunner,
    createIntervalRunner: createIntervalRunner
};