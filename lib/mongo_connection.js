'use strict';
var BBPromise = require('bluebird');
var mongodb = BBPromise.promisifyAll(require('mongodb'));
var config = require('config');
var logger = require('hoist-logger');

function MongoConnection() {
    this._mongoClient = BBPromise.promisifyAll(mongodb.MongoClient);
  }
  /* istanbul ignore next */
MongoConnection.prototype.setClient = function (mongoClient) {
  this.close();
  this._mongoClient = BBPromise.promisifyAll(mongoClient);

};
MongoConnection.prototype.close = function () {
  if (!this.connectionPromise) {
    return BBPromise.resolve(null);
  }
  return this.connectionPromise.bind(this).then(function (connection) {
    delete this.connectionPromise;
    return connection.closeAsync();
  });
};
MongoConnection.prototype.openConnection = function () {
  return this._mongoClient.connectAsync(config.get('Hoist.mongo.db')).then(function (connection) {
    logger.info('connection opened');
    return connection;
  });
};
MongoConnection.prototype.getConnection = function () {
  return this.connectionPromise || (this.connectionPromise = this.openConnection());
};
module.exports = new MongoConnection();
