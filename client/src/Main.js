import "./App.css";
import Participants from "./Participants";
import { useEffect } from "react";
import { useGetLocalStream } from "./hooks/localStreamHooks";
import { useConnectToSignallingServer } from "./hooks/connectionHooks";

import React from "react";

function Main() {
  const getLocalStream = useGetLocalStream();
  const connectToSignallingServer = useConnectToSignallingServer();

  useEffect(() => {
    (async function initialization() {
      await getLocalStream();
    })();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h3>Simple Video Conferencing</h3>
      </header>
      <div className="app-content">
        <Participants />
      </div>
      <footer className="app-footer">
        <button onClick={connectToSignallingServer} className="btn">
          Connect
        </button>
      </footer>
    </div>
  );
}

export default Main;
