const mutil = require('./messages.js');

function send_message(stream, target, command, options) {
  let l = mutil.make_message(target, command, options);
  stream.write(l+'\n');
}

function receive_message(stream, func) {
  let line = '';

  stream.on('data', 
    function(chunk) {
      let str = chunk;
      if (typeof str != 'string') str = chunk.toString();

      let i = str.indexOf('\n');
      if (i != -1) {
        line += str.substr(0, i);
        let msg = mutil.parse_message(line);
        if (msg && func) func(msg);
        else {
          console.error(line);
        }
        line = '';
      }
      else {
        line += str;
      }
    }
  );
}

if (typeof exports != 'undefined') {
  exports.send_message = send_message;
  exports.receive_message = receive_message;
}
