'use strict';
import MongoConnection from '../../src/mongo_connection';
import sinon from 'sinon';
import {
  expect
}
from 'chai';

/** @test {MongoConnection} */
describe('MongoConnection', () => {
  let mongoConnection;
  before(() => {
    mongoConnection = new MongoConnection();
  });
  /** @test {MongoConnection#open} */
  describe('MongoConnection#open', () => {
    describe('with existing connection', () => {
      let connection = {};
      let clock;
      let result;
      let originalTimeoutCalled = false;
      before(() => {
        clock = sinon.useFakeTimers();
        mongoConnection._connection = connection;
        mongoConnection._connectionTimeout = setTimeout(() => {
          originalTimeoutCalled = true;
        }, 100);
        return mongoConnection.open().then((c) => {
          result = c;
        });
      });
      after(() => {
        delete mongoConnection._connection;
        clearTimeout(mongoConnection._connectionTimeout);
        delete mongoConnection._connectionTimeout;
        clock.restore();
      });
      it('reuses connection', () => {
        return expect(result).to.eql(connection);
      });
      it('resets timeout', () => {
        return Promise.resolve()
          .then(() => {
            clock.tick(1000);
          }).then(() => {
            return expect(originalTimeoutCalled).to.eql(false) &&
              expect(mongoConnection._connectionTimeout).to.exist;
          });
      });
    });
    describe('without existing connection', () => {
      let connection = {
        closeAsync: sinon.stub().returns(Promise.resolve(null))
      };
      let clock;
      let result;
      before(() => {
        clock = sinon.useFakeTimers();
        sinon.stub(mongoConnection._mongoClient, 'connectAsync').returns(Promise.resolve(connection));
        return mongoConnection.open().then((c) => {
          result = c;
        });
      });
      after(() => {
        delete mongoConnection._connection;
        clearTimeout(mongoConnection._connectionTimeout);
        delete mongoConnection._connectionTimeout;
        clock.restore();
      });
      it('returns connection', () => {
        return expect(result).to.eql(connection);
      });
      it('saves connection', () => {
        return expect(mongoConnection._connection).to.eql(connection);
      });
      it('sets timeout', () => {
        return Promise.resolve()
          .then(() => {
            return expect(connection.closeAsync).to.not.have.been.called;
          })
          .then(() => {
            clock.tick(2200);
          }).then(() => {
            return expect(connection.closeAsync).to.have.been.called;
          }).then(() => {
            return expect(mongoConnection._connection).to.not.exist;
          }).then(() => {
            mongoConnection._connection = connection;
          });
      });
    });
  });
});
