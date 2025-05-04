let modules = {};

function init_module(name, cb) {
  try {
    let mod = require(`./modules/${name}.js`);
    mod.init(function(name) {
      if (name) {
        modules[name] = mod;
        cb(name);
      }
    });
  }
  catch(ex) {
    console.error(ex);
    console.error(`error loading ${name}`);
  }
}

function init_modules(cb) {
  init_module("battery", cb);
  init_module("monitor",cb);
  init_module("audio", cb);
}

function lookup_module(name) {
  let mod = modules[name];
  return mod;
}

function socket_client() {
  const options = {
    reconnection: true
  };

  const io = require("socket.io-client");
  const socket = io("http://localhost:3000", options);

  socket.on("connect", function() {
    console.log("connected");

    socket.emit("register", {name:"SYSTEM"}, function() {
      console.log("registering: SYSTEM");
      init_modules(function(name) {
        if (name) {
          socket.emit("register", {name:name});
        }
      });
    });

    socket.on("dispatch", function(req, cb) {
      if (req && req.name) {
        let module = lookup_module(req.name);
        if (module) {
          module.dispatch(req, function(rv) {
            let s = JSON.stringify(rv);
            cb(s);
          });
        }
        else {
          if (cb) cb(`ERROR: module ${req.name} not found`);
        }
      }
      else {
        if (cb) cb("ERROR: no name");
      }
    });
  });

  socket.on("disconnect", function(socket) {
    console.log("disconnected");
  });
}

socket_client();
