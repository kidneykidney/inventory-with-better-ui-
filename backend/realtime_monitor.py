"""
Real-Time Data Monitor Service
Tracks database changes and triggers analytics updates
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy import text, event
from database_manager import DatabaseManager, get_db
from logging_config import api_logger
import threading
import time

class RealTimeDataMonitor:
    """
    Monitors database changes and maintains real-time analytics cache
    """
    
    def __init__(self):
        self.cache = {}
        self.last_update = {}
        self.subscribers = set()
        self.is_running = False
        self._lock = threading.Lock()
        
    def start_monitoring(self):
        """Start the real-time monitoring service"""
        if self.is_running:
            return
            
        self.is_running = True
        api_logger.info("🚀 Starting Real-Time Data Monitor...")
        
        # Start monitoring thread
        monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        monitor_thread.start()
        
        api_logger.info("✅ Real-Time Data Monitor started successfully")
    
    def stop_monitoring(self):
        """Stop the monitoring service"""
        self.is_running = False
        api_logger.info("🛑 Real-Time Data Monitor stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_running:
            try:
                self._update_cache()
                time.sleep(5)  # Update every 5 seconds
            except Exception as e:
                api_logger.error(f"❌ Error in monitoring loop: {str(e)}")
                time.sleep(10)  # Wait longer if there's an error
    
    def _update_cache(self):
        """Update the analytics cache with fresh data"""
        try:
            db = DatabaseManager()
            with db.get_connection() as conn:
                # Update metrics cache
                metrics = self._calculate_real_time_metrics(conn)
                
                with self._lock:
                    old_metrics = self.cache.get('metrics', {})
                    self.cache['metrics'] = metrics
                    self.last_update['metrics'] = datetime.now()
                
                # Check if significant changes occurred
                if self._has_significant_changes(old_metrics, metrics):
                    api_logger.info("📊 Significant data changes detected, updating cache")
                    self._notify_subscribers(metrics)
                    
        except Exception as e:
            api_logger.error(f"❌ Error updating cache: {str(e)}")
    
    def _calculate_real_time_metrics(self, conn) -> Dict[str, Any]:
        """Calculate real-time metrics from database"""
        try:
            # Basic counts
            total_products = conn.execute(text("SELECT COUNT(*) FROM products")).scalar() or 0
            total_students = conn.execute(text("SELECT COUNT(*) FROM students")).scalar() or 0
            active_orders = conn.execute(text("SELECT COUNT(*) FROM student_orders WHERE status = 'active'")).scalar() or 0
            pending_returns = conn.execute(text("SELECT COUNT(*) FROM student_orders WHERE status = 'borrowed'")).scalar() or 0
            
            # Revenue calculations
            try:
                total_revenue = conn.execute(text("SELECT COALESCE(SUM(total_amount), 0) FROM invoices")).scalar() or 0.0
            except:
                total_revenue = 0.0
            
            # Stock alerts
            low_stock_items = conn.execute(text("SELECT COUNT(*) FROM products WHERE quantity < 10")).scalar() or 0
            out_of_stock = conn.execute(text("SELECT COUNT(*) FROM products WHERE quantity = 0")).scalar() or 0
            
            # Most popular category
            popular_category_query = text("""
                SELECT p.category, COUNT(*) as count
                FROM student_orders so
                JOIN products p ON so.product_id = p.id
                WHERE so.created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY p.category
                ORDER BY count DESC
                LIMIT 1
            """)
            
            try:
                popular_result = conn.execute(popular_category_query).fetchone()
                most_borrowed_category = popular_result[0] if popular_result else "N/A"
            except:
                most_borrowed_category = "N/A"
            
            # Average order value
            avg_order_query = text("""
                SELECT AVG(p.price * so.quantity) as avg_value
                FROM student_orders so
                JOIN products p ON so.product_id = p.id
                WHERE so.created_at >= CURRENT_DATE - INTERVAL '30 days'
            """)
            
            try:
                avg_result = conn.execute(avg_order_query).scalar()
                average_order_value = float(avg_result) if avg_result else 0.0
            except:
                average_order_value = 0.0
            
            # Return rate
            return_rate_query = text("""
                SELECT 
                    (COUNT(CASE WHEN status = 'returned' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as rate
                FROM student_orders
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            """)
            
            try:
                return_rate_result = conn.execute(return_rate_query).scalar()
                return_rate = float(return_rate_result) if return_rate_result else 0.0
            except:
                return_rate = 0.0
            
            # Activity trends (last 24 hours)
            activity_query = text("""
                SELECT 
                    EXTRACT(HOUR FROM created_at) as hour,
                    COUNT(*) as activities
                FROM (
                    SELECT created_at FROM student_orders WHERE created_at >= CURRENT_DATE
                    UNION ALL
                    SELECT created_at FROM products WHERE created_at >= CURRENT_DATE
                    UNION ALL
                    SELECT created_at FROM students WHERE created_at >= CURRENT_DATE
                ) activities
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour
            """)
            
            hourly_activity = []
            try:
                for row in conn.execute(activity_query).fetchall():
                    hourly_activity.append({
                        "hour": int(row[0]),
                        "activities": int(row[1])
                    })
            except:
                hourly_activity = []
            
            # Recent alerts
            alerts = []
            
            # Low stock alerts
            if low_stock_items > 0:
                alerts.append({
                    "type": "warning",
                    "message": f"{low_stock_items} items are running low on stock",
                    "timestamp": datetime.now().isoformat(),
                    "action": "restock_needed"
                })
            
            # Out of stock alerts
            if out_of_stock > 0:
                alerts.append({
                    "type": "error", 
                    "message": f"{out_of_stock} items are out of stock",
                    "timestamp": datetime.now().isoformat(),
                    "action": "urgent_restock"
                })
            
            # High activity alert
            current_hour_activity = next(
                (item["activities"] for item in hourly_activity if item["hour"] == datetime.now().hour),
                0
            )
            if current_hour_activity > 20:
                alerts.append({
                    "type": "info",
                    "message": f"High activity detected: {current_hour_activity} actions this hour",
                    "timestamp": datetime.now().isoformat(),
                    "action": "monitor_system"
                })
            
            # Top 5 active students today
            top_students_query = text("""
                SELECT s.name, s.email, COUNT(so.id) as order_count
                FROM students s
                JOIN student_orders so ON s.id = so.student_id
                WHERE so.created_at >= CURRENT_DATE
                GROUP BY s.id, s.name, s.email
                ORDER BY order_count DESC
                LIMIT 5
            """)
            
            top_students = []
            try:
                for row in conn.execute(top_students_query).fetchall():
                    top_students.append({
                        "name": row[0],
                        "email": row[1],
                        "order_count": int(row[2])
                    })
            except:
                top_students = []
            
            # Most borrowed items today
            top_items_query = text("""
                SELECT p.name, p.sku, COUNT(so.id) as borrow_count
                FROM products p
                JOIN student_orders so ON p.id = so.product_id
                WHERE so.created_at >= CURRENT_DATE
                GROUP BY p.id, p.name, p.sku
                ORDER BY borrow_count DESC
                LIMIT 5
            """)
            
            top_items = []
            try:
                for row in conn.execute(top_items_query).fetchall():
                    top_items.append({
                        "name": row[0],
                        "sku": row[1],
                        "borrow_count": int(row[2])
                    })
            except:
                top_items = []
            
            return {
                "total_products": total_products,
                "total_students": total_students,
                "active_orders": active_orders,
                "pending_returns": pending_returns,
                "total_revenue": total_revenue,
                "low_stock_items": low_stock_items,
                "out_of_stock_items": out_of_stock,
                "most_borrowed_category": most_borrowed_category,
                "average_order_value": average_order_value,
                "return_rate": return_rate,
                "last_updated": datetime.now().isoformat(),
                "hourly_activity": hourly_activity,
                "alerts": alerts,
                "top_students_today": top_students,
                "top_items_today": top_items,
                "system_health": {
                    "database_connected": True,
                    "cache_size": len(self.cache),
                    "subscribers": len(self.subscribers),
                    "uptime_minutes": int((datetime.now() - self.last_update.get('startup', datetime.now())).total_seconds() / 60)
                }
            }
            
        except Exception as e:
            api_logger.error(f"❌ Error calculating metrics: {str(e)}")
            return {
                "error": str(e),
                "last_updated": datetime.now().isoformat(),
                "system_health": {
                    "database_connected": False,
                    "cache_size": len(self.cache),
                    "subscribers": len(self.subscribers)
                }
            }
    
    def _has_significant_changes(self, old_metrics: Dict, new_metrics: Dict) -> bool:
        """Check if there are significant changes worth notifying about"""
        if not old_metrics:
            return True
        
        # Define thresholds for significant changes
        significant_fields = [
            'total_products', 'total_students', 'active_orders', 
            'pending_returns', 'low_stock_items', 'out_of_stock_items'
        ]
        
        for field in significant_fields:
            old_value = old_metrics.get(field, 0)
            new_value = new_metrics.get(field, 0)
            
            if old_value != new_value:
                return True
        
        # Check for new alerts
        old_alerts = len(old_metrics.get('alerts', []))
        new_alerts = len(new_metrics.get('alerts', []))
        
        if new_alerts > old_alerts:
            return True
        
        return False
    
    def _notify_subscribers(self, data: Dict[str, Any]):
        """Notify all subscribers of data changes"""
        message = json.dumps(data)
        disconnected_subscribers = set()
        
        for subscriber in self.subscribers:
            try:
                # This would be used with WebSocket connections
                # subscriber.send(message)
                pass
            except Exception as e:
                api_logger.warning(f"⚠️ Failed to notify subscriber: {str(e)}")
                disconnected_subscribers.add(subscriber)
        
        # Remove disconnected subscribers
        self.subscribers -= disconnected_subscribers
    
    def subscribe(self, subscriber):
        """Add a subscriber for real-time updates"""
        with self._lock:
            self.subscribers.add(subscriber)
            api_logger.info(f"📡 New subscriber added. Total: {len(self.subscribers)}")
    
    def unsubscribe(self, subscriber):
        """Remove a subscriber"""
        with self._lock:
            self.subscribers.discard(subscriber)
            api_logger.info(f"📡 Subscriber removed. Total: {len(self.subscribers)}")
    
    def get_cached_metrics(self) -> Optional[Dict[str, Any]]:
        """Get the most recent cached metrics"""
        with self._lock:
            return self.cache.get('metrics')
    
    def force_update(self):
        """Force an immediate cache update"""
        api_logger.info("🔄 Force updating analytics cache...")
        self._update_cache()

# Global monitor instance
data_monitor = RealTimeDataMonitor()

def get_data_monitor() -> RealTimeDataMonitor:
    """Get the global data monitor instance"""
    return data_monitor

def start_monitoring_service():
    """Start the monitoring service"""
    monitor = get_data_monitor()
    monitor.last_update['startup'] = datetime.now()
    monitor.start_monitoring()
    api_logger.info("🎯 Real-Time Analytics Service initialized")

def stop_monitoring_service():
    """Stop the monitoring service"""
    monitor = get_data_monitor()
    monitor.stop_monitoring()
    api_logger.info("🎯 Real-Time Analytics Service stopped")

# Auto-start monitoring when module is imported
if __name__ != "__main__":
    # Only start if not running as main script
    try:
        start_monitoring_service()
    except Exception as e:
        api_logger.error(f"❌ Failed to start monitoring service: {str(e)}")

if __name__ == "__main__":
    # Test the monitoring service
    print("🧪 Testing Real-Time Data Monitor...")
    
    try:
        start_monitoring_service()
        monitor = get_data_monitor()
        
        # Test for 30 seconds
        for i in range(6):
            time.sleep(5)
            metrics = monitor.get_cached_metrics()
            print(f"📊 Update {i+1}: {metrics.get('total_products', 'N/A') if metrics else 'No data'} products")
        
        stop_monitoring_service()
        print("✅ Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
