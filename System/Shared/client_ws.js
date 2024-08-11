const mutil = require('./messages.js');

function send_message(connection, target, command, options) {
  let l = mutil.make_message(target, command, options);
  if (l) {
    connection.sendUTF(l);
  }
  else {
    console.error('invalid message format');
  }
};

function receive_message(connection, func) {
  connection.on('error', 
    function(error) {
      console.error("Connection Error: " + error.toString());
      func(null);
    }
  );

  connection.on('close', 
    function() {
      console.error('connection closed');
      func(null);
    }
  );

  connection.on('message', 
    function(message) {
      if (message.type === 'utf8') {
        let line = message.utf8Data;
        let msg = mutil.parse_message(line);
        if (msg && func) func(msg);
        else {
          console.error(line);
        }
      }
    }
  );
}

function connect_client(url, func) {
  const WebSocketClient = require('websocket').client;

  let wsClient = new WebSocketClient();

  wsClient.on('connectFailed', 
    function(error) {
      console.error('connect error: '+error.toString());
      process.exit(1);
    }
  );

  wsClient.on('connect', 
    function(connection) {
      func(connection);
    }
  );

  wsClient.connect(url);
}

if (typeof exports != 'undefined') {
  exports.send_message = send_message;
  exports.receive_message = receive_message;
  exports.connect_client = connect_client;
}
