const options = {
  serveClient:true
};

const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, options);
const fs = require("./localfs.js");

io.on("connection", function(socket) {
  console.log("connected");

  // handle dispatch
  socket.on("dispatch", function(req, cb) {
    if (req && req.name) {
      let s = registry.get_object(req.name);
      if (s && socket != s) {
        s.emit("dispatch", req, cb);
      }
      else {
        if (cb) cb("ERROR: unknown socket");
      }
    }
    else {
      if (cb) cb("ERROR: unknown name");
    }
  });

  // handle register
  socket.on("register", function(req, cb) {
    if (req && req.name) {
      console.log("registered: " + req.name);
      registry.set_object(req.name, socket);
      if (cb) cb("OK");
    }
    else {
      console.log("register error: unknown name");
      if (cb) cb("ERROR: unknown name");
    }
  });

  // handle disconnect
  socket.on("disconnect", function() {
    console.log("disconnect");
    registry.remove_all_objects(socket);
  });

});


// handle http
app.get('/*', function(req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  fs.handle_file_request(req, res);
});

http.listen(3001);

console.log("http://localhost:3001");
console.log("http://localhost:3001/dispatch");
