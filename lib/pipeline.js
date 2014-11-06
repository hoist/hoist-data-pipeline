'use strict';
var _ = require('lodash');
var BBPromise = require('bluebird');

function Pipeline(Context){
  this.Context = Context;
  this.storage= require('./storage')(Context);
  this.authentication= require('./authentication')(Context);
  this.query= require('./query')(Context);
}
Pipeline.prototype = {
  timestamps: require('./timestamps'),
  requiredFields: require('./required_fields'),
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
      }, this)).bind(this).nodeify(callback);
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

module.exports = function (Context) {
  Context = Context || require('hoist-context');
  return new Pipeline(Context);
};
