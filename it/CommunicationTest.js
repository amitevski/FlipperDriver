var proxyquire = require('proxyquire'),
    ParallelPorts = require('./ParallelPorts'),

    Flipper = require('../cfg/Flipper'),
    Port = require('../cfg/Port'),
    Lamps = require('../cfg/Lamps'),
    Solenoids = require('../cfg/Solenoids'),
    Switches = require('../cfg/Switches');

/**
 * Select the parallel port create function which should be injected into FlipperDriver:
 * createPort, createSniffingPort or createPortStub are available.
 */
var CREATE_PORT_FUNCTION = ParallelPorts.createPort;

var FlipperDriver = proxyquire('../src/FlipperDriver', { './ParallelPort': { createPort: CREATE_PORT_FUNCTION, '@noCallThru': true } });

/**
 * Communication test suite.
 * Initiates flipper driver with selected parallel port.
 * Offers console commands for starting tests and exit. (See printed help for syntax.)
 * Test for lamps enables and disables one lamp after each other.
 * Test for solenoids fires both flipper fingers and saucers.
 * Test for switches prints each switch event to console.
 */
(function main() {

    var flipperDriver = null;

    (function setUpDriver() {
        flipperDriver = FlipperDriver.createDriver(Flipper, Port);
        flipperDriver.start();
    }());

    (function printHelp() {
        var help = [
            'Commands:',
            'l:1\tactivate lamp test',
            'l:0\tdisable lamp test',
            'f:1\tactivate solenoid test',
            'f:0\tdisable solenoid test',
            's:1\tactivate switch test',
            's:0\tdisable switch test',
            'q\tquit program with 1 second delay'
        ];
        help.forEach(function (line) { console.log(line); });
    }());

    (function setUpConsole() {
        // program will keep running as stdin is waiting for input
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
    }());

    (function registerKeys() {
        process.stdin.addListener('data', function (data) {
            var command = data.trim().slice(0, 3);
            if (command === 'l:1') {
                lampTest();
            } else if (command === 'f:1') {
                solenoidTest();
            } else if (command === 's:1') {
                switchTest();
            } else if (command === 'q') {
                quit();
            }
        });
    }());

    /**
     * Enables and disables one lamp after each other
     * and registers an console command to deactivate test.
     */
    function lampTest() {
        var lampNames = Object.getOwnPropertyNames(Lamps).map(function (lampKey) { return Lamps[lampKey]; }),
            currentLampIndex = 0,
            desiredLampState = true,
            interval = null;

        process.stdin.addListener('data', function lampOff(data) {
            if (data.trim() === 'l:0') {
                clearInterval(interval);
                process.stdin.removeListener('data', lampOff);
            }
        });

        interval = setInterval(function() {
            // Toggle enable/disable when reaching end of lamp list
            if (currentLampIndex === lampNames.length) {
                currentLampIndex = 0;
                desiredLampState = !desiredLampState;
            }

            if (desiredLampState) {
                flipperDriver.driverFacade.lamp.on(lampNames[currentLampIndex]);
            } else {
                flipperDriver.driverFacade.lamp.off(lampNames[currentLampIndex]);
            }

            currentLampIndex += 1;
        }, 200);
    }

    /**
     * Fires power solenoids and fires and releases hold solenoids to
     * move and hold flipper fingers one after another.
     * Fires solenoids to activate saucers one after another.
     * Registers an console command to deactivate test.
     */
    function solenoidTest() {
        var fingerPairs = [
                { power: Solenoids.LEFT_FLIPPER_POWER, hold: Solenoids.LEFT_FLIPPER_HOLD },
                { power: Solenoids.RIGHT_FLIPPER_POWER, hold: Solenoids.RIGHT_FLIPPER_HOLD }
            ],
            saucerNames = [
                Solenoids.LEFT_SAUCER,
                Solenoids.RIGHT_SAUCER
            ],
            currentFingerIndex = 0,
            desiredFingerState = true,
            currentSaucerIndex = 0,
            fingerInterval = null,
            saucerInterval = null;

        process.stdin.addListener('data', function solenoidOff(data) {
            if (data.trim() === 'f:0') {
                clearInterval(fingerInterval);
                clearInterval(saucerInterval);
                // Release the fingers to avoid permanent active hold solenoids
                flipperDriver.driverFacade.solenoid.release(fingerPairs[0].hold);
                flipperDriver.driverFacade.solenoid.release(fingerPairs[1].hold);
                process.stdin.removeListener('data', solenoidOff);
            }
        });

        // Fires and holds both fingers alternating
        fingerInterval = setInterval(function() {
            // Toggle enable/disable when reaching end of finger list
            if (currentFingerIndex === fingerPairs.length) {
                currentFingerIndex = 0;
                desiredFingerState = !desiredFingerState;
            }

            if (desiredFingerState) {
                flipperDriver.driverFacade.solenoid.fire(fingerPairs[currentFingerIndex].power);
                // Fire hold solenoid when power solenoid releases, caching finger index with closure.
                setTimeout((function () {
                    var fingerIndex = currentFingerIndex;
                    return function fireHoldSolenoid() {
                        flipperDriver.driverFacade.solenoid.fire(fingerPairs[fingerIndex].hold);
                    };
                }()), Flipper.solenoids[Solenoids.LEFT_FLIPPER_POWER].duration);
            } else {
                // Hold solenoids have to be released manually
                flipperDriver.driverFacade.solenoid.release(fingerPairs[currentFingerIndex].hold);
            }

            currentFingerIndex += 1;
        }, 2000);

        // Start delayed not to be in sync with flipper finger activation
        setTimeout(function () {
            // Fires both saucers alternating
            saucerInterval = setInterval(function() {
                if (currentSaucerIndex === saucerNames.length) {
                    currentSaucerIndex = 0;
                }

                flipperDriver.driverFacade.solenoid.fire(saucerNames[currentSaucerIndex]);

                currentSaucerIndex += 1;
            }, 1000);
        }, 500);
    }

    /**
     * Register to all switch events, prints message to console if an event is triggered
     * and registers an console command to deactivate test.
     */
    function switchTest() {
        var switchNames = getSwitchNames(),
            handle = function handle(event) { console.log(event.name + ': ' + event.state); };

        //flipperModel.setMaxListeners(switchNames.length);
        switchNames.forEach(function (switchName) {
            flipperDriver.flipperModel.addListener(switchName, handle);
        });

        process.stdin.addListener('data', function switchOff(data) {
            if (data.trim() === 's:0') {
                switchNames.forEach(function (switchName) { flipperDriver.flipperModel.removeListener(switchName, handle); });
                process.stdin.removeListener('data', switchOff);
            }
        });
    }

    function getSwitchNames() {
        return Object.getOwnPropertyNames(Switches).map(function (switchKey) { return Switches[switchKey]; });
    }

    function quit() {
        // Stop listening to console commands to avoid not running exceptions
        process.stdin.removeAllListeners();

        flipperDriver.stop();

        printLogIfAvailable();

        // Time for the interval stop hooks to finish (disabling lamps etc.)
        setTimeout(function () { process.exit(); }, 1000);
    }

    function printLogIfAvailable() {
        // Only parallel port sniffer has a log
        if (CREATE_PORT_FUNCTION === ParallelPorts.createSniffingPort) {
            ParallelPorts.getSniffingPortLog().forEach(function (entry) { console.log(entry); });
        }
    }
}());