import { useState, useEffect, useRef } from 'react';

export const useScrollVelocity = () => {
  const [direction, setDirection] = useState<'up' | 'down' | 'idle'>('idle');
  const [velocity, setVelocity] = useState(0);
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const lastT = useRef(Date.now());
  const idleTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const currentT = Date.now();
      
      const deltaY = currentY - lastY.current;
      const deltaT = currentT - lastT.current;

      if (deltaT > 0) {
        const vel = deltaY / deltaT;
        setVelocity(vel);

        if (vel > 0.1) {
          setDirection('down');
        } else if (vel < -0.1) {
          setDirection('up');
        }
      }

      lastY.current = currentY;
      lastT.current = currentT;

      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current);
      }

      idleTimeout.current = setTimeout(() => {
        setDirection('idle');
        setVelocity(0);
      }, 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current);
      }
    };
  }, []);

  return { velocity, direction };
};
