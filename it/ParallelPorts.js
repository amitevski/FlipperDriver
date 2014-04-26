
var Exceptions = require('../src/Exceptions'),
    ParallelPort = require('../src/ParallelPort'),
    ParallelPortSniffer = require('./ParallelPortSniffer');

var Direction = { READ: 'read', WRITE: 'write' };

function createPort(port) {
    return ParallelPort.createPort(port);
}

function createSniffingPort(port) {
    return ParallelPortSniffer.createPort(port);
}

function getSniffingPortLog() {
    return ParallelPortSniffer.getLog();
}

function createPortStub(port) {
    return {
        address: port.address,
        log: [],
        write: function (registerAddress, registerValue) {
            this.log.push({ direction: Direction.WRITE, address: registerAddress, value: registerValue });
        },
        read: function(registerAddress, callback) {
            this.log.push({ direction: Direction.READ, address: registerAddress });
        }
    };
}

module.exports = {
    createPort: createPort,
    createSniffingPort: createSniffingPort,
    getSniffingPortLog: getSniffingPortLog,
    createPortStub: createPortStub
};