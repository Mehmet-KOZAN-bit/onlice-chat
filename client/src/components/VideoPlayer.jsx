import React, { useRef, useEffect } from 'react';

export const VideoPlayer = ({ stream, isLocal }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`w-full h-full object-contain bg-black ${isLocal ? 'transform scale-x-[-1]' : ''}`}
    />
  );
};
