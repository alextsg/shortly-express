var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({

  tableName: 'users',
  hasTimestamps: true,

  initialize: function (userObj) {
    var self = this;
    bcrypt.genSalt(10, function(err, salt) {
      console.log('salt is', salt);
      if (err) console.log('error happened', err);
      bcrypt.hash(userObj.password, salt, null, function(err, hash) {
        // Store hash in your password DB.
        self.set({'password': hash, 'salt': salt});
        self.save();
      });
    });
  }

});

module.exports = User;
