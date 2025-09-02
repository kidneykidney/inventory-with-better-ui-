"""
Real-Time Analytics API for Inventory Management System
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
from sqlalchemy import text, func, and_, or_, desc, asc
from database_manager import get_db, DatabaseManager
from logging_config import api_logger
from realtime_monitor import get_data_monitor, start_monitoring_service
import asyncio
import calendar

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Initialize monitoring service
try:
    start_monitoring_service()
    api_logger.info("🚀 Analytics API with Real-Time Monitoring initialized")
except Exception as e:
    api_logger.error(f"❌ Failed to start monitoring: {str(e)}")

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

# Real-time metrics endpoint (now uses cached data)
@router.get("/metrics/realtime", response_model=RealTimeMetrics)
async def get_realtime_metrics(db: DatabaseManager = Depends(get_db)):
    """Get real-time system metrics from cache"""
    try:
        monitor = get_data_monitor()
        cached_metrics = monitor.get_cached_metrics()
        
        if cached_metrics and not cached_metrics.get('error'):
            return RealTimeMetrics(
                total_products=cached_metrics.get('total_products', 0),
                total_students=cached_metrics.get('total_students', 0),
                active_orders=cached_metrics.get('active_orders', 0),
                pending_returns=cached_metrics.get('pending_returns', 0),
                total_revenue=float(cached_metrics.get('total_revenue', 0.0)),
                low_stock_items=cached_metrics.get('low_stock_items', 0),
                most_borrowed_category=cached_metrics.get('most_borrowed_category', 'N/A'),
                average_order_value=float(cached_metrics.get('average_order_value', 0.0)),
                return_rate=float(cached_metrics.get('return_rate', 0.0)),
                last_updated=datetime.fromisoformat(cached_metrics.get('last_updated', datetime.now().isoformat()))
            )
        else:
            # Fallback to direct database query if cache is not available
            return await _get_realtime_metrics_direct(db)
            
    except Exception as e:
        api_logger.error(f"Error getting real-time metrics: {str(e)}")
        # Fallback to direct query
        return await _get_realtime_metrics_direct(db)

async def _get_realtime_metrics_direct(db: DatabaseManager):
    """Fallback method to get metrics directly from database"""
    try:
        # Get basic counts
        total_products = db.execute_query("SELECT COUNT(*) as count FROM products")[0]['count']
        total_students = db.execute_query("SELECT COUNT(*) as count FROM students")[0]['count']
        active_orders = db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status = 'active'")[0]['count']
        pending_returns = db.execute_query("SELECT COUNT(*) as count FROM student_orders WHERE status = 'borrowed'")[0]['count']
        
        # Get revenue (if invoices table exists)
        try:
            revenue_result = db.execute_query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices")
            total_revenue = revenue_result[0]['total'] if revenue_result else 0.0
        except:
            total_revenue = 0.0
        
        # Low stock items (quantity < 10)
        low_stock_result = db.execute_query("SELECT COUNT(*) as count FROM products WHERE quantity_available < 10")
        low_stock_items = low_stock_result[0]['count'] if low_stock_result else 0
        
        # Most borrowed category
        most_borrowed_query = """
            SELECT p.category_id, c.name as category, COUNT(*) as count
            FROM student_orders so
            JOIN products p ON so.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            GROUP BY p.category_id, c.name
            ORDER BY count DESC
            LIMIT 1
        """
        most_borrowed_result = db.execute_query(most_borrowed_query)
        most_borrowed_category = most_borrowed_result[0]['category'] if most_borrowed_result else "N/A"
        
        # Average order value
        avg_order_query = """
            SELECT AVG(p.unit_price * so.quantity) as avg_value
            FROM student_orders so
            JOIN products p ON so.product_id = p.id
            WHERE so.created_at >= CURRENT_DATE - INTERVAL '30 days'
        """
        try:
            avg_result = db.execute_query(avg_order_query)
            average_order_value = float(avg_result[0]['avg_value']) if avg_result and avg_result[0]['avg_value'] else 0.0
        except:
            average_order_value = 0.0
        
        # Return rate
        return_rate_query = """
            SELECT 
                (COUNT(CASE WHEN status = 'returned' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as rate
            FROM student_orders
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """
        try:
            return_rate_result = db.execute_query(return_rate_query)
            return_rate = float(return_rate_result[0]['rate']) if return_rate_result and return_rate_result[0]['rate'] else 0.0
        except:
            return_rate = 0.0
        
        return RealTimeMetrics(
            total_products=total_products or 0,
            total_students=total_students or 0,
            active_orders=active_orders or 0,
            pending_returns=pending_returns or 0,
            total_revenue=float(total_revenue),
            low_stock_items=low_stock_items or 0,
            most_borrowed_category=most_borrowed_category,
            average_order_value=float(average_order_value),
            return_rate=float(return_rate),
            last_updated=datetime.now()
        )
        
    except Exception as e:
        api_logger.error(f"Error getting direct metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")

# Enhanced real-time data endpoint
@router.get("/realtime/extended")
async def get_extended_realtime_data():
    """Get extended real-time data including alerts, trends, and system health"""
    try:
        monitor = get_data_monitor()
        cached_data = monitor.get_cached_metrics()
        
        if cached_data:
            return {
                "metrics": cached_data,
                "status": "live" if not cached_data.get('error') else "error",
                "cache_age_seconds": (datetime.now() - datetime.fromisoformat(cached_data.get('last_updated', datetime.now().isoformat()))).total_seconds(),
                "monitoring_active": True
            }
        else:
            return {
                "metrics": None,
                "status": "no_cache",
                "cache_age_seconds": None,
                "monitoring_active": False,
                "message": "Real-time monitoring not available"
            }
            
    except Exception as e:
        api_logger.error(f"Error getting extended real-time data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving extended data: {str(e)}")

# Force cache update endpoint
@router.post("/cache/refresh")
async def refresh_analytics_cache():
    """Force refresh the analytics cache"""
    try:
        monitor = get_data_monitor()
        monitor.force_update()
        
        return {
            "status": "success",
            "message": "Analytics cache refreshed",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        api_logger.error(f"Error refreshing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cache refresh failed: {str(e)}")

# WebSocket endpoint for real-time updates
@router.websocket("/ws/realtime")
async def websocket_realtime_analytics(websocket: WebSocket):
    """WebSocket endpoint for real-time analytics updates"""
    await websocket.accept()
    monitor = get_data_monitor()
    
    try:
        api_logger.info("📡 New WebSocket connection established")
        monitor.subscribe(websocket)
        
        while True:
            # Get fresh metrics from cache
            cached_metrics = monitor.get_cached_metrics()
            
            if cached_metrics:
                await websocket.send_text(json.dumps(cached_metrics))
            else:
                # Send heartbeat if no data
                await websocket.send_text(json.dumps({
                    "status": "heartbeat",
                    "timestamp": datetime.now().isoformat()
                }))
            
            await asyncio.sleep(5)  # Send updates every 5 seconds
            
    except Exception as e:
        api_logger.error(f"WebSocket error: {str(e)}")
    finally:
        monitor.unsubscribe(websocket)
        await websocket.close()
        api_logger.info("📡 WebSocket connection closed")

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
        with db.get_connection() as conn:
            # Build date filter
            date_filter = ""
            if start_date:
                date_filter += f" AND created_at >= '{start_date}'"
            if end_date:
                date_filter += f" AND created_at <= '{end_date}'"
            
            if module_name == "products":
                return await _get_products_analytics(conn, date_filter)
            elif module_name == "students":
                return await _get_students_analytics(conn, date_filter)
            elif module_name == "orders":
                return await _get_orders_analytics(conn, date_filter)
            elif module_name == "invoices":
                return await _get_invoices_analytics(conn, date_filter)
            else:
                raise HTTPException(status_code=400, detail="Invalid module name")
                
    except Exception as e:
        api_logger.error(f"Error getting {module_name} analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving {module_name} analytics: {str(e)}")

async def _get_products_analytics(conn, date_filter):
    """Get comprehensive products analytics"""
    # Total products and categories
    total_products = conn.execute(text(f"SELECT COUNT(*) FROM products WHERE 1=1{date_filter}")).scalar()
    
    # Category distribution
    category_query = text(f"""
        SELECT category, COUNT(*) as count, AVG(price) as avg_price, SUM(quantity) as total_stock
        FROM products 
        WHERE 1=1{date_filter}
        GROUP BY category
        ORDER BY count DESC
    """)
    categories = [dict(row._mapping) for row in conn.execute(category_query).fetchall()]
    
    # Stock analysis
    stock_query = text(f"""
        SELECT 
            COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
            COUNT(CASE WHEN quantity > 0 AND quantity <= 10 THEN 1 END) as low_stock,
            COUNT(CASE WHEN quantity > 10 THEN 1 END) as in_stock,
            AVG(quantity) as avg_stock
        FROM products 
        WHERE 1=1{date_filter}
    """)
    stock_info = dict(conn.execute(stock_query).fetchone()._mapping)
    
    # Most popular products (by orders)
    popular_query = text(f"""
        SELECT p.name, p.sku, COUNT(so.id) as order_count, p.quantity as current_stock
        FROM products p
        LEFT JOIN student_orders so ON p.id = so.product_id
        WHERE 1=1{date_filter.replace('created_at', 'p.created_at')}
        GROUP BY p.id, p.name, p.sku, p.quantity
        ORDER BY order_count DESC
        LIMIT 10
    """)
    popular_products = [dict(row._mapping) for row in conn.execute(popular_query).fetchall()]
    
    return {
        "module": "products",
        "summary": {
            "total_products": total_products,
            "total_categories": len(categories),
            "stock_status": stock_info
        },
        "categories": categories,
        "popular_products": popular_products,
        "trends": await _get_product_trends(conn, date_filter)
    }

async def _get_students_analytics(conn, date_filter):
    """Get comprehensive students analytics"""
    # Basic student stats
    total_students = conn.execute(text(f"SELECT COUNT(*) FROM students WHERE 1=1{date_filter}")).scalar()
    
    # Department distribution
    dept_query = text(f"""
        SELECT department, COUNT(*) as count
        FROM students 
        WHERE 1=1{date_filter}
        GROUP BY department
        ORDER BY count DESC
    """)
    departments = [dict(row._mapping) for row in conn.execute(dept_query).fetchall()]
    
    # Year distribution
    year_query = text(f"""
        SELECT year_of_study, COUNT(*) as count
        FROM students 
        WHERE 1=1{date_filter}
        GROUP BY year_of_study
        ORDER BY year_of_study
    """)
    years = [dict(row._mapping) for row in conn.execute(year_query).fetchall()]
    
    # Most active students
    active_query = text(f"""
        SELECT s.name, s.email, s.department, COUNT(so.id) as order_count
        FROM students s
        LEFT JOIN student_orders so ON s.id = so.student_id
        WHERE 1=1{date_filter.replace('created_at', 's.created_at')}
        GROUP BY s.id, s.name, s.email, s.department
        ORDER BY order_count DESC
        LIMIT 10
    """)
    active_students = [dict(row._mapping) for row in conn.execute(active_query).fetchall()]
    
    return {
        "module": "students",
        "summary": {
            "total_students": total_students,
            "total_departments": len(departments),
            "total_years": len(years)
        },
        "departments": departments,
        "years": years,
        "most_active": active_students
    }

async def _get_orders_analytics(conn, date_filter):
    """Get comprehensive orders analytics"""
    # Order statistics
    total_orders = conn.execute(text(f"SELECT COUNT(*) FROM student_orders WHERE 1=1{date_filter}")).scalar()
    
    # Status distribution
    status_query = text(f"""
        SELECT status, COUNT(*) as count
        FROM student_orders 
        WHERE 1=1{date_filter}
        GROUP BY status
    """)
    status_dist = [dict(row._mapping) for row in conn.execute(status_query).fetchall()]
    
    # Monthly trends
    monthly_query = text(f"""
        SELECT 
            DATE_PART('year', created_at) as year,
            DATE_PART('month', created_at) as month,
            COUNT(*) as order_count,
            AVG(quantity) as avg_quantity
        FROM student_orders 
        WHERE 1=1{date_filter}
        GROUP BY year, month
        ORDER BY year, month
    """)
    monthly_trends = []
    for row in conn.execute(monthly_query).fetchall():
        row_dict = dict(row._mapping)
        month_name = calendar.month_abbr[int(row_dict['month'])]
        monthly_trends.append({
            "month": f"{month_name} {int(row_dict['year'])}",
            "order_count": row_dict['order_count'],
            "avg_quantity": float(row_dict['avg_quantity'] or 0)
        })
    
    return {
        "module": "orders",
        "summary": {
            "total_orders": total_orders,
            "status_distribution": status_dist
        },
        "monthly_trends": monthly_trends,
        "status_breakdown": status_dist
    }

async def _get_invoices_analytics(conn, date_filter):
    """Get comprehensive invoices analytics"""
    try:
        # Check if invoices table exists
        total_invoices = conn.execute(text(f"SELECT COUNT(*) FROM invoices WHERE 1=1{date_filter}")).scalar()
        
        # Revenue analysis
        revenue_query = text(f"""
            SELECT 
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_invoice_value,
                COUNT(*) as invoice_count
            FROM invoices 
            WHERE 1=1{date_filter}
        """)
        revenue_info = dict(conn.execute(revenue_query).fetchone()._mapping)
        
        # Monthly revenue trends
        monthly_revenue_query = text(f"""
            SELECT 
                DATE_PART('year', created_at) as year,
                DATE_PART('month', created_at) as month,
                SUM(total_amount) as revenue,
                COUNT(*) as invoice_count
            FROM invoices 
            WHERE 1=1{date_filter}
            GROUP BY year, month
            ORDER BY year, month
        """)
        monthly_revenue = []
        for row in conn.execute(monthly_revenue_query).fetchall():
            row_dict = dict(row._mapping)
            month_name = calendar.month_abbr[int(row_dict['month'])]
            monthly_revenue.append({
                "month": f"{month_name} {int(row_dict['year'])}",
                "revenue": float(row_dict['revenue'] or 0),
                "invoice_count": row_dict['invoice_count']
            })
        
        return {
            "module": "invoices",
            "summary": {
                "total_invoices": total_invoices,
                "total_revenue": float(revenue_info.get('total_revenue') or 0),
                "avg_invoice_value": float(revenue_info.get('avg_invoice_value') or 0)
            },
            "monthly_revenue": monthly_revenue
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
            "note": "Invoice module not available"
        }

async def _get_product_trends(conn, date_filter):
    """Get product trends over time"""
    try:
        trends_query = text(f"""
            SELECT 
                DATE_PART('year', created_at) as year,
                DATE_PART('month', created_at) as month,
                COUNT(*) as products_added
            FROM products 
            WHERE 1=1{date_filter}
            GROUP BY year, month
            ORDER BY year, month
            LIMIT 12
        """)
        
        trends = []
        for row in conn.execute(trends_query).fetchall():
            row_dict = dict(row._mapping)
            month_name = calendar.month_abbr[int(row_dict['month'])]
            trends.append({
                "month": f"{month_name} {int(row_dict['year'])}",
                "products_added": row_dict['products_added']
            })
        
        return trends
    except:
        return []

# Excel export functionality
@router.post("/export")
async def export_data(
    request: ExportRequest,
    db: DatabaseManager = Depends(get_db)
):
    """Export module data to Excel/CSV with analytics"""
    try:
        with db.get_connection() as conn:
            # Create Excel writer
            output = io.BytesIO()
            
            if request.format == "excel":
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    await _export_to_excel(conn, request, writer)
                content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                filename = f"inventory_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            else:
                # For CSV, create a ZIP file with multiple CSV files
                await _export_to_csv_zip(conn, request, output)
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

async def _export_to_excel(conn, request: ExportRequest, writer):
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
        if module == "products":
            query = f"SELECT * FROM products WHERE 1=1{date_filter}"
            df = pd.read_sql(query, conn)
            df.to_excel(writer, sheet_name="Products", index=False)
            
        elif module == "students":
            query = f"SELECT * FROM students WHERE 1=1{date_filter}"
            df = pd.read_sql(query, conn)
            df.to_excel(writer, sheet_name="Students", index=False)
            
        elif module == "orders":
            query = f"""
                SELECT so.*, s.name as student_name, p.name as product_name
                FROM student_orders so
                LEFT JOIN students s ON so.student_id = s.id
                LEFT JOIN products p ON so.product_id = p.id
                WHERE 1=1{date_filter}
            """
            df = pd.read_sql(query, conn)
            df.to_excel(writer, sheet_name="Orders", index=False)
            
        elif module == "invoices":
            try:
                query = f"SELECT * FROM invoices WHERE 1=1{date_filter}"
                df = pd.read_sql(query, conn)
                df.to_excel(writer, sheet_name="Invoices", index=False)
            except:
                # Create empty sheet if invoices table doesn't exist
                pd.DataFrame({"Note": ["Invoice module not available"]}).to_excel(
                    writer, sheet_name="Invoices", index=False
                )
    
    # Add analytics summary if requested
    if request.include_analytics:
        analytics_data = []
        for module in request.modules:
            if module == "products":
                total = conn.execute(text(f"SELECT COUNT(*) FROM products WHERE 1=1{date_filter}")).scalar()
                analytics_data.append({"Module": "Products", "Total Records": total})
            elif module == "students":
                total = conn.execute(text(f"SELECT COUNT(*) FROM students WHERE 1=1{date_filter}")).scalar()
                analytics_data.append({"Module": "Students", "Total Records": total})
            elif module == "orders":
                total = conn.execute(text(f"SELECT COUNT(*) FROM student_orders WHERE 1=1{date_filter}")).scalar()
                analytics_data.append({"Module": "Orders", "Total Records": total})
        
        analytics_df = pd.DataFrame(analytics_data)
        analytics_df.to_excel(writer, sheet_name="Analytics Summary", index=False)

async def _export_to_csv_zip(conn, request: ExportRequest, output):
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
            csv_buffer = io.StringIO()
            
            if module == "products":
                query = f"SELECT * FROM products WHERE 1=1{date_filter}"
                df = pd.read_sql(query, conn)
                df.to_csv(csv_buffer, index=False)
                zipf.writestr(f"products.csv", csv_buffer.getvalue())
                
            elif module == "students":
                query = f"SELECT * FROM students WHERE 1=1{date_filter}"
                df = pd.read_sql(query, conn)
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
                df = pd.read_sql(query, conn)
                df.to_csv(csv_buffer, index=False)
                zipf.writestr(f"orders.csv", csv_buffer.getvalue())

# WebSocket endpoint for real-time updates
@router.websocket("/ws/realtime")
async def websocket_realtime_analytics(websocket):
    """WebSocket endpoint for real-time analytics updates"""
    await websocket.accept()
    try:
        while True:
            # Get fresh metrics every 5 seconds
            metrics = await get_realtime_metrics()
            await websocket.send_text(metrics.json())
            await asyncio.sleep(5)
    except Exception as e:
        api_logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()

# Dashboard charts data
@router.get("/charts/overview")
async def get_overview_charts(
    days: int = Query(30, description="Number of days to include"),
    db: DatabaseManager = Depends(get_db)
):
    """Get chart data for overview dashboard"""
    try:
        with db.get_connection() as conn:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days)
            
            # Daily activity chart
            daily_activity_query = text(f"""
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
            """)
            
            daily_activity = []
            for row in conn.execute(daily_activity_query).fetchall():
                row_dict = dict(row._mapping)
                daily_activity.append({
                    "date": row_dict['date'].strftime('%Y-%m-%d'),
                    "activities": row_dict['activities']
                })
            
            # Category distribution
            category_query = text("""
                SELECT category, COUNT(*) as count
                FROM products
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            """)
            categories = [dict(row._mapping) for row in conn.execute(category_query).fetchall()]
            
            # Status distribution
            status_query = text("""
                SELECT status, COUNT(*) as count
                FROM student_orders
                GROUP BY status
            """)
            statuses = [dict(row._mapping) for row in conn.execute(status_query).fetchall()]
            
            return {
                "daily_activity": daily_activity,
                "category_distribution": categories,
                "status_distribution": statuses,
                "generated_at": datetime.now().isoformat()
            }
            
    except Exception as e:
        api_logger.error(f"Error getting overview charts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chart data: {str(e)}")

# Test endpoint
@router.get("/test")
async def test_analytics():
    """Test endpoint for analytics API"""
    return {
        "status": "Analytics API is working!",
        "timestamp": datetime.now().isoformat(),
        "available_endpoints": [
            "/analytics/metrics/realtime",
            "/analytics/modules/{module_name}",
            "/analytics/export",
            "/analytics/charts/overview"
        ]
    }
