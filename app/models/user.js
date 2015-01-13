var db = require('../config');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

var User = db.Model.extend({

  tableName: 'users',
  hasTimestamps: true,

  userHash: function (userObj) {
    return new Promise(function (resolve, reject) {
      bcrypt.genSaltAsync(10).then(function (salt) {
        bcrypt.hashAsync(userObj.password, salt, null).then(function (hash) {
          resolve([hash, salt]);
        });
      });
    });

    // bcrypt.genSaltAsync(10).then(function (salt) {
    //   return salt;
    // }).then(function (salt) {
    //   bcrypt.hashAsync(userObj.password, salt, null).then(function (hash) {
    //     self.set({'password': hash, 'salt': salt});
    //     self.save();
    //   });
    // });
  }

});

module.exports = User;
