'use strict';
var _ = require('lodash');
var BBPromise = require('bluebird');
var util = require('util');

function Pipeline(Context) {
  this.Context = Context;
  this.storage = require('./storage')(Context);
  this.authentication = require('./authentication')(Context);
  this.query = require('./query')(Context);
}
Pipeline.prototype = {
  timestamps: require('./timestamps'),
  requiredFields: require('./required_fields'),
  connection: require('./mongo_connection'),
  save: function (type, objOrArray, callback) {
    var arrayObj = [].concat(objOrArray);
    return BBPromise.all(_.map(arrayObj, function (obj) {
      return this.Context.get().bind(this)
        .then(function (context) {
          if (context.bucket) {
            return this.authentication.apply(this.Context.claims.data.Write);
          } else {
            return this.authentication.apply(this.Context.claims.data.GlobalWrite);
          }
        }).then(function () {
          return this.requiredFields.apply(type, obj);
        }).then(function (data) {
          return this.timestamps.apply(data);
        }).then(function (data) {
          return this.storage.apply(data);
        });
    }, this)).bind(this).then(function (savedData) {

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
    }).nodeify(callback);
  },
  find: function (type, query, callback) {
    return this.Context.get().bind(this)
      .then(function (context) {
        if (context.bucket) {
          return this.authentication.apply(this.Context.claims.data.Read);
        } else {
          return this.authentication.apply(this.Context.claims.data.GlobalRead);
        }
      }).then(function () {
        return this.query.find(type, query);
      }).nodeify(callback);
  },
  findOne: function (type, query, callback) {
    return this.Context.get().bind(this)
      .then(function (context) {
        if (context.bucket) {
          return this.authentication.apply(this.Context.claims.data.Read);
        } else {
          return this.authentication.apply(this.Context.claims.data.GlobalRead);
        }
      }).then(function () {
        return this.query.findOne(type, query);
      }).nodeify(callback);
  }
};

function createPipeline(Context) {
  Context = Context || require('hoist-context');
  return new Pipeline(Context);
}
createPipeline.Pipeline = Pipeline;
module.exports = createPipeline;
