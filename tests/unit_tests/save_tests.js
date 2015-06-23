'use strict';
var sinon = require('sinon');
var BBPromise = require('bluebird');
var Context = require('@hoist/context');
var mongoConnection = require('../../lib/mongo_connection');
var saveApi = require('../../lib/storage')(Context);
var expect = require('chai').expect;

describe('save', function () {
  describe('.apply', function () {
    var context = new Context({
      application: {
        dataKey: 'datakey'
      },
      environment: 'dev',
      bucket: {
        _id: 'bucket'
      }
    });

    function StubConnection() {
      this.collection = sinon.stub().returnsThis();
      this.db = sinon.stub().returnsThis();
      this.updateOne = sinon.stub().callsArg(3);
      this.findOne = sinon.stub().callsArgWith(1, null, {
        saved: true
      });
      this.close = sinon.stub();
    }

    var stubConnection = new StubConnection();
    var clock;
    before(function () {
      clock = sinon.useFakeTimers(new Date().getTime());
      sinon.stub(Context, 'get').returns(BBPromise.resolve(context));
      sinon.stub(mongoConnection, 'getConnection').returns(BBPromise.resolve(stubConnection).disposer(function (connection) {
        connection.close();
      }));
      saveApi.apply({
        _id: 'myid',
        _type: 'type',
        name: 'name'
      });
    });
    after(function () {
      clock.restore();
      mongoConnection.getConnection.restore();
      Context.get.restore();
    });
    it('uses correct collection', function () {
      expect(stubConnection.collection).to.have.been.calledWith('dev:bucket:types');
    });
    it('saves the object', function () {
      return expect(stubConnection.updateOne)
        .to.have.been.calledWith({
          _id: 'myid'
        }, {
          $set: {
            name: 'name',
            _type: 'type'
          },
          $setOnInsert: {
            _createdDate: new Date()
          }
        }, {
          upsert: true
        });
    });
  });
});
