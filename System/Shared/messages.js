function parse_message(line) {
  let i = line.indexOf(':');
  if (i == -1) {
    console.error('invalid message format');
    return null;
  }
  else {
    let rv = {};
    let command = '';
    let target = line.substr(0, i);
    let payload = line.substr(i+1);
    i = payload.indexOf(':');

    if (i == -1) {
      command = target;
      target = '.';
    }
    else {
      command = payload.substr(0, i);
      payload = payload.substr(i+1);
    }

    rv.target = target;
    rv.command = command;

    try {
      if (payload && payload.length > 0) {
        rv.options = JSON.parse(unescape(payload));
      }
    }
    catch(ex) {
      console.error(`invalid message format [${line}]`);
      console.error(ex);
      return null;
    }

    return rv;
  }
}

function make_message(target, command, options) {
  let l = target+':'+command+':'+escape(JSON.stringify(options?options:{}));
  return l;
}

if (typeof exports != 'undefined') {
  exports.make_message = make_message;
  exports.parse_message = parse_message;
  exports.dispatch_message = dispatch_message;
}

function dispatch_message(message, handlers) {
  if (!message || !handlers) {
    return;
  }

  let func = handlers[message.command];
  if (func) {
    func(message.options);
  }
  else {
    console.error(`message handler for [${message.command}] not found`);
  }
}
