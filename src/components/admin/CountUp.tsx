import { useEffect, useRef, useState } from "react";

export const CountUp = ({ to, duration = 1200, decimals = 0, suffix = "" }: { to: number; duration?: number; decimals?: number; suffix?: string }) => {
  const [value, setValue] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    let frame: number;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      setValue(to * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <>{value.toFixed(decimals)}{suffix}</>;
};