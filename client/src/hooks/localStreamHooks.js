//@flow
import { useRecoilCallback, useRecoilState, useRecoilValue } from "recoil";
import { localStreamAtom } from "atoms/localStreamAtom";
import { useCallback, useState, useEffect } from "react";
import { connectionAtom, peerConnectionsAtom } from "atoms/connectionAtom";

export function useIsScreenSharing() {
  const localStream = useRecoilValue(localStreamAtom);
  return useCallback(() => {
    if (localStream == null) {
      return;
    }
    const [videoTrack] = localStream.getVideoTracks();
    return videoTrack?.label.toLocaleLowerCase().includes("screen") ?? false;
  }, [localStream]);
}

export function useReplaceVideo() {
  return useRecoilCallback(({ set, snapshot }) => async (stream) => {
    const peerConnections = await snapshot.getPromise(peerConnectionsAtom);
    peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s?.track.kind === "video");
      sender?.replaceTrack(stream?.getVideoTracks()[0]);
    });
    set(localStreamAtom, stream);
  });
}

export function useStopScreenShare() {
  const replaceVideo = useReplaceVideo();
  return useRecoilCallback(({ set }) => async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      await replaceVideo(stream);
    } catch (e) {
      console.error("stop screen share", e);
    }
  });
}

export function useStartScreenShare() {
  const replaceVideo = useReplaceVideo();
  return useRecoilCallback(({ set, snapshot }) => async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia();
      await replaceVideo(stream);
    } catch (e) {
      console.error("Screen share", e);
    }
  });
}

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
