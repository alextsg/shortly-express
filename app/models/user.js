var db = require('../config');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

var User = db.Model.extend({

  tableName: 'users',
  hasTimestamps: true,

  userHash: function (password) {
    var self = this;
    return new Promise(function (resolve, reject) {
      bcrypt.genSaltAsync(10).then(function (salt) {
        console.log('hello self.password', password);
        bcrypt.hashAsync(password, salt, null).then(function (hash) {
          resolve({'password': hash, 'salt': salt});
        });
      });
    });
  },

  userCheck: function(password, dbpass) {
    return new Promise(function (resolve, reject) {
      bcrypt.compareAsync(password, dbpass).then(function (found) {
        console.log('found in userCheck is', found);
        if (found){
          console.log('password correct', found);
          resolve(true);
        }
      });
    });
  }
});

module.exports = User;
