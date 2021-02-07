import { atom } from "recoil";

const connectionAtom = atom({
  key: "connectionAtom",
  default: {
    ws: null,
    peerId: null,
    iceServers: [],
    offers: new Set(),
    answers: new Set(),
    candidates: new Set(),
  },
});

const peersAtom = atom({
  key: "peersAtom",
  default: new Map(),
});

export { connectionAtom, peersAtom };
