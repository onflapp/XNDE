if (typeof require != 'undefined') {
  const mutils = require('./messages.js');
}

class MessageRouter {
  targets = {};
  commands = {};
  callbacks = {};
  myname = '';

  constructor(name, cmds) {
    this.myname = name;
    this.commands = cmds;
  }

  lookup_target(name) {
    return this.targets[name];
  }

  exec_func(func, msg, cb) {
    let that = this;
    func(msg.options, function(rv) {
      if (rv) {
        if (msg.no) {
          console.error('calling back '+msg.no);
          rv.no = msg.no;
        }
        
        cb(rv);
      }
      else {
        cb();
      }
    });
  }

  register_target(name, cb) {
    console.error(`register target ${name}`);
    this.targets[name] = cb;
  }

  is_my_name(name) {
    if (name == '.' || name == this.myname) return true;
    else return false;
  }

  unregister_target(name) {
    delete this.targets[name];
  }

  register_callback(msg, cb) {
    if (!msg.no) return false;

    console.error('register callback '+msg.no);
    this.callbacks[''+msg.no] = cb;

    return true;
  }

  route(msg, cb) {
    if (!msg) {
      console.error('message is null!');
      if(cb)cb();
    }

    let command = msg.command;
    let target = msg.target;

    if (command == 'ack') {
      console.error('ack');
      console.error(msg);
      if (msg.no) {
        let t = ''+msg.no;
        let f = this.callbacks[t];
        if (f) {
          f(msg);
          console.error('called back');
          delete this.callbacks[t];
        }
        else {
          console.error('call back not found '+t);
        }
      }

      cb(null);
      return;
    }
    if (command == 'register') {
      let name = msg.options.name;
      this.register_target(msg.options.name, cb);
      if (this.is_my_name(target)) {
        cb(mutils.make_ack());
        return;
      }
    }
    if (msg.command == 'unregister') {
      let name = msg.options.name;
      this.unregister_target(msg.options.name, cb);
      if (this.is_my_name(target)) {
        cb(mutils.make_ack());
        return;
      }
    }

    if (this.is_my_name(target)) {
      let cmd = command;
      let func = this.commands[cmd];
      if (func) {
        try {
          this.exec_func(func, msg, cb);
          return;
        }
        catch(ex) {
          console.error(ex);
        }
      }
      else {
        console.error(`command ${cmd} not found`);
      }
    }
    else {
      let name = target;
      let xb = this.lookup_target(name);
      if (xb) {
        if (this.register_callback(msg, cb)) {
          console.error(`rerouting message to ${name}, await callback`);
          console.log(msg);
          xb(msg);
          return;
        }
        else {
          console.error(`rerouting message to ${name}`);
          xb(msg);
        }
      }
      else {
        console.error(`target ${name} not found`);
      }
    }

    console.log(msg);
    if(cb) cb();
  }
}

if (typeof exports != 'undefined') {
  exports.MessageRouter = MessageRouter;
}
