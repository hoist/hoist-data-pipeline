'use strict';
process.env.NODE_ENV = 'test';
var BBPromise = require('bluebird');
var MongoClient = require('mongodb').MongoClient;
var config = require('config');

BBPromise.promisifyAll(MongoClient);
MongoClient.connectAsync(config.get('Hoist.mongo.db'))
  .then(function () {
    console.log('connected');
  });
