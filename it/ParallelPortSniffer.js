
var util = require('util'),
    proxyquire = require('proxyquire'),
    parport2 = require('parport2'),

    Exceptions = require('../src/Exceptions');

var Type = { DATA: 'data', CONTROL: 'control', STATUS: 'status' };

var Direction = { READ: 'read', WRITE: 'write' };

/**
 * Hold a reference to the log of the last created ParallelPort.
 */
var log = [];

/**
 * Creates an instance of ParallelPort, injecting an sniffing mock for parport.Port.
 */
function createPort(port) {
    var ParallelPort = proxyquire('../src/ParallelPort', {
        'parport2': { Port: PortSniffer, '@noCallThru': true }
    });

    var parallelPort = ParallelPort.createPort(port);
    log = parallelPort.port.log;
    return parallelPort;
}

/**
 * Returns the log of the last created ParallelPort.
 */
function getLog() {
    return log;
}

/**
 * Wraps an instance of parport.Port logging each delegated method call.
 *
 * @param address Address of parallel port.
 * @constructor
 */
function PortSniffer(address) {
    return {
        MAXIMAL_PARALLEL_PORT_NUMBER: 255,
        log: [],
        port: (function createPort() {
            try {
                return new parport2.Port(address);
            } catch (e) {
                throw new Error(util.format(Exceptions.NO_PARALLEL_PORT, address));
            }
        }()),
        readData: function() {
            var dataByte = this.port.readData();
            this.log.push({ direction: Direction.READ, type: Type.DATA, value: dataByte });
            return dataByte;
        },
        writeData: function(dataByte) {
            this.log.push({ direction: Direction.WRITE, type: Type.DATA, value: dataByte });
            this.port.writeData(dataByte);
        },
        writeControl: function(controlByte) {
            this.log.push({ direction: Direction.WRITE, type: Type.CONTROL, value: controlByte });
            this.port.writeControl(controlByte);
        }
    };
}

module.exports = {
    createPort: createPort,
    getLog: getLog
};