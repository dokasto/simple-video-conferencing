// @flow
import {
  useConnect,
  useIsConnected,
  useDisconnect,
} from "hooks/signallingHooks";
import { StyleSheet, css } from "aphrodite";
import Icon from "@mdi/react";
import { mdiPhone } from "@mdi/js";
import { mdiCloseThick } from "@mdi/js";

function ConnectButton(): React.Node {
  const connect = useConnect();
  const disconnect = useDisconnect();
  const isConnected = useIsConnected();

  const onClick = async (): void => {
    if (!isConnected) {
      await connect();
    } else {
      await disconnect();
    }
  };

  return (
    <button
      onClick={onClick}
      className={css(
        styles.root,
        isConnected ? styles.disconnected : styles.connected
      )}
    >
      <Icon
        path={isConnected ? mdiCloseThick : mdiPhone}
        title={isConnected ? "disconnect" : "connect"}
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
    cursor: "pointer",
    width: 50,
    height: 50,
    margin: "0 10px",
  },
  connected: {
    backgroundColor: "#27ae60",
  },
  disconnected: {
    backgroundColor: "#e74c3c",
  },
});

export default ConnectButton;
