import Icon from "@mdi/react";
import { css, StyleSheet } from "aphrodite";
import { mdiMonitorShare, mdiMonitorOff } from "@mdi/js";
import {
  useStartScreenShare,
  useStopScreenShare,
  useIsScreenSharing,
} from "hooks/localStreamHooks";

function ToggleScreenShareButton() {
  const startScreenShare = useStartScreenShare();
  const stopScreenShare = useStopScreenShare();
  const isScreenSharing = useIsScreenSharing();
  const onClick = async () => {
    const isSharing = isScreenSharing();
    if (isSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  return (
    <button onClick={onClick} className={css(styles.root)}>
      <Icon
        path={isScreenSharing() ? mdiMonitorOff : mdiMonitorShare}
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

export default ToggleScreenShareButton;
