import { useRecoilState, useRecoilValue } from "recoil";
import { connectionAtom, peersAtom } from "../atoms/connectionAtom";
import { localStreamAtom } from "../atoms/localStreamAtom";
import { useCallback } from "react";

const SOCKET_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const SOCKET_PORT = "8080";

function useConnectToSignallingServer() {
  //const [connection, setConnection] = useRecoilState(connectionAtom);
  const connection = {
    ws: null,
    peerId: null,
    iceServers: [],
    offers: new Set(),
    answers: new Set(),
    candidates: new Set(),
    isFirstPeer: false,
  };

  const localStream = useRecoilValue(localStreamAtom);
  const [peers, setPeers] = useRecoilState(peersAtom);
  return useCallback(async () => {
    const ws = new WebSocket(
      SOCKET_PROTOCOL + "://" + window.location.hostname + ":" + SOCKET_PORT
    );

    connection.ws = ws;

    const onConnect = ({ peerId, iceServers }) => {
      connection.peerId = peerId;
      connection.iceServers = iceServers;
    };

    const onPeerTrackAdded = (peerId, stream) => {
      const mapCopy = new Map();
      peers.forEach((value, key) => {
        mapCopy.set(key, value);
      });
      const currentPeer = mapCopy.get(peerId);
      currentPeer.stream = stream;
      mapCopy.set(peerId, currentPeer);
      setPeers(mapCopy);
    };

    const onPeerConnected = async (peersConnected) => {
      console.log("peersConnected", peersConnected, "connection", connection);
      if (peersConnected.length === 1 && !connection.isFirstPeer) {
        connection.isFirstPeer = true;
      }

      // only fist peers should call others
      const connectedPeers = new Map();
      for (const { peerId } of peersConnected) {
        if (peerId !== connection.peerId && !peers.has(peerId)) {
          const peerConnection = createPeerConnection(
            peerId,
            connection.iceServers,
            ws,
            connection.peerId,
            (stream) => onPeerTrackAdded(peerId, stream)
          );

          connectedPeers.set(peerId, {
            peerConnection,
            stream: null,
          });

          if (!connection.isFirstPeer) {
            return;
          }

          console.log("new peer connected, calling");

          if (localStream != null) {
            localStream
              .getTracks()
              .forEach((track) => peerConnection.addTrack(track, localStream));
          }

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              event: "OFFER",
              payload: {
                senderPeerId: connection.peerId,
                sdp: offer.sdp,
              },
            })
          );
        }
      }
      setPeers(connectedPeers);
    };

    setupListeners(
      ws,
      { onConnect, onPeerConnected },
      connection,
      peers,
      localStream
    );
  }, [connection, peers]);
}

function setupListeners(ws, callbacks, connection, peers, localStream) {
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
    console.log("ws message", e);
    let data;
    try {
      data = JSON.parse(e.data);
    } catch (err) {
      console.log("Received invalid JSON", err, e.data);
    }

    try {
      await handleSignalling(data, callbacks, connection, peers, localStream);
    } catch (e) {
      console.log("signal response error", e);
    }
  });
}

async function handleSignalling(
  { event, payload },
  callbacks,
  connection,
  peers,
  localStream
) {
  console.log("event", event, payload);
  const ignoreMessage = connection.peerId === payload.senderPeerId;

  switch (event) {
    case "CONNECTED":
      callbacks.onConnect(payload);
      break;
    case "PEER_CONNECTED":
      window.setTimeout(async () => {
        await callbacks.onPeerConnected(payload);
      }, 1);
    case "OFFER":
      if (!ignoreMessage && payload.sdp != null) {
        console.log("incoming call from", payload.senderPeerId);
        if (!connection.offers.has(payload.senderPeerId)) {
          const peerConnection = createPeerConnection(payload.senderPeerId);
          if (localStream != null) {
            localStream
              .getTracks()
              .forEach((track) => peerConnection.addTrack(track, localStream));
          }

          await peerConnection.setRemoteDescription({
            type: "offer",
            sdp: payload.sdp,
          });
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          // mark that we've received an offer from this peer
          connection.offers.add(payload.senderPeerId);
          connection.ws.send(
            JSON.stringify({
              event: "ANSWER",
              payload: {
                senderPeerId: connection.peerId,
                sdp: answer.sdp,
              },
            })
          );
        }
      }
      break;
    case "ANSWER":
      if (!ignoreMessage) {
        if (!connection.answers.has(payload.senderPeerId)) {
          connection.answers.add(payload.senderPeerId);
          const answeringPeer = peers.get(payload.senderPeerId);
          if (answeringPeer != null) {
            await answeringPeer.setRemoteDescription({
              type: "answer",
              sdp: payload.sdp,
            });
          } else {
            console.log("peer not found", payload.senderPeerId);
          }
        }
      }
      break;
    case "CANDIDATE":
      if (!ignoreMessage) {
        connection.candidates.add(payload.senderPeerId);
        const peerSendingCandidate = peers.get(payload.senderPeerId);
        if (peerSendingCandidate != null) {
          await peerSendingCandidate.addIceCandidate(payload.candidate);
        } else {
          console.log("peer not found", payload.senderPeerId);
        }
      }
      break;
    default:
      console.log("unhandled event", payload);
      break;
  }
}

function createPeerConnection(
  peerId,
  iceServers,
  ws,
  senderPeerId,
  onTrackReceived
) {
  const pc = new RTCPeerConnection({ iceServers });
  pc.addEventListener("icecandidate", (e) => {
    const { candidate } = e;
    /*
     * the following code block demonstrates a failure to connect.
     * Do not use in production.
    if (candidate && candidate.candidate !== '') {
        const parts = candidate.candidate.split(' ');
        parts[5] = 10000; // replace port with 10000 to make ice fail.
        ws.send(JSON.stringify({
            type: 'candidate',
            candidate: {
                candidate: parts.join(' '),
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
            },
            id,
        }));
        return;
    }
    */
    ws.send(
      JSON.stringify({
        event: "CANDIDATE",
        payload: {
          senderPeerId,
          candidate,
          peerId,
        },
      })
    );
  });

  pc.addEventListener("track", (e) => {
    onTrackReceived(e.streams[0]);
  });

  pc.addEventListener("iceconnectionstatechange", () => {
    console.log(peerId, "iceconnectionstatechange", pc.iceConnectionState);
  });
  pc.addEventListener("connectionstatechange", () => {
    console.log(peerId, "connectionstatechange", pc.connectionState);
    // if (pc.connectionState === "connected") {
    //   hangupBtn.disabled = false;
    //   pc.getStats().then(onConnectionStats);
    // }
  });
  pc.addEventListener("signalingstatechange", () => {
    // console.log(peerId, "signalingstatechange", pc.signalingState);
  });

  // let lastResult = null; // the last getStats result.
  // const intervalId = setInterval(async () => {
  //   if (pc.signalingState === "closed") {
  //     clearInterval(intervalId);
  //     return;
  //   }
  //   lastResult = await queryBitrateStats(pc, lastResult);
  // }, 2000);
  return pc;
}

export { useConnectToSignallingServer };
