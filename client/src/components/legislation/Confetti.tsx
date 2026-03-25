import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ConfettiPieceProps {
  x: number;
  y: number;
  color: string;
  delay: number;
}

function ConfettiPiece({ x, y, color, delay }: ConfettiPieceProps) {
  return (
    <motion.div
      className="absolute w-2 h-4 rounded-sm"
      style={{ 
        backgroundColor: color, 
        left: `${x}%`, 
        top: 0,
        originX: "50%",
        originY: "0%"
      }}
      initial={{ opacity: 0, y: -20, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [`${y}%`, `${y + 100}%`],
        rotate: [0, Math.random() > 0.5 ? 360 : -360],
        x: [0, Math.random() * 40 - 20],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
}

interface ConfettiProps {
  count?: number;
  duration?: number;
  isActive: boolean;
}

export default function Confetti({ 
  count = 50, 
  duration = 3000,
  isActive
}: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (!isActive) return;
    
    const colors = [
      "#1d4ed8", // blue-700
      "#be123c", // rose-700
      "#15803d", // green-700 
      "#b45309", // amber-700
      "#7e22ce", // purple-700
    ];

    const newPieces = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [count, duration, isActive]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          x={piece.x}
          y={piece.y}
          color={piece.color}
          delay={piece.delay}
        />
      ))}
    </div>
  );
}