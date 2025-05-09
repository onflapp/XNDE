var FRAME_TOP = 12;
var FRAME_LEFT = 5;
var FRAME_RIGHT = 5;
var FRAME_BOTTOM = 5;
var FONT_WIDTH = 6;

var windows = {};
var dragStart = null;

function parseColor(str) {
	str = str.substr(1);
	var a = str.substr(0, 2);
	var b = str.substr(2, 2);
	var c = str.substr(4, 2);

	var r = Number.parseInt('0x'+a, 16) * 257;
	var g = Number.parseInt('0x'+b, 16) * 257;
	var b = Number.parseInt('0x'+c, 16) * 257;

	return [r, g, b];
}

function createWindow(frame, cb) {
	var win = new FrameWindow();
	windows[frame.fid] = win;

	win.initialize(frame).then(function() {
		cb(win);
	});
}

function FrameWindow () {
	this.title = '[xxx]';
	this.isActive = false;
	this.rect = {};
	this.commandsLeft = [];
	this.commandsRight = [];
}

FrameWindow.prototype.initialize = async function(frame) {
	this.addCommand(-1, '| copy |', 'new');
	this.addCommand(-1, '| paste |', 'min');
	this.addCommand( 1, '|  x  |', 'close');

	this.activeBg = await frame.allocColor(parseColor('#ff5f03'));
	this.activeFg = await frame.allocColor(parseColor('#bfbfbf'));
	this.defaultBg = await frame.allocColor(parseColor('#303030'));
	this.defaultFg = await frame.allocColor(parseColor('#112233'));
};

FrameWindow.prototype.addCommand = function(pos, title, command) {
	var r = {
		title:title,
		command:command
	};

	if (pos < 0) this.commandsLeft.push(r);
	else if (pos > 0) this.commandsRight.push(r);
};

FrameWindow.prototype.innerRect = function() {
	var bw = (this.rect.borderWidth * 2);
	var rv = {
		x:FRAME_LEFT,
		y:FRAME_TOP,
		width:this.rect.width - (FRAME_LEFT + FRAME_RIGHT + bw),
		height:this.rect.height - (FRAME_TOP + FRAME_BOTTOM + bw)
	};

	return rv;
};

FrameWindow.prototype.onresize = function(frame) {
	this.rect = frame.rect;
};

FrameWindow.prototype.ondraw = function(frame) {
	if (this.isActive) {
		frame.fillRectangle(this.activeBg, 0, 0, this.rect.width, this.rect.height);
	}
	else {
		frame.fillRectangle(this.defaultBg, 0, 0, this.rect.width, this.rect.height);
	}

	var f = FONT_WIDTH;
	var x = FRAME_LEFT - 1;
	var h = FRAME_TOP - 2;
	for (var i = 0; i < this.commandsLeft.length; i++) {
		var cmd = this.commandsLeft[i];
		frame.drawText(this.activeFg, x, h, cmd.title);
		var w = cmd.title.length * f;

		cmd.x = x;
		cmd.y = 0;
		cmd.height = h;
		x += w;
		cmd.width = w;
	}

	var x = this.rect.width - FRAME_RIGHT + 2;
	for (var i = 0; i < this.commandsRight.length; i++) {
		var cmd = this.commandsRight[i];
		var w = cmd.title.length * f;
		x -= w;
		frame.drawText(this.activeFg, x, h, cmd.title);

		cmd.x = x;
		cmd.y = 0;
		cmd.height = h;
		cmd.width = w;
	}

	var x = (this.rect.width / 2) - ((this.title.length * f) / 2);
	frame.drawText(this.activeFg, x, h, this.title);
};

FrameWindow.prototype.onmousedown = function(frame, evt) {
	for (var k in windows) {
		var w = windows[k];
		w.isActive = false;
	}

	this.isActive = true;

	frame.redrawAllFrames();
	frame.moveToForeground();
	frame.takeFocus();

	dragStart = evt;
	dragStart.originx = this.rect.x;
	dragStart.originy = this.rect.y;
	dragStart.originw = this.rect.width;
	dragStart.originh = this.rect.height;
	dragStart.command = this.commandForHit(evt);
};

FrameWindow.prototype.commandForHit = function(evt) {
	if (evt.y < FRAME_TOP) {
		for (var i = 0; i < this.commandsLeft.length; i++) {
			var cmd = this.commandsLeft[i];
			if (evt.x > cmd.x && evt.x < (cmd.x + cmd.width)) return cmd.command;
		}
		for (var i = 0; i < this.commandsRight.length; i++) {
			var cmd = this.commandsRight[i];
			if (evt.x > cmd.x && evt.x < (cmd.x + cmd.width)) return cmd.command;
		}

		return 'move';
	}
	else return 'resize';
};

FrameWindow.prototype.onmouseup = function(frame, evt) {
	if (dragStart && dragStart.command == 'close') {
		frame.close();
	}
	dragStart = null;
};

FrameWindow.prototype.onmousemove = function(frame, evt) {

	if (dragStart && dragStart.command == 'move') {
		var x = dragStart.originx + evt.rootx - dragStart.rootx;
		var y = dragStart.originy + evt.rooty - dragStart.rooty;

		if (y <  0) y = 0;

		frame.moveToPosition(x, y);
	}
	else if (dragStart && dragStart.command == 'resize') {
		var w = dragStart.originw + evt.rootx - dragStart.rootx;
		var h = dragStart.originh + evt.rooty - dragStart.rooty;

		frame.resizeToSize(w, h);
	}
};

exports.createWindow = createWindow;
