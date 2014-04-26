
var IntervalRunners = require('./IntervalRunners');

var MILLISECONDS_PER_SECOND = 1000;
var NANOSECONDS_PER_SECOND = 1000000000;

/**
 * Runs INTERVAL_COUNT iterations of INTERVAL_MILLISECONDS for
 * each type of interval runner to test their precision.
 * Logs difference for each test case to console.
 */
(function main() {

    var INTERVAL_MILLISECONDS = 1.0;
    var INTERVAL_COUNT = 1000;

    var iterationsLeft,
        runnable,
        runner,
        startTime;

    (function setUp() {
        console.log('Interval length (ms): ' + INTERVAL_MILLISECONDS);
        console.log('Interval count: ' + INTERVAL_COUNT);
        runnable = function() { iterationsLeft -= 1; if (iterationsLeft === 0) { runner.stop(); } };
    }());

    /**
     * Enum for different interval runners used in this test.
     */
    var RunnerTypes = {
        NATIVE_INTERVAL: 'NativeInterval',
        NATIVE_TIMEOUT: 'NativeTimeout',
        SPINNING_RUNNER: 'SpinningRunner',
        INTERVAL_RUNNER: 'IntervalRunner'
    };

    /**
     * Map of all tests to be run one after each other.
     */
    var runnerTests = {};
    runnerTests[RunnerTypes.NATIVE_INTERVAL] = { createRunner: IntervalRunners.createNativeInterval, next: RunnerTypes.NATIVE_TIMEOUT };
    runnerTests[RunnerTypes.NATIVE_TIMEOUT] = { createRunner: IntervalRunners.createNativeTimeout, next: RunnerTypes.SPINNING_RUNNER };
    runnerTests[RunnerTypes.SPINNING_RUNNER] = { createRunner: IntervalRunners.createSpinningRunner, next: RunnerTypes.INTERVAL_RUNNER };
    runnerTests[RunnerTypes.INTERVAL_RUNNER] = { createRunner: IntervalRunners.createIntervalRunner, next: null };

    /**
     * Creates a runner of selected type, runs test runnable  and logs duration.
     * Uses runner's stop hook to trigger next runner test.
     *
     * @param runnerType Type of runner as declared in IntervalRunners.
     */
    (function runInterval(runnerName) {
        var testCase = runnerTests[runnerName];
        runner = testCase.createRunner(runnable, INTERVAL_MILLISECONDS, {
            start: function () {
                startTime = process.hrtime();
            },
            stop: function() {
                logDuration(runnerName);
                if (runnerTests.hasOwnProperty(testCase.next)) {
                    runInterval(testCase.next);
                }
            }
        });
        iterationsLeft = INTERVAL_COUNT;
        runner.start();
    }(RunnerTypes.NATIVE_INTERVAL));

    function logDuration(name) {
        var endTime = process.hrtime(startTime);
        var difference = calculateMillisecondsDifference(splitInterval(INTERVAL_MILLISECONDS * INTERVAL_COUNT), endTime);
        console.log('Difference for ' + name + ' (ms): ' + difference);
    }

    function splitInterval(milliSeconds) {
        var seconds = Math.floor(milliSeconds / MILLISECONDS_PER_SECOND);
        var nanosecondsPerMillisecond = (NANOSECONDS_PER_SECOND / MILLISECONDS_PER_SECOND);
        var nanoseconds = Math.floor(milliSeconds % MILLISECONDS_PER_SECOND * nanosecondsPerMillisecond);
        return [seconds, nanoseconds];
    }

    /**
     * @param expected An array containing seconds and nanoseconds.
     * @param actual An array containing seconds and nanoseconds.
     *
     * @return {Number} Difference between expected total duration and actual consumed time.
     * Positive numbers signifies to late, negative numbers to early return.
     */
    function calculateMillisecondsDifference(expected, actual) {
        // Only works for small second counts, due to overflow.
        var nanosecondsDifference = (actual[0] * NANOSECONDS_PER_SECOND + actual[1]) - (expected[0] * NANOSECONDS_PER_SECOND + expected[1]);
        return nanosecondsDifference / NANOSECONDS_PER_SECOND * MILLISECONDS_PER_SECOND;
    }
}());