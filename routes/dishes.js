var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
// var auth = require('../config/auth');
// var isUser = auth.isUser;

// Get Product model
var Dish = require('../models/dish');

// Get Category model
var Category = require('../models/category');

/*
 * GET all dishes
 */
router.get('/', function (req, res) {
//router.get('/', isUser, function (req, res) {

    Dish.find(function (err, dishes) {
        if (err)
            console.log(err);

        res.render('all_dishes', {
            title: 'All dishes',
            dishes: dishes
        });
    });

});


/*
 * GET dishes by category
 */
router.get('/:category', function (req, res) {

    var categorySlug = req.params.category;

    Category.findOne({slug: categorySlug}, function (err, c) {
        Dish.find({category: categorySlug}, function (err, dishes) {
            if (err)
                console.log(err);

            res.render('cat_dishes', {
                title: c.title,
                dishes: dishes
            });
        });
    });

});

/*
 * GET product details
 */
router.get('/:category/:dish', function (req, res) {

    var galleryImages = null;
    //  var loggedIn = (req.isAuthenticated()) ? true : false;

    Dish.findOne({slug: req.params.dish}, function (err, dish) {
        if (err) {
            console.log(err);
        } else {
            var galleryDir = 'public/dish_images/' + dish._id + '/gallery';

            fs.readdir(galleryDir, function (err, files) {
                if (err) {
                    console.log(err);
                } else {
                    galleryImages = files;

                    res.render('dish', {
                        title: dish.title,
                        p: dish,
                        galleryImages: galleryImages,
                        // loggedIn: loggedIn
                    });
                }
            });
        }
    });

});

// Exports
module.exports = router;


