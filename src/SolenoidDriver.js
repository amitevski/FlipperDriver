
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + SolenoidDriver drives the solenoids of the flipper.                 +
 +                                                                     +
 + It offers a function to set the state of each solenoid:             +
 +  * enableSolenoid(solenoidName)                                     +
 +                                                                     +
 + Solenoids are disabled after an individual period.                  +
 + Changes of state are written immediately to the flipper.            +
 + Solenoids are organized in registers.                               +
 +                                                                     +
 + Solenoid power can be activated and deactivated with:               +
 +  * start()                                                          +
 +  * stop()                                                           +
 +                                                                     +
 + To create an instance of solenoid driver utilize the builder:       +
 +  createBuilder(flipper).bindModel(flipperModel)                     +
 +          .bindPort(parallelPort).build()                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var util = require('util'),
    Exceptions = require('./Exceptions'),
    BitMasks = require('./BitMasks'),
    Registers = require('./Registers'),
    Relay = require('./Relay');

/**
 * Creates an instance of SolenoidDriverBuilder.
 *
 * @param flipper Flipper structure like described in flipper configuration.
 */
function createBuilder(flipper) {
    if (!(typeof flipper === 'object')) {
        throw new Error(Exceptions.MISSING_CONFIGURATION);
    }
    return new SolenoidDriverBuilder(flipper);
}

function SolenoidDriverBuilder(flipper) {
    this.flipper = flipper;

    this.solenoidDriver = null;
    this.flipperModel = null;
    this.parallelPort = null;
}

SolenoidDriverBuilder.prototype.bindModel = function(flipperModel) {
    this.flipperModel = flipperModel;
    return this;
};

SolenoidDriverBuilder.prototype.bindPort = function(parallelPort) {
    this.parallelPort = parallelPort;
    return this;
};

SolenoidDriverBuilder.prototype.build = function() {
    this.checkBindings();
    this.checkConfiguration();
    this.solenoidDriver = new SolenoidDriver(this.parallelPort);
    this.buildSolenoidBytes();
    this.buildDrivers();
    return this.solenoidDriver;
};

SolenoidDriverBuilder.prototype.checkBindings = function() {
    if (!this.flipperModel) {
        throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, 'FlipperModel'));
    }
    if (!this.parallelPort) {
        throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, 'ParallelPort'));
    }
};

SolenoidDriverBuilder.prototype.checkConfiguration = function() {
    Object.getOwnPropertyNames(this.flipper.solenoids).forEach(this.checkSolenoidConfiguration, this);
};

SolenoidDriverBuilder.prototype.checkSolenoidConfiguration = function(solenoidName) {
    var solenoidConfig = this.flipper.solenoids[solenoidName];
    if (!(solenoidConfig.hasOwnProperty('register') && solenoidConfig.hasOwnProperty('index')
            && solenoidConfig.hasOwnProperty('duration'))) {
        throw new Error(util.format(Exceptions.BROKEN_SOLENOID, 'Flipper.solenoids.' + solenoidName,
            util.inspect(solenoidConfig)));
    }
};

SolenoidDriverBuilder.prototype.buildSolenoidBytes = function() {
    Object.getOwnPropertyNames(this.flipper.solenoids).forEach(this.ensureSolenoidByteIsExisting, this);
};

/**
 * Creates an entry for an new byte in the byte-map.
 * This is necessary when the first solenoid of each register is added.
 *
 * @param solenoidName Solenoid name from Solenoids.
 */
SolenoidDriverBuilder.prototype.ensureSolenoidByteIsExisting = function(solenoidName) {
    var solenoidConfig = this.flipper.solenoids[solenoidName];
    var solenoidBytes = this.solenoidDriver.solenoidBytes;
    if (!solenoidBytes.hasOwnProperty(solenoidConfig.register)) {
        solenoidBytes[solenoidConfig.register] = BitMasks.DATA_LOW;
    }
};

SolenoidDriverBuilder.prototype.buildDrivers = function() {
    Object.getOwnPropertyNames(this.flipper.solenoids).forEach(this.addSolenoidDriver, this);
};

/**
 * Wraps a driver for one solenoid into a function using closure.
 * Returned function can enable or disable a solenoid.
 * Enabling is only possible if solenoid is inactive to avoid exceeding
 * of duration.
 * If inactive, it calls a function which activates the bit representing
 * this specific solenoid in the appropriate register
 * and sets a timeout for its deactivation.
 * Disabling the solenoid is always allowed and will stop the timeout
 * if active.
 *
 * @param solenoidName Solenoid name from Solenoids.
 */
SolenoidDriverBuilder.prototype.addSolenoidDriver = function(solenoidName) {
    var solenoidConfig = this.flipper.solenoids[solenoidName],
        isInactive = this.createIsSolenoidInactive(solenoidName),
        manipulate = this.createManipulateSolenoid(solenoidName),
        duration = solenoidConfig.duration,
        callback = function() { manipulate(BitMasks.disableBit); };
    this.solenoidDriver.drivers[solenoidName] = function Driver(operation) {
        if (operation === BitMasks.disableBit) {
            manipulate(BitMasks.disableBit);
            // clearTimeout can be called with invalid parameter, no check needed
            clearTimeout(Driver.timer);
        // No condition as missing operator should activate solenoid, too
        } else {
            if (isInactive()) {
                // enableBit and toggleBit have the same effect at this position
                manipulate(BitMasks.enableBit);
                // Only hold solenoids should be active until deactivated
                if (duration > 0) {
                    Driver.timer = setTimeout(callback, duration);
                }
            }
        }
    };
};

/**
 * Wraps information about one solenoid into a check function using closure.
 * Returned function checks if one specific solenoid is inactive.
 *
 * @return Function which checks the state of one specific solenoid
 * returning true for inactive and false for active.
 */
SolenoidDriverBuilder.prototype.createIsSolenoidInactive = function(solenoidName) {
    var solenoidConfig = this.flipper.solenoids[solenoidName],
        bytes = this.solenoidDriver.solenoidBytes,
        register = solenoidConfig.register,
        bitMask = BitMasks.BITS[solenoidConfig.index];
    return function isSolenoidInactive() {
        return !(bytes[register] & bitMask);
    };
};

/**
 * Wraps information about one solenoid into a manipulate function using closure.
 * Returned function performs a bit-operation from BitMasks
 * on a bit representing a specific solenoid
 * and updates the state of the solenoid in FlipperModel.
 * New register value is written to the parallel port immediately.
 *
 * @return Function which changes the bit representing
 * one specific solenoid.
 */
SolenoidDriverBuilder.prototype.createManipulateSolenoid = function(solenoidName) {
    var solenoidConfig = this.flipper.solenoids[solenoidName],
        model = this.flipperModel,
        parallelPort = this.parallelPort,
        bytes = this.solenoidDriver.solenoidBytes,
        register = solenoidConfig.register,
        bitMask = BitMasks.BITS[solenoidConfig.index],
        name = solenoidName;
    return function manipulateSolenoid(operation) {
        var blockByte = operation(bytes[register], bitMask);
        bytes[register] = blockByte;
        parallelPort.write(register, blockByte);
        model.updateSolenoid(name, (blockByte & bitMask));
    };
};

// ===

function SolenoidDriver(parallelPort) {
    this.parallelPort = parallelPort;

    this.solenoidBytes = {};
    this.drivers = {};

    this.initializeRegisters();
}

/**
 * Initializes all solenoid registers,
 * not just registers used in cfg/Solenoids.
 *
 * DO NOT CHANGE - IT WILL HURT THE FUSES.
 */
SolenoidDriver.prototype.initializeRegisters = function() {
    var solenoidRegisters = [
        Registers.SOLENOID_GROUP_A,
        Registers.SOLENOID_GROUP_B,
        Registers.SOLENOID_GROUP_C,
        Registers.SOLENOID_GROUP_D,
        Registers.SOLENOID_FLIPPER,
        Registers.SOLENOID_LOGIC
    ];

    solenoidRegisters.forEach(function(solenoidRegister) {
        this.parallelPort.write(solenoidRegister, BitMasks.DATA_LOW);
    }, this);
};

SolenoidDriver.prototype.start = function() {
    this.manipulatePowerRelay(BitMasks.enableBit);
};

SolenoidDriver.prototype.stop = function() {
    this.manipulatePowerRelay(BitMasks.disableBit);
};

/**
 * Changes the state of power relay and health led.
 * Active power relay provides power to all solenoids.
 *
 * @param operation Bit operation from BitMasks.
 */
SolenoidDriver.prototype.manipulatePowerRelay = function(operation) {
    this.drivers[Relay.HEALTH_LED](operation);
    this.drivers[Relay.POWER_RELAY_CONTROL](operation);
};

SolenoidDriver.prototype.enableSolenoid = function(solenoidName) {
    this.drivers[solenoidName](BitMasks.enableBit);
};

SolenoidDriver.prototype.disableSolenoid = function(solenoidName) {
    this.drivers[solenoidName](BitMasks.disableBit);
};

module.exports.createBuilder = createBuilder;