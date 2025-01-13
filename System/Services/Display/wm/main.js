var x11 = require('x11/lib');
var EventEmitter = require('events').EventEmitter;

var X, root, white;

var FRAME_TITLE = 20;
var FRAME_BORDER = 10;

var frames = {};
var dragStart = null;

async function Initialize() {
	X.atoms.WM_PROTOCOLS = await GetAtom("WM_PROTOCOLS");
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
					if (res.length === numAtoms) resolve(res);
				});
			}
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

function HandleRootEvents(ev) {
	try {
		//console.log(ev);
		if (ev.type === 20) {       // MapRequest
			if (!frames[ev.wid]) {
				ManageWindow(ev.wid);
			}
			return;
		} 
		else if (ev.type === 23) { // ConfigureRequest
			X.ResizeWindow(ev.wid, ev.width, ev.height);
		}
		else if (ev.type === 12) { // expose
		}
		else if (ev.type === 2) { // KeyDown
		}
		else if (ev.type === 4) { // Button
			//console.log(ev);
			if (ev.keycode == 6)      MoveAll(1);
			else if (ev.keycode == 7) MoveAll(-1);
		}
		else if (ev.type === 17) { // DestroyNotify
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

function HandleFrameEvents(ev) {
	try {
		//console.log(ev);
		var f = frames[ev.wid];
		if (ev.type == 4) { // MouseDown
			X.RaiseWindow(ev.wid);
			X.SetInputFocus(f.wid, 1);
			dragStart = { 
				rootx: ev.rootx, rooty: ev.rooty, 
				x: ev.x, y: ev.y, 
				winX: f.x, winY: f.y,
				winW: f.width, winH: f.height
			};

			if (ev.y > FRAME_TITLE && ev.x > FRAME_BORDER) dragStart.resize = true;
			else if (ev.y < FRAME_TITLE && ev.x < FRAME_TITLE) {
        CloseWindow(f.fid);
      }
			else dragStart.move = true;
		} 
		else if (ev.type == 5) {
			dragStart = null;
		} 
		else if (ev.type == 6) { // Mouse Up
			if (dragStart && dragStart.move) {
							winX = dragStart.winX + ev.rootx - dragStart.rootx;
							winY = dragStart.winY + ev.rooty - dragStart.rooty;
							X.MoveWindow(f.fid, winX, winY);
							f.x = winX;
							f.y = winY;
			}
			else if (dragStart && dragStart.resize) {
				//resize frame window
				winW = dragStart.winW + ev.rootx - dragStart.rootx;
				winH = dragStart.winH + ev.rooty - dragStart.rooty;
				X.ResizeWindow(ev.wid, winW, winH);

				f.width = winW;
				f.height = winH;

				//resize inner window
				winW = winW - (FRAME_BORDER * 2);
				winH = winH - FRAME_TITLE - FRAME_BORDER;
				X.ResizeWindow(f.wid, winW, winH);
			}
		} 
		else if (ev.type == 12) { //expose
		}
	}
	catch (ex) {
		console.log(ex);
	}
}

async function ManageWindow(wid) {
	console.log("MANAGE WINDOW: " + wid);
	var attrs = await GetWindowAttributes(wid);

  var pos = {};
	var fid = X.AllocID();
	var winX, winY;
	winX = parseInt(Math.random()*300);
	winY = parseInt(Math.random()*300);

	frames[fid] = {
		wid:wid,
		fid:fid,
		x:winX,
		y:winY
	};

	var clientGeom = await GetWindowGeometry(wid);
  console.log("window geometry: ", clientGeom);

  var protos = await GetWindowProtocols(wid);
	console.log(protos);

	var width = clientGeom.width + (FRAME_BORDER * 2);
	var height = clientGeom.height + FRAME_TITLE + FRAME_BORDER;
	var events = x11.eventMask.Button1Motion
			    |x11.eventMask.ButtonPress
			    |x11.eventMask.ButtonRelease
			    |x11.eventMask.SubstructureNotify
			    |x11.eventMask.SubstructureRedirect
			    |x11.eventMask.Exposure;

	console.log("CreateWindow", fid, root, winX, winY, width, height);
	X.CreateWindow(fid, root, winX, winY, width, height, 
			0, 0, 0, 0,
			{ backgroundPixel: white, eventMask: events });

	frames[fid].width = width;
	frames[fid].height = height;
	frames[fid].protocols = protos;

	var ee = new EventEmitter();
	X.event_consumers[fid] = ee;
	ee.on('event', HandleFrameEvents);

	X.ChangeSaveSet(1, wid);
	X.ReparentWindow(wid, fid, FRAME_BORDER, FRAME_TITLE);
	console.log("MapWindow", fid);
	X.MapWindow(fid);
	X.MapWindow(wid);

	X.GrabKey(wid, 0, 64, 46, 1, 1);
	//X.GrabButton(wid, 0, 0, 1, 1, 0, 0, 0);
}

function StartWM() {
	var client = x11.createClient(function(err, display) {
		X = display.client;
		X.require('render', function(err, Render) {
			X.Render = Render;

			root = display.screen[0].root;
			white = display.screen[0].white_pixel;
			console.log('root = ' + root);

			var events = x11.eventMask.Exposure
						|x11.eventMask.ButtonPress
						|x11.eventMask.SubstructureRedirect;

			X.ChangeWindowAttributes(root, {eventMask:events}, function(err) {
				if (err.error == 10) {
					console.error('Error: another window manager already running.');
					process.exit(1);
				}

			});

			Initialize();

			X.QueryTree(root, function(err, tree) {
				tree.children.forEach(ManageWindow);
			});
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
