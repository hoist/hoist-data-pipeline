'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _mongo_connection = require('./mongo_connection');

var _mongo_connection2 = _interopRequireDefault(_mongo_connection);

var _hoistContext = require('@hoist/context');

var _hoistContext2 = _interopRequireDefault(_hoistContext);

var _helpers = require('./helpers');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

/**
 * application data api pipeline
 */

var DataPipeline = (function () {
  /**
   * create a new pipeline
   */

  function DataPipeline() {
    _classCallCheck(this, DataPipeline);

    this._connection = new _mongo_connection2['default']();
  }

  _createClass(DataPipeline, [{
    key: 'save',

    /**
     * save an object or set of objects as a type
     * @param {string} type - the object types
     * @param {object|Array<object>} objOrArray - the object(s) to save
     * @returns {Promise}
     */
    value: function save(type, objOrArray) {
      var _this = this;

      var arrayObj = [].concat(objOrArray);
      return _hoistContext2['default'].get().then(function (context) {
        return _this._connection.open().then(function (connection) {
          return Promise.all(arrayObj.map(function (obj) {
            return Promise.resolve((0, _helpers.requiredFieldsTransformer)(type, obj)).then(function (data) {
              return (0, _helpers.timestampsTransformer)(data);
            }).then(function (data) {
              var db = connection.db(context.application.dataKey);
              var collection = _bluebird2['default'].promisifyAll(db.collection((0, _helpers.getCollectionName)(data._type, context)));
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
                return collection.findOneAsync({
                  _id: id
                });
              });
            });
          }));
        });
      }).then(function (savedData) {
        if (!_util2['default'].isArray(objOrArray)) {
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
  }, {
    key: 'find',

    /**
     * finds all objects of type matching the given query
     * @param {string} type - the object types
     * @param {object} query - a mongo style query
     * @returns {Promise}
     */
    value: function find(type, query) {
      var _this2 = this;

      return _hoistContext2['default'].get().then(function (context) {
        return _this2._connection.open().then(function (connection) {
          //throw new Error();
          var db = connection.db(context.application.dataKey);
          var collection = db.collection((0, _helpers.getCollectionName)(type, context));
          return _bluebird2['default'].promisifyAll(collection.find(query)).toArrayAsync().then(function (results) {
            return Promise.resolve(results);
          });
        });
      });
    }
  }, {
    key: 'findOne',

    /**
     * finds a single object of type matching the given query
     * @param {string} type - the object types
     * @param {object} query - a mongo style query
     * @returns {Promise}
     */
    value: function findOne(type, query) {
      var _this3 = this;

      return _hoistContext2['default'].get().then(function (context) {
        return _this3._connection.open().then(function (connection) {
          var db = connection.db(context.application.dataKey);
          var collection = _bluebird2['default'].promisifyAll(db.collection((0, _helpers.getCollectionName)(type, context)));
          return collection.findOneAsync(query).then(function (results) {
            return results;
          });
        });
      });
    }
  }, {
    key: 'remove',

    /**
     * removes all objects of type matching the given query
     * @param {string} type - the object types
     * @param {object} query - a mongo style query
     * @returns {Promise}
     */
    value: function remove(type, query) {
      var _this4 = this;

      return _hoistContext2['default'].get().then(function (context) {
        return _this4._connection.open().then(function (connection) {
          var db = connection.db(context.application.dataKey);
          var collection = _bluebird2['default'].promisifyAll(db.collection((0, _helpers.getCollectionName)(type, context)));
          return collection.removeAsync(query).then(function (results) {
            return results;
          });
        });
      });
    }
  }]);

  return DataPipeline;
})();

exports['default'] = DataPipeline;
module.exports = exports['default'];
//# sourceMappingURL=pipeline.js.map