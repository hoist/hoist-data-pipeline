'use strict';
require('../bootstrap');
var BBPromise = require('bluebird');
var MongoClient = BBPromise.promisifyAll(require('mongodb').MongoClient);
var config = require('config');
var hoistContext = require('hoist-context');
var Application = require('hoist-model').Application;
var Member = require('hoist-model').Member;
var Bucket = require('hoist-model').Bucket;
var Role = require('hoist-model').Role;

var expect = require('chai').expect;
var sinon = require('sinon');

describe('saving a hoist object', function () {
  describe('without a bucket', function () {
    var pipeline = require('../../lib/pipeline')(hoistContext);
    var clock;
    before(function (done) {
      clock = sinon.useFakeTimers(new Date().getTime());
      var type = 'Person';
      var object = {
        _id: 'owen.evans',
        name: 'Owen',
        position: 'CTO'
      };
      hoistContext.namespace.run(function () {
        return hoistContext.get().then(function (context) {
            var application = new Application({
              _id: 'applicationid',
              dataKey: 'datakey',
              anonymousPermissions: {
                live: []
              }
            });
            var role = new Role({
              _id: 'roleid',
              application: application._id,
              environment: 'live',
              claims: ['DataGlobalWrite']
            });
            context.member = new Member({
              _id: 'memberid',
              application: 'application',
              environment: 'live',
              emailAddresses: [{
                address: 'owen@hoist.io',
                verified: true
              }],
              roles: {
                mainRole: role._id,
                bucketRoles: []
              }
            });
            context.roles = [role];
            context.application = application;
          })
          .then(function () {
            return pipeline.save(type, object);
          }).then(function () {
            loadObject = BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:global:person'));
                return collection.findOneAsync({}).then(function (obj) {
                  return obj;
                });
              });
          }).nodeify(done);
      });
    });
    var loadObject;
    after(function () {
      clock.restore();
      return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
        .disposer(function (connection) {
          connection.close();
        }), function (connection) {
          var db = BBPromise.promisifyAll(connection.db('datakey'));
          return db.dropDatabase();
        });
    });
    it('saves the object', function () {
      return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
        .disposer(function (connection) {
          connection.close();
        }), function (connection) {
          var db = connection.db('datakey');
          var collection = BBPromise.promisifyAll(db.collection('live:global:person'));
          return collection.countAsync().then(function (count) {
            return expect(count).to.eql(1);
          });
        });
    });
    it('save the object properties', function () {
      return loadObject.then(function (obj) {
        expect(obj._id).to.eql('owen.evans');
        expect(obj.name).to.eql('Owen');
        expect(obj.position).to.eql('CTO');
      });
    });
    it('sets the _type property', function () {
      return loadObject.then(function (obj) {
        expect(obj._type).to.eql('person');
      });
    });
    it('sets created date', function () {
      return loadObject.then(function (obj) {
        expect(obj._createdDate).to.eql(new Date());
      });
    });
    it('sets updated date', function () {
      return loadObject.then(function (obj) {
        expect(obj._updatedDate).to.eql(new Date());
      });
    });
  });
  describe('into a bucket', function () {
    var pipeline = require('../../lib/pipeline')();
    var clock;
    before(function (done) {
      clock = sinon.useFakeTimers(new Date().getTime());
      var type = 'Person';
      var object = {
        _id: 'owen.evans',
        name: 'Owen',
        position: 'CTO'
      };
      hoistContext.namespace.run(function () {
        return hoistContext.get().then(function (context) {
            var application = new Application({
              _id: 'applicationid',
              dataKey: 'datakey',
              anonymousPermissions: {
                live: []
              }
            });
            context.bucket = new Bucket({
              _id: 'bucketid',
              application: application._id,
              environment: 'live'
            });
            var role = new Role({
              _id: 'roleid',
              application: application._id,
              environment: 'live',
              claims: ['DataWrite']
            });
            context.member = new Member({
              _id: 'memberid',
              application: 'application',
              environment: 'live',
              emailAddresses: [{
                address: 'owen@hoist.io',
                verified: true
              }],
              roles: {
                bucketRoles: [{
                  bucket: context.bucket._id,
                  role: role._id
                }]
              }
            });

            context.roles = [role];
            context.application = application;
          })
          .then(function () {
            return pipeline.save(type, object);
          }).then(function () {
            loadObject = BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:person'));
                return collection.findOneAsync({}).then(function (obj) {
                  return obj;
                });
              });
          }).nodeify(done);
      });
    });
    var loadObject;
    after(function () {
      clock.restore();
      return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
        .disposer(function (connection) {
          connection.close();
        }), function (connection) {
          var db = BBPromise.promisifyAll(connection.db('datakey'));
          return db.dropDatabase();
        });
    });
    it('saves the object', function () {
      return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
        .disposer(function (connection) {
          connection.close();
        }), function (connection) {
          var db = connection.db('datakey');
          var collection = BBPromise.promisifyAll(db.collection('live:bucketid:person'));
          return collection.countAsync().then(function (count) {
            return expect(count).to.eql(1);
          });
        });
    });
    it('save the object properties', function () {
      return loadObject.then(function (obj) {
        expect(obj._id).to.eql('owen.evans');
        expect(obj.name).to.eql('Owen');
        expect(obj.position).to.eql('CTO');
      });
    });
    it('sets the _type property', function () {
      return loadObject.then(function (obj) {
        expect(obj._type).to.eql('person');
      });
    });
    it('sets created date', function () {
      return loadObject.then(function (obj) {
        expect(obj._createdDate).to.eql(new Date());
      });
    });
    it('sets updated date', function () {
      return loadObject.then(function (obj) {
        expect(obj._updatedDate).to.eql(new Date());
      });
    });
  });
  describe('with an array of objects', function () {
    var pipeline = require('../../lib/pipeline')();
    var clock;
    before(function (done) {
      clock = sinon.useFakeTimers(new Date().getTime());
      var type = 'Person';
      var objects = [{
        _id: 'owen.evans',
        name: 'Owen',
        position: 'CTO'
      }, {
        _id: 'amelia.lundy',
        name: 'Amelia',
        position: 'Developer'
      }];
      hoistContext.namespace.run(function () {
        return hoistContext.get().then(function (context) {
            var application = new Application({
              _id: 'applicationid',
              dataKey: 'datakey',
              anonymousPermissions: {
                live: []
              }
            });
            context.bucket = new Bucket({
              _id: 'bucketid',
              application: application._id,
              environment: 'live'
            });
            var role = new Role({
              _id: 'roleid',
              application: application._id,
              environment: 'live',
              claims: ['DataWrite']
            });
            context.member = new Member({
              _id: 'memberid',
              application: 'application',
              environment: 'live',
              emailAddresses: [{
                address: 'owen@hoist.io',
                verified: true
              }],
              roles: {
                bucketRoles: [{
                  bucket: context.bucket._id,
                  role: role._id
                }]
              }
            });

            context.roles = [role];
            context.application = application;
          })
          .then(function () {
            return pipeline.save(type, objects);
          }).then(function () {
            loadObject = BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }), function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:person'));
                return BBPromise.promisifyAll(collection.find({})).toArrayAsync();
              });
          }).nodeify(done);
      });
    });
    var loadObject;
    after(function () {
      clock.restore();
      return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
        .disposer(function (connection) {
          connection.close();
        }), function (connection) {
          var db = BBPromise.promisifyAll(connection.db('datakey'));
          return db.dropDatabase();
        });
    });
    it('saves the objects', function () {
      return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
        .disposer(function (connection) {
          connection.close();
        }), function (connection) {
          var db = connection.db('datakey');
          var collection = BBPromise.promisifyAll(db.collection('live:bucketid:person'));
          return collection.countAsync().then(function (count) {
            return expect(count).to.eql(2);
          });
        });
    });
    it('save the object properties', function () {
      return loadObject.then(function (objs) {
        expect(objs[0]._id).to.eql('owen.evans');
        expect(objs[0].name).to.eql('Owen');
        expect(objs[0].position).to.eql('CTO');
        expect(objs[1]._id).to.eql('amelia.lundy');
        expect(objs[1].name).to.eql('Amelia');
        expect(objs[1].position).to.eql('Developer');
      });
    });
    it('sets the _type property', function () {
      return loadObject.then(function (objs) {
        expect(objs[0]._type).to.eql('person');
        expect(objs[1]._type).to.eql('person');
      });
    });
    it('sets created date', function () {
      return loadObject.then(function (objs) {
        expect(objs[0]._createdDate).to.eql(new Date());
        expect(objs[1]._createdDate).to.eql(new Date());
      });
    });
    it('sets updated date', function () {
      return loadObject.then(function (objs) {
        expect(objs[0]._updatedDate).to.eql(new Date());
        expect(objs[1]._updatedDate).to.eql(new Date());
      });
    });
  });
});
