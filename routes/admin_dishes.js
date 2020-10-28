const { render } = require('ejs');
const { Router } = require('express');
var mkdirp = require('mkdirp');
var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get dish model
var Dish = require('../models/dish');

//Get Category model
var  Category = require('../models/category');

// GET dishes index
router.get("/",isAdmin, function (req, res, next) {
    var count;
    Dish.count(function(err,c){
       count = c;
    });

    Dish.find(function(err,dishes){
        res.render('admin/dishes',{
            dishes:dishes,
            count:count
        });
    });
});

// GET add-dish
router.get("/add-dish",isAdmin, function (req, res, next) {
   var title ="";
   var desc ="";
   var price ="";

   Category.find(function(err,categories){
    res.render('admin/add_dish',{
        title: title,
         desc:desc,
         categories: categories,
          price: price
 
    });

   });
   

});

// POST add-dish
router.post("/add-dish", function (req, res) {
var imageFile = typeof req.files.image !== "undefined"? req.files.image.name : "";


    req.checkBody('title', 'Title must have a value').notEmpty();
    req.checkBody('desc', 'Description must have a value').notEmpty();
    req.checkBody('price', 'Price must have a numeric value').isDecimal();
    req.checkBody('image','you must upload an image').isImage(imageFile);

   var title = req.body.title;
   var slug = title.replace(/\s+/g, '-').toLowerCase();
   var desc = req.body.desc;
   var price = req.body.price;
   var category= req.body.category;
  
   
   var errors = req.validationErrors();

   if(errors){
    Category.find(function(err,categories){
        res.render('admin/add_dish',{
            errors:errors,
            title: title,
             desc:desc,
             categories: categories,
              price: price
     
        });
    
       });
   }else{
      Dish.findOne({slug: slug}, function (err,dish){
          if(dish){
              req.flash('danger','dish title exists, choose another.');
              Category.find(function(err,categories){
                res.render('admin/add_dish',{
                   
                    title: title,
                     desc:desc,
                     categories: categories,
                      price: price
             
                });
            
               });
            }
            else{
                var price2 = parseFloat(price).toFixed(2);
                var dish = new Dish({
                    title: title,
                    slug: slug,
                    desc:desc,
                    price:price2,
                    category:category,
                    image:imageFile
                });
                dish.save(function (err){
                    if (err)
                    return console.log(err);

                mkdirp('public/dish_images/' + dish._id, function (err) {
                    return console.log(err);
                });

                mkdirp('public/dish_images/' + dish._id + '/gallery', function (err) {
                    return console.log(err);
                });

                mkdirp('public/dish_images/' + dish._id + '/gallery/thumbs', function (err) {
                    return console.log(err);
                });

                if (imageFile != "") {
                    var dishImage = req.files.image;
                    var path = 'public/dish_images/' + dish._id + '/' + imageFile;

                    dishImage.mv(path, function (err) {
                        return console.log(err);
                    });
                }
                    req.flash('success','dish added');
                    res.redirect('/admin/dishes');

                });   
            }
           
          });
   }

});
   



//GET edit dish
router.get('/edit-dish/:id', isAdmin, function (req, res) {

    var errors;

    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {

        Dish.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('/admin/dishes');
            } else {
                var galleryDir = 'public/dish_images/' + p._id + '/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_dish', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price).toFixed(2),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });

    });

});

 // POST edit-dish 
 router.post('/edit-dish/:id', function (req, res) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/dishes/edit-dish/' + id);
    } else {
        Dish.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'dish title exists, choose another.');
                res.redirect('/admin/dishes/edit-dish/' + id);
            } else {
                Dish.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }

                    p.save(function (err) {
                        if (err)
                            console.log(err);

                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/dish_images/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var dishImage = req.files.image;
                            var path = 'public/dish_images/' + id + '/' + imageFile;

                            dishImage.mv(path, function (err) {
                                return console.log(err);
                            });

                        }

                        req.flash('success', 'dish edited!');
                        res.redirect('/admin/dishes/edit-dish/' + id);
                    });

                });
            }
        });
    }

});


// Post product gallery
router.post("/dish-gallery/:id", function (req, res, next) {
    var dishImage = req.files.file;
    var id = req.params.id;
    var path = 'public/dish_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/dish_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    dishImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);
});


// GET delete  image
router.get('/delete-image/:image', isAdmin, function (req, res) {

    var originalImage = 'public/dish_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/dish_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!');
                    res.redirect('/admin/dishes/edit-dish/' + req.query.id);
                }
            });
        }
    });
});

//get  delete dish
router.get('/delete-dish/:id', isAdmin,function (req, res) {

    var id = req.params.id;
    var path = 'public/dish_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Dish.findByIdAndRemove(id, function (err) {
                console.log(err);
            });
            
            req.flash('success', 'dish deleted!');
            res.redirect('/admin/dishes');
        }
    });

});

 
module.exports = router;