
function parse_message(line) {
  if (line.indexOf("/dispatch?") == 0) {
    let q = require('url').parse(line, true);
    if (q && q.query) return q.query;
    else return null;
  }
  else {
    return null;
  }
}

function receive_message(proc, func) {
  let sin = (proc == process)?proc.stdin:proc.stdout;
  let sout = (proc == process)?proc.stdout:proc.stdin;
  let line = '';

  sin.setEncoding('utf8');

  sin.on('data', function(chunk) {
    let str = chunk;
    if (typeof str != 'string') str = chunk.toString();

    let i = str.indexOf('\n');
    if (i != -1) {
      line += str.substr(0, i);
      let msg = parse_message(line);
      if (msg) {
        func(msg);
      }
      else {
        console.error(line);
      }
      line = '';
    }
    else {
      line += str;
    }
  });

  sin.resume();
}

exports.receive_message = receive_message;
