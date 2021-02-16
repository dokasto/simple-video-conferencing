// @flow
import {
  peerConnectionsAtom,
  peerStreamsAtom,
  connectionAtom,
} from "../atoms/connectionAtom";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { localStreamAtom } from "../atoms/localStreamAtom";
import { useState, useEffect } from "react";

const SOCKET_PROTOCOL = "ws";
const SOCKET_PORT = "8080";

export function useConnect() {
  const listenForEvents = useListenForEvents();
  return useRecoilCallback(
    ({ set, snapshot }) => async () => {
      const connection = await snapshot.getPromise(connectionAtom);
      const ws = new WebSocket(
        SOCKET_PROTOCOL + "://" + window.location.hostname + ":" + SOCKET_PORT
      );
      const newConnection = { ...connection, ws };
      set(connectionAtom, newConnection);
      await listenForEvents(ws);
    },
    [listenForEvents]
  );
}

export function useIsConnected(): boolean {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const connection = useRecoilValue(connectionAtom);

  useEffect(() => {
    setIsConnected(
      connection.ws != null &&
        connection.peerId != null &&
        connection.iceServers != null
    );
  }, [connection]);

  return isConnected;
}

export function useListenForEvents() {
  const onOpen = useOnOpen();
  const onError = useOnerror();
  const onClose = useOnClose();
  const onMessage = useOnMessage();

  return useRecoilCallback(
    () => async (ws) => {
      ws.addEventListener("open", async () => await onOpen());
      ws.addEventListener("error", async () => await onError());
      ws.addEventListener("close", async () => await onClose());
      ws.addEventListener("message", async (event) => await onMessage(event));

      window.onbeforeunload = function () {
        ws.removeEventListener("close", onClose);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    },
    [onOpen, onError, onClose, onMessage]
  );
}

function useOnOpen() {
  return useRecoilCallback(() => async () => {
    console.info("Websocket opened!");
  });
}

function useOnerror() {
  return useRecoilCallback(() => async () => {
    console.info("Websocket error!");
  });
}

function useOnClose() {
  const resetState = useResetState();
  return useRecoilCallback(({ set }) => async () => {
    await resetState();
    console.info("Websocket closed!");
  });
}

function useResetState() {
  return useRecoilCallback(({ set }) => async () => {
    set(peerConnectionsAtom, new Map());
    set(peerStreamsAtom, new Map());
    set(connectionAtom, { peerId: null, iceServers: null, ws: null });
  });
}

function useOnMessage() {
  const messageHandler = useMessageHandler();
  return useRecoilCallback(
    () => async (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error("Invalid JSON message: ", e);
      }

      if (data != null) {
        await messageHandler(data);
      }
    },
    [messageHandler]
  );
}

function useMessageHandler() {
  const onNewPeerConnected = useOnNewPeerConnected();
  const onOffer = useOnOffer();
  const onAnswer = useOnAnswer();
  const onCandidate = useOnCandidate();
  const onPeerLeft = useOnPeerLeft();
  const onConnected = useOnConnect();

  return useRecoilCallback(
    () => async ({ event, payload }) => {
      switch (event) {
        case "CONNECTED":
          await onConnected(payload);
          break;
        case "NEW_PEER":
          await onNewPeerConnected(payload);
          break;
        case "OFFER":
          await onOffer(payload);
          break;
        case "ANSWER":
          await onAnswer(payload);
          break;
        case "CANDIDATE":
          await onCandidate(payload);
          break;
        case "PEER_LEFT":
          await onPeerLeft(payload);
          break;
        default:
          console.info("Unhandled event", event, payload);
          break;
      }
    },
    [
      onNewPeerConnected,
      onOffer,
      onAnswer,
      onCandidate,
      onPeerLeft,
      onConnected,
    ]
  );
}

function useOnConnect() {
  return useRecoilCallback(
    ({ set, snapshot }) => async ({ peerId, iceServers }) => {
      const connection = await snapshot.getPromise(connectionAtom);
      const newConnection = { ...connection, peerId, iceServers };
      set(connectionAtom, newConnection);
    },
    []
  );
}

function useOnNewPeerConnected() {
  const callPeer = useCallPeer();
  return useRecoilCallback(
    ({ snapshot }) => async (payload) => {
      const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
      const connection = await snapshot.getPromise(connectionAtom);
      payload.forEach((peer) => {
        if (
          !peerConnections.has(peer.peerId) &&
          peer.peerId !== connection.peerId
        ) {
          callPeer(peer.peerId);
        }
      });
    },
    [callPeer]
  );
}

function useCallPeer() {
  const createPeerConnection = useCreatePeerConnection();
  return useRecoilCallback(
    ({ set, snapshot }) => async (peerId) => {
      let newPeerConnections;
      const connection = await snapshot.getPromise(connectionAtom);
      const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
      const localStream = await snapshot.getPromise(localStreamAtom);

      const onTrackAdded = async (stream) => {
        const peerStreams = await snapshot.getPromise(peerStreamsAtom);
        const newPeerStreams = new Map([...peerStreams]);
        newPeerStreams.set(peerId, stream);
        set(peerStreamsAtom, newPeerStreams);
      };

      const peerConnection = await createPeerConnection({
        peerId,
        onTrackAdded,
      });

      newPeerConnections = new Map([...peerConnections]);
      newPeerConnections.set(peerId, peerConnection);
      set(peerConnectionsAtom, newPeerConnections);

      if (localStream != null) {
        localStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, localStream));
      }

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      newPeerConnections = new Map([...peerConnections]);
      newPeerConnections.set(peerId, peerConnection);
      set(peerConnectionsAtom, newPeerConnections);

      connection.ws.send(
        JSON.stringify({
          event: "OFFER",
          payload: {
            from: connection.peerId,
            to: peerId,
            sdp: offer.sdp,
          },
        })
      );
    },
    [createPeerConnection]
  );
}

function useOnOffer() {
  const createPeerConnection = useCreatePeerConnection();
  return useRecoilCallback(
    ({ set, snapshot }) => async ({ from, to, sdp }) => {
      const peerStreams = await snapshot.getPromise(peerStreamsAtom);
      const localStream = await snapshot.getPromise(localStreamAtom);
      const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
      const connection = await snapshot.getPromise(connectionAtom);

      if (to !== connection.peerId) {
        return;
      }

      const onTrackAdded = async (stream) => {
        const newPeerStreams = new Map([...peerStreams]);
        newPeerStreams.set(from, stream);
        set(peerStreamsAtom, newPeerStreams);
      };

      const peerConnection = await createPeerConnection({
        peerId: from,
        onTrackAdded,
      });

      if (localStream != null) {
        localStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, localStream));
      }

      await peerConnection.setRemoteDescription({
        type: "offer",
        sdp,
      });

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const newPeerConnections = new Map([...peerConnections]);
      newPeerConnections.set(from, peerConnection);
      set(peerConnectionsAtom, newPeerConnections);

      connection.ws.send(
        JSON.stringify({
          event: "ANSWER",
          payload: {
            from: connection.peerId,
            to: from,
            sdp: answer.sdp,
          },
        })
      );
    },
    [createPeerConnection]
  );
}

function useOnAnswer() {
  return useRecoilCallback(({ set, snapshot }) => async ({ from, sdp, to }) => {
    const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
    const peerConnection = peerConnections.get(from);
    const connection = await snapshot.getPromise(connectionAtom);

    if (peerConnection != null && to === connection.peerId) {
      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp,
      });

      const newPeerConnections = new Map([...peerConnections]);
      newPeerConnections.set(from, peerConnection);
      set(peerConnectionsAtom, newPeerConnections);
    }
  });
}

function useOnCandidate() {
  return useRecoilCallback(
    ({ set, snapshot }) => async ({ from, to, candidate }) => {
      const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
      const connection = await snapshot.getPromise(connectionAtom);
      if (peerConnections.has(from) && to === connection.peerId) {
        const peerConnection = peerConnections.get(from);

        if (candidate != null) {
          await peerConnection.addIceCandidate(candidate);
        }

        const newPeerConnections = new Map([...peerConnections]);
        newPeerConnections.set(from, peerConnection);
        set(peerConnectionsAtom, newPeerConnections);
      }
    }
  );
}

function useOnPeerLeft() {
  const disconnectPeer = useDisconnectPeer();
  return useRecoilCallback(
    () => async ({ peerId }) => {
      await disconnectPeer(peerId);
    },
    [disconnectPeer]
  );
}

export function useDisconnect() {
  return useRecoilCallback(
    ({ set, snapshot }) => async () => {
      const connection = await snapshot.getPromise(connectionAtom);
      connection.ws.close();
      set(peerConnectionsAtom, new Map());
      set(peerStreamsAtom, new Map());
      set(connectionAtom, { peerId: null, ws: null, iceServers: null });
    },
    []
  );
}

function useDisconnectPeer() {
  return useRecoilCallback(({ set, snapshot }) => async (peerId) => {
    const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
    const peerStreams = await snapshot.getPromise(peerStreamsAtom);
    const newPeerStreams = new Map([...peerStreams]);
    const newPeerConnections = new Map([...peerConnections]);

    if (newPeerConnections.has(peerId)) {
      newPeerConnections.get(peerId).close();
    }

    newPeerConnections.delete(peerId);
    newPeerStreams.delete(peerId);

    set(peerConnectionsAtom, newPeerConnections);
    set(peerStreamsAtom, newPeerStreams);
  });
}

function useCreatePeerConnection() {
  return useRecoilCallback(
    ({ snapshot }) => async ({ peerId, onTrackAdded }) => {
      const connection = await snapshot.getPromise(connectionAtom);
      const pc = new RTCPeerConnection({ iceServers: connection.iceServers });
      pc.addEventListener("icecandidate", (e) => {
        connection.ws.send(
          JSON.stringify({
            event: "CANDIDATE",
            payload: {
              from: connection.peerId,
              to: peerId,
              candidate: e.candidate,
            },
          })
        );
      });
      pc.addEventListener("track", (e) => {
        onTrackAdded(e.streams[0]).then();
      });
      return pc;
    }
  );
}
