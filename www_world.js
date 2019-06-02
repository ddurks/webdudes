var CANVAS_WIDTH = $(document).width();
var CANVAS_HEIGHT = $(document).height();
var MESSAGE_LIFESPAN = 5;
var getUrl = window.location;
var BASE_URL = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];

// Apply CSS Styles //
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('www_world.css');
(document.head||document.documentElement).appendChild(style);

// Create Canvas //
var div = $('<div/>').appendTo('body');
div.attr('id', "canvas-div")
var canvasElement = $('<canvas/>',{'id':'webdudes-canvas'}).width(CANVAS_WIDTH).height(CANVAS_HEIGHT);
$('#canvas-div').append(canvasElement);
var context = canvasElement.get(0).getContext("2d");
context.imageSmoothingEnabled = true;
window.addEventListener('resize', function(e){
  context.imageSmoothingEnabled = false;
}, false)

// Fix Canvas Size (prevents image distortion) //
var dpi = window.devicePixelRatio;
function fix_dpi() {
  canvasElement = document.getElementById("webdudes-canvas");
  let style = {
    height() {
      return +getComputedStyle(canvasElement).getPropertyValue('height').slice(0,-2);
    },
    width() {
      return +getComputedStyle(canvasElement).getPropertyValue('width').slice(0,-2);
    }
  }
  CANVAS_WIDTH = style.width() * dpi;
  CANVAS_HEIGHT = style.height() * dpi;
  canvasElement.setAttribute('width', CANVAS_WIDTH);
  canvasElement.setAttribute('height', CANVAS_HEIGHT);
}

function generateID(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Constants For Player Movement/Rendering //
const player_image_height = 65;
const player_image_width = 65;
const player_image_sHeight = 96;
const player_image_sWidth = 96;
// Player Class //
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
    webdude.userid = generateID(0, 1000000); // Randon nuumber for testing purposes
    webdude.sprite.src = chrome.runtime.getURL('images/web_dude_sprite_sheet.png');
    webdude.posx = posx;
    webdude.posy = posy;
    webdude.loop = [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,2,2,2,2,2];
    webdude.loop_i = 0;
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
    if(this.posx < CANVAS_WIDTH - player_image_sWidth) {
      this.posx = this.posx + this.speed;
      this.animationFrame();
      this.direction = 1;
    }
  },

  moveDown: function() {
    if (this.posy < CANVAS_HEIGHT - player_image_sHeight ) { 
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
    if (this.loop_i < 19) {
      this.loop_i++;
    } else {
      this.loop_i = 0;
    }
  },
};

// Create Local Environment //
var webdude_1 = WebDude.create(0, 0);
var webdudesMap = new Map();
webdudesMap.set(webdude_1.userid, webdude_1);

// Game Server Connection //
// *handlers* //
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

// Create WebSocket Connection //
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

// Drawing/Rendering on Canvas //
function draw_text(message, x, y) {
  context.font = "25px Arial";
  context.textAlign = "center";
  context.fillText(message, x, y)
}
function draw_message(webdude){
  draw_text(webdude.message, webdude.posx + (player_image_sWidth/2), webdude.posy - 5);
}

function draw_player_frame(sprite, frameX, frameY, canvasX, canvasY) {
    context.drawImage(sprite, frameX * player_image_width, frameY * player_image_height, player_image_width, player_image_height, canvasX, canvasY, player_image_sWidth, player_image_sHeight);
};
function draw_players() {
  var curr_timestamp = getTimestampSeconds();
  webdudesMap.forEach( function(webdude, userid, map) {
    if (curr_timestamp - webdude.message_timestamp < MESSAGE_LIFESPAN) {
      draw_message(webdude);
    }
    draw_player_frame(webdude.sprite, webdude.loop[webdude.loop_i], webdude.direction, webdude.posx, webdude.posy);
  });
}

// KeyState Updater //
var KeyState = {
  key: [0,0,0,0],
  changeKey: function(which, to) {
    switch (which) {
      case 65: // a
        this.key[0] = to;
        break;
      case 87: // w
        this.key[2] = to;
        break;
      case 68: // d
        this.key[1] = to;
        break;
      case 83: // s
        this.key[3] = to;
        break;
      case 70: // f
        this.key[4] = to;
        break;
    }
  }
};
// Handle User Input //
function handle_input() {
  if(KeyState.key[0] || KeyState.key[1] || KeyState.key[2] || KeyState.key[3])
  if(KeyState.key[2]){
    webdude_1.moveUp();
    //ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[3]){
    webdude_1.moveDown();
    //ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[0]){
    webdude_1.moveLeft();
    //ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[1]){
    webdude_1.moveRight();
    //ws.send(constructUpdateMessage(webdude_1));
  }
  if(KeyState.key[4]){
    webdude_1.setMessage("fuck!");
    //ws.send(constructMsgMessage(webdude_1.userid, "fuck!"));
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

// Reset User Sprite to the First Frame //
function resetUserSprite() {
  webdude_1.loop_i = 0;
}

// Step the Game one Frame //
function step(timestamp) {
  fix_dpi();
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  handle_input();
  draw_players();
  window.requestAnimationFrame(function(timestamp) {
    step(timestamp);
  });
};

// Start Game Loop //
var timestamp = getTimestampSeconds();
function init_game_loop() {
  timestamp = getTimestampSeconds();
  window.addEventListener('keydown', function(e) { KeyState.changeKey(e.keyCode, 1) });
  window.addEventListener('keyup', function(e) { 
    KeyState.changeKey(e.keyCode, 0);
    resetUserSprite();
  });
  window.requestAnimationFrame(function(timestamp) {
    step(timestamp);
  });
};

// Wait For Window (and images) Load before Game Loop Start //
$(window).on("load", function() {
  console.log(BASE_URL, CANVAS_HEIGHT, CANVAS_WIDTH);
  init_game_loop();
});