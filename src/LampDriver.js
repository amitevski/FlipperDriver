
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + LampDriver drives the lamps of the flipper.                         +
 +                                                                     +
 + It offers functions to set the state of each lamp:                  +
 +  * enableLamp(lampName)                                             +
 +  * disableLamp(lampName)                                            +
 +  * toggleLamp(lampName)                                             +
 +                                                                     +
 + It contains an IntervalRunner which can be controlled with:         +
 +  * start()                                                          +
 +  * stop()                                                           +
 +                                                                     +
 + Lamps are organized in a matrix, they are driven by pulses          +
 + which active lamps in one row at a time.                            +
 +                                                                     +
 + To create an instance of lamp driver utilize the builder:           +
 +  createBuilder(flipper).bindModel(flipperModel)                     +
 +          .bindPort(parallelPort).build()                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var util = require('util'),

    Exceptions = require('./Exceptions'),
    Registers = require('./Registers'),
    BitMasks = require('./BitMasks'),
    IntervalRunner = require('./IntervalRunner');

/**
 * Creates an instance of LampDriverBuilder.
 *
 * @param flipper Flipper structure like described in flipper configuration.
 */
function createBuilder(flipper) {
    if (!(typeof flipper === 'object')) {
        throw new Error(Exceptions.MISSING_CONFIGURATION);
    }
    return new LampDriverBuilder(flipper);
}

function LampDriverBuilder(flipper) {
    this.flipper = flipper;

    this.lampDriver = null;
    this.flipperModel = null;
    this.parallelPort = null;
}

LampDriverBuilder.prototype.bindModel = function(flipperModel) {
    this.flipperModel = flipperModel;
    return this;
};

LampDriverBuilder.prototype.bindPort = function(parallelPort) {
    this.parallelPort = parallelPort;
    return this;
};

LampDriverBuilder.prototype.build = function() {
    this.checkBindings();
    this.checkConfiguration();
    var driveInterval = this.flipper.intervals.lamps;
    this.lampDriver = new LampDriver(this.parallelPort, driveInterval);
    this.buildLampBytes();
    this.buildDrivers();
    return this.lampDriver;
};

LampDriverBuilder.prototype.checkBindings = function() {
    if (!this.flipperModel) {
        throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, 'FlipperModel'));
    }
    if (!this.parallelPort) {
        throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, 'ParallelPort'));
    }
};

LampDriverBuilder.prototype.checkConfiguration = function() {
    if (!(typeof this.flipper.intervals.lamps === 'number' && this.flipper.intervals.lamps > 0)) {
        throw new Error(util.format(Exceptions.BROKEN_CONFIGURATION, 'Flipper.interval.lamps'));
    }
    Object.getOwnPropertyNames(this.flipper.lamps).forEach(this.checkLampConfiguration, this);
};

LampDriverBuilder.prototype.checkLampConfiguration = function(lampName) {
    var lampConfig = this.flipper.lamps[lampName];
    if (!(lampConfig.hasOwnProperty('matrix') && lampConfig.hasOwnProperty('column') && lampConfig.hasOwnProperty('row'))) {
        throw new Error(util.format(Exceptions.BROKEN_LAMP, 'Flipper.lamps.' + lampName, util.inspect(lampConfig)));
    }
};

LampDriverBuilder.prototype.buildLampBytes = function() {
    Object.getOwnPropertyNames(this.flipper.lamps).forEach(this.ensureLampByteIsExisting, this);
};

/**
 * Creates an entry for an new byte in the byte-map.
 * This is necessary when the first lamp of part A or B of a matrix row is added.
 *
 * @param lampName Lamp name from Lamps.
 */
LampDriverBuilder.prototype.ensureLampByteIsExisting = function(lampName) {
    var lampConfig = this.flipper.lamps[lampName];
    var lampBytes = this.lampDriver.lampBytes;
    if (!lampBytes.hasOwnProperty(lampConfig.matrix)) {
        lampBytes[lampConfig.matrix] = {};
    }
    if (!lampBytes[lampConfig.matrix].hasOwnProperty(lampConfig.column)) {
        lampBytes[lampConfig.matrix][lampConfig.column] = BitMasks.DATA_LOW;
    }
};

LampDriverBuilder.prototype.buildDrivers = function() {
    Object.getOwnPropertyNames(this.flipper.lamps).forEach(this.addLampDriver, this);
};

/**
 * Wraps driver for one lamp into a function using closure.
 * Returned function performs a bit-operation from BitMasks
 * on a bit representing a specific lamp
 * and updates the state of the lamp in FlipperModel.
 *
 * @param lampName Lamp name from Lamps.
 */
LampDriverBuilder.prototype.addLampDriver = function(lampName) {
    var lampConfig = this.flipper.lamps[lampName],
        model = this.flipperModel,
        matrix = this.lampDriver.lampBytes[lampConfig.matrix],
        column = lampConfig.column,
        bitMask = BitMasks.BITS[lampConfig.row],
        name = lampName;
    this.lampDriver.drivers[lampName] = function Driver(operation) {
        var blockByte = operation(matrix[column], bitMask);
        matrix[column] = blockByte;
        model.updateLamp(name, !!(blockByte & bitMask));
    };
};

// ===

function LampDriver(parallelPort, driveInterval) {
    this.parallelPort = parallelPort;

    this.lampBytes = {};
    this.drivers = {};

    var callbacks = { stop: this.createStopCallback() };
    this.interval = IntervalRunner.createRunner(this.createRunnable(), driveInterval, callbacks);

    // ParallelPort Driver from RTS Java iterates over Lamp-Matrices
    // and initializes them all. As only the column flagged in LAMP_COLUMN
    // is activated, setting this register to zero should be sufficient.
    this.parallelPort.write(Registers.LAMP_COLUMN, BitMasks.DATA_LOW);
}

/**
 * Creates a function to pulse the lamps.
 * Disables the currently active column,
 * sets the new lamp states in part A and B of the matrix row
 * and actives the new column.
 */
LampDriver.prototype.createRunnable = function() {
    var parallelPort = this.parallelPort,
        lampBytes = this.lampBytes;
    var runnable = function Runnable() {
        // Disable old column
        parallelPort.write(Registers.LAMP_COLUMN, BitMasks.DATA_LOW);
        // Prepare new column
        parallelPort.write(Registers.LAMP_ROW_A, lampBytes[Registers.LAMP_ROW_A][Runnable.column]);
        parallelPort.write(Registers.LAMP_ROW_B, lampBytes[Registers.LAMP_ROW_B][Runnable.column]);
        // Activate new column
        parallelPort.write(Registers.LAMP_COLUMN, BitMasks.BITS[Runnable.column]);
        Runnable.column = (Runnable.column + 1) % BitMasks.BYTE;
    };
    runnable.column = 0;
    return runnable;
};

/**
 * Creates a stop callback assuring that lamps are disabled
 * when control software exits.
 */
LampDriver.prototype.createStopCallback = function() {
    var parallelPort = this.parallelPort;
    return function stopCallback() {
        parallelPort.write(Registers.LAMP_COLUMN, BitMasks.DATA_LOW);
    };
};

LampDriver.prototype.start = function() {
    this.interval.start();
};

LampDriver.prototype.stop = function() {
    this.interval.stop();
};

LampDriver.prototype.enableLamp = function(lampName) {
    this.drivers[lampName](BitMasks.enableBit);
};

LampDriver.prototype.disableLamp = function(lampName) {
    this.drivers[lampName](BitMasks.disableBit);
};

LampDriver.prototype.toggleLamp = function(lampName) {
    this.drivers[lampName](BitMasks.toggleBit);
};

module.exports.createBuilder = createBuilder;