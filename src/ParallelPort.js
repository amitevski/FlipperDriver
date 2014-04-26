
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + ParallelPort allows to read and write registers of the flipper:     +
 +  * write(registerAddress, registerValue)                            +
 +  * read(registerAddress, callback)                                  +
 +                                                                     +
 + To create an instance of parallel port utilize the factory method:  +
 +  createPort(port)                                                   +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var util = require('util'),
    os = require('os'),

    BitMasks = require('./BitMasks'),
    Exceptions = require('./Exceptions');

var LINUX_PLATFORM_NAME = 'linux';

// Avoid cryptic 'no error' message when running under windows
if (process.platform === LINUX_PLATFORM_NAME) {
    var parport2 = require('parport2');
} // Do not throw an error here as try/catch block of main function is not active yet

/**
 * Creates an instance of ParallelPort.
 *
 * @param port Port structure like described in port configuration.
 */
function createPort(port) {
    if (!(typeof port === 'object')) {
        throw new Error(Exceptions.MISSING_CONFIGURATION);
    }
    return new ParallelPort(port);
}

function ParallelPort(port) {
    if (process.platform !== LINUX_PLATFORM_NAME) {
        throw new Error(util.format(Exceptions.WRONG_OPERATING_SYSTEM, os.type(), os.platform()));
    }
    try {
        this.port = new parport2.Port(port.address);
    } catch (e) {
        throw new Error(util.format(Exceptions.NO_PARALLEL_PORT, port.address));
    }
}

ParallelPort.prototype.write = function(registerAddress, registerValue) {
    this.selectRegister(registerAddress);
    this.writeData(registerValue);
};

ParallelPort.prototype.read = function(registerAddress, callback) {
    this.selectRegister(registerAddress);
    this.readData(callback);
};

ParallelPort.prototype.selectRegister = function(registerAddress) {
    this.port.writeData(registerAddress);
    this.port.writeControl(BitMasks.INDEX_REGISTER_LATCH_CLOCK);
    this.port.writeControl(BitMasks.DATA_LOW);
};

ParallelPort.prototype.writeData = function(registerValue) {
    this.port.writeData(registerValue);
    this.port.writeControl(BitMasks.INDEX_REGISTER_DECODE_OUTPUT);
    this.port.writeControl(BitMasks.DATA_LOW);
};

ParallelPort.prototype.readData = function(callback) {
    this.port.writeControl(BitMasks.INDEX_REGISTER_DECODE_OUTPUT
        | BitMasks.BUFFER_DIRECTION_CONTROL | BitMasks.PRINTER_DIRECTION);
    var registerValue = this.port.readData();
    // Finishing communication before calling callback as it could start new communications!
    this.port.writeControl(BitMasks.DATA_LOW);
    callback(registerValue);
};

module.exports.createPort = createPort;
