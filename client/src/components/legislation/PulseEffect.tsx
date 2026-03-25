import { motion } from "framer-motion";

interface PulseEffectProps {
  color?: string;
  size?: number;
  duration?: number;
  repeat?: number;
}

export default function PulseEffect({
  color = "rgba(59, 130, 246, 0.5)", // Default blue with transparency
  size = 100,
  duration = 1.5,
  repeat = 3
}: PulseEffectProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: color,
            width: size,
            height: size,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.5, 0],
            scale: [0.5, 1.5, 2],
          }}
          transition={{
            duration,
            repeat: repeat,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}