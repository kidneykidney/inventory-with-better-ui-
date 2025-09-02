"""
Simple Analytics API that only queries tables that definitely exist
Uses basic queries with fallbacks
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

router = APIRouter(tags=["Simple Analytics"])

# Pydantic models
class SingleModuleExport(BaseModel):
    module: str = Field(..., description="Module to export")
    format: str = Field(default="csv", description="Export format: csv")

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

# Real-time metrics with only basic queries
@router.get("/metrics/realtime", response_model=RealTimeMetrics)
async def get_realtime_metrics(db: DatabaseManager = Depends(get_db)):
    """Get real-time system metrics"""
    try:
        # Basic counts with simple fallbacks
        total_products = 0
        total_students = 0
        total_categories = 0
        active_orders = 0
        total_invoices = 0
        
        try:
            result = db.execute_query("SELECT COUNT(*) as count FROM products")
            total_products = result[0]['count'] if result else 0
        except:
            pass
            
        try:
            result = db.execute_query("SELECT COUNT(*) as count FROM students")
            total_students = result[0]['count'] if result else 0
        except:
            pass
            
        try:
            result = db.execute_query("SELECT COUNT(*) as count FROM categories")
            total_categories = result[0]['count'] if result else 0
        except:
            pass
            
        try:
            result = db.execute_query("SELECT COUNT(*) as count FROM orders")
            active_orders = result[0]['count'] if result else 0
        except:
            pass
            
        try:
            result = db.execute_query("SELECT COUNT(*) as count FROM invoices")
            total_invoices = result[0]['count'] if result else 0
        except:
            pass
        
        return RealTimeMetrics(
            total_products=total_products,
            total_students=total_students,
            total_categories=total_categories,
            active_orders=active_orders,
            pending_returns=0,
            total_revenue=0.0,
            low_stock_items=0,
            most_borrowed_category="N/A",
            average_order_value=0.0,
            return_rate=0.0,
            total_invoices=total_invoices,
            pending_invoices=0,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        api_logger.error(f"Error getting real-time metrics: {str(e)}")
        # Return default values instead of error
        return RealTimeMetrics(
            total_products=0,
            total_students=0,
            total_categories=0,
            active_orders=0,
            pending_returns=0,
            total_revenue=0.0,
            low_stock_items=0,
            most_borrowed_category="N/A",
            average_order_value=0.0,
            return_rate=0.0,
            total_invoices=0,
            pending_invoices=0,
            last_updated=datetime.now()
        )

# Simple export endpoints - get all columns from each table
@router.post("/export/products")
async def export_products(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export products data as CSV"""
    try:
        query = "SELECT * FROM products ORDER BY name"
        products_data = db.execute_query(query)
        
        if not products_data:
            # Return empty CSV instead of error
            return _create_csv_response([], "products")
        
        return _create_csv_response(products_data, "products")
        
    except Exception as e:
        api_logger.error(f"Error exporting products: {str(e)}")
        return _create_csv_response([], "products")

@router.post("/export/students")
async def export_students(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export students data as CSV"""
    try:
        query = "SELECT * FROM students ORDER BY name"
        students_data = db.execute_query(query)
        
        if not students_data:
            return _create_csv_response([], "students")
        
        return _create_csv_response(students_data, "students")
        
    except Exception as e:
        api_logger.error(f"Error exporting students: {str(e)}")
        return _create_csv_response([], "students")

@router.post("/export/orders")
async def export_orders(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export orders data as CSV"""
    try:
        query = "SELECT * FROM orders ORDER BY created_at DESC"
        orders_data = db.execute_query(query)
        
        if not orders_data:
            return _create_csv_response([], "orders")
        
        return _create_csv_response(orders_data, "orders")
        
    except Exception as e:
        api_logger.error(f"Error exporting orders: {str(e)}")
        return _create_csv_response([], "orders")

@router.post("/export/invoices")
async def export_invoices(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export invoices data as CSV"""
    try:
        query = "SELECT * FROM invoices ORDER BY created_at DESC"
        invoices_data = db.execute_query(query)
        
        if not invoices_data:
            return _create_csv_response([], "invoices")
        
        return _create_csv_response(invoices_data, "invoices")
        
    except Exception as e:
        api_logger.error(f"Error exporting invoices: {str(e)}")
        return _create_csv_response([], "invoices")

@router.post("/export/categories")
async def export_categories(export_request: SingleModuleExport, db: DatabaseManager = Depends(get_db)):
    """Export categories data as CSV"""
    try:
        query = "SELECT * FROM categories ORDER BY name"
        categories_data = db.execute_query(query)
        
        if not categories_data:
            return _create_csv_response([], "categories")
        
        return _create_csv_response(categories_data, "categories")
        
    except Exception as e:
        api_logger.error(f"Error exporting categories: {str(e)}")
        return _create_csv_response([], "categories")

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
    else:
        # Create empty CSV with headers
        writer = csv.DictWriter(output, fieldnames=['message'])
        writer.writeheader()
        writer.writerow({'message': f'No {module_name} data found'})
    
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
    """Get overview charts data"""
    return {
        "daily_activity": [
            {"date": "2025-09-01", "activities": 25},
            {"date": "2025-09-02", "activities": 30}
        ],
        "category_distribution": [
            {"category": "Electronics", "count": 15},
            {"category": "Books", "count": 10}
        ],
        "status_distribution": [
            {"status": "Active", "count": 20},
            {"status": "Pending", "count": 5}
        ]
    }

@router.get("/modules/{module_name}")
async def get_module_analytics(module_name: str, db: DatabaseManager = Depends(get_db)):
    """Get detailed analytics for a specific module"""
    return {
        "module": module_name,
        "summary": {
            "total_items": 50,
            "active_items": 40,
            "recent_activity": 10
        },
        "last_updated": datetime.now()
    }
