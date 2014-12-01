'use strict';
var BBPromise = require('bluebird');
var HoistContext;
var errors = require('hoist-errors');
var config = require('config');

var AuthenticationPipeline = {

};

AuthenticationPipeline.hasApplication = function (callback) {
  return BBPromise.try(function () {
    return HoistContext.get();
  }).then(function (context) {
    if ((!context) || (!context.application)) {
      throw new errors.context.ApplicationRequiredError();
    }
    return true;
  }).nodeify(callback);
};
AuthenticationPipeline.hasPermission = function (claim, callback) {
  return HoistContext.get().then(function checkClaim(context) {
    return context.hasClaim(claim)
      .then(function checkClaimResponse(hasClaim) {
        if (config.get('Hoist.data.checkAuth')) {
          if (!hasClaim) {
            throw new errors.context.PermissionDeniedError('Current user does not have permission to ' + claim.name);
          }
        }
        return true;
      });
  }).nodeify(callback);
};
AuthenticationPipeline.apply = function (claim, callback) {
  return AuthenticationPipeline.hasApplication().then(function () {
    return AuthenticationPipeline.hasPermission(claim);
  }).nodeify(callback);
};

module.exports = function (Context) {
  HoistContext = Context;
  return AuthenticationPipeline;
};
