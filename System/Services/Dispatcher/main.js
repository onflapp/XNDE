const options = {
  serveClient:true
};

const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, options);

const registry = require("./registry.js");

function shutdown() {
  setTimeout(function() {
    process.exit(0);
  },500);
}

function wait_for_object(name, timeout, cb) {
  let s = registry.get_object(name);
  if (s) {
    cb(true);
  }
  else {
    let c = timeout?(timeout*10):100;
    let do_check = function() {
      let s = registry.get_object(name);
      if (s) {
        cb(true);
      }
      else if (c <= 0) {
        cb(false);
      }
      else {
        c--;
        setTimeout(do_check, 100);
      }
    };

    setTimeout(do_check, 100);
  }
}

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
app.get('/dispatch*', function(req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  console.log(req.query);
  if (req.query.name == 'registry' && req.query.command == 'list') {
    res.writeHead(200);
    res.end(registry.get_all_object_names().join('\n'));
  }
  else if (req.query.name == 'registry' && req.query.command == 'shutdown') {
    res.writeHead(200);
    res.end('OK');
    shutdown();
  }
  else if (req.query.name && req.query.command == "waitfor") {
    wait_for_object(req.query.name, req.query.timeout, function(rv) {
      if (rv) {
        res.writeHead(200);
        res.end(`${req.query.name} found`);
      }
      else {
        res.writeHead(404);
        res.end(`${req.query.name} not found`);
      }
    });
  }
  else if (req.query.name) {
    let s = registry.get_object(req.query.name);
    if (s) {
      s.emit("dispatch", req.query, function(rv) {
        res.writeHead(200);
        res.end(rv);
      });
    }
    else {
      res.writeHead(200);
      res.end('unknown name');
    }
  }
  else {
    res.writeHead(200);
    res.end('DONE');
  }
});

http.listen(3000);

console.log("http://localhost:3000");
console.log("http://localhost:3000/dispatch");
console.log("http://localhost:3000/socket.io/socket.io.js");
