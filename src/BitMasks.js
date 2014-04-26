
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + BitMasks contains bit  bit values of parallel port lines            +
 + and a transformation table for bit number to bit value.             +
 +                                                                     +
 + BitMasks offers functions for manipulating single bits in           +
 + byte values.                                                        +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

/**
 * Map with bit values of lines used for parallel port communication.
 */
module.exports = {
    DATA_LOW: 0,
    DATA_HIGH: 255,
    // data
    DATA_BIT_0: 1 << 0,
    DATA_BIT_1: 1 << 1,
    DATA_BIT_2: 1 << 2,
    DATA_BIT_3: 1 << 3,
    DATA_BIT_4: 1 << 4,
    DATA_BIT_5: 1 << 5,
    DATA_BIT_6: 1 << 6,
    DATA_BIT_7: 1 << 7,
    // status
    ID_BIT_0: 1 << 3,
    ID_BIT_1: 1 << 4,
    ID_BIT_2: 1 << 5,
    ID_BIT_3: 1 << 6,
    ID_BIT_4: 1 << 7,
    // control
    INDEX_REGISTER_DECODE_OUTPUT: 1 << 0,
    INDEX_REGISTER_LATCH_CLOCK: 1 << 2,
    BUFFER_DIRECTION_CONTROL: 1 << 3,
    PRINTER_DIRECTION: 1 << 5,

    //Transformation table for bit number to bit value.
    BITS: [ 1 << 0, 1 << 1, 1 << 2, 1 << 3, 1 << 4, 1 << 5, 1 << 6, 1 << 7 ],
    BYTE: 8
};

module.exports.enableBit = function(value, bitMask) {
    return value | bitMask;
};

module.exports.disableBit = function(value, bitMask) {
    return value & ~bitMask;
};

module.exports.toggleBit = function(value, bitMask) {
    return value ^ bitMask;
};