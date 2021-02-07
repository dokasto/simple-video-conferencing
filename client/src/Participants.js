import "./Participants.css";
import SelfView from "./SelfView";
import { peersAtom } from "./atoms/connectionAtom";
import { useRecoilValue } from "recoil";
import VideoContainer from "./VideoContainer";

function Participants() {
  const peers = useRecoilValue(peersAtom);
  return (
    <div className="participants">
      <SelfView />
      {/*{peers.map((peer) =>*/}
      {/*  peer.stream ? <VideoContainer stream={peer.stream} /> : null*/}
      {/*)}*/}
    </div>
  );
}

export default Participants;
