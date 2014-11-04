'use strict';
require('../bootstrap');
var sinon = require('sinon');
var Context = require('hoist-context');
var mongoConnection = require('../../lib/mongo_connection');
var BBPromise = require('bluebird');
var expect = require('chai').expect;
var queryApi = require('../../lib/query')(Context);
describe('query api', function () {
  var expectedResults = [{
    _id: 1
  }, {
    _id: 2
  }];

  function StubConnection() {
    this.collection = sinon.stub().returnsThis();
    this.db = sinon.stub().returnsThis();
    this.find = sinon.stub().returnsThis();
    this.findOne = sinon.stub().callsArgWith(1, null, expectedResults[0]);
    this.toArray = sinon.stub().callsArgWith(0, null, expectedResults);
    this.close = sinon.stub();
  }
  var stubConnection = new StubConnection();

  var context = new Context({
    application: {
      dataKey: 'datakey'
    },
    environment: 'dev',
    bucket: {
      key: 'bucket'
    }
  });
  describe('.find', function () {
    var result;
    before(function (done) {
      sinon.stub(mongoConnection, 'getConnection').returns(BBPromise.resolve(stubConnection).disposer(function (connection) {
        connection.close();
      }));
      sinon.stub(Context, 'get').returns(BBPromise.resolve(context));
      queryApi.find('people', {
        _id: 'id'
      }, function (err, r) {
        if (err) {
          return done(err);
        }
        result = r;
        done();
      });
    });
    after(function () {
      mongoConnection.getConnection.restore();
      Context.get.restore();
    });
    it('uses the application/environment collection', function () {
      return expect(stubConnection.db)
        .to.have.been.calledWith('datakey');
    });
    it('closes connection', function () {
      return expect(stubConnection.close)
        .to.have.been.called;
    });
    it('returns result', function () {
      expect(result).to.eql(expectedResults);
    });
    it('calls find', function () {
      expect(stubConnection.find)
        .to.have.been.calledWith({
          _id: 'id'
        });
    });
    it('calls toArray', function () {
      return expect(stubConnection.toArray)
        .to.have.been.called;
    });
  });
  describe('.findOne', function () {
    var result;
    before(function (done) {
      sinon.stub(mongoConnection, 'getConnection').returns(BBPromise.resolve(stubConnection).disposer(function (connection) {
        connection.close();
      }));
      sinon.stub(Context, 'get').returns(BBPromise.resolve(context));
      queryApi.findOne('people', {
        _id: 'id'
      }, function (err, r) {
        if (err) {
          return done(err);
        }
        result = r;
        done();
      });
    });
    after(function () {
      mongoConnection.getConnection.restore();
      Context.get.restore();
    });
    it('uses the application/environment collection', function () {
      return expect(stubConnection.db)
        .to.have.been.calledWith('datakey');
    });
    it('closes connection', function () {
      return expect(stubConnection.close)
        .to.have.been.called;
    });
    it('returns result', function () {
      expect(result).to.eql(expectedResults[0]);
    });
    it('calls findOne', function () {
      expect(stubConnection.findOne)
        .to.have.been.calledWith({
          _id: 'id'
        });
    });
  });
});
