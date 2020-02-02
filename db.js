const mongodb = require('mongodb'); 
const dotenv = require('dotenv');

dotenv.config();

mongodb.connect(process.env.CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) { 
    module.exports = client.db(); //establish connection w/ database before starting our app
    const app = require('./app');
    app.listen(process.env.PORT);
})
