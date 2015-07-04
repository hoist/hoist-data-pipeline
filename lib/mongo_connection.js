'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _hoistLogger = require('@hoist/logger');

var _hoistLogger2 = _interopRequireDefault(_hoistLogger);

_bluebird2['default'].promisifyAll(_mongodb2['default'].MongoClient);
/**
 * marshalling class for connection to mongodb
 */

var MongoConnection = (function () {
  /**
   * create a new instance
   */

  function MongoConnection() {
    _classCallCheck(this, MongoConnection);

    this._mongoClient = _mongodb2['default'].MongoClient;
    this._logger = _hoistLogger2['default'].child({
      cls: this.constructor.name
    });
  }

  _createClass(MongoConnection, [{
    key: '_clearTimeout',
    value: function _clearTimeout() {
      if (this._connectionTimeout) {
        this._logger.info('clearing timeout');
        clearTimeout(this._connectionTimeout);
      }
    }
  }, {
    key: '_resetTimeout',
    value: function _resetTimeout() {
      var _this = this;

      if (this._connectionTimeout) {
        this._logger.info('clearing timeout');
        clearTimeout(this._connectionTimeout);
      }
      this._connectionTimeout = setTimeout(function () {
        if (_this._connection) {
          _this._connection.closeAsync();
          delete _this._connection;
        }
      }, 2000);
    }
  }, {
    key: '_openConnection',
    value: function _openConnection() {
      var _this2 = this;

      this._clearTimeout();
      return this._mongoClient.connectAsync(_config2['default'].get('Hoist.mongo.applications')).then(function (connection) {
        //close connection after 2 seconds of inactivity
        _this2._resetTimeout();
        _this2._logger.info('connection opened');
        _this2._connection = connection;
        _bluebird2['default'].promisifyAll(_this2._connection);
        return connection;
      });
    }
  }, {
    key: 'close',

    /**
     * close any open connection to mongo
     * @returns {Promise}
     */
    value: function close() {
      if (!this._connection) {
        return Promise.resolve();
      }
      this._clearTimeout();
      var connection = this._connection;
      delete this._connection;
      return connection.closeAsync();
    }
  }, {
    key: 'open',

    /**
     * Attempt to reuse mongo connection or open one if it doesn't exist
     * @returns {Promise}
     */
    value: function open() {
      if (this._connection) {
        this._resetTimeout();
        return Promise.resolve(this._connection);
      } else {
        return this._openConnection();
      }
    }
  }]);

  return MongoConnection;
})();

exports['default'] = MongoConnection;
module.exports = exports['default'];
//# sourceMappingURL=mongo_connection.js.map