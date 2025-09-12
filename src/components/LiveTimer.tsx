// src/components/timers/LiveTimer.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// Types
export interface TimeDifference {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
}

export interface LiveTimerProps {
  startDate: Date;
  showTotal?: boolean;
  className?: string;
  format?: "detailed" | "compact";
}

// Utility functions
export const calculateTimeDifference = (
  start: Date,
  end: Date = new Date()
): TimeDifference => {
  const totalMilliseconds = end.getTime() - start.getTime();
  if (totalMilliseconds < 0) {
    throw new Error("Start date must be before current date");
  }

  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Calculate time components
  let remaining = totalMilliseconds;

  const years = Math.floor(remaining / (365.25 * 24 * 60 * 60 * 1000));
  remaining %= 365.25 * 24 * 60 * 60 * 1000;

  const months = Math.floor(remaining / (30.44 * 24 * 60 * 60 * 1000));
  remaining %= 30.44 * 24 * 60 * 60 * 1000;

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  remaining %= 24 * 60 * 60 * 1000;

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  remaining %= 60 * 60 * 1000;

  const minutes = Math.floor(remaining / (60 * 1000));
  remaining %= 60 * 1000;

  const seconds = Math.floor(remaining / 1000);

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
  };
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const formatDetailedTime = (diff: TimeDifference): string => {
  const parts = [];

  if (diff.years > 0) {
    parts.push(`${diff.years} year${diff.years !== 1 ? "s" : ""}`);
  }

  if (diff.months > 0) {
    parts.push(`${diff.months} month${diff.months !== 1 ? "s" : ""}`);
  }

  if (diff.days > 0) {
    parts.push(`${diff.days} day${diff.days !== 1 ? "s" : ""}`);
  }

  if (diff.hours > 0) {
    parts.push(`${diff.hours} hour${diff.hours !== 1 ? "s" : ""}`);
  }

  if (diff.minutes > 0) {
    parts.push(`${diff.minutes} minute${diff.minutes !== 1 ? "s" : ""}`);
  }

  if (diff.seconds > 0 || parts.length === 0) {
    parts.push(`${diff.seconds} second${diff.seconds !== 1 ? "s" : ""}`);
  }

  return parts.join(", ");
};

// Sub-components
interface TimeDisplayTableProps {
  timeDiff: TimeDifference;
}

const TimeDisplayTable: React.FC<TimeDisplayTableProps> = ({ timeDiff }) => (
  <Table className="w-full text-md">
    <TableBody>
      {[
        { label: "Seconds", value: timeDiff.totalSeconds },
        { label: "Minutes", value: timeDiff.totalMinutes },
        { label: "Days", value: timeDiff.totalDays },
      ].map(({ label, value }, index) => (
        <TableRow key={label} className="hover:bg-unset">
          <TableCell
            className={
              "flex flex-row justify-between items-center gap-5 py-2 px-2.5"
            }
            style={{
              paddingTop: (index == 0 && "0.625rem") || "",
              paddingBottom: (index == 2 && "0.625rem") || "",
            }}
          >
            <span className="ps-1">{label}</span>
            <span className="pe-1">{formatNumber(value)}</span>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

interface TimeDisplayTextProps {
  timeDiff: TimeDifference;
  className?: string;
}

const TimeDisplayText: React.FC<TimeDisplayTextProps> = ({ timeDiff }) => (
  <span className="leading-7 mb-1 opacity-75 text-center px-5 text-md">
    {formatDetailedTime(timeDiff)}
  </span>
);

// Main component
export const LiveTimer: React.FC<LiveTimerProps> = ({
  startDate,
  showTotal = false,
  className = "",
}) => {
  const [timeDiff, setTimeDiff] = useState<TimeDifference>(() =>
    calculateTimeDifference(new Date(startDate))
  );
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const updateTimeDiff = useCallback(() => {
    const now = Date.now();
    // Only update if at least 1000ms have passed
    if (now - lastUpdateTimeRef.current >= 1000) {
      setTimeDiff(calculateTimeDifference(new Date(startDate)));
      lastUpdateTimeRef.current = now;
    }
    animationFrameRef.current = requestAnimationFrame(updateTimeDiff);
  }, [startDate]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateTimeDiff);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateTimeDiff]);

  return showTotal ? (
    <TimeDisplayTable timeDiff={timeDiff} />
  ) : (
    <TimeDisplayText timeDiff={timeDiff} className={className} />
  );
};

export default LiveTimer;
