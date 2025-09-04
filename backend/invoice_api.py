"""
Invoice Management API Endpoints
Handles invoice creation, management, and camera upload functionality
"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Response
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import base64
import json
import os
import re
import random
from pathlib import Path
import shutil

# OCR imports with robust error handling
CV2_AVAILABLE = False
OCR_AVAILABLE = False
cv2 = None
pytesseract = None
np = None

try:
    # Import basic OCR dependencies first
    from PIL import Image
    from dateutil import parser as date_parser
    
    # Try importing numpy
    try:
        import numpy as np
        print("NumPy imported successfully")
    except ImportError as np_error:
        print(f"NumPy not available: {np_error}")
        np = None
    
    # Try importing tesseract
    try:
        import pytesseract
        # Configure Tesseract path for Windows
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        print("Tesseract imported successfully")
    except ImportError as tess_error:
        print(f"Tesseract not available: {tess_error}")
        pytesseract = None
    
    # Try importing cv2 last (most problematic)
    try:
        import cv2
        CV2_AVAILABLE = True
        print("OpenCV imported successfully")
    except (ImportError, AttributeError) as cv2_error:
        print(f"OpenCV not available: {cv2_error}")
        cv2 = None
    
    # OCR is available if we have the basic tools
    if pytesseract is not None:
        OCR_AVAILABLE = True
        print("OCR libraries loaded successfully")
    else:
        print("OCR not available - missing tesseract")
        
except ImportError as e:
    print(f"OCR libraries not available: {e}")

from database_manager import get_db, DatabaseManager
from invoice_models import *
from logging_config import api_logger

# Log OCR availability after logger is imported
if OCR_AVAILABLE:
    api_logger.info("OCR libraries loaded successfully")
else:
    api_logger.warning("OCR libraries not available")

# Create router for invoice endpoints
invoice_router = APIRouter(tags=["invoices"])

def clean_extracted_text(text: str) -> str:
    """Clean and normalize extracted OCR text"""
    if not text:
        return ""
    
    # Remove extra whitespace and newlines
    text = ' '.join(text.split())
    
    # Remove common OCR artifacts and redundant words
    text = re.sub(r'\b(Student|Name|ID|Department)\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text)  # Collapse multiple spaces
    
    # Capitalize names properly if it looks like a name
    if re.match(r'^[a-zA-Z\s]+$', text):
        text = ' '.join(word.capitalize() for word in text.split())
    
    return text.strip()

# Configuration for file uploads
UPLOAD_DIR = Path("uploads/invoices")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def save_uploaded_image(image_data: str, filename: str, invoice_id: str) -> tuple[str, str]:
    """Save base64 image data to file and return (file_url, file_path)"""
    try:
        # Decode base64 data
        if ',' in image_data:
            header, image_data = image_data.split(',', 1)
        
        image_bytes = base64.b64decode(image_data)
        
        # Create invoice-specific directory
        invoice_dir = UPLOAD_DIR / invoice_id
        invoice_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(filename).suffix.lower()
        if not file_extension:
            file_extension = ".jpg"  # default
        
        unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = invoice_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        
        # Return relative path for URL generation and absolute path for processing
        image_url = f"uploads/invoices/{invoice_id}/{unique_filename}"
        return image_url, str(file_path)
        
    except Exception as e:
        api_logger.error(f"Error saving image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save image")

# INVOICE CRUD OPERATIONS

@invoice_router.post("/", response_model=Invoice)
async def create_invoice(invoice: InvoiceCreate, db: DatabaseManager = Depends(get_db)):
    """Create a new invoice - now handles automatic student creation"""
    
    # If student_id is provided, check if student exists
    if invoice.student_id:
        student_query = "SELECT * FROM students WHERE id = %s OR student_id = %s"
        existing_student = db.execute_query(student_query, (invoice.student_id, invoice.student_id))
        
        if existing_student:
            # Student exists, use their ID
            actual_student_id = existing_student[0]['id']
        else:
            raise HTTPException(status_code=404, detail=f"Student with ID {invoice.student_id} not found")
    else:
        raise HTTPException(status_code=400, detail="Student ID is required")
    
    query = """
    INSERT INTO invoices (
        order_id, student_id, invoice_type, status, due_date, issued_by, notes
    ) VALUES (%s, %s, %s, 'issued', %s, %s, %s)
    RETURNING *
    """
    
    result = db.execute_query(
        query, 
        (
            invoice.order_id, actual_student_id, invoice.invoice_type, 
            invoice.due_date, invoice.issued_by, invoice.notes
        )
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create invoice")
    
    # Get the first (and only) result
    created_invoice = result[0]
    
    # Update order total_items in invoice
    if invoice.order_id:
        update_query = """
        UPDATE invoices SET total_items = (
            SELECT total_items FROM orders WHERE id = %s
        ) WHERE id = %s
        """
        db.execute_command(update_query, (invoice.order_id, created_invoice['id']))
    
    # Log the transaction
    log_invoice_transaction(db, created_invoice['id'], 'created', None, 'issued', invoice.issued_by, "Invoice created")
    
    return created_invoice

# New endpoint for creating invoice with automatic student creation
@invoice_router.post("/create-with-student")
async def create_invoice_with_student(
    request: InvoiceCreateWithStudent,
    db: DatabaseManager = Depends(get_db)
):
    """Create invoice and automatically create student if they don't exist"""
    import uuid
    import time
    
    try:
        api_logger.info(f"Creating invoice with student auto-creation for: {request.student_name}")
        
        # Step 1: Check if student exists by name or student_id
        existing_student = None
        if request.student_id:
            existing_student = db.execute_query("SELECT * FROM students WHERE student_id = %s", (request.student_id,))
        
        if not existing_student and request.student_email:
            existing_student = db.execute_query("SELECT * FROM students WHERE email = %s", (request.student_email,))
        
        if not existing_student:
            # Try to find by name
            existing_student = db.execute_query("SELECT * FROM students WHERE LOWER(name) = LOWER(%s)", (request.student_name,))
        
        # Step 2: Create student if doesn't exist
        if existing_student:
            api_logger.info(f"Found existing student: {existing_student[0]['student_id']}")
            actual_student_id = existing_student[0]['id']
        else:
            api_logger.info(f"Creating new student: {request.student_name}")
            
            # Generate student_id if not provided
            student_id = request.student_id
            if not student_id:
                timestamp = str(int(time.time()))[-6:]
                student_id = f"STUD{timestamp}"
            
            # Generate email if not provided
            student_email = request.student_email
            if not student_email:
                student_email = f"{student_id.lower()}@student.local"
            
            # Use provided department or default
            department = request.department or "General"
            
            
            # Create new student
            student_uuid = str(uuid.uuid4())
            student_query = """
            INSERT INTO students (id, student_id, name, email, department, year_of_study)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """
            
            student_params = (
                student_uuid, student_id, request.student_name, 
                student_email, department, request.year_of_study or 1
            )
            
            created_student = db.execute_query(student_query, student_params)
            if not created_student:
                raise HTTPException(status_code=500, detail="Failed to create student")
            
            actual_student_id = student_uuid
            api_logger.info(f"Created new student with ID: {student_id}")
        
        # Step 3: Create the invoice
        invoice_query = """
        INSERT INTO invoices (
            student_id, invoice_type, status, due_date, issued_by, notes
        ) VALUES (%s, %s, 'issued', %s, %s, %s)
        RETURNING *
        """
        
        invoice_result = db.execute_query(
            invoice_query, 
            (actual_student_id, request.invoice_type, request.due_date, request.issued_by, request.notes)
        )
        
        if not invoice_result:
            raise HTTPException(status_code=500, detail="Failed to create invoice")
        
        created_invoice = invoice_result[0]
        
        # Log the transaction
        log_invoice_transaction(
            db, created_invoice['id'], 'created', None, 'issued', 
            request.issued_by, f"Invoice created with auto-student creation for {request.student_name}"
        )

        # Get the full student information for response
        student_info = db.execute_query("SELECT * FROM students WHERE id = %s", (actual_student_id,))
        
        api_logger.info(f"Successfully created invoice {created_invoice['id']} for student {request.student_name}")
        
        # Return both invoice and student information
        return {
            "invoice": created_invoice,
            "student": student_info[0] if student_info else None,
            "message": "Invoice created successfully with automatic student creation"
        }
        
    except Exception as e:
        api_logger.error(f"Error creating invoice with student: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")


@invoice_router.get("/", response_model=List[InvoiceDetail])
async def get_invoices(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    invoice_type: Optional[str] = None,
    student_id: Optional[str] = None,
    db: DatabaseManager = Depends(get_db)
):
    """Get all invoices with filtering options"""
    # Set cache control headers to prevent caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    where_conditions = []
    params = []
    
    if status:
        where_conditions.append("i.status = %s")
        params.append(status)
    
    if invoice_type:
        where_conditions.append("i.invoice_type = %s")
        params.append(invoice_type)
    
    if student_id:
        where_conditions.append("i.student_id = %s")
        params.append(student_id)
    
    where_clause = ""
    if where_conditions:
        where_clause = "WHERE " + " AND ".join(where_conditions)
    
    query = f"""
    SELECT 
        i.*,
        o.order_number,
        o.status as order_status,
        o.requested_date,
        o.expected_return_date,
        s.name as student_name,
        s.student_id as student_id_number,
        s.email as student_email,
        s.department,
        s.year_of_study,
        (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as item_count,
        (SELECT COUNT(*) FROM invoice_images img WHERE img.invoice_id = i.id) as image_count,
        (SELECT COUNT(*) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) as acknowledgment_count,
        (SELECT MAX(acknowledged_at) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) as latest_acknowledgment
    FROM invoices i
    LEFT JOIN orders o ON i.order_id = o.id
    LEFT JOIN students s ON i.student_id = s.id
    {where_clause}
    ORDER BY i.created_at DESC
    OFFSET %s LIMIT %s
    """
    
    params.extend([skip, limit])
    return db.execute_query(query, params)

# Fix the route to match frontend expectations
@invoice_router.get("/{invoice_id}", response_model=InvoiceDetail)
async def get_invoice(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Get invoice by ID with all related data"""
    try:
        api_logger.info(f"Fetching invoice with ID: {invoice_id}")
        
        # Get main invoice data
        invoice_query = """
        SELECT 
            i.*,
            o.order_number,
            o.status as order_status,
            o.requested_date,
            o.expected_return_date,
            s.name as student_name,
            s.student_id as student_id_number,
            s.email as student_email,
            s.department,
            s.year_of_study
        FROM invoices i
        LEFT JOIN orders o ON i.order_id = o.id
        LEFT JOIN students s ON i.student_id = s.id
        WHERE i.id = %s
        """
        
        invoice_data = db.execute_query(invoice_query, (invoice_id,))
        api_logger.info(f"Invoice query returned: {len(invoice_data) if invoice_data else 0} results")
        
        if not invoice_data:
            api_logger.warning(f"Invoice not found: {invoice_id}")
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get the first result
        invoice_data = invoice_data[0]
        api_logger.info(f"Found invoice: {invoice_data.get('invoice_number', 'Unknown')}")
        
        # Get invoice items
        items_query = "SELECT * FROM invoice_items WHERE invoice_id = %s ORDER BY created_at"
        items_data = db.execute_query(items_query, (invoice_id,))
        
        # Get invoice images
        images_query = "SELECT * FROM invoice_images WHERE invoice_id = %s ORDER BY created_at"
        images_data = db.execute_query(images_query, (invoice_id,))
        
        # Get acknowledgments
        acknowledgments_query = "SELECT * FROM student_acknowledgments WHERE invoice_id = %s ORDER BY acknowledged_at"
        acknowledgments_data = db.execute_query(acknowledgments_query, (invoice_id,))
        
        # Get transactions
        transactions_query = "SELECT * FROM invoice_transactions WHERE invoice_id = %s ORDER BY created_at"
        transactions_data = db.execute_query(transactions_query, (invoice_id,))
        
        # Combine all data
        result = dict(invoice_data)
        result.update({
            'items': items_data or [],
            'images': images_data or [],
            'acknowledgments': acknowledgments_data or [],
            'transactions': transactions_data or [],
            'item_count': len(items_data or []),
            'image_count': len(images_data or []),
            'acknowledgment_count': len(acknowledgments_data or []),
            'latest_acknowledgment': acknowledgments_data[-1]['acknowledged_at'] if acknowledgments_data else None
        })
        
        api_logger.info(f"Successfully retrieved invoice {invoice_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error retrieving invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving invoice: {str(e)}")

@invoice_router.put("/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, invoice_update: InvoiceUpdate, db: DatabaseManager = Depends(get_db)):
    """Update invoice (optimized for 8GB RAM)"""
    try:
        # Get current invoice for logging
        current_result = db.execute_query("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
        if not current_result:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        current = current_result[0]
        api_logger.info(f"Updating invoice {invoice_id}")
        
        # Build update query efficiently
        update_fields = []
        params = []
        
        if invoice_update.status is not None:
            update_fields.append("status = %s")
            params.append(invoice_update.status)
            api_logger.info(f"Status change: {current['status']} -> {invoice_update.status}")
        
        if invoice_update.has_physical_copy is not None:
            update_fields.append("has_physical_copy = %s")
            params.append(invoice_update.has_physical_copy)
        
        if invoice_update.physical_invoice_captured is not None:
            update_fields.append("physical_invoice_captured = %s")
            params.append(invoice_update.physical_invoice_captured)
        
        if invoice_update.physical_invoice_notes is not None:
            update_fields.append("physical_invoice_notes = %s")
            params.append(invoice_update.physical_invoice_notes)
        
        if invoice_update.acknowledged_by_student is not None:
            update_fields.append("acknowledged_by_student = %s")
            params.append(invoice_update.acknowledged_by_student)
            
            if invoice_update.acknowledged_by_student:
                update_fields.append("acknowledgment_date = CURRENT_TIMESTAMP")
        
        if invoice_update.notes is not None:
            update_fields.append("notes = %s")
            params.append(invoice_update.notes)
        
        # Always update the updated_at timestamp
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not update_fields or len(update_fields) == 1:  # Only timestamp
            api_logger.info("No fields to update")
            return current
        
        # Execute update with proper error handling
        params.append(invoice_id)
        query = f"UPDATE invoices SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        
        api_logger.debug(f"Update query: {query}")
        api_logger.debug(f"Update params: {params}")
        
        result = db.execute_query(query, params)
        
        if not result:
            api_logger.error("Update query returned no results")
            raise HTTPException(status_code=500, detail="Failed to update invoice - no result returned")
        
        updated_invoice = result[0]
        api_logger.info(f"Invoice {invoice_id} updated successfully")
        
        # Log the transaction for status changes only (to save memory)
        if invoice_update.status and invoice_update.status != current.get('status'):
            try:
                log_invoice_transaction(
                    db, invoice_id, 'modified', 
                    current['status'], invoice_update.status, 
                    'System', f"Status: {current['status']} → {invoice_update.status}"
                )
                api_logger.info("Transaction logged")
            except Exception as e:
                # Don't fail the update if logging fails
                api_logger.warning(f"Transaction logging failed: {e}")
        
        # Force a small delay to ensure DB commit (helps with 8GB systems)
        import time
        time.sleep(0.1)
        
        return updated_invoice
        
    except Exception as e:
        api_logger.error(f"Invoice update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@invoice_router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete invoice and all related data"""
    try:
        api_logger.info(f"Attempting to delete invoice: {invoice_id}")
        
        # Check if invoice exists
        existing_result = db.execute_query("SELECT id, invoice_number FROM invoices WHERE id = %s", (invoice_id,))
        if not existing_result:
            api_logger.warning(f"Invoice not found for deletion: {invoice_id}")
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice_number = existing_result[0]['invoice_number']
        api_logger.info(f"Found invoice {invoice_number} for deletion")
        
        # Get all associated images to delete files
        images_query = "SELECT image_url, image_filename FROM invoice_images WHERE invoice_id = %s"
        images_result = db.execute_query(images_query, (invoice_id,))
        
        # Delete database records (this will cascade to related tables)
        delete_query = "DELETE FROM invoices WHERE id = %s"
        
        if db.execute_command(delete_query, (invoice_id,)):
            api_logger.info(f"Successfully deleted invoice {invoice_number} from database")
            
            # Clean up uploaded files
            if images_result:
                upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'invoices')
                for image in images_result:
                    try:
                        # Handle both URL-based and filename-based paths
                        if image.get('image_filename'):
                            file_path = os.path.join(upload_dir, image['image_filename'])
                        elif image.get('image_url'):
                            # Extract filename from URL like "/uploads/invoices/filename.jpg"
                            filename = image['image_url'].split('/')[-1]
                            file_path = os.path.join(upload_dir, filename)
                        else:
                            continue
                        
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            api_logger.info(f"Deleted file: {file_path}")
                    except Exception as e:
                        api_logger.warning(f"Failed to delete file {file_path}: {e}")
            
            # Also clean up any legacy directories (for backwards compatibility)
            legacy_dir = Path("uploads/invoices") / invoice_id
            if legacy_dir.exists():
                shutil.rmtree(legacy_dir)
                api_logger.info(f"Cleaned up legacy directory: {legacy_dir}")
            
            # Log the deletion
            api_logger.info(f"Successfully deleted invoice {invoice_id} and associated files")
            return {"message": "Invoice deleted successfully", "invoice_id": invoice_id}
        
        raise HTTPException(status_code=500, detail="Failed to delete invoice")
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error deleting invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# INVOICE ITEMS

@invoice_router.post("/{invoice_id}/items", response_model=InvoiceItem)
async def add_invoice_item(invoice_id: str, item: InvoiceItemCreate, db: DatabaseManager = Depends(get_db)):
    """Add item to invoice"""
    query = """
    INSERT INTO invoice_items (
        invoice_id, product_id, order_item_id, product_name, product_sku,
        quantity, unit_value, total_value, lending_duration_days,
        expected_return_date, notes
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING *
    """
    
    total_value = item.quantity * item.unit_value
    
    result = db.execute_query(
        query,
        (
            invoice_id, item.product_id, item.order_item_id, item.product_name,
            item.product_sku, item.quantity, item.unit_value, total_value,
            item.lending_duration_days, item.expected_return_date, item.notes
        )
    )
    
    return result[0] if result else None

@invoice_router.get("/{invoice_id}/items", response_model=List[InvoiceItem])
async def get_invoice_items(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Get all items for an invoice"""
    query = "SELECT * FROM invoice_items WHERE invoice_id = %s ORDER BY created_at"
    return db.execute_query(query, (invoice_id,))

# CAMERA UPLOAD FUNCTIONALITY

# Add CORS preflight handler for upload-image endpoint
@invoice_router.options("/{invoice_id}/upload-image")
async def upload_image_preflight(invoice_id: str):
    """Handle preflight requests for image upload"""
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3001",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Origin, Accept",
            "Access-Control-Max-Age": "3600"
        }
    )

@invoice_router.post("/{invoice_id}/upload-image", response_model=CameraUploadResponse)
async def upload_invoice_image(
    invoice_id: str,
    file: UploadFile = File(...),
    image_type: str = Form(...),
    notes: str = Form(None),
    db: DatabaseManager = Depends(get_db)
):
    """Upload image (from camera or file) for invoice"""
    from fastapi.responses import JSONResponse
    
    api_logger.info(f"Received file upload request for invoice {invoice_id}")
    api_logger.info(f"File: {file.filename}, Content Type: {file.content_type}")
    api_logger.info(f"Image type: {image_type}")
    
    try:
        # Verify invoice exists
        existing_result = db.execute_query("SELECT id FROM invoices WHERE id = %s", (invoice_id,))
        if not existing_result:
            return JSONResponse(
                status_code=404,
                content={"detail": "Invoice not found"},
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3001",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        
        # Read file content
        try:
            file_content = await file.read()
            api_logger.info(f"File read successfully, size: {len(file_content)} bytes")
            
            # Save file
            import base64
            import os
            
            # Create unique filename
            timestamp = int(datetime.now().timestamp() * 1000)
            file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
            unique_filename = f"invoice_{invoice_id}_{timestamp}{file_extension}"
            
            # Ensure upload directory exists
            upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'invoices')
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = os.path.join(upload_dir, unique_filename)
            with open(file_path, 'wb') as f:
                f.write(file_content)
                
            image_url = f"/uploads/invoices/{unique_filename}"
            api_logger.info(f"File saved successfully: {file_path}")
            
        except Exception as e:
            api_logger.error(f"Failed to save file: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Failed to save file: {str(e)}"},
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3001",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        
        # Process OCR if it's a physical invoice
        ocr_text = ""
        if image_type == "physical_invoice" and OCR_AVAILABLE:
            try:
                ocr_text = extract_text_from_image(file_path)
                api_logger.info(f"OCR extracted text: {ocr_text[:200]}...")
            except Exception as e:
                api_logger.warning(f"OCR processing failed: {e}")
        elif image_type == "physical_invoice":
            api_logger.info("OCR processing skipped - libraries not available")
        
        # Use current time for capture timestamp
        capture_time = datetime.now()
        
        # Save image record to database
        query = """
        INSERT INTO invoice_images (
            invoice_id, image_type, image_url, image_filename, uploaded_by,
            upload_method, device_info, capture_timestamp, notes, ocr_text, processing_status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, processing_status
        """
        
        try:
            result = db.execute_query(
                query,
                (
                    invoice_id, image_type, image_url,
                    file.filename, "system",  # uploaded_by
                    "file_upload", None,  # upload_method, device_info
                    capture_time, notes, ocr_text, "completed"
                )
            )
            
            if not result:
                return JSONResponse(
                    status_code=500,
                    content={"detail": "Failed to save image record"},
                    headers={
                        "Access-Control-Allow-Origin": "http://localhost:3001",
                        "Access-Control-Allow-Credentials": "true"
                    }
                )
            
            image_record = result[0]
            api_logger.info(f"Image record saved with ID: {image_record.get('id')}")
            
        except Exception as e:
            api_logger.error(f"Database error saving image record: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Database error: {str(e)}"},
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3001",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        
        # Update invoice if it's a physical invoice capture
        invoice_info = {}
        if image_type == "physical_invoice":
            try:
                update_query = """
                UPDATE invoices SET 
                    physical_invoice_captured = true,
                    physical_invoice_image_url = %s
                WHERE id = %s
                """
                db.execute_command(update_query, (image_url, invoice_id))
                api_logger.info("Updated invoice with physical capture info")
            except Exception as e:
                api_logger.error(f"Failed to update invoice: {e}")
                # Don't raise here, as the image was saved successfully
            
            # Try to extract invoice information and update database
            if ocr_text:
                try:
                    invoice_info = extract_invoice_information(ocr_text)
                    if invoice_info:
                        await update_invoice_from_ocr(db, invoice_id, invoice_info)
                except Exception as e:
                    api_logger.warning(f"Failed to extract invoice info: {e}")
        
        # Create response with CORS headers
        response_data = CameraUploadResponse(
            success=True,
            message="Image uploaded and processed successfully",
            image_id=str(image_record['id']),
            image_url=image_url,
            processing_status="completed",
            ocr_extracted=invoice_info if ocr_text else None
        )
        
        # Return JSONResponse with explicit CORS headers
        return JSONResponse(
            content=response_data.dict(),
            headers={
                "Access-Control-Allow-Origin": "http://localhost:3001",
                "Access-Control-Allow-Credentials": "true"
            }
        )
        
    except Exception as e:
        api_logger.error(f"Error uploading image for invoice {invoice_id}: {str(e)}")
        api_logger.error(f"Error type: {type(e).__name__}")
        import traceback
        api_logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Return a simplified success response if image was saved but database operations failed
        if 'image_url' in locals():
            response_data = CameraUploadResponse(
                success=True,
                message="Image uploaded successfully (with limited metadata)",
                image_url=image_url,
                processing_status="completed"
            )
            return JSONResponse(
                content=response_data.dict(),
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3001",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        else:
            return JSONResponse(
                content={"detail": f"Failed to upload image: {str(e)}"},
                status_code=500,
                headers={
                    "Access-Control-Allow-Origin": "http://localhost:3001",
                    "Access-Control-Allow-Credentials": "true"
                }
            )

@invoice_router.post("/{invoice_id}/upload-file")
async def upload_invoice_file(
    invoice_id: str,
    file: UploadFile = File(...),
    image_type: str = Form(...),
    uploaded_by: str = Form(...),
    notes: str = Form(None),
    db: DatabaseManager = Depends(get_db)
):
    """Upload file for invoice (alternative to base64 upload)"""
    try:
        # Verify invoice exists
        existing_result = db.execute_query("SELECT id FROM invoices WHERE id = %s", (invoice_id,))
        if not existing_result:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Check file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")
        
        # Create invoice-specific directory
        invoice_dir = UPLOAD_DIR / invoice_id
        invoice_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = invoice_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        image_url = f"uploads/invoices/{invoice_id}/{unique_filename}"
        
        # Save to database
        query = """
        INSERT INTO invoice_images (
            invoice_id, image_type, image_url, image_filename, uploaded_by,
            upload_method, image_size, image_format, notes
        ) VALUES (%s, %s, %s, %s, %s, 'file_upload', %s, %s, %s)
        RETURNING id
        """
        
        result = db.execute_query(
            query,
            (
                invoice_id, image_type, image_url, file.filename,
                uploaded_by, len(file_content), file_extension.lstrip('.'), notes
            )
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to save file record")

        return {"success": True, "image_id": result[0]['id'], "image_url": image_url}
        
    except Exception as e:
        api_logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@invoice_router.get("/{invoice_id}/images", response_model=List[InvoiceImage])
async def get_invoice_images(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Get all images for an invoice"""
    query = "SELECT * FROM invoice_images WHERE invoice_id = %s ORDER BY created_at"
    return db.execute_query(query, (invoice_id,))

@invoice_router.get("/images/{image_id}")
async def get_image_file(image_id: str, db: DatabaseManager = Depends(get_db)):
    """Serve uploaded image file"""
    query = "SELECT image_url, image_filename FROM invoice_images WHERE id = %s"
    result = db.execute_query(query, (image_id,))
    
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_data = result[0]
    
    file_path = Path(image_data['image_url'])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(file_path, filename=image_data['image_filename'])

# STUDENT ACKNOWLEDGMENTS

@invoice_router.post("/{invoice_id}/acknowledge", response_model=StudentAcknowledment)
async def create_student_acknowledgment(
    invoice_id: str,
    acknowledgment: StudentAcknowledmentCreate,
    db: DatabaseManager = Depends(get_db)
):
    """Create student acknowledgment"""
    query = """
    INSERT INTO student_acknowledgments (
        invoice_id, student_id, acknowledgment_type, acknowledgment_method,
        signature_image_url, photo_evidence_url, digital_signature_data,
        acknowledgment_location, witness_name, notes
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING *
    """
    
    result = db.execute_query(
        query,
        (
            invoice_id, acknowledgment.student_id, acknowledgment.acknowledgment_type,
            acknowledgment.acknowledgment_method, acknowledgment.signature_image_url,
            acknowledgment.photo_evidence_url, acknowledgment.digital_signature_data,
            acknowledgment.acknowledgment_location, acknowledgment.witness_name, acknowledgment.notes
        )
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create acknowledgment")
    
    created_acknowledgment = result[0]
    
    # Update invoice acknowledgment status
    update_query = """
    UPDATE invoices SET 
        acknowledged_by_student = true,
        acknowledgment_date = CURRENT_TIMESTAMP
    WHERE id = %s
    """
    db.execute_command(update_query, (invoice_id,))
    
    return created_acknowledgment

# OCR PROCESSING ENDPOINTS

@invoice_router.post("/ocr-upload")
async def process_invoice_with_ocr(
    file: UploadFile = File(...),
    db: DatabaseManager = Depends(get_db)
):
    """Process uploaded invoice image with OCR to extract data"""
    try:
        # Validate file type
        if not file.content_type.startswith(('image/', 'application/pdf')):
            raise HTTPException(status_code=400, detail="Only image and PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Create temporary file for OCR processing
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Use the existing OCR system to extract text
            api_logger.info(f"OCR_AVAILABLE: {OCR_AVAILABLE}, CV2_AVAILABLE: {CV2_AVAILABLE}")
            
            if OCR_AVAILABLE:
                api_logger.info(f"Processing {file.filename} with OCR from path: {temp_file_path}")
                ocr_text = extract_text_from_image(temp_file_path)
                api_logger.info(f"OCR extracted text length: {len(ocr_text) if ocr_text else 0}")
                
                if ocr_text and len(ocr_text.strip()) > 10:
                    # Extract structured information from OCR text
                    extracted_info = extract_invoice_information(ocr_text)
                    
                    # Enhanced extraction for student information
                    extracted_data = {}
                    
                    # Try to extract student name (look for name patterns)
                    name_patterns = [
                        r'Name:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
                        r'Student\s+Name:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
                        r'Name\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
                        r'(?:^|\n)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*\n|\s+ID)',
                    ]
                    
                    for pattern in name_patterns:
                        match = re.search(pattern, ocr_text, re.MULTILINE)
                        if match:
                            extracted_data['student_name'] = match.group(1).strip()
                            break
                    
                    # Extract student ID with better patterns
                    student_id_patterns = [
                        r'Student\s+ID:\s*([A-Z0-9]+)',
                        r'ID:\s*([A-Z0-9]+)',
                        r'Student\s*ID\s*:\s*([A-Z0-9]+)',
                        r'ID\s*Number:\s*([A-Z0-9]+)',
                    ]
                    
                    for pattern in student_id_patterns:
                        match = re.search(pattern, ocr_text, re.MULTILINE)
                        if match:
                            extracted_data['student_id'] = match.group(1).strip()
                            break
                    
                    # Use existing student_id extraction as fallback
                    if 'student_id' not in extracted_data and 'student_id' in extracted_info:
                        extracted_data['student_id'] = extracted_info['student_id']
                    
                    # Try to extract department with better patterns
                    dept_patterns = [
                        r'Department:\s*([A-Z][a-zA-Z\s]+?)(?:\n|Year)',
                        r'Dept:\s*([A-Z][a-zA-Z\s]+?)(?:\n|Year)',
                        r'Department\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|Year)',
                        r'(Computer Science|Biology|Chemistry|Physics|Engineering|Mathematics|Business|Arts|Sciences)',
                    ]
                    
                    for pattern in dept_patterns:
                        match = re.search(pattern, ocr_text, re.MULTILINE)
                        if match:
                            extracted_data['department'] = match.group(1).strip()
                            break
                    
                    # Extract items if available
                    if 'items' in extracted_info:
                        extracted_data['items'] = extracted_info['items']
                    
                    # Calculate confidence based on extracted fields
                    confidence_score = 0.3  # Base confidence
                    if extracted_data.get('student_name'):
                        confidence_score += 0.3
                    if extracted_data.get('student_id'):
                        confidence_score += 0.2
                    if extracted_data.get('department'):
                        confidence_score += 0.1
                    if extracted_data.get('items'):
                        confidence_score += 0.1
                    
                    # Clean up extracted data
                    for key, value in extracted_data.items():
                        if isinstance(value, str):
                            extracted_data[key] = clean_extracted_text(value)
                    
                    return {
                        "success": True,
                        "extracted_data": extracted_data,
                        "confidence_score": min(confidence_score, 0.95),
                        "raw_text": ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text,
                        "processing_method": "tesseract_ocr",
                        "full_extraction": extracted_info
                    }
                else:
                    # OCR found no meaningful text
                    return {
                        "success": False,
                        "extracted_data": {},
                        "confidence_score": 0.0,
                        "raw_text": ocr_text if ocr_text else "",
                        "processing_method": "tesseract_ocr",
                        "error": "No readable text found in image"
                    }
            else:
                # OCR not available, return meaningful error
                return {
                    "success": False,
                    "extracted_data": {},
                    "confidence_score": 0.0,
                    "raw_text": "",
                    "processing_method": "none",
                    "error": "OCR system not available. Please ensure Tesseract is installed."
                }
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
    except Exception as e:
        api_logger.error(f"Error processing OCR upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
        api_logger.error(f"Error processing OCR upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

# BULK OPERATIONS

@invoice_router.post("/bulk-create", response_model=List[Invoice])
async def create_bulk_invoices(
    bulk_request: BulkInvoiceCreate,
    db: DatabaseManager = Depends(get_db)
):
    """Create invoices for multiple orders"""
    created_invoices = []
    
    for order_id in bulk_request.order_ids:
        # Get order info
        order_query = """
        SELECT id, student_id, total_items, expected_return_date 
        FROM orders 
        WHERE id = %s AND status = 'approved'
        """
        order_result = db.execute_query(order_query, (order_id,))
        
        if order_result:
            order_data = order_result[0]
            # Create invoice
            invoice_query = """
            INSERT INTO invoices (
                order_id, student_id, invoice_type, status, total_items,
                due_date, issued_by, notes
            ) VALUES (%s, %s, 'lending', 'issued', %s, %s, %s, %s)
            RETURNING *
            """
            
            invoice_result = db.execute_query(
                invoice_query,
                (
                    order_id, order_data['student_id'], order_data['total_items'],
                    order_data['expected_return_date'], bulk_request.issued_by, bulk_request.notes
                )
            )
            
            if invoice_result:
                created_invoices.append(invoice_result[0])
    
    return created_invoices

# DASHBOARD AND ANALYTICS

@invoice_router.get("/analytics/summary", response_model=InvoiceSummary)
async def get_invoice_summary(db: DatabaseManager = Depends(get_db)):
    """Get invoice analytics summary"""
    query = """
    SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_invoices,
        COUNT(CASE WHEN acknowledged_by_student = true THEN 1 END) as acknowledged_invoices,
        COUNT(CASE WHEN status = 'issued' AND due_date > CURRENT_DATE THEN 1 END) as pending_returns,
        COUNT(CASE WHEN status = 'issued' AND due_date < CURRENT_DATE THEN 1 END) as overdue_returns,
        COUNT(CASE WHEN physical_invoice_captured = true THEN 1 END) as physical_invoices_captured,
        COALESCE(SUM(total_value), 0) as total_lending_value
    FROM invoices
    """
    
    result = db.execute_query(query)
    return result[0] if result else {
        "total_invoices": 0,
        "issued_invoices": 0, 
        "acknowledged_invoices": 0,
        "pending_returns": 0,
        "overdue_returns": 0,
        "physical_invoices_captured": 0,
        "total_lending_value": 0.0
    }

@invoice_router.get("/analytics/stats", response_model=InvoiceStats)
async def get_invoice_stats(db: DatabaseManager = Depends(get_db)):
    """Get detailed invoice statistics"""
    # By type
    type_query = """
    SELECT invoice_type, COUNT(*) as count
    FROM invoices 
    GROUP BY invoice_type
    """
    by_type = {row['invoice_type']: row['count'] for row in db.execute_query(type_query)}
    
    # By status
    status_query = """
    SELECT status, COUNT(*) as count
    FROM invoices 
    GROUP BY status
    """
    by_status = {row['status']: row['count'] for row in db.execute_query(status_query)}
    
    # By month
    month_query = """
    SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
    FROM invoices 
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month
    """
    by_month = {row['month']: row['count'] for row in db.execute_query(month_query)}
    
    # Recent activity
    activity_query = """
    SELECT 
        'invoice' as type,
        invoice_number as identifier,
        status,
        created_at
    FROM invoices
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 10
    """
    recent_activity = db.execute_query(activity_query)
    
    return InvoiceStats(
        by_type=by_type,
        by_status=by_status,
        by_month=by_month,
        recent_activity=recent_activity
    )

# UTILITY FUNCTIONS

# UTILITY FUNCTIONS

def extract_text_from_image(image_path: str) -> str:
    """Lightweight OCR optimized for low-memory systems (8GB RAM)"""
    if not OCR_AVAILABLE:
        api_logger.warning("OCR libraries not available")
        return ""
    
    try:
        api_logger.info(f"Starting lightweight OCR for: {image_path}")
        
        if not os.path.exists(image_path):
            api_logger.error(f"Image file not found: {image_path}")
            return ""
        
        # Load and resize image if too large (memory optimization)
        try:
            image = Image.open(image_path)
            
            # Limit image size to reduce memory usage
            max_dimension = 2000
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.LANCZOS)
                api_logger.info(f"Resized image to: {image.size}")
                
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            api_logger.info(f"Image loaded: {image.size}, mode: {image.mode}")
            
        except Exception as e:
            api_logger.error(f"Failed to load image: {e}")
            return ""
        
        best_text = ""
        best_score = 0
        
        # Memory-efficient preprocessing - only keep 2 versions max
        try:
            # Convert to numpy once
            img_array = np.array(image)
            
            # Simple grayscale conversion
            if len(img_array.shape) == 3:
                if CV2_AVAILABLE:
                    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                else:
                    # Fallback using PIL/numpy
                    gray = np.dot(img_array[...,:3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)
            else:
                gray = img_array
            
            # Only create 2 versions to save memory
            versions = [
                ("Original", gray),
            ]
            
            # Add one enhanced version only if image quality seems poor
            try:
                # Quick contrast check
                contrast = gray.std()
                if contrast < 40 and CV2_AVAILABLE:  # Low contrast image
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                    enhanced = clahe.apply(gray)
                    versions.append(("Enhanced", enhanced))
                    api_logger.info("Added enhanced version for low contrast")
                elif contrast < 40:
                    # Simple contrast enhancement without cv2
                    enhanced = np.clip(gray * 1.5, 0, 255).astype(np.uint8)
                    versions.append(("Enhanced", enhanced))
                    api_logger.info("Added simple enhanced version (no cv2)")
            except Exception as e:
                api_logger.debug(f"Enhancement failed: {e}")
            
        except Exception as e:
            api_logger.warning(f"Preprocessing failed, using PIL: {e}")
            versions = [("PIL", image)]
        
        # Simplified OCR configs - only the most effective ones
        configs = [
            '--psm 6 --oem 3',      # Most reliable for documents
            '--psm 4 --oem 3',      # Single column
        ]
        
        # Process each version
        for version_name, img_data in versions:
            try:
                # Convert to PIL if needed
                if isinstance(img_data, np.ndarray):
                    pil_img = Image.fromarray(img_data)
                else:
                    pil_img = img_data
                
                for config in configs:
                    try:
                        # Extract text with timeout protection
                        text = pytesseract.image_to_string(pil_img, config=config, timeout=30)
                        text_len = len(text.strip())
                        
                        # Simple scoring based on text length and basic patterns
                        score = text_len
                        
                        # Bonus for common invoice patterns
                        if any(word in text.lower() for word in ['invoice', 'total', 'student', 'equipment']):
                            score += 50
                        
                        # Bonus for numbers (prices, dates, IDs)
                        import re
                        if re.search(r'\d+', text):
                            score += 20
                            
                        if score > best_score and text_len > 10:
                            best_text = text
                            best_score = score
                            api_logger.info(f"Better OCR: {version_name}, score: {score}, length: {text_len}")
                    
                    except Exception as e:
                        api_logger.debug(f"OCR failed for {version_name}: {e}")
                        continue
                
                # Clear memory immediately after processing each version
                if isinstance(img_data, np.ndarray):
                    del img_data
                    
            except Exception as e:
                api_logger.warning(f"Version processing failed: {e}")
                continue
        
        # Fallback if nothing worked
        if not best_text.strip():
            try:
                api_logger.info("Using simple fallback OCR")
                best_text = pytesseract.image_to_string(image, config='--psm 6', timeout=20)
            except Exception as e:
                api_logger.error(f"Fallback OCR failed: {e}")
                return ""
        
        # Memory cleanup
        del image
        if 'img_array' in locals():
            del img_array
        if 'gray' in locals():
            del gray
            
        result_length = len(best_text.strip())
        api_logger.info(f"OCR completed. Score: {best_score}, length: {result_length}")
        
        # Provide confidence feedback based on score
        if best_score > 100:
            api_logger.info("HIGH CONFIDENCE - Good text extraction")
        elif best_score > 50:
            api_logger.info("MEDIUM CONFIDENCE - Review extracted data")
        else:
            api_logger.warning("LOW CONFIDENCE - Consider retaking photo")
        
        return best_text.strip()
        
    except Exception as e:
        api_logger.error(f"OCR processing failed: {e}")
        return ""

def extract_invoice_information(ocr_text: str) -> dict:
    """Extract structured information from OCR text"""
    if not ocr_text:
        return {}
    
    info = {}
    text_lines = ocr_text.split('\n')
    
    try:
        # Extract invoice number
        for line in text_lines:
            # Look for patterns like "Invoice: INV001", "Invoice #: 123", etc.
            invoice_match = re.search(r'(?:invoice|inv)[\s#:]*([A-Z0-9-]+)', line, re.IGNORECASE)
            if invoice_match:
                info['invoice_number'] = invoice_match.group(1)
                break
        
        # Extract dates
        date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})'
        dates = re.findall(date_pattern, ocr_text)
        if dates:
            info['dates_found'] = dates
        
        # Extract student information
        for line in text_lines:
            # Look for student ID patterns
            student_match = re.search(r'(?:student|id)[\s#:]*([A-Z0-9-]+)', line, re.IGNORECASE)
            if student_match and len(student_match.group(1)) >= 3:
                info['student_id'] = student_match.group(1)
        
        # Extract items/products
        items = []
        for line in text_lines:
            # Look for lines that might contain product information
            # Common patterns: quantity + name, SKU patterns, etc.
            if re.search(r'\b\d+\s*x\s*\w+', line, re.IGNORECASE):
                items.append(line.strip())
            elif re.search(r'\b[A-Z]{2,}-[A-Z0-9-]+', line):  # SKU patterns like ARD-UNO-R3
                items.append(line.strip())
        
        if items:
            info['items'] = items
        
        # Extract any monetary values
        money_pattern = r'\$?\s*\d+\.?\d*'
        amounts = re.findall(money_pattern, ocr_text)
        if amounts:
            info['amounts'] = amounts
        
        # Store full text for reference
        info['full_text'] = ocr_text
        
    except Exception as e:
        api_logger.error(f"Error extracting invoice information: {e}")
    
    return info

async def update_invoice_from_ocr(db: DatabaseManager, invoice_id: str, invoice_info: dict):
    """Update invoice record with information extracted from OCR"""
    try:
        updates = []
        params = []
        
        # Update invoice number if found and different
        if 'invoice_number' in invoice_info:
            current_invoice = db.execute_query("SELECT invoice_number FROM invoices WHERE id = %s", (invoice_id,))
            if current_invoice and not current_invoice[0].get('invoice_number'):
                updates.append("invoice_number = %s")
                params.append(invoice_info['invoice_number'])
        
        # Add OCR extracted information to notes
        ocr_summary = []
        if 'student_id' in invoice_info:
            ocr_summary.append(f"OCR Found Student ID: {invoice_info['student_id']}")
        if 'dates_found' in invoice_info:
            ocr_summary.append(f"OCR Found Dates: {', '.join(invoice_info['dates_found'])}")
        if 'items' in invoice_info:
            ocr_summary.append(f"OCR Found Items: {len(invoice_info['items'])} items")
        
        if ocr_summary:
            current_notes_result = db.execute_query("SELECT notes FROM invoices WHERE id = %s", (invoice_id,))
            current_notes = current_notes_result[0].get('notes', '') if current_notes_result else ''
            
            new_notes = current_notes + "\n\n=== OCR Extracted Information ===\n" + "\n".join(ocr_summary)
            updates.append("notes = %s")
            params.append(new_notes)
        
        # Execute updates if any
        if updates:
            params.append(invoice_id)
            query = f"UPDATE invoices SET {', '.join(updates)} WHERE id = %s"
            db.execute_command(query, params)
            
            # Log the OCR update
            log_invoice_transaction(
                db, invoice_id, 'ocr_processed', None, None, 
                'OCR System', f"OCR processing completed. Extracted: {', '.join(invoice_info.keys())}"
            )
        
    except Exception as e:
        api_logger.error(f"Error updating invoice from OCR: {e}")

def log_invoice_transaction(
    db: DatabaseManager,
    invoice_id: str,
    transaction_type: str,
    previous_status: Optional[str],
    new_status: Optional[str],
    performed_by: str,
    changes_summary: str
):
    """Helper function to log invoice transactions"""
    try:
        query = """
        INSERT INTO invoice_transactions (
            invoice_id, transaction_type, previous_status, new_status,
            performed_by, changes_summary
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        db.execute_command(
            query,
            (invoice_id, transaction_type, previous_status, new_status, performed_by, changes_summary)
        )
    except Exception as e:
        api_logger.error(f"Error logging transaction: {e}")

@invoice_router.post("/ocr/extract")
async def extract_invoice_data_from_image(
    file: UploadFile = File(...),
    image_type: str = Form(default="invoice_upload"),
    extract_data: bool = Form(default=True)
):
    """
    Extract invoice data from uploaded image using OCR
    """
    import time
    processing_id = f"{int(time.time())}_{uuid.uuid4().hex[:8]}"
    api_logger.info(f"Starting OCR processing with ID: {processing_id}")
    
    try:
        if not OCR_AVAILABLE:
            raise HTTPException(
                status_code=503, 
                detail="OCR functionality not available - missing required libraries"
            )
        
        # Validate file
        if not file.content_type.startswith('image/') and file.content_type != 'application/pdf':
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image or PDF.")
        
        # Save temporary file with unique name to prevent caching
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        
        temp_file_path = temp_dir / f"{processing_id}_{uuid.uuid4()}{Path(file.filename).suffix}"
        
        api_logger.info(f"Saving temp file: {temp_file_path}")
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text using OCR
        ocr_text = extract_text_from_image(str(temp_file_path))
        
        # Clean up temp file
        temp_file_path.unlink()
        
        result = {
            "success": True,
            "ocr_text": ocr_text,
            "confidence_score": 0.8,  # Base confidence for successful OCR
            "extracted_data": {}
        }
        
        # If data extraction is requested, parse the OCR text
        if extract_data and ocr_text:
            try:
                extracted_data = parse_text_simple(ocr_text)
                result["extracted_data"] = extracted_data
                # Use the confidence from the parsing function
                if "confidence_score" in extracted_data:
                    result["confidence_score"] = extracted_data["confidence_score"] / 100.0
                else:
                    result["confidence_score"] = 0.5  # Default moderate confidence
                
                # Debug logging for extracted items
                api_logger.info(f"OCR extracted {len(extracted_data.get('items', []))} items")
                for i, item in enumerate(extracted_data.get('items', [])):
                    api_logger.info(f"Item {i+1}: {item}")
                    
                api_logger.info(f"Data extraction successful. Final confidence: {result['confidence_score']*100:.1f}%")
            except Exception as e:
                api_logger.warning(f"Data extraction failed: {e}")
                # Fallback to basic parsing
                result["extracted_data"] = {
                    "student_name": "",
                    "student_id": "",
                    "student_email": "",
                    "department": "",
                    "due_date": "",
                    "notes": ocr_text[:200] + "..." if len(ocr_text) > 200 else ocr_text,
                    "items": []
                }
                result["confidence_score"] = 0.3  # Low confidence for failed parsing
        
        return result
        
    except Exception as e:
        api_logger.error(f"OCR extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def convert_date_to_iso_format(date_str: str) -> str:
    """
    Convert various date formats to ISO format (YYYY-MM-DD) for HTML date inputs
    Handles formats like:
    - "August 26, 2025"
    - "Sept 20, 2025" 
    - "8/26/2025"
    - "26/8/2025"
    """
    if not date_str or not date_str.strip():
        return ""
    
    try:
        # Clean up common OCR artifacts
        cleaned = date_str.replace("'", "").replace('"', '').strip()
        
        # Handle "Sept" abbreviation
        cleaned = re.sub(r'Sept(\d)', r'September \1', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'Sept\s*(\d)', r'September \1', cleaned, flags=re.IGNORECASE)
        
        # Parse the date using dateutil parser which handles many formats
        if date_parser:  # Only if dateutil is available
            parsed_date = date_parser.parse(cleaned)
            return parsed_date.strftime('%Y-%m-%d')
        else:
            # Fallback manual parsing for common formats
            # Handle "Month Day, Year" format
            month_match = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})', cleaned, re.IGNORECASE)
            if month_match:
                month_name = month_match.group(1).lower()
                day = int(month_match.group(2))
                year = int(month_match.group(3))
                
                months = {
                    'january': 1, 'february': 2, 'march': 3, 'april': 4,
                    'may': 5, 'june': 6, 'july': 7, 'august': 8,
                    'september': 9, 'october': 10, 'november': 11, 'december': 12
                }
                
                if month_name in months:
                    month = months[month_name]
                    return f"{year:04d}-{month:02d}-{day:02d}"
            
            # Handle MM/DD/YYYY or DD/MM/YYYY format
            slash_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', cleaned)
            if slash_match:
                part1, part2, year = slash_match.groups()
                year = int(year)
                if year < 100:  # Handle 2-digit years
                    year += 2000
                
                # Assume MM/DD/YYYY format (US format)
                month = int(part1)
                day = int(part2)
                
                # Validate and swap if needed
                if month > 12 and day <= 12:
                    month, day = day, month
                
                if 1 <= month <= 12 and 1 <= day <= 31:
                    return f"{year:04d}-{month:02d}-{day:02d}"
            
            return ""  # Could not parse
            
    except Exception as e:
        print(f"Date parsing error for '{date_str}': {e}")
        return ""

def clean_extracted_text(text: str, field_type: str = "general") -> str:
    """Clean and validate extracted text based on field type"""
    if not text:
        return ""
    
    # Basic cleaning
    cleaned = text.strip()
    
    # Remove excessive repeated characters (like sarahhhhh -> sarah)
    import re
    if field_type == "name":
        # Remove excessive repeated characters (more than 2 in a row)
        cleaned = re.sub(r'(.)\1{2,}', r'\1\1', cleaned)
        # Capitalize properly
        cleaned = ' '.join(word.capitalize() for word in cleaned.split())
        # Remove non-alphabetic characters except spaces
        cleaned = re.sub(r'[^a-zA-Z\s]', '', cleaned)
        # Remove extra spaces
        cleaned = ' '.join(cleaned.split())
        
    elif field_type == "email":
        # Basic email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', cleaned):
            return ""
            
    elif field_type == "student_id":
        # Remove spaces and non-alphanumeric characters
        cleaned = re.sub(r'[^a-zA-Z0-9]', '', cleaned)
        
    elif field_type == "department":
        # Capitalize properly and clean
        cleaned = ' '.join(word.capitalize() for word in cleaned.split())
        cleaned = re.sub(r'[^a-zA-Z\s&]', '', cleaned)
        cleaned = ' '.join(cleaned.split())
    
    return cleaned

def parse_text_simple(text: str) -> dict:
    """
    Enhanced text parsing to extract common invoice fields
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    extracted = {
        "student_name": "",
        "student_id": "",
        "student_email": "",
        "department": "",
        "due_date": "",
        "invoice_number": "",
        "notes": "",
        "items": []
    }
    
    # Enhanced patterns to look for
    import re
    
    full_text = ' '.join(lines)
    
    # Look for invoice number patterns
    invoice_patterns = [
        r'Invoice\s*[#:]?\s*([A-Z0-9-]+)',
        r'INV[#:-]?\s*([A-Z0-9-]+)',
        r'Invoice\s+Number[#:]?\s*([A-Z0-9-]+)'
    ]
    for pattern in invoice_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["invoice_number"]:
            extracted["invoice_number"] = match.group(1)
            break
    
    # Look for student ID patterns (more flexible)
    student_id_patterns = [
        r'Student\s+ID[#:]?\s*([A-Z0-9]+)',
        r'STU\s*([0-9]{4,6})',
        r'ID[#:]?\s*([A-Z0-9]{5,10})',
        r'STUD([0-9]{6,8})'
    ]
    for pattern in student_id_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["student_id"]:
            student_id = clean_extracted_text(match.group(1), "student_id")
            if len(student_id) >= 4:  # Valid student ID should be at least 4 characters
                extracted["student_id"] = student_id
                break
    
    # Look for student name patterns
    name_patterns = [
        r'Student\s+Name[#:]?\s*([A-Za-z\s]+?)(?:Department|Email|Student\s+ID|\n)',
        r'Name[#:]?\s*([A-Za-z\s]+?)(?:Department|Email|Student\s+ID|\n)',
        r'Name[#:]?\s*([A-Za-z\s]+?)$'
    ]
    for pattern in name_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["student_name"]:
            name = clean_extracted_text(match.group(1), "name")
            if len(name) > 2:  # Valid name should be more than 2 characters
                extracted["student_name"] = name
                break
    
    # Look for email patterns
    email_match = re.search(r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', full_text)
    if email_match:
        email = clean_extracted_text(email_match.group(1), "email")
        if email:  # Only set if valid email
            extracted["student_email"] = email
    
    # Look for department
    dept_patterns = [
        r'Department[#:]?\s*([A-Za-z\s&]+?)(?:Email|Year|Due|Student\s+ID|\n)',
        r'Dept[#:]?\s*([A-Za-z\s&]+?)(?:Email|Year|Due|Student\s+ID|\n)'
    ]
    for pattern in dept_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["department"]:
            dept = clean_extracted_text(match.group(1), "department")
            if len(dept) > 2:
                extracted["department"] = dept
                break
    
    # Look for due date patterns
    date_patterns = [
        r'Due\s+Date[#:]?\s*([A-Za-z0-9,\s]+?)(?:\n|$)',
        r'Return\s+Date[#:]?\s*([A-Za-z0-9,\s]+?)(?:\n|$)',
        r'(September|October|November|December|January|February|March|April|May|June|July|August)\s+\d{1,2},?\s+\d{4}',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'Sept?\s*\d{1,2},?\s*\d{4}'
    ]
    for pattern in date_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["due_date"]:
            date_str = match.group(1).strip()
            # Use the new date conversion function
            converted_date = convert_date_to_iso_format(date_str)
            if converted_date:
                extracted["due_date"] = converted_date
                break
    
    # Extract equipment items with enhanced parsing
    try:
        # Look for equipment section
        equipment_section = ""
        in_equipment = False
        
        for line in lines:
            if re.search(r'(BORROWED|EQUIPMENT|ITEMS?)', line, re.IGNORECASE):
                in_equipment = True
                continue
            elif re.search(r'(TERMS|TOTAL|SIGNATURE)', line, re.IGNORECASE):
                in_equipment = False
                break
            elif in_equipment:
                equipment_section += line + "\n"
        
        # Parse equipment items from the section
        if equipment_section:
            item_lines = [line.strip() for line in equipment_section.split('\n') if line.strip()]
            
            for line in item_lines:
                # Skip header lines
                if re.search(r'(Item|SKU|Unit|Value|Return|Date)', line, re.IGNORECASE) and not re.search(r'^\w+\s+[A-Z0-9-]+', line):
                    continue
                
                # Try to extract item info: Name SKU Qty Value (handle various formats)
                # Enhanced pattern to handle different formats and separators
                item_patterns = [
                    # Standard format: Name SKU Qty $Value $Total
                    r'^([A-Za-z\s]+?)\s+([A-Z0-9-]+)\s+(\d+)\s*[,]?\s*\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)',
                    # Alternative format: Name SKU Qty, $Value $Total
                    r'^([A-Za-z\s]+?)\s+([A-Z0-9-]+)\s+(\d+)\s*,\s*[«»]?\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)',
                    # Simplified format: Name SKU Qty Value
                    r'^([A-Za-z\s]+?)\s+([A-Z0-9-]+)\s+(\d+)\s*[,]?\s*[«»]?\$?([\d,]+\.?\d*)',
                    # Just name and SKU for basic extraction
                    r'^([A-Za-z\s]+?)\s+([A-Z0-9-]+)'
                ]
                
                item = None
                for pattern in item_patterns:
                    item_match = re.search(pattern, line)
                    if item_match:
                        groups = item_match.groups()
                        item = {
                            "name": groups[0].strip(),
                            "sku": groups[1],
                            "quantity": int(groups[2]) if len(groups) > 2 else 1,
                            "unit_value": float(groups[3].replace(',', '')) if len(groups) > 3 and groups[3] else 0.0,
                            "total_value": float(groups[4].replace(',', '')) if len(groups) > 4 and groups[4] else (float(groups[3].replace(',', '')) if len(groups) > 3 and groups[3] else 0.0)
                        }
                        break
                
                if item:
                    extracted["items"].append(item)
    except Exception as e:
        api_logger.warning(f"Failed to parse equipment items: {e}")
    
    # Calculate confidence score based on extracted fields
    confidence = 0
    if extracted["student_name"]: confidence += 20
    if extracted["student_id"]: confidence += 20
    if extracted["student_email"]: confidence += 15
    if extracted["department"]: confidence += 15
    if extracted["due_date"]: confidence += 15
    if extracted["invoice_number"]: confidence += 10
    if extracted["items"]: confidence += 5 * len(extracted["items"])
    
    extracted["confidence_score"] = min(confidence, 100)
    
    # Enhanced logging with data validation
    api_logger.info(f"✨ Enhanced parsing completed. Confidence: {extracted['confidence_score']}%")
    api_logger.info(f"📋 Extracted Data Summary:")
    api_logger.info(f"   👤 Name: '{extracted['student_name']}' (Length: {len(extracted['student_name'])})")
    api_logger.info(f"   🆔 ID: '{extracted['student_id']}' (Length: {len(extracted['student_id'])})")
    api_logger.info(f"   📧 Email: '{extracted['student_email']}' (Valid: {bool(extracted['student_email'])})")
    api_logger.info(f"   🏫 Department: '{extracted['department']}' (Length: {len(extracted['department'])})")
    api_logger.info(f"   📦 Items: {len(extracted['items'])} extracted")
    
    # Validation warnings
    if len(extracted['student_name']) < 3:
        api_logger.warning("⚠️  Student name seems too short")
    if len(extracted['student_id']) < 4:
        api_logger.warning("⚠️  Student ID seems invalid")
    if not extracted['student_email'] and extracted['confidence_score'] > 50:
        api_logger.warning("⚠️  No valid email found despite good OCR")
    
    return extracted

def calculate_confidence_score(extracted_data: dict) -> float:
    """
    Calculate confidence score based on extracted data completeness
    """
    fields = ["student_name", "student_id", "student_email", "department"]
    filled_fields = sum(1 for field in fields if extracted_data.get(field))
    return min(0.9, filled_fields / len(fields))
