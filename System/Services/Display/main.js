const options = {
  reconnection: true
};

const DEFAULT_WM = './wm/main.js';

const fs = require("fs");
const decache = require("decache");
const io = require("socket.io-client");
const proc = require('child_process');
const socket = io("http://localhost:3000", options);

let wm = null;

function chrome_app(url) {
  console.error(`start chrome process ${url} in ${__dirname}`);
  let app = proc.spawn('./start_chrome.sh', [url], {
    cwd:__dirname
  });
  return app;
}

function start_wm(path) {
  try {
    wm = require(path);
    wm.source_path = path;

    wm.start_process();
  }
  catch(ex) {
    console.error(ex);
    wm = null;
  }
}

function stop_wm() {
  try {
    if (wm) wm.stop_process();
    if (wm['source_path']) {
      decache(wm['source_path']);
    }
    wm = null;
  }
  catch(ex) {
    console.err(ex);
  }
}

socket.on("connect", function() {
  console.log("connected");

  socket.emit("register", {name:"DISPLAY"}, function() {
    console.log("registered DISPLAY");
  });


  socket.on("dispatch", function(req, cb) {
    console.log(req);
    if (req.command === "show" && req.url) {
      chrome_app(req.url);
      if (cb) cb("done");
    }
    else if (req.command === "restart") {
      stop_wm();
      setTimeout(function() {
        start_wm(DEFAULT_WM);
        if (cb) cb("done");
      },1000);
    }
    else {
      if (cb) cb("ERROR: command not found");
    }
  });

  start_wm(DEFAULT_WM);
});

socket.on("disconnect", function(socket) {
  console.log("disconnected");
});
