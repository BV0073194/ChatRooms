const http = require("http");
const Cookies = require('js-cookie');
const express = require("express");
const socketio = require("socket.io");
const path = require("path");
const app = express();
var server = require('http').createServer(app);
var socketIO = require('socket.io');
var request = require('request');
var peopleOnline = 0;

// Date object initialized as per Los Angeles timezone. Returns a datetime string
var nz_date_string = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });

var date_nz = new Date(nz_date_string);

// year as (YYYY) format
var year = date_nz.getFullYear();

// month as (MM) format
var month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

// date as (DD) format
var day = ("0" + date_nz.getDate()).slice(-2);

// hours as (HH) format
var hours = ("0" + date_nz.getHours()).slice(-2);

// minutes as (mm) format
var minutes = ("0" + date_nz.getMinutes()).slice(-2);

// date and time as YYYY-MM-DD hh:mm format
var date = month + "-" + day + "-" + year + " at " + hours + ":" + minutes;

// Date object initialized from the above datetime string
var myInt = setInterval(function() {
  nz_date_string = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });

  date_nz = new Date(nz_date_string);
  // year as (YYYY) format
  year = date_nz.getFullYear();

  // month as (MM) format
  month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // day as (DD) format
  day = ("0" + date_nz.getDate()).slice(-2);

  // hours as (HH) format
  hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // date and time as YYYY-MM-DD hh:mm format
  date = month + "-" + day + "-" + year + " at " + hours + ":" + minutes;
}, 500);

myInt.ref();

//app.set("status", "down");
app.get("status");
app.set('trust proxy', true);

var helmet = require('helmet');
//app.use(helmet.frameguard());


app.use(express.static('public'));
const httpserver = http.Server(app);
const io = socketio(httpserver);

const gamedirectory = path.join(__dirname, "html");

app.use(express.static(gamedirectory));

httpserver.listen(8080);
const fs = require('fs');

var rooms = [];

var usernames = [];

var roomnames = [];

var x = "";

var user_storage = process.env['users']
const pauthCode = process.env['preauth_code']
var temp_code = process.env['temp_code'];
user_storage = "";

temp_code = Math.random().toString(36).slice(-8);
fs.writeFileSync('new_temp.pass', temp_code, {encoding: 'utf8', flag: 'w'});

var tempcodeActive = false;

var getLocalUser_Via_ReqHead = null; 

/*
unicode: `

https://repl.it/logout
*/

app.get('/', (req, res) => {
  if (req.header('X-Replit-User-Id') || req.query.code == pauthCode || req.query.code == temp_code) { // Check to see if the user is logged in...
    if(req.query.code == pauthCode){
      res.redirect(`/home?code=${req.query.code}`); // They are logged in, redirect them to the home page.
    } else if (req.query.code == temp_code) {
      tempcodeActive = true;
      res.redirect(`/home?code=${req.query.code}`); // They are logged in, redirect them to the home page.
    } else {
      res.redirect(`/authed/?user=${req.header('X-Replit-User-Name')}`); // They are logged in, redirect them to the home page.
    }
  } else {
    res.status(200).sendFile(__dirname + '/html/server_login/login.html');
  }
});

app.get('/authed', (req, res) => {
  user_storage += (req.header('X-Replit-User-Name') + " ");
  res.redirect('/home');
});

app.get('/home', (req, res) => {
  getLocalUser_Via_ReqHead = req;
  if (user_storage.includes(req.header('X-Replit-User-Name')) && req.header('X-Replit-User-Name') != "") {
    res.status(200).sendFile(__dirname + '/html/server_rooms/index.html');
  } else if(req.query.code == pauthCode || req.query.code == temp_code) {
    res.status(200).sendFile(__dirname + '/html/server_rooms/index.html');
  } else {
    res.redirect('/');
  }
});

app.get('/dev', (req, res) => {
  if (user_storage.includes(req.header('X-Replit-User-Name')) && req.header('X-Replit-User-Name') != "") {
    res.status(200).sendFile(__dirname + '/html/server_rooms/beta.html');
  } else if(req.query.code == pauthCode || req.query.code == temp_code) {
    res.status(200).sendFile(__dirname + '/html/server_rooms/beta.html');
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.clearCookie('REPL_AUTH', {path: '/', domain: '.' + req.headers.host}).status(200).redirect('/');
  if (user_storage.includes(req.header('X-Replit-User-Name')) && req.header('X-Replit-User-Name') != "") {
    user_storage = user_storage.replace(req.header('X-Replit-User-Name'), '');
    res.status(200).sendFile(__dirname + '/html/server_logout/logout.html');
  } else if(req.query.code == pauthCode) {
    res.status(200).sendFile(__dirname + '/html/server_logout/logout.html');
  } else if(tempcodeActive = true) {
    temp_code = Math.random().toString(36).slice(-8);
    fs.writeFileSync('new_temp.pass', temp_code, {encoding: 'utf8', flag: 'w'});
    tempcodeActive = false;
  } else {
    res.status(200).sendFile(__dirname + '/html/server_logout/logout.html');
  };
});

app.get('/updates', (req, res) => {
  res.status(200).sendFile(__dirname + '/html/server_updates/updateLog.html');
});

io.on('connection', function(socket) {

  socket.on("join", function(room, username) {
    if (username != "" && username.length < 400) {
      rooms[socket.id] = room;
      usernames[socket.id] = username;
      socket.leaveAll();
      socket.join(room);
      socket.emit("join", room);
      io.in(room).emit("recieve", "Server -> " + username + " has entered the chat.");
    }
  })

  socket.on("room", function(room, username, version) {
    fs.appendFile('message.txt', "Replit acc: " + getLocalUser_Via_ReqHead.header('X-Replit-User-Name') + " with username: " + username + " joined room " + room + " on " + date + ". Operating-Version: " + version + "\n", function(err) {
      if (err) throw err;
    });
    console.log("Replit acc: " + getLocalUser_Via_ReqHead.header('X-Replit-User-Name') + " with username: " + username + " joined room " + room + " on " + date + ".");
  })

  socket.on("auth", function(data) {
    if (data == 'auth_complete') {
      socket.emit("auth_2fac", true);
    }
  })

  socket.on("leave-room", function(room, username, version) {
    console.log("Replit acc: " + getLocalUser_Via_ReqHead.header('X-Replit-User-Name') + " with username: " + username + " left room " + room + " on " + date + ".");
    fs.appendFile('message.txt', "Replit acc: " + getLocalUser_Via_ReqHead.header('X-Replit-User-Name') + " with username: " + username + " left room " + room + " on " + date + ". Operating-Version: " + version + "\n", function(err) {
      if (err) throw err;
    });
  })

  socket.on("unjoin", function(room, username) {
    if (username != "") {
      rooms[socket.id] = room;
      usernames[socket.id] = username;
      socket.leaveAll();
      io.in(room).emit("recieve", "Server -> " + username + " has left the chat.");
    }
  })

  socket.on("send", function(message, username, room) {
    io.in(rooms[socket.id]).emit("recieve", usernames[socket.id] + " => " + message);
  })

  socket.on("logmsg", function(room, username, message, version) {
    console.log("Message from Room: " + room + " from replit acc: " + getLocalUser_Via_ReqHead.header('X-Replit-User-Name') + " with username: " + usernames[socket.id] + "... was recieved. Message was: " + message + " on " + date);
    fs.appendFile('message.txt', "Replit acc: " + getLocalUser_Via_ReqHead.header('X-Replit-User-Name') + " with username: " + username + " said: \"" + message + "\" in room: " + room + " on " + date + ". Operating-Version: " + version + "\n", function(err) {
      if (err) throw err;
    });
  })


  socket.on("recieve", function(message) {
    socket.emit("recieve", message);
  })
})