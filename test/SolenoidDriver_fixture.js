
var util = require('util'),

    SolenoidDriver = require('../src/SolenoidDriver'),
    Exceptions = require('../src/Exceptions'),
    BitMasks = require('../src/BitMasks'),
    Registers = require('../src/Registers'),
    Relay = require('../src/Relay');

var flipper = {
    solenoids: {
        solenoid1: { register: 1, index: 0, duration: 10 },
        solenoid2: { register: 1, index: 1, duration: 0 },
        solenoid3: { register: 2, index: 2, duration: 10 },
        solenoid4: { register: 2, index: 4, duration: 40 }
    }
};

var Direction = { READ: 'read', WRITE: 'write' };

var sDB;

/*
 * Generates new solenoid bytes for each test to avoid side effects.
 */
function createTestSolenoidBytes() { return { 1: 0, 2: 0 }; }

exports.setUp = function(setUp) {
    sDB = SolenoidDriver.createBuilder(flipper);
    sDB.parallelPort = mockParallelPort();
    sDB.flipperModel = mockFlipperModel();
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
        updateSolenoid: function(switchName, state) {
            // double negation for cast to boolean
            this.history.unshift({ name: switchName, state: !!state });
        }
    };
}

exports.testBuilder = function(test) {
    var solenoidDriver = sDB.build();
    test.deepEqual(solenoidDriver.solenoidBytes, createTestSolenoidBytes());
    test.equal(getActualDriverCount(), getExpectedDriverCount());
    test.done();
};

function getActualDriverCount() {
    return Object.getOwnPropertyNames(sDB.solenoidDriver.drivers).length;
}

function getExpectedDriverCount() {
    return Object.getOwnPropertyNames(flipper.solenoids).length;
}

exports.testMissingFlipperModel = function(test) {
    sDB.flipperModel = null;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'FlipperModel');
    test.throws(function() { sDB.build(); }, new RegExp(message));
    test.done();
};

exports.testMissingParallelPort = function(test) {
    sDB.parallelPort = null;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'ParallelPort');
    test.throws(function() { sDB.build(); }, new RegExp(message));
    test.done();
};

exports.testCheckSolenoid = function(test) {
    var message = util.format(Exceptions.BROKEN_SOLENOID, 'Flipper.solenoids.solenoid4');
    test.doesNotThrow(function() { sDB.checkSolenoidConfiguration('solenoid4'); }, new RegExp(message));
    test.done();
};

exports.testCheckBrokenSolenoid = function(test) {
    sDB.flipper.solenoids.brokenSolenoid = { register: 1, row: 4, duration: 20 };
    var message = util.format(Exceptions.BROKEN_SOLENOID, 'Flipper.solenoids.brokenSolenoid', '\\{ register: 1, row: 4, duration: 20 \\}');
    test.throws(function() { sDB.checkSolenoidConfiguration('brokenSolenoid'); }, new RegExp(message));
    delete sDB.flipper.solenoids.brokenSolenoid;
    test.done();
};

exports.testCheckIncompleteSolenoid = function(test) {
    sDB.flipper.solenoids.incompleteSolenoid = { register: 1, row: 4 };
    var message = util.format(Exceptions.BROKEN_SOLENOID, 'Flipper.solenoids.incompleteSolenoid', '\\{ register: 1, row: 4 \\}');
    test.throws(function() { sDB.checkSolenoidConfiguration('incompleteSolenoid'); }, new RegExp(message));
    delete sDB.flipper.solenoids.incompleteSolenoid;
    test.done();
};

exports.testCreateSolenoidBytes = function(test) {
    sDB.solenoidDriver = { solenoidBytes: {} };
    sDB.buildSolenoidBytes();
    test.deepEqual(sDB.solenoidDriver.solenoidBytes, createTestSolenoidBytes());
    test.done();
};

exports.testEnsureNonExistingByte = function(test) {
    sDB.solenoidDriver = { solenoidBytes: {} };
    sDB.ensureSolenoidByteIsExisting('solenoid4');
    test.deepEqual(sDB.solenoidDriver.solenoidBytes, createSolenoidByte('solenoid4', BitMasks.DATA_LOW));
    test.done();
};

/*
 * Creation of bytes must not overwrite existing ones.
 */
exports.testEnsureExistingByte = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createSolenoidByte('solenoid4', BitMasks.DATA_HIGH) };
    sDB.ensureSolenoidByteIsExisting('solenoid4');
    test.deepEqual(sDB.solenoidDriver.solenoidBytes, createSolenoidByte('solenoid4', BitMasks.DATA_HIGH));
    test.done();
};

/*
 * Creates solenoid bytes with just one entry.
 */
function createSolenoidByte(solenoidName, value) {
    var solenoid = flipper.solenoids[solenoidName];
    var solenoidBytes = {};
    solenoidBytes[solenoid.register] = value;
    return solenoidBytes;
}

/*
 * Checks if a driver function was created for each solenoid byte.
 */
exports.testCreateDrivers = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), drivers: {} };
    sDB.buildDrivers();
    test.expect(getExpectedDriverCount());
    Object.getOwnPropertyNames(sDB.solenoidDriver.drivers).forEach(function(solenoidName) {
        test.equal(typeof sDB.solenoidDriver.drivers[solenoidName], 'function');
    });
    test.done();
};

/*
 * Generates one solenoid driver and calls it with a mock
 * for a bit operation as declared in BitMasks module.
 */
exports.testAddSolenoidDriver = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), drivers: {}, flipperModel: sDB.flipperModel };
    sDB.addSolenoidDriver('solenoid4');
    test.equal(getActualDriverCount(), 1);
    sDB.solenoidDriver.drivers.solenoid4(function bitOperationMock(value, bitMask) {
        test.equal(value, BitMasks.DATA_LOW);
        // Bit representing the index of solenoid solenoid4 should be set to high.
        test.equal(bitMask, 1 << flipper.solenoids.solenoid4.index);
    });
    test.done();
};

/*
 * Checks if driver writes to the correct register values for activation
 * and subsequently deactivation of the solenoid.
 */
exports.testSolenoidDriverParallelPortAccess = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), parallelPort: sDB.parallelPort, drivers: [] };
    sDB.addSolenoidDriver('solenoid4');
    sDB.solenoidDriver.drivers.solenoid4(BitMasks.enableBit);
    var register = flipper.solenoids.solenoid4.register;
    var bitMask = BitMasks.BITS[flipper.solenoids.solenoid4.index];
    test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: bitMask });
    // Assure that deactivation did not happen yet
    test.equal(sDB.parallelPort.history.length, 1);
    setTimeout(function() {
        test.deepEqual(sDB.parallelPort.history[1], { direction: Direction.WRITE, register: register, value: bitMask });
        test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: BitMasks.DATA_LOW });
        test.done();
    }, flipper.solenoids.solenoid4.duration * 1.5);
};

/*
 * Checks if driver updates the flipper model when activating
 * and subsequently deactivating the solenoid.
 */
exports.testFlipperModelUpdateSolenoid = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), drivers: [], flipperModel: sDB.flipperModel };
    sDB.addSolenoidDriver('solenoid4');
    sDB.solenoidDriver.drivers.solenoid4(BitMasks.enableBit);
    test.deepEqual(sDB.flipperModel.history[0], { name: 'solenoid4', state: true });
    // Assure that deactivation did not happen yet
    test.equal(sDB.parallelPort.history.length, 1);
    setTimeout(function() {
        test.deepEqual(sDB.flipperModel.history[1], { name: 'solenoid4', state: true });
        test.deepEqual(sDB.flipperModel.history[0], { name: 'solenoid4', state: false });
        test.done();
    }, flipper.solenoids.solenoid4.duration * 1.5);
};

/*
 * Tests if driver does re-activate a solenoid.
 * Checks if additional calls of the driver does not cause
 * additional parallel port communication.
 */
exports.testProtectionFromReEnablingSolenoidWhileActive = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), drivers: [], flipperModel: sDB.flipperModel };
    sDB.addSolenoidDriver('solenoid4');
    sDB.solenoidDriver.drivers.solenoid4(BitMasks.enableBit);
    setTimeout(function () {
        sDB.solenoidDriver.drivers.solenoid4();
    }, flipper.solenoids.solenoid4.duration * 0.5);
    setTimeout(function() {
        var register = flipper.solenoids.solenoid4.register;
        var bitMask = BitMasks.BITS[flipper.solenoids.solenoid4.index];
        test.equal(2, sDB.parallelPort.history.length);
        test.deepEqual(sDB.parallelPort.history[1], { direction: Direction.WRITE, register: register, value: bitMask });
        test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: BitMasks.DATA_LOW });
        test.done();
    }, flipper.solenoids.solenoid4.duration * 2.5);
};

/*
 * Checks if driver writes deactivation of solenoid at once
 * and that no second timed deactivation will follow.
 */
exports.testSolenoidDriverManualDisable = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), parallelPort: sDB.parallelPort, drivers: [] };
    sDB.addSolenoidDriver('solenoid4');
    sDB.solenoidDriver.drivers.solenoid4(BitMasks.enableBit);
    sDB.solenoidDriver.drivers.solenoid4(BitMasks.disableBit);
    var register = flipper.solenoids.solenoid4.register;
    var bitMask = BitMasks.BITS[flipper.solenoids.solenoid4.index];
    test.deepEqual(sDB.parallelPort.history[1], { direction: Direction.WRITE, register: register, value: bitMask });
    test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: BitMasks.DATA_LOW });
    setTimeout(function() {
        // Assure that no second deactivation did not happen
        test.equal(sDB.parallelPort.history.length, 2);
        test.done();
    }, flipper.solenoids.solenoid4.duration * 1.5);
};

/*
 * Checks if hold solenoids with no duration are active permanently.
 */
exports.testNoDeactivationOfHoldSolenoid = function(test) {
    sDB.solenoidDriver = { solenoidBytes: createTestSolenoidBytes(), parallelPort: sDB.parallelPort, drivers: [] };
    sDB.addSolenoidDriver('solenoid2');
    // Solenoid solenoid2 has duration of 0
    sDB.solenoidDriver.drivers.solenoid2(BitMasks.enableBit);
    var register = flipper.solenoids.solenoid2.register;
    var bitMask = BitMasks.BITS[flipper.solenoids.solenoid2.index];
    test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: bitMask });
    setTimeout(function() {
        // Assure that deactivation did not happen
        test.equal(sDB.parallelPort.history.length, 1);
        test.done();
    }, 40 * 1.5);
};

// ===

/*
 * Initialization must set all solenoid registers present in flipper to zero.
 */
exports.testInitialization = function(test) {
    sDB.build();
    var registerWriteLog = [
        { direction: Direction.WRITE, register: Registers.SOLENOID_GROUP_A, value: BitMasks.DATA_LOW },
        { direction: Direction.WRITE, register: Registers.SOLENOID_GROUP_B, value: BitMasks.DATA_LOW },
        { direction: Direction.WRITE, register: Registers.SOLENOID_GROUP_C, value: BitMasks.DATA_LOW },
        { direction: Direction.WRITE, register: Registers.SOLENOID_GROUP_D, value: BitMasks.DATA_LOW },
        { direction: Direction.WRITE, register: Registers.SOLENOID_FLIPPER, value: BitMasks.DATA_LOW },
        { direction: Direction.WRITE, register: Registers.SOLENOID_LOGIC, value: BitMasks.DATA_LOW }
    ];
    deepEqualWithNoOrder(test, sDB.parallelPort.history, registerWriteLog);
    test.done();
};

function deepEqualWithNoOrder(test, actual, expected) {
    test.deepEqual(actual.sort(compareRegister), expected.sort(compareRegister));
}

function compareRegister(entry1, entry2) {
    return entry1.register - entry2.register;
}

exports.testStart = function(test) {
    mockPowerRelayAndHealthLed();
    sDB.build();
    sDB.solenoidDriver.start();
    var register = sDB.flipper.solenoids[Relay.HEALTH_LED].register;
    var value = getBitValueOfSolenoid(Relay.HEALTH_LED) | getBitValueOfSolenoid(Relay.POWER_RELAY_CONTROL);
    test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: value });
    test.done();
};

exports.testStop = function(test) {
    mockPowerRelayAndHealthLed();
    sDB.build();
    sDB.solenoidDriver.stop();
    var register = sDB.flipper.solenoids[Relay.HEALTH_LED].register;
    test.deepEqual(sDB.parallelPort.history[0], { direction: Direction.WRITE, register: register, value: BitMasks.DATA_LOW });
    test.done();
};

function mockPowerRelayAndHealthLed() {
    sDB.flipper.solenoids[Relay.HEALTH_LED] = { register: 3, index: 4, duration: -1 };
    sDB.flipper.solenoids[Relay.POWER_RELAY_CONTROL] = { register: 3, index: 5, duration: -1 };
}

function getBitValueOfSolenoid(solenoidName) {
    return BitMasks.BITS[sDB.flipper.solenoids[solenoidName].index];
}

/*
 * Checks if driver sets the correct byte values for activation
 * and subsequently deactivation to the solenoid byte of enabled solenoid.
 */
exports.testEnableSolenoid = function(test) {
    sDB.build();
    setSolenoidByte('solenoid4', BitMasks.DATA_LOW);
    sDB.solenoidDriver.enableSolenoid('solenoid4');
    test.equals(BitMasks.BITS[flipper.solenoids.solenoid4.index], getSolenoidByte('solenoid4'));
    setTimeout(function() {
        test.equals(BitMasks.DATA_LOW, getSolenoidByte('solenoid4'));
        test.done();
    }, flipper.solenoids.solenoid4.duration * 1.5);
};

function getSolenoidByte(solenoidName) {
    var solenoidConfig = flipper.solenoids[solenoidName];
    return sDB.solenoidDriver.solenoidBytes[solenoidConfig.register];
}

function setSolenoidByte(solenoidName, value) {
    var solenoidConfig = flipper.solenoids[solenoidName];
    sDB.solenoidDriver.solenoidBytes[solenoidConfig.register] = value;
}