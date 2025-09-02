"""
Simple test analytics API to verify routing works
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
import pandas as pd
import io

router = APIRouter(tags=["Analytics Test"])

class AnalyticsFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    student_id: Optional[str] = None
    product_id: Optional[str] = None
    status: Optional[str] = None

class ExportRequest(BaseModel):
    modules: List[str] = Field(..., description="List of modules to export")
    format: str = Field(default="excel", description="Export format: excel, csv")
    filters: Optional[AnalyticsFilter] = None
    include_analytics: bool = Field(default=True, description="Include analytics summary")

@router.get("/test")
async def test_analytics():
    return {"message": "Analytics API is working!", "timestamp": datetime.now()}

@router.get("/metrics/realtime")
async def get_realtime_metrics():
    return {
        "total_products": 25,
        "total_students": 150,
        "active_orders": 12,
        "pending_returns": 8,
        "total_revenue": 1250.50,
        "low_stock_items": 3,
        "most_borrowed_category": "Electronics",
        "average_order_value": 85.75,
        "return_rate": 15.5,
        "last_updated": datetime.now()
    }

@router.get("/charts/overview")
async def get_overview_charts(days: int = 30):
    return {
        "daily_activity": [
            {"date": "2025-08-25", "activities": 45},
            {"date": "2025-08-26", "activities": 52},
            {"date": "2025-08-27", "activities": 38},
            {"date": "2025-08-28", "activities": 61},
            {"date": "2025-08-29", "activities": 49},
            {"date": "2025-08-30", "activities": 55},
            {"date": "2025-09-01", "activities": 42},
            {"date": "2025-09-02", "activities": 58}
        ],
        "category_distribution": [
            {"category": "Electronics", "count": 45},
            {"category": "Books", "count": 32},
            {"category": "Lab Equipment", "count": 28},
            {"category": "Furniture", "count": 15}
        ],
        "status_distribution": [
            {"status": "Active", "count": 35},
            {"status": "Pending", "count": 12},
            {"status": "Completed", "count": 48},
            {"status": "Cancelled", "count": 5}
        ]
    }

@router.get("/modules/{module_name}")
async def get_module_analytics(module_name: str, start_date: Optional[date] = None, end_date: Optional[date] = None):
    return {
        "module": module_name,
        "summary": {
            "total_items": 125,
            "active_items": 95,
            "recent_activity": 18,
            "growth_rate": 12.5
        },
        "metrics": {
            "daily_average": 15.2,
            "peak_usage": 45,
            "efficiency_rate": 87.3
        }
    }

@router.post("/export")
async def export_analytics_data(export_request: ExportRequest):
    """Export analytics data in Excel or CSV format"""
    try:
        # Create sample data for demonstration
        sample_data = {
            'products': pd.DataFrame({
                'id': [1, 2, 3, 4, 5],
                'name': ['Laptop', 'Projector', 'Microscope', 'Calculator', 'Tablet'],
                'category': ['Electronics', 'Electronics', 'Lab Equipment', 'Electronics', 'Electronics'],
                'quantity_available': [10, 5, 3, 25, 8],
                'unit_price': [1200.00, 800.00, 1500.00, 25.00, 300.00],
                'status': ['Active', 'Active', 'Low Stock', 'Active', 'Active']
            }),
            'students': pd.DataFrame({
                'id': [1, 2, 3, 4, 5],
                'name': ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'],
                'email': ['john@example.com', 'jane@example.com', 'bob@example.com', 'alice@example.com', 'charlie@example.com'],
                'department': ['Engineering', 'Science', 'Arts', 'Engineering', 'Science'],
                'status': ['Active', 'Active', 'Active', 'Inactive', 'Active']
            }),
            'orders': pd.DataFrame({
                'id': [1, 2, 3, 4, 5],
                'student_id': [1, 2, 1, 3, 4],
                'product_id': [1, 2, 3, 1, 2],
                'quantity': [1, 1, 1, 1, 1],
                'status': ['Active', 'Returned', 'Active', 'Pending', 'Active'],
                'created_at': ['2025-08-15', '2025-08-20', '2025-08-25', '2025-09-01', '2025-09-02']
            })
        }
        
        if export_request.format.lower() == 'excel':
            # Create Excel file
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                for module in export_request.modules:
                    if module in sample_data:
                        sample_data[module].to_excel(writer, sheet_name=module.capitalize(), index=False)
                
                # Add analytics summary if requested
                if export_request.include_analytics:
                    analytics_summary = pd.DataFrame({
                        'Metric': ['Total Products', 'Total Students', 'Active Orders', 'Total Revenue'],
                        'Value': [25, 150, 12, 1250.50],
                        'Last Updated': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')] * 4
                    })
                    analytics_summary.to_excel(writer, sheet_name='Analytics Summary', index=False)
            
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.read()),
                media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={"Content-Disposition": f"attachment; filename=analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"}
            )
        
        else:  # CSV format
            # Create CSV files
            output = io.BytesIO()
            import zipfile
            
            with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for module in export_request.modules:
                    if module in sample_data:
                        csv_buffer = io.StringIO()
                        sample_data[module].to_csv(csv_buffer, index=False)
                        zip_file.writestr(f"{module}.csv", csv_buffer.getvalue())
                
                # Add analytics summary if requested
                if export_request.include_analytics:
                    analytics_summary = pd.DataFrame({
                        'Metric': ['Total Products', 'Total Students', 'Active Orders', 'Total Revenue'],
                        'Value': [25, 150, 12, 1250.50],
                        'Last Updated': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')] * 4
                    })
                    csv_buffer = io.StringIO()
                    analytics_summary.to_csv(csv_buffer, index=False)
                    zip_file.writestr("analytics_summary.csv", csv_buffer.getvalue())
            
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.read()),
                media_type='application/zip',
                headers={"Content-Disposition": f"attachment; filename=analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
