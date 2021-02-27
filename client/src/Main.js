import "./App.css";
import Participants from "./components/Participants";
import { useEffect } from "react";
import { useGetLocalStream } from "hooks/localStreamHooks";
import ConnectButton from "components/ConnectButton";
import ToggleAudioButton from "components/ToggleAudioButton";
import ToggleVideoButton from "components/ToggleVideoButton";
import ToggleScreenShareButton from "components/ToggleScreenShareButton";

import React from "react";
import { css, StyleSheet } from "aphrodite";
import { useIsConnected } from "./hooks/signallingHooks";

function Main() {
  const getLocalStream = useGetLocalStream();
  const isConnected = useIsConnected();

  useEffect(() => {
    (async function initialization() {
      await getLocalStream();
    })();
  }, [getLocalStream]);

  return (
    <div className="app">
      <header className="app-header">
        <h3>Simple Video Conferencing</h3>
      </header>
      <div className="app-content">
        <Participants />
      </div>
      <footer className={css(styles.footer)}>
        {isConnected && <ToggleScreenShareButton />}
        <ToggleVideoButton />
        {isConnected && <ToggleAudioButton />}
        <ConnectButton />
      </footer>
    </div>
  );
}

const styles = StyleSheet.create({
  footer: {
    display: "flex",
    margin: "100px auto",
    justifyContent: "space-between",
  },
});

export default Main;
