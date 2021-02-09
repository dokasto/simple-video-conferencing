import "./VideoContainer.css";
import { useRef, useEffect } from "react";

function VideoContainer({ stream }) {
  const videoElem = useRef(null);

  useEffect(() => {
    if (stream != null && videoElem.current != null) {
      videoElem.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container">
      <video ref={videoElem} autoPlay playsInline />
    </div>
  );
}

export default VideoContainer;
