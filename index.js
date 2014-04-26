/**
 * Created by acomitevski on 25/04/14.
 */


var Flipper = require('./cfg/Flipper'),
  FlipperDriver,
  Port = require('./cfg/Port');

if (process.platform === 'linux') {
  FlipperDriver = require('./src/FlipperDriver');
} else {
  var proxyquire =  require('proxyquire').noCallThru();
  FlipperDriver = proxyquire('./src/FlipperDriver', {'./ParallelPort': {
      createPort: function() {
        return {
          write: function() {},
          read: function() {},
          selectRegister: function() {},
          writeData: function() {},
          readData: function() {}
        }
      }
    }
  }
  )
}


module.exports = {
  createDriver: FlipperDriver.createDriver,
  createDefault: function() {
    return FlipperDriver.createDriver(Flipper, Port);
  }
};