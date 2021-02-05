import { useRecoilState } from "recoil";
import { connectionAtom } from "../atoms/connectionAtom";
import { useCallback } from "react";

const SOCKET_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const SOCKET_PORT = "8080";

function useConnectToSignallingServer() {
  const [connection, setConnection] = useRecoilState(connectionAtom);
  return useCallback(async () => {
    const ws = new WebSocket(
      SOCKET_PROTOCOL + "://" + window.location.hostname + ":" + SOCKET_PORT
    );
    setupListeners(ws);
  }, [connection]);
}

function setupListeners(ws) {
  ws.addEventListener("open", () => {
    console.log("websocket opened!");
  });

  ws.addEventListener("error", (e) => {
    console.log("websocket error", e);
  });

  ws.addEventListener("close", (e) => {
    console.log("websocket closed", e);
  });

  ws.addEventListener("message", async (e) => {
    let data;
    try {
      data = JSON.parse(e.data);
    } catch (err) {
      console.log("Received invalid JSON", err, e.data);
    }
    handleSignalling(data);
  });
}

function handleSignalling(data) {
  switch (data.type) {
    case "hello":
      try {
        const clientId = data.id;
        console.log("clientid", clientId);
      } catch (e) {
        console.log("No client id sent", e);
      }
      break;
    case "iceServers":
      break;
  }
}

export { useConnectToSignallingServer };
