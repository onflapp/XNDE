function route_message(msg, proc) {
  const services = require('./services.js');
  const utils = require('../utils.js');

  console.log(msg);

  let ser = services.get_service(msg.target);
  if (ser) {
    utils.send_message(ser.stdin, msg.target, msg.options);
  }
  else if (msg.target == 'services') {
    if (msg.options.cmd == 'register') {
      proc.service_name = msg.options.name;
      services.register_service(proc.service_name, proc);
    }
  }
  else {
    console.log('unknown target '+msg.target);
  }
}

function exec_web_proc(path, main) {
  const reg = require('./registry.js');
  const base = reg.get_property('BASE_DIR');
  const base_url = reg.get_property('BASE_URL');
  
  let u = base_url + path.substr(base.length) + '/' + main;
  route_message({
    target:'DISPLAY', 
    options:{
      cmd:'show',
      url:u
    }
  });
}

function exec_node_proc(path, main) {
  const utils = require('../utils.js');
  const proc = require('child_process');

  let app = proc.spawn('node', [main], {
    cwd:path
  });

  utils.receive_messages(app.stdout, function(msg) {
    route_message(msg, app);
  });

  app.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  app.on('close', (code) => {
    services.unregister_service(app.service_name);
    console.log(`node process exited with code ${ code }`);
  });
}


function app_package_info(path) {
  const fs = require('fs');

  let data = fs.readFileSync(path+'/package.json', 'utf8');
  let pack = JSON.parse(data);

  return pack;
}

exports.launch_app = function(path) {
  const reg = require('./registry.js');

  let pack = app_package_info(path);
  if (pack) {
    if (pack['scripts'] && pack['scripts']['start']) {
      let start = pack['scripts']['start'];
    }
    else if (pack['main']) {
      let main = pack['main'];
      if (main.match('\.js$')) {
        exec_node_proc(path, main);
      }
      else if (main.match('\.html$')) {
        exec_web_proc(path, main);
      }
    }
    else {
    }
  }
  else {
    console.log('invalid app file');
  }
};
