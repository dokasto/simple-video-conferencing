import React from "react";
import VideoContainer from "./VideoContainer";
import { localStreamAtom } from "../atoms/localStreamAtom";
import { useRecoilValue } from "recoil";

function SelfView() {
  const stream = useRecoilValue(localStreamAtom);
  const videoStream =
    stream != null ? new MediaStream(stream.getVideoTracks()) : null;
  const peer = { stream: videoStream, videoMuted: false, audioMuted: false };
  return <VideoContainer selfView={true} peer={peer} />;
}

export default SelfView;
