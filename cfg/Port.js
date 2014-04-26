
/*
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + Port contains configuration of parallel port.                       +
 +                                                                     +
 + Typical values of address are:                                      +
 +  * 0x378 for first build-in lpt port                                +
 +  * 0x2000 for miniPCIe adapter                                      +
 +                                                                     +
 + Port structure is only used in configuration if FlipperDriver.      +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

/**
 * Configuration of parallel port.
 */
module.exports = {
    address: 0xEC00
};
