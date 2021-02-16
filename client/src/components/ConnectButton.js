// @flow
import {
  useConnect,
  useIsConnected,
  useDisconnect,
} from "hooks/signallingHooks";
import { StyleSheet, css } from "aphrodite";

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
      {isConnected ? "disconnect" : "connect"}
    </button>
  );
}

const styles = StyleSheet.create({
  root: {
    color: "#fff",
    fontWeight: "700",
    border: "none",
    fontSize: "17px",
    padding: "10px 30px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  connected: {
    backgroundColor: "#27ae60",
  },
  disconnected: {
    backgroundColor: "#e74c3c",
  },
});

export default ConnectButton;
