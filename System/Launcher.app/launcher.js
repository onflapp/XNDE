function exec_web_proc(path, main) {
  const reg = require('shared/registry');
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

  global.route_message(msg);
}

function exec_node_proc(path, main) {
  const mutil = require('shared/messages');
  const cio = require('shared/client_io');
  const registry = require('shared/registry');
  const proc = require('child_process');

  let app = registry.get_object(path);
  if (app) {
    console.error('exists already');
    cio.send_message(app.stdin, '.', 'reactivate');
  }
  else {
    app = proc.spawn('node', [main], {
      cwd:path
    });

    registry.set_object(path, app);

    cio.receive_message(app.stdout, 
      function(msg) {
        global.route_message(msg, app); 
      }
    );

    app.stderr.on('data',
      function(data) {
        console.log(`stderr: ${data}`);
      }
    );

    app.on('close',
      function(code) {
        registry.remove_all_objects(app);
        console.log(`node process exited with code ${code}`);
      }
    );
  }
}

function app_package_info(path) {
  const fs = require('fs');

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

function launch_app(path) {
  const reg = require('shared/registry');

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
}

exports.launch_app = launch_app;
