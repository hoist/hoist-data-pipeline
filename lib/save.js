'use strict';
var mongoConnection = require('./mongo_connection');
var BBPromise = require('bluebird');

module.exports = function (hoistContext) {
  hoistContext = hoistContext || require('hoist-context');
  return {
    apply: function (json) {
      return BBPromise.using(hoistContext.get(), mongoConnection.getConnection(), function (context, connection) {
        var db = connection.db(context.application.dataKey);
        var collection = BBPromise.promisifyAll(db.collection(context.environment + ":" + context.bucket.key + ":" + json._type.toLowerCase()));
        return collection.updateOneAsync({
          _id: json._id
        }, {
          $set: json
        }, {
          upsert: true
        });
      });
    }
  };
};
