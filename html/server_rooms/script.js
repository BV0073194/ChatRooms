var socket;
var usernameInput;
var chatIDInput;
var messageInput;
var chatRoom;
var dingSound;
var connSound;
var messages = [];
var user;
var delay = true;
var usernames = [];


function onload(){
  if(window.location == window.parent.location){
    document.getElementById("applauncher").hidden = false;
  } else {
    document.getElementById("applauncher").hidden = true;
  }
  
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    document.getElementById("MessageLabel").style = "margin: 35px;";
    document.getElementById("scrollLatest").style = "margin: 12px;";
  }
  else{
    document.getElementById("MessageLabel").style = "";
    document.getElementById("scrollLatest").style = "";
  }
  socket = io();
  usernameInput = document.getElementById("NameInput");
  chatIDInput = document.getElementById("IDInput");
  messageInput = document.getElementById("ComposedMessage");
  chatRoom = document.getElementById("RoomID");
  dingSound = document.getElementById("DingS");

  socket.on("join", function(room){
    chatRoom.innerHTML = "Chatroom : " + room;
    dingSound = document.getElementById("DingS");
    socket.emit("room", chatIDInput.value, usernameInput.value, "MAIN");
  })

  socket.on("recieve", function(message, username){
    usernames[socket.id] = username;
    if (messages.length < 9){
      messages.push(message);
      dingSound.currentTime = 0;
      dingSound.play();
    }
    else{
      messages.shift();
      dingSound.currentTime = 0;
      dingSound.play();
      messages.push(message);
    }
    for (i = 0; i < messages.length; i++){
      //document.getElementById("Message"+i).innerHTML = messages[i];
      //document.getElementById("Message"+i).style.color = "#04d13b";
    }
    var tag = document.createElement("p");
    var text = document.createTextNode(message);
   tag.appendChild(text);
    var element = document.getElementById("MessageBox");
    element.appendChild(tag);
    document.getElementById("MessageBox").style.color = "#04d13b";
    dingSound = document.getElementById("ConnS");
    var objDiv = document.getElementById("MessageBox");
    objDiv.scrollTop = objDiv.scrollHeight;
  })
}

function Connect(){
  if(usernameInput.value.length < 401){
    socket.emit("join", chatIDInput.value, usernameInput.value);
  }
  else{
    window.alert("please limit characters to 400.")
  }
}

function Disconnect(){
  socket.emit("unjoin", chatIDInput.value, usernameInput.value);
  socket.emit("leave-room", chatIDInput.value, usernameInput.value, "MAIN");
}

function Send(){
  if(messageInput.value.length < 401){
    if (delay && messageInput.value.replace(/\s/g, "") != ""){
      delay = false;
      setTimeout(delayReset, 1000);
      dingSound = document.getElementById("DingS");
      socket.emit("send", messageInput.value);
      socket.emit("logmsg", chatIDInput.value, usernameInput.value, messageInput.value, "MAIN");
      messageInput.value = "";
    }
  }
  else{
    window.alert("please limit characters to 400.");
  }
}

function delayReset(){
  delay = true;
}