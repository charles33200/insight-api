'use strict';

var imports            = require('soop').imports();
var TransactionDb      = imports.TransactionDb || require('../../lib/TransactionDb').default();

function Addresses() {

}

Addresses.prototype.all = function(cb) {
  TransactionDb.allAddrs(cb);
};

module.exports = require('soop')(Addresses);
