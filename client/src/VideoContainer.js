import "./VideoContainer.css";
import { useRef } from "react";

function VideoContainer({ stream }) {
  const videoElem = useRef(null);
  if (stream != null) {
    videoElem.current.srcObject = stream;
  }
  return (
    <div className="video-container">
      <video ref={videoElem} autoPlay playsInline></video>
    </div>
  );
}

export default VideoContainer;
