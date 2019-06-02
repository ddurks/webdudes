var CANVAS_WIDTH = $(document).width();
var CANVAS_HEIGHT = $(document).height();
var MESSAGE_LIFESPAN = 5;
var PACE_DURATION_MAX = 3;

console.log("W: " + CANVAS_WIDTH, "H: " + CANVAS_HEIGHT)
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('webdudes.css');
(document.head||document.documentElement).appendChild(style);

var div = $('<div/>').appendTo('body');
div.attr('id', "canvas-div")
var canvasElement = $('<canvas/>',{'id':'webdudes-canvas'}).width(CANVAS_WIDTH).height(CANVAS_HEIGHT);

$('#canvas-div').append(canvasElement);
var context = canvasElement.get(0).getContext("2d");
context.imageSmoothingEnabled = false;
window.addEventListener('resize', function(e){
  context.imageSmoothingEnabled = false;
}, false)

var dpi = window.devicePixelRatio;
function fix_dpi() {
  //create a style object that returns width and height
  canvasElement = document.getElementById("webdudes-canvas");
  let style = {
    height() {
      return +getComputedStyle(canvasElement).getPropertyValue('height').slice(0,-2);
    },
    width() {
      return +getComputedStyle(canvasElement).getPropertyValue('width').slice(0,-2);
    }
  }
  //set the correct attributes for a crystal clear image!
  CANVAS_WIDTH = style.width() * dpi;
  CANVAS_HEIGHT = style.height() * dpi;
  canvasElement.setAttribute('width', style.width() * dpi);
  canvasElement.setAttribute('height', style.height() * dpi);
}

// small-man sprite constants
const height = 65;
const width = 65;
const scaledHeight = 96;
const scaledWidth = 96;

//  animation frame
let frame = 0;
let pace_starttime = 0;
let pace_duration = 100;

function generateID(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// class for small-man sprite
var WebDude = {
  userid: 0,
  sprite: new Image(),
  posx: 0,
  posy: 0,
  speed: 0,
  direction: 0,
  loop: [],
  loop_i: 0,
  message: "",
  message_timestamp: 0,

  create: function(posx, posy) {
    var webdude = Object.create(this);
    webdude.userid = generateID(0, 1000000);
    webdude.sprite.src = chrome.runtime.getURL('images/web_dude_sprite_sheet.png');
    webdude.loop = [0,1,0,2];
    webdude.loop_i = 0;
    webdude.posx = posx;
    webdude.posy = posy;
    webdude.direction = 0;
    webdude.speed = 15;
    webdude.message = "";
    webdude.message_timestamp = 0;
    return webdude;
  },

  setMessage: function(message) {
    this.message = message;
    this.message_timestamp = getTimestampSeconds();
  },

  update: function(posx, posy, direction, loop_i) {
    this.posx = posx;
    this.posy = posy;
    this.direction = direction;
    this.loop_i = loop_i;
  },

  moveUp: function() {
    if (this.posy > 0) {
      this.posy = this.posy - this.speed;
      this.animationFrame();
      this.direction = 2;
    }
  },

  moveRight: function() {
    if(this.posx < CANVAS_WIDTH - scaledWidth) {
      this.posx = this.posx + this.speed;
      this.animationFrame();
      this.direction = 1;
    }
  },

  moveDown: function() {
    if (this.posy < CANVAS_HEIGHT - scaledHeight ) { 
      this.posy = this.posy + this.speed;
      this.animationFrame();
      this.direction = 0;
    }
  },

  moveLeft: function() {
    if (this.posx > 0 ) {
      this.posx = this.posx - this.speed;
      this.animationFrame();
      this.direction = 3;
    }
  },

  animationFrame: function() {
    if (this.loop_i < 3) {
      this.loop_i++;
    } else {
      this.loop_i = 0;
    }
  },
};

var KeyState = {
  key: [0,0,0,0],

  changeKey: function(which, to) {
    switch (which) {
      // left
      case 65:
        this.key[0] = to;
        break;

      // up
      case 87:
        this.key[2] = to;
        break;

      // right
      case 68:
        this.key[1] = to;
        break;

      // down
      case 83:
        this.key[3] = to;
        break;

      // F Key;
      case 70:
        this.key[4] = to;
        break;
    }
  }
};

var webdude_1 = WebDude.create(0, 0);
var webdudesMap = new Map();
webdudesMap.set(webdude_1.userid, webdude_1);

function handleUpdateMessage(data) {
  var datalist = data.split(':');
  var userid = parseInt(datalist[1]);
  var posx = parseFloat(datalist[2]) * CANVAS_WIDTH;
  var posy = parseFloat(datalist[3]) * CANVAS_HEIGHT;
  var direction = parseInt(datalist[4]);
  var loop_i = parseInt(datalist[5]);
  var webdudeToUpdate = webdudesMap.get(userid);
  if (webdudeToUpdate == null) {
    var newWebDude = WebDude.create(0, 0);
    newWebDude.userid = userid;
    webdudesMap.set(userid, newWebDude);
  } else {
    webdudeToUpdate.update(posx, posy, direction, loop_i);
  }
}

function handleMsgMessage(data) {
  var datalist = data.split(':');
  var userid = parseInt(datalist[1]);
  var msg = datalist[2];
  var webdudeToUpdate = webdudesMap.get(userid);
  if (webdudeToUpdate == null) {
    var newWebDude = WebDude.create(0, 0);
    newWebDude.userid = userid;
    newWebDude.setMessage(msg);
    webdudesMap.set(userid, newWebDude);
  } else {
    webdudeToUpdate.setMessage(msg);
  }
}

ws = new WebSocket("wss://localhost:8080/world");
ws.onopen = function() {
  console.log("connection opened");
};
ws.onmessage = function(evt) {
  var messageType = evt.data.split(':')[0];
  if(messageType == "U") {
    handleUpdateMessage(evt.data);
  } else if (messageType == "M") {
    handleMsgMessage(evt.data);
  }
};
ws.onerror = function(err) {
  console.log("connection error: " + err);
};

function drawText(message, x, y) {
  context.font = "25px Arial";
  context.textAlign = "center";
  context.fillText(message, x, y)
}
function drawMessage(webdude){
  drawText(webdude.message, webdude.posx + (scaledWidth/2), webdude.posy - 5);
}

function drawFrame(sprite, frameX, frameY, canvasX, canvasY) {
    context.drawImage(sprite, frameX * width, frameY * height, width, height, canvasX, canvasY, scaledWidth, scaledHeight);
};
function drawdudes() {
  var curr_timestamp = getTimestampSeconds();
  webdudesMap.forEach( function(webdude, userid, map) {
    if (curr_timestamp - webdude.message_timestamp < MESSAGE_LIFESPAN) {
      drawMessage(webdude);
    }
    drawFrame(webdude.sprite, webdude.loop[webdude.loop_i], webdude.direction, webdude.posx, webdude.posy);
  });
}

function handle_input() {
  if(KeyState.key[2]){
    webdude_1.moveUp();
    ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[3]){
    webdude_1.moveDown();
    ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[0]){
    webdude_1.moveLeft();
    ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[1]){
    webdude_1.moveRight();
    ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[4]){
    webdude_1.setMessage("fuck!");
    ws.send(constructMsgMessage(webdude_1.userid, "fuck!"));
  }
};

function constructUpdateMessage(webdude) {
  return ("U:" + webdude.userid + ":" + (webdude.posx/CANVAS_WIDTH).toFixed(3) + ":" + (webdude.posy/CANVAS_HEIGHT).toFixed(3) + ":" + webdude.direction + ":" + webdude.loop_i);
}

function constructMsgMessage(userid, msg) {
  return ("M:" + userid + ":" + msg);
}

function getTimestampSeconds() {
  return Math.floor(Date.now() / 1000);
}

function step(timestamp) {
  fix_dpi();
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  handle_input();
  drawdudes();
  window.requestAnimationFrame(function(timestamp) {
    step(timestamp);
  });
};
var timestamp = getTimestampSeconds();
function init_game_loop() {
  timestamp = getTimestampSeconds();
  drawdudes();
  window.addEventListener('keydown', function(e) { KeyState.changeKey(e.keyCode, 1) });
  window.addEventListener('keyup', function(e) { KeyState.changeKey(e.keyCode, 0) });
  window.requestAnimationFrame(function(timestamp) {
    step(timestamp);
  });
};

$(window).on("load", function() {
  console.log("W: " + CANVAS_WIDTH, "H: " + CANVAS_HEIGHT)
  init_game_loop();
});