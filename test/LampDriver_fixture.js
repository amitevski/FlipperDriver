
var util = require('util'),
    LampDriver = require('../src/LampDriver'),
    Exceptions = require('../src/Exceptions'),
    Registers = require('../src/Registers'),
    BitMasks = require('../src/BitMasks');

var flipper = {
    intervals: { lamps: 0.5 },
    lamps: {
        // Registers.LAMP_ROW_A: 6
        matrixA1: { matrix: 6, column: 0, row: 0 },
        matrixA2: { matrix: 6, column: 0, row: 1 },
        matrixA3: { matrix: 6, column: 2, row: 2 },
        matrixA4: { matrix: 6, column: 2, row: 4 },
        // Registers.LAMP_ROW_B: 7
        matrixB1: { matrix: 7, column: 1, row: 0 },
        matrixB2: { matrix: 7, column: 1, row: 2 }
    }
};

var Direction = { WRITE: 'write' };

var lDB;

/*
 * Generates new lamp bytes for each test to avoid side effects.
 */
function createTestLampBytes() {
    return {
        // Registers.LAMP_ROW_A: 6
        6: { 0: 0, 2: 0 },
        // Registers.LAMP_ROW_B: 7
        7: { 1: 0 }
    };
}

exports.setUp = function(setUp) {
    lDB = LampDriver.createBuilder(flipper);
    lDB.parallelPort = mockParallelPort();
    lDB.flipperModel = mockFlipperModel();
    setUp();
};

function mockParallelPort() {
    return {
        history: [],
        write: function(register, value) {
            this.history.unshift({ direction: Direction.WRITE, register: register, value: value });
        }
    };
}

function mockFlipperModel() {
    return {
        history: [],
        updateLamp: function(switchName, state) {
            // double negation for cast to boolean
            this.history.unshift({ name: switchName, state: !!state });
        }
    };
}

exports.testBuilder = function(test) {
    var lampDriver = lDB.build();
    test.deepEqual(lampDriver.lampBytes, createTestLampBytes());
    test.equal(getActualDriverCount(), getExpectedDriverCount());
    test.done();
};

function getActualDriverCount() {
    return Object.getOwnPropertyNames(lDB.lampDriver.drivers).length;
}

function getExpectedDriverCount() {
    return Object.getOwnPropertyNames(flipper.lamps).length;
}

exports.testMissingFlipperModel = function(test) {
    lDB.flipperModel = null;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'FlipperModel');
    test.throws(function() { lDB.build(); }, new RegExp(message));
    test.done();
};

exports.testMissingParallelPort = function(test) {
    lDB.parallelPort = null;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'ParallelPort');
    test.throws(function() { lDB.build(); }, new RegExp(message));
    test.done();
};

exports.testCheckLamp = function(test) {
    var message = util.format(Exceptions.BROKEN_LAMP, 'Flipper.lamps.matrixA4');
    test.doesNotThrow(function() { lDB.checkLampConfiguration('matrixA4'); }, new RegExp(message));
    test.done();
};

exports.testCheckBrokenLamp = function(test) {
    lDB.flipper.lamps.brokenLamp = { matrix: 6, column: 1, index: 4 };
    var message = util.format(Exceptions.BROKEN_LAMP, 'Flipper.lamps.brokenLamp', '\\{ matrix: 6, column: 1, index: 4 \\}');
    test.throws(function() { lDB.checkLampConfiguration('brokenLamp'); }, new RegExp(message));
    delete lDB.flipper.lamps.brokenLamp;
    test.done();
};

exports.testCheckIncompleteLamp = function(test) {
    lDB.flipper.lamps.incompleteLamp = { column: 1, row: 4 };
    var message = util.format(Exceptions.BROKEN_LAMP, 'Flipper.lamps.incompleteLamp', '\\{ column: 1, row: 4 \\}');
    test.throws(function() { lDB.checkLampConfiguration('incompleteLamp'); }, new RegExp(message));
    delete lDB.flipper.lamps.incompleteLamp;
    test.done();
};

exports.testCreateLampBytes = function(test) {
    lDB.lampDriver = { lampBytes: {} };
    lDB.buildLampBytes();
    test.deepEqual(lDB.lampDriver.lampBytes, createTestLampBytes());
    test.done();
};

exports.testEnsureNonExistingByte = function(test) {
    lDB.lampDriver = { lampBytes: {} };
    lDB.ensureLampByteIsExisting('matrixA4');
    test.deepEqual(lDB.lampDriver.lampBytes, createLampByte('matrixA4', BitMasks.DATA_LOW));
    test.done();
};

/*
 * Creation of bytes must not overwrite existing ones.
 */
exports.testEnsureExistingByte = function(test) {
    lDB.lampDriver = { lampBytes: createLampByte('matrixA4', BitMasks.DATA_HIGH) };
    lDB.ensureLampByteIsExisting('matrixA4');
    test.deepEqual(lDB.lampDriver.lampBytes, createLampByte('matrixA4', BitMasks.DATA_HIGH));
    test.done();
};

/*
 * Creates lamp bytes with just one entry.
 */
function createLampByte(lampName, value) {
    var lamp = flipper.lamps[lampName];
    var lampBytes = {};
    lampBytes[lamp.matrix] = {};
    lampBytes[lamp.matrix][lamp.column] = value;
    return lampBytes;
}

/*
 * Checks if a driver function was created for each lamp byte.
 */
exports.testCreateDrivers = function(test) {
    lDB.lampDriver = { lampBytes: createTestLampBytes(), drivers: {} };
    lDB.buildDrivers();
    test.expect(getExpectedDriverCount());
    Object.getOwnPropertyNames(lDB.lampDriver.drivers).forEach(function(lampName) {
        test.equal(typeof lDB.lampDriver.drivers[lampName], 'function');
    });
    test.done();
};

/*
 * Generates one lamp driver and calls it with a mock
 * for a bit operation as declared in BitMasks module.
 */
exports.testAddLampDriver = function(test) {
    lDB.lampDriver = { lampBytes: createTestLampBytes(), drivers: {}, flipperModel: lDB.flipperModel };
    lDB.addLampDriver('matrixA4');
    test.equal(getActualDriverCount(), 1);
    lDB.lampDriver.drivers.matrixA4(function bitOperationMock(value, bitMask) {
        test.equal(value, BitMasks.DATA_LOW);
        // Bit representing the row of lamp matrixA4 should be set to high.
        test.equal(bitMask, 1 << flipper.lamps.matrixA4.row);
    });
    test.done();
};

/*
 * Generates one lamp driver and calls it with the original
 * bit operations as declared in BitMasks module.
 * Checks if driver updates flipper model mock correctly.
 */
exports.testFlipperModelUpdateLamp = function(test) {
    lDB.lampDriver = { lampBytes: createTestLampBytes(), drivers: {}, flipperModel: lDB.flipperModel };
    lDB.addLampDriver('matrixA4');
    lDB.lampDriver.drivers.matrixA4(BitMasks.enableBit);
    lDB.lampDriver.drivers.matrixA4(BitMasks.disableBit);
    test.deepEqual(lDB.flipperModel.history[1], { name: 'matrixA4', state: true });
    test.deepEqual(lDB.flipperModel.history[0], { name: 'matrixA4', state: false });
    test.done();
};

// ===

exports.testEnableLamp = function(test) {
    lDB.build();
    setLampByte('matrixA4', BitMasks.DATA_LOW);
    lDB.lampDriver.enableLamp('matrixA4');
    test.equals(BitMasks.BITS[flipper.lamps.matrixA4.row], getLampByte('matrixA4'));
    test.done();
};

/*
 * Re-enabling should not change lamp state.
 */
exports.testReEnableLamp = function(test) {
    lDB.build();
    setLampByte('matrixA4', BitMasks.BITS[flipper.lamps.matrixA4.row]);
    lDB.lampDriver.enableLamp('matrixA4');
    test.equals(BitMasks.BITS[flipper.lamps.matrixA4.row], getLampByte('matrixA4'));
    test.done();
};

exports.testDisableLamp = function(test) {
    lDB.build();
    setLampByte('matrixA4', BitMasks.DATA_HIGH);
    lDB.lampDriver.disableLamp('matrixA4');
    test.equals(BitMasks.DATA_HIGH ^ BitMasks.BITS[flipper.lamps.matrixA4.row], getLampByte('matrixA4'));
    test.done();
};

/*
 * Re-disabling should not change lamp state.
 */
exports.testReDisableLamp = function(test) {
    lDB.build();
    setLampByte('matrixA4', BitMasks.DATA_HIGH ^ BitMasks.BITS[flipper.lamps.matrixA4.row]);
    lDB.lampDriver.disableLamp('matrixA4');
    test.equals(BitMasks.DATA_HIGH ^ BitMasks.BITS[flipper.lamps.matrixA4.row], getLampByte('matrixA4'));
    test.done();
};

exports.testToggleActiveLamp = function(test) {
    lDB.build();
    setLampByte('matrixA4', BitMasks.DATA_HIGH);
    lDB.lampDriver.toggleLamp('matrixA4');
    test.equals(BitMasks.DATA_HIGH ^ BitMasks.BITS[flipper.lamps.matrixA4.row], getLampByte('matrixA4'));
    test.done();
};

exports.testToggleInactiveLamp = function(test) {
    lDB.build();
    setLampByte('matrixA4', BitMasks.DATA_LOW);
    lDB.lampDriver.toggleLamp('matrixA4');
    test.equals(BitMasks.BITS[flipper.lamps.matrixA4.row], getLampByte('matrixA4'));
    test.done();
};

function getLampByte(lampName) {
    var lampConfig = flipper.lamps[lampName];
    return lDB.lampDriver.lampBytes[lampConfig.matrix][lampConfig.column];
}

function setLampByte(lampName, value) {
    var lampConfig = flipper.lamps[lampName];
    lDB.lampDriver.lampBytes[lampConfig.matrix][lampConfig.column] = value;
}

/*
 * Initialization must set register LAMP_COLUMN to zero.
 */
exports.testInitialization = function(test) {
    lDB.build();
    lDB.lampDriver.interval.runnable = function() {};
    lDB.lampDriver.interval.start();
    test.deepEqual(lDB.parallelPort.history[0], { direction: Direction.WRITE, register: Registers.LAMP_COLUMN, value: BitMasks.DATA_LOW });
    lDB.lampDriver.interval.stop();
    test.done();
};

/*
 * Stop hook must set register LAMP_COLUMN to zero.
 */
exports.testStopCallback = function(test) {
    lDB.build();
    lDB.lampDriver.interval.runnable = function() {};
    lDB.lampDriver.interval.start();
    // Empties history array to get rid of initialization
    lDB.parallelPort.history.length = 0;
    lDB.lampDriver.interval.stop();
    test.deepEqual(lDB.parallelPort.history[0], { direction: Direction.WRITE, register: Registers.LAMP_COLUMN, value: BitMasks.DATA_LOW });
    test.done();
};