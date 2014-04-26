
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + DriverFacade wraps both LampDriver and SolenoidDriver.              +
 +                                                                     +
 + It offers a short syntax for operation on lamps and solenoids:      +
 +  * lamp.on(lampName), lamp.off(lampName) and lamp.toggle(lampName)  +
 +  * solenoid.fire(solenoidName)                                      +
 +                                                                     +
 + It delegates start and stop commands to contained drivers:          +
 +  * interval.start()                                                 +
 +  * interval.stop()                                                  +
 +                                                                     +
 + To create an instance of driver facade utilize the builder:         +
 +  createBuilder().bindDriver(solenoidDriver)                         +
 +          .bindDriver(lampDriver).build()                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var util = require('util'),

    Exceptions = require('./Exceptions');

var ExpectedDrivers = { LampDriver: 'lampDriver', SolenoidDriver: 'solenoidDriver' };

function createBuilder() {
    return new DriverFacadeBuilder();
}

function DriverFacadeBuilder() {
    this.drivers = {};

    this.driverFacade = null;
}

/**
 * Binds driver to drivers table.
 * Only allows binding of drivers which are present in expected drivers.
 */
DriverFacadeBuilder.prototype.bindDriver = function(driver) {
    var constructorName = driver.constructor.name;
    if (ExpectedDrivers.hasOwnProperty(constructorName)) {
        this.drivers[ExpectedDrivers[constructorName]] = driver;
    } else {
        throw new Error(util.format(Exceptions.UNEXPECTED_DEPENDENCY, constructorName));
    }
    return this;
};

DriverFacadeBuilder.prototype.build = function() {
    this.checkBindings();
    this.driverFacade = new DriverFacade(this.drivers.lampDriver, this.drivers.solenoidDriver);
    return this.driverFacade;
};

DriverFacadeBuilder.prototype.checkBindings = function() {
    Object.getOwnPropertyNames(ExpectedDrivers).forEach(function(constructorName) {
        if (!(this.drivers.hasOwnProperty(ExpectedDrivers[constructorName]))) {
            throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, constructorName));
        }
    }, this);
};

// ===

function DriverFacade(lampDriver, solenoidDriver) {
    /**
     * An abbreviation for public methods of LampDriver.
     */
    this.lamp = {
        /*
         * Function name on is also used by EventEmitter as an alias for addListener.
         * This is accepted here as on/off makes for a nice syntax for configuration.
         */
        on: function(lampName) {
            lampDriver.enableLamp(lampName);
        },
        off: function(lampName) {
            lampDriver.disableLamp(lampName);
        },
        toggle: function(lampName) {
            lampDriver.toggleLamp(lampName);
        }
    };

    /**
     * An abbreviation for public methods of SolenoidDriver.
     */
    this.solenoid = {
        fire: function(solenoidName) {
            solenoidDriver.enableSolenoid(solenoidName);
        },
        release: function(solenoidName) {
            solenoidDriver.disableSolenoid(solenoidName);
        }
    };

    this.start = function() {
        solenoidDriver.start();
        lampDriver.start();
    };

    this.stop = function() {
        solenoidDriver.stop();
        lampDriver.stop();
    };
}

module.exports.createBuilder = createBuilder;