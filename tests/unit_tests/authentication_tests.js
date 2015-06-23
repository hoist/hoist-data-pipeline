'use strict';
require('../bootstrap');
var Context = require('@hoist/context');
var sinon = require('sinon');
var expect = require('chai').expect;
var authentication = require('../../lib/authentication')(Context);
var BBPromise = require('bluebird');

describe('Authentication', function () {
  describe('.apply', function () {
    var claim = Context.claims.create({});
    before(function (done) {

      sinon.stub(authentication, 'hasApplication').returns(BBPromise.resolve(true));
      sinon.stub(authentication, 'hasPermission').returns(BBPromise.resolve(true));
      authentication.apply(claim, done);
    });
    after(function () {
      authentication.hasApplication.restore();
      authentication.hasPermission.restore();
    });
    it('calls hasApplication', function () {
      /* jshint -W030 */
      expect(authentication.hasApplication)
        .to.have.been.called;
    });
    it('calls hasPermission', function () {
      expect(authentication.hasPermission)
        .to.have.been.calledWith(claim);
    });
  });
  describe('.hasApplication', function () {
    var context = new Context({
      application: {
        name: 'value'
      }
    });
    var stubContextGet;
    before(function () {
      stubContextGet = sinon.stub(Context, 'get');
    });
    after(function () {
      Context.get.restore();
    });
    it('returns true if application in context', function () {
      stubContextGet.returns(BBPromise.resolve(context));
      return expect(authentication.hasApplication()).to.become(true);
    });
    it('rejects if application not in context', function () {
      stubContextGet.returns(BBPromise.resolve(null));
      return expect(authentication.hasApplication())
        .to.be.rejectedWith('Context currently has no application set');
    });
  });
  describe('hasPermission', function () {
    var context = new Context({
      hasClaim: sinon.stub()
    });
    var stubContextGet;
    before(function () {
      stubContextGet = sinon.stub(Context, 'get').returns(BBPromise.resolve(context));
    });
    after(function () {
      Context.get.restore();
    });
    it('rejects if no matching claim', function () {
      context.hasClaim.returns(BBPromise.resolve(false));
      var claim = Context.claims.create({
        name: 'test claim'
      });
      return expect(authentication.hasPermission(claim)).to.be.rejectedWith('Current user does not have permission to test claim').then(function () {
        return expect(context.hasClaim).to.have.been.calledWith(claim);
      });
    });
    it('returns true if matching claim', function () {
      context.hasClaim.returns(BBPromise.resolve(true));
      var claim = Context.claims.create({
        name: 'test claim'
      });
      return expect(authentication.hasPermission(claim)).to.become(true).then(function () {
        return expect(context.hasClaim).to.have.been.calledWith(claim);
      });
    });
  });
});
