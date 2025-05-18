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

function init_module(opts, cb) {
  const base = opts.path;
  const path = require('path');
  const fs = require('fs');

  let handler = {
    handle_request:function(rpath, req, res) {
      let fullPath = rpath;

      if (fullPath == '/') fullPath = base;
      else fullPath = path.resolve(base, './'+rpath);

      try {
        let entity = fs.lstatSync(fullPath);
        entity.name = path.basename(fullPath);

        if (entity.isDirectory()) {
          let ls = list_dir(fullPath).sort(function(a, b) { return (a.name > b.name) });

          if (req.accepts('text/html')) {
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            let rv = [];

            rv.push('<!DOCTYPE html><html><head><title>'+req.path+'</title></head><body>');
            rv.push('<ul>');

            let = dir = path.resolve(fullPath, '..');
            rv.push('<li><a href="..">../</a></li>');

            for (let i = 0; i < ls.length; i++) {
              let it = ls[i];
              let p = req.path;
              let n = it.name;

              if (!p.endsWith('/')) p += '/';
              p += escape(it.name);
              if (it.type == 'd') {
                p += '/';
                n += '/';
              }

              rv.push('<li><a href="'+p+'">'+n+'</a></li>');
            }
            rv.push('</ul>');
            rv.push('</body></html>');
            res.end(rv.join(''));
          }
          else {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify(ls));
          }
        }
        else if (entity.isFile()) {
          res.sendFile(fullPath);
        }
        else {
          res.setHeader('Content-Type', 'text/html');
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
  };

  cb(handler, opts.prefix);
}

exports.init = init_module;
