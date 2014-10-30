'use strict';
module.exports = function (Context) {
  Context = Context || require('hoist-context');
  return {
    requiredFields: require('./required_fields'),
    save: require('./save'),
    timestamps: require('./timestamps'),
    authentication: require('./authentication')(Context),
    query: require('./query')
  };
};
