import React from 'react';
import { Card as MuiCard, Box, Button, Chip, CircularProgress } from '@mui/material';
import { lightMinimalTheme } from '../theme/lightTheme';

// Simple Card Component - No animations
export const SimpleCard = ({ children, sx = {}, elevation = 1, ...props }) => {
  return (
    <MuiCard
      elevation={elevation}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiCard>
  );
};

// Simple Button Component - Clean and minimal
export const SimpleButton = ({ 
  children, 
  variant = 'contained', 
  color = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium',
  sx = {},
  ...props 
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      sx={{
        borderRadius: 2,
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

// Simple Badge Component - Clean status indicator
export const SimpleBadge = ({ 
  children, 
  color = 'primary', 
  variant = 'filled',
  size = 'small',
  sx = {},
  ...props 
}) => {
  return (
    <Chip
      label={children}
      color={color}
      variant={variant}
      size={size}
      sx={{
        borderRadius: 1.5,
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        ...sx,
      }}
      {...props}
    />
  );
};

// Simple Progress Bar Component
export const SimpleProgressBar = ({ progress = 0, height = 8, color = 'primary', sx = {} }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: height,
        backgroundColor: '#F1F5F9',
        borderRadius: height / 2,
        overflow: 'hidden',
        position: 'relative',
        ...sx,
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, progress))}%`,
          backgroundColor: color === 'primary' ? '#3B82F6' : 
                          color === 'success' ? '#10B981' :
                          color === 'warning' ? '#F59E0B' :
                          color === 'error' ? '#EF4444' : '#3B82F6',
          borderRadius: height / 2,
          transition: 'width 0.3s ease-in-out',
        }}
      />
    </Box>
  );
};

// Simple Loading Component - Clean spinner
export const SimpleLoading = ({ size = 40, color = 'primary', message, sx = {} }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        ...sx,
      }}
    >
      <CircularProgress 
        size={size} 
        sx={{ 
          color: color === 'primary' ? '#3B82F6' : 
                 color === 'secondary' ? '#6B7280' : '#3B82F6'
        }} 
      />
      {message && (
        <Box
          component="span"
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {message}
        </Box>
      )}
    </Box>
  );
};

// Simple Container Component - Clean layout wrapper
export const SimpleContainer = ({ children, maxWidth = 'lg', sx = {}, ...props }) => {
  return (
    <Box
      sx={{
        maxWidth: maxWidth === 'xs' ? '444px' :
                 maxWidth === 'sm' ? '768px' :
                 maxWidth === 'md' ? '1024px' :
                 maxWidth === 'lg' ? '1280px' :
                 maxWidth === 'xl' ? '1536px' : maxWidth,
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Simple Section Component - Clean content sections
export const SimpleSection = ({ 
  title, 
  description, 
  children, 
  headerAction,
  sx = {},
  ...props 
}) => {
  return (
    <Box sx={{ mb: 4, ...sx }} {...props}>
      {(title || description || headerAction) && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            {title && (
              <Box
                component="h2"
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: description ? 0.5 : 0,
                  mt: 0,
                }}
              >
                {title}
              </Box>
            )}
            {description && (
              <Box
                component="p"
                sx={{
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  mt: 0,
                  mb: 0,
                }}
              >
                {description}
              </Box>
            )}
          </Box>
          {headerAction && (
            <Box sx={{ flexShrink: 0, ml: 2 }}>
              {headerAction}
            </Box>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
};

// Simple Grid Component - Clean responsive grid
export const SimpleGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 3,
  sx = {},
  ...props 
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(${cols.xs}, 1fr)`,
          sm: `repeat(${cols.sm || cols.xs}, 1fr)`,
          md: `repeat(${cols.md || cols.sm || cols.xs}, 1fr)`,
          lg: `repeat(${cols.lg || cols.md || cols.sm || cols.xs}, 1fr)`,
          xl: `repeat(${cols.xl || cols.lg || cols.md || cols.sm || cols.xs}, 1fr)`,
        },
        gap: gap,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Simple Stats Card Component
export const SimpleStatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  sx = {},
  ...props 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'neutral': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <SimpleCard sx={{ p: 3, ...sx }} {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box
          component="span"
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {title}
        </Box>
        {icon && (
          <Box sx={{ color: 'text.secondary' }}>
            {icon}
          </Box>
        )}
      </Box>
      
      <Box
        component="span"
        sx={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'text.primary',
          lineHeight: 1.2,
          display: 'block',
          mb: change ? 1 : 0,
        }}
      >
        {value}
      </Box>
      
      {change && (
        <Box
          component="span"
          sx={{
            fontSize: '0.8125rem',
            color: getChangeColor(),
            fontWeight: 500,
          }}
        >
          {change}
        </Box>
      )}
    </SimpleCard>
  );
};

export default {
  SimpleCard,
  SimpleButton,
  SimpleBadge,
  SimpleProgressBar,
  SimpleLoading,
  SimpleContainer,
  SimpleSection,
  SimpleGrid,
  SimpleStatsCard,
};
