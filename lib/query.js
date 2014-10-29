'use strict';
var mongoConnection = require('./mongo_connection');
var hoistContext = require('hoist-context');
var BBPromise = require('bluebird');

module.exports = {
  findOne: function (type, query, callback) {
    return BBPromise.using(hoistContext.get(), mongoConnection.getConnection(), function (context, connection) {
      var db = connection.db(context.application.dataKey);
      var collection = BBPromise.promisifyAll(db.collection(context.environment + ":" + context.bucket.key + ":" + type.toLowerCase()));
      return collection.findOneAsync(query)
        .then(function (results) {
          return results;
        });
    }).nodeify(callback);
  },
  find: function (type, query, callback) {

    return BBPromise.using(mongoConnection.getConnection(), function (connection) {
      //throw new Error();
      return hoistContext.get().then(function (context) {
        var db = connection.db(context.application.dataKey);
        var collection = db.collection(context.environment + ":" + context.bucket.key + ":" + type.toLowerCase());
        return BBPromise.promisifyAll(collection.find(query)).toArrayAsync()
          .then(function (results) {
            return BBPromise.resolve(results);
          });
      });


    }).nodeify(callback);

  }
};
