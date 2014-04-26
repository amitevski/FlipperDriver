
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + SwitchScanner observes the switches of the flipper.                 +
 + It updates every change to the flipper model.                       +
 +                                                                     +
 + It contains an IntervalRunner which can be controlled with:         +
 +  * start()                                                          +
 +  * stop()                                                           +
 +                                                                     +
 + Switches are organized in registers and a matrix.                   +
 +                                                                     +
 + To create an instance of switch scanner utilize the builder:        +
 +  createBuilder(flipper).bindModel(flipperModel)                     +
 +          .bindPort(parallelPort).build()                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var util = require('util'),

    Exceptions = require('./Exceptions'),
    Registers = require('./Registers'),
    BitMasks = require('./BitMasks'),
    IntervalRunner = require('./IntervalRunner');

/** Creates an instance of SwitchScannerBuilder.
 *
 * @param flipper Flipper structure like described in flipper configuration.
 */
function createBuilder(flipper) {
    if (!(typeof flipper === 'object')) {
        throw new Error(Exceptions.MISSING_CONFIGURATION);
    }
    return new SwitchScannerBuilder(flipper);
}

function SwitchScannerBuilder(flipper) {
    this.flipper = flipper;

    this.switchScanner = null;
    this.flipperModel = null;
    this.parallelPort = null;

    this.registerScannerMapping = {};
    this.matrixScannerMapping = {};
}

SwitchScannerBuilder.prototype.bindModel = function(flipperModel) {
    this.flipperModel = flipperModel;
    return this;
};

SwitchScannerBuilder.prototype.bindPort = function(parallelPort) {
    this.parallelPort = parallelPort;
    return this;
};

SwitchScannerBuilder.prototype.build = function() {
    this.checkBindings();
    this.checkConfiguration();
    var scanInterval = this.flipper.intervals.switches;
    this.switchScanner = new SwitchScanner(scanInterval);
    this.buildMapping();
    this.buildScanners();
    return this.switchScanner;
};

SwitchScannerBuilder.prototype.checkBindings = function() {
    if (!this.flipperModel) {
        throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, 'FlipperModel'));
    }
    if (!this.parallelPort) {
        throw new Error(util.format(Exceptions.MISSING_DEPENDENCY, 'ParallelPort'));
    }
};

SwitchScannerBuilder.prototype.checkConfiguration = function() {
    if (!(typeof this.flipper.intervals.switches === 'number' && this.flipper.intervals.switches > 0)) {
        throw new Error(util.format(Exceptions.BROKEN_CONFIGURATION, 'Flipper.intervals.switches'));
    }
    Object.getOwnPropertyNames(this.flipper.switches).forEach(this.checkSwitchConfiguration, this);
};

SwitchScannerBuilder.prototype.checkSwitchConfiguration = function(switchName) {
    var switchConfig = this.flipper.switches[switchName];
    if (!(switchConfig.hasOwnProperty('register') && switchConfig.hasOwnProperty('index')) &&
            !(switchConfig.hasOwnProperty('column') && switchConfig.hasOwnProperty('row'))) {
        throw new Error(util.format(Exceptions.BROKEN_SWITCH, 'Flipper.switches.' + switchName,
            util.inspect(switchConfig)));
    }
};

SwitchScannerBuilder.prototype.buildMapping = function() {
    Object.getOwnPropertyNames(this.flipper.switches).forEach(this.addEntry, this);
};

/**
 * Distinguishes between register and matrix switches.
 * For a register switch a mapping of switch register
 * and switch index is created, containing the switch name.
 * For a matrix switch a mapping of switch column
 * and switch row is created, containing the switch name.
 *
 * @param switchName Switch name from Switches.
 */
SwitchScannerBuilder.prototype.addEntry = function(switchName) {
    var switchConfig = this.flipper.switches[switchName];
    if (switchConfig.hasOwnProperty('register')) {
        var registerScanner = this.createOrGetEntry(this.registerScannerMapping, switchConfig.register);
        registerScanner[switchConfig.index] = switchName;
    } else if (switchConfig.hasOwnProperty('column')) {
        var matrixScanner = this.createOrGetEntry(this.matrixScannerMapping, switchConfig.column);
        matrixScanner[switchConfig.row] = switchName;
    }
};

SwitchScannerBuilder.prototype.createOrGetEntry = function(mapping, key) {
    if (!mapping.hasOwnProperty(key)) {
        mapping[key] = {};
    }
    return mapping[key];
};

SwitchScannerBuilder.prototype.buildScanners = function() {
    Object.getOwnPropertyNames(this.registerScannerMapping).forEach(this.addRegisterScanner, this);
    Object.getOwnPropertyNames(this.matrixScannerMapping).forEach(this.addMatrixScanner, this);
};

/**
 * Wraps a scanner for one switch register into a function using closure.
 * Returned function can check if any bit of a specific switch register has changed.
 * The flipper model is updated for every change.
 *
 * @param switchRegister Switch register number.
 */
SwitchScannerBuilder.prototype.addRegisterScanner = function(switchRegister) {
    var switchNames = this.registerScannerMapping[switchRegister],
        parallelPort = this.parallelPort,
        register = parseInt(switchRegister, 10),
        onRegisterRead = this.createOnRegisterRead(switchNames);
    this.switchScanner.scanners.push(function RegisterScanner() {
        parallelPort.read(register, onRegisterRead);
    });
};

/**
 * Wraps a scanner for one matrix register into a function using closure.
 * Returned function can check if any bit of a specific switch column has changed.
 * The flipper model is updated for every change.
 *
 * @param switchColumn Switch name from Switches.
 */
SwitchScannerBuilder.prototype.addMatrixScanner = function(switchColumn) {
    var switchNames = this.matrixScannerMapping[switchColumn],
        parallelPort = this.parallelPort,
        bitMask = BitMasks.BITS[switchColumn],
        onRegisterRead = this.createOnRegisterRead(switchNames);
    this.switchScanner.scanners.push(function MatrixScanner() {
        // Selects one row in the switch matrix
        parallelPort.write(Registers.SWITCH_COLUMN, bitMask);
        // Reads the selected row of the switch matrix
        parallelPort.read(Registers.SWITCH_ROW, onRegisterRead);
    });
};

/**
 * Wraps information about one switch byte into a callback function using closure.
 * Returned function checks which bit have changed
 * and updated the corresponding switches in the flipper model.
 *
 * @return Function processing a byte and updating
 * the state of each changed switch bit within the byte.
 */
SwitchScannerBuilder.prototype.createOnRegisterRead = function(switchNames) {
    var model = this.flipperModel,
        names = switchNames;
    return function onRegisterRead(value) {
        var diff = onRegisterRead.oldValue ^ value,
            bit;
        for (bit = 0; bit < BitMasks.BYTE; bit += 1) {
            if ((diff & BitMasks.BITS[bit]) === BitMasks.BITS[bit]) {
                if (names[bit] !== undefined) {
                    model.updateSwitch(names[bit], value & BitMasks.BITS[bit]);
                }
            }
        }
        onRegisterRead.oldValue = value;
    };
};

// ===

function SwitchScanner(scanInterval) {
    this.scanners = [];
    this.interval = IntervalRunner.createRunner(this.createRunnable(), scanInterval);
}

SwitchScanner.prototype.createRunnable = function() {
    var scanners = this.scanners,
        scan = function(scanner) { scanner(); };
    return function Runnable() {
        scanners.forEach(scan);
    };
};


SwitchScanner.prototype.start = function() {
    this.interval.start();
};

SwitchScanner.prototype.stop = function() {
    this.interval.stop();
};

module.exports.createBuilder = createBuilder;