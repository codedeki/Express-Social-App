const Post = require('../models/Post');

exports.viewCreateScreen = function(req, res) {
    res.render('create-post')
}

exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id);
    post.create()
    .then(function() {
        res.send("New post created")
    }).catch(function(errors) {
        res.send(errors)
    });
}

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post})
    } catch {
        res.render('404')
    }
} 

exports.viewEditScreen = async function(req, res) {
   try {
    let post = await Post.findSingleById(req.params.id)
    res.render("edit-post", {post: post}) //don't want to render template until we actually have the data, so use async await 
   } catch {
       res.render("404")
   }
}

exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id) //get user id and post id that's requested to be edited
    post.update().then((status) => {
        if (status == "success") {
            //post updated in db
            req.flash("success", "Post successfully updated.")
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach(function(error) {
                req.flash("errors", error)
            })
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        //if post w/ requested id doesn't exist or if visitor is not owner
        req.flash("errors", "You do not have persmission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}