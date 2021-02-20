// @flow
import { useRef, useEffect } from "react";
import { css, StyleSheet } from "aphrodite";
import Icon from "@mdi/react";
import { mdiVolumeVariantOff } from "@mdi/js";

function VideoContainer({ peer }) {
  const videoElem = useRef(null);
  const { stream, mutedAudio, mutedVideo } = peer;

  useEffect(() => {
    if (stream != null && videoElem.current != null) {
      videoElem.current.onloadedmetadata = () => {
        videoElem.current.play();
      };
      videoElem.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={css(styles.root)}>
      <video
        className={css(styles.video)}
        ref={videoElem}
        autoPlay
        playsInline
      />
      {mutedAudio && (
        <Icon
          className={css(styles.icon)}
          path={mdiVolumeVariantOff}
          color="#FFF"
        />
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "400px",
    height: "300px",
    backgroundColor: "#e6e2d6",
    borderRadius: "10px",
    justifySelf: "center",
    display: "inline-flex",
    position: "relative",
  },
  icon: {
    position: "absolute",
    width: 30,
    top: 10,
    left: 10,
  },
  video: {
    transform: "scale(-1, 1)",
    flexGrow: "1",
    width: "100%",
    borderRadius: "10px",
  },
});

export default VideoContainer;
