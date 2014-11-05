'use strict';
var mongoConnection = require('./mongo_connection');
var BBPromise = require('bluebird');

module.exports = function (hoistContext) {
  hoistContext = hoistContext || require('hoist-context');
  return {
    apply: function (json) {
      return BBPromise.using(hoistContext.get(), mongoConnection.getConnection(), function (context, connection) {
        var db = connection.db(context.application.dataKey);
        var bucketId = 'global';
        if(context.bucket){
          bucketId = context.bucket._id;
        }
        var collection = BBPromise.promisifyAll(db.collection(context.environment + ":" + bucketId + ":" + json._type.toLowerCase()));
        var createdDate = new Date();

        if(json._createdDate){
          createdDate = json._createdDate;
          delete json._createdDate;
        }
        var id = json._id;
        delete json._id;
        return collection.updateOneAsync({
          _id: id
        }, {
          $set: json,
          $setOnInsert: {
            _createdDate:createdDate
          }
        }, {
          upsert: true
        });
      });
    }
  };
};
