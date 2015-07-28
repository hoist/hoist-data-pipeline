'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getCollectionName = getCollectionName;
exports.requiredFieldsTransformer = requiredFieldsTransformer;
exports.timestampsTransformer = timestampsTransformer;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _shortid = require('shortid');

var _shortid2 = _interopRequireDefault(_shortid);

/**
 * given a type and context resolve the collection name
 * @param {string} type - this instance type
 * @param {object} context - the current context
 * @returns {string} the collection name to use
 */

function getCollectionName(type, context) {
  var bucketId = 'global';
  if (context.bucket) {
    bucketId = context.bucket._id;
  }
  return context.environment + ':' + bucketId + ':' + (0, _pluralize2['default'])(type).toLowerCase();
}

function ensureId(json) {
  if (!json._id) {
    json._id = (0, _shortid2['default'])();
  }
  return json;
}

function ensureType(type, json) {
  json._type = type.toLowerCase();
  return json;
}

/**
 * adds any required fields to the instance
 * @param {string} type - the type of the instance
 * @param {object} instance - the instance to transform
 * @returns {object} the transformed instance
 */

function requiredFieldsTransformer(type, instance) {
  return ensureId(ensureType(type, instance));
}

/**
 * adds timestamps to an instance
 * @param {object} instance - the instance to transform
 * @returns {object} the transformed instance
 */

function timestampsTransformer(instance) {
  instance._createdDate = new Date();
  instance._updatedDate = new Date();
  return instance;
}
//# sourceMappingURL=helpers.js.map