'use strict';
import mongoConnection from '../../src/mongo_connection';
import sinon from 'sinon';
import {
  expect
}
from 'chai';

/** @test {MongoConnection} */
describe('MongoConnection', () => {
  /** @test {MongoConnection#open} */
  describe('MongoConnection#open', () => {
    describe('with existing connection', () => {
      let connection = {};
      let clock;
      let result;
      before(() => {
        clock = sinon.useFakeTimers();
        mongoConnection._connection = connection;
        return mongoConnection.open().then((c) => {
          result = c;
        });
      });
      after(() => {
        delete mongoConnection._connection;
        clock.restore();
      });
      it('reuses connection', () => {
        return expect(result).to.eql(connection);
      });
    });
    describe('without existing connection', () => {
      let connection = {
        closeAsync: sinon.stub().returns(Promise.resolve(null)),
        on: sinon.stub()
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
        clock.restore();
      });
      it('returns connection', () => {
        return expect(result).to.eql(connection);
      });
      it('saves connection', () => {
        return expect(mongoConnection._connection).to.eql(connection);
      });
    });
  });
});
