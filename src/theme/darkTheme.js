import { createTheme } from '@mui/material/styles';

// Professional Dark Matte Theme
export const darkMatteTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4AA', // Vibrant teal
      light: '#2DDFC7',
      dark: '#00A17A',
      contrastText: '#0A0A0A',
    },
    secondary: {
      main: '#6C63FF', // Electric purple
      light: '#8A84FF',
      dark: '#4C46C7',
      contrastText: '#FFFFFF',
    },
    accent: {
      main: '#FF6B6B', // Coral accent
      light: '#FF8A8A',
      dark: '#E55555',
    },
    background: {
      default: '#0A0A0A', // Deep black
      paper: '#151515', // Matte black
      paperElevated: '#1E1E1E', // Elevated surfaces
      gradient: 'linear-gradient(135deg, #0A0A0A 0%, #151515 50%, #1E1E1E 100%)',
    },
    surface: {
      primary: '#1E1E1E',
      secondary: '#2A2A2A',
      tertiary: '#353535',
    },
    text: {
      primary: '#F5F5F5', // Almost white
      secondary: '#B3B3B3', // Light gray
      disabled: '#6B7280',
      accent: '#00D4AA',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    divider: '#2A2A2A',
    action: {
      active: '#F5F5F5',
      hover: 'rgba(245, 245, 245, 0.08)',
      selected: 'rgba(0, 212, 170, 0.12)',
      disabled: 'rgba(245, 245, 245, 0.26)',
      disabledBackground: 'rgba(245, 245, 245, 0.12)',
      focus: 'rgba(0, 212, 170, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2.125rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#B3B3B3',
    },
    subtitle2: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#B3B3B3',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#B3B3B3',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.2)',
    '0px 4px 8px rgba(0, 0, 0, 0.2)',
    '0px 8px 16px rgba(0, 0, 0, 0.3)',
    '0px 12px 24px rgba(0, 0, 0, 0.3)',
    '0px 16px 32px rgba(0, 0, 0, 0.4)',
    '0px 20px 40px rgba(0, 0, 0, 0.4)',
    '0px 24px 48px rgba(0, 0, 0, 0.5)',
    '0px 28px 56px rgba(0, 0, 0, 0.5)',
    '0px 32px 64px rgba(0, 0, 0, 0.6)',
    // Glow effects for interactive elements
    '0px 0px 20px rgba(0, 212, 170, 0.3)',
    '0px 0px 30px rgba(108, 99, 255, 0.3)',
    '0px 0px 40px rgba(255, 107, 107, 0.3)',
    // Custom shadows
    'inset 0px 1px 0px rgba(255, 255, 255, 0.1)',
    '0px 4px 20px rgba(0, 0, 0, 0.7)',
    '0px 8px 30px rgba(0, 0, 0, 0.8)',
    '0px 12px 40px rgba(0, 0, 0, 0.9)',
    '0px 16px 50px rgba(0, 0, 0, 1)',
    // Glass morphism
    '0px 8px 32px rgba(0, 0, 0, 0.3), inset 0px 1px 0px rgba(255, 255, 255, 0.1)',
    '0px 12px 40px rgba(0, 0, 0, 0.4), inset 0px 1px 0px rgba(255, 255, 255, 0.1)',
    // Special effects
    '0px 0px 0px 1px rgba(0, 212, 170, 0.5), 0px 4px 20px rgba(0, 212, 170, 0.2)',
    '0px 0px 0px 1px rgba(108, 99, 255, 0.5), 0px 4px 20px rgba(108, 99, 255, 0.2)',
    '0px 0px 0px 1px rgba(255, 107, 107, 0.5), 0px 4px 20px rgba(255, 107, 107, 0.2)',
    '0px 0px 100px rgba(0, 212, 170, 0.4)',
    '0px 0px 120px rgba(108, 99, 255, 0.4)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 212, 170, 0.2) #0A0A0A',
          // Modern animated scrollbar for webkit browsers
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'linear-gradient(180deg, #0A0A0A 0%, #151515 50%, #0A0A0A 100%)',
            borderRadius: '8px',
            border: '1px solid #1E1E1E',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 161, 122, 0.15) 50%, rgba(108, 99, 255, 0.2) 100%)',
            borderRadius: '8px',
            border: '2px solid #151515',
            boxShadow: '0px 0px 5px rgba(0, 212, 170, 0.1), inset 0px 1px 0px rgba(255, 255, 255, 0.03)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.35) 0%, rgba(0, 212, 170, 0.25) 50%, rgba(108, 99, 255, 0.35) 100%)',
              boxShadow: '0px 0px 8px rgba(0, 212, 170, 0.15), inset 0px 1px 0px rgba(255, 255, 255, 0.05)',
              transform: 'scaleX(1.1)',
            },
            '&:active': {
              background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.4) 0%, rgba(0, 161, 122, 0.3) 50%, rgba(108, 99, 255, 0.4) 100%)',
              boxShadow: '0px 0px 10px rgba(0, 212, 170, 0.2)',
            },
          },
          '&::-webkit-scrollbar-corner': {
            background: '#0A0A0A',
          },
          // Custom scrollbar for horizontal scrolling
          '&::-webkit-scrollbar:horizontal': {
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb:horizontal': {
            background: 'linear-gradient(90deg, rgba(0, 212, 170, 0.2) 0%, rgba(108, 99, 255, 0.2) 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, rgba(0, 212, 170, 0.35) 0%, rgba(108, 99, 255, 0.35) 100%)',
              transform: 'scaleY(1.1)',
            },
          },
        },
        // Global scrollbar styles for all elements
        '*': {
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(42, 42, 42, 0.2)',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(45deg, rgba(0, 212, 170, 0.25) 0%, rgba(108, 99, 255, 0.25) 100%)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(45deg, rgba(0, 212, 170, 0.4) 0%, rgba(108, 99, 255, 0.4) 100%)',
              boxShadow: '0px 0px 6px rgba(0, 212, 170, 0.15)',
              transform: 'scale(1.05)',
            },
            '&:active': {
              background: 'linear-gradient(45deg, rgba(0, 212, 170, 0.5) 0%, rgba(108, 99, 255, 0.5) 100%)',
              boxShadow: '0px 0px 8px rgba(0, 212, 170, 0.2)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #151515 0%, #1E1E1E 50%, #2A2A2A 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #2A2A2A',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.7)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #151515 0%, #1E1E1E 100%)',
          borderRight: '1px solid #2A2A2A',
          // Enhanced animated scrollbar for sidebar
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.4) 0%, rgba(108, 99, 255, 0.4) 100%)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.7) 0%, rgba(108, 99, 255, 0.7) 100%)',
              boxShadow: '0px 0px 12px rgba(0, 212, 170, 0.3)',
              transform: 'scaleX(1.5)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
            },
            '&:active': {
              background: 'linear-gradient(180deg, #00D4AA 0%, #6C63FF 100%)',
              boxShadow: '0px 0px 18px rgba(0, 212, 170, 0.5)',
              transform: 'scaleX(1.2)',
            },
          },
          // Add smooth scrolling animation
          scrollBehavior: 'smooth',
          '&:hover': {
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.6) 0%, rgba(108, 99, 255, 0.6) 100%)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#151515',
          border: '1px solid #2A2A2A',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: '#353535',
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.4)',
          },
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
        },
        elevation2: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        },
        elevation3: {
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #151515 0%, #1E1E1E 100%)',
          border: '1px solid #2A2A2A',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.6), 0px 0px 20px rgba(0, 212, 170, 0.1)',
            borderColor: '#00D4AA',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00D4AA 0%, #00A17A 100%)',
          color: '#0A0A0A',
          boxShadow: '0px 4px 16px rgba(0, 212, 170, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2DDFC7 0%, #00D4AA 100%)',
            boxShadow: '0px 8px 24px rgba(0, 212, 170, 0.4)',
          },
          '&:active': {
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: '#2A2A2A',
          color: '#F5F5F5',
          '&:hover': {
            borderColor: '#00D4AA',
            backgroundColor: 'rgba(0, 212, 170, 0.08)',
            color: '#00D4AA',
          },
        },
        text: {
          color: '#B3B3B3',
          '&:hover': {
            backgroundColor: 'rgba(245, 245, 245, 0.08)',
            color: '#F5F5F5',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #00D4AA 0%, #00A17A 100%)',
          color: '#0A0A0A',
          boxShadow: '0px 6px 20px rgba(0, 212, 170, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2DDFC7 0%, #00D4AA 100%)',
            transform: 'translateY(-4px) scale(1.05)',
            boxShadow: '0px 12px 30px rgba(0, 212, 170, 0.5)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(245, 245, 245, 0.02)',
            borderRadius: '12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: '#2A2A2A',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
              borderColor: '#353535',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00D4AA',
              boxShadow: '0px 0px 0px 3px rgba(0, 212, 170, 0.1)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#B3B3B3',
            '&.Mui-focused': {
              color: '#00D4AA',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#2A2A2A',
          color: '#F5F5F5',
          borderRadius: '8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: '#353535',
            transform: 'translateY(-1px)',
          },
        },
        colorPrimary: {
          backgroundColor: 'rgba(0, 212, 170, 0.2)',
          color: '#00D4AA',
          border: '1px solid rgba(0, 212, 170, 0.3)',
        },
        colorSecondary: {
          backgroundColor: 'rgba(108, 99, 255, 0.2)',
          color: '#6C63FF',
          border: '1px solid rgba(108, 99, 255, 0.3)',
        },
        colorSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
        colorWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          color: '#F59E0B',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        },
        colorError: {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#EF4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(245, 245, 245, 0.08)',
            transform: 'translateY(-2px) scale(1.05)',
          },
        },
        colorPrimary: {
          color: '#00D4AA',
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
          },
        },
        colorSecondary: {
          color: '#6C63FF',
          '&:hover': {
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 170, 0.08)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 212, 170, 0.15)',
            borderLeft: '3px solid #00D4AA',
            '&:hover': {
              backgroundColor: 'rgba(0, 212, 170, 0.2)',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(145deg, #151515 0%, #1E1E1E 100%)',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2A2A2A',
          color: '#F5F5F5',
          fontSize: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #353535',
          backdropFilter: 'blur(10px)',
        },
        arrow: {
          color: '#2A2A2A',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
          },
        },
      },
    },
  },
});

// Animation variants for framer-motion
export const animationVariants = {
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },
  cardHover: {
    whileHover: {
      scale: 1.03,
      y: -8,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    whileTap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },
  buttonHover: {
    whileHover: {
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2 },
    },
    whileTap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  },
  glowPulse: {
    animate: {
      boxShadow: [
        '0px 0px 20px rgba(0, 212, 170, 0.3)',
        '0px 0px 40px rgba(0, 212, 170, 0.5)',
        '0px 0px 20px rgba(0, 212, 170, 0.3)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
};

// Utility functions for theme
export const getGradientBackground = (colors) => {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
};

export const getGlassMorphismStyles = (blur = 20, opacity = 0.1) => ({
  backdropFilter: `blur(${blur}px)`,
  background: `rgba(255, 255, 255, ${opacity})`,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
});

export const getNeonGlow = (color, intensity = 0.3) => ({
  boxShadow: `0px 0px 20px rgba(${color}, ${intensity})`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
});
