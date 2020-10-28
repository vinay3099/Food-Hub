var express = require("express");
var path = require("path");
const mongoose = require("mongoose");
var config = require('./config/db');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var passport = require('passport');

//db connection
mongoose.connect(config.db, {
   
    useMongoClient: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("connected to mongodb");
});

mongoose.Promise = require('bluebird');

var app = express();
//view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
//set public folder
app.use(express.static(path.join(__dirname, "public")));

//set global errors variable
app.locals.errors = null;

//Get page Model
var Page = require('./models/page');

//Get all pages to pass to header.ejs
 Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});

// Get Category Model
var Category = require('./models/category');

// Get all categories to pass to header.ejs
Category.find(function (err, categories) {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});

// Express fileupload middleware
app.use(fileUpload());


//Body Parser middleware

app.use(bodyParser.urlencoded(
    {extended:false}));

app.use(bodyParser.json());

//Express session middleware
app.use(session({
    secret:'keyboard cat',
    resave: true,
    saveUninitialized: true,
    //cookie: {secure: true}
}))

//Express validator middleware
app.use(expressValidator({
    errorFormatter: function(param,msg,value){
        var namespace = param.split('.')
         , root = namespace.shift()
         , formParam = root;

        while(namespace.length){
            formParam += '['+ namespace.shift() + ']';
        }
        return{
           param: formParam,
           msg : msg,
           value : value
        };

    },
    customValidators:{
        isImage: function(value,filename){
            var extension = (path.extname(filename)).toLowerCase();
            switch(extension){
                    case '.jpg':
                    return ".jpg";
                    case '.jpeg':
                    return ".jpeg";
                    case '.png':
                    return ".png";
                    case '':
                    return ".jpg";  
                    default :
                    return false;
            }
            
        }
    }
}));

//Express Message middleware

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


app.get('*', function(req,res,next) {
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
 });


//set routes
var pages = require('./routes/pages.js');
var dishes = require('./routes/dishes.js');
var cart = require('./routes/cart.js');
var users = require('./routes/users.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminDishes= require('./routes/admin_dishes.js');




const { validationResult } = require("express-validator");

 app.use('/admin/pages',adminPages );
 app.use('/admin/categories',adminCategories);
 app.use('/admin/dishes',adminDishes)
 app.use('/dishes',dishes);
 app.use('/cart', cart);
 app.use('/users', users);
 app.use('/',pages);

 //server
var port = 3000;
app.listen(port, function () {
    console.log("server started on port" + port);
});