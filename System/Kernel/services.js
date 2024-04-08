function get_shared_instance () {
  const sharedname = '__shared_services_instance';
  if (!global[sharedname]) {
    global[sharedname] = {};
  }
  return global[sharedname];
}

exports.register_service = function(name, service) {
  if (!name) return;

  let reg = get_shared_instance();
  reg[name] = service;
};

exports.unregister_service = function(name) {
  if (!name) return;

  let reg = get_shared_instance();
  delete reg[name];
};

exports.get_service = function(name) {
  let reg = get_shared_instance();
  return reg[name];
};
