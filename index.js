// Require
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var DB = 'mongodb://localhost/mental-health-forum';
var moment = require('compare-dates');

// Schema Models
var LoginCredentials = require('./User.Model');
var Blog = require('./Blog.Model');
var Event = require('./Event.Model');
const { time } = require('console');
const { events } = require('./User.Model');

// Variables
var PORT = 8000;

// User Array
users = [];

mongoose.connect(DB);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(cookieParser());

// app.use(session({secret: "Shh, its a secret!"}));

app.use(express.static('public'));

app.set('view-engine', 'ejs');

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

// -- ROUTING -- 

// Sessions example
// app.get('/', function(req, res){
    
//     if(req.session.page_views){
//        req.session.page_views++;
//        res.send("You visited this page " + req.session.page_views + " times");
//     } else {
//        req.session.page_views = 1;
//        res.send("Welcome to this page for the first time!");
//     }
//  }); 


// Events
app.get('/create-event', function(req, res){
    
    res.render('create-event.ejs');
});

app.post('/create-event', function(req, res){
    
    var newEvent = new Event();

    newEvent.title = req.body.eventtitle;
    newEvent.date = req.body.eventdate;
    newEvent.startTime = req.body.eventstarttime;
    newEvent.endTime = req.body.eventendtime;
    newEvent.url = req.body.eventurl;

    newEvent.save(function(err, result){
        if(err){
            res.send(err);
        } else {
            res.send("Event Created");
        }
    }); 
});

app.get('/events', function(req, res){

    // Todays Date
    var dateToday = new Date();
    var day = dateToday.getDate();
    var month = dateToday.getMonth() + 1; // Month starts from 0 here
    var year = dateToday.getFullYear();
    date = year + "-" + month + "-" + day;
    var date = new Date(date); // Converting to date
    dateTime = date.getTime(); // Calculating time since the beginning of time

    // Array to store upcoming events
    var arr = [];

    // Displaying only upcoming events
    Event.find({}, function(err, result){
        for(let idx = 0; idx < result.length; idx++){
            var otherDate = new Date(result[idx].date);
            otherDateTime = (otherDate.getTime());
            if(dateTime < otherDateTime){
                arr.push(result[idx]);
            }
        }

        res.send(arr);
    });
});

// Chat Application
app.get('/chat', function(req, res){
    res.render('chat.ejs')
});

// Blog
app.get('/add-blog', function(req, res){

    res.render('add-blog.ejs');
});

app.post('/add-blog', function(req, res){

    var newBlog = new Blog();

    newBlog.blog = req.body.blog;
    newBlog.author = req.body.author;
    newBlog.title = req.body.title;
    newBlog.keyword = req.body.keyword;

    newBlog.save(function(err, result){
        if(err) {
            res.send('Saving Error!');
        } else {
            res.send('Blog Saved!');
        }
    });
});

app.get('/blog', function(req, res){

    res.render('blog.ejs');
});

// Display Blogs
app.get('/blog/:title', function(req, res){

    // res.send(req.params.topic);
    Blog.find({title: req.params.title}, function(err, result){
        if(err){
            console.log(err);
        } else {
            Blog.find({keyword: result[0].keyword}, function(err, keywordResult){
                console.log(keywordResult);
                for(let idx = 0; idx < Object.keys(keywordResult).length; idx++){
                    if(keywordResult[idx].title != result[0].title){
                        // console.log(keywordResult[idx].title);
                        res.render('blog.ejs', {title: result[0].title, author: result[0].author, content: result[0].blog, keyword: result[0].keyword, suggestiontitle1: keywordResult[idx].title});
                    }
                }
            });
        }
    });
})

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

