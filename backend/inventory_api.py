from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid
import time
import json
import requests
import psycopg2
from database_manager import get_db, DatabaseManager
from logging_config import api_logger, main_logger, db_logger, log_performance
import logging

# Import email service
try:
    from email_service import email_service
    EMAIL_SERVICE_LOADED = True
    api_logger.info("Email service loaded successfully")
except ImportError as e:
    EMAIL_SERVICE_LOADED = False
    email_service = None
    api_logger.warning(f"Email service not available: {e}")

# Try to import invoice_router with error handling
try:
    from invoice_api import invoice_router
    from auto_invoice_service import auto_generate_invoice_for_order
    INVOICE_MODULE_LOADED = True
except ImportError as e:
    print(f"Warning: Could not import invoice_api: {e}")
    INVOICE_MODULE_LOADED = False
    invoice_router = None

app = FastAPI(title="Inventory Management API", version="1.0.0")

# Add validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    api_logger.error(f"Validation error on {request.method} {request.url.path}: {exc}")
    api_logger.error(f"Request body length: {len(body)} bytes")
    # Convert body to string for logging, truncate if too long
    body_preview = body[:500].decode('utf-8', errors='replace') if len(body) > 0 else "empty"
    api_logger.error(f"Request body preview: {body_preview}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": "Validation failed"}
    )

# Invoice router is now included in main.py with proper prefix
# This prevents duplicate route registration and ensures proper routing
if INVOICE_MODULE_LOADED:
    print("Invoice API routes loaded successfully")
else:
    print("Running without invoice API routes")

# Add CORS middleware FIRST - this is crucial for proper CORS handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002", 
        "http://localhost:3003", 
        "http://localhost:3004",
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001", 
        "http://127.0.0.1:3002", 
        "http://127.0.0.1:3003", 
        "http://127.0.0.1:3004",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    # Get client IP
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0]
    
    # Log incoming request
    api_logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            'request_id': request_id,
            'method': request.method,
            'url': str(request.url),
            'path': request.url.path,
            'query_params': dict(request.query_params),
            'ip_address': client_ip,
            'user_agent': request.headers.get('user-agent', 'Unknown')
        }
    )
    
    # Process request
    response: Response = await call_next(request)
    
    # Calculate duration
    duration = (time.time() - start_time) * 1000  # Convert to milliseconds
    
    # Log response
    api_logger.info(
        f"Request completed: {request.method} {request.url.path} -> {response.status_code}",
        extra={
            'request_id': request_id,
            'method': request.method,
            'path': request.url.path,
            'status_code': response.status_code,
            'duration': round(duration, 2),
            'ip_address': client_ip
        }
    )
    
    # Add request ID to response headers for debugging
    response.headers["X-Request-ID"] = request_id
    
    return response

# Pydantic models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Category(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    sku: str
    quantity_total: int = 0
    quantity_available: int = 0
    is_returnable: bool = True
    unit_price: float = 0.0
    location: Optional[str] = None
    minimum_stock_level: int = 0
    image_url: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    date_of_purchase: Optional[date] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    quantity_total: Optional[int] = None
    quantity_available: Optional[int] = None
    is_returnable: Optional[bool] = None
    unit_price: Optional[float] = None
    location: Optional[str] = None
    minimum_stock_level: Optional[int] = None
    image_url: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    date_of_purchase: Optional[date] = None

class Product(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category_id: Optional[str]
    category_name: Optional[str]
    sku: str
    quantity_total: int
    quantity_available: int
    is_returnable: bool
    unit_price: float
    location: Optional[str]
    minimum_stock_level: int
    image_url: Optional[str]
    specifications: Optional[Dict[str, Any]]
    tags: Optional[List[str]]
    status: str
    date_of_purchase: Optional[date]
    created_at: datetime
    updated_at: datetime

class StudentCreate(BaseModel):
    student_id: Optional[str] = None  # Made optional, can be auto-generated
    name: str
    email: Optional[str] = None  # Made optional to allow flexibility
    phone: Optional[str] = None
    department: Optional[str] = None  # Made optional since course field is more relevant
    year_of_study: Optional[int] = None
    course: Optional[str] = None

class Student(BaseModel):
    id: str
    student_id: str
    name: str
    email: str
    phone: Optional[str]
    department: Optional[str] = None  # Made optional since course field is more relevant
    year_of_study: Optional[int]
    course: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class OrderItemCreate(BaseModel):
    product_id: str
    quantity_requested: int
    expected_return_date: Optional[date] = None
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    student_id: str
    lender_id: Optional[str] = None  # Add lender support
    items: List[OrderItemCreate]
    notes: Optional[str] = None
    expected_return_date: Optional[date] = None

class OrderItem(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity_requested: int
    quantity_approved: int
    quantity_returned: int
    unit_price: float  # Added missing field
    total_price: float  # Added missing field
    is_returnable: bool
    expected_return_date: Optional[date]
    actual_return_date: Optional[date]
    return_condition: Optional[str]
    notes: Optional[str]
    status: str

class Order(BaseModel):
    id: str
    order_number: str
    student_id: str
    student_name: str
    student_email: str
    course: Optional[str] = None  # Made optional to handle None values
    lender_id: Optional[str] = None  # Add lender support
    lender_name: Optional[str] = None  # Add lender name
    order_type: str
    status: str
    total_items: int
    total_value: float
    notes: Optional[str]
    requested_date: datetime
    approved_date: Optional[datetime]
    completed_date: Optional[datetime]
    expected_return_date: Optional[datetime]
    actual_return_date: Optional[datetime]
    approved_by: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    items: List[OrderItem] = []

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Inventory Management API", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

@app.get("/logs")
async def get_logs(log_type: str = "api", limit: int = 100):
    """Get recent log entries"""
    import os
    import json
    from pathlib import Path
    
    log_files = {
        "api": "inventory_api.log",
        "errors": "inventory_errors.log", 
        "system": "inventory_system.log"
    }
    
    if log_type not in log_files:
        raise HTTPException(status_code=400, detail="Invalid log type. Use: api, errors, or system")
    
    log_file = Path(__file__).parent.parent / "logs" / log_files[log_type]
    
    if not log_file.exists():
        return {"logs": [], "total": 0}
    
    try:
        logs = []
        with open(log_file, 'r') as f:
            lines = f.readlines()
            # Get the last 'limit' lines
            recent_lines = lines[-limit:] if len(lines) > limit else lines
            
            for line in recent_lines:
                line = line.strip()
                if line:
                    try:
                        log_entry = json.loads(line)
                        logs.append(log_entry)
                    except json.JSONDecodeError:
                        # Handle non-JSON log lines
                        logs.append({"message": line, "level": "INFO"})
        
        return {"logs": logs, "total": len(logs), "log_type": log_type}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading logs: {str(e)}")

@app.get("/logs/viewer")
async def log_viewer():
    """Serve the log viewer HTML page"""
    from fastapi.responses import HTMLResponse
    
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventory API - Log Viewer</title>
        <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: #1a1a1a; color: #00ff00; }
            .header { text-align: center; margin-bottom: 20px; }
            .controls { margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
            .controls select, .controls button { padding: 8px; background: #333; color: #00ff00; border: 1px solid #00ff00; }
            .log-container { background: #000; border: 1px solid #00ff00; padding: 10px; height: 500px; overflow-y: auto; }
            .log-entry { margin-bottom: 5px; padding: 5px; border-left: 3px solid #00ff00; }
            .log-entry.ERROR { border-left-color: #ff0000; color: #ff9999; }
            .log-entry.WARNING { border-left-color: #ffaa00; color: #ffcc99; }
            .log-entry.INFO { border-left-color: #00ff00; color: #99ff99; }
            .timestamp { color: #888; font-size: 12px; }
            .message { margin-left: 10px; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
            .stat-box { background: #333; padding: 10px; border: 1px solid #00ff00; text-align: center; min-width: 100px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 Inventory API Log Viewer</h1>
            <p>Real-time monitoring of your inventory management system</p>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div>Total Logs</div>
                <div id="totalLogs">0</div>
            </div>
            <div class="stat-box">
                <div>Errors</div>
                <div id="errorCount">0</div>
            </div>
            <div class="stat-box">
                <div>Last Updated</div>
                <div id="lastUpdated">Never</div>
            </div>
        </div>
        
        <div class="controls">
            <label for="logType">Log Type:</label>
            <select id="logType">
                <option value="api">API Logs</option>
                <option value="errors">Error Logs</option>
                <option value="system">System Logs</option>
            </select>
            
            <label for="limit">Show Last:</label>
            <select id="limit">
                <option value="50">50 entries</option>
                <option value="100" selected>100 entries</option>
                <option value="200">200 entries</option>
            </select>
            
            <button onclick="loadLogs()">🔄 Refresh</button>
            <button onclick="toggleAutoRefresh()" id="autoBtn">▶️ Auto Refresh</button>
        </div>
        
        <div class="log-container" id="logContainer">
            <div style="text-align: center; color: #888;">Loading logs...</div>
        </div>
        
        <script>
            let autoRefreshInterval = null;
            let isAutoRefresh = false;
            
            async function loadLogs() {
                const logType = document.getElementById('logType').value;
                const limit = document.getElementById('limit').value;
                
                try {
                    const response = await fetch('/logs?log_type=' + logType + '&limit=' + limit);
                    const data = await response.json();
                    
                    displayLogs(data.logs);
                    updateStats(data);
                    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
                } catch (error) {
                    document.getElementById('logContainer').innerHTML = 
                        '<div style="color: #ff0000;">Error loading logs: ' + error.message + '</div>';
                }
            }
            
            function displayLogs(logs) {
                const container = document.getElementById('logContainer');
                
                if (logs.length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: #888;">No logs found</div>';
                    return;
                }
                
                const logHtml = logs.map(log => {
                    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
                    const level = log.level || 'INFO';
                    const message = log.message || 'No message';
                    
                    return '<div class="log-entry ' + level + '">' +
                           '<span class="timestamp">[' + timestamp + '] ' + level + '</span>' +
                           '<div class="message">' + message + '</div>' +
                           '</div>';
                }).join('');
                
                container.innerHTML = logHtml;
                container.scrollTop = container.scrollHeight;
            }
            
            function updateStats(data) {
                document.getElementById('totalLogs').textContent = data.total;
                const errorCount = data.logs.filter(log => log.level === 'ERROR').length;
                document.getElementById('errorCount').textContent = errorCount;
            }
            
            function toggleAutoRefresh() {
                const button = document.getElementById('autoBtn');
                
                if (isAutoRefresh) {
                    clearInterval(autoRefreshInterval);
                    button.textContent = '▶️ Auto Refresh';
                    isAutoRefresh = false;
                } else {
                    autoRefreshInterval = setInterval(loadLogs, 5000);
                    button.textContent = '⏸️ Stop Auto';
                    isAutoRefresh = true;
                }
            }
            
            // Load logs on page load
            document.addEventListener('DOMContentLoaded', loadLogs);
            
            // Refresh when log type changes
            document.getElementById('logType').addEventListener('change', loadLogs);
            document.getElementById('limit').addEventListener('change', loadLogs);
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

# Category endpoints
@app.get("/api/categories", response_model=List[Category])
async def get_categories(db: DatabaseManager = Depends(get_db)):
    """Get all categories"""
    query = "SELECT * FROM categories ORDER BY name"
    results = db.execute_query(query)
    return results

@app.post("/api/categories", response_model=Category)
async def create_category(category: CategoryCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new category"""
    category_id = str(uuid.uuid4())
    query = """
    INSERT INTO categories (id, name, description) 
    VALUES (%s, %s, %s) 
    RETURNING *
    """
    
    if db.execute_command(query, (category_id, category.name, category.description)):
        # Get the created category
        result = db.execute_query("SELECT * FROM categories WHERE id = %s", (category_id,))
        if result:
            return result[0]
    
    raise HTTPException(status_code=500, detail="Failed to create category")

# Product endpoints
@app.get("/api/products", response_model=List[Product])
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = "active",
    db: DatabaseManager = Depends(get_db)
):
    """Get all products with optional filtering"""
    query = """
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
    """
    params = []
    
    if status:
        query += " AND p.status = %s"
        params.append(status)
    
    if category_id:
        query += " AND p.category_id = %s"
        params.append(category_id)
    
    if search:
        query += " AND (p.name ILIKE %s OR p.description ILIKE %s OR %s = ANY(p.tags))"
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search])
    
    query += " ORDER BY p.name"
    
    results = db.execute_query(query, tuple(params) if params else None)
    return results

@app.get("/api/products/{product_id}", response_model=Product)
async def get_product(product_id: str, db: DatabaseManager = Depends(get_db)):
    """Get a specific product"""
    query = """
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = %s
    """
    results = db.execute_query(query, (product_id,))
    
    if not results:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return results[0]

@app.post("/api/products", response_model=Product)
async def create_product(product: ProductCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new product"""
    product_id = str(uuid.uuid4())
    
    # Convert specifications and tags to proper format
    specifications_json = product.specifications if product.specifications else {}
    tags_array = product.tags if product.tags else []
    
    # Handle empty category_id
    category_id = product.category_id if product.category_id else None
    
    api_logger.info(f"Creating product: {product.name}")
    
    query = """
    INSERT INTO products (
        id, name, description, category_id, sku, quantity_total, 
        quantity_available, is_returnable, unit_price, location, 
        minimum_stock_level, image_url, specifications, tags, date_of_purchase
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
    """
    
    params = (
        product_id, product.name, product.description, category_id,
        product.sku, product.quantity_total, product.quantity_available,
        product.is_returnable, product.unit_price, product.location,
        product.minimum_stock_level, product.image_url,
        str(specifications_json), tags_array, product.date_of_purchase
    )
    
    try:
        result = db.execute_command(query, params)
        
        if result:
            api_logger.info(f"Product created successfully: {product_id}")
            
            # Log the stock addition
            if product.quantity_total > 0:
                transaction_query = """
                INSERT INTO product_transactions (
                    product_id, transaction_type, quantity_change, 
                    quantity_before, quantity_after, reference_type, performed_by
                ) VALUES (%s, 'stock_in', %s, 0, %s, 'manual', 'system')
                """
                db.execute_command(transaction_query, (
                    product_id, product.quantity_total, product.quantity_available
                ))
            
            # Return the created product
            query = """
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s
            """
            results = db.execute_query(query, (product_id,))
            
            if not results:
                raise HTTPException(status_code=404, detail="Product not found")
            
            return results[0]
        else:
            api_logger.error("execute_command returned False")
            raise HTTPException(status_code=400, detail="Product creation failed. This might be due to a duplicate SKU or invalid data.")
    
    except Exception as e:
        error_msg = str(e)
        api_logger.error(f"Error creating product: {error_msg}")
        
        # Provide more helpful error messages
        if "duplicate key" in error_msg and "sku" in error_msg:
            raise HTTPException(status_code=400, detail=f"A product with SKU '{product.sku}' already exists. Please use a different SKU.")
        elif "foreign key" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid category selected. Please choose a valid category.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to create product: {error_msg}")

@app.put("/api/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str, 
    product_update: ProductUpdate, 
    db: DatabaseManager = Depends(get_db)
):
    """Update a product"""
    # Check if product exists
    existing = db.execute_query("SELECT * FROM products WHERE id = %s", (product_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Build dynamic update query
    update_fields = []
    params = []
    
    for field, value in product_update.dict(exclude_unset=True).items():
        if field == "specifications":
            update_fields.append(f"{field} = %s::jsonb")
            params.append(str(value) if value else '{}')
        else:
            update_fields.append(f"{field} = %s")
            params.append(value)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(product_id)
    query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
    
    if db.execute_command(query, tuple(params)):
        return await get_product(product_id, db)
    
    raise HTTPException(status_code=500, detail="Failed to update product")

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete a product (hard delete - permanently removes from database)"""
    query = "DELETE FROM products WHERE id = %s"
    
    if db.execute_command(query, (product_id,)):
        return {"message": "Product deleted successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to delete product")

# Student endpoints
@app.get("/api/students", response_model=List[Student])
async def get_students(db: DatabaseManager = Depends(get_db)):
    """Get all students (both active and inactive)"""
    query = "SELECT * FROM students ORDER BY name"
    results = db.execute_query(query)
    return results

@app.post("/api/students", response_model=Student)
async def create_student(student: StudentCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new student with flexible handling"""
    import uuid
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Creating student with data: {student.dict()}")
    
    # Validate required fields
    if not student.name or not student.name.strip():
        raise HTTPException(status_code=400, detail="Student name is required")
    # Department is now optional since course field is more relevant
    
    # If no student_id provided, generate one
    if not student.student_id or not student.student_id.strip():
        # Generate a unique student ID
        import time
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        student.student_id = f"STUD{timestamp}"
    
    # If no email provided, generate a placeholder
    if not student.email or not student.email.strip():
        student.email = f"{student.student_id.lower()}@student.local"
    
    # Check if student already exists by student_id (flexible check)
    existing_student_by_id = db.execute_query("SELECT * FROM students WHERE student_id = %s", (student.student_id,))
    if existing_student_by_id:
        logger.info(f"Student with ID {student.student_id} already exists, returning existing")
        return existing_student_by_id[0]
    
    # Check if student already exists by email (flexible check)
    if student.email and "@" in student.email:  # Only check real emails
        existing_student_by_email = db.execute_query("SELECT * FROM students WHERE email = %s", (student.email,))
        if existing_student_by_email:
            logger.info(f"Student with email {student.email} already exists, returning existing")
            return existing_student_by_email[0]
    
    # Create new student
    student_uuid = str(uuid.uuid4())
    query = """
    INSERT INTO students (id, student_id, name, email, phone, department, year_of_study, course, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    params = (
        student_uuid, 
        student.student_id,
        student.name, 
        student.email,
        student.phone if student.phone and student.phone.strip() else None,
        student.department if student.department and student.department.strip() else None,  # Handle optional department
        student.year_of_study,
        student.course if student.course and student.course.strip() else None,
        True  # Set new students as active by default
    )
    
    try:
        logger.info(f"Inserting student with params: {params}")
        if db.execute_command(query, params):
            result = db.execute_query("SELECT * FROM students WHERE id = %s", (student_uuid,))
            if result:
                logger.info(f"Student created successfully: {result[0]['student_id']}")
                return result[0]
        
        raise HTTPException(status_code=500, detail="Failed to create student record")
        
    except Exception as e:
        logger.error(f"Error creating student: {e}")
        # One more attempt to check if student was created despite error
        try:
            result = db.execute_query("SELECT * FROM students WHERE student_id = %s", (student.student_id,))
            if result:
                return result[0]
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Failed to create student")

@app.put("/api/students/{student_db_id}", response_model=Student)
async def update_student(student_db_id: str, student_update: dict, db: DatabaseManager = Depends(get_db)):
    """Update an existing student with OCR data"""
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"🔄 Updating student {student_db_id} with data: {student_update}")
    
    # Check if student exists
    existing_query = "SELECT * FROM students WHERE id = %s"
    existing_student = db.fetch_one(existing_query, (student_db_id,))
    
    if not existing_student:
        logger.error(f"❌ Student not found with ID: {student_db_id}")
        raise HTTPException(status_code=404, detail="Student not found")
    
    logger.info(f"📋 Found existing student: {existing_student.get('name')}")
    
    # Build update query dynamically based on provided fields
    update_fields = []
    update_values = []
    
    # Map common field names to database columns
    field_mapping = {
        'name': 'name',
        'student_name': 'name', 
        'email': 'email',
        'student_email': 'email',
        'phone': 'phone',
        'department': 'department',
        'year_of_study': 'year_of_study',
        'course': 'course',
        'is_active': 'is_active'  # Added support for status toggle
    }
    
    for field, db_column in field_mapping.items():
        if field in student_update and student_update[field] is not None:
            # Allow empty strings but not None values
            update_fields.append(f"{db_column} = %s")
            update_values.append(student_update[field])
            logger.info(f"🔄 Will update {db_column}: '{student_update[field]}'")
    
    if not update_fields:
        # No fields to update, return existing student
        logger.info("⚠️  No valid fields to update, returning existing student")
        return existing_student
    
    # Always update the updated_at timestamp
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    
    # Build update query (without RETURNING to avoid complications)
    update_query = f"""
    UPDATE students 
    SET {', '.join(update_fields)}
    WHERE id = %s
    """
    
    # Add student_db_id to the end of the values list for WHERE clause
    update_values.append(student_db_id)
    
    logger.info(f"🔧 Executing update query: {update_query}")
    logger.info(f"🔧 With values: {update_values}")
    
    try:
        # Use execute_command for UPDATE
        success = db.execute_command(update_query, tuple(update_values))
        
        if success:
            # Fetch the updated student
            updated_student = db.fetch_one("SELECT * FROM students WHERE id = %s", (student_db_id,))
            if updated_student:
                logger.info(f"✅ Successfully updated student: {updated_student.get('name')}")
                return updated_student
            else:
                logger.warning("⚠️  Student updated but could not fetch updated record, returning existing")
                return existing_student
        else:
            logger.warning("⚠️  Update command reported failure, returning existing student")
            return existing_student
            
    except Exception as e:
        logger.error(f"❌ Failed to update student: {str(e)}")
        # Return existing student instead of failing completely for invoice creation
        logger.info("🔄 Returning existing student due to update failure - invoice creation can continue")
        return existing_student

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete a student (hard delete - permanently removes from database)"""
    query = "DELETE FROM students WHERE id = %s"
    
    if db.execute_command(query, (student_id,)):
        return {"message": "Student deleted successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to delete student")

@app.get("/api/students/by-student-id/{student_id}")
async def get_student_by_student_id(student_id: str, db: DatabaseManager = Depends(get_db)):
    """Get student by their student ID (not database ID)"""
    query = """
    SELECT id, student_id, name, email, phone, department, 
           year_of_study, course, is_active, created_at, updated_at
    FROM students 
    WHERE student_id = %s AND is_active = true
    """
    
    result = db.fetch_one(query, (student_id,))
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "id": result["id"],
        "student_id": result["student_id"],
        "name": result["name"],
        "email": result["email"],
        "phone": result["phone"],
        "department": result["department"],
        "year_of_study": result["year_of_study"],
        "course": result["course"],
        "is_active": result["is_active"],
        "created_at": result["created_at"],
        "updated_at": result["updated_at"]
    }

# Lender models
class LenderCreate(BaseModel):
    lender_id: Optional[str] = None  # Made optional, can be auto-generated
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: str
    designation: Optional[str] = None  # Professor, Lab Assistant, etc.
    employee_id: Optional[str] = None
    office_location: Optional[str] = None
    authority_level: str = "standard"  # standard, senior, admin
    can_approve_lending: bool = True
    can_lend_high_value: bool = False

class Lender(BaseModel):
    id: str
    lender_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    department: str
    designation: Optional[str]
    employee_id: Optional[str]
    office_location: Optional[str]
    authority_level: str
    can_approve_lending: bool
    can_lend_high_value: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Lender endpoints
@app.get("/api/lenders", response_model=List[Lender])
async def get_lenders(db: DatabaseManager = Depends(get_db)):
    """Get all lenders (both active and inactive)"""
    query = "SELECT * FROM lenders ORDER BY name"
    results = db.execute_query(query)
    return results

@app.post("/api/lenders", response_model=Lender)
async def create_lender(lender: LenderCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new lender with flexible handling"""
    import uuid
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Creating lender with data: {lender.dict()}")
    
    # Validate required fields
    if not lender.name or not lender.name.strip():
        raise HTTPException(status_code=400, detail="Lender name is required")
    if not lender.department or not lender.department.strip():
        raise HTTPException(status_code=400, detail="Department is required")
    
    # If no lender_id provided, generate one
    if not lender.lender_id or not lender.lender_id.strip():
        # Generate a unique lender ID
        timestamp = int(time.time() * 1000) % 1000000
        lender.lender_id = f"LEND{timestamp}"
    
    # Generate email if not provided
    if not lender.email or not lender.email.strip():
        lender.email = f"{lender.lender_id.lower()}@staff.local"
    
    # Check if lender already exists by lender_id (flexible check)
    existing_lender_by_id = db.execute_query("SELECT * FROM lenders WHERE lender_id = %s", (lender.lender_id,))
    if existing_lender_by_id:
        logger.info(f"Lender with ID {lender.lender_id} already exists, returning existing")
        return existing_lender_by_id[0]
    
    # Check if lender exists by email (flexible check)
    if lender.email and lender.email.strip() and not lender.email.endswith("@staff.local"):
        existing_lender_by_email = db.execute_query("SELECT * FROM lenders WHERE email = %s", (lender.email,))
        if existing_lender_by_email:
            logger.info(f"Lender with email {lender.email} already exists, returning existing")
            return existing_lender_by_email[0]
    
    # Create new lender
    lender_uuid = str(uuid.uuid4())
    
    query = """
    INSERT INTO lenders (id, lender_id, name, email, phone, department, designation, 
                        employee_id, office_location, authority_level, can_approve_lending, 
                        can_lend_high_value, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING *
    """
    
    try:
        result = db.execute_query(query, (
            lender_uuid,
            lender.lender_id,
            lender.name,
            lender.email,
            lender.phone,
            lender.department,
            lender.designation,
            lender.employee_id,
            lender.office_location,
            lender.authority_level,
            lender.can_approve_lending,
            lender.can_lend_high_value,
            True
        ))
        
        if result:
            logger.info(f"Lender created successfully: {result[0]['lender_id']}")
            return result[0]
        else:
            logger.error("No result returned from lender creation")
            raise HTTPException(status_code=500, detail="Failed to create lender - no result returned")
            
    except Exception as e:
        logger.error(f"Database error creating lender: {str(e)}")
        if "duplicate key" in str(e).lower():
            raise HTTPException(status_code=400, detail="Lender with this ID or email already exists")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/lenders/bulk", response_model=dict)
async def create_lenders_bulk(lenders: List[LenderCreate], db: DatabaseManager = Depends(get_db)):
    """Create multiple lenders at once"""
    import uuid
    import time
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Creating {len(lenders)} lenders in bulk")
    
    created_lenders = []
    failed_lenders = []
    
    for i, lender in enumerate(lenders):
        try:
            # Validate required fields
            if not lender.name or not lender.name.strip():
                failed_lenders.append({
                    "index": i + 1,
                    "error": "Lender name is required",
                    "data": lender.dict()
                })
                continue
                
            if not lender.department or not lender.department.strip():
                failed_lenders.append({
                    "index": i + 1,
                    "error": "Department is required",
                    "data": lender.dict()
                })
                continue

            # Generate lender_id if not provided
            if not lender.lender_id or not lender.lender_id.strip():
                timestamp = int(time.time() * 1000) % 1000000
                lender.lender_id = f"LEND{timestamp}{i:03d}"

            # Generate email if not provided
            if not lender.email or not lender.email.strip():
                lender.email = f"{lender.lender_id.lower()}@staff.local"

            # Create new lender
            lender_uuid = str(uuid.uuid4())
            
            query = """
            
            INSERT INTO lenders (id, lender_id, name, email, phone, department, designation, 
                                employee_id, office_location, authority_level, can_approve_lending, 
                                can_lend_high_value, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """
            
            result = db.execute_query(query, (
                lender_uuid,
                lender.lender_id,
                lender.name,
                lender.email,
                lender.phone,
                lender.department,
                lender.designation,
                lender.employee_id,
                lender.office_location,
                lender.authority_level,
                lender.can_approve_lending,
                lender.can_lend_high_value,
                True
            ))
            
            if result:
                created_lenders.append(result[0])
                logger.info(f"Bulk lender {i+1} created successfully: {result[0]['lender_id']}")
            else:
                failed_lenders.append({
                    "index": i + 1,
                    "error": "Failed to create lender - no result returned",
                    "data": lender.dict()
                })
                
        except Exception as e:
            logger.error(f"Error creating bulk lender {i+1}: {str(e)}")
            error_msg = str(e)
            if "duplicate key" in error_msg.lower():
                error_msg = "Lender with this ID or email already exists"
            
            failed_lenders.append({
                "index": i + 1,
                "error": error_msg,
                "data": lender.dict()
            })
    
    logger.info(f"Bulk lender creation completed: {len(created_lenders)} successful, {len(failed_lenders)} failed")
    
    return {
        "message": f"Bulk creation completed",
        "total": len(lenders),
        "successful": len(created_lenders),
        "failed": len(failed_lenders),
        "created_lenders": created_lenders,
        "failed_lenders": failed_lenders
    }

@app.put("/api/lenders/{lender_db_id}")
async def update_lender(lender_db_id: str, lender_update: dict, db: DatabaseManager = Depends(get_db)):
    """Update an existing lender"""
    import logging
    logger = logging.getLogger(__name__)
    
    # Validate UUID format
    try:
        uuid.UUID(lender_db_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lender ID format")
    
    # Check if lender exists
    existing_lender = db.execute_query("SELECT * FROM lenders WHERE id = %s", (lender_db_id,))
    if not existing_lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    
    # Build update query dynamically
    update_fields = []
    update_values = []
    
    allowed_fields = {
        'name', 'email', 'phone', 'department', 'designation', 'employee_id', 
        'office_location', 'authority_level', 'can_approve_lending', 
        'can_lend_high_value', 'max_lending_value', 'is_active', 'notes'
    }
    
    for field, value in lender_update.items():
        if field in allowed_fields:
            update_fields.append(f"{field} = %s")
            update_values.append(value)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
    
    update_values.append(lender_db_id)
    query = f"UPDATE lenders SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
    
    try:
        result = db.execute_query(query, update_values)
        if result:
            logger.info(f"Lender updated successfully: {lender_db_id}")
            return result[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to update lender")
    except Exception as e:
        logger.error(f"Database error updating lender: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/lenders/bulk")
async def bulk_delete_lenders(request: Request, db: DatabaseManager = Depends(get_db)):
    """Bulk delete lenders (hard delete for bulk operations)"""
    logger = logging.getLogger(__name__)
    
    try:
        # Parse JSON body manually to get the lender IDs
        body = await request.json()
        lender_ids = body if isinstance(body, list) else body.get('lender_ids', [])
        
        logger.info(f"Bulk delete request for lender IDs: {lender_ids}")
        
        if not lender_ids:
            raise HTTPException(status_code=400, detail="No lender IDs provided")
        
        # Validate that all IDs are strings (UUIDs)
        if not all(isinstance(id_val, str) for id_val in lender_ids):
            raise HTTPException(status_code=400, detail="All lender IDs must be strings")
        
        # Create placeholders for the IN clause
        placeholders = ', '.join(['%s'] * len(lender_ids))
        
        # Hard delete for bulk operations (since soft delete can be confusing in bulk)
        query = f"DELETE FROM lenders WHERE id IN ({placeholders})"
        
        logger.info(f"Executing query: {query} with params: {lender_ids}")
        logger.info(f"Parameter types: {[type(id_val) for id_val in lender_ids]}")
        
        # Convert to tuple and execute
        params_tuple = tuple(lender_ids)
        logger.info(f"Params as tuple: {params_tuple}")
        
        result = db.execute_command(query, params_tuple)
        logger.info(f"Execute command result: {result}")
        
        if result:
            logger.info(f"Successfully deleted {len(lender_ids)} lender(s)")
            return {"message": f"Successfully deleted {len(lender_ids)} lender(s)"}
        
        raise HTTPException(status_code=500, detail="Failed to delete lenders - execute_command returned False")
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except psycopg2.Error as e:
        logger.error(f"PostgreSQL error in bulk delete: {str(e)}")
        logger.error(f"Error code: {e.pgcode}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Database error in bulk delete: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/lenders/{lender_id}")
async def delete_lender(lender_id: str, db: DatabaseManager = Depends(get_db)):
    """Soft delete a lender (set is_active = false)"""
    query = "UPDATE lenders SET is_active = false WHERE id = %s OR lender_id = %s"
    if db.execute_command(query, (lender_id, lender_id)):
        return {"message": "Lender deactivated successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to deactivate lender")

@app.get("/api/users")
async def get_users(db: DatabaseManager = Depends(get_db)):
    """Get all users (placeholder endpoint to prevent 404 errors)"""
    try:
        query = "SELECT * FROM users ORDER BY created_at DESC"
        results = db.execute_query(query)
        return results
    except Exception as e:
        # Return empty array if users table doesn't exist or other errors
        return []

@app.get("/api/lenders/by-lender-id/{lender_id}")
async def get_lender_by_lender_id(lender_id: str, db: DatabaseManager = Depends(get_db)):
    """Get lender by their lender ID (not database ID)"""
    query = """
    SELECT id, lender_id, name, email, phone, department, designation, employee_id,
           office_location, authority_level, can_approve_lending, can_lend_high_value,
           max_lending_value, is_active, created_at, updated_at
    FROM lenders 
    WHERE lender_id = %s AND is_active = true
    """
    
    result = db.fetch_one(query, (lender_id,))
    if not result:
        raise HTTPException(status_code=404, detail="Lender not found")
    
    return {
        "id": result["id"],
        "lender_id": result["lender_id"],
        "name": result["name"],
        "email": result["email"],
        "phone": result["phone"],
        "department": result["department"],
        "designation": result["designation"],
        "employee_id": result["employee_id"],
        "office_location": result["office_location"],
        "authority_level": result["authority_level"],
        "can_approve_lending": result["can_approve_lending"],
        "can_lend_high_value": result["can_lend_high_value"],
        "max_lending_value": float(result["max_lending_value"]),
        "is_active": result["is_active"],
        "created_at": result["created_at"],
        "updated_at": result["updated_at"]
    }

# Dashboard statistics endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: DatabaseManager = Depends(get_db)):
    """Get dashboard statistics"""
    try:
        # Get total products
        total_products = db.execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'")
        total_products_count = total_products[0]['count'] if total_products else 0
        
        # Get total students 
        total_students = db.execute_query("SELECT COUNT(*) as count FROM students WHERE is_active = true")
        total_students_count = total_students[0]['count'] if total_students else 0
        
        # Get pending orders
        pending_orders = db.execute_query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'")
        pending_orders_count = pending_orders[0]['count'] if pending_orders else 0
        
        # Get low stock items (products where quantity_available <= minimum_stock_level)
        low_stock = db.execute_query("SELECT COUNT(*) as count FROM products WHERE quantity_available <= minimum_stock_level AND status = 'active'")
        low_stock_count = low_stock[0]['count'] if low_stock else 0
        
        # Get total inventory value
        inventory_value = db.execute_query("SELECT SUM(quantity_available * unit_price) as total FROM products WHERE status = 'active'")
        total_value = float(inventory_value[0]['total']) if inventory_value and inventory_value[0]['total'] else 0.0
        
        # Get total orders count
        total_orders = db.execute_query("SELECT COUNT(*) as count FROM orders")
        total_orders_count = total_orders[0]['count'] if total_orders else 0

        return {
            "totalProducts": total_products_count,
            "totalStudents": total_students_count,
            "pendingOrders": pending_orders_count,
            "lowStockItems": low_stock_count,
            "totalInventoryValue": round(total_value, 2),
            "totalOrders": total_orders_count
        }
    except Exception as e:
        api_logger.error(f"Error getting dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@app.get("/api/dashboard/low-stock")
async def get_low_stock_items(db: DatabaseManager = Depends(get_db)):
    """Get products with low stock"""
    try:
        query = """
        SELECT p.id, p.name, p.quantity_available, p.minimum_stock_level, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.quantity_available <= p.minimum_stock_level 
        AND p.status = 'active'
        ORDER BY (p.quantity_available::float / NULLIF(p.minimum_stock_level, 0)) ASC
        LIMIT 10
        """
        results = db.execute_query(query)
        return results if results else []
    except Exception as e:
        api_logger.error(f"Error getting low stock items: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get low stock items: {str(e)}")

@app.get("/api/dashboard/recent-activities")
async def get_recent_activities(limit: int = 10, db: DatabaseManager = Depends(get_db)):
    """Get recent system activities"""
    try:
        # Get recent orders
        recent_orders = db.execute_query("""
        SELECT 
            'order' as type,
            o.order_number as title,
            CONCAT('Order ', o.order_number, ' by ', s.name) as description,
            o.created_at as timestamp,
            o.status
        FROM orders o
        JOIN students s ON o.student_id = s.id
        ORDER BY o.created_at DESC
        LIMIT %s
        """, (limit,))
        
        return recent_orders if recent_orders else []
    except Exception as e:
        api_logger.error(f"Error getting recent activities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent activities: {str(e)}")

# Order endpoints
@app.get("/api/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    db: DatabaseManager = Depends(get_db)
):
    """Get all orders with optional filtering"""
    query = """
    SELECT o.*,
           COALESCE(s.name, 'Unknown Student') as student_name, 
           COALESCE(s.email, '') as student_email, 
           COALESCE(s.course, '') as course,
           COALESCE(l.name, 'No Lender') as lender_name
    FROM orders o
    LEFT JOIN students s ON o.student_id = s.id
    LEFT JOIN lenders l ON o.lender_id = l.id
    WHERE 1=1
    """
    params = []
    
    if status:
        query += " AND o.status = %s"
        params.append(status)
    
    if student_id:
        query += " AND o.student_id = %s"
        params.append(student_id)
    
    query += " ORDER BY o.requested_date DESC"
    
    results = db.execute_query(query, tuple(params) if params else None)
    
    # Get order items for each order
    for order in results:
        items_query = """
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = %s
        """
        items = db.execute_query(items_query, (order['id'],))
        
        # Debug logging
        api_logger.info(f"Order {order['order_number']} ({order['id']}): Found {len(items)} items")
        if items:
            api_logger.info(f"First item: {items[0]}")
        
        # Convert Decimal objects to float for JSON serialization
        for item in items:
            if 'unit_price' in item and item['unit_price']:
                item['unit_price'] = float(item['unit_price'])
            if 'total_price' in item and item['total_price']:
                item['total_price'] = float(item['total_price'])
        
        order['items'] = items
    
    return results

@app.post("/api/orders", response_model=Order)
# @log_performance('inventory.orders')  # Temporarily disabled for debugging
async def create_order(order: OrderCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new order"""
    order_id = str(uuid.uuid4())
    
    # Generate unique order number - get the max existing order number to avoid duplicates
    max_order_query = """
    SELECT MAX(CAST(SUBSTRING(order_number, 4) AS INTEGER)) as max_num 
    FROM orders 
    WHERE order_number ~ '^ORD[0-9]+$'
    """
    max_result = db.execute_query(max_order_query)
    max_num = max_result[0]['max_num'] if max_result and max_result[0]['max_num'] else 0
    next_order_num = max_num + 1
    order_number = f"ORD{next_order_num:03d}"
    
    # Debug logging - check what we receive
    api_logger.info(f"DEBUG: Received order data: {order}")
    api_logger.info(f"DEBUG: Generated order number: {order_number}")
    api_logger.info(f"DEBUG: Order student_id: {order.student_id}")
    api_logger.info(f"DEBUG: Order items count: {len(order.items)}")
    
    api_logger.info(
        f"Creating new order {order_number} for student {order.student_id}",
        extra={
            'order_id': order_id,
            'order_number': order_number,
            'student_id': order.student_id,
            'items_count': len(order.items),
            'expected_return_date': str(order.expected_return_date)
        }
    )
    
    try:
        # Calculate total items and value, and validate stock availability
        total_items = sum(item.quantity_requested for item in order.items)
        total_value = 0.0
        stock_warnings = []
        
        # First pass: Validate stock availability for all items
        for item in order.items:
            # Get product info including current stock
            product = db.execute_query(
                "SELECT unit_price, is_returnable, quantity_available, name, minimum_stock_level FROM products WHERE id = %s", 
                (item.product_id,)
            )
            
            if not product:
                api_logger.error(f"Product {item.product_id} not found for order {order_id}")
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
            
            product_info = product[0]
            available_qty = product_info['quantity_available']
            product_name = product_info['name']
            min_stock = product_info.get('minimum_stock_level', 0) or 0
            
            # Check if sufficient stock is available
            if available_qty < item.quantity_requested:
                if available_qty == 0:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Product '{product_name}' is out of stock. Cannot lend {item.quantity_requested} units."
                    )
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for '{product_name}'. Available: {available_qty}, Requested: {item.quantity_requested}"
                    )
            
            # Check for low stock warnings (after lending)
            remaining_after_lending = available_qty - item.quantity_requested
            if remaining_after_lending <= min_stock and remaining_after_lending > 0:
                stock_warnings.append(f"Warning: '{product_name}' will be low stock after lending ({remaining_after_lending} remaining)")
            elif remaining_after_lending == 0:
                stock_warnings.append(f"Warning: '{product_name}' will be out of stock after lending")
        
        # Log stock warnings if any
        if stock_warnings:
            for warning in stock_warnings:
                api_logger.warning(warning)
        
        db_logger.info(f"Starting database transaction for order {order_id}")
        
        # Create the order
        order_query = """
        INSERT INTO orders (id, order_number, student_id, lender_id, total_items, total_value, notes, expected_return_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        if not db.execute_command(order_query, (
            order_id, order_number, order.student_id, order.lender_id, total_items, total_value, 
            order.notes, order.expected_return_date
        )):
            api_logger.error(f"Failed to create order {order_id} in database")
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        # Add order items and update product quantities
        for item in order.items:
            item_id = str(uuid.uuid4())
            
            # Get product info again (to ensure consistency)
            product = db.execute_query(
                "SELECT unit_price, is_returnable, quantity_available, name FROM products WHERE id = %s", 
                (item.product_id,)
            )
            
            if not product:
                api_logger.error(f"Product {item.product_id} not found for order {order_id}")
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
            
            product_info = product[0]
            item_total = float(product_info['unit_price']) * item.quantity_requested
            total_value += item_total
            
            db_logger.info(f"Adding item {item.product_id} to order {order_id}: {item.quantity_requested} units @ ${product_info['unit_price']}")
            
            # Insert order item
            item_query = """
            INSERT INTO order_items (
                id, order_id, product_id, quantity_requested, 
                unit_price, total_price, is_returnable, 
                expected_return_date, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            if not db.execute_command(item_query, (
                item_id, order_id, item.product_id, item.quantity_requested,
                float(product_info['unit_price']), item_total, product_info['is_returnable'],
                item.expected_return_date or order.expected_return_date, item.notes
            )):
                api_logger.error(f"Failed to add item {item.product_id} to order {order_id}")
                raise HTTPException(status_code=500, detail="Failed to add order item")
            
            # Update product quantity (reduce available stock)
            new_quantity = product_info['quantity_available'] - item.quantity_requested
            update_stock_query = """
            UPDATE products 
            SET quantity_available = %s, updated_at = CURRENT_TIMESTAMP 
            WHERE id = %s
            """
            
            if not db.execute_command(update_stock_query, (new_quantity, item.product_id)):
                api_logger.error(f"Failed to update stock for product {item.product_id}")
                raise HTTPException(status_code=500, detail="Failed to update product stock")
            
            api_logger.info(f"Updated stock for '{product_info['name']}': {product_info['quantity_available']} -> {new_quantity}")
        
        # Update order total value
        db_logger.info(f"Updating order {order_id} total value to ${total_value}")
        if not db.execute_command(
            "UPDATE orders SET total_value = %s WHERE id = %s", 
            (total_value, order_id)
        ):
            api_logger.error(f"Failed to update order {order_id} total value")
            raise HTTPException(status_code=500, detail="Failed to update order total")
        
        api_logger.info(f"Order {order_id} created successfully with {len(order.items)} items, total value ${total_value}")
        
        # Automatically generate invoice for lending orders
        if INVOICE_MODULE_LOADED:
            try:
                api_logger.info(f"Generating automatic invoice for order {order_id}")
                invoice_id = await auto_generate_invoice_for_order(db, order_id, "System Auto-Generation")
                if invoice_id:
                    api_logger.info(f"Successfully generated invoice {invoice_id} for order {order_id}")
                else:
                    api_logger.warning(f"Failed to generate invoice for order {order_id}")
            except Exception as e:
                api_logger.error(f"Error generating automatic invoice for order {order_id}: {str(e)}")
                # Don't fail the order creation if invoice generation fails
        else:
            api_logger.warning("Invoice module not loaded - skipping automatic invoice generation")
        
        # Log stock warnings summary
        if stock_warnings:
            api_logger.info(f"Stock warnings for order {order_id}: {'; '.join(stock_warnings)}")
        
    except Exception as e:
        api_logger.error(f"Error creating order {order_id}: {str(e)}", exc_info=True)
        raise
    
    # Return the created order
    result = db.execute_query("""
        SELECT o.*, s.name as student_name, s.email as student_email, 
               COALESCE(s.course, '') as course
        FROM orders o
        JOIN students s ON o.student_id = s.id
        WHERE o.id = %s
    """, (order_id,))
    
    if result:
        order_data = result[0]
        # Get items
        items = db.execute_query("""
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (order_id,))
        order_data['items'] = items
        return order_data
    
    raise HTTPException(status_code=500, detail="Failed to retrieve created order")

@app.put("/api/orders/{order_id}/approve")
async def approve_order(order_id: str, approved_by: str, db: DatabaseManager = Depends(get_db)):
    """Approve an order and update inventory"""
    # Update order status
    order_query = """
    UPDATE orders SET 
        status = 'approved', 
        approved_date = CURRENT_TIMESTAMP,
        approved_by = %s
    WHERE id = %s AND status = 'pending'
    """
    
    if not db.execute_command(order_query, (approved_by, order_id)):
        raise HTTPException(status_code=400, detail="Order not found or already processed")
    
    # Approve all order items (set quantity_approved = quantity_requested)
    items_query = """
    UPDATE order_items SET 
        quantity_approved = quantity_requested,
        status = 'approved'
    WHERE order_id = %s
    """
    
    db.execute_command(items_query, (order_id,))
    
    return {"message": "Order approved successfully"}

# Order update models
class OrderStatusUpdate(BaseModel):
    status: str

class OrderUpdate(BaseModel):
    student_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    expected_return_date: Optional[date] = None
    approved_by: Optional[str] = None

@app.put("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, db: DatabaseManager = Depends(get_db)):
    """Update order status with automatic invoice creation"""
    valid_statuses = ['pending', 'closed', 'overdue']
    
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Get current order status to detect changes
    current_order_query = "SELECT status FROM orders WHERE id = %s"
    current_result = db.execute_query(current_order_query, (order_id,))
    
    if not current_result:
        raise HTTPException(status_code=404, detail="Order not found")
    
    current_status = current_result[0]['status']
    
    # Update order status
    order_query = """
    UPDATE orders SET 
        status = %s,
        approved_date = CASE WHEN %s = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_date END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = %s
    """
    
    if not db.execute_command(order_query, (status_update.status, status_update.status, order_id)):
        raise HTTPException(status_code=404, detail="Order not found")
    
    invoice_message = ""
    
    # If status is closed, mark all items as returned and create invoice if needed
    if status_update.status == 'closed':
        items_query = """
        UPDATE order_items SET 
            quantity_approved = quantity_requested,
            quantity_returned = quantity_requested,
            status = 'returned',
            return_date = CURRENT_TIMESTAMP
        WHERE order_id = %s
        """
        db.execute_command(items_query, (order_id,))
        
        # Create invoice if none exists
        existing_invoice_query = """
        SELECT invoice_number, id FROM invoices 
        WHERE order_id = %s 
        ORDER BY created_at DESC 
        LIMIT 1
        """
        existing_invoice = db.execute_query(existing_invoice_query, (order_id,))
        
        if not existing_invoice:
            # Create new invoice for closed order
            api_logger.info(f"🎯 Creating invoice for closed order {order_id}")
            created_invoice = await create_invoice_for_approved_order(order_id, db, "System")
            
            if created_invoice:
                api_logger.info(f"🎉 Invoice {created_invoice.get('invoice_number')} created for closed order {order_id}")
                invoice_message = f" Invoice {created_invoice.get('invoice_number')} created automatically."
            else:
                api_logger.warning(f"⚠️ Failed to create invoice for order {order_id}")
                invoice_message = " Note: Invoice creation failed - please create manually."
        else:
            # Update existing invoice status
            invoice_id = existing_invoice[0]['id']
            invoice_number = existing_invoice[0]['invoice_number']
            
            update_invoice_query = """
            UPDATE invoices SET 
                status = 'closed',
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n', 'Order closed on ', NOW())
            WHERE id = %s
            """
            db.execute_command(update_invoice_query, (invoice_id,))
            invoice_message = f" Updated invoice {invoice_number} status to closed."
    
    api_logger.info(f"Order {order_id} status updated to {status_update.status}")
    return {
        "message": f"Order status updated to {status_update.status} successfully.{invoice_message}",
        "invoice_created": bool(status_update.status == 'closed' and current_status == 'pending' and 'created automatically' in invoice_message)
    }

async def create_invoice_for_approved_order(order_id: str, db: DatabaseManager, approved_by: str = "System") -> Optional[Dict]:
    """Create an invoice automatically when an order is approved"""
    try:
        # Get order details
        order_query = """
        SELECT o.*, s.name as student_name, s.email as student_email, s.department
        FROM orders o
        LEFT JOIN students s ON o.student_id = s.id
        WHERE o.id = %s AND o.status = 'approved'
        """
        
        order_result = db.execute_query(order_query, (order_id,))
        if not order_result:
            api_logger.warning(f"No approved order found with ID: {order_id}")
            return None
            
        order_data = order_result[0]
        
        # Create invoice via API call to invoice endpoint
        invoice_data = {
            "student_name": order_data.get('student_name', ''),
            "student_id": order_data.get('student_id', ''),
            "student_email": order_data.get('student_email', ''),
            "department": order_data.get('department', ''),
            "year_of_study": 1,  # Default value
            "invoice_type": "lending",
            "due_date": order_data.get('expected_return_date').isoformat() if order_data.get('expected_return_date') else None,
            "issued_by": approved_by,
            "notes": f"Auto-generated invoice for approved order {order_data.get('order_number', '')}"
        }
        
        # Make internal API call to create invoice
        try:
            # Use requests to call the invoice creation endpoint
            api_url = "http://localhost:8000/api/invoices/create-with-student"
            response = requests.post(api_url, json=invoice_data, timeout=10)
            
            if response.status_code == 200:
                invoice_response = response.json()
                created_invoice = invoice_response.get('invoice')
                
                if created_invoice:
                    # Update the order with the invoice reference
                    update_order_query = """
                    UPDATE orders SET 
                        invoice_id = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """
                    db.execute_command(update_order_query, (created_invoice['id'], order_id))
                    
                    # Add order items to the invoice
                    await add_order_items_to_invoice(order_id, created_invoice['id'], db)
                    
                    api_logger.info(f"✅ Successfully created invoice {created_invoice.get('invoice_number')} for order {order_data.get('order_number')}")
                    return created_invoice
                else:
                    api_logger.error("Invoice creation returned success but no invoice data")
                    return None
            else:
                api_logger.error(f"Failed to create invoice via API. Status: {response.status_code}, Response: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            api_logger.error(f"Network error calling invoice API: {str(e)}")
            # Fallback: create invoice directly in database
            return await create_invoice_direct(order_data, db, approved_by)
            
    except Exception as e:
        api_logger.error(f"Error creating invoice for order {order_id}: {str(e)}")
        return None

async def create_invoice_direct(order_data: Dict, db: DatabaseManager, approved_by: str) -> Optional[Dict]:
    """Fallback method to create invoice directly in database"""
    try:
        # Generate invoice number
        invoice_id = str(uuid.uuid4())
        due_date = order_data.get('expected_return_date')
        
        # Create invoice directly
        invoice_query = """
        INSERT INTO invoices (
            id, order_id, student_id, invoice_type, status, 
            total_items, due_date, issued_by, notes
        ) VALUES (%s, %s, %s, 'lending', 'issued', %s, %s, %s, %s)
        RETURNING *
        """
        
        invoice_result = db.execute_query(
            invoice_query,
            (
                invoice_id,
                order_data['id'],
                order_data['student_id'],
                order_data.get('total_items', 0),
                due_date,
                approved_by,
                f"Auto-generated invoice for approved order {order_data.get('order_number', '')}"
            )
        )
        
        if invoice_result:
            api_logger.info(f"✅ Created invoice directly in database for order {order_data.get('order_number')}")
            return invoice_result[0]
        else:
            api_logger.error("Failed to create invoice directly in database")
            return None
            
    except Exception as e:
        api_logger.error(f"Error creating invoice directly: {str(e)}")
        return None

async def add_order_items_to_invoice(order_id: str, invoice_id: str, db: DatabaseManager):
    """Add order items to the created invoice"""
    try:
        # Get order items
        items_query = """
        SELECT oi.*, p.name as product_name, p.sku as product_sku, p.unit_price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = %s AND oi.status = 'approved'
        """
        
        items_result = db.execute_query(items_query, (order_id,))
        
        if items_result:
            # Add each item to invoice_items table
            for item in items_result:
                invoice_item_query = """
                INSERT INTO invoice_items (
                    invoice_id, product_id, order_item_id, product_name, product_sku,
                    quantity, unit_value, total_value, lending_duration_days,
                    expected_return_date, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                total_value = item['quantity_approved'] * item.get('unit_price', 0)
                
                db.execute_command(
                    invoice_item_query,
                    (
                        invoice_id,
                        item['product_id'],
                        item['id'],
                        item.get('product_name', ''),
                        item.get('product_sku', ''),
                        item['quantity_approved'],
                        item.get('unit_price', 0),
                        total_value,
                        30,  # Default lending duration
                        item.get('expected_return_date'),
                        item.get('notes', '')
                    )
                )
            
            api_logger.info(f"✅ Added {len(items_result)} items to invoice {invoice_id}")
        
    except Exception as e:
        api_logger.error(f"Error adding items to invoice: {str(e)}")

@app.put("/api/orders/{order_id}")
async def update_order(order_id: str, order_update: OrderUpdate, db: DatabaseManager = Depends(get_db)):
    """Update order with automatic invoice creation when approved"""
    try:
        # Get current order status to detect status changes
        current_order_query = "SELECT * FROM orders WHERE id = %s"
        current_order_result = db.execute_query(current_order_query, (order_id,))
        
        if not current_order_result:
            raise HTTPException(status_code=404, detail="Order not found")
        
        current_order = current_order_result[0]
        current_status = current_order['status']
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if order_update.student_id is not None:
            update_fields.append("student_id = %s")
            update_values.append(order_update.student_id)
        
        if order_update.status is not None:
            valid_statuses = ['pending', 'closed', 'overdue', 'cancelled']
            if order_update.status not in valid_statuses:
                raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
            
            update_fields.append("status = %s")
            update_values.append(order_update.status)
            
            # Set approved_date if status is being set to approved
            if order_update.status == 'approved':
                update_fields.append("approved_date = CURRENT_TIMESTAMP")
                if order_update.approved_by:
                    update_fields.append("approved_by = %s")
                    update_values.append(order_update.approved_by)
        
        if order_update.notes is not None:
            update_fields.append("notes = %s")
            update_values.append(order_update.notes)
        
        if order_update.expected_return_date is not None:
            update_fields.append("expected_return_date = %s")
            update_values.append(order_update.expected_return_date)
        
        # Always update the timestamp
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not update_fields:
            return {"message": "No fields to update"}
        
        # Execute the update
        update_query = f"""
        UPDATE orders SET {', '.join(update_fields)}
        WHERE id = %s
        """
        update_values.append(order_id)
        
        if not db.execute_command(update_query, tuple(update_values)):
            raise HTTPException(status_code=500, detail="Failed to update order")
        
        # Handle status-specific logic
        if order_update.status:
            # If status is approved, also approve all order items
            if order_update.status == 'approved':
                items_query = """
                UPDATE order_items SET 
                    quantity_approved = quantity_requested,
                    status = 'approved'
                WHERE order_id = %s
                """
                db.execute_command(items_query, (order_id,))
                
                # 🆕 IMPROVED: Smart invoice management for approved orders
                api_logger.info(f"🎯 Order {order_id} approved! Managing invoice...")
                
                # Check if invoice already exists for this order
                existing_invoice_query = """
                SELECT invoice_number, id FROM invoices 
                WHERE order_id = %s 
                ORDER BY created_at DESC 
                LIMIT 1
                """
                existing_invoice = db.execute_query(existing_invoice_query, (order_id,))
                api_logger.info(f"🔍 DEBUG: Found {len(existing_invoice) if existing_invoice else 0} existing invoices for order {order_id}")
                
                if existing_invoice:
                    # Update existing invoice instead of creating new one
                    invoice_id = existing_invoice[0]['id']
                    invoice_number = existing_invoice[0]['invoice_number']
                    
                    api_logger.info(f"📝 Updating existing invoice {invoice_number} for order {order_id}")
                    
                    # Update invoice status and sync with current order data
                    update_invoice_query = """
                    UPDATE invoices SET 
                        status = 'approved',
                        updated_at = CURRENT_TIMESTAMP,
                        notes = CONCAT(COALESCE(notes, ''), '\n', 'Order re-approved on ', NOW())
                    WHERE id = %s
                    """
                    db.execute_command(update_invoice_query, (invoice_id,))
                    
                    invoice_message = f" Updated existing invoice {invoice_number}."
                    
                else:
                    # Create new invoice only if none exists
                    api_logger.info(f"🆕 Creating new invoice for order {order_id}")
                    created_invoice = await create_invoice_for_approved_order(
                        order_id, 
                        db, 
                        order_update.approved_by or "System"
                    )
                    
                    if created_invoice:
                        api_logger.info(f"🎉 Invoice {created_invoice.get('invoice_number')} created automatically for order {order_id}")
                        invoice_message = f" Invoice {created_invoice.get('invoice_number')} created automatically."
                    else:
                        api_logger.warning(f"⚠️ Failed to create invoice for order {order_id}")
                        invoice_message = " Note: Invoice creation failed - please create manually."
            
            # If status is completed, mark all items as returned
            elif order_update.status == 'completed':
                items_query = """
                UPDATE order_items SET 
                    quantity_returned = quantity_approved,
                    status = 'returned',
                    return_date = CURRENT_TIMESTAMP
                WHERE order_id = %s AND status = 'approved'
                """
                db.execute_command(items_query, (order_id,))
                invoice_message = ""
            else:
                invoice_message = ""
        else:
            invoice_message = ""
        
        # Get updated order for response
        updated_order_result = db.execute_query(current_order_query, (order_id,))
        updated_order = updated_order_result[0] if updated_order_result else None
        
        api_logger.info(f"Order {order_id} updated successfully")
        
        return {
            "message": f"Order updated successfully.{invoice_message}",
            "order": updated_order,
            "invoice_created": bool(order_update.status == 'approved' and current_status == 'pending' and 'created automatically' in invoice_message)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error updating order {order_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update order: {str(e)}")

@app.put("/api/orders/{order_id}/items/{item_id}/return")
async def return_item(
    order_id: str, 
    item_id: str, 
    quantity: int,
    condition: str = "good",
    db: DatabaseManager = Depends(get_db)
):
    """Mark items as returned"""
    query = """
    UPDATE order_items SET 
        quantity_returned = quantity_returned + %s,
        actual_return_date = CURRENT_DATE,
        return_condition = %s,
        status = CASE 
            WHEN quantity_returned + %s >= quantity_approved THEN 'returned'
            ELSE 'partial_return'
        END
    WHERE id = %s AND order_id = %s
    """
    
    if db.execute_command(query, (quantity, condition, quantity, item_id, order_id)):
        return {"message": "Item return recorded successfully"}
    
    raise HTTPException(status_code=400, detail="Failed to record item return")

@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete an order and all its items"""
    # First delete all order items
    items_query = "DELETE FROM order_items WHERE order_id = %s"
    db.execute_command(items_query, (order_id,))
    
    # Then delete the order
    order_query = "DELETE FROM orders WHERE id = %s"
    
    if db.execute_command(order_query, (order_id,)):
        return {"message": "Order deleted successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to delete order")

# ==============================
# COURSES API ENDPOINTS
# ==============================

class CourseModel(BaseModel):
    name: str

@app.get("/api/courses")
async def get_courses(db: DatabaseManager = Depends(get_db)):
    """Get all courses"""
    try:
        # Check if courses table exists, if not create it
        create_table_query = """
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        db.execute_command(create_table_query)
        
        # Insert default courses if table is empty
        count_query = "SELECT COUNT(*) as count FROM courses"
        count_result = db.execute_query(count_query)
        
        if count_result and count_result[0]['count'] == 0:
            # Insert default courses
            default_courses = [
                'Computer Science',
                'Information Technology', 
                'Software Engineering',
                'Data Science',
                'Cybersecurity',
                'Web Development',
                'Mobile App Development',
                'Artificial Intelligence',
                'Machine Learning',
                'Database Management'
            ]
            
            insert_query = "INSERT INTO courses (name) VALUES (%s) ON CONFLICT (name) DO NOTHING"
            for course in default_courses:
                db.execute_command(insert_query, (course,))
        
        # Fetch all courses
        query = "SELECT id, name FROM courses ORDER BY name"
        courses = db.execute_query(query)
        
        if courses is None:
            return []
        
        return [{"id": course["id"], "name": course["name"]} for course in courses]
        
    except Exception as e:
        api_logger.error(f"Error fetching courses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch courses")

@app.post("/api/courses")
async def create_course(course: CourseModel, db: DatabaseManager = Depends(get_db)):
    """Create a new course"""
    try:
        # Ensure courses table exists
        create_table_query = """
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        db.execute_command(create_table_query)
        
        # Insert new course
        insert_query = "INSERT INTO courses (name) VALUES (%s) RETURNING id, name"
        result = db.execute_query(insert_query, (course.name.strip(),))
        
        if result:
            api_logger.info(f"Course created successfully: {course.name}")
            return {"id": result[0]["id"], "name": result[0]["name"], "message": "Course created successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to create course")
            
    except Exception as e:
        api_logger.error(f"Error creating course: {str(e)}")
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Course already exists")
        raise HTTPException(status_code=500, detail="Failed to create course")

@app.delete("/api/courses")
async def delete_course(course: CourseModel, db: DatabaseManager = Depends(get_db)):
    """Delete a course by name"""
    try:
        # Delete course by name
        delete_query = "DELETE FROM courses WHERE name = %s RETURNING id, name"
        result = db.execute_query(delete_query, (course.name,))
        
        if result:
            api_logger.info(f"Course deleted successfully: {course.name}")
            return {"message": f"Course '{course.name}' deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Course not found")
            
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error deleting course: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete course")

# DESIGNATIONS API ENDPOINTS
# ==============================

class DesignationModel(BaseModel):
    name: str

@app.get("/api/designations")
async def get_designations(db: DatabaseManager = Depends(get_db)):
    """Get all designations"""
    try:
        # Check if designations table exists, if not create it
        create_table_query = """
        CREATE TABLE IF NOT EXISTS designations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        db.execute_command(create_table_query)
        
        # Insert default designations if table is empty
        count_query = "SELECT COUNT(*) as count FROM designations"
        count_result = db.execute_query(count_query)
        
        if count_result and count_result[0]['count'] == 0:
            # Insert default designations
            default_designations = [
                'Professor',
                'Associate Professor', 
                'Assistant Professor',
                'Lab Assistant',
                'Lab Coordinator',
                'Department Head',
                'Research Assistant',
                'Teaching Assistant',
                'Lab Technician',
                'Senior Lab Assistant'
            ]
            
            insert_query = "INSERT INTO designations (name) VALUES (%s) ON CONFLICT (name) DO NOTHING"
            for designation in default_designations:
                db.execute_command(insert_query, (designation,))
        
        # Fetch all designations
        query = "SELECT id, name FROM designations ORDER BY name"
        designations = db.execute_query(query)
        
        if designations is None:
            return []
        
        return [{"id": designation["id"], "name": designation["name"]} for designation in designations]
        
    except Exception as e:
        api_logger.error(f"Error fetching designations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch designations")

@app.post("/api/designations")
async def create_designation(designation: DesignationModel, db: DatabaseManager = Depends(get_db)):
    """Create a new designation"""
    try:
        # Ensure designations table exists
        create_table_query = """
        CREATE TABLE IF NOT EXISTS designations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        db.execute_command(create_table_query)
        
        # Insert new designation
        insert_query = "INSERT INTO designations (name) VALUES (%s) RETURNING id, name"
        result = db.execute_query(insert_query, (designation.name.strip(),))
        
        if result:
            api_logger.info(f"Designation created successfully: {designation.name}")
            return {"id": result[0]["id"], "name": result[0]["name"], "message": "Designation created successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to create designation")
            
    except Exception as e:
        api_logger.error(f"Error creating designation: {str(e)}")
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Designation already exists")
        raise HTTPException(status_code=500, detail="Failed to create designation")

@app.delete("/api/designations")
async def delete_designation(designation: DesignationModel, db: DatabaseManager = Depends(get_db)):
    """Delete a designation by name"""
    try:
        # Delete designation by name
        delete_query = "DELETE FROM designations WHERE name = %s RETURNING id, name"
        result = db.execute_query(delete_query, (designation.name,))
        
        if result:
            api_logger.info(f"Designation deleted successfully: {designation.name}")
            return {"message": f"Designation '{designation.name}' deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Designation not found")
            
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error deleting designation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete designation")

async def send_overdue_email_notifications(order_id: str, db: DatabaseManager) -> Dict:
    """Send email notifications for overdue orders using real database data"""
    if not EMAIL_SERVICE_LOADED or not email_service:
        api_logger.warning("Email service not available - skipping email notifications")
        return {"error": "Email service not available"}
    
    try:
        api_logger.info(f"Sending overdue email notifications for order {order_id} using real database data")
        
        # Use the new database-integrated email service method
        result = email_service.send_overdue_notification_by_order_id(order_id)
        
        if not result.get('order_found'):
            api_logger.error(f"Order {order_id} not found in database")
            return {"error": "Order not found in database"}
        
        api_logger.info(f"Email notifications processed for overdue order {order_id}")
        api_logger.info(f"Results: Student sent: {result.get('student_email_sent')}, Admin sent: {result.get('admin_email_sent')}")
        
        if result.get('errors'):
            api_logger.warning(f"Email notification errors: {result['errors']}")
        
        return result
        
    except Exception as e:
        error_msg = f"Error sending overdue email notifications for order {order_id}: {str(e)}"
        api_logger.error(error_msg)
        return {"error": error_msg}

@app.post("/api/orders/{order_id}/send-overdue-notification")
async def trigger_overdue_notification(order_id: str, db: DatabaseManager = Depends(get_db)):
    """Manually trigger overdue email notification for an order"""
    try:
        api_logger.info(f"Triggering overdue notification for order {order_id}")
        
        # Check if order exists (don't require it to be overdue already)
        check_query = """
        SELECT id, order_number, status, expected_return_date
        FROM orders 
        WHERE id = %s
        """
        
        order_check = db.execute_query(check_query, (order_id,))
        if not order_check:
            api_logger.error(f"Order {order_id} not found")
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_info = order_check[0]
        api_logger.info(f"Found order {order_id} with status: {order_info.get('status')}")
        
        # Send notifications
        result = await send_overdue_email_notifications(order_id, db)
        
        if "error" in result:
            api_logger.error(f"Error sending notifications for order {order_id}: {result['error']}")
            return {
                "message": "Failed to send overdue notifications",
                "order_id": order_id,
                "error": result["error"],
                "results": {"student_email_sent": False, "admin_email_sent": False, "errors": [result["error"]]}
            }
        
        api_logger.info(f"Successfully processed overdue notifications for order {order_id}")
        return {
            "message": "Overdue notifications processed",
            "order_id": order_id,
            "results": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error triggering overdue notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send overdue notification")

if __name__ == "__main__":
    import uvicorn
    # Initialize database on startup
    from database_manager import init_database
    print("Initializing database...")
    init_database()
    print("Starting API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
