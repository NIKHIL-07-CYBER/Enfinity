import React, { useState, useEffect, useRef } from "react";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";

const HIDE_VELOCITY_THRESHOLD = 5; // px per frame

/**
 * ChromeShell — Zero-Chrome aesthetic wrapper.
 *
 * Uses CSS transforms + opacity only (no layout properties) to
 * avoid layout shifts when the nav hides/shows during fast scrolls.
 * The 300ms transition matches the design specification.
 */
export const ChromeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { direction, velocity } = useScrollVelocity();
  const [isHidden, setIsHidden] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (direction === "down" && Math.abs(velocity) > HIDE_VELOCITY_THRESHOLD) {
      setIsHidden(true);
    } else if (direction === "up") {
      setIsHidden(false);
    }
  }, [direction, velocity]);

  return (
    <nav
      ref={navRef}
      className="chrome-shell fixed top-0 left-0 w-full z-50"
      style={{
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
        willChange: 'transform, opacity',
        contain: 'layout',
      }}
    >
      {children}
    </nav>
  );
};
