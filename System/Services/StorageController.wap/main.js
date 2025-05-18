const OPTIONS = {
  reconnection:true
};

const ENDPOINTS = [
  "http://localhost:3001"
];

const ser = require("../SystemController.wap/services.js");
const app = require("express")();
const http = require("http").createServer(app);
const io = require('socket.io-client');
const socket = io('http://localhost:3000', OPTIONS);

let modules = {};

ser.setModulesPath(__dirname);

socket.on("connect", function() {
  console.log("connected");

  socket.emit("register", {name:"STORAGE"}, function() {
    console.log("registering: STORAGE");
  });

  // handle dispatch
  socket.on("dispatch", function(req, cb) {
    if (req && req.command == 'mount' && req.type && req.prefix && req.path) {

      ser.init(req.type, req, function(mod, name) {
        if (mod) {
          modules[name] = {path:req.path, type:req.type};
          if (cb) cb({success:`mounted as ${req.prefix}`});
        }
        else {
          if (cb) cb({error:`unable to mount ${req.prefix}`});
        }
      });
    }
    else {
      if (cb) cb({error:'invalid command'});
    }
  });
});

socket.on("disconnect", function() {
  console.log("disconnect");
});

// handle http
app.get('/*', function(req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  let path = unescape(req.path);

  if (path == '/' || path == '') {
    if (req.accepts('text/html')) {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      let rv = [];

      rv.push('<!DOCTYPE html><html><head><title>/</title></head><body>');
      rv.push('<ul>');
      for (let k in modules) {
        let m = modules[k];
        rv.push('<li><a href="'+k+'/">'+k+'/</a></li>');
      }
      rv.push('</ul>');
      rv.push('</body></html>');
      res.end(rv.join(''));
    }
    else {
      let rv = [];
      for (let k in modules) {
        let m = modules[k];
        rv.push({
          name:k,
          type:'d'
        });
      }

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify(rv));
    }
  }
  else {
    let name = 'ROOT';
    let i = path.indexOf('/', 1);

    if (i > 0) {
      name = path.substr(1, i-1);
      path = path.substr(i);
    }

    let mod = ser.lookup(name);
    if (mod) {
      mod.handle_request(path, req, res);
    }
    else {
      res.writeHead(404);
      res.end(`unknown module ${name}`);
    }
  }
});

http.listen(3001);

console.log(ENDPOINTS);
