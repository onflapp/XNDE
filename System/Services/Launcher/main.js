function web_server() {
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('the launcher');
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
  const path = require("path");
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
        let d = req.display;
        let a = [];
        let p = path.resolve(req.path);
        p = p.substr(global.LAUNCHER_HOME.length+1);

        if (req.args) {
          a = [req.args];
        }

        launcher.launch_app(p, a, function(msg) {
          if (msg.name == 'DISPLAY' && d) msg.name = d; //redirect display
          console.log(msg);
          socket.emit("dispatch", msg);
        });
        if (cb) cb({sucess:'done'});
      }
      else if (req.command === "list") {
        let p = launcher.get_application_paths();
        cb(p);
      }
      else {
        if (cb) cb({error:'command not found'});
      }
    });
  });

  socket.on("disconnect", function(socket) {
    console.log("disconnected");
  });
}

global.LAUNCHER_HOME = process.cwd();

web_server();
socket_client();
