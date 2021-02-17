//@flow
import { useRecoilState, useRecoilValue } from "recoil";
import { localStreamAtom } from "../atoms/localStreamAtom";
import { useCallback, useState, useEffect } from "react";

export function useGetLocalStream() {
  const [, setLocalStream] = useRecoilState(localStreamAtom);
  return useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalStream(stream);
  }, [setLocalStream]);
}

export function useToggleMute() {
  const localStream = useRecoilValue(localStreamAtom);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack != null) {
      audioTrack.enabled = !isMuted;
    }
  }, [localStream, isMuted]);

  const toggle = useCallback(() => {
    setIsMuted(!isMuted);
  });

  return [isMuted, toggle];
}
