"""
Comprehensive Real-Time Analytics API with Live Database Integration
Provides separate exports for each module with all database fields
"""

from fastapi import APIRouter, HTTPException, Depends, Response, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date, timedelta
import pandas as pd
import json
import io
import zipfile
from database_manager import get_db, DatabaseManager
from logging_config import api_logger
import asyncio

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
    module: str = Field(..., description="Module to export: products, students, orders, invoices, categories")
    format: str = Field(default="excel", description="Export format: excel, csv")
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
        products_result = db.execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'")
        total_products = products_result[0]['count'] if products_result else 0
        
        # Students  
        students_result = db.execute_query("SELECT COUNT(*) as count FROM students")
        total_students = students_result[0]['count'] if students_result else 0
        
        # Categories
        categories_result = db.execute_query("SELECT COUNT(*) as count FROM categories")
        total_categories = categories_result[0]['count'] if categories_result else 0
        
        # Orders
        active_orders_result = db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status IN ('active', 'borrowed')")
        active_orders = active_orders_result[0]['count'] if active_orders_result else 0
        
        pending_returns_result = db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status = 'borrowed'")
        pending_returns = pending_returns_result[0]['count'] if pending_returns_result else 0
        
        # Invoices
        total_invoices_result = db.execute_query("SELECT COUNT(*) as count FROM invoices")
        total_invoices = total_invoices_result[0]['count'] if total_invoices_result else 0
        
        pending_invoices_result = db.execute_query("SELECT COUNT(*) as count FROM invoices WHERE status = 'pending'")
        pending_invoices = pending_invoices_result[0]['count'] if pending_invoices_result else 0
        
        # Revenue
        try:
            revenue_result = db.execute_query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'paid'")
            total_revenue = float(revenue_result[0]['total']) if revenue_result else 0.0
        except:
            total_revenue = 0.0
        
        # Low stock items
        low_stock_result = db.execute_query("SELECT COUNT(*) as count FROM products WHERE quantity_available < minimum_stock_level AND status = 'active'")
        low_stock_items = low_stock_result[0]['count'] if low_stock_result else 0
        
        # Most borrowed category
        try:
            most_borrowed_query = """
                SELECT c.name as category, COUNT(*) as count
                FROM student_orders so
                JOIN products p ON so.product_id = p.id
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
        try:
            avg_order_query = """
                SELECT AVG(p.unit_price * so.quantity) as avg_value
                FROM student_orders so
                JOIN products p ON so.product_id = p.id
                WHERE so.created_at >= CURRENT_DATE - INTERVAL '30 days'
            """
            avg_result = db.execute_query(avg_order_query)
            average_order_value = float(avg_result[0]['avg_value']) if avg_result and avg_result[0]['avg_value'] else 0.0
        except:
            average_order_value = 0.0
        
        # Return rate
        try:
            return_rate_query = """
                SELECT 
                    (COUNT(CASE WHEN status = 'returned' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as rate
                FROM student_orders
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
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

# Separate export endpoints for each module
@router.post("/export/products")
async def export_products(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export products data with all database fields"""
    try:
        # Get products with all fields and relations
        query = """
        SELECT 
            p.id,
            p.name,
            p.description,
            p.sku,
            p.quantity_total,
            p.quantity_available,
            p.is_returnable,
            p.unit_price,
            p.location,
            p.minimum_stock_level,
            p.image_url,
            p.specifications,
            p.tags,
            p.status,
            p.created_at,
            p.updated_at,
            c.name as category_name,
            c.description as category_description,
            (p.quantity_total - p.quantity_available) as quantity_borrowed,
            (p.quantity_available * p.unit_price) as total_value,
            CASE 
                WHEN p.quantity_available <= p.minimum_stock_level THEN 'Low Stock'
                WHEN p.quantity_available = 0 THEN 'Out of Stock'
                ELSE 'In Stock'
            END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
        ORDER BY p.name
        """
        
        # Apply filters if provided
        if export_request.filters:
            conditions = []
            if export_request.filters.category:
                conditions.append(f"c.name ILIKE '%{export_request.filters.category}%'")
            if export_request.filters.start_date:
                conditions.append(f"p.created_at >= '{export_request.filters.start_date}'")
            if export_request.filters.end_date:
                conditions.append(f"p.created_at <= '{export_request.filters.end_date}'")
            
            if conditions:
                query = query.replace("ORDER BY", f"AND ({' AND '.join(conditions)}) ORDER BY")
        
        products_data = db.execute_query(query)
        
        if not products_data:
            raise HTTPException(status_code=404, detail="No products found")
        
        # Convert to DataFrame
        df = pd.DataFrame(products_data)
        
        # Convert JSON columns to strings for Excel
        if 'specifications' in df.columns:
            df['specifications'] = df['specifications'].apply(lambda x: json.dumps(x) if x else '')
        if 'tags' in df.columns:
            df['tags'] = df['tags'].apply(lambda x: ', '.join(x) if x else '')
        
        # Format dates
        date_columns = ['created_at', 'updated_at']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col]).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        return await _create_export_response(df, "products", export_request.format)
        
    except Exception as e:
        api_logger.error(f"Error exporting products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/students")
async def export_students(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export students data with all database fields"""
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
            s.status,
            s.emergency_contact,
            s.address,
            s.date_of_birth,
            s.created_at,
            s.updated_at,
            COUNT(so.id) as total_orders,
            COUNT(CASE WHEN so.status = 'active' THEN 1 END) as active_orders,
            COUNT(CASE WHEN so.status = 'returned' THEN 1 END) as returned_orders,
            COALESCE(SUM(CASE WHEN so.status != 'cancelled' THEN p.unit_price * so.quantity END), 0) as total_order_value
        FROM students s
        LEFT JOIN student_orders so ON s.id = so.student_id
        LEFT JOIN products p ON so.product_id = p.id
        GROUP BY s.id, s.student_id, s.name, s.email, s.phone, s.department, 
                 s.year_of_study, s.course, s.status, s.emergency_contact, 
                 s.address, s.date_of_birth, s.created_at, s.updated_at
        ORDER BY s.name
        """
        
        students_data = db.execute_query(query)
        
        if not students_data:
            raise HTTPException(status_code=404, detail="No students found")
        
        df = pd.DataFrame(students_data)
        
        # Format dates
        date_columns = ['created_at', 'updated_at', 'date_of_birth']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
        
        return await _create_export_response(df, "students", export_request.format)
        
    except Exception as e:
        api_logger.error(f"Error exporting students: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/orders")
async def export_orders(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export orders data with all database fields"""
    try:
        query = """
        SELECT 
            so.id,
            so.student_id,
            s.name as student_name,
            s.email as student_email,
            s.department as student_department,
            so.product_id,
            p.name as product_name,
            p.sku as product_sku,
            c.name as category_name,
            so.quantity,
            so.borrowed_date,
            so.due_date,
            so.returned_date,
            so.status,
            so.notes,
            so.created_at,
            so.updated_at,
            p.unit_price,
            (p.unit_price * so.quantity) as order_value,
            CASE 
                WHEN so.status = 'borrowed' AND so.due_date < CURRENT_DATE THEN 'Overdue'
                WHEN so.status = 'borrowed' THEN 'Active'
                ELSE INITCAP(so.status)
            END as order_status_display,
            CASE 
                WHEN so.due_date IS NOT NULL THEN (so.due_date - CURRENT_DATE)
                ELSE NULL 
            END as days_until_due
        FROM student_orders so
        LEFT JOIN students s ON so.student_id = s.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY so.created_at DESC
        """
        
        orders_data = db.execute_query(query)
        
        if not orders_data:
            raise HTTPException(status_code=404, detail="No orders found")
        
        df = pd.DataFrame(orders_data)
        
        # Format dates
        date_columns = ['borrowed_date', 'due_date', 'returned_date', 'created_at', 'updated_at']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
        
        return await _create_export_response(df, "orders", export_request.format)
        
    except Exception as e:
        api_logger.error(f"Error exporting orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/invoices")
async def export_invoices(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export invoices data with all database fields"""
    try:
        query = """
        SELECT 
            i.id,
            i.invoice_number,
            i.student_id,
            s.name as student_name,
            s.email as student_email,
            s.department as student_department,
            i.issue_date,
            i.due_date,
            i.subtotal,
            i.tax_amount,
            i.discount_amount,
            i.total_amount,
            i.status,
            i.payment_method,
            i.payment_date,
            i.notes,
            i.created_at,
            i.updated_at,
            COUNT(ii.id) as total_items,
            SUM(ii.quantity) as total_quantity,
            CASE 
                WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN 'Overdue'
                ELSE INITCAP(i.status)
            END as status_display,
            (i.due_date - CURRENT_DATE) as days_until_due
        FROM invoices i
        LEFT JOIN students s ON i.student_id = s.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        GROUP BY i.id, i.invoice_number, i.student_id, s.name, s.email, s.department,
                 i.issue_date, i.due_date, i.subtotal, i.tax_amount, i.discount_amount,
                 i.total_amount, i.status, i.payment_method, i.payment_date, i.notes,
                 i.created_at, i.updated_at
        ORDER BY i.created_at DESC
        """
        
        invoices_data = db.execute_query(query)
        
        if not invoices_data:
            raise HTTPException(status_code=404, detail="No invoices found")
        
        df = pd.DataFrame(invoices_data)
        
        # Format dates
        date_columns = ['issue_date', 'due_date', 'payment_date', 'created_at', 'updated_at']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
        
        return await _create_export_response(df, "invoices", export_request.format)
        
    except Exception as e:
        api_logger.error(f"Error exporting invoices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/export/categories")
async def export_categories(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export categories data with all database fields"""
    try:
        query = """
        SELECT 
            c.id,
            c.name,
            c.description,
            c.created_at,
            c.updated_at,
            COUNT(p.id) as total_products,
            COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
            COALESCE(SUM(p.quantity_available), 0) as total_available_quantity,
            COALESCE(SUM(p.quantity_total), 0) as total_inventory_quantity,
            COALESCE(SUM(p.quantity_available * p.unit_price), 0) as total_inventory_value,
            COALESCE(AVG(p.unit_price), 0) as average_product_price
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
        ORDER BY c.name
        """
        
        categories_data = db.execute_query(query)
        
        if not categories_data:
            raise HTTPException(status_code=404, detail="No categories found")
        
        df = pd.DataFrame(categories_data)
        
        # Format dates
        date_columns = ['created_at', 'updated_at']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d %H:%M:%S')
        
        return await _create_export_response(df, "categories", export_request.format)
        
    except Exception as e:
        api_logger.error(f"Error exporting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# Helper function to create export response
async def _create_export_response(df: pd.DataFrame, module_name: str, format_type: str):
    """Create export response for Excel or CSV"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if format_type.lower() == 'excel':
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=module_name.capitalize(), index=False)
            
            # Add summary sheet
            summary_df = pd.DataFrame({
                'Metric': [
                    'Total Records',
                    'Export Date',
                    'Export Time',
                    'Module',
                    'Format'
                ],
                'Value': [
                    len(df),
                    datetime.now().strftime('%Y-%m-%d'),
                    datetime.now().strftime('%H:%M:%S'),
                    module_name.capitalize(),
                    'Excel (.xlsx)'
                ]
            })
            summary_df.to_excel(writer, sheet_name='Export Summary', index=False)
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": f"attachment; filename={module_name}_export_{timestamp}.xlsx"}
        )
    
    else:  # CSV format
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
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
        # Daily activity
        daily_activity_query = f"""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as activities
        FROM (
            SELECT created_at FROM student_orders WHERE created_at >= CURRENT_DATE - INTERVAL '{days} days'
            UNION ALL
            SELECT created_at FROM invoices WHERE created_at >= CURRENT_DATE - INTERVAL '{days} days'
            UNION ALL
            SELECT created_at FROM products WHERE created_at >= CURRENT_DATE - INTERVAL '{days} days'
        ) combined_activities
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT {days}
        """
        
        daily_activity = db.execute_query(daily_activity_query)
        
        # Category distribution
        category_dist_query = """
        SELECT 
            c.name as category,
            COUNT(p.id) as count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
        GROUP BY c.name
        HAVING COUNT(p.id) > 0
        ORDER BY count DESC
        """
        
        category_distribution = db.execute_query(category_dist_query)
        
        # Status distribution
        status_dist_query = """
        SELECT 
            status,
            COUNT(*) as count
        FROM student_orders
        GROUP BY status
        ORDER BY count DESC
        """
        
        status_distribution = db.execute_query(status_dist_query)
        
        return {
            "daily_activity": [{"date": str(row['date']), "activities": row['activities']} for row in daily_activity],
            "category_distribution": category_distribution,
            "status_distribution": status_distribution
        }
        
    except Exception as e:
        api_logger.error(f"Error getting overview charts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving charts: {str(e)}")

@router.get("/modules/{module_name}")
async def get_module_analytics(
    module_name: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: DatabaseManager = Depends(get_db)
):
    """Get detailed analytics for a specific module"""
    try:
        if module_name == "products":
            query = """
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
                SUM(quantity_available) as total_available,
                SUM(quantity_total) as total_inventory,
                AVG(unit_price) as avg_price,
                COUNT(CASE WHEN quantity_available <= minimum_stock_level THEN 1 END) as low_stock_count
            FROM products
            """
        elif module_name == "students":
            query = """
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
                COUNT(DISTINCT department) as departments,
                AVG(year_of_study) as avg_year,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_registrations
            FROM students
            """
        elif module_name == "orders":
            query = """
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
                COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_items,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_items,
                AVG(quantity) as avg_quantity
            FROM student_orders
            """
        else:
            return {"error": "Module not found"}
        
        result = db.execute_query(query)
        
        return {
            "module": module_name,
            "summary": result[0] if result else {},
            "last_updated": datetime.now()
        }
        
    except Exception as e:
        api_logger.error(f"Error getting module analytics for {module_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")
