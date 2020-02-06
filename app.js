const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const app = express();
const sanitizeHTML = require('sanitize-html');

let sessionOptions = session({
    secret: "JavaScript is cool",
    store: new MongoStore({client: require('./db')}), //set up cookies in database
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} //set up browser cookies w/ unique identifier value to remember if user is logged in; expires after one day (1000 ms x 60 s x 1 hour x 24 hours)
});

app.use(sessionOptions);
app.use(flash());

//.locals gives ejs templates access to user property to avoid duplication of {username: req.session.user.username, avatar: req.session.user.avatar}
app.use(function(req, res, next) {
    //make our markdown function available from within ejs templates
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    } 

    //make all error and success messages available from all templates
    res.locals.errors = req.flash("errors");
    res.locals.success = req.flash("success");

    //make current user id available on the req object
    if (req.session.user) {req.visitorId = req.session.user._id} else {req.visitorId = 0}

    //make user session data available from within view templates
    res.locals.user = req.session.user; 
    next();
})

const router = require('./router');

app.use(express.urlencoded({extended: false})); //for HTML form submit: tells express to add user submitted data onto our request object (request.body)
app.use(express.json()); //for JSON submit

app.use(express.static('public')); //use our public folder
app.set('views', 'views'); //native to express, our folder
app.set('view engine', 'ejs'); //choose template engine: pug, handlebars, ejs, etc.

app.use('/', router);

module.exports = app;
