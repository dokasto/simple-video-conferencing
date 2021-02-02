import { useRecoilState } from "recoil";
import { localStreamAtom } from "../atoms/localStreamAtom";
import { useCallback } from "react";

function useGetLocalStream() {
  const [localStream, setLocalStream] = useRecoilState(localStreamAtom);
  return useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalStream(stream);
  }, [localStream]);
}

export { useGetLocalStream };
