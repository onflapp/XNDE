const OPTIONS = {
  reconnection: true
};

const io = require("socket.io-client");
const socket = io("http://localhost:3000", OPTIONS);
const ser = require("./services.js");

function init_modules(cb) {
  ser.init('battery', {}, cb);
  ser.init('audio', {}, cb);
  ser.init('keyboard', {}, cb);
  ser.init('monitor', {}, cb);
}

socket.on("connect", function() {
  console.log("connected");

  socket.emit("register", {name:"SYSTEM"}, function() {
    console.log("registering: SYSTEM");

    //register all modules
    init_modules(function(mod, name) {
      if (name) {
        socket.emit("register", {name:name});
      }
    });
  });

  socket.on("dispatch", function(req, cb) {
    if (req && req.name) {
      let module = ser.lookup(req.name);
      if (module) {
        try {
          module.dispatch(req, function(rv) {
            cb(JSON.stringify(rv));
          });
        }
        catch(ex) {
          if (cb) cb({error:''+ex});
        }
      }
      else {
        if (cb) cb({error:`module ${req.name} not found`});
      }
    }
    else {
      if (cb) cb({error:'no name'});
    }
  });
});

socket.on("disconnect", function(socket) {
  console.log("disconnected");
});
