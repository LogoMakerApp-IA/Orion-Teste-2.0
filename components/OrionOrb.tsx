import React from 'react';
import { motion } from 'framer-motion';
import { OrionState } from '../types';
import { ORB_COLORS } from '../constants';

interface OrionOrbProps {
  state: OrionState;
  intensity: 'minimal' | 'balanced' | 'immersive';
}

const OrionOrb: React.FC<OrionOrbProps> = ({ state, intensity }) => {
  const baseColor = ORB_COLORS[state];

  // Animation variants
  const coreVariants = {
    [OrionState.Idle]: {
      scale: [1, 1.05, 1],
      opacity: 0.8,
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    [OrionState.Listening]: {
      scale: [1, 1.2, 1],
      opacity: 1,
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    [OrionState.Thinking]: {
      scale: [0.9, 1.1, 0.9],
      rotate: 360,
      borderRadius: ["50%", "40%", "50%"],
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    [OrionState.Responding]: {
      scale: [1, 1.1, 1],
      boxShadow: [`0 0 20px ${baseColor}`, `0 0 60px ${baseColor}`, `0 0 20px ${baseColor}`],
      transition: { duration: 2, repeat: Infinity }
    },
    [OrionState.Error]: {
      x: [-5, 5, -5, 5, 0],
      transition: { duration: 0.4 }
    }
  };

  const ringVariants = {
    [OrionState.Idle]: {
      scale: [1.2, 1.3, 1.2],
      opacity: 0.3,
      rotate: 180,
      transition: { duration: 10, repeat: Infinity, ease: "linear" }
    },
    [OrionState.Thinking]: {
      scale: [1.1, 1.5, 1.1],
      opacity: 0.5,
      rotate: -360,
      borderWidth: ["1px", "4px", "1px"],
      transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
    },
    [OrionState.Responding]: {
      scale: [1.2, 1.6, 1.2],
      opacity: [0.2, 0.6, 0.2],
      transition: { duration: 3, repeat: Infinity }
    }
  };

  // Adjust size based on intensity settings
  const sizeClass = intensity === 'minimal' ? 'w-16 h-16' : intensity === 'immersive' ? 'w-48 h-48' : 'w-32 h-32';

  return (
    <div className={`relative flex items-center justify-center ${intensity === 'immersive' ? 'my-12' : 'my-6'}`}>
      
      {/* Outer Ring 1 - Only visible in balanced/immersive */}
      {intensity !== 'minimal' && (
        <motion.div
          className="absolute rounded-full border border-current opacity-20"
          style={{ width: '160%', height: '160%', color: baseColor }}
          variants={ringVariants}
          animate={state === OrionState.Listening ? OrionState.Thinking : state} 
        />
      )}

      {/* Outer Ring 2 - Decorator */}
      {intensity === 'immersive' && (
         <motion.div
         className="absolute rounded-full border border-dashed border-current opacity-10"
         style={{ width: '220%', height: '220%', color: baseColor }}
         animate={{ rotate: 360 }}
         transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
       />
      )}

      {/* Core Orb */}
      <motion.div
        className={`${sizeClass} rounded-full blur-sm`}
        style={{ 
          background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${baseColor} 60%, ${baseColor} 100%)`,
          boxShadow: `0 0 30px ${baseColor}`
        }}
        variants={coreVariants}
        animate={state}
      />
      
      {/* Inner Highlight (The Eye Pupil) */}
      <div className="absolute w-2 h-2 bg-white rounded-full opacity-80 mix-blend-overlay" />
    </div>
  );
};

export default OrionOrb;
