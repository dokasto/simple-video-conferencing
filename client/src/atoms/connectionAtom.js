import { atom } from "recoil";

const connectionAtom = atom({
  key: "connectionAtom",
  default: {
    id: null,
  },
});

export { connectionAtom };
