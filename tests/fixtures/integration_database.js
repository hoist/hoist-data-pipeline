var connection = require('../bootstrap');
module.exports = {
  seed: function (done) {
    connection.current;
    done();
  },
  cleanup: function (done) {
    done();
  }
}
