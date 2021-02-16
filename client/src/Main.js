import "./App.css";
import Participants from "./components/Participants";
import { useEffect } from "react";
import { useGetLocalStream } from "hooks/localStreamHooks";
import ConnectButton from "components/ConnectButton";

import React from "react";

function Main() {
  const getLocalStream = useGetLocalStream();

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
      <footer className="app-footer">
        <ConnectButton />
      </footer>
    </div>
  );
}

export default Main;
