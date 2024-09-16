/*
 * target:command+mod:payload
 * SERVICES:register-sync:{name:'test'}
 * SERVICES:register:{name:'test'}
 */

function parse_message(line) {
  let i = line.indexOf(':');
  if (i == -1) {
    console.error('invalid message format ['+line+']');
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

    i = command.indexOf('-');
    if (i > 0) {
      let t = command.substr(i+1);
      if (t == 'sync') {
        rv.no = (new Date().getTime());
      }
      else {
        try {
          let h = JSON.parse(unescape(t));
          if (h.no) rv.no = h.no;
        }
        catch(ex) { }
      }
      command = command.substr(0, i);
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
  let m = {
    target:target,
    command:command,
  };

  let i = command.indexOf('-');
  if (i > 0) {
    let t = command.substr(i+1);
    if (t == 'sync') {
      m.no = (new Date().getTime());
      m.command = command.substr(0, i);
    }
  }

  if (options) m.options = options;

  return m;
}

function make_ack(options) {
  let m = {
    target:'.',
    command:'ack',
  };
  if (options) m.options = options;

  return m;
}

function encode_message(msg) {
  let l = msg.target+':'+msg.command;
  if (msg.no) {
    l += '-'+escape(JSON.stringify({no:msg.no}));
  }
  l += ':'+escape(JSON.stringify(msg.options?msg.options:{}));
  
  return l;
}

if (typeof exports != 'undefined') {
  exports.make_message = make_message;
  exports.make_ack = make_ack;
  exports.encode_message = encode_message;
  exports.parse_message = parse_message;
}
