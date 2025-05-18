let modules = {};
let modules_path = __dirname;

function init_module(name, opts, cb) {
  try {
    let path = `${modules_path}/modules/${name}.js`;

    let mod = require(path);
    mod.init(opts, function(mod, name) {
      if (mod && name) {
        modules[name] = mod;
        mod.source_path = path;
        cb(mod, name);
      }
      else {
        cb();
      }
    });
  }
  catch(ex) {
    console.error(ex);
    console.error(`error loading ${name}`);
  }
}

function stop_modules() {
  try {
    for (let k in modules) {
      let mod = modules[k];
      mod.stop();

      if (mod['source_path']) {
        decache(mod.source_path);
      }
    }
  }
  catch(ex) {
    console.error(ex);
  }
}

function lookup_module(name) {
  let mod = modules[name];
  return mod;
}

exports.setModulesPath = function(path) { modules_path = path };
exports.init = init_module;
exports.lookup = lookup_module;
