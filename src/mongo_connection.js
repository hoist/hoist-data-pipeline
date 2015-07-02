'use strict';
var BBPromise = require('bluebird');
var mongodb = require('mongodb');
var config = require('config');
var logger = require('@hoist/logger');
BBPromise.promisifyAll(mongodb.MongoClient);
/**
 * marshalling class for connection to mongodb
 */
class MongoConnection {
  /**
   * create a new instance
   */
  constructor() {
    this._mongoClient = mongodb.MongoClient;
    this._logger = logger.child({
      cls: this.constructor.name
    });
  }


  _clearTimeout() {
    if (this._connectionTimeout) {
      this._logger.info('clearing timeout');
      clearTimeout(this._connectionTimeout);
    }
  }
  _resetTimeout() {
    if (this._connectionTimeout) {
      this._logger.info('clearing timeout');
      clearTimeout(this._connectionTimeout);
    }
    this._connectionTimeout = setTimeout(() => {
      this._connection.closeAsync();
      delete this._connection;
    }, 2000);
  }
  _openConnection() {
    this._clearTimeout();
    return this._mongoClient
      .connectAsync(config.get('Hoist.mongo.applications'))
      .then((connection) => {
        //close connection after 2 seconds of inactivity
        this._resetTimeout();
        this._logger.info('connection opened');
        this._connection = connection;
        return connection;
      });
  }

  /**
   * close any open connection to mongo
   * @returns {Promise}
   */
  close() {
    if (!this._connection) {
      return Promise.resolve();
    }
    this._clearTimeout();
    let connection = this._connection;
    delete this._connection;
    return connection.closeAsync();
  }

  /**
   * Attempt to reuse mongo connection or open one if it doesn't exist
   * @returns {Promise}
   */
  open() {
    if (this._connection) {
      this._resetTimeout();
      return Promise.resolve(this._connection);
    } else {
      return this._openConnection();
    }

  }
}

export default MongoConnection;
