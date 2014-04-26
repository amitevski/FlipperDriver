
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + FlipperModel collects states of flipper components:                 +
 +  * solenoids                                                        +
 +  * switches                                                         +
 +  * lamps                                                            +
 +                                                                     +
 + It offers syntax for listening to switch events:                    +
 +  * addListener(switchName, listenerFunction)                        +
 +  * removeListener(switchName, listenerFunction)                     +
 +                                                                     +
 + It offers methods for updating components:                          +
 +  * updateSolenoid(solenoidName)                                     +
 +  * updateSwitch(switchName)                                         +
 +  * updateLamp(lampName)                                             +
 +                                                                     +
 + To create an instance of flipper model utilize the builder:         +
 +  createBuilder(flipper).build()                                     +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    Exceptions = require('./Exceptions');

/**
 * Creates an instance of FlipperModelBuilder.
 *
 * @param flipper Flipper structure like described in flipper configuration.
 */
var createBuilder = function(flipper) {
    if (!(typeof flipper === 'object')) {
        throw new Error(Exceptions.MISSING_CONFIGURATION);
    }
    return new FlipperModelBuilder(flipper);
};

function FlipperModelBuilder(flipper) {
    this.flipper = flipper;

    this.flipperModel = null;
}

FlipperModelBuilder.prototype.build = function() {
    this.flipperModel = new FlipperModel();
    this.buildInitialStates();
    this.buildEvents();
    return this.flipperModel;
};

FlipperModelBuilder.prototype.buildInitialStates = function() {
    Object.getOwnPropertyNames(this.flipper.switches).forEach(function(switchName) {
        this.flipperModel.model.switches[switchName] = false;
    }, this);
    Object.getOwnPropertyNames(this.flipper.solenoids).forEach(function(solenoidName) {
        this.flipperModel.model.solenoids[solenoidName] = false;
    }, this);
    Object.getOwnPropertyNames(this.flipper.lamps).forEach(function(lampName) {
        this.flipperModel.model.lamps[lampName] = false;
    }, this);
};

FlipperModelBuilder.prototype.buildEvents = function() {
    Object.getOwnPropertyNames(this.flipper.switches).forEach(function(switchName) {
        this.flipperModel.events.down[switchName] = { name: switchName, state: true };
        this.flipperModel.events.up[switchName] = { name: switchName, state: false };
    }, this);
};

// ===

function FlipperModel() {
    this.model = {
        switches: {},
        solenoids: {},
        lamps: {}
    };
    this.events = {
        down: {},
        up: {}
    };
}

util.inherits(FlipperModel, EventEmitter2);

FlipperModel.prototype.updateSwitch = function(switchName, state) {
    // double negation for cast to boolean
    var booleanState = !!state;
    this.model.switches[switchName] = booleanState;
    if (booleanState) {
        // First parameter is event name, second is passed to listener
        this.emit(switchName, this.events.down[switchName]);
    } else {
        this.emit(switchName, this.events.up[switchName]);
    }
};

FlipperModel.prototype.updateSolenoid = function(solenoidName, state) {
    // double negation for cast to boolean
    this.model.solenoids[solenoidName] = !!state;
};

FlipperModel.prototype.updateLamp = function(lampName, state) {
    // double negation for cast to boolean
    this.model.lamps[lampName] = !!state;
};

module.exports.createBuilder = createBuilder;