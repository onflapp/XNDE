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

function disconnect_audio() {
  pa.disconnect();
}

function get_info(input, output) {
  let rv = {};
  rv['in_description'] = input['description'];
  rv['in_mute'] = input['mute'];
  rv['in_volume'] = Math.ceil(PulseAudio.volumeToPercent(input['volume'].current[0]));

  rv['out_description'] = output['description'];
  rv['out_mute'] = output['mute'];
  rv['out_volume'] = Math.ceil(PulseAudio.volumeToPercent(output['volume'].current[0]));

  return rv;
}

function handle_message(msg, cb) {
  (async function() {
    if (msg.command == 'status') {
      let input = await pa.getSourceInfo(0);
      let output = await pa.getSinkInfo(0);
      let rv = get_info(input, output);
      cb(rv);
    }
    else if (msg.command == 'change') {
      //out volume
      if (msg.out_volume == 'up') {
        let info = await pa.getSinkInfo(0);
        let vol = Math.ceil(PulseAudio.volumeToPercent(info['volume'].current[0]));
        console.log('+'+vol);
        vol += 10;
        if (vol > 100) vol = 100;

        await pa.setSinkVolume(PulseAudio.percentToVolume(vol));
      }
      else if (msg.out_volume == 'down') {
        let info = await pa.getSinkInfo(0);
        let vol = Math.ceil(PulseAudio.volumeToPercent(info['volume'].current[0]));
        console.log('-'+vol);
        vol -= 10;
        if (vol < 0) vol = 0;

        await pa.setSinkVolume(PulseAudio.percentToVolume(vol));
      }
      else if (typeof msg.out_volume != 'undefined') {
        await pa.setSinkVolume(PulseAudio.percentToVolume(msg.out_volume));
      }

      //out mute
      if (msg.out_mute == 'toggle') {
        let info = await pa.getSinkInfo(0);
        await pa.setSinkMute(!info.mute);
      }
      else if (typeof msg.out_mute != 'undefined') {
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

exports.start_process = init_audio;
exports.stop_process = disconnect_audio;
exports.dispatch = handle_message;
