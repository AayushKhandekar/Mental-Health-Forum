var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var LoginCredentials = require('./Login.Model');
var DB = 'mongodb://localhost/mental-health-forum'
var PORT = 8000;

mongoose.connect(DB);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended : true
}));

app.get('/signup', function(req, res){
    LoginCredentials.find(function(err, response){
        res.json(response);
    });
});

app.post('/login', function(req, res){

    username = req.body.username;
    password = req.body.password;

    // Finding username and password that matches with the input username and password
    LoginCredentials.find({username: username, password: password}, function(err, response){
        if(response[0] == undefined){
            res.send('Wrong username or password. Try again!')
        } else {
            res.send('Login successful!')
            console.log('Login \nUsername :',response[0].username, '\nPassword :', response[0].password);
        } 
    });
});

app.post('/signup', function(req, res){

    username = req.body.username;
    password = req.body.password;

    // Checking is username exists in the database
    LoginCredentials.findOne({username: username}, function(err, response){
        if(response != null){
            res.send('Username exists!')
        } else { 
            var newUser = new LoginCredentials();
            newUser.username = username;
            newUser.password = password;
    
            // Inserting user data if the user does not already exist 
            newUser.save(function(err, result){
                if(err){
                    res.send('Signup Error!');
                } else {
                    res.send('Signup successful!');
                    console.log('Signin \nUsername :', result.username, '\nPassword :', result.password);
                }
            });
        }
    });
});

app.listen(PORT, function(){
    console.log('App running on PORT', PORT);
});

