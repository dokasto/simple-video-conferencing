import React from "react";
import VideoContainer from "./VideoContainer";
import { localStreamAtom } from "./atoms/localStreamAtom";
import { useRecoilValue } from "recoil";

function SelfView() {
  const stream = useRecoilValue(localStreamAtom);
  const videoStream =
    stream != null ? new MediaStream(stream.getVideoTracks()) : null;
  return <VideoContainer stream={videoStream} />;
}

export default SelfView;
