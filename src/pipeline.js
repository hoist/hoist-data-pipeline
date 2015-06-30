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
/**
 * application data api pipeline
 */
class DataPipeline {
  /**
   * create a new pipeline
   */
  constructor() {
    this._connection = new MongoConnection();
  }

  /**
   * save an object or set of objects as a type
   * @param {string} type - the object types
   * @param {object|Array<object>} objOrArray - the object(s) to save
   * @returns {Promise}
   */
  save(type, objOrArray) {
    var arrayObj = [].concat(objOrArray);
    return Context.get().then((context) => {
      return this._connection.open().then((connection) => {
        return Promise.all(arrayObj.map((obj) => {
          return Promise.resolve(requiredFieldsTransformer(type, obj))
            .then((data) => {
              return timestampsTransformer(data);
            }).then((data) => {
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
              }).then(function () {
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
    return Context.get().then((context) => {
      return this._connection.open().then((connection) => {
        //throw new Error();
        var db = connection.db(context.application.dataKey);
        var collection = db.collection(getCollectionName(type, context));
        return Bluebird.promisifyAll(collection.find(query)).toArrayAsync()
          .then(function (results) {
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
    return Context.get().then((context) => {
      return this._connection.open().then((connection) => {
        var db = connection.db(context.application.dataKey);
        var collection = Bluebird.promisifyAll(db.collection(getCollectionName(type, context)));
        return collection.findOneAsync(query)
          .then(function (results) {
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
    return Context.get().then((context) => {
      return this._connection.open().then((connection) => {
        var db = connection.db(context.application.dataKey);
        var collection = Bluebird.promisifyAll(db.collection(getCollectionName(type, context)));
        return collection.removeAsync(query)
          .then(function (results) {
            return results;
          });
      });
    });
  }
}

export default DataPipeline;
