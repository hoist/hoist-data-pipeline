'use strict';
var mongoConnection = require('./mongo_connection');
var BBPromise = require('bluebird');
var pluralize = require('pluralize');

var Storage = function (HoistContext) {
  this.HoistContext = HoistContext;
};
Storage.prototype = {
  _getCollectionName: function (type, context) {
    var bucketId = 'global';
    if (context.bucket) {
      bucketId = context.bucket._id;
    }
    return context.environment + ":" + bucketId + ":" + pluralize(type).toLowerCase();
  },
  apply: function (json) {
    var self = this;
    return BBPromise.using(self.HoistContext.get(), mongoConnection.getConnection(), function (context, connection) {
      var db = connection.db(context.application.dataKey);
      var collection = BBPromise.promisifyAll(db.collection(self._getCollectionName(json._type, context)));
      var createdDate = new Date();

      if (json._createdDate) {
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
          _createdDate: createdDate
        }
      }, {
        upsert: true
      });
    });
  }
};


module.exports = function (hoistContext) {
  hoistContext = hoistContext || /* istanbul ignore next */ require('hoist-context');
  return new Storage(hoistContext);
};
