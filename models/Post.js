const postsCollection = require('../db').db().collection("posts");
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');

let Post = function(data, userid, requestedPostId) {
    this.data = data;
    this.errors = [];
    this.userid = userid;
    this.requestedPostId = requestedPostId;
}

Post.prototype.cleanUp = function() {
    if (typeof(this.data.title) != "string") {this.data.title = ""}
    if (typeof(this.data.body) != "string") {this.data.body = ""}
    
    //get rid of any bogus properties
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function() {
    if (this.data.title == "") {this.errors.push("You must provide a title")}
    if (this.data.body == "") {this.errors.push("You must provide post content")}
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.length) {
            // save post into database
            postsCollection.insertOne(this.data).then(() => {
                resolve();
            }).catch(() =>{
                this.errors.push("Please try again later.");
                reject(this.errors)
            })
        
        } else {
            reject(this.errors);
        }
    })
}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid);
            if (post.isVisitorOwner) {
                //actually update the db
                let status = await this.actuallyUpdate();
                resolve(status);
            } else {
                reject();
            }
        } catch {
            reject();
        }
    })
}

Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success");
        } else {
            resolve("failure");
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        //add blueprint onto original array to prevent code duplication
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}}, //store additional information about user docs in new property authorDocument 
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1, //1 is true, 0 is false
                authorId: "$author", //create new item for author id for editing persmissions
                author: {$arrayElemAt: ["$authorDocument", 0]} //return first item in array since only one author document per author
            }}
        ]) 

        let posts = await postsCollection.aggregate(aggOperations).toArray();

        // clean up author property in each post object
        posts = posts.map(function(post) {
            //modify author object in authorDocument: should have only two properties: username and avatar (for security, we don't want to include user password in the object, etc.)
            post.isVisitorOwner = post.authorId.equals(visitorId); //returns boolean for authentication to edit posts: true if matches visitorid 
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })

        resolve(posts)
    })
}

Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject();
            return;
        } 
        //use reusable blueprint then add whatever parts are unique to this function
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (posts.length) {
            console.log(posts[0]) 
            resolve(posts[0]) //return first item in array
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}} //1 for ascending order, -1 for descending order
    ])
}

module.exports = Post;

