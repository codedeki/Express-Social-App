const express = require("express");
const app = express();


const router = require('./router');

app.use(express.urlencoded({extended: false})); //for HTML form submit: tells express to add user submitted data onto our request object (request.body)
app.use(express.json()); //for JSON submit

app.use(express.static('public')); //use our public folder
app.set('views', 'views'); //native to express, our folder
app.set('view engine', 'ejs'); //choose template engine: pug, handlebars, ejs, etc.

app.use('/', router);

app.listen(3001);