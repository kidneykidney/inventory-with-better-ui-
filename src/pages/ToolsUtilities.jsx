import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, List, ListItem,
  ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
  Build, Backup, Download, Refresh, Settings, Storage,
  CloudDownload, Print, QrCode, Inventory, Assessment
} from '@mui/icons-material';

function ToolsUtilities() {
  const tools = [
    {
      icon: <Backup color="primary" />,
      title: "Backup Database",
      description: "Create a backup of your inventory database",
      action: "Create Backup"
    },
    {
      icon: <Download color="success" />,
      title: "Export Data",
      description: "Export inventory data to CSV or Excel",
      action: "Export"
    },
    {
      icon: <Refresh color="info" />,
      title: "Sync Data",
      description: "Synchronize data across all devices",
      action: "Sync Now"
    },
    {
      icon: <QrCode color="warning" />,
      title: "Generate QR Codes",
      description: "Create QR codes for inventory items",
      action: "Generate"
    },
    {
      icon: <Print color="error" />,
      title: "Bulk Print Labels",
      description: "Print labels for multiple items",
      action: "Print Labels"
    },
    {
      icon: <Assessment color="primary" />,
      title: "System Health Check",
      description: "Check system performance and issues",
      action: "Run Check"
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
          🔧 Tools & Utilities
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access system tools, maintenance utilities, and configurations
        </Typography>
      </Box>

      {/* System Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Storage sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Database Status
              </Typography>
              <Typography variant="body2" color="success.main">
                ✅ Healthy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudDownload sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Last Backup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2 hours ago
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Total Records
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1,247 items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tools Grid */}
      <Grid container spacing={3}>
        {tools.map((tool, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {tool.icon}
                  <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
                    {tool.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {tool.description}
                </Typography>
                <Button variant="contained" fullWidth>
                  {tool.action}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Quick Actions
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Build color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="System Maintenance"
                secondary="Run system maintenance and cleanup tasks"
              />
              <Button variant="outlined">Run</Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Refresh color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Cache Refresh"
                secondary="Clear cache and refresh system data"
              />
              <Button variant="outlined">Refresh</Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Settings color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="System Configuration"
                secondary="Access advanced system settings"
              />
              <Button variant="outlined">Configure</Button>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ToolsUtilities;
