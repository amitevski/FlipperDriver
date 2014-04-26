
/**
 * Map with all exceptions used in FlipperControl.
 */
module.exports = {
    WRONG_OPERATING_SYSTEM: 'Expected linux based operation system, but detected: %s (%s)',
    NO_PARALLEL_PORT: 'Parallel port could not be accessed at address: %s (Insufficient privileges?)',
    MISSING_CONFIGURATION: 'The factory method was called without proper configuration objects.',
    UNEXPECTED_DEPENDENCY: 'The dependency bound was not expected: %s',
    MISSING_DEPENDENCY: 'The required dependency was not bound: %s',
    BROKEN_CONFIGURATION: 'The configuration has an invalid or missing field: %s',
    BROKEN_LAMP: 'The configuration of a lamp is broken: %s = %s',
    BROKEN_SOLENOID: 'The configuration of a solenoid is broken: %s = %s',
    BROKEN_SWITCH: 'The configuration of a switch is broken: %s = %s',
    INTERVAL_RUNNING: 'The interval runner is already running.',
    INTERVAL_STOPPED: 'The interval runner is not running.',
    DRIVER_RUNNING: 'The flipper driver is already running.',
    DRIVER_STOPPED: 'The flipper driver is not running.'
};