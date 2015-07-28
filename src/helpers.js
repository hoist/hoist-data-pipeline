'use strict';
import pluralize from 'pluralize';
import shortid from 'shortid';

/**
 * given a type and context resolve the collection name
 * @param {string} type - this instance type
 * @param {object} context - the current context
 * @returns {string} the collection name to use
 */
export function getCollectionName(type, context) {
  var bucketId = 'global';
  if (context.bucket) {
    bucketId = context.bucket._id;
  }
  return context.environment + ":" + bucketId + ":" + pluralize(type).toLowerCase();
}


function ensureId(json) {
  if (!json._id) {
    json._id = shortid();
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
export function requiredFieldsTransformer(type, instance) {
  return ensureId(ensureType(type, instance));
}

/**
 * adds timestamps to an instance
 * @param {object} instance - the instance to transform
 * @returns {object} the transformed instance
 */

export function timestampsTransformer(instance) {
  instance._createdDate = new Date();
  instance._updatedDate = new Date();
  return instance;
}
