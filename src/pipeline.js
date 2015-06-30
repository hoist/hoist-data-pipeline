'use strict';
import util from 'util';
import MongoConnection from './mongo_connection';
import Context from '@hoist/context';
import {
  requiredFieldsTransformer,
  timestampsTransformer,
  getCollectionName
}
from './helpers';
import Bluebird from 'bluebird';
import logger from '@hoist/logger';
/**
 * application data api pipeline
 */
class DataPipeline {
  /**
   * create a new pipeline
   */
  constructor() {
    this._connection = new MongoConnection();
    let applicationId;
    let context = Context.current();
    if (context && context.application) {
      applicationId = context.application._id;
    }
    this._logger = logger.child({
      cls: this.constructor.name,
      applicationId: applicationId
    });
  }

  /**
   * save an object or set of objects as a type
   * @param {string} type - the object types
   * @param {object|Array<object>} objOrArray - the object(s) to save
   * @returns {Promise}
   */
  save(type, objOrArray) {
    var arrayObj = [].concat(objOrArray);
    this._logger.info('saving data');
    return Context.get().then((context) => {
      this._logger.info('opening connection');
      return this._connection.open().then((connection) => {
        return Promise.all(arrayObj.map((obj) => {
          return Promise.resolve(requiredFieldsTransformer(type, obj))
            .then((data) => {
              return timestampsTransformer(data);
            }).then((data) => {
              this._logger.info('sending to mongo');
              var db = connection.db(context.application.dataKey);
              var collection = Bluebird.promisifyAll(db.collection(getCollectionName(data._type, context)));
              var createdDate = new Date();
              if (data._createdDate) {
                createdDate = data._createdDate;
                delete data._createdDate;
              }
              var id = data._id;
              delete data._id;
              return collection.updateOneAsync({
                _id: id
              }, {
                $set: data,
                $setOnInsert: {
                  _createdDate: createdDate
                }
              }, {
                upsert: true
              }).then(() => {
                this._logger.info('finding post save');
                return collection.findOneAsync({
                  _id: id
                });
              });
            });

        }));
      });
    }).then((savedData) => {
      if (!util.isArray(objOrArray)) {
        if (savedData.length < 2) {
          if (savedData.length < 1) {
            return null;
          } else {
            return savedData[0];
          }
        }
      }
      return savedData;
    });
  }

  /**
   * finds all objects of type matching the given query
   * @param {string} type - the object types
   * @param {object} query - a mongo style query
   * @returns {Promise}
   */
  find(type, query) {
    this._logger.info('finding data');
    return Context.get().then((context) => {
      this._logger.info('opening connection data');
      return this._connection.open().then((connection) => {
        //throw new Error();
        var db = connection.db(context.application.dataKey);
        var collection = db.collection(getCollectionName(type, context));
        return Bluebird.promisifyAll(collection.find(query)).toArrayAsync()
          .then((results) => {
            this._logger.info('retrieved data');
            return Promise.resolve(results);
          });
      });
    });
  }

  /**
   * finds a single object of type matching the given query
   * @param {string} type - the object types
   * @param {object} query - a mongo style query
   * @returns {Promise}
   */
  findOne(type, query) {
    this._logger.info('finding single');
    return Context.get().then((context) => {
      this._logger.info('opening connection');
      return this._connection.open().then((connection) => {
        var db = connection.db(context.application.dataKey);
        var collection = Bluebird.promisifyAll(db.collection(getCollectionName(type, context)));
        return collection.findOneAsync(query)
          .then((results) => {
            this._logger.info('retrieved data');
            return results;
          });
      });
    });
  }

  /**
   * removes all objects of type matching the given query
   * @param {string} type - the object types
   * @param {object} query - a mongo style query
   * @returns {Promise}
   */
  remove(type, query) {
    this._logger.info('removing data');
    return Context.get().then((context) => {
      this._logger.info('opening connection');
      return this._connection.open().then((connection) => {
        var db = connection.db(context.application.dataKey);
        var collection = Bluebird.promisifyAll(db.collection(getCollectionName(type, context)));
        return collection.removeAsync(query)
          .then((results) => {
            this._logger.info('removed data');
            return results;
          });
      });
    });
  }
}

export default DataPipeline;
