"""
Background scheduler for automatic overdue notifications
This runs independently of user interactions to ensure emails are sent daily
"""

import asyncio
import logging
from datetime import datetime, date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager
import pytz

# Setup logging
scheduler_logger = logging.getLogger("scheduler")
scheduler_logger.setLevel(logging.INFO)

# Import our existing services
try:
    from database_manager import DatabaseManager
    from email_service import email_service
    from inventory_api import send_overdue_email_notifications
    scheduler_logger.info("Successfully imported required services")
except ImportError as e:
    scheduler_logger.error(f"Failed to import services: {e}")
    raise

class OverdueScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=pytz.timezone('Asia/Kolkata'))  # Adjust timezone as needed
        self.db = None
        self.is_running = False
        
    async def initialize(self):
        """Initialize database connection"""
        try:
            self.db = DatabaseManager()
            
            # Establish the database connection
            if not self.db.connect():
                scheduler_logger.error("Failed to establish database connection")
                self.db = None
                raise Exception("Database connection failed")
            
            # Test the connection by running a simple query
            test_result = self.db.execute_query("SELECT 1 as test")
            if test_result:
                scheduler_logger.info("✅ Database connection initialized for scheduler")
            else:
                scheduler_logger.error("❌ Database connection test failed")
                self.db = None
                raise Exception("Database test query failed")
                
        except Exception as e:
            scheduler_logger.error(f"Failed to initialize database: {e}")
            self.db = None
            raise
    
    async def check_and_process_overdue_orders(self):
        """
        Main task to check for overdue orders and send notifications
        This runs automatically every day
        """
        try:
            current_time = datetime.now()
            scheduler_logger.info(f"🔍 Starting automatic overdue check at {current_time}")
            
            if not self.db:
                scheduler_logger.error("❌ Database not initialized, attempting to initialize...")
                try:
                    await self.initialize()
                except Exception as e:
                    scheduler_logger.error(f"❌ Failed to reinitialize database: {e}")
                    return
                
            if not self.db:
                scheduler_logger.error("❌ Database still not available, cannot check overdue orders")
                return
            
            # Test database connection before proceeding
            try:
                test_query = self.db.execute_query("SELECT 1 as test")
                if not test_query:
                    scheduler_logger.error("❌ Database connection test failed")
                    # Try to reinitialize
                    await self.initialize()
                    if not self.db:
                        return
            except Exception as e:
                scheduler_logger.error(f"❌ Database connection error: {e}")
                # Try to reinitialize
                try:
                    await self.initialize()
                    if not self.db:
                        return
                except Exception as init_error:
                    scheduler_logger.error(f"❌ Failed to reinitialize database: {init_error}")
                    return
            
            # Get all orders that should be overdue but aren't marked as such yet
            try:
                overdue_query = """
                SELECT 
                    o.id, 
                    o.order_number, 
                    o.status,
                    o.expected_return_date,
                    o.student_id,
                    s.name as student_name,
                    s.email as student_email
                FROM orders o
                JOIN students s ON o.student_id = s.id
                WHERE o.expected_return_date < CURRENT_DATE 
                AND o.status IN ('approved', 'pending')
                AND o.expected_return_date IS NOT NULL
                ORDER BY o.expected_return_date ASC
                """
                
                overdue_orders = self.db.execute_query(overdue_query)
                
            except Exception as e:
                scheduler_logger.error(f"❌ Failed to query overdue orders: {e}")
                return
            
            if not overdue_orders:
                scheduler_logger.info("✅ No new overdue orders found")
                return
            
            scheduler_logger.info(f"📋 Found {len(overdue_orders)} orders that need to be marked as overdue")
            
            processed_count = 0
            error_count = 0
            
            for order in overdue_orders:
                try:
                    order_id = order['id']
                    order_number = order['order_number']
                    student_name = order['student_name']
                    student_email = order['student_email']
                    expected_return = order['expected_return_date']
                    
                    # Calculate days overdue
                    if isinstance(expected_return, str):
                        expected_date = datetime.strptime(expected_return, '%Y-%m-%d').date()
                    else:
                        expected_date = expected_return
                    
                    days_overdue = (date.today() - expected_date).days
                    
                    scheduler_logger.info(f"📦 Processing order {order_number} for {student_name} - {days_overdue} days overdue")
                    
                    # Update order status to overdue
                    update_query = """
                    UPDATE orders 
                    SET status = 'overdue', 
                        updated_at = NOW()
                    WHERE id = %s
                    """
                    
                    try:
                        if self.db:  # Ensure database is available
                            self.db.execute_query(update_query, (order_id,))
                            scheduler_logger.info(f"✅ Order {order_number} marked as overdue")
                        else:
                            scheduler_logger.error(f"❌ Database not available for order {order_number}")
                            error_count += 1
                            continue
                        
                        # Send email notifications
                        try:
                            if self.db:  # Ensure db is available
                                email_result = await send_overdue_email_notifications(str(order_id), self.db)
                                
                                if "error" not in email_result:
                                    student_sent = email_result.get('student_email_sent', False)
                                    admin_sent = email_result.get('admin_email_sent', False)
                                    
                                    if student_sent or admin_sent:
                                        scheduler_logger.info(f"📧 Email notifications sent for order {order_number} - Student: {student_sent}, Admin: {admin_sent}")
                                        processed_count += 1
                                    else:
                                        scheduler_logger.warning(f"⚠️ Email notifications failed for order {order_number}")
                                        error_count += 1
                                else:
                                    scheduler_logger.error(f"❌ Email error for order {order_number}: {email_result['error']}")
                                    error_count += 1
                            else:
                                scheduler_logger.error(f"❌ Database not available for order {order_number}")
                                error_count += 1
                                
                        except Exception as email_error:
                            scheduler_logger.error(f"❌ Email exception for order {order_number}: {email_error}")
                            error_count += 1
                    except Exception as update_error:
                        scheduler_logger.error(f"❌ Failed to update status for order {order_number}: {update_error}")
                        error_count += 1
                        
                    # Small delay to prevent overwhelming the system
                    await asyncio.sleep(0.5)
                    
                except Exception as order_error:
                    scheduler_logger.error(f"❌ Error processing order {order.get('order_number', 'unknown')}: {order_error}")
                    error_count += 1
            
            # Log summary
            total_orders = len(overdue_orders)
            scheduler_logger.info(f"📊 Overdue check completed:")
            scheduler_logger.info(f"   📦 Total orders processed: {total_orders}")
            scheduler_logger.info(f"   ✅ Successfully processed: {processed_count}")
            scheduler_logger.info(f"   ❌ Errors: {error_count}")
            
            # Try to log to database for audit trail (non-critical)
            try:
                if self.db:
                    # Simple audit logging without checking table existence
                    audit_message = f"Automatic overdue check: {processed_count}/{total_orders} orders processed successfully"
                    scheduler_logger.info(f"📝 Audit: {audit_message}")
                    
            except Exception as audit_error:
                scheduler_logger.debug(f"Could not create audit log (non-critical): {audit_error}")
                
        except Exception as e:
            scheduler_logger.error(f"❌ Critical error in overdue check: {e}")
            
            # Don't try to log critical errors to DB to avoid cascading failures
    
    def start(self):
        """Start the scheduler"""
        if self.is_running:
            scheduler_logger.warning("Scheduler is already running")
            return
            
        try:
            # Schedule frequent overdue checks every 30 minutes during working hours (8 AM - 6 PM)
            self.scheduler.add_job(
                self.check_and_process_overdue_orders,
                CronTrigger(hour='8-18', minute='0,30'),  # Every 30 minutes during working hours
                id='frequent_overdue_check',
                name='Frequent Overdue Orders Check',
                misfire_grace_time=1800,  # Allow 30 minute grace period
                coalesce=True,  # Merge missed executions
                max_instances=1  # Only one instance at a time
            )
            
            # Schedule daily comprehensive check at 9:00 AM (main check)
            self.scheduler.add_job(
                self.check_and_process_overdue_orders,
                CronTrigger(hour=9, minute=0),  # 9:00 AM daily
                id='daily_overdue_check',
                name='Daily Comprehensive Overdue Check',
                misfire_grace_time=3600,  # Allow 1 hour grace period
                coalesce=True,  # Merge missed executions
                max_instances=1  # Only one instance at a time
            )
            
            # Also schedule an immediate check (with delay) when service starts
            self.scheduler.add_job(
                self.check_and_process_overdue_orders,
                'date',
                run_date=datetime.now() + timedelta(minutes=1),  # Reduced to 1 minute
                id='startup_overdue_check',
                name='Startup Overdue Check'
            )
            
            self.scheduler.start()
            self.is_running = True
            scheduler_logger.info("🚀 Overdue notification scheduler started successfully")
            scheduler_logger.info("📅 Frequent checks scheduled every 30 minutes (8 AM - 6 PM)")
            scheduler_logger.info("📅 Daily comprehensive check scheduled for 9:00 AM")
            scheduler_logger.info("🔄 Initial check will run in 1 minute")
            
        except Exception as e:
            scheduler_logger.error(f"Failed to start scheduler: {e}")
            raise
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            self.is_running = False
            scheduler_logger.info("🛑 Overdue notification scheduler stopped")
    
    def get_status(self):
        """Get scheduler status"""
        jobs_info = []
        if self.scheduler:
            for job in self.scheduler.get_jobs():
                jobs_info.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                })
        
        return {
            "running": self.is_running and (self.scheduler.running if self.scheduler else False),
            "next_frequent_check": self.scheduler.get_job('frequent_overdue_check').next_run_time.isoformat() if self.scheduler and self.scheduler.get_job('frequent_overdue_check') else None,
            "next_daily_check": self.scheduler.get_job('daily_overdue_check').next_run_time.isoformat() if self.scheduler and self.scheduler.get_job('daily_overdue_check') else None,
            "jobs": jobs_info
        }

# Global scheduler instance
overdue_scheduler = OverdueScheduler()

# Lifespan context manager for FastAPI
@asynccontextmanager
async def scheduler_lifespan(app):
    """Lifespan context manager to start/stop scheduler with FastAPI app"""
    try:
        scheduler_logger.info("🔧 Initializing automatic overdue notification system...")
        await overdue_scheduler.initialize()
        overdue_scheduler.start()
        scheduler_logger.info("✅ Automatic overdue notification system is now active")
        yield
    except Exception as e:
        scheduler_logger.error(f"Failed to start overdue scheduler: {e}")
        yield
    finally:
        scheduler_logger.info("🔄 Shutting down overdue notification system...")
        overdue_scheduler.stop()

# Function to get scheduler status (for API endpoints)
def get_scheduler_status():
    """Get current scheduler status"""
    return overdue_scheduler.get_status()

# Function to manually trigger overdue check (for testing/admin)
async def manual_overdue_check():
    """Manually trigger overdue check"""
    scheduler_logger.info("🔧 Manual overdue check triggered")
    await overdue_scheduler.check_and_process_overdue_orders()