
var util = require('util'),

    SwitchScanner = require('../src/SwitchScanner'),
    Exceptions = require('../src/Exceptions'),
    Registers = require('../src/Registers'),
    BitMasks = require('../src/BitMasks');

var flipper = {
    intervals: { switches: 1.0 },
    switches: {
        matrix1: { column: 0, row: 0 },
        matrix2: { column: 0, row: 1 },
        matrix3: { column: 2, row: 2 },
        matrix4: { column: 2, row: 4 },
        register1: { register: 1, index: 0 },
        register2: { register: 1, index: 2 }
    }
};

var registerScannerMapping = {
    // gaps are on purpose
    1: { 0: 'register1', 2: 'register2' }
};

var matrixScannerMapping = {
    // gaps are on purpose
    0: { 0: 'matrix1', 1: 'matrix2' },
    2: { 2: 'matrix3', 4: 'matrix4' }
};

var Direction = { READ: 'read', WRITE: 'write' };

var sSB;

exports.setUp = function(setUp) {
    sSB = SwitchScanner.createBuilder(flipper);
    sSB.parallelPort = mockParallelPort();
    sSB.flipperModel = mockFlipperModel();
    setUp();
};

function mockParallelPort() {
    return {
        history: [],
        returnValue: BitMasks.DATA_LOW,
        write: function(register, value) {
            this.history.unshift({ direction: Direction.WRITE, register: register, value: value });
        },
        read: function(register, callback) {
            this.history.unshift({ direction: Direction.READ, register: register });
            callback(this.returnValue);
        }
    };
}

function mockFlipperModel() {
    return {
        history: [],
        updateSwitch: function(switchName, state) {
            // double negation for cast to boolean
            this.history.unshift({ name: switchName, state: !!state });
        }
    };
}

exports.testBuilder = function(test) {
    var switchScanner = sSB.build();
    test.deepEqual(sSB.registerScannerMapping, registerScannerMapping);
    test.deepEqual(sSB.matrixScannerMapping, matrixScannerMapping);
    test.equal(switchScanner.scanners.length, getExpectedScannerCount());
    test.done();
};

function getExpectedScannerCount() {
    return Object.getOwnPropertyNames(registerScannerMapping).length +
        Object.getOwnPropertyNames(matrixScannerMapping).length;
}

exports.testMissingFlipperModel = function(test) {
    sSB.flipperModel = null;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'FlipperModel');
    test.throws(function() { sSB.build(); }, new RegExp(message));
    test.done();
};

exports.testMissingParallelPort = function(test) {
    sSB.parallelPort = null;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'ParallelPort');
    test.throws(function() { sSB.build(); }, new RegExp(message));
    test.done();
};

exports.testCheckRegisterSwitch = function(test) {
    var message = util.format(Exceptions.BROKEN_SWITCH, 'Flipper.switches.register2');
    test.doesNotThrow(function() { sSB.checkSwitchConfiguration('register2'); }, new RegExp(message));
    test.done();
};

exports.testCheckMatrixSwitch = function(test) {
    var message = util.format(Exceptions.BROKEN_SWITCH, 'Flipper.switches.matrix4');
    test.doesNotThrow(function() { sSB.checkSwitchConfiguration('matrix4'); }, new RegExp(message));
    test.done();
};

exports.testBrokenSwitch = function(test) {
    sSB.flipper.switches.brokenSwitch = { column: 1, index: 4 };
    var message = util.format(Exceptions.BROKEN_SWITCH, 'Flipper.switches.brokenSwitch', '\\{ column: 1, index: 4 \\}');
    test.throws(function() { sSB.checkSwitchConfiguration('brokenSwitch'); }, new RegExp(message));
    delete sSB.flipper.switches.brokenSwitch;
    test.done();
};

exports.testIncompleteRegisterSwitch = function(test) {
    sSB.flipper.switches.incompleteRegister = { register: 1 };
    var message = util.format(Exceptions.BROKEN_SWITCH, 'Flipper.switches.incompleteRegister', '\\{ register: 1 \\}');
    test.throws(function() { sSB.checkSwitchConfiguration('incompleteRegister'); }, new RegExp(message));
    delete sSB.flipper.switches.incompleteRegister;
    test.done();
};

exports.testIncompleteMatrixSwitch = function(test) {
    sSB.flipper.switches.incompleteMatrix = { column: 1 };
    var message = util.format(Exceptions.BROKEN_SWITCH, 'Flipper.switches.incompleteMatrix', '\\{ column: 1 \\}');
    test.throws(function() { sSB.checkSwitchConfiguration('incompleteMatrix'); }, new RegExp(message));
    delete sSB.flipper.switches.incompleteMatrix;
    test.done();
};

exports.testCreateMapping = function(test) {
    sSB.buildMapping();
    test.deepEqual(sSB.registerScannerMapping, registerScannerMapping);
    test.deepEqual(sSB.matrixScannerMapping, matrixScannerMapping);
    test.done();
};

exports.testCreateRegisterEntry = function(test) {
    sSB.addEntry('register2');
    var registerSwitch = flipper.switches.register2;
    test.equal(sSB.registerScannerMapping[registerSwitch.register][registerSwitch.index], 'register2');
    test.done();
};

exports.testCreateMatrixEntry = function(test) {
    sSB.addEntry('matrix4');
    var matrixSwitch = flipper.switches.matrix4;
    test.equal(sSB.matrixScannerMapping[matrixSwitch.column][matrixSwitch.row], 'matrix4');
    test.done();
};

/**
 * Checks if requesting an existing entry of the map return
 * a reference to it.
 */
exports.testCreateOrGetExistingEntry = function(test) {
    var mapping = { existingKey: {} };
    var entry = sSB.createOrGetEntry(mapping, 'existingKey');
    entry[0] = 'existingKeyValue';
    test.deepEqual(mapping, { existingKey: { 0: 'existingKeyValue' } });
    test.done();
};

/**
 * Checks if requesting an non existing entry of the map creates
 * and returns a new entry.
 */
exports.testCreateOrGetNonExistingEntry = function(test) {
    var mapping = { existingKey: {} };
    var entry = sSB.createOrGetEntry(mapping, 'nonExistingKey');
    entry[0] = 'nonExistingKeyValue';
    test.deepEqual(mapping, { existingKey: {}, nonExistingKey: { 0: 'nonExistingKeyValue' } });
    test.done();
};

/*
 * Checks if a scanner function was created for each switch register and each switch column.
 */
exports.testCreateScanners = function(test) {
    sSB.switchScanner = { scanners: [] };
    sSB.registerScannerMapping = registerScannerMapping;
    sSB.matrixScannerMapping = matrixScannerMapping;
    sSB.buildScanners();
    test.expect(getExpectedScannerCount());
    sSB.switchScanner.scanners.forEach(function(scanner) { test.equal(typeof scanner, 'function'); });
    test.done();
};

/*
 * Generates one register switch scanner.
 * Callback creation function is mocked to inject a validation function.
 */
exports.testAddRegisterScanner = function(test) {
    sSB.switchScanner = { parallelPort: sSB.parallelPort, scanners: [] };
    sSB.registerScannerMapping = registerScannerMapping;
    sSB.createOnRegisterRead = mockCreateOnRegisterRead(test);
    var register = flipper.switches.register2.register;
    sSB.addRegisterScanner(register);
    test.done();
};

/*
 * Generates one matrix switch scanner.
 * Callback creation function is mocked to inject a validation function.
 */
exports.testAddMatrixScanner = function(test) {
    sSB.switchScanner = { parallelPort: sSB.parallelPort, scanners: [] };
    sSB.matrixScannerMapping = matrixScannerMapping;
    sSB.createOnRegisterRead = mockCreateOnRegisterRead(test);
    var column = flipper.switches.matrix4.column;
    sSB.addMatrixScanner(column);
    test.done();
};

/*
 * Mock for callback creating function.
 * Used to check if callback creation is called with correct switch names.
 */
function mockCreateOnRegisterRead(test) {
    return function createOnRegisterRead(eventNames) {
        var switchNames = Object.getOwnPropertyNames(flipper.switches);
        Object.getOwnPropertyNames(eventNames).forEach(function(bit) {
            test.ok(switchNames.indexOf(eventNames[bit]) > -1);
        });
    };
}

/*
 * Generates one register switch scanner.
 * Checks if parallel port access is according to flipper communication protocol.
 */
exports.testRegisterScannerParallelPortAccess = function(test) {
    sSB.switchScanner = { parallelPort: sSB.parallelPort, scanners: [] };
    sSB.registerScannerMapping = registerScannerMapping;
    sSB.addRegisterScanner(flipper.switches.register2.register);
    sSB.switchScanner.scanners[0]();
    test.deepEqual(sSB.parallelPort.history[0], { direction: Direction.READ, register: flipper.switches.register2.register });
    test.done();
};

/*
 * Generates one matrix switch scanner.
 * Checks if parallel port access is according to flipper communication protocol.
 */
exports.testMatrixScannerParallelPortAccess = function(test) {
    sSB.switchScanner = { parallelPort: sSB.parallelPort, scanners: [] };
    sSB.matrixScannerMapping = matrixScannerMapping;
    sSB.addMatrixScanner(flipper.switches.matrix4.column);
    sSB.switchScanner.scanners[0]();
    test.deepEqual(sSB.parallelPort.history[1], { direction: Direction.WRITE, register: Registers.SWITCH_COLUMN, value: BitMasks.BITS[flipper.switches.matrix4.column] });
    test.deepEqual(sSB.parallelPort.history[0], { direction: Direction.READ, register: Registers.SWITCH_ROW });
    test.done();
};

/*
 * Checks if register read callback of scanner updates
 * the flipper model when switch states are changed.
 * Activates switch matrix3.
 */
exports.testCallbackTriggerSwitch3 = function(test) {
    var column = flipper.switches.matrix4.column;
    var callback = createCallbackForMatrixRow(column);
    callback(BitMasks.BITS[flipper.switches.matrix3.row]);
    test.deepEqual(sSB.flipperModel.history[0], { name: 'matrix3', state: true });
    test.done();
};

/*
 * Checks if register read callback of scanner updates
 * the flipper model when switch states are changed.
 * Activates switch matrix3 and switch matrix4.
 */
exports.testCallbackTriggerSwitch4 = function(test) {
    var column = flipper.switches.matrix4.column;
    var callback = createCallbackForMatrixRow(column);
    callback(BitMasks.BITS[flipper.switches.matrix3.row]);
    callback(BitMasks.BITS[flipper.switches.matrix3.row] | BitMasks.BITS[flipper.switches.matrix4.row]);
    test.deepEqual(sSB.flipperModel.history[1], { name: 'matrix3', state: true });
    test.deepEqual(sSB.flipperModel.history[0], { name: 'matrix4', state: true });
    test.done();
};

/*
 * Checks if register read callback of scanner updates
 * the flipper model when switch states are changed.
 * Activates switch matrix3 and switch matrix4, then deactivate switch matrix4.
 */
exports.testCallbackReleaseSwitch4 = function(test) {
    var column = flipper.switches.matrix4.column;
    var callback = createCallbackForMatrixRow(column);
    callback(BitMasks.BITS[flipper.switches.matrix3.row]);
    callback(BitMasks.BITS[flipper.switches.matrix3.row] | BitMasks.BITS[flipper.switches.matrix4.row]);
    callback(BitMasks.BITS[flipper.switches.matrix3.row]);
    test.deepEqual(sSB.flipperModel.history[2], { name: 'matrix3', state: true });
    test.deepEqual(sSB.flipperModel.history[1], { name: 'matrix4', state: true });
    test.deepEqual(sSB.flipperModel.history[0], { name: 'matrix4', state: false });
    test.done();
};

/*
 * Uses the original callback creation function of builder to create one callback.
 */
function createCallbackForMatrixRow(column) {
    var bitEventNameMapping = matrixScannerMapping[column];
    return sSB.createOnRegisterRead(bitEventNameMapping);
}

// ===

exports.testTriggerScanner = function(test) {
    mockSwitchScannerWithOneScanner('matrix4');
    sSB.parallelPort.returnValue = BitMasks.BITS[flipper.switches.matrix4.row];
    sSB.switchScanner.scanners[0]();
    test.deepEqual(sSB.flipperModel.history[0], { name: 'matrix4', state: true });
    test.done();
};

exports.testTriggerScannerTwice = function(test) {
    mockSwitchScannerWithOneScanner('matrix4');
    sSB.parallelPort.returnValue = BitMasks.BITS[flipper.switches.matrix4.row];
    sSB.switchScanner.scanners[0]();
    sSB.parallelPort.returnValue = BitMasks.DATA_LOW;
    sSB.switchScanner.scanners[0]();
    test.deepEqual(sSB.flipperModel.history[1], { name: 'matrix4', state: true });
    test.deepEqual(sSB.flipperModel.history[0], { name: 'matrix4', state: false });
    test.done();
};

function mockSwitchScannerWithOneScanner(switchName) {
    sSB.build();
    sSB.switchScanner.scanners.length = 0; // Empties the scanner array filled by the builder
    sSB.addMatrixScanner(flipper.switches[switchName].column);
}