var mongoose = require('mongoose');


//Dish Schema

var DishSchema =  mongoose.Schema({

    title:{
        type:String,
        required: true
    },
    slug:{
        type:String,
    },
    desc:{
        type:String,
        required: true
    },
    category:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    image:{
        type:String,
        required: true
    }
});

var Dish = module.exports = mongoose.model('Dish',DishSchema);