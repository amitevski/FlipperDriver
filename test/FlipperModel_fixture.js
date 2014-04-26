
var FlipperModel = require('../src/FlipperModel'),
    BitMasks = require('../src/BitMasks');

var flipper = {
    solenoids: {
        solenoid1: { register: 1, index: 0, duration: 10 },
        solenoid2: { register: 1, index: 1, duration: 10 },
        solenoid3: { register: 2, index: 2, duration: 10 },
        solenoid4: { register: 2, index: 4, duration: 40 }
    },
    switches: {
        matrix1: { column: 0, row: 0 },
        matrix2: { column: 0, row: 1 },
        matrix3: { column: 2, row: 2 },
        matrix4: { column: 2, row: 4 },
        register1: { register: 1, index: 0 },
        register2: { register: 1, index: 2 }
    },
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

var fMB;

/*
 * Generates new model for each test to avoid side effects.
 */
function createModel() {
    return {
        solenoids: { solenoid1: false, solenoid2: false, solenoid3: false, solenoid4: false },
        switches: { matrix1: false, matrix2: false,  matrix3: false, matrix4: false, register1: false, register2: false },
        lamps: { matrixA1: false, matrixA2: false, matrixA3: false, matrixA4: false, matrixB1: false, matrixB2: false }
    };
}

/*
 * Generates new events for each test to avoid side effects.
 */
function createEvents() {
    return {
        down: {
            matrix1: { name: 'matrix1', state: true },
            matrix2: { name: 'matrix2', state: true },
            matrix3: { name: 'matrix3', state: true },
            matrix4: { name: 'matrix4', state: true },
            register1: { name: 'register1', state: true },
            register2: { name: 'register2', state: true }
        },
        up: {
            matrix1: { name: 'matrix1', state: false },
            matrix2: { name: 'matrix2', state: false },
            matrix3: { name: 'matrix3', state: false },
            matrix4: { name: 'matrix4', state: false },
            register1: { name: 'register1', state: false },
            register2: { name: 'register2', state: false }
        }
    };
}

exports.setUp = function(setUp) {
    fMB = FlipperModel.createBuilder(flipper);
    setUp();
};

exports.testBuildInitialStates = function(test) {
    fMB.flipperModel = { model: { switches: {}, solenoids: {}, lamps: {} } };
    fMB.buildInitialStates();
    test.deepEqual(fMB.flipperModel.model, createModel());
    test.done();
};

exports.testBuildEvents = function(test) {
    fMB.flipperModel = { events: { down: {}, up: {} } };
    fMB.buildEvents();
    test.deepEqual(fMB.flipperModel.events, createEvents());
    test.done();
};

// ===

exports.testUpdateSwitch = function(test) {
    fMB.build();
    fMB.flipperModel.updateSwitch('matrix4', true);
    var model = createModel();
    model.switches.matrix4 = true;
    test.deepEqual(fMB.flipperModel.model, model);
    test.done();
};

exports.testUpdateSolenoid = function(test) {
    fMB.build();
    fMB.flipperModel.updateSolenoid('solenoid4', true);
    var model = createModel();
    model.solenoids.solenoid4 = true;
    test.deepEqual(fMB.flipperModel.model, model);
    test.done();
};

exports.testUpdateLamp = function(test) {
    fMB.build();
    fMB.flipperModel.updateLamp('matrixA4', true);
    var model = createModel();
    model.lamps.matrixA4 = true;
    test.deepEqual(fMB.flipperModel.model, model);
    test.done();
};

/*
 * Checks if switch update state is cast to boolean to keep model data clean.
 */
exports.testUpdateSwitchTypeCast = function(test) {
    fMB.build();
    // uses a bit mask i.e. an integer as new state
    fMB.flipperModel.updateSwitch('matrix4', BitMasks.BITS[flipper.switches.matrix4.row]);
    test.strictEqual(fMB.flipperModel.model.switches.matrix4, true);
    fMB.flipperModel.updateSwitch('matrix4', BitMasks.DATA_LOW);
    test.strictEqual(fMB.flipperModel.model.switches.matrix4, false);
    test.done();
};

/*
 * Checks if solenoid update state is cast to boolean to keep model data clean.
 */
exports.testUpdateSolenoidTypeCast = function(test) {
    fMB.build();
    // uses a bit mask i.e. an integer as new state
    fMB.flipperModel.updateSolenoid('solenoid4', BitMasks.BITS[flipper.solenoids.solenoid4.index]);
    test.strictEqual(fMB.flipperModel.model.solenoids.solenoid4, true);
    fMB.flipperModel.updateSolenoid('solenoid4', BitMasks.DATA_LOW);
    test.strictEqual(fMB.flipperModel.model.solenoids.solenoid4, false);
    test.done();
};

/*
 * Checks if lamp update state is cast to boolean to keep model data clean.
 */
exports.testUpdateLampTypeCast = function(test) {
    fMB.build();
    // uses a bit mask i.e. an integer as new state
    fMB.flipperModel.updateLamp('matrixA4', BitMasks.BITS[flipper.lamps.matrixA4.row]);
    test.strictEqual(fMB.flipperModel.model.lamps.matrixA4, true);
    fMB.flipperModel.updateLamp('matrixA4', BitMasks.DATA_LOW);
    test.strictEqual(fMB.flipperModel.model.lamps.matrixA4, false);
    test.done();
};

exports.testEmitTriggerSwitch3 = function(test) {
    fMB.build();
    var emitHistory = [];
    collectSwitchEvents(emitHistory);
    fMB.flipperModel.updateSwitch('matrix3', true);
    test.deepEqual(emitHistory[0], { name: 'matrix3', state: true });
    fMB.flipperModel.removeAllListeners();
    test.done();
};

exports.testEmitTriggerSwitch4 = function(test) {
    fMB.build();
    var emitHistory = [];
    collectSwitchEvents(emitHistory);
    fMB.flipperModel.updateSwitch('matrix3', true);
    fMB.flipperModel.updateSwitch('matrix4', true);
    test.deepEqual(emitHistory[1], { name: 'matrix3', state: true });
    test.deepEqual(emitHistory[0], { name: 'matrix4', state: true });
    fMB.flipperModel.removeAllListeners();
    test.done();
};

exports.testEmitReleaseSwitch4 = function(test) {
    fMB.build();
    var emitHistory = [];
    collectSwitchEvents(emitHistory);
    fMB.flipperModel.updateSwitch('matrix3', true);
    fMB.flipperModel.updateSwitch('matrix4', true);
    fMB.flipperModel.updateSwitch('matrix4', false);
    test.deepEqual(emitHistory[2], { name: 'matrix3', state: true });
    test.deepEqual(emitHistory[1], { name: 'matrix4', state: true });
    test.deepEqual(emitHistory[0], { name: 'matrix4', state: false });
    fMB.flipperModel.removeAllListeners();
    test.done();
};

var collectSwitchEvents = function(emittedEvents) {
    var switchNames = Object.getOwnPropertyNames(flipper.switches);
    switchNames.forEach(function (switchName) {
        fMB.flipperModel.on(switchName, function(event, model) {
            emittedEvents.unshift({ name: event.name, state: event.state });
        });
    });
};


