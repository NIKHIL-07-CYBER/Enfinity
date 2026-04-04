import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";

const HIDE_VELOCITY_THRESHOLD = 5; // px per frame

const variants = {
  visible: { opacity: 1, y: 0, pointerEvents: "auto" as const },
  hidden: { opacity: 0, y: -64, pointerEvents: "none" as const },
};

export const ChromeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { direction, velocity } = useScrollVelocity();
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (direction === "down" && Math.abs(velocity) > HIDE_VELOCITY_THRESHOLD) {
      setIsHidden(true);
    } else if (direction === "up") {
      setIsHidden(false);
    }
  }, [direction, velocity]);

  return (
    <motion.nav
      variants={variants}
      initial="visible"
      animate={isHidden ? "hidden" : "visible"}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed top-0 left-0 w-full z-50"
    >
      {children}
    </motion.nav>
  );
};
