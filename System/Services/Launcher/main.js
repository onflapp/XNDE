const mutil = require('shared/messages');
const registry= require('shared/registry');
const launcher= require('./launcher.js');
const commands = require('./commands').commands;
const router = require('shared/router');

function route_message(msg, cb) {
  global.message_router.route(msg, cb);
}

function cleanup() {
  console.error('terminating all child processes');
  let ls = registry.get_all_objects();
  for (let i = 0; i < ls.length; i++) {
    let it = ls[i];
    if (it.kill) {
      it.kill('SIGINT');
    }
  }
}

function io_client() {
  const cio = require('shared/client_io');

  cio.receive_message(process, 
    function(msg, cb) {
      if (msg) {
        route_message(msg, cb);
      }
      else {
        cb(null);
      }
    }
  );
}

function ws_receive_message(connection) {
  const sio = require('shared/client_ws');
  sio.receive_message(connection, 
    function(msg, cb) {
      if (msg) {
        route_message(msg, cb);
      }
      else {
        cb(null);
        //cleanup();
        //process.exit(1);
      }
    }
  );
}

function ws_client() {
  const sio = require('shared/client_ws');

  let port = (process.env.KERNEL_WSPORT || 4000);
  sio.connect_client('ws://localhost:'+port, 
    function(connection) {
      if (connection) {
        let name = registry.get_property('NAME');
        global.message_router.register_target('CORE',
          function(msg) {
            sio.send_message(connection, msg);
          }
        );

        let msg = mutil.make_message('CORE', 'register', {name:name});

        sio.send_message(connection, msg);
        ws_receive_message(connection);
      }
      else {
        global.message_router.unregister_target('CORE');
        cleanup();
        process.exit();
      }
    }
  );
}

function web_server() {
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.use('/', express.static('.'));

  let server = app.listen(0,
    function () {
      let sport = server.address().port;
      registry.set_property('HTTP_PORT', sport);
      console.error(`web server ${sport}`);
    }
  );
}

registry.set_property('NAME', 'LAUNCHER');
registry.set_property('BASE_DIR', process.cwd());

process.on('SIGINT', function() {
  cleanup();
  process.exit();
});

/* main */

global.message_router = new router.MessageRouter('LAUNCHER', commands);

io_client();
ws_client();
web_server();
