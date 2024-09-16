const mutil = require('./messages.js');

function send_message(stream, msg) {
  let l = mutil.make_message(msg);
  stream.write(l+'\n');
}

function receive_message(proc, func) {
  let sin = (proc == process)?proc.stdin:proc.stdout;
  let sout = (proc == process)?proc.stdout:proc.stdin;
  let line = '';

  sin.setEncoding('utf8');

  sin.on('data', 
    function(chunk) {
      let str = chunk;
      if (typeof str != 'string') str = chunk.toString();

      let i = str.indexOf('\n');
      if (i != -1) {
        line += str.substr(0, i);
        let msg = mutil.parse_message(line);
        if (msg && func) {
          func(msg,
            function(rv) {
              if (rv) {
                let s = mutil.encode_message(rv)+'\n';
                sout.write(s);
              }
            }
          );
        }
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

  sin.resume();
}

if (typeof exports != 'undefined') {
  exports.send_message = send_message;
  exports.receive_message = receive_message;
}
