
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + Flipper contains configuration data for:                            +
 +  * interval times                                                   +
 +  * solenoids                                                        +
 +  * switches                                                         +
 +  * lamps                                                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var Solenoids = require('./Solenoids'),
    Switches = require('./Switches'),
    Lamps = require('./Lamps'),
    Registers = require('../src/Registers'),
    Relay = require('../src/Relay');

/**
 * Interval length of IntervalRunners for LampDriver
 * and SwitchScanners in milliseconds.
 */
var intervals = {
    lamps: 0.5,
    switches: 1.0
};

/**
 * Map with switch configuration with matrix column and matrix row,
 * or register address and index of bit
 */
var switches = {};
// Matrix switches
switches[Switches.START] = { column: 0, row: 2 };
switches[Switches.LEFT_DROP_TARGET] = { column: 0, row: 4 };
switches[Switches.LEFT_OUTER_LANE] = { column: 0, row: 5 };
switches[Switches.RIGHT_INNER_LANE] = { column: 0, row: 6 };
switches[Switches.SHOOTER_LANE] = { column: 0, row: 7 };
switches[Switches.CAPTIVE_BALL] = { column: 1, row: 0 };
switches[Switches.ALWAYS_CLOSED] = { column: 1, row: 3 };
switches[Switches.RIGHT_DROP_TARGET] = { column: 1, row: 4 };
switches[Switches.LEFT_INNER_LANE] = { column: 1, row: 5 };
switches[Switches.RIGHT_OUTER_LANE] = { column: 1, row: 6 };
switches[Switches.SNEAKY_LANE] = { column: 1, row: 7 };
switches[Switches.RIGHT_BANK_UPPER] = { column: 2, row: 0 };
switches[Switches.RIGHT_BANK_MIDDLE] = { column: 2, row: 1 };
switches[Switches.RIGHT_BANK_LOWER] = { column: 2, row: 2 };
switches[Switches.LEFT_BANK_UPPER] = { column: 2, row: 3 };
switches[Switches.LEFT_BANK_MIDDLE] = { column: 2, row: 4 };
switches[Switches.LEFT_BANK_LOWER] = { column: 2, row: 5 };
switches[Switches.LEFT_SAUCER] = { column: 2, row: 6 };
switches[Switches.RIGHT_SAUCER] = { column: 2, row: 7 };
switches[Switches.TROUGH_JAM] = { column: 3, row: 0 };
switches[Switches.TROUGH_BALL_1] = { column: 3, row: 1 };
switches[Switches.TROUGH_BALL_2] = { column: 3, row: 2 };
switches[Switches.TROUGH_BALL_3] = { column: 3, row: 3 };
switches[Switches.TROUGH_BALL_4] = { column: 3, row: 4 };
switches[Switches.LEFT_RAMP_ENTER] = { column: 3, row: 5 };
switches[Switches.RIGHT_RAMP_ENTER] = { column: 3, row: 6 };
switches[Switches.SHIELD_POPPER] = { column: 4, row: 0 };
switches[Switches.LEFT_SHIELD_TARGET] = { column: 4, row: 2 };
switches[Switches.RIGHT_SHIELD_TARGET] = { column: 4, row: 3 };
switches[Switches.RAMP_MADE_LEFT] = { column: 4, row: 4 };
switches[Switches.RAMP_MADE_RIGHT] = { column: 4, row: 5 };
switches[Switches.SHIELD_UP] = { column: 4, row: 6 };
switches[Switches.SHIELD_HIT] = { column: 4, row: 7 };
switches[Switches.LEFT_SLINGSHOT] = { column: 5, row: 0 };
switches[Switches.RIGHT_SLINGSHOT] = { column: 5, row: 1 };
switches[Switches.UPPER_JET_BUMPER] = { column: 5, row: 2 };
switches[Switches.MIDDLE_JET_BUMPER] = { column: 5, row: 3 };
switches[Switches.LOWER_JET_BUMPER] = { column: 5, row: 4 };
switches[Switches.JETS_ROLLOVER] = { column: 5, row: 5 };
switches[Switches.LEFT_LOOP_UPPER] = { column: 5, row: 6 };
switches[Switches.LEFT_LOOP_ROLLOVER] = { column: 5, row: 7 };
// Column 6 & 7 are unused
// Register switches
switches[Switches.COIN_1] = { register: Registers.SWITCH_COIN_SLOT, index: 0 };
switches[Switches.COIN_2] = { register: Registers.SWITCH_COIN_SLOT, index: 1 };
switches[Switches.COIN_3] = { register: Registers.SWITCH_COIN_SLOT, index: 2 };
switches[Switches.COIN_4] = { register: Registers.SWITCH_COIN_SLOT, index: 3 };
switches[Switches.COIN_5] = { register: Registers.SWITCH_COIN_SLOT, index: 4 };
switches[Switches.COIN_6] = { register: Registers.SWITCH_COIN_SLOT, index: 5 };
switches[Switches.COIN_7] = { register: Registers.SWITCH_COIN_SLOT, index: 6 };
switches[Switches.COIN_8] = { register: Registers.SWITCH_COIN_SLOT, index: 7 };
switches[Switches.ESCAPE_BUTTON] = { register: Registers.SWITCH_PLAY_FIELD, index: 0 };
switches[Switches.DOWN_BUTTON] = { register: Registers.SWITCH_PLAY_FIELD, index: 1 };
switches[Switches.UP_BUTTON] = { register: Registers.SWITCH_PLAY_FIELD, index: 2 };
switches[Switches.ENTER_BUTTON] = { register: Registers.SWITCH_PLAY_FIELD, index: 3 };
switches[Switches.LOWER_RIGHT_FLIPPER_EOS] = { register: Registers.SWITCH_PLAY_FIELD, index: 4 };
switches[Switches.LOWER_LEFT_FLIPPER_EOS] = { register: Registers.SWITCH_PLAY_FIELD, index: 5 };
switches[Switches.UPPER_RIGHT_FLIPPER_EOS] = { register: Registers.SWITCH_PLAY_FIELD, index: 6 };
switches[Switches.UPPER_LEFT_FLIPPER_EOS] = { register: Registers.SWITCH_PLAY_FIELD, index: 7 };
switches[Switches.SLAM_TILT] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 0 };
switches[Switches.COIN_DOOR_CLOSED] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 1 };
switches[Switches.PLUMB_BOB_TILT] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 2 };
switches[Switches.RIGHT_FLIPPER_BUTTON] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 4 };
switches[Switches.LEFT_FLIPPER_BUTTON] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 5 };
switches[Switches.RIGHT_ACTION_BUTTON] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 6 };
switches[Switches.LEFT_ACTION_BUTTON] = { register: Registers.SWITCH_CABINET_FLIPPER, index: 7 };
// DIP & system switches are missing

/**
 * Map with solenoid configurations with register address, index of bit
 * and maximal allowed activation duration.
 * Solenoids with duration zero are permanent active.
 */
var solenoids = {};
solenoids[Solenoids.LEFT_SAUCER] = { register: Registers.SOLENOID_GROUP_A, index: 0, duration: 20 };
solenoids[Solenoids.LEFT_DROP_TARGET_UP] = { register: Registers.SOLENOID_GROUP_A, index: 1, duration: 20 };
solenoids[Solenoids.LEFT_DROP_TARGET_DOWN] = { register: Registers.SOLENOID_GROUP_A, index: 2, duration: 20 };
solenoids[Solenoids.MAGNET] = { register: Registers.SOLENOID_GROUP_A, index: 3, duration: 20 };
solenoids[Solenoids.RIGHT_DROP_TARGET_DOWN] = { register: Registers.SOLENOID_GROUP_A, index: 5, duration: 20 };
solenoids[Solenoids.RIGHT_DROP_TARGET_UP] = { register: Registers.SOLENOID_GROUP_A, index: 6, duration: 20 };
solenoids[Solenoids.SHIELD_POPPER_RESET] = { register: Registers.SOLENOID_GROUP_A, index: 7, duration: 20 };
solenoids[Solenoids.TROUGH_EJECT] = { register: Registers.SOLENOID_GROUP_B, index: 0, duration: 20 };
solenoids[Solenoids.LEFT_SLINGSHOT] = { register: Registers.SOLENOID_GROUP_B, index: 1, duration: 20 };
solenoids[Solenoids.RIGHT_SLINGSHOT] = { register: Registers.SOLENOID_GROUP_B, index: 2, duration: 20 };
solenoids[Solenoids.UPPER_BUMPER] = { register: Registers.SOLENOID_GROUP_B, index: 3, duration: 20 };
solenoids[Solenoids.MIDDLE_BUMPER] = { register: Registers.SOLENOID_GROUP_B, index: 4, duration: 20 };
solenoids[Solenoids.LOWER_BUMPER] = { register: Registers.SOLENOID_GROUP_B, index: 5, duration: 20 };
solenoids[Solenoids.UPPER_HOT_DOG_FLASHERS] = { register: Registers.SOLENOID_GROUP_B, index: 6, duration: 60 };
solenoids[Solenoids.RIGHT_SAUCER] = { register: Registers.SOLENOID_GROUP_B, index: 7, duration: 20 };
solenoids[Solenoids.LOWER_LEFT_HOT_DOG_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 0, duration: 60 };
solenoids[Solenoids.LOWER_RIGHT_HOT_DOG_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 1, duration: 60 };
solenoids[Solenoids.BACK_PANEL_RIGHT_UPPER_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 2, duration: 60 };
solenoids[Solenoids.BACK_PANEL_RIGHT_MIDDLE_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 3, duration: 60 };
solenoids[Solenoids.JET_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 4, duration: 60 };
solenoids[Solenoids.LEFT_INNER_LANE_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 5, duration: 60 };
solenoids[Solenoids.RIGHT_INNER_LANE_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 6, duration: 60 };
solenoids[Solenoids.BACK_PANEL_MIDDLE_FLASHER] = { register: Registers.SOLENOID_GROUP_C, index: 7, duration: 60 };
solenoids[Solenoids.BACK_PANEL_RIGHT_LOWER_FLASHER] = { register: Registers.SOLENOID_GROUP_D, index: 0, duration: 60 };
solenoids[Solenoids.BACK_PANEL_LEFT_UPPER_FLASHER] = { register: Registers.SOLENOID_GROUP_D, index: 1, duration: 60 };
solenoids[Solenoids.BACK_PANEL_LEFT_MIDDLE_FLASHER] = { register: Registers.SOLENOID_GROUP_D, index: 2, duration: 60 };
solenoids[Solenoids.BACK_PANEL_LEFT_LOWER_FLASHER] = { register: Registers.SOLENOID_GROUP_D, index: 3, duration: 60 };
// Special solenoids are not in solenoids list to avoid accidental deactivation by user
solenoids[Relay.HEALTH_LED] = { register: Registers.SOLENOID_GROUP_D, index: 4, duration: -1 };
solenoids[Relay.POWER_RELAY_CONTROL] = { register: Registers.SOLENOID_GROUP_D, index: 5, duration: -1 };
solenoids[Solenoids.RIGHT_FLIPPER_POWER] = { register: Registers.SOLENOID_FLIPPER, index: 0, duration: 20 };
solenoids[Solenoids.RIGHT_FLIPPER_HOLD] = { register: Registers.SOLENOID_FLIPPER, index: 1, duration: -1 };
solenoids[Solenoids.LEFT_FLIPPER_POWER] = { register: Registers.SOLENOID_FLIPPER, index: 2, duration: 20 };
solenoids[Solenoids.LEFT_FLIPPER_HOLD] = { register: Registers.SOLENOID_FLIPPER, index: 3, duration: -1 };
solenoids[Solenoids.CENTER_BUMPER_POWER] = { register: Registers.SOLENOID_FLIPPER, index: 4, duration: 20 };
solenoids[Solenoids.CENTER_BUMPER_HOLD] = { register: Registers.SOLENOID_FLIPPER, index: 5, duration: -1 };
solenoids[Solenoids.LASER_FLASHER_LEFT] = { register: Registers.SOLENOID_FLIPPER, index: 6, duration: 60 };
solenoids[Solenoids.LASER_FLASHER_RIGHT] = { register: Registers.SOLENOID_FLIPPER, index: 7, duration: 60 };
// Logic solenoids are missing


/**
 * Map with lamp configuration with matrix row register,
 * matrix column and matrix row.
 */
var lamps = {};
// Lamp matrix A, column 0
lamps[Lamps.START_BUTTON] = { matrix: Registers.LAMP_ROW_A, column: 0, row: 2 };
lamps[Lamps.SHIELD_LOWER_RIGHT] = { matrix: Registers.LAMP_ROW_A, column: 0, row: 4 };
lamps[Lamps.SHIELD_LOWER_4] = { matrix: Registers.LAMP_ROW_A, column: 0, row: 5 };
lamps[Lamps.SHIELD_LOWER_3] = { matrix: Registers.LAMP_ROW_A, column: 0, row: 6 };
lamps[Lamps.SHIELD_LOWER_2] = { matrix: Registers.LAMP_ROW_A, column: 0, row: 7 };
// Lamp matrix A, column 1
lamps[Lamps.TICKETS_LOW] = { matrix: Registers.LAMP_ROW_A, column: 1, row: 0 };
lamps[Lamps.COIN_DOOR_ILLUMINATION] = { matrix: Registers.LAMP_ROW_A, column: 1, row: 3 };
lamps[Lamps.SHIELD_MIDDLE_RIGHT] = { matrix: Registers.LAMP_ROW_A, column: 1, row: 4 };
lamps[Lamps.SHIELD_MIDDLE_3] = { matrix: Registers.LAMP_ROW_A, column: 1, row: 5 };
lamps[Lamps.SHIELD_MIDDLE_2] = { matrix: Registers.LAMP_ROW_A, column: 1, row: 6 };
lamps[Lamps.SHIELD_LOWER_LEFT] = { matrix: Registers.LAMP_ROW_A, column: 1, row: 7 };
// Lamp matrix A, column 2
lamps[Lamps.SHIELD_UPPER_RIGHT] = { matrix: Registers.LAMP_ROW_A, column: 2, row: 4 };
lamps[Lamps.SHIELD_UPPER_MIDDLE] = { matrix: Registers.LAMP_ROW_A, column: 2, row: 5 };
lamps[Lamps.SHIELD_MIDDLE_LEFT] = { matrix: Registers.LAMP_ROW_A, column: 2, row: 6 };
lamps[Lamps.SHIELD_UPPER_LEFT] = { matrix: Registers.LAMP_ROW_A, column: 2, row: 7 };
// Lamp matrix A, column 3
lamps[Lamps.LEFT_LOOP_RIGHT_LEG] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 0 };
lamps[Lamps.LEFT_LOOP_RIGHT_FOOT] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 1 };
lamps[Lamps.LEFT_LOOP_LEFT_FOOT] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 2 };
lamps[Lamps.LEFT_LOOP_LEFT_LEG] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 3 };
lamps[Lamps.JEDI_E] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 4 };
lamps[Lamps.JEDI_J] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 5 };
lamps[Lamps.JEDI_I] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 6 };
lamps[Lamps.JEDI_D] = { matrix: Registers.LAMP_ROW_A, column: 3, row: 7 };
// Lamp matrix A, column 4
lamps[Lamps.LEFT_LOOP_BODY_MIDDLE] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 0 };
lamps[Lamps.LEFT_LOOP_BODY_UPPER] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 1 };
lamps[Lamps.LEFT_LOOP_HEAD] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 2 };
lamps[Lamps.LEFT_LOOP_BODY_LOWER] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 3 };
lamps[Lamps.RIGHT_RAMP_GI] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 4 };
lamps[Lamps.SCOOP_LOWER_RIGHT_GI] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 5 };
lamps[Lamps.LEFT_LOOP_ROLLOVER] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 6 };
lamps[Lamps.LEFT_SAUCER] = { matrix: Registers.LAMP_ROW_A, column: 4, row: 7 };
// Lamp matrix A, column 5
lamps[Lamps.RIGHT_STANDUPS_UPPER] = { matrix: Registers.LAMP_ROW_A, column: 5, row: 0 };
lamps[Lamps.RIGHT_STANDUPS_MIDDLE] = { matrix: Registers.LAMP_ROW_A, column: 5, row: 1 };
lamps[Lamps.RIGHT_STANDUPS_LOWER] = { matrix: Registers.LAMP_ROW_A, column: 5, row: 2 };
lamps[Lamps.LEFT_STANDUPS_LOWSER] = { matrix: Registers.LAMP_ROW_A, column: 5, row: 3 };
lamps[Lamps.LEFT_STANDUPS_MIDDLE] = { matrix: Registers.LAMP_ROW_A, column: 5, row: 4 };
lamps[Lamps.LEFT_STANDUPS_UPPER] = { matrix: Registers.LAMP_ROW_A, column: 5, row: 5 };
// Lamp matrix A, column 6
lamps[Lamps.BOTTOM_ARCH_LEFT_LEFT] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 0 };
lamps[Lamps.LEFT_INLANE_GI_RIGHT] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 1 };
lamps[Lamps.LEFT_SLING_GI_UPPER] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 2 };
lamps[Lamps.LEFT_LOOP_LOWER_GI] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 3 };
lamps[Lamps.CAPTIVE_BALL_GI] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 4 };
lamps[Lamps.SCOOP_LOWER_LEFT_GI] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 5 };
lamps[Lamps.SCOOP_UPPER_LEFT_GI] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 6 };
lamps[Lamps.JETS_TOP_GI] = { matrix: Registers.LAMP_ROW_A, column: 6, row: 7 };
// Lamp matrix A, column 7
lamps[Lamps.BOTTOM_ARCH_RIGHT_RIGHT] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 0 };
lamps[Lamps.RIGHT_INLANE_GI_UPPER] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 1 };
lamps[Lamps.RIGHT_SLING_GI_UPPER] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 2 };
lamps[Lamps.SHOOTER_RAMP_GI_LOWER] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 3 };
lamps[Lamps.SHOOTER_RAMP_GI_MIDDLE] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 4 };
lamps[Lamps.RIGHT_STANDUPS_GI] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 5 };
lamps[Lamps.MIDDLE_JETS] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 6 };
lamps[Lamps.JETS_MIDDLE_GI] = { matrix: Registers.LAMP_ROW_A, column: 7, row: 7 };
// Lamp matrix B, column 0
lamps[Lamps.SHIP_RIGHT_WING_UPPER] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 0 };
lamps[Lamps.SHIP_RIGHT_WING_LOWER] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 1 };
lamps[Lamps.BONUS_X5] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 2 };
lamps[Lamps.SHIP_TAIL_UPPER] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 3 };
lamps[Lamps.JEDI_SPIRIT] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 4 };
lamps[Lamps.RIGHT_HOTDOG_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 5 };
lamps[Lamps.JETS_ROLLOVER] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 6 };
lamps[Lamps.RIGHT_LASER_END] = { matrix: Registers.LAMP_ROW_B, column: 0, row: 7 };
// Lamp matrix B, column 1
lamps[Lamps.SHIP_BODY_UPPER_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 0 };
lamps[Lamps.SHIP_BODY_MIDDLE] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 1 };
lamps[Lamps.SHIP_BODY_LOWER] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 2 };
lamps[Lamps.BONUS_X4] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 3 };
lamps[Lamps.JEDI_MASTER] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 4 };
lamps[Lamps.FIRE_LASERS_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 5 };
lamps[Lamps.RIGHT_SAUCER] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 6 };
lamps[Lamps.EXTRA_BALL] = { matrix: Registers.LAMP_ROW_B, column: 1, row: 7 };
// Lamp matrix B, column 2
lamps[Lamps.SHIP_LEFT_WING_UPPER] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 0 };
lamps[Lamps.SHIP_LEFT_WING_LOWER] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 1 };
lamps[Lamps.BONUS_X2] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 2 };
lamps[Lamps.BONUS_X3] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 3 };
lamps[Lamps.JEDI_YOUTH] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 4 };
lamps[Lamps.LEFT_HOTDOG_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 5 };
lamps[Lamps.SHOOTER] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 6 };
lamps[Lamps.BOTTOM_ARCH_RIGHT_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 2, row: 7 };
// Lamp matrix B, column 3
lamps[Lamps.SHOP_BODY_UPPER_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 3, row: 0 };
lamps[Lamps.SPOTLIGHT_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 3, row: 3 };
lamps[Lamps.FIRE_LASERS_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 3, row: 4 };
lamps[Lamps.JEDI_KNIGHT] = { matrix: Registers.LAMP_ROW_B, column: 3, row: 5 };
lamps[Lamps.SHOOT_AGAIN] = { matrix: Registers.LAMP_ROW_B, column: 3, row: 6 };
lamps[Lamps.LEFT_FLIPPER] = { matrix: Registers.LAMP_ROW_B, column: 3, row: 7 };
// Lamp matrix B, column 4
lamps[Lamps.LEFT_LASER_END] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 0 };
lamps[Lamps.LEFT_SAUCER_INSERT] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 1 };
lamps[Lamps.RIGHT_SAUCER_INSERT] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 2 };
lamps[Lamps.SPOTLIGHT_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 3 };
lamps[Lamps.LEFT_HOTDOG_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 4 };
lamps[Lamps.RIGHT_HOTDOG_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 5 };
lamps[Lamps.RIGHT_FLIPPER] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 6 };
lamps[Lamps.SHIP_TAIL_LOWER] = { matrix: Registers.LAMP_ROW_B, column: 4, row: 7 };
// Matrix B, column 5 is unused
// Lamp matrix B, column 6
lamps[Lamps.BOTTOM_ARCH_LEFT_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 0 };
lamps[Lamps.LEFT_INLANE_GI_LEFT] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 1 };
lamps[Lamps.LEFT_SLING_GI_LOWER] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 2 };
lamps[Lamps.LEFT_OUTLANE_GI] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 3 };
lamps[Lamps.LEFT_STANDUPS_GI] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 4 };
lamps[Lamps.LEFT_LOOP_MIDDLE_GI] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 5 };
lamps[Lamps.UPPER_LEFT_CORNER_GI] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 6 };
lamps[Lamps.LEFT_RAMP_GI] = { matrix: Registers.LAMP_ROW_B, column: 6, row: 7 };
// Lamp matrix B, column 7
lamps[Lamps.SCOOP_UPPER_RIGHT_GI] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 0 };
lamps[Lamps.UPPER_RIGHT_CORNER_GI] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 1 };
lamps[Lamps.UPPER_JET] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 2 };
lamps[Lamps.LOWER_JET] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 3 };
lamps[Lamps.SHOOTER_RAMP_GI_UPPER] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 4 };
lamps[Lamps.RIGHT_OUTLANE_GI] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 5 };
lamps[Lamps.RIGHT_SLING_GI_LOWER] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 6 };
lamps[Lamps.RIGHT_INLANE_GI_RIGHT] = { matrix: Registers.LAMP_ROW_B, column: 7, row: 7 };

module.exports = {
    intervals: intervals,
    switches: switches,
    solenoids: solenoids,
    lamps: lamps
};