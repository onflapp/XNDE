function parse_message(line) {
  let i = line.indexOf(':');
  if (i == -1) {
    return null;
  }
  else {
    let rv = {};
    rv.target = line.substr(0, i);
    rv.options = JSON.parse(unescape(line.substr(i+1)));

    return rv;
  }
}

function make_message(target, options) {
  let l = target+':'+escape(JSON.stringify(options?options:{}));
  return l;
}

exports.make_message = make_message;
exports.parse_message = parse_message;

exports.send_message = function(stream, target, options) {
  let l = make_message(target, options);
  stream.write(l+'\n');
};

exports.receive_messages = function(stream, func) {
  let line = '';

  stream.on('data', function(chunk) {
    let str = chunk;
    if (typeof str != 'string') str = chunk.toString();

    let i = str.indexOf('\n');
    if (i != -1) {
      line += str.substr(0, i);
      let msg = parse_message(line);
      if (msg && func) func(msg);
      else {
        console.log(line);
      }
      line = '';
    }
    else {
      line += str;
    }
  });
};

