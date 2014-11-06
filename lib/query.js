'use strict';
var mongoConnection = require('./mongo_connection');
var BBPromise = require('bluebird');
var pluralize = require('pluralize');
module.exports = function (hoistContext) {
  hoistContext = hoistContext || /* istanbul ignore next */ require('hoist-context');
  return {
    _getCollectionName: function (type, context) {
      var bucketId = 'global';
      if (context.bucket) {
        bucketId = context.bucket._id;
      }
      return context.environment + ":" + bucketId + ":" + pluralize(type).toLowerCase();
    },
    findOne: function (type, query, callback) {
      var self = this;
      return BBPromise.using(hoistContext.get(), mongoConnection.getConnection(), function (context, connection) {
        var db = connection.db(context.application.dataKey);
        var collection = BBPromise.promisifyAll(db.collection(self._getCollectionName(type, context)));
        return collection.findOneAsync(query)
          .then(function (results) {
            return results;
          });
      }).bind(self).nodeify(callback);
    },
    find: function (type, query, callback) {
      var self = this;
      return BBPromise.using(mongoConnection.getConnection(), hoistContext.get(), function (connection, context) {
        //throw new Error();

        var db = connection.db(context.application.dataKey);
        var collection = db.collection(self._getCollectionName(type, context));
        return BBPromise.promisifyAll(collection.find(query)).toArrayAsync()
          .then(function (results) {
            return BBPromise.resolve(results);
          });
      }).bind(self).nodeify(callback);

    }
  };
};
