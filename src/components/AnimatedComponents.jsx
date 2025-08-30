import React from 'react';
import { motion } from 'framer-motion';
import { Card as MuiCard, Box } from '@mui/material';
import { animationVariants } from '../theme/darkTheme';

export const AnimatedCard = ({ children, delay = 0, sx = {}, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.4, 0, 0.2, 1] 
      }}
      whileHover={{
        scale: 1.005,  // Minimal scale to prevent layout issues
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.998 }}
      style={{ 
        overflow: 'visible',
        width: '100%',
        position: 'relative'
      }}
    >
      <MuiCard
        {...props}
        sx={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'visible',  // Prevent button clipping
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
          '&:hover': {
            boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.6), 0px 0px 20px rgba(0, 212, 170, 0.1)',
            borderColor: 'primary.main',
          },
          // Merge any custom styles
          ...sx,
        }}
      >
        {children}
      </MuiCard>
    </motion.div>
  );
};

export const AnimatedButton = ({ children, variant = "contained", startIcon, endIcon, disabled = false, onClick, sx = {}, ...props }) => {
  return (
    <motion.div
      whileHover={!disabled ? {
        scale: 1.02,  // Reduced scale to prevent overflow
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!disabled ? {
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      style={{ 
        display: 'inline-block',
        // Ensure the button stays within bounds during animation
        overflow: 'visible',
        position: 'relative',
        // Better accessibility
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none'
      }}
    >
      <motion.button
        style={{
          background: variant === 'contained' ? 
            (disabled ? '#3A3A3A' : 'linear-gradient(135deg, #00D4AA 0%, #00A17A 100%)') :
            'rgba(0, 0, 0, 0)',
          color: variant === 'contained' ? 
            (disabled ? '#6A6A6A' : '#0A0A0A') : 
            (disabled ? '#6A6A6A' : '#00D4AA'),
          padding: '12px 24px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: variant === 'outlined' ? 
            (disabled ? '1px solid #3A3A3A' : '1px solid #2A2A2A') : 
            'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: disabled ? 0.6 : 1,
          // Enhanced accessibility and interaction
          outline: 'none',
          userSelect: 'none',
          touchAction: 'manipulation',
          // Merge custom styles
          ...sx,
        }}
        whileHover={!disabled ? {
          background: variant === 'contained' ? 
            'linear-gradient(135deg, #2DDFC7 0%, #00D4AA 100%)' :
            'rgba(0, 212, 170, 0.08)',
          boxShadow: variant === 'contained' ? 
            '0px 8px 24px rgba(0, 212, 170, 0.4)' :
            'none',
        } : {}}
        onFocus={(e) => {
          // Add focus styles for keyboard accessibility
          e.target.style.outline = '2px solid #00D4AA';
          e.target.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          // Remove focus styles
          e.target.style.outline = 'none';
        }}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {startIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{startIcon}</span>}
        {children}
        {endIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{endIcon}</span>}
      </motion.button>
    </motion.div>
  );
};

export const AnimatedIconButton = ({ children, color = "primary", ...props }) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.1,
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: 0.9,
        transition: { duration: 0.1 }
      }}
      style={{ display: 'inline-block' }}
    >
      <motion.button
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          border: 'none',
          background: 'rgba(245, 245, 245, 0.08)',
          color: color === 'primary' ? '#00D4AA' : '#F5F5F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        whileHover={{
          backgroundColor: color === 'primary' ? 
            'rgba(0, 212, 170, 0.1)' : 
            'rgba(245, 245, 245, 0.12)',
        }}
        {...props}
      >
        {children}
      </motion.button>
    </motion.div>
  );
};

export const AnimatedFab = ({ children, ...props }) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.1,
        y: -4,
        transition: { duration: 0.3 }
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      style={{ display: 'inline-block' }}
    >
      <motion.button
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(135deg, #00D4AA 0%, #00A17A 100%)',
          color: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0px 6px 20px rgba(0, 212, 170, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        whileHover={{
          background: 'linear-gradient(135deg, #2DDFC7 0%, #00D4AA 100%)',
          boxShadow: '0px 12px 30px rgba(0, 212, 170, 0.5)',
        }}
        animate={{
          boxShadow: [
            '0px 6px 20px rgba(0, 212, 170, 0.4)',
            '0px 8px 25px rgba(0, 212, 170, 0.5)',
            '0px 6px 20px rgba(0, 212, 170, 0.4)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        {...props}
      >
        {children}
      </motion.button>
    </motion.div>
  );
};

export const AnimatedContainer = ({ children, delay = 0, stagger = false, ...props }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        ...(stagger && {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        }),
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {stagger ? (
        React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        children
      )}
    </motion.div>
  );
};

export const AnimatedGrid = ({ children, columns = 3, gap = 3, ...props }) => {
  return (
    <motion.div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 8}px`,
      }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.95 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const AnimatedChip = ({ children, color = "default", ...props }) => {
  return (
    <motion.div
      style={{ display: 'inline-block' }}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: color === 'primary' ? 'rgba(0, 212, 170, 0.2)' : '#2A2A2A',
          color: color === 'primary' ? '#00D4AA' : '#F5F5F5',
          border: color === 'primary' ? '1px solid rgba(0, 212, 170, 0.3)' : '1px solid #353535',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        whileHover={{
          backgroundColor: color === 'primary' ? 'rgba(0, 212, 170, 0.3)' : '#353535',
        }}
        {...props}
      >
        {children}
      </motion.span>
    </motion.div>
  );
};

export const AnimatedProgressBar = ({ progress = 0, ...props }) => {
  return (
    <motion.div
      style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#2A2A2A',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative',
      }}
      {...props}
    >
      <motion.div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #00D4AA 0%, #6C63FF 100%)',
          borderRadius: '3px',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      
      {/* Shine effect */}
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
          left: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};

export const AnimatedBadge = ({ children, count = 0, ...props }) => {
  return (
    <motion.div style={{ position: 'relative', display: 'inline-block' }} {...props}>
      {children}
      {count > 0 && (
        <motion.div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            minWidth: '20px',
            height: '20px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #E55555 100%)',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            boxShadow: '0px 2px 8px rgba(255, 107, 107, 0.4)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 30 
          }}
          whileHover={{ scale: 1.1 }}
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </motion.div>
  );
};

export const GlowEffect = ({ children, color = '0, 212, 170', intensity = 0.3, ...props }) => {
  return (
    <motion.div
      style={{
        filter: `drop-shadow(0px 0px 20px rgba(${color}, ${intensity}))`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      whileHover={{
        filter: `drop-shadow(0px 0px 30px rgba(${color}, ${intensity * 1.5}))`,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
