
var proxyquire = require('proxyquire'),

    ParallelPort = proxyquire('../src/ParallelPort', { parport2: { Port: PortMock, '@noCallThru': true } }),
    BitMasks = require('../src/BitMasks');

var REGISTER_ADDRESS = 21;
var REGISTER_VALUE = 7;

var Type = { DATA: 'data', CONTROL: 'control', STATUS: 'status' };

var Direction = { READ: 'read', WRITE: 'write' };

var port = { address: 0x2000 };

var pP;

function PortMock(address) {
    return {
        address: address,
        data: 0,
        control: 0,
        status: 0,
        history: [],
        readData: function() {
            this.history.unshift({ direction: Direction.READ, type: Type.DATA, value: this.data });
            return this.data;
        },
        writeData: function(dataByte) {
            this.data = dataByte;
            this.history.unshift({ direction: Direction.WRITE, type: Type.DATA, value: dataByte });
        },
        writeControl: function(controlByte) {
            // Sets data byte if control byte is set to 'read from flipper'
            if (controlByte === (BitMasks.INDEX_REGISTER_DECODE_OUTPUT | BitMasks.BUFFER_DIRECTION_CONTROL | BitMasks.PRINTER_DIRECTION)) {
                this.data = REGISTER_VALUE;
            }
            this.control = controlByte;
            this.history.unshift({ direction: Direction.WRITE, type: Type.CONTROL, value: controlByte });
        }
    };
}

exports.setUp = function(setUp) {
    pP = ParallelPort.createPort(port);
    setUp();
};

exports.testWrite = function(test) {
    pP.write(REGISTER_ADDRESS, REGISTER_VALUE);
    validateSelectRegister(test, REGISTER_ADDRESS, 3);
    validateWriteData(test, REGISTER_VALUE, 0);
    test.done();
};

exports.testRead = function(test) {
    pP.port.data = REGISTER_VALUE;
    pP.read(REGISTER_ADDRESS, function() {});
    validateSelectRegister(test, REGISTER_ADDRESS, 3);
    validateReadData(test, REGISTER_VALUE, 0);
    test.done();
};

exports.testSelectRegister = function(test) {
    pP.selectRegister(REGISTER_ADDRESS);
    validateSelectRegister(test, REGISTER_ADDRESS, 0);
    test.done();
};

exports.testWriteData = function(test) {
    pP.writeData(REGISTER_VALUE);
    validateWriteData(test, REGISTER_VALUE, 0);
    test.done();
};

exports.testReadData = function(test) {
    pP.port.data = REGISTER_VALUE;
    pP.readData(function() {});
    validateReadData(test, REGISTER_VALUE, 0);
    test.done();
};

/*
 * Checks if selection of register was performed according to flipper communication protocol.
 * ageOffset is the position of communication operations in the parallel port history.
 */
function validateSelectRegister(test, registerAddress, ageOffset) {
    test.equal(BitMasks.INDEX_REGISTER_LATCH_CLOCK, 4);
    test.deepEqual(pP.port.history[ageOffset + 2], { direction: Direction.WRITE, type: Type.DATA, value: registerAddress });
    test.deepEqual(pP.port.history[ageOffset + 1], { direction: Direction.WRITE, type: Type.CONTROL, value: 4 });
    test.deepEqual(pP.port.history[ageOffset], { direction: Direction.WRITE, type: Type.CONTROL, value: 0 });
}

/*
 * Checks if writing data to a register was performed according to flipper communication protocol.
 * ageOffset is the position of communication operations in the parallel port history.
 */
function validateWriteData(test, registerValue, ageOffset) {
    test.equal(BitMasks.INDEX_REGISTER_DECODE_OUTPUT, 1);
    test.deepEqual(pP.port.history[ageOffset + 2], { direction: Direction.WRITE, type: Type.DATA, value: registerValue });
    test.deepEqual(pP.port.history[ageOffset + 1], { direction: Direction.WRITE, type: Type.CONTROL, value: 1 });
    test.deepEqual(pP.port.history[ageOffset], { direction: Direction.WRITE, type: Type.CONTROL, value: 0 });
}

/*
 * Checks if reading data from a register was performed according to flipper communication protocol.
 * ageOffset is the position of communication operations in the parallel port history.
 */
function validateReadData(test, registerValue, ageOffset) {
    test.equal(BitMasks.INDEX_REGISTER_DECODE_OUTPUT | BitMasks.BUFFER_DIRECTION_CONTROL | BitMasks.PRINTER_DIRECTION, 41);
    test.deepEqual(pP.port.history[ageOffset + 2], { direction: Direction.WRITE, type: Type.CONTROL, value: 41 });
    test.deepEqual(pP.port.history[ageOffset + 1], { direction: Direction.READ, type: Type.DATA, value: registerValue });
    test.deepEqual(pP.port.history[ageOffset], { direction: Direction.WRITE, type: Type.CONTROL, value: 0 });
}
