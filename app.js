const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const csrf = require('csurf');
const app = express();
const sanitizeHTML = require('sanitize-html');

//stat api app.use routes
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use('/api', require('./router-api')); //set up new api url (/api...) app.use triad for api at top of file so the other app.use routes below are separated from the api route

let sessionOptions = session({
    secret: "JavaScript is cool",
    store: new MongoStore({client: require('./db')}), //set up cookies in database
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} //set up browser cookies w/ unique identifier value to remember if user is logged in; expires after one day (1000 ms x 60 s x 1 hour x 24 hours)
});

//start general app.use routes
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

app.use(csrf()); //use csrf token for security 

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router);

app.use(function(err, req, res, next) {
    if (err) {
        if(err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross site request forgery detected.")
            req.session.save(() => res.redirect('/'))
        } else {
            res.render("404")
        }
    }
})

const server = require('http').createServer(app); //created server to use our express app to add socket functionality (http is native to node)
const io = require('socket.io')(server);

//integrate express with socket.io
io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket) {
    //if logged in set up session
    if (socket.request.session.user) {
        let user = socket.request.session.user;
        socket.emit('welcome', {username: user.username, avatar: user.avatar})

        socket.on('chatMessageFromBrowser', function(data) {
            socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar}) //io.emit emits event to all connected users (socket.emit would emit only to browser that sent the message, and socket.broadcast.emit sends to all connected browsers except the one who sent the message (for efficient data transfer)
            //sanitize html to prevent execution of javascript in the chat
        })
    }
})

module.exports = server; //tells server to listen on port, rather than app as before
