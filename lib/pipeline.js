'use strict';
var _ = require('lodash');
var BBPromise = require('bluebird');
module.exports = function (Context) {
  Context = Context || require('hoist-context');
  return {
    requiredFields: require('./required_fields'),
    storage: require('./storage')(Context),
    timestamps: require('./timestamps'),
    authentication: require('./authentication')(Context),
    query: require('./query')(Context),
    save: function (type, objOrArray) {
      var arrayObj = [].concat(objOrArray);
      return BBPromise.all(_.map(arrayObj, function (obj) {
        return Context.get().bind(this)
          .then(function (context) {
            if (context.bucket) {
              return this.authentication.apply(Context.claims.data.Write);
            } else {
              return this.authentication.apply(Context.claims.data.GlobalWrite);
            }
          }).then(function () {
            return this.requiredFields.apply(type, obj);
          }).then(function (data) {
            return this.timestamps.apply(data);
          }).then(function (data) {
            return this.storage.apply(data);
          });
      }, this)).bind(this);
    }
  };
};
