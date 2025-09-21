"""
Email notification service for inventory management system
Handles automated email notifications for overdue orders
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from datetime import datetime, date
import logging
from typing import Dict, List, Optional
import os

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    email_logger = logging.getLogger(__name__)
    email_logger.info("Environment variables loaded successfully")
except ImportError:
    email_logger = logging.getLogger(__name__)
    email_logger.warning("python-dotenv not available, using system environment variables only")

# Import database manager
try:
    from database_manager import DatabaseManager
    db_available = True
    email_logger.info("Database manager imported successfully")
except ImportError:
    email_logger.warning("Database manager not available")
    db_available = False

class EmailService:
    def __init__(self):
        # Email configuration with fallback values
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', 'your-email@gmail.com')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        self.admin_email = os.getenv('ADMIN_EMAIL', 'admin@university.edu')
        self.university_name = os.getenv('UNIVERSITY_NAME', 'University Name')
        
        # Initialize database manager (but don't connect yet)
        self.db_manager = DatabaseManager() if db_available else None
        self._db_connected = False
        
        # Cache for frequently accessed data
        self._cache = {}
        self._cache_timeout = 300  # 5 minutes cache timeout
        
        # Log configuration (without sensitive data)
        email_logger.info(f"Email service initialized:")
        email_logger.info(f"  SMTP Server: {self.smtp_server}:{self.smtp_port}")
        email_logger.info(f"  Sender: {self.sender_email}")
        email_logger.info(f"  Admin: {self.admin_email}")
        email_logger.info(f"  University: {self.university_name}")
        email_logger.info(f"  Password configured: {'Yes' if self.sender_password else 'No'}")
        email_logger.info(f"  Database available: {'Yes' if self.db_manager else 'No'}")
        
    def _ensure_db_connection(self):
        """Ensure database connection is established"""
        if not self.db_manager:
            return False
        if not self._db_connected:
            self._db_connected = self.db_manager.connect()
        return self._db_connected
    
    def _get_cache_key(self, prefix: str, identifier: str) -> str:
        """Generate cache key"""
        return f"{prefix}:{identifier}"
    
    def _is_cache_valid(self, cache_entry: dict) -> bool:
        """Check if cache entry is still valid"""
        if not cache_entry:
            return False
        timestamp = cache_entry.get('timestamp', 0)
        return (datetime.now().timestamp() - timestamp) < self._cache_timeout
    
    def _cache_data(self, key: str, data: any) -> None:
        """Cache data with timestamp"""
        self._cache[key] = {
            'data': data,
            'timestamp': datetime.now().timestamp()
        }
        
    def get_order_details_from_db(self, order_id: str) -> Optional[Dict]:
        """Fetch complete order details from database including student and items"""
        if not self.db_manager:
            email_logger.error("Database manager not available")
            return None
        
        # Check cache first
        cache_key = self._get_cache_key("order_details", order_id)
        cached_entry = self._cache.get(cache_key)
        if self._is_cache_valid(cached_entry):
            email_logger.info(f"Using cached order details for: {order_id}")
            return cached_entry['data']
        
        try:
            # Ensure connection only once
            if not self._ensure_db_connection():
                email_logger.error("Failed to connect to database")
                return None
            
            # Single optimized query to get all data at once
            query = """
            SELECT 
                o.id as order_id,
                o.order_number,
                o.status,
                o.requested_date,
                o.expected_return_date,
                o.approved_by as lender_name,
                o.total_items,
                o.total_value,
                o.notes,
                s.id as student_id,
                s.student_id as student_number,
                s.name as student_name,
                s.email as student_email,
                s.phone as student_phone,
                s.department,
                s.year_of_study,
                s.course,
                -- Aggregate order items in single query
                COALESCE(
                    json_agg(
                        json_build_object(
                            'product_name', p.name,
                            'sku', p.sku,
                            'description', p.description,
                            'category_name', c.name,
                            'quantity_requested', oi.quantity_requested,
                            'unit_price', oi.unit_price,
                            'total_price', oi.total_price
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL), 
                    '[]'::json
                ) as items
            FROM orders o
            LEFT JOIN students s ON o.student_id = s.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE o.id = %s OR o.order_number = %s
            GROUP BY o.id, s.id
            """
            
            order_result = self.db_manager.execute_query(query, (order_id, order_id))
            
            if not order_result:
                email_logger.warning(f"Order not found: {order_id}")
                return None
            
            order_data = order_result[0]
            
            # Process the aggregated items from JSON
            import json
            items_json = order_data.get('items', [])
            if isinstance(items_json, str):
                items_data = json.loads(items_json)
            else:
                items_data = items_json if items_json else []
            
            # Format the data for email templates
            formatted_data = {
                'student_data': {
                    'name': order_data.get('student_name', 'Unknown Student'),
                    'email': order_data.get('student_email', ''),
                    'student_id': order_data.get('student_number', ''),
                    'department': order_data.get('department', ''),
                    'phone': order_data.get('student_phone', ''),
                    'year_of_study': str(order_data.get('year_of_study', '')) if order_data.get('year_of_study') else '',
                    'course': order_data.get('course', '')
                },
                'order_data': {
                    'order_number': order_data.get('order_number', ''),
                    'status': order_data.get('status', ''),
                    'requested_date': order_data['requested_date'].strftime('%Y-%m-%d') if order_data.get('requested_date') else '',
                    'expected_return_date': order_data['expected_return_date'].strftime('%Y-%m-%d') if order_data.get('expected_return_date') else '',
                    'lender_name': order_data.get('lender_name', 'Unknown'),
                    'total_items': order_data.get('total_items', 0),
                    'total_value': float(order_data.get('total_value', 0)),
                    'notes': order_data.get('notes', '')
                },
                'overdue_items': []
            }
            
            # Format items from aggregated JSON
            for item in items_data:
                formatted_data['overdue_items'].append({
                    'name': item.get('product_name', 'Unknown Item'),
                    'sku': item.get('sku', ''),
                    'description': item.get('description', ''),
                    'category': item.get('category_name', ''),
                    'quantity_requested': item.get('quantity_requested', 1),
                    'unit_price': float(item.get('unit_price', 0)),
                    'total_price': float(item.get('total_price', 0))
                })
            
            # Cache the result for future use
            self._cache_data(cache_key, formatted_data)
            
            email_logger.info(f"Successfully fetched and cached order details for: {order_data.get('order_number')}")
            return formatted_data
            
        except Exception as e:
            email_logger.error(f"Error fetching order details from database: {str(e)}")
            return None
    
    def log_email_notification(self, order_id: str, email_type: str, recipient: str, success: bool, error_message: Optional[str] = None):
        """Log email notification attempt to database (optimized)"""
        if not self.db_manager:
            return
        
        try:
            # Use existing connection if available
            if not self._ensure_db_connection():
                email_logger.error("Failed to connect to database for logging")
                return
            
            # Simplified logging - just log to application logs if database table doesn't exist
            try:
                query = """
                INSERT INTO email_notifications 
                (order_id, email_type, recipient_email, success, error_message, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                
                success_result = self.db_manager.execute_command(query, (
                    order_id, 
                    email_type, 
                    recipient, 
                    success, 
                    error_message, 
                    datetime.now()
                ))
                
                if success_result:
                    email_logger.info(f"Email notification logged: {email_type} to {recipient} - {'Success' if success else 'Failed'}")
            except Exception as db_error:
                # Fallback to application logging if database logging fails
                email_logger.info(f"Email notification: {email_type} to {recipient} - {'Success' if success else 'Failed'} (DB logging failed: {str(db_error)})")
            
        except Exception as e:
            email_logger.error(f"Error logging email notification: {str(e)}")
    
    def send_overdue_notification_by_order_id(self, order_id: str) -> Dict:
        """Send overdue notifications using real database data (optimized)"""
        results = {
            'student_email_sent': False,
            'admin_email_sent': False,
            'errors': [],
            'order_found': False
        }
        
        try:
            # Get real order data from database (with caching)
            order_details = self.get_order_details_from_db(order_id)
            
            if not order_details:
                error_msg = f"Order not found in database: {order_id}"
                results['errors'].append(error_msg)
                email_logger.error(error_msg)
                return results
            
            results['order_found'] = True
            
            # Use the existing send_overdue_notifications method with real data
            email_results = self.send_overdue_notifications(
                order_details['student_data'],
                order_details['order_data'],
                order_details['overdue_items']
            )
            
            # Log notifications to database (non-blocking)
            try:
                if email_results.get('student_email_sent'):
                    self.log_email_notification(
                        order_id, 'student_overdue', 
                        order_details['student_data']['email'], 
                        True
                    )
                else:
                    self.log_email_notification(
                        order_id, 'student_overdue', 
                        order_details['student_data']['email'], 
                        False, 
                        '; '.join(email_results.get('errors', []))
                    )
                
                if email_results.get('admin_email_sent'):
                    self.log_email_notification(
                        order_id, 'admin_overdue', 
                        self.admin_email, 
                        True
                    )
                else:
                    self.log_email_notification(
                        order_id, 'admin_overdue', 
                        self.admin_email, 
                        False, 
                        '; '.join(email_results.get('errors', []))
                    )
            except Exception as log_error:
                email_logger.warning(f"Failed to log email notifications: {str(log_error)}")
            
            # Merge results
            results.update(email_results)
            
            return results
            
        except Exception as e:
            error_msg = f"Error sending overdue notifications: {str(e)}"
            results['errors'].append(error_msg)
            email_logger.error(error_msg)
            return results
    
    def cleanup_connection(self):
        """Clean up database connection"""
        try:
            if self.db_manager and self._db_connected:
                self.db_manager.disconnect()
                self._db_connected = False
                email_logger.info("Email service database connection cleaned up")
        except Exception as e:
            email_logger.error(f"Error cleaning up database connection: {str(e)}")
    
    def clear_cache(self):
        """Clear the data cache"""
        self._cache.clear()
        email_logger.info("Email service cache cleared")
        
    def send_email(self, to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
        """Send email with both HTML and text versions"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = formataddr((f"{self.university_name} Inventory System", self.sender_email))
            message["To"] = to_email
            
            # Create text and HTML versions
            if text_body:
                text_part = MIMEText(text_body, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            email_logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"Gmail authentication failed for {self.sender_email}. Please check if 2-factor authentication is enabled and use an App Password instead of regular password. Error: {str(e)}"
            email_logger.error(error_msg)
            return False
        except smtplib.SMTPException as e:
            email_logger.error(f"SMTP error sending email to {to_email}: {str(e)}")
            return False
        except Exception as e:
            email_logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def get_student_overdue_template(self, student_data: Dict, order_data: Dict, overdue_items: List[Dict]) -> tuple:
        """Generate student overdue warning email template"""
        
        # Calculate days overdue
        expected_return = datetime.strptime(order_data['expected_return_date'], '%Y-%m-%d').date()
        today = date.today()
        days_overdue = (today - expected_return).days
        
        # Create items list with enhanced details
        items_html = ""
        items_text = ""
        total_value = 0
        
        for item in overdue_items:
            item_name = item.get('name', 'Unknown Item')
            item_sku = item.get('sku', '')
            item_description = item.get('description', '')
            item_category = item.get('category', '')
            quantity = item.get('quantity_requested', 1)
            unit_price = float(item.get('unit_price', 0))
            total_price = float(item.get('total_price', 0)) if item.get('total_price') else unit_price * quantity
            
            # Format item display name
            display_name = f"{item_name}"
            if item_sku:
                display_name += f" ({item_sku})"
            if item_category:
                display_name += f" - {item_category}"
            
            items_html += f"""
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px; border-right: 1px solid #e5e7eb;">
                    <strong>{display_name}</strong>
                    {f'<br><small style="color: #6b7280;">{item_description}</small>' if item_description else ''}
                </td>
                <td style="padding: 8px; border-right: 1px solid #e5e7eb; text-align: center;">{quantity}</td>
                <td style="padding: 8px; text-align: right;">${total_price:.2f}</td>
            </tr>
            """
            items_text += f"- {display_name} (Qty: {quantity}) - ${total_price:.2f}\n"
            if item_description:
                items_text += f"  Description: {item_description}\n"
            total_value += total_price
        
        subject = f"⚠️ URGENT: Return Overdue Equipment - Order #{order_data.get('order_number', 'N/A')}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Equipment Return Overdue Notice</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">⚠️ EQUIPMENT RETURN OVERDUE</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">{self.university_name} - Inventory Management</p>
            </div>
            
            <!-- Content -->
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                    <p style="color: #dc2626; font-weight: bold; margin: 0; font-size: 16px;">
                        🚨 Your borrowed equipment is now <strong>{days_overdue} day{'s' if days_overdue != 1 else ''} overdue</strong> for return!
                    </p>
                </div>
                
                <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Student Information</h2>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Name:</strong> {student_data.get('name', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Student ID:</strong> {student_data.get('student_id', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {student_data.get('email', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Department:</strong> {student_data.get('department', 'N/A')}</p>
                </div>
                
                <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Details</h2>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Order Number:</strong> {order_data.get('order_number', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Borrowed Date:</strong> {datetime.strptime(order_data.get('requested_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('requested_date') else 'N/A'}</p>
                    <p style="margin: 5px 0; color: #dc2626;"><strong>Expected Return Date:</strong> {datetime.strptime(order_data.get('expected_return_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('expected_return_date') else 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Assigned Lender:</strong> {order_data.get('lender_name', 'N/A')}</p>
                </div>
                
                <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Overdue Equipment</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 12px 8px; text-align: left; border-right: 1px solid #e5e7eb; font-weight: 600;">Item</th>
                            <th style="padding: 12px 8px; text-align: center; border-right: 1px solid #e5e7eb; font-weight: 600;">Quantity</th>
                            <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                        <tr style="background: #f9fafb; font-weight: bold;">
                            <td style="padding: 12px 8px; border-right: 1px solid #e5e7eb;" colspan="2">Total Value:</td>
                            <td style="padding: 12px 8px; text-align: right; color: #dc2626;">${total_value:.2f}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                    <h3 style="color: #92400e; margin-top: 0;">⚡ IMMEDIATE ACTION REQUIRED</h3>
                    <ul style="color: #92400e; margin: 10px 0;">
                        <li>Return all equipment <strong>immediately</strong> to avoid additional penalties</li>
                        <li>Contact the equipment office if you're unable to return items</li>
                        <li>Late returns may result in replacement fees and academic holds</li>
                        <li>Continued delays may affect your ability to borrow equipment in the future</li>
                    </ul>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="color: #1e40af; margin-top: 0;">📍 Return Information</h3>
                    <p style="color: #1e40af; margin: 5px 0;"><strong>Location:</strong> Equipment Office, Building A, Room 101</p>
                    <p style="color: #1e40af; margin: 5px 0;"><strong>Hours:</strong> Monday-Friday, 8:00 AM - 5:00 PM</p>
                    <p style="color: #1e40af; margin: 5px 0;"><strong>Contact:</strong> equipment@{self.university_name.lower().replace(' ', '')}.edu | (555) 123-4567</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        This is an automated message from the {self.university_name} Inventory Management System.<br>
                        For assistance, please contact the equipment office.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        EQUIPMENT RETURN OVERDUE - Order #{order_data.get('order_number', 'N/A')}
        {self.university_name} - Inventory Management
        
        ⚠️ URGENT: Your borrowed equipment is now {days_overdue} day{'s' if days_overdue != 1 else ''} overdue for return!
        
        STUDENT INFORMATION:
        Name: {student_data.get('name', 'N/A')}
        Student ID: {student_data.get('student_id', 'N/A')}
        Email: {student_data.get('email', 'N/A')}
        Department: {student_data.get('department', 'N/A')}
        
        ORDER DETAILS:
        Order Number: {order_data.get('order_number', 'N/A')}
        Borrowed Date: {datetime.strptime(order_data.get('requested_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('requested_date') else 'N/A'}
        Expected Return Date: {datetime.strptime(order_data.get('expected_return_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('expected_return_date') else 'N/A'}
        Assigned Lender: {order_data.get('lender_name', 'N/A')}
        
        OVERDUE EQUIPMENT:
        {items_text}
        Total Value: ${total_value:.2f}
        
        IMMEDIATE ACTION REQUIRED:
        - Return all equipment immediately to avoid additional penalties
        - Contact the equipment office if you're unable to return items
        - Late returns may result in replacement fees and academic holds
        
        RETURN INFORMATION:
        Location: Equipment Office, Building A, Room 101
        Hours: Monday-Friday, 8:00 AM - 5:00 PM
        Contact: equipment@{self.university_name.lower().replace(' ', '')}.edu | (555) 123-4567
        
        This is an automated message from the {self.university_name} Inventory Management System.
        """
        
        return subject, html_body, text_body
    
    def get_admin_overdue_template(self, student_data: Dict, order_data: Dict, overdue_items: List[Dict]) -> tuple:
        """Generate admin notification email template"""
        
        # Calculate days overdue
        expected_return = datetime.strptime(order_data['expected_return_date'], '%Y-%m-%d').date()
        today = date.today()
        days_overdue = (today - expected_return).days
        
        # Create items list with enhanced details
        items_html = ""
        items_text = ""
        total_value = 0
        
        for item in overdue_items:
            item_name = item.get('name', 'Unknown Item')
            item_sku = item.get('sku', '')
            item_description = item.get('description', '')
            item_category = item.get('category', '')
            quantity = item.get('quantity_requested', 1)
            unit_price = float(item.get('unit_price', 0))
            total_price = float(item.get('total_price', 0)) if item.get('total_price') else unit_price * quantity
            
            # Format item display name
            display_name = f"{item_name}"
            if item_sku:
                display_name += f" ({item_sku})"
            if item_category:
                display_name += f" - {item_category}"
            
            items_html += f"""
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px; border-right: 1px solid #e5e7eb;">
                    <strong>{display_name}</strong>
                    {f'<br><small style="color: #6b7280;">{item_description}</small>' if item_description else ''}
                </td>
                <td style="padding: 8px; border-right: 1px solid #e5e7eb; text-align: center;">{quantity}</td>
                <td style="padding: 8px; text-align: right;">${total_price:.2f}</td>
            </tr>
            """
            items_text += f"- {display_name} (Qty: {quantity}) - ${total_price:.2f}\n"
            if item_description:
                items_text += f"  Description: {item_description}\n"
            total_value += total_price
        
        subject = f"🚨 Admin Alert: Overdue Equipment - {student_data.get('name', 'Unknown')} - Order #{order_data.get('order_number', 'N/A')}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Alert - Overdue Equipment</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🚨 ADMIN ALERT - OVERDUE EQUIPMENT</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">{self.university_name} - Inventory Management</p>
            </div>
            
            <!-- Content -->
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                    <p style="color: #dc2626; font-weight: bold; margin: 0; font-size: 16px;">
                        🚨 Equipment overdue by <strong>{days_overdue} day{'s' if days_overdue != 1 else ''}</strong> - Student notification sent automatically
                    </p>
                </div>
                
                <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Student Information</h2>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Name:</strong> {student_data.get('name', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Student ID:</strong> {student_data.get('student_id', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {student_data.get('email', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Department:</strong> {student_data.get('department', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> {student_data.get('phone', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Year of Study:</strong> {student_data.get('year_of_study', 'N/A')}</p>
                </div>
                
                <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Details</h2>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Order Number:</strong> {order_data.get('order_number', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Borrowed Date:</strong> {datetime.strptime(order_data.get('requested_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('requested_date') else 'N/A'}</p>
                    <p style="margin: 5px 0; color: #dc2626;"><strong>Expected Return Date:</strong> {datetime.strptime(order_data.get('expected_return_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('expected_return_date') else 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Days Overdue:</strong> <span style="color: #dc2626; font-weight: bold;">{days_overdue}</span></p>
                    <p style="margin: 5px 0;"><strong>Assigned Lender:</strong> {order_data.get('lender_name', 'N/A')}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">OVERDUE</span></p>
                </div>
                
                <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Overdue Equipment</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 12px 8px; text-align: left; border-right: 1px solid #e5e7eb; font-weight: 600;">Item</th>
                            <th style="padding: 12px 8px; text-align: center; border-right: 1px solid #e5e7eb; font-weight: 600;">Quantity</th>
                            <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                        <tr style="background: #f9fafb; font-weight: bold;">
                            <td style="padding: 12px 8px; border-right: 1px solid #e5e7eb;" colspan="2">Total Value at Risk:</td>
                            <td style="padding: 12px 8px; text-align: right; color: #dc2626;">${total_value:.2f}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                    <h3 style="color: #92400e; margin-top: 0;">📋 Recommended Actions</h3>
                    <ul style="color: #92400e; margin: 10px 0;">
                        <li>Contact student directly via phone or email</li>
                        <li>Send formal written notice if not resolved within 2 days</li>
                        <li>Consider applying academic hold for extended delays</li>
                        <li>Escalate to department head if no response within 1 week</li>
                        <li>Assess replacement fees if equipment is lost or damaged</li>
                    </ul>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="color: #1e40af; margin-top: 0;">📞 Contact Information</h3>
                    <p style="color: #1e40af; margin: 5px 0;"><strong>Student Email:</strong> {student_data.get('email', 'N/A')}</p>
                    <p style="color: #1e40af; margin: 5px 0;"><strong>Student Phone:</strong> {student_data.get('phone', 'N/A')}</p>
                    <p style="color: #1e40af; margin: 5px 0;"><strong>Assigned Lender:</strong> {order_data.get('lender_name', 'N/A')}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        This is an automated alert from the {self.university_name} Inventory Management System.<br>
                        Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        ADMIN ALERT - OVERDUE EQUIPMENT
        {self.university_name} - Inventory Management
        
        🚨 Equipment overdue by {days_overdue} day{'s' if days_overdue != 1 else ''} - Student notification sent automatically
        
        STUDENT INFORMATION:
        Name: {student_data.get('name', 'N/A')}
        Student ID: {student_data.get('student_id', 'N/A')}
        Email: {student_data.get('email', 'N/A')}
        Department: {student_data.get('department', 'N/A')}
        Phone: {student_data.get('phone', 'N/A')}
        Year of Study: {student_data.get('year_of_study', 'N/A')}
        
        ORDER DETAILS:
        Order Number: {order_data.get('order_number', 'N/A')}
        Borrowed Date: {datetime.strptime(order_data.get('requested_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('requested_date') else 'N/A'}
        Expected Return Date: {datetime.strptime(order_data.get('expected_return_date', ''), '%Y-%m-%d').strftime('%B %d, %Y') if order_data.get('expected_return_date') else 'N/A'}
        Days Overdue: {days_overdue}
        Assigned Lender: {order_data.get('lender_name', 'N/A')}
        Status: OVERDUE
        
        OVERDUE EQUIPMENT:
        {items_text}
        Total Value at Risk: ${total_value:.2f}
        
        RECOMMENDED ACTIONS:
        - Contact student directly via phone or email
        - Send formal written notice if not resolved within 2 days
        - Consider applying academic hold for extended delays
        - Escalate to department head if no response within 1 week
        
        CONTACT INFORMATION:
        Student Email: {student_data.get('email', 'N/A')}
        Student Phone: {student_data.get('phone', 'N/A')}
        Assigned Lender: {order_data.get('lender_name', 'N/A')}
        
        This is an automated alert from the {self.university_name} Inventory Management System.
        Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
        """
        
        return subject, html_body, text_body
    
    def send_overdue_notifications(self, student_data: Dict, order_data: Dict, overdue_items: List[Dict]) -> Dict:
        """Send overdue notifications to both student and admin"""
        results = {
            'student_email_sent': False,
            'admin_email_sent': False,
            'errors': []
        }
        
        # Check if email service is properly configured
        if not self.sender_password or self.sender_email == 'your-email@gmail.com':
            error_msg = "Email service not configured - please set up SENDER_EMAIL and SENDER_PASSWORD in .env file"
            results['errors'].append(error_msg)
            email_logger.error(error_msg)
            return results
        
        try:
            email_logger.info(f"Processing overdue notifications for order {order_data.get('order_number', 'N/A')}")
            
            # Send student notification
            student_subject, student_html, student_text = self.get_student_overdue_template(
                student_data, order_data, overdue_items
            )
            
            student_email = student_data.get('email')
            if student_email and student_email.strip():
                email_logger.info(f"Sending student notification to: {student_email}")
                results['student_email_sent'] = self.send_email(
                    student_email, student_subject, student_html, student_text
                )
                if not results['student_email_sent']:
                    error_msg = f"Failed to send email to student: {student_email}"
                    results['errors'].append(error_msg)
                    email_logger.error(error_msg)
                else:
                    email_logger.info(f"Successfully sent student notification to: {student_email}")
            else:
                error_msg = "Student email address not available or empty"
                results['errors'].append(error_msg)
                email_logger.warning(error_msg)
            
            # Send admin notification
            admin_subject, admin_html, admin_text = self.get_admin_overdue_template(
                student_data, order_data, overdue_items
            )
            
            if self.admin_email and self.admin_email.strip():
                email_logger.info(f"Sending admin notification to: {self.admin_email}")
                results['admin_email_sent'] = self.send_email(
                    self.admin_email, admin_subject, admin_html, admin_text
                )
                if not results['admin_email_sent']:
                    error_msg = f"Failed to send email to admin: {self.admin_email}"
                    results['errors'].append(error_msg)
                    email_logger.error(error_msg)
                else:
                    email_logger.info(f"Successfully sent admin notification to: {self.admin_email}")
            else:
                error_msg = "Admin email address not configured"
                results['errors'].append(error_msg)
                email_logger.warning(error_msg)
            
            email_logger.info(f"Overdue notifications processed for order {order_data.get('order_number', 'N/A')} - Student: {results['student_email_sent']}, Admin: {results['admin_email_sent']}")
            
        except Exception as e:
            error_msg = f"Error processing overdue notifications: {str(e)}"
            results['errors'].append(error_msg)
            email_logger.error(error_msg)
        
        return results

# Global email service instance
email_service = EmailService()