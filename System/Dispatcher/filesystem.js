function list_dir(fullPath) {
  const fs = require('fs');

  let dir = fs.opendirSync(fullPath);
  let entity;
  let listing = [];

  while((entity = dir.readSync()) !== null) {
    listing.push(entity_info(entity));
  }

  dir.closeSync();
  return listing;
}

function entity_info(entity) {
  let rv = {};
  
  if (entity.isDirectory()) rv.type = 'd';
  if (entity.isFile()) rv.type = 'f';

  rv.name = entity.name;
  return rv;
}

function handle_file_request(req, res) {
  const reg = require('shared/registry');
  const base = reg.get_property('BASE_DIR');
  const path = require('path');
  const fs = require('fs');

  let fullPath = req.path;
  if (fullPath == '/') fullPath = base;
  else fullPath = base + unescape(req.path);

  console.log(fullPath);

  try {
    let entity = fs.lstatSync(fullPath);
    entity.name = path.basename(fullPath);

    if (entity.isDirectory() && entity.name.endsWith('.app')) {
      //launcher.launch_app(fullPath);

      res.writeHead(200);
      res.end('done');
    }
    else if (entity.isDirectory()) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify(list_dir(fullPath)));
    }
    else if (entity.isFile()) {
      res.sendFile(fullPath);
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify(entity_info(entity)));
    }
  }
  catch(ex) {
    console.error(ex);

    res.writeHead(404);
    res.end('path:' + fullPath + ' not found\n');
  }
}

exports.handle_file_request = handle_file_request;
