'use strict';
var shortId = require('shortid');

var RequiredFieldsTransformer = {

};

RequiredFieldsTransformer.ensureId = function (json) {
  if (!json._id) {
    json._id = shortId();
  }
  return json;
};
RequiredFieldsTransformer.ensureType = function (type, json) {
  json._type = type.toLowerCase();
  return json;
};
RequiredFieldsTransformer.apply = function (type, json) {
  return RequiredFieldsTransformer.ensureId(RequiredFieldsTransformer.ensureType(type, json));
};

module.exports = RequiredFieldsTransformer;
