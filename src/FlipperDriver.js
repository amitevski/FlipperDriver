
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + FlipperDriver creates and binds all necessary objects.              +
 +                                                                     +
 + It allows access to:                                                +
 +  * FlipperModel                                                     +
 +  * DriverFacade                                                     +
 +  * SwitchScanner (not needed in normal operation)                   +
 +                                                                     +
 + It delegates start and stop commands to DriverFacade and            +
 + SwitchScanner:                                                      +
 +  * start()                                                          +
 +  * stop()                                                           +
 +                                                                     +
 + To create an instance of flipper driver utilize the factory method: +
 +  createDriver(flipper, port)                                        +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var ParallelPort = require('./ParallelPort'),
    FlipperModel = require('./FlipperModel'),
    SwitchScanner = require('./SwitchScanner'),
    LampDriver = require('./LampDriver'),
    SolenoidDriver = require('./SolenoidDriver'),
    DriverFacade = require('./DriverFacade'),
    Exceptions = require('./Exceptions');

/**
 * Creates an instance of FlipperDriver.
 *
 * @param flipper Flipper structure like described in flipper configuration.
 * @param port Port structure like described in port configuration.
 */
function createDriver(flipper, port) {
    if (!(typeof flipper === 'object' && typeof port === 'object')) {
        throw new Error(Exceptions.MISSING_CONFIGURATION);
    }
    return new FlipperDriver(flipper, port);
}

function FlipperDriver(flipper, port) {
    var parallelPort = ParallelPort.createPort(port),
        flipperModel = FlipperModel.createBuilder(flipper).build(),
        switchScanner = SwitchScanner.createBuilder(flipper).bindModel(flipperModel).bindPort(parallelPort).build(),
        lampDriver = LampDriver.createBuilder(flipper).bindModel(flipperModel).bindPort(parallelPort).build(),
        solenoidDriver = SolenoidDriver.createBuilder(flipper).bindModel(flipperModel).bindPort(parallelPort).build(),
        driverFacade = DriverFacade.createBuilder().bindDriver(lampDriver).bindDriver(solenoidDriver).build();

    this.flipperModel = flipperModel;
    this.driverFacade = driverFacade;
    this.switchScanner = switchScanner;

    this.running = false;
}

FlipperDriver.prototype.start = function() {
    if (this.running) { throw new Error(Exceptions.DRIVER_RUNNING); }
    this.switchScanner.start();
    this.driverFacade.start();
    this.running = true;
};

FlipperDriver.prototype.stop = function() {
    if (!this.running) { throw new Error(Exceptions.DRIVER_STOPPED); }
    this.switchScanner.stop();
    this.driverFacade.stop();
    this.running = false;
};

module.exports.createDriver = createDriver;