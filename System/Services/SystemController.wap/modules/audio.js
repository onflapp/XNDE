const PulseAudio = new require('pulseaudio.js');

let pa;

function init_audio(cb) {
  pa = new PulseAudio.PulseAudio();
  (async function() {
    con = await pa.connect();
    //console.log(await pa.getServerInfo());

    cb("AUDIO");
  })();
}

function get_info(input, output) {
  let rv = {};
  rv['in_description'] = input['description'];
  rv['in_mute'] = input['mute'];
  rv['in_volume'] = PulseAudio.volumeToPercent(input['volume'].current[0]);

  rv['out_description'] = output['description'];
  rv['out_mute'] = output['mute'];
  rv['out_volume'] = PulseAudio.volumeToPercent(output['volume'].current[0]);

  return rv;
}

function handle_message(msg, cb) {
  (async function() {
    if (msg.command == "status") {
      let input = await pa.getSourceInfo(0);
      let output = await pa.getSinkInfo(0);
      let rv = get_info(input, output);
      cb(rv);
    }
    else if (msg.command == "change") {
      if (typeof msg.out_volume != 'undefined') {
        await pa.setSinkVolume(PulseAudio.percentToVolume(msg.out_volume));
      }
      if (typeof msg.out_mute != 'undefined') {
        await pa.setSinkMute(msg.out_mute);
      }
      if (typeof msg.in_volume != 'undefined') {
        await pa.setSourceVolume(PulseAudio.percentToVolume(msg.in_volume));
      }
      if (typeof msg.in_mute != 'undefined') {
        await pa.setSourceMute(msg.in_mute);
      }
      cb();
    }
    else {
      cb();
    }
  })();
}

exports.init = init_audio;
exports.dispatch = handle_message;
