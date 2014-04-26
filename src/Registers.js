
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + Registers contains all registers addresses of the flipper.          +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

/**
 * Enum with all registers of the flipper.
 */
module.exports = {
    // read:
    SWITCH_COIN_SLOT: 0,
    SWITCH_CABINET_FLIPPER: 1,
    SWITCH_DIP: 2,
    SWITCH_PLAY_FIELD: 3,
    SWITCH_ROW: 4,
    SWITCH_SYSTEM: 15,
    LAMP_TEST_A: 16,
    LAMP_TEST_B: 17,
    LAMP_FUSE_A: 18,
    LAMP_FUSE_B: 19,
    // write
    SWITCH_COLUMN: 5,
    LAMP_ROW_A: 6,
    LAMP_ROW_B: 7,
    LAMP_COLUMN: 8,
    SOLENOID_GROUP_A: 11,
    SOLENOID_GROUP_B: 10,
    SOLENOID_GROUP_C: 9,
    SOLENOID_GROUP_D: 13,
    SOLENOID_FLIPPER: 12,
    SOLENOID_LOGIC: 14
};