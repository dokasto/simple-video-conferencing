// @flow
import { css, StyleSheet } from "aphrodite";
import { mdiVolumeHigh, mdiVolumeVariantOff } from "@mdi/js";
import Icon from "@mdi/react";
import { useToggleMute } from "hooks/localStreamHooks";

function MuteButton(): React.Node {
  const [isMuted, toggleMute] = useToggleMute();
  return (
    <button onClick={toggleMute} className={css(styles.root)}>
      <Icon
        path={isMuted ? mdiVolumeVariantOff : mdiVolumeHigh}
        title={isMuted ? "Unmute" : "Mute"}
        size={1}
        color="#fff"
      />
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

export default MuteButton;
