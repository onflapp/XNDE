const proc = require('child_process');
const fs = require('fs');
const handler = require('./handler.js');

let applications = {};

function exec_web_proc(path, main, cb) {
  cb({
    name:"DISPLAY",
    command:"show",
    url:"http://localhost:"+global.WPORT+"/"+path+"/"+main
  });
}

function exec_node_proc(path, main, cb) {
  let app = applications[path];
  if (!app) {
    app = proc.spawn('node', [main], {
      cwd:path
    });

    app.stderr.on('data', function(data) {
      console.error(data.toString());
    });

    handler.receive_message(app, cb);

    app.on('close', function(code) {
      delete applications[path];
      console.error(`node process exited with code ${code}`);
    });

    applications[path] = app;
  }
  else {
    app.stdin.write("/dispatch?command=reopen");
  }
}

function exec_shell_proc(path, main, cb) {
  let app = applications[path];
  let dir = process.cwd()+'/'+path;
  if (!app) {
    app = proc.spawn(dir+'/'+main, [], {
      cwd:dir
    });

    app.stderr.on('data', function(data) {
      console.error(data.toString());
    });

    handler.receive_message(app, cb);

    app.on('close', function(code) {
      delete applications[path];
      console.error(`node process exited with code ${code}`);
    });

    applications[path] = app;
  }
  else {
    app.stdin.write("/dispatch?command=reopen");
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
      else if (main.match('\.sh$')) {
        exec_shell_proc(path, main, cb);
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
