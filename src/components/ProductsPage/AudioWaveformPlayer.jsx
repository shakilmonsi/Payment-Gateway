import React, { useState, useEffect, useRef } from "react";

const AudioWaveformPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedBarsCount, setPlayedBarsCount] = useState(0);
  const animationFrameId = useRef(null);
  const barHeights = useRef([]); // To store initial random heights for each bar
  const totalBars = 75; // 30 yellow + 45 white from your code

  // Initialize bar heights only once when the component mounts
  useEffect(() => {
    if (barHeights.current.length === 0) {
      barHeights.current = Array.from({ length: totalBars }).map(() =>
        getRandomHeight(),
      );
    }
  }, []);

  // Function to generate a random height for the waveform bars
  const getRandomHeight = () => {
    return Math.floor(Math.random() * (24 - 8 + 1)) + 8; // Heights between 8px and 24px
  };

  // Animation loop for playing the "song" and animating bar heights
  useEffect(() => {
    let lastUpdateTime = 0;
    const updateInterval = 100; // Milliseconds to update bar colors and heights

    const animateBars = (currentTime) => {
      if (!lastUpdateTime) lastUpdateTime = currentTime;
      const deltaTime = currentTime - lastUpdateTime;

      if (deltaTime > updateInterval) {
        setPlayedBarsCount((prevCount) => {
          if (prevCount < totalBars) {
            // Update heights for all bars to create the "up and down" effect
            barHeights.current = barHeights.current.map(() =>
              getRandomHeight(),
            );
            lastUpdateTime = currentTime;
            return prevCount + 1; // Move to the next bar
          } else {
            // Song finished, stop playing and reset
            setIsPlaying(false);
            return 0; // Reset for next play
          }
        });
      }
      animationFrameId.current = requestAnimationFrame(animateBars);
    };

    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(animateBars);
    } else {
      cancelAnimationFrame(animationFrameId.current);
    }

    // Cleanup function
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isPlaying, totalBars]); // Depend on isPlaying and totalBars

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    // If starting to play and already at the end, reset played bars
    if (!isPlaying && playedBarsCount === totalBars) {
      setPlayedBarsCount(0);
      // Re-initialize heights if starting over
      barHeights.current = Array.from({ length: totalBars }).map(() =>
        getRandomHeight(),
      );
    }
  };

  // Generate all bars dynamically based on playedBarsCount and animated heights
  const allBars = Array.from({ length: totalBars }).map((_, index) => {
    const isPlayed = index < playedBarsCount;
    const barColorClass = isPlayed ? "bg-[#E2B64E]" : "bg-gray-300"; // Use your specific yellow color

    return (
      <div
        key={`bar-${index}`}
        className={`w-0.5 rounded-full ${barColorClass}`}
        style={{
          height: `${barHeights.current[index] || getRandomHeight()}px`,
        }} // Use stored height or generate if not available
      ></div>
    );
  });

  return (
    <div className="flex items-center space-x-1.5 rounded-lg bg-gray-900 p-4">
      {/* Play/Pause Button */}
      <div
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-700"
        onClick={togglePlay}
      >
        {isPlaying ? (
          // Pause icon
          <svg
            className="h-4 w-4 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          // Play icon
          <svg
            className="h-4 w-4 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      {/* Waveform Container */}
      <div className="flex items-center space-x-0.5">
        {allBars} {/* Render all bars here */}
      </div>
    </div>
  );
};

export default AudioWaveformPlayer;
