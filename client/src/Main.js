import "./App.css";
import Participants from "./Participants";
import { useEffect } from "react";
import { useGetLocalStream } from "./hooks/localStreamHooks";
import { useConnect } from "./hooks/signallingHooks";

import React from "react";

function Main() {
  const getLocalStream = useGetLocalStream();
  const connect = useConnect();

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
        <button onClick={connect} className="btn">
          Connect
        </button>
      </footer>
    </div>
  );
}

export default Main;
