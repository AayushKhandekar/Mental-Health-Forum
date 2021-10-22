var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var LoginCredentials = require('./User.Model');
var DB = 'mongodb://localhost/mental-health-forum';
var cookieParser = require('cookie-parser');
var session = require('express-session');
var PORT = 8000;

mongoose.connect(DB);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(cookieParser());

app.use(session({secret: "Shh, its a secret!"}));

// Sessions example
app.get('/', function(req, res){
    
    if(req.session.page_views){
       req.session.page_views++;
       res.send("You visited this page " + req.session.page_views + " times");
    } else {
       req.session.page_views = 1;
       res.send("Welcome to this page for the first time!");
    }
 }); 

// Rendering Index.html
app.get('/chat', function(req, res){
    res.sendFile(__dirname + '/' + 'index.html');
});

// User Array
users = [];

// Socket Connection
io.on('connection', function(socket){

    console.log('User Connected');
    socket.on('setUsername', function(data){
        if(users.indexOf(data) > -1){
            socket.emit('userExists', data + ' username taken!');
        } else {
            users.push(data);
            socket.emit('userSet', {username : data});
        }
    });

    socket.on('msg', function(data){
        io.sockets.emit('newmsg', data);
    });
});

// Login Route
app.post('/login', function(req, res){

    username = req.body.username;
    password = req.body.password;

    LoginCredentials.find({username: username}, function(err, result){
        correctPassword = (result[0].password);

        (async () => {

            const hash = correctPassword;

            // Function call
            const isValidPass = await comparePassword(password, correctPassword);
            
            res.send(`Login ${!isValidPass ? 'un' : ''}successful!`);
        })();
    });

    // Function to compare passwords
    const comparePassword = async (password, hash) => {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.log(error);
        }

        return false;
    }   
});

// Signup Route
app.post('/signup', function(req, res){

    username = req.body.username;
    password = req.body.password;

    // Checking is username exists in the database
    LoginCredentials.findOne({username: username}, function(err, response){
        if(response != null){
            res.send('Username exists!')
        } else { 

            // Function to hash password
            const Hash = async (word, saltRounds = 10) => {

                try {
                    const salt = await bcrypt.genSalt(saltRounds);
                    return await bcrypt.hash(word, salt);
                } catch (err) {
                    console.log(err);
                }
            
                return null;
            };

            (async() => {

                const hash = await Hash(password);

                var newUser = new LoginCredentials();
                
                newUser.username = username;
                newUser.password = hash;
                
                newUser.save(function(err, result){
                    if(err) {
                        res.send('Signup Error!');
                    } else {
                        res.send('Signup Successful!');
                    }
                });                
            })();
        }
    });
});

http.listen(PORT, function(){
    console.log('App running on PORT', PORT);
});

