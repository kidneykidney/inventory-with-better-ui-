import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { lightMinimalTheme } from '../theme/lightTheme';

const SimpleLoadingAnimation = ({ message = 'Loading...', progress, sx = {} }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        ...sx,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: '#3B82F6',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
      </Box>
      
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#1E293B',
          fontWeight: 600,
          mb: 1,
          fontSize: '1.125rem'
        }}
      >
        College Incubation Inventory System
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#64748B',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}
      >
        {message}
      </Typography>
      
      {progress !== undefined && (
        <Box sx={{ mt: 2, minWidth: 200 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1 
          }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {progress}%
            </Typography>
          </Box>
          <Box sx={{
            width: '100%',
            height: 4,
            backgroundColor: '#E2E8F0',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <Box sx={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              borderRadius: 2,
              transition: 'width 0.3s ease-in-out'
            }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SimpleLoadingAnimation;
