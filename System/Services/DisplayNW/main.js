const options = {
  reconnection: true
};
const io = require("socket.io-client");
const proc = require('child_process');
const socket = io("http://localhost:3000", options);
const wm = require('./wm/main.js');

function chrome_app(url) {
  console.error(`start chrome process ${url} in ${__dirname}`);
  let app = proc.spawn('./start_chrome.sh', [url], {
    cwd:__dirname
  });
  return app;
}

wm.start_process();

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
    else {
      if (cb) cb("ERROR: command not found");
    }
  });
});

socket.on("disconnect", function(socket) {
  console.log("disconnected");
});
