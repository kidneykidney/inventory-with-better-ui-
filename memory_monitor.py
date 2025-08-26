#!/usr/bin/env python3
"""
Memory Monitor for 8GB RAM Systems
Monitors Docker container memory usage and provides optimization suggestions
"""

import subprocess
import json
import time
import psutil
import sys

def get_container_stats():
    """Get Docker container statistics"""
    try:
        result = subprocess.run(['docker', 'stats', '--no-stream', '--format', 'json'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            stats = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    stats.append(json.loads(line))
            return stats
        return []
    except Exception as e:
        print(f"Error getting container stats: {e}")
        return []

def get_system_memory():
    """Get system memory usage"""
    memory = psutil.virtual_memory()
    return {
        'total': memory.total / (1024**3),  # GB
        'available': memory.available / (1024**3),  # GB
        'percent': memory.percent,
        'used': memory.used / (1024**3)  # GB
    }

def parse_memory_string(mem_str):
    """Parse Docker memory string like '500.2MiB' to MB"""
    if not mem_str:
        return 0
    
    mem_str = mem_str.upper()
    if 'GIB' in mem_str or 'GB' in mem_str:
        return float(mem_str.replace('GIB', '').replace('GB', '')) * 1024
    elif 'MIB' in mem_str or 'MB' in mem_str:
        return float(mem_str.replace('MIB', '').replace('MB', ''))
    elif 'KIB' in mem_str or 'KB' in mem_str:
        return float(mem_str.replace('KIB', '').replace('KB', '')) / 1024
    else:
        try:
            return float(mem_str.replace('B', '')) / (1024*1024)
        except:
            return 0

def monitor_memory():
    """Monitor memory usage continuously"""
    print("🖥️  Memory Monitor for 8GB RAM Systems")
    print("=" * 50)
    
    try:
        while True:
            # System memory
            system_mem = get_system_memory()
            
            print(f"\n⏰ {time.strftime('%H:%M:%S')}")
            print(f"🖥️  System Memory: {system_mem['used']:.1f}GB / {system_mem['total']:.1f}GB ({system_mem['percent']:.1f}%)")
            
            if system_mem['percent'] > 85:
                print("⚠️  HIGH MEMORY USAGE - System approaching limits!")
            elif system_mem['percent'] > 75:
                print("⚡ MODERATE USAGE - Monitor closely")
            else:
                print("✅ Memory usage normal")
            
            # Container stats
            container_stats = get_container_stats()
            total_container_memory = 0
            
            if container_stats:
                print("\n🐳 Container Memory Usage:")
                for container in container_stats:
                    name = container.get('Name', 'Unknown')
                    mem_usage = container.get('MemUsage', '0B / 0B')
                    mem_percent = container.get('MemPerc', '0.00%')
                    cpu_percent = container.get('CPUPerc', '0.00%')
                    
                    # Parse memory usage
                    if ' / ' in mem_usage:
                        used_mem_str = mem_usage.split(' / ')[0]
                        used_mem_mb = parse_memory_string(used_mem_str)
                        total_container_memory += used_mem_mb
                        
                        print(f"   {name}: {used_mem_mb:.0f}MB ({mem_percent}) CPU: {cpu_percent}")
                
                print(f"\n📊 Total Container Memory: {total_container_memory:.0f}MB ({total_container_memory/1024:.1f}GB)")
                
                # Provide optimization suggestions
                if total_container_memory > 6000:  # 6GB
                    print("\n🚨 CRITICAL: Containers using >6GB! Recommendations:")
                    print("   • Restart containers: docker-compose restart")
                    print("   • Check for memory leaks in OCR processing")
                    print("   • Reduce concurrent OCR operations")
                elif total_container_memory > 4000:  # 4GB
                    print("\n⚠️  WARNING: High container memory usage!")
                    print("   • Monitor OCR operations closely")
                    print("   • Consider reducing image processing quality")
            else:
                print("\n🐳 No running containers detected")
            
            # Overall system health
            if system_mem['available'] < 1.0:  # Less than 1GB available
                print("\n🆘 CRITICAL SYSTEM MEMORY!")
                print("   • Close unnecessary applications")
                print("   • Restart Docker containers")
                print("   • Consider system reboot")
            
            print("\n" + "−" * 50)
            time.sleep(5)  # Update every 5 seconds
            
    except KeyboardInterrupt:
        print("\n\n👋 Memory monitoring stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error in memory monitoring: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        # Single check mode
        system_mem = get_system_memory()
        container_stats = get_container_stats()
        
        print(f"System Memory: {system_mem['used']:.1f}GB / {system_mem['total']:.1f}GB ({system_mem['percent']:.1f}%)")
        
        if container_stats:
            total_mem = sum(parse_memory_string(c.get('MemUsage', '0B / 0B').split(' / ')[0]) 
                          for c in container_stats if ' / ' in c.get('MemUsage', ''))
            print(f"Container Memory: {total_mem:.0f}MB ({total_mem/1024:.1f}GB)")
    else:
        # Continuous monitoring mode
        monitor_memory()
