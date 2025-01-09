function web_server() {
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.use('/', express.static("."));

  let server = app.listen(0, function () {
    WPORT = server.address().port;
    global.WPORT = WPORT;
    console.log(`http://localhost:${WPORT}`);
  });
}

function socket_client() {
  const options = {
    reconnection: true
  };

  const io = require("socket.io-client");
  const launcher = require("./launcher.js");
  const socket = io("http://localhost:3000", options);

  socket.on("connect", function() {
    console.log("connected");

    socket.emit("register", {name:"LAUNCHER"}, function() {
      console.log("registering: LAUNCHER");
    });

    socket.on("dispatch", function(req, cb) {
      console.log(req);
      if (req.command === "launch" && req.path) {
        launcher.launch_app(req.path, function(msg) {
          console.log(msg);
          socket.emit("dispatch", msg);
        });
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
}

web_server();
socket_client();
