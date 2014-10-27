'use strict';
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://localhost/test', function (err, db) {
  // Get the collection
  var col = db.collection('insert_many');
  var batch = col.initializeUnorderedBulkOp();
  [{
    _id: 1,
    a: 1,
    b: 1
  }, {
    _id: 2,
    a: 2,
    b: 2
  }, {
    _id: 3,
    a: 3
  },{_id:4, a:4}].forEach(function (document) {
    batch.find({_id:document._id}).upsert().updateOne({
      $set: document,
      $setOnInsert: {
        _createdDate: new Date()
      }
    });
  });
  batch.execute(function (err, r) {
    console.log(err, r);
    db.close();
  });

});
