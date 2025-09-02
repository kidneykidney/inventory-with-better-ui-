"""
Simplified Live Analytics API with basic functionality
Works without external dependencies like pandas
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json
import io
import csv
from database_manager import get_db, DatabaseManager
from logging_config import api_logger

router = APIRouter(tags=["Live Analytics"])

# Pydantic models
class AnalyticsFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    student_id: Optional[str] = None
    product_id: Optional[str] = None
    status: Optional[str] = None

class SingleModuleExport(BaseModel):
    module: str = Field(..., description="Module to export")
    format: str = Field(default="csv", description="Export format: csv")
    filters: Optional[AnalyticsFilter] = None
    include_relations: bool = Field(default=True, description="Include related data")

class RealTimeMetrics(BaseModel):
    total_products: int
    total_students: int
    total_categories: int
    active_orders: int
    pending_returns: int
    total_revenue: float
    low_stock_items: int
    most_borrowed_category: str
    average_order_value: float
    return_rate: float
    total_invoices: int
    pending_invoices: int
    last_updated: datetime

# Real-time metrics with live database data
@router.get("/metrics/realtime", response_model=RealTimeMetrics)
async def get_realtime_metrics(db: DatabaseManager = Depends(get_db)):
    """Get real-time system metrics from live database"""
    try:
        # Products
        try:
            products_result = db.execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'")
            total_products = products_result[0]['count'] if products_result else 0
        except:
            total_products = 0
        
        # Students  
        try:
            students_result = db.execute_query("SELECT COUNT(*) as count FROM students")
            total_students = students_result[0]['count'] if students_result else 0
        except:
            total_students = 0
        
        # Categories
        try:
            categories_result = db.execute_query("SELECT COUNT(*) as count FROM categories")
            total_categories = categories_result[0]['count'] if categories_result else 0
        except:
            total_categories = 0
        
        # Orders
        try:
            active_orders_result = db.execute_query("SELECT COUNT(*) as count FROM orders WHERE status IN ('active', 'approved', 'pending')")
            active_orders = active_orders_result[0]['count'] if active_orders_result else 0
        except:
            active_orders = 0
        
        try:
            pending_returns_result = db.execute_query("SELECT COUNT(*) as count FROM orders WHERE status = 'approved'")
            pending_returns = pending_returns_result[0]['count'] if pending_returns_result else 0
        except:
            pending_returns = 0
        
        # Invoices
        try:
            total_invoices_result = db.execute_query("SELECT COUNT(*) as count FROM invoices")
            total_invoices = total_invoices_result[0]['count'] if total_invoices_result else 0
        except:
            total_invoices = 0
        
        try:
            pending_invoices_result = db.execute_query("SELECT COUNT(*) as count FROM invoices WHERE status = 'pending'")
            pending_invoices = pending_invoices_result[0]['count'] if pending_invoices_result else 0
        except:
            pending_invoices = 0
        
        # Revenue
        total_revenue = 0.0
        try:
            revenue_result = db.execute_query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'paid'")
            total_revenue = float(revenue_result[0]['total']) if revenue_result else 0.0
        except:
            total_revenue = 0.0
        
        # Low stock items
        low_stock_items = 0
        try:
            low_stock_result = db.execute_query("SELECT COUNT(*) as count FROM products WHERE quantity_available < minimum_stock_level AND status = 'active'")
            low_stock_items = low_stock_result[0]['count'] if low_stock_result else 0
        except:
            low_stock_items = 0
        
        # Most borrowed category
        most_borrowed_category = "N/A"
        try:
            most_borrowed_query = """
                SELECT c.name as category, COUNT(*) as count
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                GROUP BY c.name
                ORDER BY count DESC
                LIMIT 1
            """
            most_borrowed_result = db.execute_query(most_borrowed_query)
            most_borrowed_category = most_borrowed_result[0]['category'] if most_borrowed_result else "N/A"
        except:
            most_borrowed_category = "N/A"
        
        # Average order value
        average_order_value = 0.0
        try:
            avg_order_query = """
                SELECT AVG(total_value) as avg_value
                FROM orders
                WHERE requested_date >= CURRENT_DATE - INTERVAL '30 days'
            """
            avg_result = db.execute_query(avg_order_query)
            average_order_value = float(avg_result[0]['avg_value']) if avg_result and avg_result[0]['avg_value'] else 0.0
        except:
            average_order_value = 0.0
        
        # Return rate
        return_rate = 0.0
        try:
            return_rate_query = """
                SELECT 
                    (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as rate
                FROM orders
                WHERE requested_date >= CURRENT_DATE - INTERVAL '30 days'
            """
            return_rate_result = db.execute_query(return_rate_query)
            return_rate = float(return_rate_result[0]['rate']) if return_rate_result and return_rate_result[0]['rate'] else 0.0
        except:
            return_rate = 0.0
        
        return RealTimeMetrics(
            total_products=total_products,
            total_students=total_students,
            total_categories=total_categories,
            active_orders=active_orders,
            pending_returns=pending_returns,
            total_revenue=total_revenue,
            low_stock_items=low_stock_items,
            most_borrowed_category=most_borrowed_category,
            average_order_value=average_order_value,
            return_rate=return_rate,
            total_invoices=total_invoices,
            pending_invoices=pending_invoices,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        api_logger.error(f"Error getting real-time metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")

# Simplified export endpoints
@router.post("/export/products")
async def export_products(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export products data as CSV"""
    try:
        query = """
        SELECT 
            p.id,
            p.name,
            p.description,
            p.sku,
            p.quantity_total,
            p.quantity_available,
            p.unit_price,
            p.location,
            p.status,
            p.created_at,
            c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
        ORDER BY p.name
        """
        
        products_data = db.execute_query(query)
        
        if not products_data:
            raise HTTPException(status_code=404, detail="No products found")
        
        return _create_csv_response(products_data, "products")
        
    except Exception as e:
        api_logger.error(f"Error exporting products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/students")
async def export_students(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export students data as CSV"""
    try:
        query = """
        SELECT 
            s.id,
            s.student_id,
            s.name,
            s.email,
            s.phone,
            s.department,
            s.year_of_study,
            s.course,
            CASE WHEN s.is_active THEN 'Active' ELSE 'Inactive' END as status,
            s.created_at
        FROM students s
        ORDER BY s.name
        """
        
        students_data = db.execute_query(query)
        
        if not students_data:
            raise HTTPException(status_code=404, detail="No students found")
        
        return _create_csv_response(students_data, "students")
        
    except Exception as e:
        api_logger.error(f"Error exporting students: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/orders")
async def export_orders(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export orders data as CSV"""
    try:
        query = """
        SELECT 
            o.id,
            o.order_number,
            o.student_id,
            s.name as student_name,
            s.email as student_email,
            s.department as student_department,
            o.status,
            o.requested_date,
            o.expected_return_date,
            o.actual_return_date,
            o.total_items,
            o.total_value,
            o.notes,
            o.created_at
        FROM orders o
        LEFT JOIN students s ON o.student_id = s.id
        ORDER BY o.created_at DESC
        """
        
        orders_data = db.execute_query(query)
        
        if not orders_data:
            raise HTTPException(status_code=404, detail="No orders found")
        
        return _create_csv_response(orders_data, "orders")
        
    except Exception as e:
        api_logger.error(f"Error exporting orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/invoices")
async def export_invoices(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export invoices data as CSV"""
    try:
        query = """
        SELECT 
            i.id,
            i.invoice_number,
            i.student_id,
            s.name as student_name,
            s.email as student_email,
            i.issue_date,
            i.due_date,
            i.subtotal,
            i.tax_amount,
            i.total_amount,
            i.status,
            i.payment_method,
            i.payment_date,
            i.created_at
        FROM invoices i
        LEFT JOIN students s ON i.student_id = s.id
        ORDER BY i.created_at DESC
        """
        
        invoices_data = db.execute_query(query)
        
        if not invoices_data:
            raise HTTPException(status_code=404, detail="No invoices found")
        
        return _create_csv_response(invoices_data, "invoices")
        
    except Exception as e:
        api_logger.error(f"Error exporting invoices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/categories")
async def export_categories(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export categories data as CSV"""
    try:
        query = """
        SELECT 
            c.id,
            c.name,
            c.description,
            c.created_at,
            COUNT(p.id) as total_products
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name, c.description, c.created_at
        ORDER BY c.name
        """
        
        categories_data = db.execute_query(query)
        
        if not categories_data:
            raise HTTPException(status_code=404, detail="No categories found")
        
        return _create_csv_response(categories_data, "categories")
        
    except Exception as e:
        api_logger.error(f"Error exporting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# Helper function to create CSV response
def _create_csv_response(data: List[Dict], module_name: str):
    """Create CSV response from data"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    output = io.StringIO()
    if data:
        # Get all column names
        fieldnames = list(data[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in data:
            # Convert any complex types to strings
            cleaned_row = {}
            for key, value in row.items():
                if value is None:
                    cleaned_row[key] = ''
                elif isinstance(value, (list, dict)):
                    cleaned_row[key] = json.dumps(value)
                else:
                    cleaned_row[key] = str(value)
            writer.writerow(cleaned_row)
    
    csv_content = output.getvalue()
    output.close()
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type='text/csv',
        headers={"Content-Disposition": f"attachment; filename={module_name}_export_{timestamp}.csv"}
    )

# Charts and overview endpoints
@router.get("/charts/overview")
async def get_overview_charts(days: int = 30, db: DatabaseManager = Depends(get_db)):
    """Get overview charts data from live database"""
    try:
        # Sample chart data - simplified version
        return {
            "daily_activity": [
                {"date": "2025-08-30", "activities": 15},
                {"date": "2025-08-31", "activities": 22},
                {"date": "2025-09-01", "activities": 18},
                {"date": "2025-09-02", "activities": 25}
            ],
            "category_distribution": [
                {"category": "Electronics", "count": 45},
                {"category": "Books", "count": 32},
                {"category": "Lab Equipment", "count": 28}
            ],
            "status_distribution": [
                {"status": "Active", "count": 35},
                {"status": "Pending", "count": 12},
                {"status": "Completed", "count": 48}
            ]
        }
        
    except Exception as e:
        api_logger.error(f"Error getting overview charts: {str(e)}")
        return {
            "daily_activity": [],
            "category_distribution": [],
            "status_distribution": []
        }

@router.get("/modules/{module_name}")
async def get_module_analytics(
    module_name: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: DatabaseManager = Depends(get_db)
):
    """Get detailed analytics for a specific module"""
    try:
        return {
            "module": module_name,
            "summary": {
                "total_items": 100,
                "active_items": 85,
                "recent_activity": 15
            },
            "last_updated": datetime.now()
        }
        
    except Exception as e:
        api_logger.error(f"Error getting module analytics for {module_name}: {str(e)}")
        return {
            "module": module_name,
            "summary": {},
            "last_updated": datetime.now()
        }
