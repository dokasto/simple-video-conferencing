import "./App.css";
import Participants from "./Participants";
import { useEffect } from "react";
import { useGetLocalStream } from "./hooks/localStreamHooks";
import { useConnect, useListenForEvents } from "./hooks/signallingHooks";
import { peersAtom } from "./atoms/connectionAtom";

import React from "react";
import { useRecoilState } from "recoil";

function Main() {
  const getLocalStream = useGetLocalStream();
  //const listenForEvents = useListenForEvents();
  const connect = useConnect();
  const onClick = () => {
    connect();
  };

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
        <button onClick={onClick} className="btn">
          Connect
        </button>
      </footer>
    </div>
  );
}

export default Main;
