
var IntervalRunner = require('../src/IntervalRunner'),
    Exceptions = require('../src/Exceptions');

/*
 * Interval must be big enough as setTimeout is used for tests.
 * setTimeout does not work very well for small times.
 * If tests fail on a machine, a higher value may be necessary.
 */
var INTERVAL_MILLISECONDS = 50;

var container = [];

var iR;

exports.setUp = function(setUp) {
    iR = IntervalRunner.createRunner(function() { container.push(true); }, INTERVAL_MILLISECONDS);
    setUp();
};

/*
 * Runner should wait interval and then execute runnable for the first time.
 */
exports.testOneIteration = function(test) {
    testIterations(test, 1);
};

exports.testTwoIteration = function(test) {
    testIterations(test, 2);
};

exports.testThreeIteration = function(test) {
    testIterations(test, 3);
};

/*
 * Waits (ticks + 0.5) intervals before stopping the runner.
 * Checks if runnable was called ticks time by counting container content.
 */
function testIterations(test, ticks) {
    container = [];
    iR.start();
    setTimeout(function() {
        iR.stop();
        test.equal(container.length, ticks);
        test.done();
    }, (ticks + 0.5) * INTERVAL_MILLISECONDS);
}

exports.testStartHook = function(test) {
    var callbackCalled = false;
    iR.callbacks.start = function() { callbackCalled = true; };
    iR.start();
    test.ok(callbackCalled);
    iR.stop();
    test.done();
};

exports.testStopHook = function(test) {
    var callbackCalled = false;
    iR.callbacks.stop = function() { callbackCalled = true; };
    iR.start();
    test.ok(!callbackCalled);
    iR.stop();
    test.ok(callbackCalled);
    test.done();
};

/*
 * start() on running runner should throw exception.
 */
exports.testStartWhenRunning = function(test) {
    iR.start();
    test.throws(function() { iR.start(); }, new RegExp(Exceptions.INTERVAL_RUNNING));
    iR.stop();
    test.done();
};

/*
 * stop() on stopped runner should throw exception.
 */
exports.testStopWhenNotRunning = function(test) {
    test.throws(function() { iR.stop(); }, new RegExp(Exceptions.INTERVAL_STOPPED));
    test.done();
};