from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid
from database_manager import get_db, DatabaseManager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Inventory Management API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    logger.info(f"Creating product: {product.name}")
    
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
            logger.info(f"Product created successfully: {product_id}")
            
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
            return await get_product(product_id, db)
        else:
            logger.error("execute_command returned False")
            raise HTTPException(status_code=400, detail="Product creation failed. This might be due to a duplicate SKU or invalid data.")
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error creating product: {error_msg}")
        
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
async def create_order(order: OrderCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new order"""
    order_id = str(uuid.uuid4())
    
    # Calculate total items and value
    total_items = sum(item.quantity_requested for item in order.items)
    total_value = 0.0
    
    # Create the order
    order_query = """
    INSERT INTO orders (id, student_id, total_items, total_value, notes, expected_return_date)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    if not db.execute_command(order_query, (
        order_id, order.student_id, total_items, total_value, 
        order.notes, order.expected_return_date
    )):
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
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        product_info = product[0]
        item_total = float(product_info['unit_price']) * item.quantity_requested
        total_value += item_total
        
        item_query = """
        INSERT INTO order_items (
            id, order_id, product_id, quantity_requested, 
            unit_price, total_price, is_returnable, 
            expected_return_date, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_command(item_query, (
            item_id, order_id, item.product_id, item.quantity_requested,
            float(product_info['unit_price']), item_total, product_info['is_returnable'],
            item.expected_return_date, item.notes
        ))
    
    # Update order total value
    db.execute_command(
        "UPDATE orders SET total_value = %s WHERE id = %s", 
        (total_value, order_id)
    )
    
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
