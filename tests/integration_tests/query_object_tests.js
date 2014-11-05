'use strict';
var hoistContext = require('hoist-context');
var sinon = require('sinon');
var BBPromise = require('bluebird');
var model = require('hoist-model');
var Application = model.Application;
var Bucket = model.Bucket;
var Role = model.Role;
var Member = model.Member;
var MongoClient = BBPromise.promisifyAll(require('mongodb').MongoClient);
var config = require('config');
var expect = require('chai').expect;

describe('integration', function () {
  var clock;
  before(function () {
    clock = sinon.useFakeTimers(new Date().getTime());
  });
  after(function () {
    clock.restore();
  });
  describe('findOne', function () {
    var pipeline = require('../../lib/pipeline')(hoistContext);
    var application = new Application({
      _id: 'applicationid',
      dataKey: 'datakey',
      anonymousPermissions: {
        live: []
      }
    });
    var bucket = new Bucket({
      _id: 'bucketid',
      application: application._id,
      environment: 'live'
    });
    var reader = new Role({
      _id: 'readerRoleId',
      application: application._id,
      environment: 'live',
      claims: ['DataRead']
    });
    var globalReader = new Role({
      _id: 'globalReaderRoleId',
      application: application._id,
      environment: 'live',
      claims: ['DataGlobalRead']
    });
    var member = new Member({
      _id: 'memberid',
      application: 'application',
      environment: 'live',
      emailAddresses: [{
        address: 'owen@hoist.io',
        verified: true
      }],
      roles: {}
    });
    var setContext;
    var roles = [reader, globalReader];
    before(function () {
      setContext = function () {
        return hoistContext.get().then(function (context) {
          context.bucket = bucket;
          context.member = member;
          context.application = application;
          context.roles = roles;
          return context;
        });
      };
    });
    describe('in a bucket', function () {
      before(function () {
        var _original = setContext;
        setContext = function () {
          return setContext._original().then(function (context) {
            return context;
          });
        };
        setContext._original = _original;
      });
      after(function () {
        setContext = setContext._original;
      });
      describe('with Read claim', function () {
        before(function () {
          member.roles.bucketRoles = [{
            bucket: bucket._id,
            role: reader._id
          }];
        });
        after(function () {
          member.roles = {};
        });
        describe('when object exists', function () {
          var _result;
          before(function (done) {
            BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
                return collection.insertOneAsync({
                  _id: 'owen.evans',
                  name: 'owen',
                  _createdDate: new Date(),
                  _updatedDate: new Date()
                });
              })
              .then(function () {
                hoistContext.namespace.run(function () {
                  setContext().then(function () {
                    pipeline.findOne('person', {
                      _id: 'owen.evans'
                    }).nodeify(function (err, result) {
                      _result = result;
                      done(err);
                    });
                  });
                });
              });
          });
          after(function () {
            return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = BBPromise.promisifyAll(connection.db('datakey'));
                return db.dropDatabase();
              });
          });
          it('returns object', function () {
            return expect(_result.name).to.eql('owen');
          });
        });
        describe('when many objects exist', function () {
          var _result;
          before(function (done) {
            BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
                return collection.insertManyAsync([{
                  _id: 'jamie.wilson',
                  name: 'jamie',
                  _createdDate: new Date(),
                  _updatedDate: new Date()
                }, {
                  _id: 'owen.evans',
                  name: 'owen',
                  _createdDate: new Date(),
                  _updatedDate: new Date()
                }]);
              })
              .then(function () {
                hoistContext.namespace.run(function () {
                  setContext().then(function () {
                    pipeline.findOne('person', {

                    }).nodeify(function (err, result) {
                      _result = result;
                      done(err);
                    });
                  });
                });
              });
          });
          after(function () {
            return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = BBPromise.promisifyAll(connection.db('datakey'));
                return db.dropDatabase();
              });
          });
          it('returns the "first" object', function () {
            return expect(_result.name).to.eql('jamie');
          });
        });
        describe('when no object exists', function () {
          var _result;
          before(function (done) {

            hoistContext.namespace.run(function () {
              setContext().then(function () {
                pipeline.findOne('person', {

                }).nodeify(function (err, result) {
                  _result = result;
                  done(err);
                });
              });
            });
          });
          after(function () {
            return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = BBPromise.promisifyAll(connection.db('datakey'));
                return db.dropDatabase();
              });
          });
          it('returns NULL', function () {
            return expect(_result).to.be.null;
          });
        });
      });
      describe('without Read claim', function () {
        var error;
        before(function (done) {
          member.roles.bucketRoles = [{
            bucket: bucket._id,
            role: globalReader._id
          }];
          hoistContext.namespace.run(function () {
            setContext().then(function () {
              pipeline.findOne('person', {

              }).nodeify(function (err) {
                error = err;
                done();
              });
            });
          });
        });
        after(function () {
          member.roles = {};
        });
        it('throws a permission error', function () {
          return expect(error.message).to.eql('Current user does not have permission to Read Data');
        });
      });
    });
    describe('with no bucket', function () {
      before(function () {
        var _original = setContext;
        setContext = function () {
          return setContext._original().then(function (context) {
            context.bucket = null;
            return context;
          });
        };
        setContext._original = _original;
      });
      after(function () {
        setContext = setContext._original;
      });
      describe('with GlobalRead claim', function () {
        before(function () {
          member.roles.mainRole = globalReader._id;
        });
        after(function () {
          member.roles = {};
        });
        describe('when object exists', function () {
          var _result;
          before(function (done) {
            BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:global:people'));
                return collection.insertOneAsync({
                  _id: 'owen.evans',
                  name: 'owen',
                  _createdDate: new Date(),
                  _updatedDate: new Date()
                });
              })
              .then(function () {
                hoistContext.namespace.run(function () {
                  setContext().then(function () {
                    pipeline.findOne('person', {
                      _id: 'owen.evans'
                    }).nodeify(function (err, result) {
                      _result = result;
                      done(err);
                    });
                  });
                });
              });
          });
          after(function () {
            return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = BBPromise.promisifyAll(connection.db('datakey'));
                return db.dropDatabase();
              });
          });
          it('returns object', function () {
            return expect(_result.name).to.eql('owen');
          });
        });
        describe('when many objects exist', function () {
          var _result;
          before(function (done) {
            BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:global:people'));
                return collection.insertManyAsync([{
                  _id: 'jamie.wilson',
                  name: 'jamie',
                  _createdDate: new Date(),
                  _updatedDate: new Date()
                }, {
                  _id: 'owen.evans',
                  name: 'owen',
                  _createdDate: new Date(),
                  _updatedDate: new Date()
                }]);
              })
              .then(function () {
                hoistContext.namespace.run(function () {
                  setContext().then(function () {
                    pipeline.findOne('person', {

                    }).nodeify(function (err, result) {
                      _result = result;
                      done(err);
                    });
                  });
                });
              });
          });
          after(function () {
            return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = BBPromise.promisifyAll(connection.db('datakey'));
                return db.dropDatabase();
              });
          });
          it('returns the first object', function () {
            return expect(_result.name).to.eql('jamie');
          });
        });
        describe('when no object exists', function () {
          var _result;
          before(function (done) {

            hoistContext.namespace.run(function () {
              setContext().then(function () {
                pipeline.findOne('person', {

                }).nodeify(function (err, result) {
                  _result = result;
                  done(err);
                });
              });
            });
          });
          after(function () {
            return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = BBPromise.promisifyAll(connection.db('datakey'));
                return db.dropDatabase();
              });
          });
          it('returns NULL',function(){
            return expect(_result).to.be.null;
          });
        });
      });
      describe('without GlobalRead claim', function () {
        var error;
        before(function (done) {
          member.roles.bucketRoles = [{
            bucket: bucket._id,
            role: reader._id
          }];
          hoistContext.namespace.run(function () {
              setContext().then(function () {
                pipeline.findOne('person', {

                }).nodeify(function (err) {
                  error = err;
                  done();
                });
              });
            });
        });
        after(function () {
          member.roles = {};
        });
        it('throws permission error',function(){
          expect(error.message).to.eql('Current user does not have permission to Read Global Data');
        });
      });
    });
  });
  describe('find', function () {
    describe('in a bucket', function () {
      describe('with Read claim', function () {
        describe('when object exists', function () {
          it('returns array with one entry');
        });
        describe('when many objects exist', function () {
          it('returns array with many entries object');
        });
        describe('when no object exists', function () {
          it('returns empty array');
        });
      });
      describe('without Read claim', function () {
        it('throws a permission error');
      });
    });
    describe('with no bucket', function () {
      describe('with GlobalRead claim', function () {
        describe('when object exists', function () {
          it('returns array with one entry');
        });
        describe('when many objects exist', function () {
          it('returns array with many entries object');
        });
        describe('when no object exists', function () {
          it('returns empty array');
        });
      });
      describe('without GlobalRead claim', function () {
        it('throws permission error');
      });
    });
  });
});
