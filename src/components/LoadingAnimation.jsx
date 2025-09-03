import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, LinearProgress } from '@mui/material';
import { darkMatteTheme } from '../theme/darkTheme';

const LoadingAnimation = ({ isLoading, progress = 0, message = 'Loading...' }) => {
  const logoVariants = {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1],
        type: "spring",
        stiffness: 200
      }
    },
  };

  const textVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3, 
        delay: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
  };

  const progressVariants = {
    initial: { scaleX: 0, opacity: 0 },
    animate: { 
      scaleX: 1, 
      opacity: 1,
      transition: { 
        duration: 0.3, 
        delay: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        '0px 0px 30px rgba(0, 212, 170, 0.3)',
        '0px 0px 60px rgba(0, 212, 170, 0.6)',
        '0px 0px 30px rgba(0, 212, 170, 0.3)',
      ],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const particleVariants = {
    animate: {
      y: [0, -20, 0],
      opacity: [0.3, 1, 0.3],
      scale: [1, 1.2, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: darkMatteTheme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: `linear-gradient(135deg, ${darkMatteTheme.palette.background.default} 0%, ${darkMatteTheme.palette.background.paper} 50%, ${darkMatteTheme.palette.background.paperElevated} 100%)`,
      }}
    >
      {/* Animated particles in background */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          variants={particleVariants}
          animate="animate"
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            backgroundColor: darkMatteTheme.palette.primary.main,
            borderRadius: '50%',
            left: `${20 + i * 10}%`,
            top: `${30 + Math.sin(i) * 20}%`,
            opacity: 0.6,
          }}
          transition={{ delay: i * 0.1 }}
        />
      ))}

      {/* Main logo/icon */}
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '120px',
          height: '120px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
          marginBottom: '32px',
          position: 'relative',
        }}
      >
        <motion.div
          variants={glowVariants}
          animate="animate"
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '28px',
            background: `linear-gradient(135deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
            opacity: 0.3,
            filter: 'blur(8px)',
            zIndex: -1,
          }}
        />
        
        {/* Logo Icon - Inventory Symbol */}
        <motion.svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          animate={{
            rotate: [0, 360],
            transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
          }}
        >
          <motion.path
            d="M12 2L2 7l10 5 10-5-10-5z"
            fill="#0A0A0A"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          <motion.path
            d="m2 17 10 5 10-5"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.path
            d="m2 12 10 5 10-5"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
          />
        </motion.svg>
      </motion.div>

      {/* Loading text */}
      <motion.div
        variants={textVariants}
        initial="initial"
        animate="animate"
        style={{ textAlign: 'center', marginBottom: '24px' }}
      >
        <Typography
          variant="h4"
          sx={{
            background: `linear-gradient(135deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          Inventory System
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ 
            color: darkMatteTheme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        variants={progressVariants}
        initial="initial"
        animate="animate"
        style={{ width: '300px', marginBottom: '16px' }}
      >
        <Box sx={{ width: '100%', mb: 1 }}>
          <motion.div
            style={{
              width: '100%',
              height: '6px',
              background: darkMatteTheme.palette.surface.secondary,
              borderRadius: '3px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
                borderRadius: '3px',
                position: 'absolute',
                left: 0,
                top: 0,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            
            {/* Animated shine effect */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
              animate={{
                left: ['−100%', '100%'],
                transition: {
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
          </motion.div>
        </Box>
        <Typography
          variant="caption"
          sx={{ 
            color: darkMatteTheme.palette.text.secondary,
            textAlign: 'center',
            display: 'block',
          }}
        >
          {Math.round(progress)}% Complete
        </Typography>
      </motion.div>

      {/* Floating dots indicator */}
      <motion.div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: darkMatteTheme.palette.primary.main,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default LoadingAnimation;
