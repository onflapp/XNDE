const mutil = require('shared/messages');
const registry= require('shared/registry');
const launcher= require('./launcher.js');

function route_message(msg, ctx) {
  const sio = require('shared/client_ws');
  const cio = require('shared/client_io');

  console.error(msg);

  if (msg.command == 'register' && ctx) {
    registry.set_object(msg.options.name, ctx);

    let con = registry.get_object('KERNEL');
    sio.send_message(con, msg.target, msg.command, msg.options);
  }
  else if (msg.command == 'unregister') {
  }
  else if (msg.command == 'launch') {
    let path = msg.options;
    if (msg.options.url) path = msg.options.url;

    launcher.launch_app(path);
  }
  else {
    console.error(`look up [${msg.target}]`);
    let app = registry.get_object(msg.target);
    if (app) {
      cio.send_message(app.stdin, msg.target, msg.command, msg.options);
    }
    else {
      console.error('target not found!');
    }
  }
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

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  cio.receive_message(process.stdin, 
    function(msg) {
      route_message(msg, null);
    }
  );
}

function ws_receive_message(connection) {
  const sio = require('shared/client_ws');
  sio.receive_message(connection, 
    function(msg) {
      if (msg) {
        route_message(msg, null);
      }
      else {
        cleanup();
        process.exit(1);
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
        registry.set_object('KERNEL', connection);

        sio.send_message(connection, 'SERVICES', 'register', {name:name});
        ws_receive_message(connection);
      }
      else {
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

global.route_message = route_message;

registry.set_property('NAME', 'LAUNCHER');
registry.set_property('BASE_DIR', process.cwd());

process.on('SIGINT', function() {
  cleanup();
  process.exit();
});

io_client();
ws_client();
web_server();
