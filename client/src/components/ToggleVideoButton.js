// @flow
import { css, StyleSheet } from "aphrodite";
import { mdiVideo, mdiVideoOff } from "@mdi/js";
import Icon from "@mdi/react";
import { useToggleVideo } from "../hooks/localStreamHooks";

function ToggleVideoButton(): React.Node {
  const [isEnabled, toggleVideo] = useToggleVideo();
  return (
    <button onClick={toggleVideo} className={css(styles.root)}>
      <Icon path={isEnabled ? mdiVideo : mdiVideoOff} size={1} color="#fff" />
    </button>
  );
}

const styles = StyleSheet.create({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "700",
    border: "none",
    fontSize: "17px",
    borderRadius: "50%",
    backgroundColor: "#95a5a6",
    cursor: "pointer",
    width: 50,
    margin: "0 10px",
    height: 50,
  },
});

export default ToggleVideoButton;
