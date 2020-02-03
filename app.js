const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const app = express();

let sessionOptions = session({
    secret: "JavaScript is cool",
    store: new MongoStore({client: require('./db')}), //set up cookies in database
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} //set up browser cookies w/ unique identifier value to remember if user is logged in; expires after one day (1000 ms x 60 s x 1 hour x 24 hours)
});

app.use(sessionOptions);
app.use(flash());


const router = require('./router');

app.use(express.urlencoded({extended: false})); //for HTML form submit: tells express to add user submitted data onto our request object (request.body)
app.use(express.json()); //for JSON submit

app.use(express.static('public')); //use our public folder
app.set('views', 'views'); //native to express, our folder
app.set('view engine', 'ejs'); //choose template engine: pug, handlebars, ejs, etc.

app.use('/', router);

module.exports = app;
