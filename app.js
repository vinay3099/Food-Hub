var express = require("express");
var path = require("path");
const mongoose = require("mongoose");
var config = require('./config/db');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
//db connection
mongoose.connect(config.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("connected to mongodb");
});

var app = express();
//view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
//set public folder
app.use(express.static(path.join(__dirname, "public")));

//set global errors variable
app.locals.errors = null;

//Body Parser middleware

app.use(bodyParser.urlencoded(
    {extended:false}));

app.use(bodyParser.json());

//Express session middleware
app.use(session({
    secret:'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: true}
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

    }
}));

//Express Message middleware

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


//set routes
var pages = require('./routes/pages.js');
var adminPages = require('./routes/admin_pages.js');
const { validationResult } = require("express-validator");
 app.use('/admin/pages',adminPages );
 app.use('/',pages);
var port = 3000;
app.listen(port, function () {
    console.log("server started on port" + port);
});