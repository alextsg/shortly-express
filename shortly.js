var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret:'123456',
  resave: false
}));
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {

  console.log('req.session', req.session);
  var user = new User({username: req.body.username});
  user.fetch().then(function(found) {
    console.log('fetched');
    if (found) {
      user.userCheck(req.body.password, found.attributes.password).then(function (result) {
        if (result) {
          req.session.user = found;
          res.cookie('authenticated', found.attributes.salt);
          res.redirect(200, 'index');
        } else {
          console.log("password didn't match");
        }
      });
    }
    else {
      res.redirect('signup');
    }
  });
});

app.get('/signup', function (req, res) {
  res.render('signup');
});

app.post('/signup', function (req, res) {
  new User(req.body).fetch().then(function(found) {
    if (found) {
      res.redirect(200, 'signup');
    } else {
      var user = new User(req.body);
      user.userHash(req.body.password).then(function (attrs) {
        user.set({'password': attrs.password, 'salt': attrs.salt});
        user.save().then(function () {
          res.cookie('authenticated', attrs.salt);
          res.redirect(307, 'index');
        });
      });
    }
  });
});

app.use(function (req, res, next) {
  if (req.cookies.authenticated) {
    next(); // let them thru
  } else {
    res.redirect('login');
  }
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/create', function(req, res) {
  res.render('index');
});


app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
