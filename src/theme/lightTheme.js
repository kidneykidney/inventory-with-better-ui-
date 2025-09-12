import { createTheme } from '@mui/material/styles';

// Modern Light Minimalistic Theme
export const lightMinimalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6', // Clean blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B7280', // Neutral gray
      light: '#9CA3AF',
      dark: '#4B5563',
      contrastText: '#FFFFFF',
    },
    accent: {
      main: '#10B981', // Clean green
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#F8FAFC', // Very light gray-blue
      paper: '#FFFFFF', // Pure white
      paperElevated: '#FFFFFF',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F1F5F9',
      tertiary: '#E2E8F0',
    },
    text: {
      primary: '#1E293B', // Dark slate
      secondary: '#64748B', // Medium slate
      disabled: '#94A3B8',
      accent: '#3B82F6',
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
    divider: '#E2E8F0',
    action: {
      active: '#1E293B',
      hover: 'rgba(59, 130, 246, 0.04)',
      selected: 'rgba(59, 130, 246, 0.08)',
      disabled: 'rgba(30, 41, 59, 0.26)',
      disabledBackground: 'rgba(30, 41, 59, 0.12)',
      focus: 'rgba(59, 130, 246, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
      color: '#1E293B',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
      color: '#1E293B',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1E293B',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1E293B',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#1E293B',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#1E293B',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#64748B',
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.6,
      color: '#64748B',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#94A3B8',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#94A3B8',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    // Larger shadows
    '0 2px 4px rgba(0, 0, 0, 0.06)',
    '0 4px 8px rgba(0, 0, 0, 0.06)',
    '0 8px 16px rgba(0, 0, 0, 0.06)',
    '0 16px 32px rgba(0, 0, 0, 0.06)',
    '0 24px 48px rgba(0, 0, 0, 0.06)',
    // Focus shadows
    '0 0 0 3px rgba(59, 130, 246, 0.1)',
    '0 0 0 3px rgba(16, 185, 129, 0.1)',
    '0 0 0 3px rgba(239, 68, 68, 0.1)',
    '0 0 0 3px rgba(245, 158, 11, 0.1)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148, 163, 184, 0.5) #F8FAFC',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F8FAFC',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(148, 163, 184, 0.5)',
            borderRadius: '4px',
            border: '2px solid #F8FAFC',
            '&:hover': {
              background: 'rgba(148, 163, 184, 0.7)',
            },
          },
        },
        '*': {
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(148, 163, 184, 0.3)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(148, 163, 184, 0.5)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          transition: 'all 0.2s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: '#CBD5E1',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 500,
          fontSize: '0.875rem',
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          background: '#3B82F6',
          color: '#FFFFFF',
          '&:hover': {
            background: '#2563EB',
          },
          '&:active': {
            background: '#1D4ED8',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#64748B',
          '&:hover': {
            borderColor: '#3B82F6',
            color: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
          },
        },
        text: {
          color: '#64748B',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
            color: '#3B82F6',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: '#3B82F6',
          color: '#FFFFFF',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            background: '#2563EB',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3B82F6',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#64748B',
            '&.Mui-focused': {
              color: '#3B82F6',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          borderRadius: '6px',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#E2E8F0',
          },
        },
        colorPrimary: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
          },
        },
        colorSecondary: {
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          color: '#6B7280',
          '&:hover': {
            backgroundColor: 'rgba(107, 114, 128, 0.2)',
          },
        },
        colorSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#10B981',
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
          },
        },
        colorWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#F59E0B',
          '&:hover': {
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
          },
        },
        colorError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#EF4444',
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          color: '#64748B',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
            color: '#3B82F6',
          },
        },
        colorPrimary: {
          color: '#3B82F6',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderLeft: '3px solid #3B82F6',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          color: '#1E293B',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          fontSize: '0.75rem',
          borderRadius: '6px',
        },
        arrow: {
          color: '#1E293B',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#065F46',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#991B1B',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#92400E',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#1E3A8A',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        },
      },
    },
  },
});

// Simple animation variants for minimal theme
export const minimalAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
  },
};

// Utility functions
export const getMinimalColors = () => ({
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
});

export default lightMinimalTheme;
