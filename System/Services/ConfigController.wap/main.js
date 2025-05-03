function read_value(section, key, cb) {
  const fs = require('fs');
  const cfile = `${process.env.XNDE_HOME}/Config/${section}.json`;
  
  fs.readFile(cfile, function(err, data) {
    if (err) {
      console.log(err);
      cb(null);
    }
    else {
      let rv = JSON.parse(data);
      if (rv && rv[key]) cb(rv[key]);
      else cb(null);
    }
  });
}

function write_value(section, key, val, cb) {
  const fs = require('fs');
  const cfile = `${process.env.XNDE_HOME}/Config/${section}.json`;

  fs.readFile(cfile, function(err, data) {
    let rv = null;
    if (err) rv = {};
    else {
      rv = JSON.parse(data);
      if (!rv) rv = {};
    }

    rv[key] = val;

    let json = JSON.stringify(rv, null, 2);
    fs.writeFile(cfile, json, 'utf8', function(err) {
      if (err) console.log(err);
      cb();
    });
  });
}

function socket_client() {
  const options = {
    reconnection: true
  };

  const io = require("socket.io-client");
  const socket = io("http://localhost:3000", options);

  socket.on("connect", function() {
    console.log("connected");

    socket.emit("register", {name:"CONFIG"}, function() {
      console.log("registering: CONFIG");
    });

    socket.on("dispatch", function(req, cb) {
      if (req && req.section) {
        if (req.command == 'read' && req.key) { 
          read_value(req.section, req.key, function(rv) {
            cb(rv);
          });
        }
        else if (req.command == 'write' && req.key && req.value) {
          write_value(req.section, req.key, req.value, function() {
            cb('done');
          });
        }
        else {
          if (cb) cb("ERROR: invalid command");
        }
      }
      else {
        if (cb) cb("ERROR: no section");
      }
    });
  });

  socket.on("disconnect", function(socket) {
    console.log("disconnected");
  });
}

socket_client();
