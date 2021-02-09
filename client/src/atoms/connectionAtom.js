import { atom } from "recoil";

const connectionAtom = atom({
  key: "connectionAtom",
  default: {
    ws: null,
    peerId: null,
  },
});

const peersAtom = atom({
  key: "peersAtom",
  default: new Map(),
});

const peerStreamAtom = atom({
  key: "peersStreamAtom",
  default: new Map(),
});

export { connectionAtom, peersAtom, peerStreamAtom };
