import "./Participants.css";
import SelfView from "./SelfView";
import { peerStreamsAtom } from "../atoms/connectionAtom";
import { useRecoilValue } from "recoil";
import VideoContainer from "./VideoContainer";

function Participants() {
  const peersStreams = useRecoilValue(peerStreamsAtom);
  return (
    <div className="participants">
      <SelfView />
      {Array.from(peersStreams).map(([, stream], key) => (
        <VideoContainer key={key} stream={stream} />
      ))}
    </div>
  );
}

export default Participants;
