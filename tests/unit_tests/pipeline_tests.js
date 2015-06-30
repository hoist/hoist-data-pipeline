'use strict';
import sinon from 'sinon';
import Context from '@hoist/context';
import {
  expect
}
from 'chai';
import Pipeline from '../../src/pipeline';
/** @test {DataPipeline} */
describe('DataPipeline', function () {
  let dataPipeline;
  before(() => {
    dataPipeline = new Pipeline();
  });
  describe('with bucket', function () {
    var findResults = [{
      _id: 1
    }, {
      _id: 2
    }];

    function StubConnection() {
      this.collection = sinon.stub().returnsThis();
      this.db = sinon.stub().returnsThis();
      this.find = sinon.stub().returnsThis();
      this.findOne = sinon.stub().yields(null, findResults[0]);
      this.toArray = sinon.stub().yields(null, findResults);
      this.updateOne = sinon.stub().yields();
      this.close = sinon.stub();
    }
    var context = new Context({
      application: {
        dataKey: 'datakey'
      },
      environment: 'dev',
      bucket: {
        _id: 'bucket'
      }
    });
    /** @test {DataPipeline#find} */
    describe('DataPipeline#find', function () {
      var result;
      let stubConnection;
      before(function () {
        stubConnection = new StubConnection();
        sinon.stub(dataPipeline._connection, 'open').returns(Promise.resolve(stubConnection));
        sinon.stub(Context, 'get').returns(Promise.resolve(context));
        return dataPipeline.find('people', {
          _id: 'id'
        }).then((r) => {
          result = r;
        });
      });
      after(function () {
        dataPipeline._connection.open.restore();
        Context.get.restore();
      });
      it('uses the application/environment db', function () {
        return expect(stubConnection.db)
          .to.have.been.calledWith('datakey');
      });
      it('uses the correct collection', function () {
        return expect(stubConnection.collection)
          .to.have.been.calledWith('dev:bucket:people');
      });
      it('returns result', function () {
        expect(result).to.eql(findResults);
      });
      it('calls find', function () {
        expect(stubConnection.find)
          .to.have.been.calledWith({
            _id: 'id'
          });
      });
    });
    /** @test {DataPipeline#findOne} */
    describe('DataPipeline#findOne', function () {
      let result;
      let stubConnection;
      before(function () {
        stubConnection = new StubConnection();
        sinon.stub(dataPipeline._connection, 'open').returns(Promise.resolve(stubConnection));
        sinon.stub(Context, 'get').returns(Promise.resolve(context));
        return dataPipeline.findOne('people', {
          _id: 'id'
        }).then((r) => {
          result = r;
        });
      });
      after(function () {
        dataPipeline._connection.open.restore();
        Context.get.restore();
      });
      it('uses the application/environment db', function () {
        return expect(stubConnection.db)
          .to.have.been.calledWith('datakey');
      });
      it('uses the correct collection', function () {
        return expect(stubConnection.collection)
          .to.have.been.calledWith('dev:bucket:people');
      });
      it('returns result', function () {
        expect(result).to.eql(findResults[0]);
      });
      it('calls findOne with correct id', function () {
        expect(stubConnection.findOne)
          .to.have.been.calledWith({
            _id: 'id'
          });
      });
    });
    describe('DataPipeline#save', function () {
      var result;
      let stubConnection;
      let clock;
      before(function () {
        clock = sinon.useFakeTimers();
        stubConnection = new StubConnection();
        sinon.stub(dataPipeline._connection, 'open').returns(Promise.resolve(stubConnection));
        sinon.stub(Context, 'get').returns(Promise.resolve(context));
        return dataPipeline.save('people', {
          _id: 'id'
        }).then((r) => {
          result = r;
        });
      });
      after(function () {
        clock.restore();
        dataPipeline._connection.open.restore();
        Context.get.restore();
      });
      it('uses the application/environment db', function () {
        return expect(stubConnection.db)
          .to.have.been.calledWith('datakey');
      });
      it('uses the correct collection', function () {
        return expect(stubConnection.collection)
          .to.have.been.calledWith('dev:bucket:people');
      });
      it('returns result from findOne', function () {
        return expect(result).to.eql({
          _id: 1
        });
      });
      it('saves correct update', function () {
        return expect(stubConnection.updateOne)
          .to.have.been.calledWith({
            _id: "id"
          }, {
            $set: {
              _type: "people",
              _updatedDate: Date()
            },
            $setOnInsert: {
              _createdDate: Date()
            }
          }, {
            upsert: true
          });
      });
    });
  });
  describe('without bucket', function () {

    var findResults = [{
      _id: 1
    }, {
      _id: 2
    }];

    function StubConnection() {
      this.collection = sinon.stub().returnsThis();
      this.db = sinon.stub().returnsThis();
      this.find = sinon.stub().returnsThis();
      this.findOne = sinon.stub().callsArgWith(1, null, findResults[0]);
      this.toArray = sinon.stub().callsArgWith(0, null, findResults);
      this.close = sinon.stub();
    }


    var context = new Context({
      application: {
        dataKey: 'datakey'
      },
      environment: 'dev'
    });
    /** @test {DataPipeline#find} */
    describe('DataPipeline#find', function () {

      let result;
      let stubConnection;
      before(function () {
        stubConnection = new StubConnection();
        sinon.stub(dataPipeline._connection, 'open').returns(Promise.resolve(stubConnection));
        sinon.stub(Context, 'get').returns(Promise.resolve(context));
        return dataPipeline.find('people', {
          _id: 'id'
        }).then((r) => {
          result = r;
        });
      });
      after(function () {
        dataPipeline._connection.open.restore();
        Context.get.restore();
      });
      it('uses the application/environment db', function () {
        return expect(stubConnection.db)
          .to.have.been.calledWith('datakey');
      });
      it('uses the correct collection', function () {
        return expect(stubConnection.collection)
          .to.have.been.calledWith('dev:global:people');
      });
      it('returns result', function () {
        expect(result).to.eql(findResults);
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
    /** @test {DataPipeline#findOne} */
    describe('DataPipeline#findOne', function () {
      var result;
      let stubConnection;
      before(function () {
        stubConnection = new StubConnection();
        sinon.stub(dataPipeline._connection, 'open').returns(Promise.resolve(stubConnection));
        sinon.stub(Context, 'get').returns(Promise.resolve(context));
        return dataPipeline.findOne('people', {
          _id: 'id'
        }).then((r) => {
          result = r;
        });
      });
      after(function () {
        dataPipeline._connection.open.restore();
        Context.get.restore();
      });
      it('uses the application/environment db', function () {
        return expect(stubConnection.db)
          .to.have.been.calledWith('datakey');
      });
      it('uses the correct collection', function () {
        return expect(stubConnection.collection)
          .to.have.been.calledWith('dev:global:people');
      });
      it('returns result', function () {
        expect(result).to.eql(findResults[0]);
      });
      it('calls findOne', function () {
        expect(stubConnection.findOne)
          .to.have.been.calledWith({
            _id: 'id'
          });
      });
    });
  });
});
