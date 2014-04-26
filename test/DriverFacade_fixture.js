
var util = require('util'),

    DriverFacade = require('../src/DriverFacade'),
    Exceptions = require('../src/Exceptions');

var dFB;

exports.setUp = function(setUp) {
    dFB = DriverFacade.createBuilder();
    dFB.drivers = {
        lampDriver: mockLampDriver(),
        solenoidDriver: mockSolenoidDriver()
    };
    setUp();
};

function mockLampDriver() {
    return {
        interval: {
            start: function() {},
            stop: function() {}
        },
        enableLamp: function(lampName) {},
        disableLamp: function(lampName) {},
        toggleLamp: function(lampName) {}
    };
}

function mockSolenoidDriver() {
    return {
        enableSolenoid: function(solenoidName) {},
        disableSolenoid: function(solenoidName) {}
    };
}

exports.testBuilder = function(test) {
    var driverFacade = dFB.build();
    test.ok(driverFacade.hasOwnProperty('lamp'));
    test.ok(driverFacade.hasOwnProperty('solenoid'));
    test.done();
};

exports.testBrokenBind = function(test) {
    var message = util.format(Exceptions.UNEXPECTED_DEPENDENCY, 'UnusedDriver');
    var UnusedDriver = function UnusedDriver() {};
    test.throws(function() { dFB.bindDriver(new UnusedDriver()); },  new RegExp(message));
    test.done();
};

exports.testMissingLampDriver = function(test) {
    delete dFB.drivers.lampDriver;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'LampDriver');
    test.throws(function() { dFB.build(); }, new RegExp(message));
    test.done();
};

exports.testMissingSolenoidDriver = function(test) {
    delete dFB.drivers.solenoidDriver;
    var message = util.format(Exceptions.MISSING_DEPENDENCY, 'SolenoidDriver');
    test.throws(function() { dFB.build(); }, new RegExp(message));
    test.done();
};