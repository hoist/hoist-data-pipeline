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
  this._mongoClient = BBPromise.promisifyAll(mongoClient);
};
MongoConnection.prototype.getConnection = function () {
  logger.info('opening connection');
  return this._mongoClient.connectAsync(config.get('Hoist.mongo.db'))
    .disposer(function (connection) {
      logger.info('closing connection');
      connection.close(function (error) {
        if (error) {
          logger.alert(error);
          logger.error(error);
        }
      });
    });
};
module.exports = new MongoConnection();
