'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _mongo_connection = require('./mongo_connection');

var _mongo_connection2 = _interopRequireDefault(_mongo_connection);

var _context = require('@hoist/context');

var _context2 = _interopRequireDefault(_context);

var _helpers = require('./helpers');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _logger = require('@hoist/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * application data api pipeline
 */

var DataPipeline = function () {
  /**
   * create a new pipeline
   */

  function DataPipeline() {
    _classCallCheck(this, DataPipeline);

    this._connection = _mongo_connection2.default;
    var applicationId = void 0;
    var context = _context2.default.current();
    if (context && context.application) {
      applicationId = context.application._id;
    }
    this._logger = _logger2.default.child({
      cls: this.constructor.name,
      applicationId: applicationId
    });
  }

  /**
   * save an object or set of objects as a type
   * @param {string} type - the object types
   * @param {object|Array<object>} objOrArray - the object(s) to save
   * @returns {Promise}
   */


  _createClass(DataPipeline, [{
    key: 'save',
    value: function save(type, objOrArray) {
      var _this = this;

      var arrayObj = [].concat(objOrArray);
      this._logger.info('saving data');
      return _context2.default.get().then(function (context) {
        _this._logger.info('opening connection');
        return _this._connection.open().then(function (connection) {
          return Promise.all(arrayObj.map(function (obj) {
            return Promise.resolve((0, _helpers.requiredFieldsTransformer)(type, obj)).then(function (data) {
              return (0, _helpers.timestampsTransformer)(data);
            }).then(function (data) {
              _this._logger.info('sending to mongo');
              var db = connection.db(context.application.dataKey);
              var collection = _bluebird2.default.promisifyAll(db.collection((0, _helpers.getCollectionName)(data._type, context)));
              var createdDate = new Date();
              if (data._createdDate) {
                createdDate = data._createdDate;
                delete data._createdDate;
              }
              var id = data._id;
              delete data._id;
              return collection.updateOneAsync({
                _id: id
              }, {
                $set: data,
                $setOnInsert: {
                  _createdDate: createdDate
                }
              }, {
                upsert: true
              }).then(function () {
                _this._logger.info('finding post save');
                return collection.findOneAsync({
                  _id: id
                });
              });
            });
          }));
        });
      }).then(function (savedData) {
        if (!_util2.default.isArray(objOrArray)) {
          if (savedData.length < 2) {
            if (savedData.length < 1) {
              return null;
            } else {
              return savedData[0];
            }
          }
        }
        return savedData;
      });
    }

    /**
     * finds all objects of type matching the given query
     * @param {string} type - the object types
     * @param {object} query - a mongo style query
     * @returns {Promise}
     */

  }, {
    key: 'find',
    value: function find(type, query) {
      var _this2 = this;

      this._logger.info('finding data');
      return _context2.default.get().then(function (context) {
        _this2._logger.info('opening connection data');
        return _this2._connection.open().then(function (connection) {
          //throw new Error();
          var db = connection.db(context.application.dataKey);
          var collection = db.collection((0, _helpers.getCollectionName)(type, context));
          return _bluebird2.default.promisifyAll(collection.find(query)).toArrayAsync().then(function (results) {
            _this2._logger.info('retrieved data');
            return Promise.resolve(results);
          });
        });
      });
    }

    /**
     * finds a single object of type matching the given query
     * @param {string} type - the object types
     * @param {object} query - a mongo style query
     * @returns {Promise}
     */

  }, {
    key: 'findOne',
    value: function findOne(type, query) {
      var _this3 = this;

      this._logger.info('finding single');
      return _context2.default.get().then(function (context) {
        _this3._logger.info('opening connection');
        return _this3._connection.open().then(function (connection) {
          var db = connection.db(context.application.dataKey);
          var collection = _bluebird2.default.promisifyAll(db.collection((0, _helpers.getCollectionName)(type, context)));
          return collection.findOneAsync(query).then(function (results) {
            _this3._logger.info('retrieved data');
            return results;
          });
        });
      });
    }

    /**
     * removes all objects of type matching the given query
     * @param {string} type - the object types
     * @param {object} query - a mongo style query
     * @returns {Promise}
     */

  }, {
    key: 'remove',
    value: function remove(type, query) {
      var _this4 = this;

      this._logger.info('removing data');
      return _context2.default.get().then(function (context) {
        _this4._logger.info('opening connection');
        return _this4._connection.open().then(function (connection) {
          var db = connection.db(context.application.dataKey);
          var collection = _bluebird2.default.promisifyAll(db.collection((0, _helpers.getCollectionName)(type, context)));
          return collection.removeAsync(query).then(function (results) {
            _this4._logger.info('removed data');
            return results;
          });
        });
      });
    }
  }]);

  return DataPipeline;
}();

DataPipeline._mongoConnection = _mongo_connection2.default;

exports.default = DataPipeline;
//# sourceMappingURL=pipeline.js.map
