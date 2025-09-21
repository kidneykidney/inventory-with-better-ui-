"""
Automatic Invoice Generation Service
Generates invoices automatically when lending orders are created
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import logging
from database_manager import DatabaseManager
from invoice_models import InvoiceType, InvoiceStatus

logger = logging.getLogger(__name__)

class AutoInvoiceService:
    """Service for automatic invoice generation from lending orders"""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def generate_invoice_from_order(self, order_id: str, issued_by: str = "System") -> Optional[str]:
        """
        Automatically generate an invoice from a lending order
        Using the equipment lending invoice template format
        
        Args:
            order_id: The lending order ID
            issued_by: Who issued the invoice (default: System)
            
        Returns:
            Invoice ID if successful, None if failed
        """
        try:
            # Get order details with student and lender information
            order_query = """
            SELECT 
                o.id, o.order_number, o.student_id, o.lender_id, o.expected_return_date,
                o.requested_date, o.notes, 
                s.name as student_name, s.student_id as student_id_number, 
                s.email as student_email, s.department, s.year_of_study, s.course,
                s.phone as student_phone, s.address as student_address,
                l.name as lender_name, l.email as lender_email, 
                l.department as lender_department, l.designation as lender_designation
            FROM orders o
            LEFT JOIN students s ON o.student_id = s.id
            LEFT JOIN lenders l ON o.lender_id = l.id
            WHERE o.id = %s
            """
            
            order_result = self.db.execute_query(order_query, (order_id,))
            if not order_result:
                logger.error(f"Order {order_id} not found for invoice generation")
                return None
                
            order = order_result[0]
            
            # Get order items for equipment details
            items_query = """
            SELECT 
                oi.id as order_item_id, oi.quantity_requested as quantity, oi.notes as item_notes,
                p.id as product_id, p.name as product_name, p.sku as product_sku,
                p.description, p.unit_price as unit_value
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
            """
            
            items_result = self.db.execute_query(items_query, (order_id,))
            
            # Calculate dates based on template requirements
            issue_date = datetime.now()
            due_date = order['expected_return_date'] if order['expected_return_date'] else issue_date + timedelta(days=30)
            
            # Create invoice with enhanced lending information (following template structure)
            invoice_data = {
                'order_id': order_id,
                'student_id': order['student_id'],
                'invoice_type': InvoiceType.LENDING,
                'status': InvoiceStatus.ISSUED,
                'issued_by': issued_by,
                'due_date': due_date,
                'lender_id': order['lender_id'],
                'issued_by_lender': order['lender_id'],
                
                # Enhanced lending information (from template)
                'lending_purpose': f"Academic use for {order['course']}" if order.get('course') else "Equipment lending for academic purposes",
                'lending_location': order['lender_department'] or "Campus",
                'project_name': order['course'],
                'supervisor_name': order['lender_name'],
                'supervisor_email': order['lender_email'],
                'lending_terms': self._generate_lending_terms(),
                
                # Enhanced borrower information (from template)
                'borrower_phone': order['student_phone'],
                'borrower_address': order['student_address'],
                
                # Enhanced timing (from template)
                'requested_start_date': order['requested_date'],
                'actual_lending_date': issue_date,
                'expected_return_date': due_date,
                'grace_period_days': 7,
                
                # Financial information (from template)
                'security_deposit': 0.0,
                'late_return_fee': 50.0,  # Default late fee
                
                # Authority information (from template)
                'issuer_designation': order['lender_designation'] or "Equipment Manager",
                'approved_by': order['lender_name'],
                'approval_date': issue_date,
                
                # Additional information (from template)
                'special_instructions': self._generate_special_instructions(order),
                'risk_assessment': "low",
                'acknowledgment_method': "digital_signature",
                'notes': f"Auto-generated from order {order['order_number']}. {order['notes'] or ''}"
            }
            
            # Insert invoice (using only existing columns)
            invoice_query = """
            INSERT INTO invoices (
                order_id, student_id, invoice_type, status, due_date, issued_by, 
                lender_id, issued_by_lender, notes
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING id
            """
            
            invoice_values = (
                invoice_data['order_id'], invoice_data['student_id'], 
                invoice_data['invoice_type'], invoice_data['status'],
                invoice_data['due_date'], invoice_data['issued_by'],
                invoice_data['lender_id'], invoice_data['issued_by_lender'],
                invoice_data['notes']
            )
            
            invoice_result = self.db.execute_query(invoice_query, invoice_values)
            if not invoice_result:
                logger.error(f"Failed to create invoice for order {order_id}")
                return None
                
            invoice_id = invoice_result[0]['id']
            logger.info(f"Created invoice {invoice_id} for order {order_id}")
            
            # Add invoice items (equipment details from template)
            if items_result:
                await self._create_invoice_items(invoice_id, items_result, order)
            
            # Update invoice totals
            await self._update_invoice_totals(invoice_id)
            
            # Log transaction
            self._log_invoice_transaction(
                invoice_id, 'created', None, 'issued', 
                issued_by, f"Auto-generated from order {order['order_number']}"
            )
            
            logger.info(f"Successfully generated invoice {invoice_id} from order {order_id}")
            return invoice_id
            
        except Exception as e:
            logger.error(f"Error generating invoice from order {order_id}: {str(e)}")
            return None
    
    async def _create_invoice_items(self, invoice_id: str, items: List[Dict], order: Dict):
        """Create invoice items with enhanced details from template"""
        for item in items:
            # Calculate enhanced item details (using only available columns)
            item_data = {
                'invoice_id': invoice_id,
                'order_item_id': item['order_item_id'],
                'product_id': item['product_id'],
                'product_name': item['product_name'],
                'product_sku': item['product_sku'],
                'quantity': item['quantity'],
                'unit_value': item['unit_value'] or 0.0,
                'notes': item['item_notes']
            }
            
            item_query = """
            INSERT INTO invoice_items (
                invoice_id, order_item_id, product_id, product_name, product_sku,
                quantity, unit_value, notes
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            )
            """
            
            item_values = (
                item_data['invoice_id'], item_data['order_item_id'],
                item_data['product_id'], item_data['product_name'],
                item_data['product_sku'], item_data['quantity'],
                item_data['unit_value'], item_data['notes']
            )
            
            self.db.execute_command(item_query, item_values)
    
    async def _update_invoice_totals(self, invoice_id: str):
        """Update invoice totals based on items"""
        update_query = """
        UPDATE invoices SET 
            total_items = (
                SELECT COALESCE(SUM(quantity), 0) 
                FROM invoice_items 
                WHERE invoice_id = %s
            ),
            total_value = (
                SELECT COALESCE(SUM(unit_value * quantity), 0) 
                FROM invoice_items 
                WHERE invoice_id = %s
            )
        WHERE id = %s
        """
        
        self.db.execute_command(update_query, (invoice_id, invoice_id, invoice_id))
    
    def _generate_lending_terms(self) -> str:
        """Generate standard lending terms for the invoice (from template)"""
        return """
        1. The borrower is responsible for the proper care and maintenance of all borrowed equipment.
        2. Equipment must be returned in the same condition as received, accounting for normal wear and tear.
        3. Any damage, loss, or theft must be reported immediately to the lending authority.
        4. Late return may result in additional fees as specified in this invoice.
        5. The borrower agrees to allow inspection of equipment during the lending period.
        6. Equipment may be recalled by the institution if needed for emergency or priority use.
        7. The borrower must not lend, transfer, or allow unauthorized use of the equipment by others.
        8. Training or certification may be required for certain equipment before lending approval.
        """
    
    def _generate_special_instructions(self, order: Dict) -> str:
        """Generate special instructions based on order details"""
        instructions = []
        
        if order.get('course'):
            instructions.append(f"Equipment intended for academic use in {order['course']}")
        
        if order.get('course'):
            instructions.append(f"Course: {order['course']}")
        
        instructions.append("Please handle all equipment with care and follow safety protocols")
        instructions.append("Contact the lending department for any questions or issues")
        
        return ". ".join(instructions)
    
    def _calculate_lending_days(self, order: Dict) -> int:
        """Calculate lending duration in days"""
        if order.get('expected_return_date') and order.get('requested_date'):
            delta = order['expected_return_date'] - order['requested_date']
            return max(1, delta.days)
        return 30  # Default 30 days
    
    def _log_invoice_transaction(self, invoice_id: str, transaction_type: str, 
                                 previous_status: Optional[str], new_status: Optional[str], 
                                 performed_by: str, changes_summary: str):
        """Log invoice transaction"""
        query = """
        INSERT INTO invoice_transactions (
            invoice_id, transaction_type, previous_status, new_status,
            performed_by, changes_summary
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        self.db.execute_command(
            query, 
            (invoice_id, transaction_type, previous_status, new_status, performed_by, changes_summary)
        )

# Utility function for easy integration
async def auto_generate_invoice_for_order(db: DatabaseManager, order_id: str, 
                                         issued_by: str = "System") -> Optional[str]:
    """
    Convenience function to generate invoice for an order
    
    Args:
        db: Database manager instance
        order_id: The order ID to generate invoice for
        issued_by: Who issued the invoice
        
    Returns:
        Invoice ID if successful, None if failed
    """
    service = AutoInvoiceService(db)
    return await service.generate_invoice_from_order(order_id, issued_by)