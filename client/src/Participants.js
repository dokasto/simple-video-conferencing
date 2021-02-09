import "./Participants.css";
import SelfView from "./SelfView";
import { peersAtom, peerStreamAtom } from "./atoms/connectionAtom";
import { useRecoilValue } from "recoil";
import VideoContainer from "./VideoContainer";

function Participants() {
  const peersStreams = useRecoilValue(peerStreamAtom);
  const streams = [];

  peersStreams.forEach((stream) => {
    if (stream != null) {
      streams.push(stream);
    }
  });

  return (
    <div className="participants">
      <SelfView />
      {streams.map((stream, key) => (
        <VideoContainer key={key} stream={stream} />
      ))}
    </div>
  );
}

export default Participants;
