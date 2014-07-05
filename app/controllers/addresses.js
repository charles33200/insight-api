'use strict';

/**
 * Module dependencies.
 */

var Address = require('../models/Address'),
  Addresses = require('../models/Addresses'),
  common = require('./common'),
  async = require('async');

var getAddr = function(req, res, next) {
  var a;
  try {
    var addr = req.param('addr');
    a = new Address(addr);
  } catch (e) {
    common.handleErrors({
      message: 'Invalid address:' + e.message,
      code: 1
    }, res, next);
    return null;
  }
  return a;
};

var getAddrs = function(req, res, next) {
  var as = [];
  try {
    var addrStrs = req.param('addrs');
    var s = addrStrs.split(',');
    if (s.length === 0) return as;
    for (var i = 0; i < s.length; i++) {
      var a = new Address(s[i]);
      as.push(a);
    }
  } catch (e) {
    common.handleErrors({
      message: 'Invalid address:' + e.message,
      code: 1
    }, res, next);
    return null;
  }
  return as;
};

var addresses = [];
var addressesTmp;
var totalLength;
var currentLength;
function addAddresseBalance(addr) {
  var a = new Address(addr)
  a.update(function() {
    currentLength++;
    var balance = a.balanceSat;
    addressesTmp.push({addr: addr, balance: balance});
    if (totalLength == currentLength) {
      addressesTmp.sort(function(a, b){return b.balance-a.balance});
      addresses = addressesTmp;
    }
  }, {});
}
function calculateTop100() {
  console.log("calculateTop100");
  new Addresses().all(
    function(data) {
      addressesTmp = [];
      totalLength = data.length;
      currentLength = 0;
      for (var i=0; i<data.length;i++) {
        addAddresseBalance(data[i]);
      }
  });
  setTimeout(calculateTop100, 12 * 60 * 60 * 1000);
}
calculateTop100();
exports.top100 = function(req, res, next) {
  return res.jsonp(addresses.slice(0, 100));
}

exports.show = function(req, res, next) {
  var a = getAddr(req, res, next);

  if (a) {
    a.update(function(err) {
      if (err) {
        return common.handleErrors(err, res);
      } else {
        return res.jsonp(a.getObj());
      }
    }, {txLimit: req.query.noTxList?0:-1, ignoreCache: req.param('noCache')});
  }
};



exports.utxo = function(req, res, next) {
  var a = getAddr(req, res, next);
  if (a) {
    a.update(function(err) {
      if (err)
        return common.handleErrors(err, res);
      else {
        return res.jsonp(a.unspent);
      }
    }, {onlyUnspent:1, ignoreCache: req.param('noCache')});
  }
};

exports.multiutxo = function(req, res, next) {
  var as = getAddrs(req, res, next);
  if (as) {
    var utxos = [];
    async.each(as, function(a, callback) {
      a.update(function(err) {
        if (err) callback(err);
        utxos = utxos.concat(a.unspent);
        callback();
      }, {onlyUnspent:1, ignoreCache: req.param('noCache')});
    }, function(err) { // finished callback
      if (err) return common.handleErrors(err, res);
      res.jsonp(utxos);
    });
  }
};


exports.balance = function(req, res, next) {
  var a = getAddr(req, res, next);
  if (a)
    a.update(function(err) {
      if (err) {
        return common.handleErrors(err, res);
      } else {
        return res.jsonp(a.balanceSat);
      }
    }, {ignoreCache: req.param('noCache')});
};

exports.totalReceived = function(req, res, next) {
  var a = getAddr(req, res, next);
  if (a)
    a.update(function(err) {
      if (err) {
        return common.handleErrors(err, res);
      } else {
        return res.jsonp(a.totalReceivedSat);
      }
    }, {ignoreCache: req.param('noCache')});
};

exports.totalSent = function(req, res, next) {
  var a = getAddr(req, res, next);
  if (a)
    a.update(function(err) {
      if (err) {
        return common.handleErrors(err, res);
      } else {
        return res.jsonp(a.totalSentSat);
      }
    }, {ignoreCache: req.param('noCache')});
};

exports.unconfirmedBalance = function(req, res, next) {
  var a = getAddr(req, res, next);
  if (a)
    a.update(function(err) {
      if (err) {
        return common.handleErrors(err, res);
      } else {
        return res.jsonp(a.unconfirmedBalanceSat);
      }
    }, {ignoreCache: req.param('noCache')});
};
