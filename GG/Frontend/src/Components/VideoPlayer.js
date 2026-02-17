import React, { useEffect, useRef } from 'react';

export const VideoPlayer = ({ user }) => {
  const ref = useRef(null);

  useEffect(() => {
    
    if (!user || !user.videoTrack || !ref.current) {
      return;
    }

    try {
      user.videoTrack.play(ref.current);
    } catch (error) {
    }

    return () => {
      // Cleanup on unmount
      if (user?.videoTrack && ref.current) {
        try {
          user.videoTrack.stop();
        } catch (error) {
        }
      }
    };
  }, [user, user?.videoTrack]); // Re-run if user or track changes

  return (
    <div style={{ border: '2px solid #ccc', margin: '10px', padding: '10px' }}>
      <div>UID: {user?.uid || 'loading...'}</div>
      <div 
        ref={ref} 
        style={{ 
          width: '500px', 
          height: '375px',  // 4:3 aspect ratio
          backgroundColor: '#000',
          whiteSpace: 'pre-wrap' 
        }}
      />
    </div>
  );
};
