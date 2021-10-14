var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LoginSchema = new Schema({

    username : String,
    // email : String,
    password : Number,
});

module.exports = mongoose.model('LoginCredentials', LoginSchema);