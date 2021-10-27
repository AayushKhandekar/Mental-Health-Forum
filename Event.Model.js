var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({

    title: String,
    date: String,
    startTime: String,
    endTime: String,
    url: String,
});

module.exports = mongoose.model('Event', EventSchema);