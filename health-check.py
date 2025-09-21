#!/usr/bin/env python3
"""
Inventory Management System - Health Check Script
================================================
This script performs comprehensive health checks on the running system
"""

import sys
import requests
import psycopg2
import subprocess
import time
import json
from datetime import datetime

def colored_print(message, color):
    """Print colored messages"""
    colors = {
        'red': '\033[0;31m',
        'green': '\033[0;32m',
        'yellow': '\033[1;33m',
        'blue': '\033[0;34m',
        'reset': '\033[0m'
    }
    print(f"{colors.get(color, '')}{message}{colors['reset']}")

def check_service_health():
    """Check if services are running and healthy"""
    results = {}
    
    # Check PostgreSQL
    colored_print("🔍 Checking PostgreSQL...", 'blue')
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='inventory_management'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        colored_print(f"✅ PostgreSQL: Running ({version[:50]}...)", 'green')
        results['postgresql'] = True
    except Exception as e:
        colored_print(f"❌ PostgreSQL: {str(e)}", 'red')
        results['postgresql'] = False
    
    # Check Backend API
    colored_print("🔍 Checking Backend API...", 'blue')
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            colored_print("✅ Backend API: Running", 'green')
            results['backend'] = True
        else:
            colored_print(f"❌ Backend API: HTTP {response.status_code}", 'red')
            results['backend'] = False
    except requests.ConnectionError:
        colored_print("❌ Backend API: Not responding", 'red')
        results['backend'] = False
    except Exception as e:
        colored_print(f"❌ Backend API: {str(e)}", 'red')
        results['backend'] = False
    
    # Check Frontend
    colored_print("🔍 Checking Frontend...", 'blue')
    frontend_ports = [3000, 5173]
    frontend_running = False
    
    for port in frontend_ports:
        try:
            response = requests.get(f'http://localhost:{port}', timeout=5)
            if response.status_code == 200:
                colored_print(f"✅ Frontend: Running on port {port}", 'green')
                frontend_running = True
                break
        except:
            continue
    
    if not frontend_running:
        colored_print("❌ Frontend: Not responding on any port", 'red')
    
    results['frontend'] = frontend_running
    
    return results

def check_api_endpoints():
    """Check critical API endpoints"""
    colored_print("🔍 Checking API Endpoints...", 'blue')
    
    endpoints = [
        '/api/students',
        '/api/products',
        '/api/categories',
        '/api/orders',
        '/api/lenders',
        '/api/invoices'
    ]
    
    results = {}
    
    for endpoint in endpoints:
        try:
            response = requests.get(f'http://localhost:8000{endpoint}', timeout=5)
            if response.status_code in [200, 201]:
                colored_print(f"✅ {endpoint}: OK", 'green')
                results[endpoint] = True
            else:
                colored_print(f"⚠️ {endpoint}: HTTP {response.status_code}", 'yellow')
                results[endpoint] = False
        except Exception as e:
            colored_print(f"❌ {endpoint}: {str(e)}", 'red')
            results[endpoint] = False
    
    return results

def check_database_tables():
    """Check database tables and data"""
    colored_print("🔍 Checking Database Tables...", 'blue')
    
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='inventory_management'
        )
        cursor = conn.cursor()
        
        # Check critical tables
        tables = [
            'students', 'products', 'categories', 'orders', 
            'order_items', 'invoices', 'invoice_items', 'lenders'
        ]
        
        results = {}
        
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                colored_print(f"✅ Table '{table}': {count} records", 'green')
                results[table] = count
            except Exception as e:
                colored_print(f"❌ Table '{table}': {str(e)}", 'red')
                results[table] = -1
        
        cursor.close()
        conn.close()
        
        return results
        
    except Exception as e:
        colored_print(f"❌ Database connection failed: {str(e)}", 'red')
        return {}

def check_file_permissions():
    """Check file permissions"""
    colored_print("🔍 Checking File Permissions...", 'blue')
    
    files_to_check = [
        'start-all.sh',
        'stop-all.sh',
        'mac-setup.sh',
        'verify-installation.sh',
        'setup_database.py'
    ]
    
    results = {}
    
    for file in files_to_check:
        try:
            result = subprocess.run(['ls', '-la', file], capture_output=True, text=True)
            if result.returncode == 0:
                permissions = result.stdout.split()[0]
                if 'x' in permissions:
                    colored_print(f"✅ {file}: Executable", 'green')
                    results[file] = True
                else:
                    colored_print(f"⚠️ {file}: Not executable", 'yellow')
                    results[file] = False
            else:
                colored_print(f"❌ {file}: Not found", 'red')
                results[file] = False
        except Exception as e:
            colored_print(f"❌ {file}: {str(e)}", 'red')
            results[file] = False
    
    return results

def check_system_resources():
    """Check system resources"""
    colored_print("🔍 Checking System Resources...", 'blue')
    
    try:
        # Check disk space
        result = subprocess.run(['df', '-h', '.'], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                parts = lines[1].split()
                available = parts[3]
                colored_print(f"✅ Disk space available: {available}", 'green')
        
        # Check memory
        result = subprocess.run(['vm_stat'], capture_output=True, text=True)
        if result.returncode == 0:
            colored_print("✅ Memory information available", 'green')
        
        # Check load average
        result = subprocess.run(['uptime'], capture_output=True, text=True)
        if result.returncode == 0:
            uptime_info = result.stdout.strip()
            colored_print(f"✅ System uptime: {uptime_info}", 'green')
        
        return True
        
    except Exception as e:
        colored_print(f"⚠️ System resource check failed: {str(e)}", 'yellow')
        return False

def generate_health_report(service_health, api_health, db_health, file_perms, system_health):
    """Generate comprehensive health report"""
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'service_health': service_health,
        'api_endpoints': api_health,
        'database_tables': db_health,
        'file_permissions': file_perms,
        'system_resources': system_health,
        'overall_status': 'healthy'
    }
    
    # Determine overall status
    critical_issues = 0
    
    if not service_health.get('postgresql', False):
        critical_issues += 1
    if not service_health.get('backend', False):
        critical_issues += 1
    
    if critical_issues > 0:
        report['overall_status'] = 'critical'
    elif not service_health.get('frontend', False):
        report['overall_status'] = 'warning'
    
    # Save report to file
    with open('health_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

def main():
    """Main health check function"""
    print("=" * 60)
    print("🏥 INVENTORY MANAGEMENT SYSTEM - HEALTH CHECK")
    print("=" * 60)
    print(f"⏰ Check time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all health checks
    service_health = check_service_health()
    print()
    
    api_health = check_api_endpoints()
    print()
    
    db_health = check_database_tables()
    print()
    
    file_perms = check_file_permissions()
    print()
    
    system_health = check_system_resources()
    print()
    
    # Generate report
    report = generate_health_report(service_health, api_health, db_health, file_perms, system_health)
    
    # Print summary
    print("=" * 60)
    print("📊 HEALTH CHECK SUMMARY")
    print("=" * 60)
    
    overall_status = report['overall_status']
    if overall_status == 'healthy':
        colored_print("🎉 System Status: HEALTHY", 'green')
        colored_print("All systems are running normally!", 'green')
    elif overall_status == 'warning':
        colored_print("⚠️ System Status: WARNING", 'yellow')
        colored_print("Some non-critical issues detected", 'yellow')
    else:
        colored_print("🚨 System Status: CRITICAL", 'red')
        colored_print("Critical issues require immediate attention!", 'red')
    
    print()
    print("📄 Detailed report saved to: health_report.json")
    print()
    
    if overall_status == 'critical':
        print("🔧 Recommended actions:")
        if not service_health.get('postgresql', False):
            print("   - Start PostgreSQL: brew services start postgresql@15")
        if not service_health.get('backend', False):
            print("   - Start backend: cd backend && python3 main.py")
        if not service_health.get('frontend', False):
            print("   - Start frontend: npm run dev")
        print("   - Or run: ./start-all.sh")
    
    print("=" * 60)
    
    # Return appropriate exit code
    if overall_status == 'healthy':
        return 0
    elif overall_status == 'warning':
        return 1
    else:
        return 2

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)