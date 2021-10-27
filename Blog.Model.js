var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BlogSchema = new Schema({

    author : String,
    blog : String,
    keyword : String,
    title: String
});

module.exports = mongoose.model('Blog', BlogSchema);