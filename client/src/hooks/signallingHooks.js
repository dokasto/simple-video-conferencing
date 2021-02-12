import { useCallback } from "react";
import { peersAtom, peerStreamAtom } from "../atoms/connectionAtom";
import { useRecoilState, useRecoilValue } from "recoil";
import { localStreamAtom } from "../atoms/localStreamAtom";

const SOCKET_PROTOCOL = "ws";
const SOCKET_PORT = "8080";
const connection = {};
let localStream;

export function useConnect() {
  localStream = useRecoilValue(localStreamAtom);
  const listenForEvents = useListenForEvents();
  const onClose = useOnClose();

  return useCallback(() => {
    const ws = new WebSocket(
      SOCKET_PROTOCOL + "://" + window.location.hostname + ":" + SOCKET_PORT
    );
    window.onbeforeunload = function () {
      ws.removeEventListener("close", onClose);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
    listenForEvents(ws);
  }, [listenForEvents, onClose]);
}

export function useListenForEvents() {
  const onOpen = useOnOpen();
  const onError = useOnerror();
  const onClose = useOnClose();
  const onMessage = useOnMessage();

  return useCallback(
    (ws) => {
      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
      ws.addEventListener("close", onClose);
      ws.addEventListener("message", (event) => onMessage(event, ws));
    },
    [onOpen, onError, onClose, onMessage]
  );
}

function useOnOpen() {
  return useCallback(() => {
    console.info("Websocket opened!");
  }, []);
}

function useOnerror() {
  return useCallback((e) => {
    console.error("Websocket error!", e);
  }, []);
}

function useOnClose() {
  return useCallback(() => {
    console.info("Websocket closed!");
  }, []);
}

function useOnMessage() {
  const messageHandler = useMessageHandler();
  return useCallback(
    async (event, ws) => {
      try {
        const data = JSON.parse(event.data);
        await messageHandler(data, ws);
      } catch (e) {
        console.error("Invalid JSON message: ", e);
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
  return useCallback(
    async (data, ws) => {
      switch (data.event) {
        case "CONNECTED":
          onConnected(data.payload);
          break;
        case "NEW_PEER":
          onNewPeerConnected(data.payload, ws);
          break;
        case "OFFER":
          await onOffer(data.payload, ws);
          break;
        case "ANSWER":
          await onAnswer(data.payload);
          break;
        case "CANDIDATE":
          await onCandidate(data.payload);
          break;
        case "PEER_LEFT":
          await onPeerLeft(data.payload);
          break;
        default:
          console.info("Unhandled event", data);
          break;
      }
    },
    [onNewPeerConnected, onOffer, onAnswer, onCandidate, onPeerLeft]
  );
}

function onConnected({ peerId, iceServers, isInitialPeer }) {
  connection.peerId = peerId;
  connection.iceServers = iceServers;
  connection.isInitialPeer = JSON.parse(isInitialPeer);
}

function useOnNewPeerConnected() {
  const [atomPeers, setPeers] = useRecoilState(peersAtom);
  const callPeers = useCallPeers();
  return useCallback(
    (payload, ws) => {
      payload.forEach((peer) => {
        if (!atomPeers.has(peer.peerId)) {
          atomPeers.set(peer.peerId, {
            connected: false,
            peerConnection: null,
          });
        }
      });
      setPeers(atomPeers);
      if (!connection.isInitialPeer) {
        callPeers(ws);
      }
    },
    [atomPeers, setPeers, callPeers]
  );
}

function useOnOffer() {
  const [atomPeers, setPeers] = useRecoilState(peersAtom);
  const [peerStreams, setPeerStreams] = useRecoilState(peerStreamAtom);
  return useCallback(
    async ({ from, to, sdp }, ws) => {
      const callingPeer = atomPeers.get(from);
      if (
        callingPeer != null &&
        !callingPeer.connected &&
        to === connection.peerId
      ) {
        callingPeer.peerConnection = createPeerConnection(
          from,
          ws,
          (stream) => {
            peerStreams.set(from, stream);
            setPeerStreams(peerStreams);
          }
        );
        if (localStream != null) {
          localStream
            .getTracks()
            .forEach((track) =>
              callingPeer.peerConnection.addTrack(track, localStream)
            );
        }
        await callingPeer.peerConnection.setRemoteDescription({
          type: "offer",
          sdp,
        });
        const answer = await callingPeer.peerConnection.createAnswer();
        await callingPeer.peerConnection.setLocalDescription(answer);
        setPeers(atomPeers);
        ws.send(
          JSON.stringify({
            event: "ANSWER",
            payload: {
              from: connection.peerId,
              to: from,
              sdp: answer.sdp,
            },
          })
        );
      }
    },
    [atomPeers, setPeers, peerStreams, setPeerStreams]
  );
}

function useOnAnswer() {
  const [atomPeers] = useRecoilState(peersAtom);
  return useCallback(
    async ({ from, sdp, to }) => {
      const answeringPeer = atomPeers.get(from);
      if (
        answeringPeer != null &&
        to === connection.peerId &&
        !answeringPeer.connected
      ) {
        await answeringPeer.peerConnection.setRemoteDescription({
          type: "answer",
          sdp,
        });
      }
    },
    [atomPeers]
  );
}

function useOnCandidate() {
  const [atomPeers] = useRecoilState(peersAtom);
  return useCallback(
    async ({ from, to, candidate }) => {
      if (atomPeers.has(from) && to === connection.peerId) {
        const peer = atomPeers.get(from);
        await peer.peerConnection.addIceCandidate(candidate);
      }
    },
    [atomPeers]
  );
}

function useOnPeerLeft() {
  const [atomPeers, setPeers] = useRecoilState(peersAtom);
  const [peerStreams, setPeerStreams] = useRecoilState(peerStreamAtom);
  return useCallback(
    ({ peerId }) => {
      const newPeerStreams = new Map(peerStreams);
      const newAtomPeers = new Map(atomPeers);
      newAtomPeers.delete(peerId);
      newPeerStreams.delete(peerId);
      setPeers(newAtomPeers);
      setPeerStreams(newPeerStreams);
    },
    [atomPeers, setPeers, peerStreams, setPeerStreams]
  );
}

function createPeerConnection(peerId, ws, onTrackAdded) {
  const pc = new RTCPeerConnection({ iceServers: connection.iceServers });
  pc.addEventListener("icecandidate", (e) => {
    ws.send(
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
    onTrackAdded(e.streams[0]);
  });
  return pc;
}

function useCallPeers() {
  const [atomPeers] = useRecoilState(peersAtom);
  const callPeer = useCallPeer();
  return useCallback(
    (ws) => {
      atomPeers.forEach((currentPeer, peerId) => {
        if (peerId !== connection.peerId && !currentPeer.connected) {
          callPeer(peerId, ws)
            .then()
            .catch((e) => {
              console.error("call error", e);
            });
        }
      });
    },
    [atomPeers, callPeer]
  );
}

function useCallPeer() {
  const [atomPeers, setPeers] = useRecoilState(peersAtom);
  const [peerStreams, setPeerStreams] = useRecoilState(peerStreamAtom);
  return useCallback(
    async (peerId, ws) => {
      const peer = atomPeers.get(peerId);
      peer.peerConnection = createPeerConnection(peerId, ws, (stream) => {
        peerStreams.set(peerId, stream);
        setPeerStreams(peerStreams);
      });

      if (localStream != null) {
        localStream
          .getTracks()
          .forEach((track) => peer.peerConnection.addTrack(track, localStream));
      }

      const offer = await peer.peerConnection.createOffer();
      await peer.peerConnection.setLocalDescription(offer);
      setPeers(atomPeers);
      ws.send(
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
    [atomPeers, setPeers, peerStreams, setPeerStreams]
  );
}
