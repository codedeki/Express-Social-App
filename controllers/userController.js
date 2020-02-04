const User = require("../models/User");

exports.mustBeLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.flash("errors", "You must be logged in to perform that action.");
        req.session.save(function() {
            res.redirect('/');
        })
    }
}

exports.login = function(req, res) {
    let user = new User(req.body); //pass in form data req.body
    user.login().then(function(result) {
        //make each user session data unique & persistent
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/') //call this callback function in the meantime while we wait for the database to sync which may take a while
        })
    }).catch(function(err) {
        req.flash('errors', err) //show flash message on screen if login fails
        req.session.save(function() { //use callback function to make sure the function starts while .save is completing
            res.redirect('/')
        })
    })     
}

exports.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect('/'); //use callback function to make sure redirect doesn't wait for the destroy to finish, because the destory may take some time to connect to database
    }); //deletes session cookie with maching id from database
}

exports.register = function(req, res) {
    let user = new User(req.body);
    user.register().then(() => {
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch((regErrors) => {
        regErrors.forEach(function(error) {
            req.flash('regErrors', error)
        })
        req.session.save(function() {
            res.redirect('/')
        })
    }); 
}

exports.home = function(req, res) {
    if (req.session.user) {
        res.render('home-dashboard');
    } else {
        res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')}); //show flash message if error
    }
} 