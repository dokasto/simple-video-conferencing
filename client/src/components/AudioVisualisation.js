// @flow
import { css, StyleSheet } from "aphrodite";
import { useRef, useEffect, useState } from "react";

export default function AudioVisualisation({ stream }) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = useRef();
  const soundMeter = useRef();
  const meterRefresh = useRef();
  const [meter, setMeter] = useState(0);
  const animationFrameId = useRef();

  useEffect(() => {
    audioContext.current = new AudioContext();
    soundMeter.current = new SoundMeter(audioContext.current);
    soundMeter.current.connectToSource(stream, (e) => {
      if (e != null) {
        console.error(e);
        return;
      }
    });

    function updateMeter() {
      setMeter(soundMeter.current.instant.toFixed(2));
      window.requestAnimationFrame(updateMeter);
    }

    animationFrameId.current = window.requestAnimationFrame(updateMeter);

    return () => {
      window.cancelAnimationFrame(animationFrameId.current);
      audioContext.current = null;
      soundMeter.current = null;
      meterRefresh.current = null;
    };
  }, []);

  return (
    <meter className={css(styles.meter)} high="0.25" max="1" value={meter} />
  );
}

const styles = StyleSheet.create({
  meter: {
    position: "absolute",
    bottom: -3,
    margin: 0,
    padding: 0,
    left: 3,
    width: "50%",
    height: 20,
    "::-webkit-meter-bar": {
      background: "#607d8b",
      border: "none",
      borderRadius: 5,
    },
  },
});

class SoundMeter {
  constructor(context) {
    this.context = context;
    this.instant = 0.0;
    this.slow = 0.0;
    this.clip = 0.0;
    this.script = context.createScriptProcessor(2048, 1, 1);
    const that = this;
    this.script.onaudioprocess = function (event) {
      const input = event.inputBuffer.getChannelData(0);
      let i;
      let sum = 0.0;
      let clipcount = 0;
      for (i = 0; i < input.length; ++i) {
        sum += input[i] * input[i];
        if (Math.abs(input[i]) > 0.99) {
          clipcount += 1;
        }
      }
      that.instant = Math.sqrt(sum / input.length);
      that.slow = 0.95 * that.slow + 0.05 * that.instant;
      that.clip = clipcount / input.length;
    };
  }

  connectToSource(stream, callback) {
    console.log("SoundMeter connecting");
    try {
      this.mic = this.context.createMediaStreamSource(stream);
      this.mic.connect(this.script);
      // necessary to make sample run, but should not be.
      this.script.connect(this.context.destination);
      if (typeof callback !== "undefined") {
        callback(null);
      }
    } catch (e) {
      console.error(e);
      if (typeof callback !== "undefined") {
        callback(e);
      }
    }
  }

  stop() {
    console.log("SoundMeter stopping");
    this.mic.disconnect();
    this.script.disconnect();
  }
}
