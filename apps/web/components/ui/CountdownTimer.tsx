import { useEffect, useState } from "react";

interface CountdownTimerProps {
  /** ISO string or date string representing the end time */
  endsAt: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Displays a live countdown. If remaining time > 1 hour, shows "DD:HH:MM:SS".
 * Otherwise shows "MM:SS" or just seconds.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endsAt, className }) => {
  const calculateRemaining = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    return Math.max(diff, 0);
  };

  const [remaining, setRemaining] = useState<number>(() => calculateRemaining(endsAt));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(calculateRemaining(endsAt));
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const days = Math.floor(totalSeconds / 86400);

  const pad = (n: number) => String(n).padStart(2, "0");

  const formatted = days
    ? `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : hours
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <span className={`inline-block font-mono text-sm text-red-600 ${className ?? ""}`}>⏳ {formatted}</span>
  );
};
