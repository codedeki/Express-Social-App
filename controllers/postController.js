const Post = require('../models/Post');

exports.viewCreateScreen = function(req, res) {
    res.render('create-post')
}

exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id); //makes a unique post id
    post.create()
    .then(function(newId) {
        req.flash("success", "New post successfully created.")
        req.session.save(() => res.redirect(`/post/${newId}`)) //newly created id for post
    }).catch(function(errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/create-post"))
    });
}

//API 
exports.apiCreate = function(req, res) {
    let post = new Post(req.body, req.apiUser._id); //makes a unique post id
    post.create().then(function(newId) {
        res.json("Congrats.")
    }).catch(function(errors) {
        res.json(errors)
    });
}

exports.apiDelete = function(req, res) {
    Post.delete(req.params.id, req.apiUser._id).then(() => {
        res.json("Success.")
    }).catch(() => {
        res.json("You do not have permission to perform that action.")
    })
}
//END API

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post, title: post.title}) //for dynamic titles to pages in header.ejs
    } catch {
        res.render('404')
    }
} 

exports.viewEditScreen = async function(req, res) {
   try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) { //only give user access to edit their own posts
        res.render("edit-post", {post: post})
        //don't want to render template until we actually have the data, so use async await 
    } else {
        req.flash("errors", "You do not have permission to perform that action."); //deny edit request if not logged in as user
        req.session.save(() => res.redirect('/'))
    }
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
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(function() {
            res.redirect("/")
        })
    })
}

exports.delete = function(req, res) {
    Post.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success", "Post successfully deleted.")
        req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}

exports.search = function(req, res) {
    Post.search(req.body.searchTerm).then(posts => {
        res.json(posts)
    }).catch(() => {
        res.json([])  
    })
}