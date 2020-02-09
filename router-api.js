const apiRouter = require('express').Router(); //use official express router
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');
const cors = require('cors');

apiRouter.use(cors()); //set cors to allowed for any domain below in our api routes

apiRouter.post('/login', userController.apiLogin); //create our api route: api/login
apiRouter.post('/create-post',userController.apiMustBeLoggedIn, postController.apiCreate); //create our api route: api/login
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete);
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername);


module.exports = apiRouter;