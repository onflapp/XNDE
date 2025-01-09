const proc = require('child_process');
const fs = require('fs');
const handler = require('./handler.js');

let applications = {};

function exec_web_proc(path, main, cb_ack) {
  const base = reg.get_property('BASE_DIR');
  const port = reg.get_property('HTTP_PORT');

  let u = 'http://localhost:'+port+'/'+path+'/'+ main;
  let msg = {
    target:'DISPLAY',
    command:'create_window',
    options:{
      url:u
    }
  };

  global.route_message(msg, null);
  cb_ack();
}

function exec_node_proc(path, main, cb) {
  let app = applications[path];
  if (!app) {
    app = proc.spawn('node', [main], {
      cwd:path
    });

    app.stderr.on('data', function(data) {
      console.error(data);
    });

    handler.receive_message(app, cb);

    app.on('close', function(code) {
      delete applications[path];
      console.error(`node process exited with code ${code}`);
    });

    applications[path] = app;
  }
  else {
    console.error(`running already ${path}`);
  }
}

function app_package_info(path) {

  try {
    let data = fs.readFileSync(path+'/package.json', 'utf8');
    let pack = JSON.parse(data);

    return pack;
  }
  catch(ex) {
    console.error(ex);
    return null;
  }
}

function launch_app(path, cb) {
  let pack = app_package_info(path);
  if (pack) {
    if (pack['scripts'] && pack['scripts']['start']) {
      let start = pack['scripts']['start'];
    }
    else if (pack['main']) {
      let main = pack['main'];
      if (main.match('\.js$')) {
        exec_node_proc(path, main, cb);
      }
      else if (main.match('\.html$')) {
        exec_web_proc(path, main, cb);
      }
    }
    else {
    }
  }
  else {
    console.log('invalid app file');
  }
}

exports.launch_app = launch_app;
