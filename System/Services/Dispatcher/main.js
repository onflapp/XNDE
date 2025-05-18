const OPTIONS = {
  serveClient:true,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
};

const ENDPOINTS = [
  "ws://localhost:3000",
  "http://localhost:3000/dispatch",
  "http://localhost:3000/socket.io/socket.io.js"
];

const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, OPTIONS);
const fs = require("fs");

const registry = require("./registry.js");

function obj2str(val) {
  if (!val) return '';
  if (typeof val == 'string') return val;
  return JSON.stringify(val);
}

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
        if (cb) cb({error:'unknown socket'});
      }
    }
    else {
      if (cb) cb({error:'unknown name'});
    }
  });

  // handle register
  socket.on("register", function(req, cb) {
    if (req && req.name) {
      console.log("registered: " + req.name);
      registry.set_object(req.name, socket);
      if (cb) cb({success:'OK'});
    }
    else {
      console.log("register error: unknown name");
      if (cb) cb({error:'unknown name'});
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
  if (req.query.name == 'REGISTRY' && req.query.command == 'list') {
    res.writeHead(200);
    res.end(obj2str(registry.get_all_object_names()));
  }
  else if (req.query.name == 'REGISTRY' && req.query.command == 'shutdown') {
    res.writeHead(200);
    res.end(obj2str({success:'DONE'}));
    shutdown();
  }
  else if (req.query.name == 'REGISTRY' && req.query.command == 'help') {
    res.writeHead(200);
    res.end(obj2str({
      description:fs.readFileSync(__dirname+'/HELP.md', 'utf8'),
      endpoints:ENDPOINTS
    }));
  }
  else if (req.query.name && req.query.command == "waitfor") {
    wait_for_object(req.query.name, req.query.timeout, function(rv) {
      if (rv) {
        res.writeHead(200);
        res.end(obj2str({success:`${req.query.name} found`}));
      }
      else {
        res.writeHead(404);
        res.end(obj2str({error:`${req.query.name} not found`}));
      }
    });
  }
  else if (req.query.name) {
    let s = registry.get_object(req.query.name);
    if (s) {
      s.emit("dispatch", req.query, function(rv) {
        res.writeHead(200);
        res.end(obj2str(rv));
      });
    }
    else {
      res.writeHead(200);
      res.end(obj2str({error:'unknown name'}));
    }
  }
  else {
    res.writeHead(200);
    res.end(obj2str({success:'DONE'}));
  }
});

http.listen(3000);

console.log(ENDPOINTS);
