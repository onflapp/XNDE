const mutil = require('shared/messages.js');
const proc = require('child_process');
const WebSocketServer = require('websocket').server;
const http = require('http');
const router = require('shared/router');

CONNECTIONS = {};
CHROME_APP = null;

/*
 * send to the web browser view
 */

function ws_send(line) {
  for (let key in CONNECTIONS) {
    let connection = CONNECTIONS[key];
    connection.send(line); // => browser view
  }
}

function ws_server(cb) {
  let server = http.createServer();
  let wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', 
    function(request) {
      console.error('new display connection');
      let msg = mutil.make_message('CORE', 'register', {name:'DISPLAY'});
      console.log(mutil.encode_message(msg)); // => the launcher

      let connection = request.accept(null, request.origin);
      CONNECTIONS[connection] = connection;

      connection.on('message', function(message) { // <= browser view
        let str = message.utf8Data;
        console.log(str);
      });

      connection.on('close', function(reasonCode, description) {
        delete CONNECTIONS[connection];
        console.log('end connection');
      });
    }
  );

  let port = (process.env.DISPLAYSERVER_PORT || 6001);
  server.listen(port, 
    function() {
      cb(server);
    }
  );
}

/*
 * receive messages from the launcher
 */

function io_client() {
  const cio = require('shared/client_io.js');

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  cio.receive_message(process,
    function(msg, cb) {
      ws_send(mutil.encode_message(msg)); // => browser view
    }
  );
}

function chrome_app(wport) {
  console.error(`start chrome process ${__dirname} ${wport}`)
  let app = proc.spawn('./start_chrome.sh', [`/tmp/${wport}.pid`], {
    cwd:__dirname
  });
  return app;
}

process.on('SIGINT',
  function() {
    if (CHROME_APP) CHROME_APP.kill('SIGINT');
    process.exit();
  }
);

ws_server(
  function(ws) {
    let wport = ws.address().port;

    console.error(`Display.service - port ${wport}`);

    CHROME_APP = chrome_app(wport);
  }
);

io_client();
