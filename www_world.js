var CANVAS_WIDTH = $(document).width();
var CANVAS_HEIGHT = $(document).height();
var MESSAGE_LIFESPAN = 5;
var GAME_SERVER = "wss://localhost:8080/world";
var getUrl = window.location;
var BASE_URL = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];

// Device Detection //
var isMobile = false;
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    isMobile = true;
}

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('www_world.css');
(document.head||document.documentElement).appendChild(style);

const Utility = {
  fix_dpi: function(view) {
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
    view.canvasElement[0].setAttribute('width', CANVAS_WIDTH);
    view.canvasElement[0].setAttribute('height', CANVAS_HEIGHT);
  },

  generateID: function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  getTimestampSeconds: function() {
    return Math.floor(Date.now() / 1000);
  }
}

/*  
 = == == == == == == == == == == == == == ==
||                                         ||
||             * GAME VIEW *               ||
||                                         ||
 = == == == == == == == == == == == == == ==
 */
const WWWW_View = {
  context: null,
  canvasElement: null,

  create: function() {
    var view = Object.create(this);
    var div = $('<div/>').appendTo('body');
    div.attr('id', "canvas-div");
    // canvasElement
    view.canvasElement = $('<canvas/>',{'id':'webdudes-canvas'}).width(CANVAS_WIDTH).height(CANVAS_HEIGHT);
    $('#canvas-div').append(view.canvasElement);
    div = $('<div/>').appendTo('#canvas-div');
    div.attr('id', 'message-bar');
    var input = $('<input/>').appendTo('#message-bar');
    input.attr('type', 'text');
    input.attr('id', 'message-input');
    view.messageInput = $('#message-input');
    input = $('<input/>').appendTo('#message-bar');
    input.attr('type', 'button');
    input.attr('id', 'send-button');
    input.attr('value', 'send');
    view.sendButton = $('#send-button');
    // context
    view.context = view.canvasElement.get(0).getContext("2d");
    view.context.imageSmoothingEnabled = false;
    window.addEventListener('resize', function(e){
      view.context.imageSmoothingEnabled = false;
    }, false);
    return view;
  },

  // Drawing/Rendering on Canvas //
  draw_text: function(message, x, y) {
    this.context.font = "25px Arial";
    this.context.textAlign = "center";
    this.context.fillText(message, x, y)
  },
  draw_username: function(webdude) {
    this.draw_text(webdude.username, webdude.posx + (webdude.width/2), webdude.posy + webdude.height + 20);
  },
  draw_player1_message: function(message) {
    this.draw_text(message, webdude_1.posx + (webdude_1.width/2), webdude_1.posy - 5);
  },
  draw_message: function(webdude){
    this.draw_text(webdude.message, webdude.posx + (webdude.width/2), webdude.posy - 5);
  },
  draw_player_frame: function(sprite, frameX, frameY, canvasX, canvasY) {
    this.context.drawImage(sprite.spritesheet, frameX * sprite.width, frameY * sprite.height, sprite.width, sprite.height, canvasX, canvasY, sprite.width * sprite.scale, sprite.height * sprite.scale);
  },
  draw_players: function(webdudesMap) {
    var curr_timestamp = Utility.getTimestampSeconds();
    webdudesMap.forEach( function(webdude, userid, map) {
      if (curr_timestamp - webdude.message_timestamp < MESSAGE_LIFESPAN) {
        this.draw_message(webdude);
      }
      this.draw_player_frame(webdude, webdude.loop[webdude.loop_i], webdude.direction, webdude.posx, webdude.posy);
      this.draw_username(webdude);
    }.bind(this));
  }
}

/*  
 = == == == == == == == == == == == == == ==
||                                         ||
||              * PLAYER *                 ||
||                                         ||
 = == == == == == == == == == == == == == ==
 */
const WebDude = {
  spritesheet: new Image(),
  height: 0,
  width: 0,
  scale: 1,
  username: "player", //default

  create: function(posx, posy) {
    var webdude = Object.create(this);
    webdude.userid = Utility.generateID(0, 1000000); // Random nuumber for testing purposes
    webdude.spritesheet.src = chrome.runtime.getURL('images/wwww_walrus_spritesheet.png');
    // get dimensions of sprite based on standard spritesheet
    webdude.spritesheet.onload = function(){
      webdude.height = webdude.spritesheet.height/4;
      webdude.width = webdude.spritesheet.width/3;
    }
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
    this.message_timestamp = Utility.getTimestampSeconds();
    return message;
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
    if(this.posx < CANVAS_WIDTH) {
      this.posx = this.posx + this.speed;
      this.animationFrame();
      this.direction = 1;
    }
  },

  moveDown: function() {
    if (this.posy < CANVAS_HEIGHT) { 
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

/*  
 = == == == == == == == == == == == == == ==
||                                         ||
||             * GAME MODEL *              ||
||                                         ||
 = == == == == == == == == == == == == == ==
 */
const WWWW_World = {
  webdude_1: null,
  webdudesMap: new Map(),

  create: function() {
    var world = Object.create(this);
    world.webdude_1 = WebDude.create(0, 0);
    world.webdudesMap.set(world.webdude_1.userid, world.webdude_1);
    return world;
  }
}

/*  
 = == == == == == == == == == == == == == ==
||                                         ||
||       * GAME WINDOW CONTROLLER *        ||
||                                         ||
 = == == == == == == == == == == == == == ==
 */
var WWWW_Window = {
  ws: null,
  game_loop_running: false,
  first_run: true,
  view: null,
  world: null,
  // KeyState Updater //
  KeyState: {
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
  },

  create: function() {
    var controller = Object.create(this);
    return controller;
  },

  addEventListeners: function() {
    $('#send-button').click(function() {
      this.view.draw_player_message(this.world.webdude_1.setMessage($('#message-input').val()));
    }.bind(this));
  },

  /*  
  = == == == == == == == == == == == == == ==
  ||      * GAME SERVER CONNECTION *         ||
  = == == == == == == == == == == == == == ==
  */
  handleUpdateMessage: function(data) {
    var datalist = data.split(':');
    var userid = parseInt(datalist[1]);
    var posx = parseFloat(datalist[2]) * CANVAS_WIDTH;
    var posy = parseFloat(datalist[3]) * CANVAS_HEIGHT;
    var direction = parseInt(datalist[4]);
    var loop_i = parseInt(datalist[5]);
    var webdudeToUpdate = this.world.webdudesMap.get(userid);
    if (webdudeToUpdate == null) {
      var newWebDude = WebDude.create(0, 0);
      newWebDude.userid = userid;
      this.world.webdudesMap.set(userid, newWebDude);
    } else {
      webdudeToUpdate.update(posx, posy, direction, loop_i);
    }
  },

  handleMsgMessage: function(data) {
    var datalist = data.split(':');
    var userid = parseInt(datalist[1]);
    var msg = datalist[2];
    var webdudeToUpdate = this.world.webdudesMap.get(userid);
    if (webdudeToUpdate == null) {
      var newWebDude = WebDude.create(0, 0);
      newWebDude.userid = userid;
      newWebDude.setMessage(msg);
      this.world.webdudesMap.set(userid, newWebDude);
    } else {
      webdudeToUpdate.setMessage(msg);
    }
  },

  // Create WebSocket Connection //
  createWebSocketConnection: function() {
    this.ws = new WebSocket(GAME_SERVER);
    this.ws.onopen = function() {
      console.log("connection opened");
    };
    this.ws.onmessage = function(evt) {
      var messageType = evt.data.split(':')[0];
      if(messageType == "U") {
        this.handleUpdateMessage(evt.data);
      } else if (messageType == "M") {
        this.handleMsgMessage(evt.data);
      }
    }.bind(this);
    this.ws.onclose = function() {
      console.log("server disconnected")
    }
    this.ws.onerror = function(err) {
      console.log("connection error");
    };
  },

  /*  
  = == == == == == == == == == == == == == ==
  ||            * USER INPUT *               ||
  = == == == == == == == == == == == == == ==
  */
  handle_player_input: function() {
    if(this.KeyState.key[0] || this.KeyState.key[1] || this.KeyState.key[2] || this.KeyState.key[3] || this.KeyState.key[4]) {
      if(this.KeyState.key[2]){
        this.world.webdude_1.moveUp();
        // this.ws.send(this.constructUpdateMessage(this.world.webdude_1));
      }
      if(this.KeyState.key[3]){
        this.world.webdude_1.moveDown();
        // this.ws.send(this.constructUpdateMessage(this.world.webdude_1));
      }
      if(this.KeyState.key[0]){
        this.world.webdude_1.moveLeft();
        // this.ws.send(this.constructUpdateMessage(this.world.webdude_1));
      }
      if(this.KeyState.key[1]){
        this.world.webdude_1.moveRight();
        // this.ws.send(this.constructUpdateMessage(this.world.webdude_1));
      }
      if(this.KeyState.key[4]){
        this.world.webdude_1.setMessage("greetings!");
        // this.ws.send(this.constructMsgMessage(this.world.webdude_1.userid, "fuck!"));
      }
    }
  },

  constructUpdateMessage: function(webdude) {
    return ("U:" + webdude.userid + ":" + (webdude.posx/CANVAS_WIDTH).toFixed(3) + ":" + (webdude.posy/CANVAS_HEIGHT).toFixed(3) + ":" + webdude.direction + ":" + webdude.loop_i);
  },

  constructMsgMessage: function(userid, msg) {
    return ("M:" + userid + ":" + msg);
  },

  /*  
  = == == == == == == == == == == == == == ==
  ||             * GAME LOOP *               ||
  = == == == == == == == == == == == == == ==
  */

  // Reset User Sprite to the First Frame //
  resetUserSprite: function() {
    this.world.webdude_1.loop_i = 0;
  },

  // Step the Game one Frame //
  step: function(timestamp) {
    if (!this.game_loop_running) {
      return;
    }
    Utility.fix_dpi(this.view);
    this.view.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.handle_player_input();
    this.view.draw_players(this.world.webdudesMap);
    window.requestAnimationFrame(function(timestamp) {
      this.step(timestamp);
    }.bind(this));
  },

  // Start Game Loop //
  init_game_loop: function() {
    var timestamp = Utility.getTimestampSeconds();
    window.addEventListener('keydown', function(e) {
      this.KeyState.changeKey(e.keyCode, 1) 
    }.bind(this));
    window.addEventListener('keyup', function(e) { 
      this.KeyState.changeKey(e.keyCode, 0);
      this.resetUserSprite();
    }.bind(this));
    window.requestAnimationFrame(function(timestamp) {
      this.step(timestamp);
    }.bind(this));
  },

  start: function() {
    console.log("⨀ Starting Up WWWWorld ⨀");
    console.log(BASE_URL, CANVAS_HEIGHT, CANVAS_WIDTH);
    this.game_loop_running = true;
    this.first_run = false;
    this.view = WWWW_View.create();
    this.world = WWWW_World.create();
    this.createWebSocketConnection();
    this.addEventListeners();
    this.init_game_loop();
  },

  pause: function() {
    console.log("! Pausing WWWWorld... !");
    this.game_loop_running = false;
    this.view.canvasElement[0].style.display = 'none';
  },

  restart: function() {
    console.log("⨀ WWWWorld Resumed! ⨀");
    console.log(BASE_URL, CANVAS_HEIGHT, CANVAS_WIDTH);
    this.game_loop_running = true;
    this.view.canvasElement[0].style.display = 'block';
    this.createWebSocketConnection();
    this.init_game_loop();
  }
}

/*
 = == == == == == == == == == == == == == ==
||                                         ||
||       * GAME STATE CONTROLLER *         ||
||      (called from background.js)        ||
||             via icon click              ||
||                                         ||
 = == == == == == == == == == == == == == ==
*/
var wwww_window = WWWW_Window.create();
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (!wwww_window.game_loop_running && wwww_window.first_run) {
    wwww_window.start();
  } else if (wwww_window.game_loop_running) {
    wwww_window.pause();
  } else {
    wwww_window.restart();
  }
});
