var CANVAS_WIDTH = $(document).width();
var CANVAS_HEIGHT = $(document).height();
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
var canvas = canvasElement.get(0).getContext("2d");
canvas.imageSmoothingEnabled = false;
window.addEventListener('resize', function(e){
  canvas.imageSmoothingEnabled = false;
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
const scale = 0.25;
const width = 64;
const height = 65;
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
    return webdude;
  },

  setID: function(id) {
    this.userid = id;
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

      // space bar;
      case 32:
        this.key[4] = to;
        break;
    }
  }
};


var webdude_1 = WebDude.create(0, 0);
var webdudesMap = new Map();

ws = new WebSocket("wss://localhost:8080/world");
ws.onopen = function() {
  console.log("connection opened");
};
ws.onmessage = function(evt) {
  var datalist = evt.data.split(':');
  var userid = parseInt(datalist[0]);
  var posx = parseFloat(datalist[1]) * CANVAS_WIDTH;
  var posy = parseFloat(datalist[2]) * CANVAS_HEIGHT;
  var direction = datalist[3];
  var loop_i = datalist[4];
  var webdudeToUpdate = webdudesMap.get(userid);
  if (webdudeToUpdate == null) {
    var newWebDude = WebDude.create(0, 0);
    newWebDude.setID(userid);
    webdudesMap.set(userid, newWebDude);
  } else {
    webdudeToUpdate.update(posx, posy, direction, loop_i);
  }
  console.log(datalist);
};
ws.onerror = function(err) {
  console.log("connection error: " + err);
};

function drawFrame(sprite, frameX, frameY, canvasX, canvasY) {
    canvas.drawImage(sprite, frameX * width, frameY * height, width, height, canvasX, canvasY, scaledWidth, scaledHeight);
};

function drawdude() {
  //console.log(webdude_1.posx, webdude_1.posy);
  drawFrame(webdude_1.sprite, webdude_1.loop[webdude_1.loop_i], webdude_1.direction, webdude_1.posx, webdude_1.posy);
}

function drawdudes() {
  webdudesMap.forEach( function(webdude, userid, map) {
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
};

function constructUpdateMessage(webdude) {
  return (webdude.userid + ":" + (webdude.posx/CANVAS_WIDTH).toFixed(3) + ":" + (webdude.posy/CANVAS_HEIGHT).toFixed(3) + ":" + webdude.direction + ":" + webdude.loop_i)
}

function step() {
  fix_dpi();
  canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  handle_input();
  drawdude();
  drawdudes();
  window.requestAnimationFrame(step);
};

function init_game_loop() {
  drawdude();
  window.addEventListener('keydown', function(e) { KeyState.changeKey(e.keyCode, 1) });
  window.addEventListener('keyup', function(e) { KeyState.changeKey(e.keyCode, 0) });
  window.requestAnimationFrame(step);
};

$(window).on("load", function() {
  ws.send("test");
  console.log("W: " + CANVAS_WIDTH, "H: " + CANVAS_HEIGHT)
  init_game_loop();
});