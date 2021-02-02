import React from "react";
import VideoContainer from "./VideoContainer";
import { localStreamAtom } from "./atoms/localStreamAtom";
import { useRecoilValue } from "recoil";

function SelfView() {
  const stream = useRecoilValue(localStreamAtom);
  return <VideoContainer stream={stream} />;
}

export default SelfView;
