'use strict';
require('../bootstrap');
var BBPromise = require('bluebird');
var MongoClient = BBPromise.promisifyAll(require('mongodb').MongoClient);
var config = require('config');
var hoistContext = require('@hoist/context');
var Application = require('@hoist/model').Application;
var AppUser = require('@hoist/model').AppUser;
var Bucket = require('@hoist/model').Bucket;
var Role = require('@hoist/model').Role;
var mongoConnection = require('../../lib/mongo_connection');

var expect = require('chai').expect;
describe('integration', function () {
  after(function () {
    return mongoConnection.close();
  });
  describe('saving a hoist object', function () {
    describe('without a bucket', function () {
      var pipeline = require('../../lib/pipeline')(hoistContext);

      var _returnedObject;
      before(function (done) {

        var type = 'Person';
        var object = {
          _id: 'owen.evans',
          name: 'Owen',
          position: 'CTO'
        };

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
            context.user = new AppUser({
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
            context.bucket = null;
            context.roles = [role];
            context.application = application;
          })
          .then(function () {
            return pipeline.save(type, object);
          }).then(function (returnedObject) {
            _returnedObject = returnedObject;
            loadObject = BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }),
              function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:global:people'));
                return collection.findOneAsync({}).then(function (obj) {
                  return obj;
                });
              });
          }).nodeify(done);

      });
      var loadObject;
      after(function () {
        hoistContext.set(undefined);
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = BBPromise.promisifyAll(connection.db('datakey'));
            return db.dropDatabase();
          });
      });
      it('returns the saved object', function () {
        return expect(_returnedObject).to.include({
          _id: "owen.evans",
          _type: "person",
          name: "Owen",
          position: "CTO"
        });
      });
      it('saves the object', function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = connection.db('datakey');
            var collection = BBPromise.promisifyAll(db.collection('live:global:people'));
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
          return expect(obj._createdDate).to.be.today;
        });
      });
      it('sets updated date', function () {
        return loadObject.then(function (obj) {
          return expect(obj._updatedDate).to.be.today;
        });
      });
    });
    describe('into a bucket', function () {
      var pipeline = require('../../lib/pipeline')();

      before(function (done) {
        var type = 'Person';
        var object = {
          name: 'Owen',
          position: 'CTO'
        };

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
            context.user = new AppUser({
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
              }),
              function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
                return collection.findOneAsync({}).then(function (obj) {
                  return obj;
                });
              });
          }).nodeify(done);

      });
      var loadObject;
      after(function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = BBPromise.promisifyAll(connection.db('datakey'));
            return db.dropDatabase();
          });
      });
      it('saves the object', function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = connection.db('datakey');
            var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
            return collection.countAsync().then(function (count) {
              return expect(count).to.eql(1);
            });
          });
      });
      it('save the object properties', function () {
        return loadObject.then(function (obj) {
          /*jshint -W030 */
          expect(obj._id).to.exist;
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
          return expect(obj._createdDate).to.be.today;
        });
      });
      it('sets updated date', function () {
        return loadObject.then(function (obj) {
          return expect(obj._updatedDate).to.be.today;
        });
      });
    });
    describe('with an array of objects', function () {
      var _returnedObjects;
      var pipeline = require('../../lib/pipeline')();

      before(function (done) {
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
            context.user = new AppUser({
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
          }).then(function (saved) {
            _returnedObjects = saved;
            loadObject = BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }),
              function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
                return BBPromise.promisifyAll(collection.find({})).toArrayAsync();
              });
          }).nodeify(done);

      });
      var loadObject;
      after(function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = BBPromise.promisifyAll(connection.db('datakey'));
            return db.dropDatabase();
          });
      });
      it('returns the saved objects', function () {
        return expect(_returnedObjects.length).to.eql(2);
      });
      it('saves the objects', function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = connection.db('datakey');
            var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
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
          return expect(objs[0]._createdDate).to.be.today &&
            expect(objs[1]._createdDate).to.be.today;
        });
      });
      it('sets updated date', function () {
        return loadObject.then(function (objs) {
          return expect(objs[0]._updatedDate).to.be.today &&
            expect(objs[1]._updatedDate).to.be.today;
        });
      });
    });
    describe('without permission', function () {
      var pipeline = require('../../lib/pipeline')();

      var error;
      before(function (done) {
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
              claims: ['DataRead']
            });
            context.user = new AppUser({
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
          }).finally(function () {
            loadObject = BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
              .disposer(function (connection) {
                connection.close();
              }),
              function (connection) {
                var db = connection.db('datakey');
                var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
                return BBPromise.promisifyAll(collection.find({})).toArrayAsync();
              });
          }).nodeify(function (err) {
            error = err;
            done();
          });

      });
      var loadObject;
      after(function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = BBPromise.promisifyAll(connection.db('datakey'));
            return db.dropDatabase();
          });
      });
      it('does not create object', function () {
        return loadObject.then(function (res) {
          return expect(res.length).to.eql(0);
        });
      });
      it('throws permission error', function () {
        expect(error.message).to.eql('Current user does not have permission to Write Data');
      });
    });
    describe('with an existing object', function () {
      var pipeline = require('../../lib/pipeline')();

      var startDate;
      before(function (done) {
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
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
            .disposer(function (connection) {
              connection.close();
            }),
            function (connection) {
              var db = connection.db('datakey');
              var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
              return collection.insertOneAsync({
                _id: 'owen.evans',
                name: 'oldName',
                _createdDate: startDate,
                _updatedDate: startDate
              });
            })
          .then(function () {

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
                context.user = new AppUser({
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
                  }),
                  function (connection) {
                    var db = connection.db('datakey');
                    var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
                    return BBPromise.promisifyAll(collection.find({})).toArrayAsync();
                  });
              }).nodeify(done);

          });
      });
      var loadObject;
      after(function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = BBPromise.promisifyAll(connection.db('datakey'));
            return db.dropDatabase();
          });
      });
      it('saves the objects', function () {
        return BBPromise.using(MongoClient.connectAsync(config.get('Hoist.mongo.db'))
          .disposer(function (connection) {
            connection.close();
          }),
          function (connection) {
            var db = connection.db('datakey');
            var collection = BBPromise.promisifyAll(db.collection('live:bucketid:people'));
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
          return expect(objs[0]._createdDate).to.be.yesterday &&
            expect(objs[1]._createdDate).to.be.today;
        });
      });
      it('sets updated date', function () {
        return loadObject.then(function (objs) {
          return expect(objs[0]._updatedDate).to.be.today &&
            expect(objs[1]._updatedDate).to.be.today;
        });
      });
    });
  });
});
