'use strict';
var BBPromise = require('bluebird');
var mongodb = BBPromise.promisifyAll(require('mongodb'));
var config = require('config');


function MongoConnection() {
    this._mongoClient = BBPromise.promisifyAll(mongodb.MongoClient);
  }
  /* istanbul ignore next */
MongoConnection.prototype.setClient = function (mongoClient) {
  this._mongoClient = BBPromise.promisifyAll(mongoClient);
};
MongoConnection.prototype.getConnection = function () {
  return this._mongoClient.connectAsync(config.get('Hoist.mongo.db'))
    .disposer(function (connection) {
      connection.close();
    });
};
module.exports = new MongoConnection();
