from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid
import time
from database_manager import get_db, DatabaseManager
from logging_config import api_logger, main_logger, db_logger, log_performance
import logging

app = FastAPI(title="Inventory Management API", version="1.0.0")

# Add CORS middleware FIRST - this is crucial for proper CORS handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],
    allow_credentials=True,
    allow_methods=["*"],
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
    created_at: datetime
    updated_at: datetime

class StudentCreate(BaseModel):
    student_id: str
    name: str
    email: str
    phone: Optional[str] = None
    department: str
    year_of_study: Optional[int] = None
    course: Optional[str] = None

class Student(BaseModel):
    id: str
    student_id: str
    name: str
    email: str
    phone: Optional[str]
    department: str
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
    department: str
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
@app.get("/categories", response_model=List[Category])
async def get_categories(db: DatabaseManager = Depends(get_db)):
    """Get all categories"""
    query = "SELECT * FROM categories ORDER BY name"
    results = db.execute_query(query)
    return results

@app.post("/categories", response_model=Category)
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
@app.get("/products", response_model=List[Product])
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

@app.get("/products/{product_id}", response_model=Product)
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

@app.post("/products", response_model=Product)
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
        minimum_stock_level, image_url, specifications, tags
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
    """
    
    params = (
        product_id, product.name, product.description, category_id,
        product.sku, product.quantity_total, product.quantity_available,
        product.is_returnable, product.unit_price, product.location,
        product.minimum_stock_level, product.image_url,
        str(specifications_json), tags_array
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

@app.put("/products/{product_id}", response_model=Product)
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

@app.delete("/products/{product_id}")
async def delete_product(product_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete a product (hard delete - permanently removes from database)"""
    query = "DELETE FROM products WHERE id = %s"
    
    if db.execute_command(query, (product_id,)):
        return {"message": "Product deleted successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to delete product")

# Student endpoints
@app.get("/students", response_model=List[Student])
async def get_students(db: DatabaseManager = Depends(get_db)):
    """Get all active students"""
    query = "SELECT * FROM students WHERE is_active = true ORDER BY name"
    results = db.execute_query(query)
    return results

@app.post("/students", response_model=Student)
async def create_student(student: StudentCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new student"""
    student_id = str(uuid.uuid4())
    query = """
    INSERT INTO students (id, student_id, name, email, phone, department, year_of_study, course)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    params = (
        student_id, student.student_id, student.name, student.email,
        student.phone, student.department, student.year_of_study, student.course
    )
    
    if db.execute_command(query, params):
        result = db.execute_query("SELECT * FROM students WHERE id = %s", (student_id,))
        if result:
            return result[0]
    
    raise HTTPException(status_code=500, detail="Failed to create student")

@app.delete("/students/{student_id}")
async def delete_student(student_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete a student (hard delete - permanently removes from database)"""
    query = "DELETE FROM students WHERE id = %s"
    
    if db.execute_command(query, (student_id,)):
        return {"message": "Student deleted successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to delete student")

# Order endpoints
@app.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    db: DatabaseManager = Depends(get_db)
):
    """Get all orders with optional filtering"""
    query = """
    SELECT o.*, s.name as student_name, s.email as student_email, s.department
    FROM orders o
    JOIN students s ON o.student_id = s.id
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
        order['items'] = items
    
    return results

@app.post("/orders", response_model=Order)
# @log_performance('inventory.orders')  # Temporarily disabled for debugging
async def create_order(order: OrderCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new order"""
    order_id = str(uuid.uuid4())
    
    # Debug logging - check what we receive
    api_logger.info(f"DEBUG: Received order data: {order}")
    api_logger.info(f"DEBUG: Order student_id: {order.student_id}")
    api_logger.info(f"DEBUG: Order expected_return_date: {order.expected_return_date}")
    api_logger.info(f"DEBUG: Order items count: {len(order.items)}")
    for i, item in enumerate(order.items):
        api_logger.info(f"DEBUG: Item {i}: product_id={item.product_id}, quantity={item.quantity_requested}, expected_return_date={item.expected_return_date}")
    
    api_logger.info(
        f"Creating new order for student {order.student_id}",
        extra={
            'order_id': order_id,
            'student_id': order.student_id,
            'items_count': len(order.items),
            'expected_return_date': str(order.expected_return_date)
        }
    )
    
    try:
        # Calculate total items and value
        total_items = sum(item.quantity_requested for item in order.items)
        total_value = 0.0
        
        db_logger.info(f"Starting database transaction for order {order_id}")
        
        # Create the order
        order_query = """
        INSERT INTO orders (id, student_id, total_items, total_value, notes, expected_return_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        if not db.execute_command(order_query, (
            order_id, order.student_id, total_items, total_value, 
            order.notes, order.expected_return_date
        )):
            api_logger.error(f"Failed to create order {order_id} in database")
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        # Add order items
        for item in order.items:
            item_id = str(uuid.uuid4())
            
            # Get product info
            product = db.execute_query(
                "SELECT unit_price, is_returnable FROM products WHERE id = %s", 
                (item.product_id,)
            )
            
            if not product:
                api_logger.error(f"Product {item.product_id} not found for order {order_id}")
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
            
            product_info = product[0]
            item_total = float(product_info['unit_price']) * item.quantity_requested
            total_value += item_total
            
            db_logger.info(f"Adding item {item.product_id} to order {order_id}: {item.quantity_requested} units @ ${product_info['unit_price']}")
            
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
        
        # Update order total value
        db_logger.info(f"Updating order {order_id} total value to ${total_value}")
        if not db.execute_command(
            "UPDATE orders SET total_value = %s WHERE id = %s", 
            (total_value, order_id)
        ):
            api_logger.error(f"Failed to update order {order_id} total value")
            raise HTTPException(status_code=500, detail="Failed to update order total")
        
        api_logger.info(f"Order {order_id} created successfully with {len(order.items)} items, total value ${total_value}")
        
    except Exception as e:
        api_logger.error(f"Error creating order {order_id}: {str(e)}", exc_info=True)
        raise
    
    # Return the created order
    result = db.execute_query("""
        SELECT o.*, s.name as student_name, s.email as student_email, s.department
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

@app.put("/orders/{order_id}/approve")
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

@app.put("/orders/{order_id}/items/{item_id}/return")
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

@app.delete("/orders/{order_id}")
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

if __name__ == "__main__":
    import uvicorn
    # Initialize database on startup
    from database_manager import init_database
    print("Initializing database...")
    init_database()
    print("Starting API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
