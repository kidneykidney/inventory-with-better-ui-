import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  IconButton,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Make addNotification available globally
    window.addNotification = (severity, title, message) => {
      const id = Date.now();
      const notification = {
        id,
        severity,
        title,
        message,
        timestamp: new Date()
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto remove after 6 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 6000);
    };

    return () => {
      // Cleanup
      delete window.addNotification;
    };
  }, []);

  const handleClose = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{ 
            mt: index * 7, // Stack notifications
            zIndex: 9999 + index
          }}
        >
          <Alert
            severity={notification.severity}
            variant="filled"
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => handleClose(notification.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              width: '100%',
              minWidth: 300,
              boxShadow: 3
            }}
          >
            {notification.title && (
              <strong>{notification.title}: </strong>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationSystem;
