
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + Relay contains solenoid to activate power for all other solenoids   +
 + and the name of the health led signalling an active control         +
 + software.                                                           +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

/**
 * Enum with power relay and health led.
 */
module.exports = {
    HEALTH_LED: 'HealthLed',
    POWER_RELAY_CONTROL: 'PowerRelayControl'
};