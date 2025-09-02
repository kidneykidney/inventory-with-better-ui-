#!/usr/bin/env node
/**
 * Setup Check Script
 * Verifies that all components are properly installed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Inventory Management System Setup...\n');

let allGood = true;

// Check Node.js
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
} catch (error) {
    console.log('❌ Node.js not found');
    allGood = false;
}

// Check Python
try {
    const pythonVersion = execSync('python --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Python: ${pythonVersion}`);
} catch (error) {
    console.log('❌ Python not found');
    allGood = false;
}

// Check virtual environment
if (fs.existsSync('.venv')) {
    console.log('✅ Virtual environment exists');
} else {
    console.log('❌ Virtual environment missing');
    allGood = false;
}

// Check node_modules
if (fs.existsSync('node_modules')) {
    console.log('✅ Node.js dependencies installed');
} else {
    console.log('❌ Node.js dependencies missing');
    allGood = false;
}

// Check Docker (optional)
try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Docker: ${dockerVersion}`);
} catch (error) {
    console.log('⚠️  Docker not found (optional)');
}

// Check scripts directory
if (fs.existsSync('scripts')) {
    console.log('✅ Setup scripts available');
} else {
    console.log('❌ Setup scripts missing');
    allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
    console.log('🎉 Setup is complete! Your system is ready to use.');
    console.log('\n💡 Quick commands:');
    console.log('   npm run start:system  - Start the application');
    console.log('   npm run stop:system   - Stop the application');
    console.log('   npm run test:ocr      - Test OCR functionality');
} else {
    console.log('⚠️  Setup incomplete. Please run:');
    console.log('   npm run setup:auto   - Automated setup');
    console.log('   or');
    console.log('   npm run setup:docker - Docker setup');
}

console.log('\n📚 For help, see: QUICK_START.md');
