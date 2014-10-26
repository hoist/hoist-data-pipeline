'use strict';
var RequiredFieldsTransformer = require('../../lib/required_fields');
var expect = require('chai').expect;

describe('RequiredFieldsTransformer', function () {
  describe('.apply', function () {
    describe('given a simple json object', function () {
      var dataObject;
      before(function () {
        dataObject = RequiredFieldsTransformer.apply('Person', {
          key: 'value'
        });
      });
      it('populates _id', function () {
        /* jshint -W030 */
        expect(dataObject._id)
          .to.exist;
      });
      it('uses a shortid', function () {
        expect(dataObject._id.length)
          .to.be.lessThan(15);
      });
      it('populates _type', function () {
        expect(dataObject._type)
          .to.eql('person');
      });
      it('retains existing value', function () {
        expect(dataObject.key)
          .to.eql('value');
      });
    });
    describe('given an object with an existing id', function () {
      var dataObject;
      before(function () {
        dataObject = RequiredFieldsTransformer.apply('Person', {
          key: 'value',
          _id: 'my_existing_id'
        });
      });
      it('retains _id', function () {
        /* jshint -W030 */
        expect(dataObject._id)
          .to.eql('my_existing_id');
      });
      it('populates _type', function () {
        expect(dataObject._type)
          .to.eql('person');
      });
      it('retains existing value', function () {
        expect(dataObject.key)
          .to.eql('value');
      });
    });
    describe('given an existing type', function () {
      var dataObject;
      before(function () {
        dataObject = RequiredFieldsTransformer.apply('Person', {
          key: 'value',
          _type: 'wrong_type'
        });
      });
      it('populates _id', function () {
        /* jshint -W030 */
        expect(dataObject._id)
          .to.exist;
      });
      it('overwrites _type', function () {
        expect(dataObject._type)
          .to.eql('person');
      });
      it('retains existing value', function () {
        expect(dataObject.key)
          .to.eql('value');
      });
    });
  });
});
