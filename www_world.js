var CANVAS_WIDTH = $(document).width();
var CANVAS_HEIGHT = $(document).height();
var MESSAGE_LIFESPAN = 5;
var getUrl = window.location;
var BASE_URL = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];

// Device Detection //
var isMobile = false; //initiate as false
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    isMobile = true;
}

// Apply CSS Styles //
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('www_world.css');
(document.head||document.documentElement).appendChild(style);

var ws = null;
var game_loop_running = false;
var first_run = true;
var view = null;
var world = null;

var WWWW_View = {
  canvasElement: null,
  context: null,

  create: function() {
    var view = Object.create(this);
    var div = $('<div/>').appendTo('body');
    div.attr('id', "canvas-div")
    view.canvasElement = $('<canvas/>',{'id':'webdudes-canvas'}).width(CANVAS_WIDTH).height(CANVAS_HEIGHT);
    $('#canvas-div').append(view.canvasElement);
    view.context = view.canvasElement.get(0).getContext("2d");
    view.context.imageSmoothingEnabled = true;
    window.addEventListener('resize', function(e){
      view.context.imageSmoothingEnabled = false;
    }, false)
    return view;
  },

  // Drawing/Rendering on Canvas //
  draw_text: function(message, x, y) {
    this.context.font = "25px Arial";
    this.context.textAlign = "center";
    this.context.fillText(message, x, y)
  },
  draw_message: function(webdude){
    draw_text(webdude.message, webdude.posx + (player_image_sWidth/2), webdude.posy - 5);
  },

  draw_player_frame: function(sprite, frameX, frameY, canvasX, canvasY) {
      context.drawImage(sprite, frameX * player_image_width, frameY * sprite.height, player_image_width, sprite.height, canvasX, canvasY, sprite.width, sprite.height);
  },
  draw_players: function(webdudesMap) {
    var curr_timestamp = getTimestampSeconds();
    webdudesMap.forEach( function(webdude, userid, map) {
      if (curr_timestamp - webdude.message_timestamp < MESSAGE_LIFESPAN) {
        draw_message(webdude);
      }
      draw_player_frame(webdude.sprite, webdude.loop[webdude.loop_i], webdude.direction, webdude.posx, webdude.posy);
    });
  }
}

// Fix Canvas Size (prevents image distortion) //
function fix_dpi() {
  var dpi = window.devicePixelRatio;
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
  view.canvasElement.setAttribute('width', CANVAS_WIDTH);
  view.canvasElement.setAttribute('height', CANVAS_HEIGHT);
}

// Generate UID for Testint
function generateID(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Player Class //
var WebDude = {
  userid: 0,
  sprite: new Image(),
  height: 96,
  width: 96,
  posx: 0,
  posy: 0,
  speed: 0,
  direction: 0,
  loop: [],
  walking_loop: [],
  jumping_loop: [],
  loop_i: 0,
  message: "",
  message_timestamp: 0,

  create: function(posx, posy) {
    var webdude = Object.create(this);
    webdude.userid = generateID(0, 1000000); // Random nuumber for testing purposes
    webdude.sprite.src = chrome.runtime.getURL('images/wwww_walrus_spritesheet.png');
    webdude.posx = posx;
    webdude.posy = posy;
    webdude.walking_loop = [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,2,2,2,2,2];
    webdude.loop = webdude.walking_loop;
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
    if (this.loop_i < (this.loop.length - 1)) {
      this.loop_i++;
    } else {
      this.loop_i = 0;
    }
  },
};

var WWWWorld = {
  webdude_1: null,
  webdudesMap: new Map(),

  create: function() {
    var world = Object.create(this);
    world.webdude_1 = WebDude.create(0, 0);
    world.webdudesMap.set(world.webdude_1.userid, world.webdude_1);
    return world;
  }
}

// Game Server Connection //
// *handlers* //
function handleUpdateMessage(data) {
  var datalist = data.split(':');
  var userid = parseInt(datalist[1]);
  var posx = parseFloat(datalist[2]) * CANVAS_WIDTH;
  var posy = parseFloat(datalist[3]) * CANVAS_HEIGHT;
  var direction = parseInt(datalist[4]);
  var loop_i = parseInt(datalist[5]);
  var webdudeToUpdate = world.webdudesMap.get(userid);
  if (webdudeToUpdate == null) {
    var newWebDude = WebDude.create(0, 0);
    newWebDude.userid = userid;
    world.webdudesMap.set(userid, newWebDude);
  } else {
    webdudeToUpdate.update(posx, posy, direction, loop_i);
  }
}
function handleMsgMessage(data) {
  var datalist = data.split(':');
  var userid = parseInt(datalist[1]);
  var msg = datalist[2];
  var webdudeToUpdate = world.webdudesMap.get(userid);
  if (webdudeToUpdate == null) {
    var newWebDude = WebDude.create(0, 0);
    newWebDude.userid = userid;
    newWebDude.setMessage(msg);
    world.webdudesMap.set(userid, newWebDude);
  } else {
    webdudeToUpdate.setMessage(msg);
  }
}

// Create WebSocket Connection //
function createWebSocketConnection() {
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
    world.webdude_1.moveUp();
    //ws.send(constructUpdateMessage(world.webdude_1));
  }
  if(KeyState.key[3]){
    world.webdude_1.moveDown();
    //ws.send(constructUpdateMessage(world.webdude_1));
  }
  if(KeyState.key[0]){
    world.webdude_1.moveLeft();
    //ws.send(constructUpdateMessage(world.webdude_1));
  }
  if(KeyState.key[1]){
    world.webdude_1.moveRight();
    //ws.send(constructUpdateMessage(world.webdude_1));
  }
  if(KeyState.key[4]){
    world.webdude_1.setMessage("fuck!");
    //ws.send(constructMsgMessage(world.webdude_1.userid, "fuck!"));
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
  world.webdude_1.loop_i = 0;
}

// Step the Game one Frame //
function step(timestamp) {
  if (!game_loop_running) {
    return;
  }
  fix_dpi();
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  handle_input();
  view.draw_players(world.webdudesMap);
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

// Listen For Trigger From background.js //
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (!game_loop_running && first_run) {
    // Start Up //
    console.log("Starting Up WWWWorld");
    game_loop_running = true;
    first_run = false;
    view = WWWW_View.create();
    world = WWWWorld.create();
    createWebSocketConnection();
    console.log(BASE_URL, CANVAS_HEIGHT, CANVAS_WIDTH);
    init_game_loop();
  } else if (game_loop_running) {
    // Pause //
    console.log("Pausing WWWWorld...");
    game_loop_running = false;
    canvasElement.style.display = 'none';
  } else {
    // Restart //
    console.log("WWWWorld Resumed!");
    game_loop_running = true;
    canvasElement.style.display = 'block';
    createWebSocketConnection();
    console.log(BASE_URL, CANVAS_HEIGHT, CANVAS_WIDTH);
    init_game_loop();
  }
});

// Wait For Window (and images) Load before Game Loop Start //
// $(window).on("load", function() {
//   console.log(BASE_URL, CANVAS_HEIGHT, CANVAS_WIDTH);
//   init_game_loop();
// });