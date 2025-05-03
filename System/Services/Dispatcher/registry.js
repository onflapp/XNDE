function get_shared_instance () {
  const sharedname = '__shared_registry_instance';
  if (!global[sharedname]) {
    global[sharedname] = {
      properties:{},
      objects:{}
    };
  }
  return global[sharedname];
}

function get_property(name) {
  let reg = get_shared_instance();
  return reg.properties[name];
}

function set_property(name, val) {
  let reg = get_shared_instance();
  reg.properties[name] = val;
}

function get_object(name) {
  let reg = get_shared_instance();
  return reg.objects[name];
}

function set_object(name, val) {
  let reg = get_shared_instance();
  reg.objects[name] = val;
}

function remove_all_objects(val) {
  let reg = get_shared_instance();
  for (let n in reg.objects) {
    let c = reg.objects[n];
    if (c === val) {
      delete reg.objects[n];
    }
  }
}

function get_all_objects() {
  let reg = get_shared_instance();
  let rv = [];
  for (let n in reg.objects) {
    let c = reg.objects[n];
    rv.push(c);
  }
  return rv;
}

function get_all_object_names() {
  let reg = get_shared_instance();
  let rv = [];
  for (let n in reg.objects) {
    rv.push(n);
  }
  return rv;
}

exports.set_property = set_property;
exports.get_property = get_property;
exports.set_object = set_object;
exports.get_object = get_object;
exports.remove_all_objects = remove_all_objects;
exports.get_all_objects = get_all_objects;
exports.get_all_object_names = get_all_object_names;
