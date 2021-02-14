import { atom } from "recoil";

const peerConnectionsAtom = atom({
  key: "peerConnections",
  default: new Map(),
});

const peerStreamsAtom = atom({
  key: "peersStreamAtom",
  default: new Map(),
});

const connectionAtom = atom({
  key: "connectionAtom",
  default: {
    peerId: null,
    iceServers: null,
    ws: null,
  },
});

export { connectionAtom, peerConnectionsAtom, peerStreamsAtom };
