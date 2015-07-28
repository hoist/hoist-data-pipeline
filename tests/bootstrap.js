'use strict';
var chai = require('chai');
chai.should();
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-date'));
process.env.NODE_ENV = 'test';
