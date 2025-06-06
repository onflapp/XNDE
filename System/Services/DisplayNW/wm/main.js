var x11 = require('x11/lib');
var EventEmitter = require('events').EventEmitter;

var X, root, white;
var frames = {};

async function Initialize() {
	X.atoms.WM_PROTOCOLS = await GetAtom("WM_PROTOCOLS");
	X.atoms.WM_CLASS = await GetAtom("WM_CLASS");
	X.atoms.WM_DELETE_WINDOW = await GetAtom("WM_DELETE_WINDOW");
}

function MoveAll(xoff) {
	for (var fid in frames) {
		var f = frames[fid];
			winX = f.x + xoff;
			X.MoveWindow(fid, winX, f.y);
			f.x = winX;
	}
}

function CloseWindow(fid) {
	var f = frames[fid];

  var eventData = new Buffer(32);
  eventData.writeInt8(33, 0);                       //Event Type 33 = ClientMessage
  eventData.writeInt8(32,  1);                      //Format
  eventData.writeInt32LE(f.wid, 4);                 //Window ID
  eventData.writeInt32LE(X.atoms.WM_PROTOCOLS, 8);  //Message Type
  eventData.writeInt32LE(X.atoms.WM_DELETE_WINDOW, 12); 
	
  X.SendEvent(f.wid, false, 0, eventData);
}

function RestoreFrames() {
	for (var fid in frames) {
		var f = frames[fid];
		X.ReparentWindow(f.wid, root, f.x, f.y);
	}
	var frames = {};
}

async function GetWindowProtocols(wid) {
	return new Promise(function (resolve) {
		X.GetProperty(0, wid, X.atoms.WM_PROTOCOLS, 0, 0, 10000000, function(err, prop) {
			var numAtoms = prop.data.length/4;
			var res = [];
			for (var i=0; i < prop.data.length; i+=4) {
				var a = prop.data.unpack('L', i)[0];
				X.GetAtomName(a, function(err, str) {
					res.push(str);
					if (res.length === numAtoms) {
						resolve(res);
						return;
					}
				});
			}
			resolve(res);
		});
	});
}

function GetAtom(name) {
	return new Promise(function (resolve) {
		X.InternAtom(false, name, function(err, atom) {
      resolve(atom);
    });
	});
}

function GetWindowInfo(wid) {
	return new Promise(function (resolve) {
		X.GetProperty(0, wid, X.atoms.WM_CLASS, X.atoms.STRING, 0, 10000000, function(err, prop) {
			if (prop.type == X.atoms.STRING) {
				resolve(prop.data.toString());
			}
			else {
				resolve(null);
			}
		});
	});
}

function GetWindowAttributes(wid) {
	return new Promise(function (resolve) {
  	X.GetWindowAttributes(wid, function(err, attrs) {
		  if (attrs[8]) { // override-redirect flag
			  console.log("don't manage");
				X.MapWindow(wid);
        resolve(null);
	  	}
      else {
        resolve(attrs);
      }
    });
  });
}

function GetWindowGeometry(wid) {
  return new Promise(function(resolve) {
    X.GetGeometry(wid, function(err, clientGeom) {
      resolve(clientGeom);
    });
  });
}

function HandleFrameEvents(ev) {
	try {
		console.log('xxxxxx:'+JSON.stringify(ev));
		var frame = findFrameForWID(ev.wid);
		if (ev.type === 18) { // UnMapNotify
			frame.win.close();
		}
	}
	catch (ex) {
		console.log(ex);
	}
}

function HandleRootEvents(ev) {
	try {
		console.log(':'+ev.type);
		if (ev.type === 20) {       // MapRequest
			if (!frames[ev.wid]) {
				ManageWindow(ev.wid, false);
			}
			return;
		} 
		else if (ev.type === 23) { // ConfigureRequest
			X.ResizeWindow(ev.wid, ev.width, ev.height);
			X.MoveWindow(ev.wid, ev.x, ev.y);
		}
		else if (ev.type === 12) { // expose
		}
		else if (ev.type === 2) { // KeyDown
		}
		else if (ev.type === 4) { // Button
		}
		else if (ev.type === 17) { // DestroyNotify
			console.log('DESTROY');
			for (var fid in frames) {
				var f = frames[fid];
				if (f.wid == ev.wid) {
					X.DestroyWindow(fid);
					delete frames[fid];
					return;
				}
			}
		}
	}
	catch (ex) {
		console.log(ex);
	}
}

function allocNewFrame(fid) {
	frames[fid] = {
		fid: fid,
		wid: null
	};
}

function findNewFrame() {
	for (var fid in frames) {
		var f = frames[fid];
		if (!f.wid) return f;
	}
	return null;
}

function findFrameForWID(wid) {
	for (var fid in frames) {
		var f = frames[fid];
		if (f.wid == wid) return f;
	}
	return null;
}


function CreateWMFrame(wid) {
	nw.Window.open('wm/index.html', {}, function(win) {
		var frame = findNewFrame();
		if (!frame) {
			console.log('NO NEW FRAME FOUND!!!!');
			return;
		}

		frame.wid = wid;
		frame.win = win;
		X.ChangeSaveSet(1, wid);

		var ee = new EventEmitter();
		X.event_consumers[wid] = ee;
		ee.on('event', HandleFrameEvents);

		X.ResizeWindow(wid, 300, 300);
		X.ReparentWindow(wid, frame.fid, 10, 10);
		console.log("MapWindow "+wid+"->"+frame.fid);
		X.MapWindow(frame.fid);
		X.MapWindow(wid);

	});
}

async function ManageWindow(wid, preserve) {
	console.log("MANAGE WINDOW: " + wid + ",preserve:" + preserve);
	var attrs = await GetWindowAttributes(wid);
	if (attrs == null) {
		cosole.log("no attributes");
		return;
	}

	var clazz = await GetWindowInfo(wid);
	if (clazz && clazz.startsWith('XXXyyy')) {
		allocNewFrame(wid);
		console.log('do not manage, allocate new frame');
		return;
	}

	var clientRect = await GetWindowGeometry(wid);
	var windowRect = {};

  var protos = await GetWindowProtocols(wid);
	console.log(protos);

	if (preserve && attrs.mapState != 2) { //not mapped
		console.log("not mapped");
		return;
	}

	if (attrs.klass == 2) { //input only window
		console.log("input only");
		return;
	}

	if (preserve) {
		windowRect.xPos = clientRect.xPos;
		windowRect.yPos = clientRect.yPos;
	}
	else {
		windowRect.xPos = parseInt(Math.random()*300);
		windowRect.yPos = parseInt(Math.random()*300);
	}

	CreateWMFrame(wid);

//var ee = new EventEmitter();
// X.event_consumers[fid] = ee;

	//X.GrabKey(wid, 0, 64, 46, 1, 1);
	//X.GrabButton(wid, 0, 0, 1, 1, 0, 0, 0);
}

function StartWM() {
	var client = x11.createClient(function(err, display) {
		X = display.client;

		X.require('render', function(err, Render) {
			X.Render = Render;

			root = display.screen[0].root;
			white = display.screen[0].white_pixel;
    	black = display.screen[0].black_pixel;
			console.log('root = ' + root);

			var events = x11.eventMask.SubstructureRedirect;

			X.ChangeWindowAttributes(root, {eventMask:events}, function(err) {
				if (err.error == 10) {
					console.error('Error: another window manager already running.');
					process.exit(1);
				}

			});

			Initialize();
		});
	});

	client.on('error', function(err) {
		console.error(err);
	});

	client.on('event', HandleRootEvents);

	process.on('SIGINT', function() {
		RestoreFrames();
		process.exit(0);
	});
}

exports.start_process = StartWM;
