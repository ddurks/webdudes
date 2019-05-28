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
var webdude_img = new Image();
webdude_img.src = chrome.runtime.getURL('images/web_dude_sprite_sheet.png');

//  animation frame
let frame = 0;
let pace_starttime = 0;
let pace_duration = 100;

// class for small-man sprite
var WebDude = {
  posx: 0,
  posy: 0,
  speed: 0,
  direction: 0,
  loop: [],
  loop_i: 0,

  create: function(posx, posy) {
    var webdude = Object.create(this);
    webdude.loop = [0,1,0,2];
    webdude.loop_i = 0;
    webdude.posx = posx;
    webdude.posy = posy;
    webdude.direction = 0;
    webdude.speed = 15;
    return webdude;
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

function drawFrame(frameX, frameY, canvasX, canvasY) {
    canvas.drawImage(webdude_img, frameX * width, frameY * height, width, height, canvasX, canvasY, scaledWidth, scaledHeight);
};

function drawdude() {
  console.log(webdude_1.posx, webdude_1.posy);
  drawFrame(webdude_1.loop[webdude_1.loop_i], webdude_1.direction, webdude_1.posx, webdude_1.posy);
}

function handle_input() {
  if(KeyState.key[2]){
    webdude_1.moveUp();
  }
  if(KeyState.key[3]){
    webdude_1.moveDown();
  }
  if(KeyState.key[0]){
    webdude_1.moveLeft();
  }
  if(KeyState.key[1]){
    webdude_1.moveRight();
  }
};

function step() {
  fix_dpi();
  canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  handle_input();
  drawdude();
  window.requestAnimationFrame(step);
};

function init_game_loop() {
  drawdude();
  window.addEventListener('keydown', function(e) { KeyState.changeKey(e.keyCode, 1) });
  window.addEventListener('keyup', function(e) { KeyState.changeKey(e.keyCode, 0) });
  window.requestAnimationFrame(step);
};

console.log("W: " + CANVAS_WIDTH, "H: " + CANVAS_HEIGHT)
webdude_img.onload = function() {
  init_game_loop();
};