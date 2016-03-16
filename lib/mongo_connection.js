'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _logger = require('@hoist/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_bluebird2.default.promisifyAll(_mongodb2.default.MongoClient);
/**
 * marshalling class for connection to mongodb
 */

var MongoConnection = function () {
  /**
   * create a new instance
   */

  function MongoConnection() {
    _classCallCheck(this, MongoConnection);

    this._mongoClient = _mongodb2.default.MongoClient;
    this._logger = _logger2.default.child({
      cls: this.constructor.name
    });
  }

  _createClass(MongoConnection, [{
    key: '_openConnection',
    value: function _openConnection() {
      var _this = this;

      return this._mongoClient.connectAsync(_config2.default.get('Hoist.mongo.applications')).then(function (connection) {
        //close connection after 2 seconds of inactivity
        _this._logger.info('connection opened');
        _this._connection = connection;
        _this._connection.on('close', function () {
          delete _this._connection;
        });
        _bluebird2.default.promisifyAll(_this._connection);
        return connection;
      });
    }

    /**
     * close any open connection to mongo
     * @returns {Promise}
     */

  }, {
    key: 'close',
    value: function close() {
      if (!this._connection) {
        return Promise.resolve();
      }
      var connection = this._connection;
      delete this._connection;
      return connection.closeAsync();
    }

    /**
     * Attempt to reuse mongo connection or open one if it doesn't exist
     * @returns {Promise}
     */

  }, {
    key: 'open',
    value: function open() {
      if (this._connection) {
        return Promise.resolve(this._connection);
      } else {
        return this._openConnection();
      }
    }
  }]);

  return MongoConnection;
}();

exports.default = new MongoConnection();
//# sourceMappingURL=mongo_connection.js.map
