import React, { useEffect, useState } from "react";

/** Animated integer counter that runs once when it mounts. */
export function CountUp({ to = 0, duration = 1200, format = (v) => v.toLocaleString(), className = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className={`count-in ${className}`}>{format(val)}</span>;
}

export function Skeleton({ className = "", style }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/** Wraps children with fade-up animation on mount */
export function PageFade({ children }) {
  return <div className="page-in">{children}</div>;
}
