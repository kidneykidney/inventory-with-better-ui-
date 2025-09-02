"""
Simplified Real-Time Analytics API for Inventory Management System
Provides comprehensive analytics, reporting, and Excel export functionality
"""

from fastapi import APIRouter, HTTPException, Depends, Response, Query, WebSocket
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
import calendar

router = APIRouter(tags=["Analytics"])

# Pydantic models for analytics
class AnalyticsFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    student_id: Optional[str] = None
    product_id: Optional[str] = None
    status: Optional[str] = None

class ExportRequest(BaseModel):
    modules: List[str] = Field(..., description="List of modules to export (products, students, orders, invoices)")
    format: str = Field(default="excel", description="Export format: excel, csv")
    filters: Optional[AnalyticsFilter] = None
    include_analytics: bool = Field(default=True, description="Include analytics summary")

class RealTimeMetrics(BaseModel):
    total_products: int
    total_students: int
    active_orders: int
    pending_returns: int
    total_revenue: float
    low_stock_items: int
    most_borrowed_category: str
    average_order_value: float
    return_rate: float
    last_updated: datetime

# Real-time metrics endpoint
@router.get("/metrics/realtime", response_model=RealTimeMetrics)
async def get_realtime_metrics(db: DatabaseManager = Depends(get_db)):
    """Get real-time system metrics"""
    try:
        # Get basic counts
        total_products_result = db.execute_query("SELECT COUNT(*) as count FROM products")
        total_products = total_products_result[0]['count'] if total_products_result else 0
        
        total_students_result = db.execute_query("SELECT COUNT(*) as count FROM students")
        total_students = total_students_result[0]['count'] if total_students_result else 0
        
        active_orders_result = db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status = 'active'")
        active_orders = active_orders_result[0]['count'] if active_orders_result else 0
        
        pending_returns_result = db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status = 'borrowed'")
        pending_returns = pending_returns_result[0]['count'] if pending_returns_result else 0
        
        # Get revenue (if invoices table exists)
        try:
            revenue_result = db.execute_query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices")
            total_revenue = float(revenue_result[0]['total']) if revenue_result else 0.0
        except:
            total_revenue = 0.0
        
        # Low stock items (quantity < 10)
        low_stock_result = db.execute_query("SELECT COUNT(*) as count FROM products WHERE quantity_available < 10")
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
            active_orders=active_orders,
            pending_returns=pending_returns,
            total_revenue=total_revenue,
            low_stock_items=low_stock_items,
            most_borrowed_category=most_borrowed_category,
            average_order_value=average_order_value,
            return_rate=return_rate,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        api_logger.error(f"Error getting real-time metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")

# Module-specific analytics
@router.get("/modules/{module_name}")
async def get_module_analytics(
    module_name: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: DatabaseManager = Depends(get_db)
):
    """Get analytics for specific module (products, students, orders, invoices)"""
    try:
        # Build date filter
        date_filter = ""
        if start_date:
            date_filter += f" AND created_at >= '{start_date}'"
        if end_date:
            date_filter += f" AND created_at <= '{end_date}'"
        
        if module_name == "products":
            return await _get_products_analytics(db, date_filter)
        elif module_name == "students":
            return await _get_students_analytics(db, date_filter)
        elif module_name == "orders":
            return await _get_orders_analytics(db, date_filter)
        elif module_name == "invoices":
            return await _get_invoices_analytics(db, date_filter)
        else:
            raise HTTPException(status_code=400, detail="Invalid module name")
            
    except Exception as e:
        api_logger.error(f"Error getting {module_name} analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving {module_name} analytics: {str(e)}")

async def _get_products_analytics(db, date_filter):
    """Get comprehensive products analytics"""
    try:
        # Total products and categories
        total_products_result = db.execute_query(f"SELECT COUNT(*) as count FROM products WHERE 1=1{date_filter}")
        total_products = total_products_result[0]['count'] if total_products_result else 0
        
        # Category distribution
        category_query = f"""
            SELECT c.name as category, COUNT(p.id) as count, AVG(p.unit_price) as avg_price, SUM(p.quantity_available) as total_stock
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE 1=1{date_filter}
            GROUP BY c.name
            ORDER BY count DESC
        """
        categories = db.execute_query(category_query)
        
        # Stock analysis
        stock_query = f"""
            SELECT 
                COUNT(CASE WHEN quantity_available = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN quantity_available > 0 AND quantity_available <= 10 THEN 1 END) as low_stock,
                COUNT(CASE WHEN quantity_available > 10 THEN 1 END) as in_stock,
                AVG(quantity_available) as avg_stock
            FROM products 
            WHERE 1=1{date_filter}
        """
        stock_info = db.execute_query(stock_query)[0] if db.execute_query(stock_query) else {}
        
        # Most popular products (by orders)
        popular_query = f"""
            SELECT p.name, p.sku, COUNT(so.id) as order_count, p.quantity_available as current_stock
            FROM products p
            LEFT JOIN student_orders so ON p.id = so.product_id
            WHERE 1=1{date_filter.replace('created_at', 'p.created_at')}
            GROUP BY p.id, p.name, p.sku, p.quantity_available
            ORDER BY order_count DESC
            LIMIT 10
        """
        popular_products = db.execute_query(popular_query)
        
        return {
            "module": "products",
            "summary": {
                "total_products": total_products,
                "total_categories": len(categories),
                "stock_status": stock_info
            },
            "categories": categories,
            "popular_products": popular_products,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        api_logger.error(f"Error in products analytics: {str(e)}")
        return {"module": "products", "error": str(e)}

async def _get_students_analytics(db, date_filter):
    """Get comprehensive students analytics"""
    try:
        # Basic student stats
        total_students_result = db.execute_query(f"SELECT COUNT(*) as count FROM students WHERE 1=1{date_filter}")
        total_students = total_students_result[0]['count'] if total_students_result else 0
        
        # Department distribution
        dept_query = f"""
            SELECT department, COUNT(*) as count
            FROM students 
            WHERE 1=1{date_filter}
            GROUP BY department
            ORDER BY count DESC
        """
        departments = db.execute_query(dept_query)
        
        # Year distribution
        year_query = f"""
            SELECT year_of_study, COUNT(*) as count
            FROM students 
            WHERE 1=1{date_filter}
            GROUP BY year_of_study
            ORDER BY year_of_study
        """
        years = db.execute_query(year_query)
        
        # Most active students
        active_query = f"""
            SELECT s.name, s.email, s.department, COUNT(so.id) as order_count
            FROM students s
            LEFT JOIN student_orders so ON s.id = so.student_id
            WHERE 1=1{date_filter.replace('created_at', 's.created_at')}
            GROUP BY s.id, s.name, s.email, s.department
            ORDER BY order_count DESC
            LIMIT 10
        """
        active_students = db.execute_query(active_query)
        
        return {
            "module": "students",
            "summary": {
                "total_students": total_students,
                "total_departments": len(departments),
                "total_years": len(years)
            },
            "departments": departments,
            "years": years,
            "most_active": active_students,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        api_logger.error(f"Error in students analytics: {str(e)}")
        return {"module": "students", "error": str(e)}

async def _get_orders_analytics(db, date_filter):
    """Get comprehensive orders analytics"""
    try:
        # Order statistics
        total_orders_result = db.execute_query(f"SELECT COUNT(*) as count FROM student_orders WHERE 1=1{date_filter}")
        total_orders = total_orders_result[0]['count'] if total_orders_result else 0
        
        # Status distribution
        status_query = f"""
            SELECT status, COUNT(*) as count
            FROM student_orders 
            WHERE 1=1{date_filter}
            GROUP BY status
        """
        status_dist = db.execute_query(status_query)
        
        # Monthly trends
        monthly_query = f"""
            SELECT 
                EXTRACT(year FROM created_at) as year,
                EXTRACT(month FROM created_at) as month,
                COUNT(*) as order_count,
                AVG(quantity) as avg_quantity
            FROM student_orders 
            WHERE 1=1{date_filter}
            GROUP BY year, month
            ORDER BY year, month
        """
        monthly_data = db.execute_query(monthly_query)
        
        monthly_trends = []
        for row in monthly_data:
            month_name = calendar.month_abbr[int(row['month'])]
            monthly_trends.append({
                "month": f"{month_name} {int(row['year'])}",
                "order_count": row['order_count'],
                "avg_quantity": float(row['avg_quantity'] or 0)
            })
        
        return {
            "module": "orders",
            "summary": {
                "total_orders": total_orders,
                "status_distribution": status_dist
            },
            "monthly_trends": monthly_trends,
            "status_breakdown": status_dist,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        api_logger.error(f"Error in orders analytics: {str(e)}")
        return {"module": "orders", "error": str(e)}

async def _get_invoices_analytics(db, date_filter):
    """Get comprehensive invoices analytics"""
    try:
        # Check if invoices table exists
        total_invoices_result = db.execute_query(f"SELECT COUNT(*) as count FROM invoices WHERE 1=1{date_filter}")
        total_invoices = total_invoices_result[0]['count'] if total_invoices_result else 0
        
        # Revenue analysis
        revenue_query = f"""
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(AVG(total_amount), 0) as avg_invoice_value,
                COUNT(*) as invoice_count
            FROM invoices 
            WHERE 1=1{date_filter}
        """
        revenue_data = db.execute_query(revenue_query)
        revenue_info = revenue_data[0] if revenue_data else {}
        
        # Monthly revenue trends
        monthly_revenue_query = f"""
            SELECT 
                EXTRACT(year FROM created_at) as year,
                EXTRACT(month FROM created_at) as month,
                COALESCE(SUM(total_amount), 0) as revenue,
                COUNT(*) as invoice_count
            FROM invoices 
            WHERE 1=1{date_filter}
            GROUP BY year, month
            ORDER BY year, month
        """
        monthly_revenue_data = db.execute_query(monthly_revenue_query)
        
        monthly_revenue = []
        for row in monthly_revenue_data:
            month_name = calendar.month_abbr[int(row['month'])]
            monthly_revenue.append({
                "month": f"{month_name} {int(row['year'])}",
                "revenue": float(row['revenue'] or 0),
                "invoice_count": row['invoice_count']
            })
        
        return {
            "module": "invoices",
            "summary": {
                "total_invoices": total_invoices,
                "total_revenue": float(revenue_info.get('total_revenue', 0)),
                "avg_invoice_value": float(revenue_info.get('avg_invoice_value', 0))
            },
            "monthly_revenue": monthly_revenue,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        # If invoices table doesn't exist, return empty data
        return {
            "module": "invoices",
            "summary": {
                "total_invoices": 0,
                "total_revenue": 0.0,
                "avg_invoice_value": 0.0
            },
            "monthly_revenue": [],
            "note": "Invoice module not available",
            "error": str(e)
        }

# Excel export functionality
@router.post("/export")
async def export_data(
    request: ExportRequest,
    db: DatabaseManager = Depends(get_db)
):
    """Export module data to Excel/CSV with analytics"""
    try:
        # Create Excel writer
        output = io.BytesIO()
        
        if request.format == "excel":
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                await _export_to_excel(db, request, writer)
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"inventory_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        else:
            # For CSV, create a ZIP file with multiple CSV files
            await _export_to_csv_zip(db, request, output)
            content_type = "application/zip"
            filename = f"inventory_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        api_logger.error(f"Error exporting data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

async def _export_to_excel(db, request: ExportRequest, writer):
    """Export data to Excel format"""
    # Build date filter
    date_filter = ""
    if request.filters:
        if request.filters.start_date:
            date_filter += f" AND created_at >= '{request.filters.start_date}'"
        if request.filters.end_date:
            date_filter += f" AND created_at <= '{request.filters.end_date}'"
    
    # Export each requested module
    for module in request.modules:
        try:
            if module == "products":
                query = f"SELECT * FROM products WHERE 1=1{date_filter}"
                data = db.execute_query(query)
                df = pd.DataFrame(data)
                df.to_excel(writer, sheet_name="Products", index=False)
                
            elif module == "students":
                query = f"SELECT * FROM students WHERE 1=1{date_filter}"
                data = db.execute_query(query)
                df = pd.DataFrame(data)
                df.to_excel(writer, sheet_name="Students", index=False)
                
            elif module == "orders":
                query = f"""
                    SELECT so.*, s.name as student_name, p.name as product_name
                    FROM student_orders so
                    LEFT JOIN students s ON so.student_id = s.id
                    LEFT JOIN products p ON so.product_id = p.id
                    WHERE 1=1{date_filter}
                """
                data = db.execute_query(query)
                df = pd.DataFrame(data)
                df.to_excel(writer, sheet_name="Orders", index=False)
                
            elif module == "invoices":
                try:
                    query = f"SELECT * FROM invoices WHERE 1=1{date_filter}"
                    data = db.execute_query(query)
                    df = pd.DataFrame(data)
                    df.to_excel(writer, sheet_name="Invoices", index=False)
                except:
                    # Create empty sheet if invoices table doesn't exist
                    pd.DataFrame({"Note": ["Invoice module not available"]}).to_excel(
                        writer, sheet_name="Invoices", index=False
                    )
        except Exception as e:
            api_logger.warning(f"Failed to export {module}: {str(e)}")
            # Create error sheet
            pd.DataFrame({"Error": [f"Failed to export {module}: {str(e)}"]}).to_excel(
                writer, sheet_name=f"{module}_Error", index=False
            )
    
    # Add analytics summary if requested
    if request.include_analytics:
        try:
            analytics_data = []
            for module in request.modules:
                if module == "products":
                    result = db.execute_query(f"SELECT COUNT(*) as count FROM products WHERE 1=1{date_filter}")
                    total = result[0]['count'] if result else 0
                    analytics_data.append({"Module": "Products", "Total Records": total})
                elif module == "students":
                    result = db.execute_query(f"SELECT COUNT(*) as count FROM students WHERE 1=1{date_filter}")
                    total = result[0]['count'] if result else 0
                    analytics_data.append({"Module": "Students", "Total Records": total})
                elif module == "orders":
                    result = db.execute_query(f"SELECT COUNT(*) as count FROM student_orders WHERE 1=1{date_filter}")
                    total = result[0]['count'] if result else 0
                    analytics_data.append({"Module": "Orders", "Total Records": total})
            
            analytics_df = pd.DataFrame(analytics_data)
            analytics_df.to_excel(writer, sheet_name="Analytics Summary", index=False)
        except Exception as e:
            api_logger.warning(f"Failed to create analytics summary: {str(e)}")

async def _export_to_csv_zip(db, request: ExportRequest, output):
    """Export data to CSV files in a ZIP archive"""
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Build date filter
        date_filter = ""
        if request.filters:
            if request.filters.start_date:
                date_filter += f" AND created_at >= '{request.filters.start_date}'"
            if request.filters.end_date:
                date_filter += f" AND created_at <= '{request.filters.end_date}'"
        
        # Export each module to CSV
        for module in request.modules:
            try:
                csv_buffer = io.StringIO()
                
                if module == "products":
                    query = f"SELECT * FROM products WHERE 1=1{date_filter}"
                    data = db.execute_query(query)
                    df = pd.DataFrame(data)
                    df.to_csv(csv_buffer, index=False)
                    zipf.writestr(f"products.csv", csv_buffer.getvalue())
                    
                elif module == "students":
                    query = f"SELECT * FROM students WHERE 1=1{date_filter}"
                    data = db.execute_query(query)
                    df = pd.DataFrame(data)
                    df.to_csv(csv_buffer, index=False)
                    zipf.writestr(f"students.csv", csv_buffer.getvalue())
                    
                elif module == "orders":
                    query = f"""
                        SELECT so.*, s.name as student_name, p.name as product_name
                        FROM student_orders so
                        LEFT JOIN students s ON so.student_id = s.id
                        LEFT JOIN products p ON so.product_id = p.id
                        WHERE 1=1{date_filter}
                    """
                    data = db.execute_query(query)
                    df = pd.DataFrame(data)
                    df.to_csv(csv_buffer, index=False)
                    zipf.writestr(f"orders.csv", csv_buffer.getvalue())
                    
            except Exception as e:
                api_logger.warning(f"Failed to export {module} to CSV: {str(e)}")

# Dashboard charts data
@router.get("/charts/overview")
async def get_overview_charts(
    days: int = Query(30, description="Number of days to include"),
    db: DatabaseManager = Depends(get_db)
):
    """Get chart data for overview dashboard"""
    try:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Daily activity chart
        daily_activity_query = f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as activities
            FROM (
                SELECT created_at FROM student_orders WHERE created_at >= '{start_date}'
                UNION ALL
                SELECT created_at FROM products WHERE created_at >= '{start_date}'
                UNION ALL
                SELECT created_at FROM students WHERE created_at >= '{start_date}'
            ) activities
            GROUP BY DATE(created_at)
            ORDER BY date
        """
        
        daily_activity_data = db.execute_query(daily_activity_query)
        daily_activity = []
        for row in daily_activity_data:
            daily_activity.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "activities": row['activities']
            })
        
        # Category distribution
        category_query = """
            SELECT c.name as category, COUNT(p.id) as count
            FROM products p
            JOIN categories c ON p.category_id = c.id
            GROUP BY c.name
            ORDER BY count DESC
            LIMIT 10
        """
        categories = db.execute_query(category_query)
        
        # Status distribution
        status_query = """
            SELECT status, COUNT(*) as count
            FROM student_orders
            GROUP BY status
        """
        statuses = db.execute_query(status_query)
        
        return {
            "daily_activity": daily_activity,
            "category_distribution": categories,
            "status_distribution": statuses,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        api_logger.error(f"Error getting overview charts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chart data: {str(e)}")

# WebSocket endpoint for real-time updates
@router.websocket("/ws/realtime")
async def websocket_realtime_analytics(websocket: WebSocket):
    """WebSocket endpoint for real-time analytics updates"""
    await websocket.accept()
    
    try:
        api_logger.info("📡 New WebSocket connection established")
        
        while True:
            # Get fresh metrics (this will use the database directly since monitor isn't implemented yet)
            try:
                db = DatabaseManager()
                if not db.connection or db.connection.closed:
                    db.connect()
                
                # Get basic real-time data
                metrics_data = {
                    "timestamp": datetime.now().isoformat(),
                    "status": "live",
                    "basic_metrics": {
                        "products": db.execute_query("SELECT COUNT(*) as count FROM products")[0]['count'],
                        "students": db.execute_query("SELECT COUNT(*) as count FROM students")[0]['count'],
                        "active_orders": db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status = 'active'")[0]['count']
                    }
                }
                
                await websocket.send_text(json.dumps(metrics_data))
                
            except Exception as data_error:
                # Send error status
                error_data = {
                    "status": "error",
                    "message": str(data_error),
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_text(json.dumps(error_data))
            
            await asyncio.sleep(5)  # Send updates every 5 seconds
            
    except Exception as e:
        api_logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()
        api_logger.info("📡 WebSocket connection closed")

# Test endpoint
@router.get("/test")
async def test_analytics():
    """Test endpoint for analytics API"""
    return {
        "status": "✅ Analytics API is working!",
        "timestamp": datetime.now().isoformat(),
        "available_endpoints": [
            "/analytics/metrics/realtime",
            "/analytics/modules/{module_name}",
            "/analytics/export",
            "/analytics/charts/overview",
            "/analytics/ws/realtime"
        ],
        "supported_modules": ["products", "students", "orders", "invoices"],
        "export_formats": ["excel", "csv"]
    }
