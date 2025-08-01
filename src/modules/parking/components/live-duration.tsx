// components/parking/LiveDuration.tsx
"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Timer } from 'lucide-react';

interface LiveDurationProps {
  startTime: string;
}

export function LiveDuration({ startTime }: LiveDurationProps) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const entryDate = new Date(startTime);

    // Function to update the duration
    const updateDuration = () => {
      const newDuration = formatDistanceToNow(entryDate, { addSuffix: false });
      setDuration(newDuration);
    };

    // Update immediately on mount
    updateDuration();

    // Set up an interval to update every minute
    const intervalId = setInterval(updateDuration, 60000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [startTime]); // Rerun effect if the startTime prop changes

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Timer className="h-4 w-4 text-sky-500" />
      <span>{duration}</span>
    </div>
  );
}