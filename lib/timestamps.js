'use strict';
var BBPromise = require('bluebird');

module.exports = {
  apply: function (json) {
    json._createdDate = new Date();
    json._updatedDate = new Date();
    return BBPromise.resolve(json);
  }
};
