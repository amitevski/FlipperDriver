
var ParallelPortSniffer = require('./ParallelPortSniffer');

var DELAY_MILLISECONDS = 1000;

/**
 * Executes slowly a list of parallel port operations
 * for monitoring parallel port state with LED tester.
 * Prints a sniffed list of all data transfers to the
 * parallel port in the end.
 */
(function main() {
    var parallelPort = ParallelPortSniffer.createPort();

    /**
     * List of parallel port operations.
     */
    var delayedCommands = [
        function() {
            parallelPort.write(0);
        },
        function() {
            parallelPort.read(0);
        },
        function() {
            parallelPort.write(8);
        },
        function() {
            parallelPort.read(8);
        }
    ];

    /**
     * Executes each command and prints parallel port log in the end.
     */
    (function executeCommands() {
        if (delayedCommands.length > 0) {
            (delayedCommands.shift())();
            if (delayedCommands.length > 0) {
                setTimeout(executeCommands, DELAY_MILLISECONDS);
            } else {
                printLog();
            }
        }
    }());

    function printLog() {
        parallelPort.log.forEach(function (entry) { console.log(entry.direction + ':' + entry.type + ':' + entry.value); });
    }

}());