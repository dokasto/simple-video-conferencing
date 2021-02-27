import SelfView from "./SelfView";
import { peerStreamsAtom } from "../atoms/connectionAtom";
import { useRecoilValue } from "recoil";
import VideoContainer from "./VideoContainer";
import { css, StyleSheet } from "aphrodite";

function Participants() {
  const peersStreams = useRecoilValue(peerStreamsAtom);
  //console.log("peersStreams", peersStreams);
  return (
    <div className={css(styles.root)}>
      <SelfView />
      {Array.from(peersStreams).map(([, peer], key) => (
        <VideoContainer key={key} peer={peer} />
      ))}
    </div>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: "1",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "wrap",
    textAlign: "center",
  },
});

export default Participants;
