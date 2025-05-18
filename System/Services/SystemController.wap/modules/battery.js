const dbus = require('dbus-next');
const bus = dbus.systemBus();

let obj, power, properties;

function dbus_battery(opts, cb) {
  let self = this;
  bus.getProxyObject('org.freedesktop.UPower', '/org/freedesktop/UPower/devices/DisplayDevice').then(function(obj) {
    power = obj.getInterface('org.freedesktop.UPower.Device');
    properties = obj.getInterface('org.freedesktop.DBus.Properties');

    console.log("connect battery to DBUS");
    cb(self, "BATTERY");
  });
}

function get_values(data) {
  let rv = {};
  rv['capacity'] = ''+data['Percentage'].value;
  return rv;
}

function handle_message(msg, cb) {
  if (msg.command == "status") {
    properties.GetAll('org.freedesktop.UPower.Device').then(function(rv) {
      cb(get_values(rv));
    });
  }
  else {
    cb();
  }
}

exports.init = dbus_battery;
exports.dispatch = handle_message;
