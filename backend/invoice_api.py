"""
Invoice Management API Endpoints
Handles invoice creation, management, and camera upload functionality
"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import base64
import json
import os
import re
from pathlib import Path
import shutil

# OCR imports
try:
    import pytesseract
    from PIL import Image
    import cv2
    import numpy as np
    from dateutil import parser as date_parser
    
    # Configure Tesseract path for Windows
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    OCR_AVAILABLE = True
    print("OCR libraries loaded successfully")
except ImportError as e:
    OCR_AVAILABLE = False
    pytesseract = None
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
invoice_router = APIRouter(prefix="/invoices", tags=["invoices"])

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
    """Create a new invoice"""
    query = """
    INSERT INTO invoices (
        order_id, student_id, invoice_type, status, due_date, issued_by, notes
    ) VALUES (%s, %s, %s, 'issued', %s, %s, %s)
    RETURNING *
    """
    
    result = db.execute_query(
        query, 
        (
            invoice.order_id, invoice.student_id, invoice.invoice_type, 
            invoice.due_date, invoice.issued_by, invoice.notes
        )
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create invoice")
    
    # Get the first (and only) result
    created_invoice = result[0]
    
    # Update order total_items in invoice
    update_query = """
    UPDATE invoices SET total_items = (
        SELECT total_items FROM orders WHERE id = %s
    ) WHERE id = %s
    """
    db.execute_command(update_query, (invoice.order_id, created_invoice['id']))
    
    # Log the transaction
    log_invoice_transaction(db, created_invoice['id'], 'created', None, 'issued', invoice.issued_by, "Invoice created")
    
    return created_invoice

@invoice_router.get("/", response_model=List[InvoiceDetail])
async def get_invoices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    invoice_type: Optional[str] = None,
    student_id: Optional[str] = None,
    db: DatabaseManager = Depends(get_db)
):
    """Get all invoices with filtering options"""
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

@invoice_router.get("/{invoice_id}", response_model=InvoiceDetail)
async def get_invoice(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Get invoice by ID with all related data"""
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
    if not invoice_data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get the first result
    invoice_data = invoice_data[0]
    
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
    
    return result

@invoice_router.put("/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, invoice_update: InvoiceUpdate, db: DatabaseManager = Depends(get_db)):
    """Update invoice"""
    # Get current invoice for logging
    current_result = db.execute_query("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
    if not current_result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    current = current_result[0]
    
    # Build update query
    update_fields = []
    params = []
    
    if invoice_update.status is not None:
        update_fields.append("status = %s")
        params.append(invoice_update.status)
    
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
    
    if not update_fields:
        return current
    
    params.append(invoice_id)
    query = f"UPDATE invoices SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
    
    result = db.execute_query(query, params)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update invoice")
    
    updated_invoice = result[0]
    
    # Log the transaction
    if invoice_update.status and invoice_update.status != current['status']:
        log_invoice_transaction(
            db, invoice_id, 'modified', 
            current['status'], invoice_update.status, 
            'System', f"Status changed from {current['status']} to {invoice_update.status}"
        )
    
    return updated_invoice

@invoice_router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Delete invoice and all related data"""
    try:
        # Check if invoice exists
        existing_result = db.execute_query("SELECT id FROM invoices WHERE id = %s", (invoice_id,))
        if not existing_result:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get all associated images to delete files
        images_query = "SELECT image_url, image_filename FROM invoice_images WHERE invoice_id = %s"
        images_result = db.execute_query(images_query, (invoice_id,))
        
        # Delete database records (this will cascade to related tables)
        delete_query = "DELETE FROM invoices WHERE id = %s"
        
        if db.execute_command(delete_query, (invoice_id,)):
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
    """Extract text from image using OCR"""
    if not OCR_AVAILABLE:
        api_logger.warning("OCR libraries not available")
        return ""
    
    try:
        api_logger.info(f"Starting OCR processing for: {image_path}")
        
        # Check if file exists
        if not os.path.exists(image_path):
            api_logger.error(f"Image file not found: {image_path}")
            return ""
        
        # Load image
        try:
            image = Image.open(image_path)
            api_logger.info(f"Image loaded successfully: {image.size}, mode: {image.mode}")
        except Exception as e:
            api_logger.error(f"Failed to load image: {e}")
            return ""
        
        # Convert to OpenCV format for preprocessing
        try:
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            api_logger.info("Image converted to OpenCV format")
            
            # Preprocess image for better OCR
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            
            # Convert back to PIL Image
            pil_image = Image.fromarray(thresh)
            api_logger.info("Image preprocessing completed")
        except Exception as e:
            api_logger.warning(f"Image preprocessing failed, using original image: {e}")
            pil_image = image
        
        # Extract text using Tesseract with multiple configurations
        try:
            # Try different PSM modes for better text extraction
            configs = [
                '--psm 6',  # Single block
                '--psm 4',  # Single column
                '--psm 3',  # Fully automatic
                '--psm 1'   # Sparse text
            ]
            
            best_text = ""
            for config in configs:
                try:
                    text = pytesseract.image_to_string(pil_image, config=config)
                    if len(text.strip()) > len(best_text.strip()):
                        best_text = text
                        api_logger.info(f"Better OCR result with config: {config}, length: {len(text)}")
                except Exception as e:
                    api_logger.warning(f"OCR failed with config {config}: {e}")
                    continue
            
            # If no text extracted, try with original image
            if not best_text.strip():
                api_logger.info("Trying OCR with original image")
                best_text = pytesseract.image_to_string(image, config='--psm 6')
            
            api_logger.info(f"OCR completed. Extracted text length: {len(best_text)}")
            if best_text.strip():
                api_logger.debug(f"First 200 characters: {best_text[:200]}")
            
            return best_text.strip()
            
        except Exception as e:
            api_logger.error(f"Tesseract OCR failed: {e}")
            return ""
        
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
        r'ID[#:]?\s*([A-Z0-9]{5,10})'
    ]
    for pattern in student_id_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["student_id"]:
            extracted["student_id"] = match.group(1)
            break
    
    # Look for student name patterns
    name_patterns = [
        r'Student\s+Name[#:]?\s*([A-Za-z\s]+?)(?:Department|Email|\n)',
        r'Name[#:]?\s*([A-Za-z\s]+?)(?:Department|Email|\n)'
    ]
    for pattern in name_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["student_name"]:
            name = match.group(1).strip()
            if len(name) > 2:  # Valid name should be more than 2 characters
                extracted["student_name"] = name
                break
    
    # Look for email patterns
    email_match = re.search(r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', full_text)
    if email_match:
        extracted["student_email"] = email_match.group(1)
    
    # Look for department
    dept_patterns = [
        r'Department[#:]?\s*([A-Za-z\s]+?)(?:Email|Year|Due|\n)',
        r'Dept[#:]?\s*([A-Za-z\s]+?)(?:Email|Year|Due|\n)'
    ]
    for pattern in dept_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["department"]:
            dept = match.group(1).strip()
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
    
    api_logger.info(f"Enhanced parsing completed. Confidence: {extracted['confidence_score']}%")
    api_logger.info(f"Extracted: Name='{extracted['student_name']}', ID='{extracted['student_id']}', Email='{extracted['student_email']}', Dept='{extracted['department']}', Items={len(extracted['items'])}")
    
    return extracted

def calculate_confidence_score(extracted_data: dict) -> float:
    """
    Calculate confidence score based on extracted data completeness
    """
    fields = ["student_name", "student_id", "student_email", "department"]
    filled_fields = sum(1 for field in fields if extracted_data.get(field))
    return min(0.9, filled_fields / len(fields))
