'use strict';
import Bluebird from 'bluebird';
import mongodb from 'mongodb';
import config from 'config';
import logger from '@hoist/logger';
Bluebird.promisifyAll(mongodb.MongoClient);
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

  _openConnection() {
    return this._mongoClient
      .connectAsync(config.get('Hoist.mongo.applications'))
      .then((connection) => {
        //close connection after 2 seconds of inactivity
        this._logger.info('connection opened');
        this._connection = connection;
        this._connection.on('close', () => {
          delete this._connection;
        });
        Bluebird.promisifyAll(this._connection);
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
      return Promise.resolve(this._connection);
    } else {
      return this._openConnection();
    }

  }
}

export default MongoConnection;
