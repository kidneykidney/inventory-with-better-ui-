# 🐧 WSL Setup and Troubleshooting Guide

## Current Status
✅ WSL 2.5.10 is installed  
⚠️ Ubuntu distribution failed to install  
🔄 System reboot required for Virtual Machine Platform  

## Quick Solutions

### Option 1: Complete WSL Setup (Recommended)
1. **Restart your computer first** (required for Virtual Machine Platform)
2. Run as Administrator: `WSL-SETUP-FIX.bat`
3. If Ubuntu still fails, try Option 2

### Option 2: Manual Ubuntu Installation
1. Open Microsoft Store
2. Search for "Ubuntu"
3. Install "Ubuntu 22.04 LTS" or "Ubuntu"
4. Launch Ubuntu from Start Menu
5. Complete initial setup (username/password)
6. Run: `npm run wsl`

### Option 3: Use Local Setup (No WSL needed)
```bash
npm run local
```
This works immediately without any WSL setup!

## Common Error Solutions

### Error: "HCS_E_SERVICE_NOT_AVAILABLE"
**Cause:** Virtual Machine Platform not fully enabled  
**Fix:** 
1. Restart computer
2. Run `WSL-SETUP-FIX.bat` as Administrator
3. Enable virtualization in BIOS if needed

### Error: "InstallDistro failed"
**Cause:** Windows features not fully activated  
**Fix:**
1. Run these commands as Administrator:
```cmd
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```
2. Restart computer
3. Try `wsl --install -d Ubuntu` again

### BIOS Virtualization Settings
If you need to enable virtualization in BIOS:
- **Intel:** Look for "Intel VT-x" or "Virtualization Technology"
- **AMD:** Look for "AMD-V" or "SVM Mode"
- **Location:** Usually in "Advanced" → "CPU Configuration"

## Available Startup Options

| Command | Description | Requirements |
|---------|-------------|--------------|
| `npm run wsl` | WSL Ubuntu environment | WSL + Ubuntu installed |
| `npm run local` | Local Windows setup | Python + Node.js |
| `npm run one-click` | Docker containers | Docker Desktop |

## Testing Your Setup

### Test WSL Status:
```cmd
npm run wsl-status
```

### Test Local Setup:
```cmd
npm run local-status
```

## Quick Start (No WSL)
If you want to start immediately without WSL:
```bash
npm run local
```
This starts the inventory system using your local Windows environment with all the export fixes included!

## Need Help?
- Run `WSL-SETUP-FIX.bat` as Administrator for automated troubleshooting
- Check `WSL-STATUS.bat` for current system status
- Use `npm run local` as a reliable fallback option
