var x11 = require('x11/lib');
var EventEmitter = require('events').EventEmitter;

var X, root, white, black, colormap;
var frames = {};

async function initialize() {
	X.atoms.WM_PROTOCOLS = await getAtom("WM_PROTOCOLS");
	X.atoms.WM_DELETE_WINDOW = await getAtom("WM_DELETE_WINDOW");

	x11.ButtonPress = 4;
	x11.ButtonRelease = 5;
	x11.MotionNotify = 6;
	x11.MapRequest = 20;
	x11.ConfigureRequest = 23;
	x11.Expose = 12;
	x11.DestroyNotify = 17;
	x11.UnmapNotify = 18;
}

function makeMouseEvent(ev) {
	return {
		x:ev.x,
		y:ev.y,
		rootx:ev.rootx,
		rooty:ev.rooty
	};
}

function restoreWindows() {
	for (var fid in frames) {
		var f = frames[fid];
		X.ReparentWindow(f.wid, root, f.x, f.y);
	}
	var frames = {};
}

async function getProtocols(wid) {
	return new Promise(function (resolve) {
		X.GetProperty(0, wid, X.atoms.WM_PROTOCOLS, 0, 0, 10000000, function(err, prop) {
			var numAtoms = prop.data.length/4;
			var res = [];
			if (numAtoms > 0) {
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
			}
			else {
				resolve(res);
			}
		});
	});
}

async function getAtom(name) {
	return new Promise(function (resolve) {
		X.InternAtom(false, name, function(err, atom) {
      resolve(atom);
    });
	});
}

async function getAttributes(wid) {
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

function getGeometry(wid) {
  return new Promise(function(resolve) {
    X.GetGeometry(wid, function(err, clientGeom) {
      resolve(clientGeom);
    });
  });
}

function closeWindow(wid) {
  var eventData = new Buffer(32);
  eventData.writeInt8(33, 0);                       //Event Type 33 = ClientMessage
  eventData.writeInt8(32,  1);                      //Format
  eventData.writeInt32LE(wid, 4);                 //Window ID
  eventData.writeInt32LE(X.atoms.WM_PROTOCOLS, 8);  //Message Type
  eventData.writeInt32LE(X.atoms.WM_DELETE_WINDOW, 12); 
	
  X.SendEvent(wid, false, 0, eventData);
}

function handleRootEvents(ev) {
	try {
		if (ev.type == x11.MapRequest) {
			manageWindow(ev.wid, false);
		} 
		else if (ev.type == x11.ConfigureRequest) {
			X.ResizeWindow(ev.wid, ev.width, ev.height);
		}
		else if (ev.type == x11.Expose) {
		}
		else if (ev.type == 2) { // KeyDown
		}
		else if (ev.type == x11.ButtonPress && ev.wid == root) {
			//var events = x11.eventMask.PointerMotion|x11.eventMask.ButtonRelease;
			//X.GrabPointer(root, 0, events, 0, 0, 0, 0, 0); 
		}
		else if (ev.type == x11.ButtonRelease) {
			//X.UngrabPointer(ev.wid, 0);
		}
		else if (ev.type == x11.MotionNotify) {
			//console.log('x:'+ev.wid);
		}
		else if (ev.type == x11.UnmapNotify) {
			destroyFrame(ev.wid);
		}
		else if (ev.type == x11.DestroyNotify) {
			destroyFrame(ev.wid);
		}
		else {
			//console.log(ev);
		}
	}
	catch (ex) {
		console.log(ex);
	}
}

function handleFrameEvents(ev) {
	try {
		var frame = frames[ev.wid];
		if (!frame) {
			console.log('window not managed');
			return;
		}
		if (ev.type == x11.Expose) {
			frame.win.ondraw(frame, X);
		}
		else if (ev.type == x11.ButtonPress) {
			console.log(ev);
			frame.win.onmousedown(frame, makeMouseEvent(ev));
		}
		else if (ev.type == x11.ButtonRelease) {
			frame.win.onmouseup(frame, makeMouseEvent(ev));
		}
		else if (ev.type == x11.MotionNotify) {
			frame.win.onmousemove(frame, makeMouseEvent(ev));
		}
		else {
			//console.log(ev);
		}
	}
	catch (ex) {
		console.log(ex);
	}
}

function createFrame(fid, wid, cb) {
	var frame = {
		fid:fid,
		wid:wid
	};

	frame.moveToForeground = function() {
		X.RaiseWindow(fid);
	};

	frame.moveToPosition = function(x, y) {
		X.MoveWindow(fid, x, y);
		frame.rect.x = x;
		frame.rect.y = y;

		frame.win.onresize(frame);
	};

	frame.resizeToSize = function(w, h) {
		X.ResizeWindow(fid, w, h);
		frame.rect.width = w;
		frame.rect.height = h;

		var r = frame.win.innerRect();
		X.ResizeWindow(wid, r.width, r.height);

		frame.win.onresize(frame);
	};

	frame.takeFocus = function() {
		X.SetInputFocus(wid, 1);
	};

	frame.close = function() {
		if (frame.protos.indexOf('WM_DELETE_WINDOW') != -1) {
			console.log('delete');
			closeWindow(frame.wid);
		}
		else {
			console.log('destroy');
			X.DestroyWindow(frame.wid);
		}
	};

	frame.redrawAllFrames = function() {
		for (var f in frames) {
			var frame = frames[f];
			X.ClearArea(frame.fid, 0, 0, 0, 0, 1);
		}
	};

	frame.allocColor = async function(fg) { 
		return new Promise(function (resolve) {
			X.AllocColor(colormap, fg[0], fg[1], fg[2], function(err, color) {
				if (color) {
					var gc = X.AllocID();
					X.CreateGC(gc, fid, { foreground: color.pixel, background: black });
					resolve(gc);
				}
				else {
					console.log(err);
					resolve(null);
				}
			});
		});
	};

	frame.drawText = function(gc, x, y, text) {
		X.PolyText8(fid, gc, x, y, text);
	};

	frame.drawLine = function() {
	/*
	X.PolyLine(0, fid, GC, [0, 0, f.width-1, 0,
				                           f.width-1, f.height,
				                           f.width-1, f.height-1,
				                           0, f.height-1,
				                           0, 0]);
	*/
	};

	frame.fillRectangle = function(gc, x, y, w, h) {
		X.PolyFillRectangle(fid, gc, [x, y, w, h]);
	};

	require('./window.js').createWindow(frame, function(win) {
		frame.win = win;

		frames[fid] = frame;
		cb(frame);
	});
}

function destroyFrame(wid) {
	var frame = null;
	for (var fid in frames) {
		var f = frames[fid];
		if (f.fid == wid || f.wid == wid) {
			frame = f;
			break;
		}
	}
console.log('destroyFrame');

	if (frame) {
		X.DestroyWindow(frame.wid);
		X.DestroyWindow(frame.fid);

		delete frames[f.fid];
	}
}

function frameForWindowID(wid) {
	for (var fid in frames) {
		var frame = frames[fid];
		if (frame.wid == wid) return frame;
	}
	return null;
}

async function manageWindow(wid, preserve) {
	console.log("MANAGE WINDOW: " + wid + ",preserve:" + preserve);
	var attrs = await getAttributes(wid);
	if (attrs == null) {
		cosole.log("no attributes");
		return;
	}

	var fid = X.AllocID();
	var wrect = await getGeometry(wid);
	var frect = wrect;
	frect.x = frect.xPos;
	frect.y = frect.yPos;

  var protos = await getProtocols(wid);
	console.log(protos);

	if (preserve && attrs.mapState != 2) { //not mapped
		console.log("not mapped");
		return;
	}

	if (attrs.klass == 2) { //input only window
		console.log("input only");
		return;
	}

	if (!preserve) {
		frect.x = parseInt(Math.random()*300);
		frect.y = parseInt(Math.random()*300);
	}

	var events = x11.eventMask.ButtonMotion
			    |x11.eventMask.ButtonPress
			    |x11.eventMask.ButtonRelease
			    |x11.eventMask.SubstructureNotify
			    |x11.eventMask.SubstructureRedirect
			    |x11.eventMask.Exposure;

	X.CreateWindow(fid, root, 
		frect.x, frect.y,
		frect.width, frect.height, 
		0, 0, 0, 0,
		{ backgroundPixel: white, eventMask:events });

	var ee = new EventEmitter();
	X.event_consumers[fid] = ee;
	ee.on('event', handleFrameEvents);

	createFrame(fid, wid, function(frame) {
		frame.protos = protos;
		frame.rect = frect;
		frame.win.onresize(frame);

		wrect = frame.win.innerRect();

		X.ChangeSaveSet(1, wid);
		X.ResizeWindow(wid, wrect.width, wrect.height);
		X.ReparentWindow(wid, fid, wrect.x, wrect.y);

		console.log("MapWindow "+wid+"->"+fid);
		X.MapWindow(fid);
		X.MapWindow(wid);
	});

	//X.GrabKey(wid, 0, 64, 46, 1, 1);
	//X.GrabButton(wid, 0, 0, 1, 1, 0, 0, 0);
}

function startWM() {
	var client = x11.createClient(function(err, display) {
		X = display.client;

		X.require('render', function(err, Render) {
			X.Render = Render;

			root = display.screen[0].root;
			white = display.screen[0].white_pixel;
    	black = display.screen[0].black_pixel;
    	colormap = display.screen[0].default_colormap;
			console.log('root = ' + root);

			var events = x11.eventMask.Exposure
				|x11.eventMask.ButtonPress
				|x11.eventMask.ButtonRelease
				|x11.eventMask.MotionNotify
				|x11.eventMask.StructureNotify
				|x11.eventMask.SubstructureRedirect;

			X.ChangeWindowAttributes(root, {eventMask:events}, function(err) {
				if (err.error == 10) {
					console.error('Error: another window manager already running.');
					process.exit(1);
				}

			});

			initialize().then(function() {
				client.on('event', handleRootEvents);

				X.QueryTree(root, function(err, tree) {
					tree.children.forEach(function(wid) {
						manageWindow(wid, true);
					});
				});
			});
		});
	});

	client.on('error', function(err) {
		console.error('x11:'+err);
	});

	/*
	process.on('SIGINT', function() {
		restoreWindows();
		process.exit(0);
	});
	*/
}

function stopWM() {
	restoreWindows();
	X.close();
}

exports.start_process = startWM;
exports.stop_process = stopWM;
