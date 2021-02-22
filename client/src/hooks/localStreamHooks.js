//@flow
import { useRecoilState, useRecoilValue } from "recoil";
import { localStreamAtom } from "../atoms/localStreamAtom";
import { useCallback, useState, useEffect } from "react";
import { connectionAtom } from "../atoms/connectionAtom";

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

export function useToggleVideo() {
  const localStream = useRecoilValue(localStreamAtom);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const { ws, peerId } = useRecoilValue(connectionAtom);

  const toggle = useCallback(() => {
    const [videoTrack] = localStream?.getVideoTracks();
    if (videoTrack == null) {
      return;
    }
    videoTrack.enabled = !isEnabled;
    setIsEnabled(!isEnabled);
    ws?.send(
      JSON.stringify({
        event: "TOGGLE_VIDEO",
        payload: { peerId, isEnabled },
      })
    );
  }, [localStream, peerId, ws, isEnabled]);

  return [isEnabled, toggle];
}

export function useToggleAudio() {
  const localStream = useRecoilValue(localStreamAtom);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const { ws, peerId } = useRecoilValue(connectionAtom);

  useEffect(() => {
    const [audioTrack] = localStream?.getAudioTracks();
    if (audioTrack != null) {
      audioTrack.enabled = !isMuted;
      ws?.send(
        JSON.stringify({
          event: "TOGGLE_AUDIO",
          payload: { peerId, isMuted },
        })
      );
    }
  }, [localStream, isMuted, peerId, ws]);

  const toggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  return [isMuted, toggle];
}
