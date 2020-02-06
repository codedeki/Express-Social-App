const dotenv = require('dotenv');
dotenv.config();
const mongodb = require('mongodb');


mongodb.connect(process.env.CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) { 
    module.exports = client; //establish connection w/ database before starting our app
    const app = require('./app');
    app.listen(process.env.PORT);
})