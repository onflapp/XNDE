function get_shared_instance () {
  const sharedname = '__shared_registry_instance';
  if (!global[sharedname]) {
    global[sharedname] = {};
  }
  return global[sharedname];
}

exports.get_property = function(name) {
  let reg = get_shared_instance();
  return reg[name];
};

exports.set_property = function(name, val) {
  let reg = get_shared_instance();
  return reg[name] = val;
};
