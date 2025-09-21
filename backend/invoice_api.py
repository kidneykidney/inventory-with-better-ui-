"""
Invoice Management API Endpoints
Handles invoice creation, management, and camera upload functionality
"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Response, Request
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import base64
import json
import os
import re
import random
import io
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
    """Create a new invoice - now includes lender information from order"""
    
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
    
    # Get lender information from the order if order_id is provided
    lender_id = None
    issued_by_lender = None
    
    if invoice.order_id:
        order_query = """
        SELECT o.lender_id, l.name as lender_name 
        FROM orders o 
        LEFT JOIN lenders l ON o.lender_id = l.id 
        WHERE o.id = %s
        """
        order_result = db.execute_query(order_query, (invoice.order_id,))
        if order_result and order_result[0]['lender_id']:
            lender_id = order_result[0]['lender_id']
            issued_by_lender = order_result[0]['lender_id']  # Use ID, not name
    
    query = """
    INSERT INTO invoices (
        order_id, student_id, invoice_type, status, due_date, issued_by, notes, lender_id, issued_by_lender
    ) VALUES (%s, %s, %s, 'issued', %s, %s, %s, %s, %s)
    RETURNING *
    """
    
    result = db.execute_query(
        query, 
        (
            invoice.order_id, actual_student_id, invoice.invoice_type, 
            invoice.due_date, invoice.issued_by, invoice.notes, lender_id, issued_by_lender
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
        
        # Step 3: Get lender information - either from request or order
        lender_id = None
        issued_by_lender = None
        
        api_logger.info(f"=== DEBUGGING LENDER ASSIGNMENT ===")
        api_logger.info(f"request.lender_id: {getattr(request, 'lender_id', 'NOT SET')}")
        api_logger.info(f"request.issued_by: {getattr(request, 'issued_by', 'NOT SET')}")
        
        # First check if lender_id is provided directly in the request
        if hasattr(request, 'lender_id') and request.lender_id:
            # Validate that lender_id is a proper UUID, not a name
            import uuid
            try:
                # Try to parse as UUID to validate format
                uuid.UUID(request.lender_id)
                lender_id = request.lender_id
                issued_by_lender = request.lender_id
                api_logger.info(f"Valid lender_id provided: {lender_id}")
            except ValueError:
                # lender_id is not a valid UUID, might be a name - try to find by name
                api_logger.warning(f"Invalid lender_id format (not UUID): {request.lender_id}, attempting to find by name")
                lender_search_query = "SELECT id FROM lenders WHERE name ILIKE %s"
                lender_result = db.execute_query(lender_search_query, (f"%{request.lender_id}%",))
                if lender_result:
                    lender_id = lender_result[0]['id']
                    issued_by_lender = lender_result[0]['id']
                    api_logger.info(f"Found lender by name '{request.lender_id}': {lender_id}")
                else:
                    api_logger.error(f"Lender not found for name: {request.lender_id}")
                    raise HTTPException(status_code=400, detail=f"Invalid lender: {request.lender_id}")
        
        # Note: InvoiceCreateWithStudent doesn't have order_id, so this fallback is not applicable
        # This section is for the regular InvoiceCreate model which has order_id
        
        api_logger.info(f"FINAL VALUES BEFORE INSERT:")
        api_logger.info(f"lender_id: {lender_id}")
        api_logger.info(f"issued_by_lender: {issued_by_lender}")
        api_logger.info(f"=== END DEBUGGING ===")
        
        # Safety check: Ensure issued_by_lender is a valid UUID or None
        if issued_by_lender is not None:
            try:
                import uuid
                uuid.UUID(str(issued_by_lender))  # Validate UUID format
            except (ValueError, TypeError):
                api_logger.error(f"Invalid UUID for issued_by_lender: {issued_by_lender}, setting to None")
                issued_by_lender = None
        
        # Step 4: Create the invoice with lender information
        # Add debugging logs before database query
        api_logger.info(f"DEBUG - Before invoice creation:")
        api_logger.info(f"  lender_id: {lender_id} (type: {type(lender_id)})")
        api_logger.info(f"  issued_by_lender: {issued_by_lender} (type: {type(issued_by_lender)})")
        api_logger.info(f"  request.issued_by: {request.issued_by} (type: {type(request.issued_by)})")
        
        # Add fallback to prevent None values being passed to UUID fields
        if issued_by_lender is None:
            api_logger.warning("issued_by_lender is None, setting to NULL for database")
            issued_by_lender = None  # Keep as None for database NULL
        else:
            # Validate issued_by_lender is a UUID if not None
            try:
                import uuid
                uuid.UUID(str(issued_by_lender))
                api_logger.info(f"issued_by_lender UUID validation passed: {issued_by_lender}")
            except ValueError:
                api_logger.error(f"issued_by_lender is not a valid UUID: {issued_by_lender} (type: {type(issued_by_lender)})")
                raise HTTPException(status_code=400, detail=f"Invalid issued_by_lender UUID: {issued_by_lender}")
        
        if lender_id is None:
            api_logger.warning("lender_id is None, setting to NULL for database")
            lender_id = None  # Keep as None for database NULL
        else:
            # Validate lender_id is a UUID if not None
            try:
                import uuid
                uuid.UUID(str(lender_id))
                api_logger.info(f"lender_id UUID validation passed: {lender_id}")
            except ValueError:
                api_logger.error(f"lender_id is not a valid UUID: {lender_id} (type: {type(lender_id)})")
                raise HTTPException(status_code=400, detail=f"Invalid lender_id UUID: {lender_id}")
        
        invoice_query = """
        INSERT INTO invoices (
            student_id, invoice_type, status, due_date, issued_by, notes, lender_id, issued_by_lender, total_value
        ) VALUES (%s, %s, 'issued', %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        
        query_params = (actual_student_id, request.invoice_type, request.due_date, request.issued_by, request.notes, lender_id, issued_by_lender, request.amount or 0.0)
        api_logger.info(f"DEBUG - Query parameters: {query_params}")
        
        invoice_result = db.execute_query(invoice_query, query_params)
        
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
        
        return {
            "success": True,
            "message": "Invoice created successfully with student auto-creation",
            "invoice": created_invoice,
            "student": student_info[0] if student_info else None
        }
        
    except Exception as e:
        api_logger.error(f"Error creating invoice with student: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")

# New endpoint for creating invoice with automatic student creation and image storage
@invoice_router.post("/create-with-student-and-image")
async def create_invoice_with_student_and_image(
    request: Request,  # Add request to inspect raw form data
    student_name: str = Form(...),
    student_id: str = Form(None),
    student_email: str = Form(None),
    department: str = Form(None),
    year_of_study: int = Form(1),
    invoice_type: str = Form("lending"),
    due_date: str = Form(None),
    issued_by: str = Form("OCR System"),
    notes: str = Form(None),
    lender_name: str = Form(None),  # Added lender_name parameter for staff auto-creation
    ocr_confidence: float = Form(None),
    ocr_text: str = Form(None),
    file: UploadFile = File(None),
    db: DatabaseManager = Depends(get_db)
):
    """Create invoice with student auto-creation AND store the uploaded image"""
    import uuid
    import time
    from datetime import datetime
    from pathlib import Path
    
    try:
        # Debug: Try to inspect the raw request form data
        try:
            form_data = await request.form()
            api_logger.info(f"🔍 RAW FORM DATA KEYS: {list(form_data.keys())}")
            for key, value in form_data.items():
                if key != 'file':  # Don't log file content
                    api_logger.info(f"🔍 RAW FORM FIELD: {key} = '{value}' (type: {type(value)})")
        except Exception as e:
            api_logger.error(f"❌ Could not inspect raw form data: {e}")
        
        api_logger.info(f"=== Starting create_invoice_with_student_and_image for: {student_name} ===")
        api_logger.info(f"File received: {file.filename if file else 'No file'}")
        api_logger.info(f"🔍 DEBUG: lender_name parameter value: '{lender_name}' (type: {type(lender_name)})")
        api_logger.info(f"🔍 DEBUG: lender_name is None: {lender_name is None}")
        api_logger.info(f"🔍 DEBUG: lender_name is falsy: {not bool(lender_name)}")
        api_logger.info(f"🔍 DEBUG: lender_name stripped: '{(lender_name or '').strip()}'")
        api_logger.info(f"🔍 DEBUG: lender_name after strip is truthy: {bool((lender_name or '').strip())}")
        
        api_logger.info(f"Creating invoice with student auto-creation and image storage for: {student_name}")
        
        # Step 1: Check if student exists
        existing_student = None
        if student_id:
            existing_student = db.execute_query("SELECT * FROM students WHERE student_id = %s", (student_id,))
        
        if not existing_student and student_email:
            existing_student = db.execute_query("SELECT * FROM students WHERE email = %s", (student_email,))
        
        if not existing_student:
            existing_student = db.execute_query("SELECT * FROM students WHERE LOWER(name) = LOWER(%s)", (student_name,))
        
        # Step 2: Create student if doesn't exist
        if existing_student:
            api_logger.info(f"Found existing student: {existing_student[0]['student_id']}")
            actual_student_id = existing_student[0]['id']
        else:
            api_logger.info(f"Creating new student: {student_name}")
            
            # Generate student_id if not provided
            if not student_id:
                timestamp = str(int(time.time()))[-6:]
                student_id = f"STUD{timestamp}"
            
            # Generate email if not provided
            if not student_email:
                student_email = f"{student_id.lower()}@student.local"
            
            # Create new student
            student_uuid = str(uuid.uuid4())
            student_query = """
            INSERT INTO students (id, student_id, name, email, department, year_of_study)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """
            
            created_student = db.execute_query(
                student_query,
                (student_uuid, student_id, student_name, student_email, department or "General", year_of_study)
            )
            
            if not created_student:
                raise HTTPException(status_code=500, detail="Failed to create student")
            
            actual_student_id = student_uuid
            api_logger.info(f"Created new student with ID: {student_id}")
        
        # Step 2.5: Handle staff/lender auto-creation if lender_name is provided
        issued_by_lender = None
        lender_id = None
        
        # Normalize lender_name - handle None, empty string, or whitespace
        normalized_lender_name = (lender_name or '').strip()
        
        if normalized_lender_name:
            api_logger.info(f"👤 Processing lender name: '{normalized_lender_name}'")
            
            # Try to find existing lender
            lender_query = """
            SELECT id, name FROM lenders 
            WHERE LOWER(name) LIKE LOWER(%s)
            LIMIT 1
            """
            lender_result = db.execute_query(
                lender_query, 
                (f"%{normalized_lender_name}%",)
            )
            
            if lender_result:
                # Staff member found
                lender_id = lender_result[0]['id']
                issued_by_lender = lender_result[0]['id']
                api_logger.info(f"✅ Found existing staff: {lender_result[0]['name']} (ID: {lender_id})")
            else:
                # Staff member not found - create automatically
                try:
                    api_logger.info(f"🚫 Staff not found, creating new staff: '{normalized_lender_name}'")
                    
                    # Generate auto staff ID
                    import random
                    year = datetime.now().year
                    random_num = random.randint(1000, 9999)
                    auto_staff_id = f"STF{year}{random_num}"
                    api_logger.info(f"🔢 Generated staff ID: {auto_staff_id}")
                    
                    # Create new staff member with minimal information
                    new_staff_query = """
                    INSERT INTO lenders (
                        name, employee_id, department, designation, 
                        authority_level, can_approve_lending, can_lend_high_value
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, name, employee_id
                    """
                    
                    new_staff_params = (
                        normalized_lender_name,
                        auto_staff_id,
                        'Auto-Generated',  # Default department
                        'Staff',          # Default designation
                        'standard',       # Default authority level
                        True,            # Can approve lending
                        False            # Cannot lend high value items
                    )
                    
                    api_logger.info(f"🔄 Executing staff creation query with params: {new_staff_params}")
                    
                    new_staff_result = db.execute_query(
                        new_staff_query,
                        new_staff_params
                    )
                    
                    api_logger.info(f"📝 Staff creation result: {new_staff_result}")
                    
                    if new_staff_result:
                        lender_id = new_staff_result[0]['id']
                        issued_by_lender = new_staff_result[0]['id']
                        api_logger.info(f"✅ Auto-created staff: {lender_name} (ID: {lender_id}, Employee ID: {auto_staff_id})")
                    else:
                        api_logger.warning(f"⚠️ Failed to create staff member: {lender_name} - no result returned")
                        
                except Exception as create_error:
                    api_logger.error(f"❌ Error creating staff member {lender_name}: {create_error}")
                    import traceback
                    api_logger.error(f"❌ Traceback: {traceback.format_exc()}")
                    # Continue without staff assignment if creation fails
        else:
            api_logger.info("ℹ️ No lender_name provided, skipping staff processing")
        
        # Step 3: Create the invoice
        invoice_uuid = str(uuid.uuid4())
        
        # lender_id and issued_by_lender are now set above during staff processing
        
        invoice_query = """
        INSERT INTO invoices (
            id, student_id, invoice_type, status, due_date, issued_by, notes, lender_id, issued_by_lender
        ) VALUES (%s, %s, %s, 'issued', %s, %s, %s, %s, %s)
        RETURNING *
        """
        
        # Parse due_date if provided
        parsed_due_date = None
        if due_date:
            try:
                from datetime import datetime
                parsed_due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            except:
                parsed_due_date = None
        
        invoice_result = db.execute_query(
            invoice_query, 
            (invoice_uuid, actual_student_id, invoice_type, parsed_due_date, issued_by, notes, lender_id, issued_by_lender)
        )
        
        if not invoice_result:
            raise HTTPException(status_code=500, detail="Failed to create invoice")
        
        created_invoice = invoice_result[0]
        
        # Step 4: Store the image if provided
        image_stored = False
        image_info = None
        
        api_logger.info(f"Image storage check - file: {file}, filename: {file.filename if file else 'None'}")
        
        if file and file.filename:
            try:
                # Create permanent storage directory
                upload_dir = Path("uploads/invoices")
                upload_dir.mkdir(parents=True, exist_ok=True)
                
                # Generate unique filename
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                file_extension = Path(file.filename).suffix.lower() or '.jpg'
                permanent_filename = f"bulk_{timestamp}_{uuid.uuid4().hex[:8]}{file_extension}"
                permanent_file_path = upload_dir / permanent_filename
                
                # Save the file
                file_content = await file.read()
                api_logger.info(f"File content length: {len(file_content)} bytes")
                with open(permanent_file_path, "wb") as f:
                    f.write(file_content)
                
                # Store in database
                image_id = str(uuid.uuid4())
                insert_query = """
                INSERT INTO invoice_images (
                    id, invoice_id, image_type, image_url, image_filename, 
                    image_size, image_format, uploaded_by, upload_method,
                    capture_timestamp, processing_status, ocr_text, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                confidence_note = f"Bulk upload with OCR confidence: {ocr_confidence*100:.1f}%" if ocr_confidence else "Bulk upload"
                
                db.execute_command(
                    insert_query,
                    (
                        image_id,
                        invoice_uuid,
                        'bulk_upload',
                        f"uploads/invoices/{permanent_filename}",
                        file.filename,
                        len(file_content),
                        file_extension.lstrip('.'),
                        'Bulk Upload System',
                        'bulk_upload',
                        datetime.now(),
                        'completed',
                        ocr_text[:2000] if ocr_text else None,
                        confidence_note
                    )
                )
                
                image_stored = True
                image_info = {
                    "id": image_id,
                    "filename": file.filename,
                    "url": f"uploads/invoices/{permanent_filename}"
                }
                api_logger.info(f"Successfully stored image {image_id} for invoice {invoice_uuid}")
                
            except Exception as e:
                api_logger.error(f"Failed to store image: {e}")
                import traceback
                api_logger.error(f"Stack trace: {traceback.format_exc()}")
                # Continue without failing the invoice creation
        
        # Log the transaction
        log_invoice_transaction(
            db, created_invoice['id'], 'created', None, 'issued', 
            issued_by, f"Invoice created via bulk upload for {student_name}"
        )
        
        # Get student info for response
        student_info = db.execute_query("SELECT * FROM students WHERE id = %s", (actual_student_id,))
        
        api_logger.info(f"Successfully created invoice {created_invoice['id']} for student {student_name}")
        
        # Return comprehensive response
        return {
            "invoice": created_invoice,
            "student": student_info[0] if student_info else None,
            "image_stored": image_stored,
            "image_info": image_info,
            "message": "Invoice created successfully with bulk upload"
        }
        
    except Exception as e:
        api_logger.error(f"Error creating invoice with student and image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")
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
        l.name as lender_name,
        l.email as lender_email,
        l.department as lender_department,
        l.designation as lender_designation,
        l2.name as issued_by_lender_name,
        (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as item_count,
        (SELECT COUNT(*) FROM invoice_images img WHERE img.invoice_id = i.id) as image_count,
        (SELECT COUNT(*) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) as acknowledgment_count,
        (SELECT MAX(acknowledged_at) FROM student_acknowledgments sa WHERE sa.invoice_id = i.id) as latest_acknowledgment
    FROM invoices i
    LEFT JOIN orders o ON i.order_id = o.id
    LEFT JOIN students s ON i.student_id = s.id
    LEFT JOIN lenders l ON i.lender_id = l.id
    LEFT JOIN lenders l2 ON i.issued_by_lender = l2.id
    {where_clause}
    ORDER BY i.created_at DESC
    OFFSET %s LIMIT %s
    """
    
    params.extend([skip, limit])
    return db.execute_query(query, tuple(params))

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
            s.year_of_study,
            l.name as lender_name,
            l.email as lender_email,
            l.department as lender_department,
            l.designation as lender_designation,
            l2.name as issued_by_lender_name
        FROM invoices i
        LEFT JOIN orders o ON i.order_id = o.id
        LEFT JOIN students s ON i.student_id = s.id
        LEFT JOIN lenders l ON i.lender_id = l.id
        LEFT JOIN lenders l2 ON i.issued_by_lender = l2.id
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
        
        if invoice_update.lender_id is not None:
            update_fields.append("lender_id = %s")
            params.append(invoice_update.lender_id)
        
        if invoice_update.issued_by_lender is not None:
            update_fields.append("issued_by_lender = %s")
            params.append(invoice_update.issued_by_lender)
        
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
        
        result = db.execute_query(query, tuple(params))
        
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
        if not file.filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
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

@invoice_router.get("/{invoice_id}/images")
async def get_invoice_images(invoice_id: str, db: DatabaseManager = Depends(get_db)):
    """Get all images for an invoice - returns real data from database"""
    try:
        api_logger.info(f"Fetching images for invoice: {invoice_id}")
        
        # Query the database for real images
        query = """
        SELECT 
            id, invoice_id, image_type, image_url, image_filename, 
            image_size, image_format, uploaded_by, upload_method,
            device_info, capture_timestamp, processing_status, 
            ocr_text, notes, created_at
        FROM invoice_images 
        WHERE invoice_id = %s 
        ORDER BY created_at DESC
        """
        
        result = db.execute_query(query, (invoice_id,))
        api_logger.info(f"Found {len(result) if result else 0} images for invoice {invoice_id}")
        
        if result:
            # Convert result to list of dictionaries
            images = []
            for row in result:
                image_dict = dict(row)
                # Convert datetime objects to strings for JSON serialization
                if image_dict.get('capture_timestamp'):
                    image_dict['capture_timestamp'] = image_dict['capture_timestamp'].isoformat()
                if image_dict.get('created_at'):
                    image_dict['created_at'] = image_dict['created_at'].isoformat()
                images.append(image_dict)
            
            return {"success": True, "images": images, "count": len(images)}
        else:
            api_logger.info(f"No images found for invoice {invoice_id}")
            return {"success": True, "images": [], "count": 0, "message": "No images found for this invoice"}
        
    except Exception as e:
        api_logger.error(f"Error fetching images for invoice {invoice_id}: {str(e)}")
        return {"success": False, "images": [], "error": str(e), "count": 0}

@invoice_router.options("/{invoice_id}/images")
async def options_invoice_images(invoice_id: str):
    """Handle preflight requests for invoice images"""
    return {"message": "OK"}

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
    invoice_id: str = Form(None),
    auto_create_invoice: bool = Form(True),
    db: DatabaseManager = Depends(get_db)
):
    """Process uploaded invoice image with OCR to extract data and store image"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
            raise HTTPException(status_code=400, detail="Only image and PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Create permanent storage directory
        upload_dir = Path("uploads/invoices")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename for permanent storage
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix.lower() if file.filename else '.jpg'
        permanent_filename = f"ocr_{timestamp}_{uuid.uuid4().hex[:8]}{file_extension}"
        permanent_file_path = upload_dir / permanent_filename
        
        # Save permanent file
        with open(permanent_file_path, "wb") as f:
            f.write(file_content)
        
        api_logger.info(f"Saved permanent file: {permanent_file_path}")
        
        # Create temporary file for OCR processing
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Use the existing OCR system to extract text
            api_logger.info(f"OCR_AVAILABLE: {OCR_AVAILABLE}, CV2_AVAILABLE: {CV2_AVAILABLE}")
            
            extracted_data = {}
            ocr_text = ""
            
            if OCR_AVAILABLE:
                try:
                    api_logger.info(f"Processing {file.filename} with OCR from path: {temp_file_path}")
                    ocr_text = extract_text_from_image(temp_file_path)
                    api_logger.info(f"OCR extracted text length: {len(ocr_text) if ocr_text else 0}")
                    
                    if ocr_text and len(ocr_text.strip()) > 10:
                        # Use our enhanced parse_text_simple function for comprehensive extraction
                        try:
                            extracted_data = parse_text_simple(ocr_text)
                            confidence_score = min(extracted_data.get('confidence_score', 95), 95) / 100.0
                            api_logger.info(f"✅ Data extraction successful with confidence: {confidence_score}")
                        except Exception as parse_error:
                            api_logger.error(f"❌ Error in parse_text_simple: {parse_error}")
                            # Fallback to basic extraction
                            try:
                                api_logger.info("🔄 Trying fallback parser...")
                                extracted_data = parse_text_simple_fallback(ocr_text)
                                confidence_score = extracted_data.get('confidence_score', 30) / 100.0
                                api_logger.info(f"✅ Fallback parser successful")
                            except Exception as fallback_error:
                                api_logger.error(f"❌ Even fallback parser failed: {fallback_error}")
                                extracted_data = {
                                    "student_name": "",
                                    "student_id": "",
                                    "student_email": "",
                                    "department": "",
                                    "due_date": "",
                                    "items": [],
                                    "confidence_score": 0
                                }
                                confidence_score = 0.0
                    else:
                        api_logger.warning("⚠️ OCR text too short or empty")
                        confidence_score = 0.0
                except Exception as ocr_error:
                    api_logger.error(f"❌ OCR processing failed: {ocr_error}")
                    confidence_score = 0.0
            else:
                api_logger.warning("⚠️ OCR not available")
                confidence_score = 0.0
            
            # Determine invoice ID for image storage
            target_invoice_id = invoice_id
            
            # Auto-create invoice if requested and student info is available
            if auto_create_invoice and extracted_data.get('student_name'):
                try:
                    # Check if student exists
                    student_query = """
                    SELECT id FROM students 
                    WHERE student_id = %s OR LOWER(name) = LOWER(%s) 
                    LIMIT 1
                    """
                    student_result = db.execute_query(
                        student_query,
                        (extracted_data.get('student_id', ''), extracted_data.get('student_name', ''))
                    )
                    
                    # Initialize student_id variable
                    student_id = None
                    
                    # Log what was extracted for debugging
                    api_logger.info(f"🔍 OCR Extracted Data: {json.dumps(extracted_data, indent=2)}")
                    
                    if student_result:
                        student_id = student_result[0]['id']
                        api_logger.info(f"✅ Found existing student: {student_result[0]['id']}")
                    else:
                        # Student not found - create automatically like we do for staff
                        try:
                            api_logger.info(f"🚫 Student not found, creating new student: '{extracted_data.get('student_name')}'")
                            
                            # Generate auto student ID
                            import random
                            year = datetime.now().year
                            random_num = random.randint(1000, 9999)
                            auto_student_id = f"STU{year}{random_num}"
                            api_logger.info(f"🔢 Generated student ID: {auto_student_id}")
                            
                            # Create new student with extracted information
                            student_uuid = str(uuid.uuid4())
                            new_student_query = """
                            INSERT INTO students (
                                id, student_id, name, email, department, year_of_study
                            ) VALUES (%s, %s, %s, %s, %s, %s)
                            RETURNING id, name, student_id
                            """
                            
                            new_student_params = (
                                student_uuid,
                                extracted_data.get('student_id') or auto_student_id,  # Use extracted ID or generate one
                                extracted_data.get('student_name'),
                                extracted_data.get('student_email', ''),  # Email might be empty
                                extracted_data.get('department', 'Auto-Generated'),  # Default department
                                1  # Default year
                            )
                            
                            api_logger.info(f"🔄 Executing student creation query with params: {new_student_params}")
                            
                            new_student_result = db.execute_query(
                                new_student_query,
                                new_student_params
                            )
                            
                            api_logger.info(f"📝 Student creation result: {new_student_result}")
                            
                            if new_student_result:
                                student_id = new_student_result[0]['id']
                                api_logger.info(f"✅ Auto-created student: {extracted_data.get('student_name')} (ID: {student_id})")
                            else:
                                api_logger.warning(f"⚠️ Failed to create student: {extracted_data.get('student_name')} - no result returned")
                                return  # Can't continue without student
                                
                        except Exception as create_error:
                            api_logger.error(f"❌ Error creating student {extracted_data.get('student_name')}: {create_error}")
                            import traceback
                            api_logger.error(f"❌ Traceback: {traceback.format_exc()}")
                            return  # Can't continue without student
                        
                        # Try to find lender in database if name was extracted
                        lender_id = None
                        issued_by_lender = None
                        if extracted_data.get('lender_name'):
                            lender_name = extracted_data['lender_name'].strip()
                            api_logger.info(f"👤 Looking for staff/lender: '{lender_name}'")
                            
                            lender_query = """
                            SELECT id, name FROM lenders 
                            WHERE LOWER(name) LIKE LOWER(%s)
                            LIMIT 1
                            """
                            lender_result = db.execute_query(
                                lender_query, 
                                (f"%{lender_name}%",)
                            )
                            api_logger.info(f"🔍 Lender search query result: {lender_result}")
                            
                            if lender_result:
                                # Staff member found
                                lender_id = lender_result[0]['id']
                                issued_by_lender = lender_result[0]['id']
                                api_logger.info(f"Found existing staff: {lender_result[0]['name']} (ID: {lender_id})")
                            else:
                                # Staff member not found - create automatically
                                try:
                                    api_logger.info(f"🚫 Staff not found, creating new staff: '{lender_name}'")
                                    
                                    # Generate auto staff ID
                                    import random
                                    year = datetime.now().year
                                    random_num = random.randint(1000, 9999)
                                    auto_staff_id = f"STF{year}{random_num}"
                                    api_logger.info(f"🔢 Generated staff ID: {auto_staff_id}")
                                    
                                    # Create new staff member with minimal information
                                    new_staff_query = """
                                    INSERT INTO lenders (
                                        name, employee_id, department, designation, 
                                        authority_level, can_approve_lending, can_lend_high_value
                                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                                    RETURNING id, name, employee_id
                                    """
                                    
                                    new_staff_params = (
                                        lender_name,
                                        auto_staff_id,
                                        'Auto-Generated',  # Default department
                                        'Staff',          # Default designation
                                        'standard',       # Default authority level
                                        True,            # Can approve lending
                                        False            # Cannot lend high value items
                                    )
                                    
                                    api_logger.info(f"🔄 Executing staff creation query with params: {new_staff_params}")
                                    
                                    new_staff_result = db.execute_query(
                                        new_staff_query,
                                        new_staff_params
                                    )
                                    
                                    api_logger.info(f"📝 Staff creation result: {new_staff_result}")
                                    
                                    if new_staff_result:
                                        lender_id = new_staff_result[0]['id']
                                        issued_by_lender = new_staff_result[0]['id']
                                        api_logger.info(f"✅ Auto-created staff: {lender_name} (ID: {lender_id}, Employee ID: {auto_staff_id})")
                                    else:
                                        api_logger.warning(f"⚠️ Failed to create staff member: {lender_name} - no result returned")
                                        
                                except Exception as create_error:
                                    api_logger.error(f"❌ Error creating staff member {lender_name}: {create_error}")
                                    import traceback
                                    api_logger.error(f"❌ Traceback: {traceback.format_exc()}")
                                    # Continue without staff assignment if creation fails
                        else:
                            api_logger.info(f"ℹ️ No lender_name found in extracted data")
                        invoice_uuid = str(uuid.uuid4())
                        invoice_query = """
                        INSERT INTO invoices (
                            id, student_id, invoice_type, status, due_date, issued_by, notes, lender_id, issued_by_lender
                        ) VALUES (%s, %s, %s, 'issued', %s, %s, %s, %s, %s)
                        RETURNING id, invoice_number
                        """
                        
                        invoice_result = db.execute_query(
                            invoice_query,
                            (
                                invoice_uuid,
                                student_id,
                                'lending',
                                extracted_data.get('due_date') or None,
                                'OCR System',
                                f"Auto-created from OCR processing. Original file: {file.filename}",
                                lender_id,
                                issued_by_lender
                            )
                        )
                        
                        if invoice_result:
                            target_invoice_id = invoice_uuid
                            api_logger.info(f"Auto-created invoice {invoice_uuid} for {extracted_data.get('student_name')}")
                        
                except Exception as e:
                    api_logger.warning(f"Invoice auto-creation failed: {e}")
            
            # Store image in database if we have an invoice ID
            image_stored = False
            image_id = None
            
            if target_invoice_id:
                try:
                    image_id = str(uuid.uuid4())
                    insert_query = """
                    INSERT INTO invoice_images (
                        id, invoice_id, image_type, image_url, image_filename, 
                        image_size, image_format, uploaded_by, upload_method,
                        capture_timestamp, processing_status, ocr_text, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    # Get file size
                    file_size = len(file_content)
                    
                    db.execute_command(
                        insert_query,
                        (
                            image_id,
                            target_invoice_id,
                            'ocr_processed',
                            f"uploads/invoices/{permanent_filename}",
                            file.filename or permanent_filename,
                            file_size,
                            file_extension.lstrip('.'),
                            'OCR System',
                            'ocr_upload',
                            datetime.now(),
                            'completed',
                            ocr_text[:2000] if ocr_text else None,  # Limit OCR text length
                            f"OCR processed with confidence: {confidence_score*100:.1f}%"
                        )
                    )
                    
                    image_stored = True
                    api_logger.info(f"Stored image {image_id} for invoice {target_invoice_id}")
                    
                except Exception as e:
                    api_logger.error(f"Failed to store image in database: {e}")
            
            # Build result
            result = {
                "success": True,
                "extracted_data": extracted_data,
                "confidence_score": confidence_score,
                "raw_text": ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text,
                "processing_method": "tesseract_ocr",
                "parse_method": "enhanced_parse_text_simple",
                "image_stored": image_stored,
                "image_id": image_id,
                "invoice_id": target_invoice_id,
                "image_url": f"uploads/invoices/{permanent_filename}"
            }
            
            if not OCR_AVAILABLE:
                result.update({
                    "success": False,
                    "error": "OCR system not available. Please ensure Tesseract is installed."
                })
            elif not ocr_text or len(ocr_text.strip()) <= 10:
                result.update({
                    "success": False,
                    "error": "No readable text found in image"
                })
            
            return result
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
    except Exception as e:
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
                due_date, issued_by, notes, lender_id, issued_by_lender
            ) VALUES (%s, %s, 'lending', 'issued', %s, %s, %s, %s, %s, %s)
            RETURNING *
            """
            
            invoice_result = db.execute_query(
                invoice_query,
                (
                    order_id, order_data['student_id'], order_data['total_items'],
                    order_data['expected_return_date'], bulk_request.issued_by, bulk_request.notes,
                    order_data.get('lender_id'), order_data.get('lender_name')
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
            # Check if file is a PDF and handle accordingly
            if image_path.lower().endswith('.pdf'):
                api_logger.info("Processing PDF file - converting to image")
                try:
                    import fitz  # PyMuPDF
                    # Open PDF and convert first page to image
                    doc = fitz.open(image_path)
                    page = doc[0]
                    
                    # Convert to high-res image
                    mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
                    pix = page.get_pixmap(matrix=mat)
                    
                    # Convert to PIL Image
                    img_data = pix.tobytes("ppm")
                    image = Image.open(io.BytesIO(img_data))
                    
                    doc.close()
                    api_logger.info(f"PDF converted to image: {image.size}")
                    
                except ImportError:
                    api_logger.error("PyMuPDF not available for PDF processing")
                    return ""
                except Exception as pdf_error:
                    api_logger.error(f"Failed to process PDF: {pdf_error}")
                    return ""
            else:
                # Handle regular image files
                image = Image.open(image_path)
            
            # Limit image size to reduce memory usage
            max_dimension = 2000
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                # Use LANCZOS for newer PIL versions, fallback to ANTIALIAS for older
                try:
                    image = image.resize(new_size, Image.LANCZOS)
                except AttributeError:
                    image = image.resize(new_size, Image.ANTIALIAS)
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
        
        # Extract lender/staff information
        for line in text_lines:
            # Look for staff/lender name patterns
            staff_patterns = [
                r'(?:issued\s*by|lender|staff|teacher|instructor)[\s:]*([A-Za-z\s]{3,30})',
                r'(?:approved\s*by|authorized\s*by)[\s:]*([A-Za-z\s]{3,30})',
                r'(?:lending\s*staff|responsible\s*person)[\s:]*([A-Za-z\s]{3,30})'
            ]
            for pattern in staff_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    staff_name = match.group(1).strip()
                    if len(staff_name) >= 3 and not any(char.isdigit() for char in staff_name):
                        info['lender_name'] = staff_name
                        break
            if 'lender_name' in info:
                break
        
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
            db.execute_command(query, tuple(params))
            
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
    api_logger.info(f"🔍 DEBUG: /ocr/extract endpoint called with processing ID: {processing_id}")
    api_logger.info(f"🔍 DEBUG: extract_data parameter: {extract_data}")
    api_logger.info(f"🔍 DEBUG: file: {file.filename if file else 'None'}")
    
    try:
        if not OCR_AVAILABLE:
            raise HTTPException(
                status_code=503, 
                detail="OCR functionality not available - missing required libraries"
            )
        
        # Validate file
        if file.content_type and not (file.content_type.startswith('image/') or file.content_type == 'application/pdf'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image or PDF.")
        
        # Save temporary file with unique name to prevent caching
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        
        file_suffix = Path(file.filename).suffix if file.filename else ".tmp"
        temp_file_path = temp_dir / f"{processing_id}_{uuid.uuid4()}{file_suffix}"
        
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
                api_logger.info(f"🔍 DEBUG: Final extracted_data being returned: {json.dumps(extracted_data, indent=2)}")
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
    - "2025-09-30" (already ISO)
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
        
        # Check if already in YYYY-MM-DD format
        iso_match = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})$', cleaned)
        if iso_match:
            year, month, day = iso_match.groups()
            year, month, day = int(year), int(month), int(day)
            # Validate the date components
            if 1 <= month <= 12 and 1 <= day <= 31 and year >= 1900:
                return f"{year:04d}-{month:02d}-{day:02d}"
        
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

def preprocess_ocr_text(text):
    """
    Preprocess OCR text to improve extraction accuracy
    """
    # Fix common OCR errors for numbers
    text = re.sub(r'QTY:\s*I\b', 'QTY: 1', text)  # Fix QTY: I -> QTY: 1
    text = re.sub(r'QTY:\s*l\b', 'QTY: 1', text)  # Fix QTY: l -> QTY: 1
    text = re.sub(r'QTY\s*I\b', 'QTY 1', text)    # Fix QTY I -> QTY 1
    text = re.sub(r'QTY\s*l\b', 'QTY 1', text)    # Fix QTY l -> QTY 1
    
    # Fix other common OCR errors
    text = re.sub(r'\b0(?=[A-Z])', 'O', text)  # Replace 0 with O before uppercase letters
    
    # DON'T collapse multiple spaces entirely - preserve some structure
    # Clean up excessive spacing but preserve line breaks
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces/tabs to single space
    text = re.sub(r'\n\s*\n', '\n', text)  # Multiple newlines to single
    
    # Fix common field separators
    text = re.sub(r'[:|;]\s*', ': ', text)  # Standardize colons
    text = re.sub(r'\s*\|\s*', ' | ', text)  # Standardize pipes
    
    return text

def parse_text_simple(text: str) -> dict:
    """
    Enhanced text parsing to extract comprehensive lending invoice fields
    """
    # Preprocess text for better extraction
    text = preprocess_ocr_text(text)
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    extracted = {
        # Basic student information
        "student_name": "",
        "student_id": "",
        "student_email": "",
        "department": "",
        "borrower_phone": "",
        "borrower_address": "",
        
        # Lending information (for frontend compatibility)
        "lender_name": "",
        "lending_date": "",
        "lending_time": "",
        "invoice_type": "lending",  # Default to lending type
        
        # Emergency contact
        "emergency_contact_name": "",
        "emergency_contact_phone": "",
        
        # Lending purpose and context
        "lending_purpose": "",
        "lending_location": "",
        "project_name": "",
        
        # Additional fields needed for logging and functionality
        "issued_by": "",
        "due_date": "",
        "supervisor_name": "",
        "supervisor_email": "",
        "invoice_number": "",
        "notes": "",
        "items": [],
        "confidence_score": 0
    }
    
    # Create a clean version for better pattern matching
    full_text = text
    api_logger.info(f"📄 Processing text length: {len(text)} characters")
    
    # Enhanced patterns to look for
    import re
    
    full_text = ' '.join(lines)
    
    # Look for invoice number patterns
    invoice_patterns = [
        r'Invoice\s*[#:]?\s*([A-Z0-9-]+)',
        r'INV[#:-]?\s*([A-Z0-9-]+)',
        r'Invoice\s+Number[#:]?\s*([A-Z0-9-]+)',
        r'Lending\s+Agreement[#:]?\s*([A-Z0-9-]+)'
    ]
    for pattern in invoice_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["invoice_number"]:
            extracted["invoice_number"] = match.group(1)
            break
    
    # Look for student ID patterns (more flexible, including hyphenated IDs)
    student_id_patterns = [
        r'Student\s+ID[#:]?\s*([A-Z0-9\-]+)',
        r'STU[#\-]?\s*([A-Z0-9\-]+)',
        r'ID[#:]?\s*([A-Z0-9\-]{5,15})',
        r'Student\s+ID[#:]?\s*([A-Z0-9]+)',
        r'STUD([0-9]{6,8})',
        r'Borrower\s+ID[#:]?\s*([A-Z0-9\-]+)',
        # Extract from email patterns
        r'([a-z]+\.[a-z]+)@[a-z0-9.-]+\.(?:edu|ac\.uk|university)',
        r'([A-Z]{3}\d{4,8})',  # Match patterns like STU2023078
        # More flexible ID patterns
        r'(?:^|\s)([A-Z]{2,4}\d{4,8})(?:\s|$)',
    ]
    for pattern in student_id_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["student_id"]:
            student_id = clean_extracted_text(match.group(1), "student_id")
            if len(student_id) >= 4:
                extracted["student_id"] = student_id
                break
    
    # Look for student name patterns (enhanced with more flexible matching)
    name_patterns = [
        r'(?:Full\s+Name|Student\s+Name|Name|Borrower)[:\s]*([A-Za-z][A-Za-z\s]{2,30}?)(?:\s*\n|\s*Student\s+ID|\s*Email|\s*Department|\s*Phone|$)',
        r'Name[:\s]+([A-Za-z][A-Za-z\s]{2,30})',
        r'([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:STU|ID|Email|Department)',
        r'Student[:\s]+([A-Za-z][A-Za-z\s]{2,30}?)(?:\s|$)',
        # Handle cases where the name appears before other fields
        r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$',
    ]
    for i, pattern in enumerate(name_patterns):
        match = re.search(pattern, full_text, re.IGNORECASE | re.MULTILINE)
        if match and not extracted["student_name"]:
            name = clean_extracted_text(match.group(1), "name")
            if len(name) > 2 and not any(char.isdigit() for char in name):
                extracted["student_name"] = name
                api_logger.info(f"👤 Extracted student name with pattern {i+1}: {name}")
                break
    
    # Look for lender/staff information patterns (enhanced for titles like Dr., Prof., etc.)
    lender_patterns = [
        r'Issued\s+by\s+Staff[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',  # "Issued by Staff: Dr. Sarah Johnson"
        r'Issued\s+by[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Lender[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Staff[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Teacher[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Instructor[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Approved\s+by[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Authorized\s+by[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Lending\s+Staff[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Responsible\s+Person[#:]?\s*([A-Za-z\s\.]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Department|\n|$)',
        r'Dr\.\s+([A-Za-z\s]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Staff\s+ID|\s*Employee\s+ID|\s*Department|\n|$)',  # Match "Dr. Sarah Johnson"
        r'Prof\.\s+([A-Za-z\s]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Staff\s+ID|\s*Employee\s+ID|\s*Department|\n|$)',  # Match "Prof. John Smith"
        r'Mr\.\s+([A-Za-z\s]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Staff\s+ID|\s*Employee\s+ID|\s*Department|\n|$)',   # Match "Mr. David Brown"
        r'Ms\.\s+([A-Za-z\s]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Staff\s+ID|\s*Employee\s+ID|\s*Department|\n|$)',   # Match "Ms. Jane Doe"
        r'Mrs\.\s+([A-Za-z\s]+?)(?:\s*Lending|\s*Date|\s*Phone|\s*Email|\s*Staff\s+ID|\s*Employee\s+ID|\s*Department|\n|$)'   # Match "Mrs. Mary White"
    ]
    for i, pattern in enumerate(lender_patterns):
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["lender_name"]:
            lender_name = clean_extracted_text(match.group(1), "name")
            if len(lender_name) >= 3 and not any(char.isdigit() for char in lender_name):
                extracted["lender_name"] = lender_name
                extracted["issued_by"] = lender_name  # Map to issued_by for consistency
                api_logger.info(f"👥 Extracted lender name with pattern {i+1}: {lender_name}")
                break

    # Look for email patterns (enhanced for @ symbols)
    email_patterns = [
        r'Email[#:]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
        r'@\s*Email[#:]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
        r'[@]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
        r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
    ]
    for i, pattern in enumerate(email_patterns):
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["student_email"]:
            email = match.group(1).strip()
            if email and '@' in email and '.' in email:
                extracted["student_email"] = email
                api_logger.info(f"📧 Extracted email with pattern {i+1}: {email}")
                break
        elif match:
            api_logger.info(f"📧 Pattern {i+1} found email but field already filled: {match.group(1)}")
    
    # Look for phone patterns
    phone_patterns = [
        r'Phone[#:]?\s*([+]?[\d\s\-\(\)]{10,15})',
        r'Mobile[#:]?\s*([+]?[\d\s\-\(\)]{10,15})',
        r'Contact[#:]?\s*([+]?[\d\s\-\(\)]{10,15})'
    ]
    for pattern in phone_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["borrower_phone"]:
            phone = clean_extracted_text(match.group(1), "phone")
            if len(phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) >= 10:
                extracted["borrower_phone"] = phone
                break
    
    # Look for department
    dept_patterns = [
        r'Department[#:]?\s*([A-Za-z\s&]+?)(?:Email|Year|Due|Phone|Project|\n)',
        r'Dept[#:]?\s*([A-Za-z\s&]+?)(?:Email|Year|Due|Phone|Project|\n)',
        r'Faculty[#:]?\s*([A-Za-z\s&]+?)(?:Email|Year|Due|Phone|Project|\n)'
    ]
    for pattern in dept_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["department"]:
            dept = clean_extracted_text(match.group(1), "department")
            if len(dept) > 2:
                extracted["department"] = dept
                break
    
    # Look for project information
    project_patterns = [
        r'Project[#:]?\s*([A-Za-z0-9\s]+?)(?:Supervisor|Due|Location|Purpose|\n)',
        r'Assignment[#:]?\s*([A-Za-z0-9\s]+?)(?:Supervisor|Due|Location|Purpose|\n)',
        r'Course[#:]?\s*([A-Za-z0-9\s]+?)(?:Supervisor|Due|Location|Purpose|\n)'
    ]
    for pattern in project_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["project_name"]:
            project = clean_extracted_text(match.group(1), "project")
            if len(project) > 2:
                extracted["project_name"] = project
                break
    
    # Look for supervisor information
    supervisor_patterns = [
        r'Supervisor[#:]?\s*([A-Za-z\s]+?)(?:Email|Department|Project|Due|\n)',
        r'Instructor[#:]?\s*([A-Za-z\s]+?)(?:Email|Department|Project|Due|\n)',
        r'Professor[#:]?\s*([A-Za-z\s]+?)(?:Email|Department|Project|Due|\n)'
    ]
    for pattern in supervisor_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["supervisor_name"]:
            supervisor = clean_extracted_text(match.group(1), "name")
            if len(supervisor) > 2:
                extracted["supervisor_name"] = supervisor
                break
    
    # Look for lending purpose
    purpose_patterns = [
        r'Purpose[#:]?\s*([A-Za-z0-9\s,.-]+?)(?:Location|Due|Project|Supervisor|\n)',
        r'Reason[#:]?\s*([A-Za-z0-9\s,.-]+?)(?:Location|Due|Project|Supervisor|\n)',
        r'Use\s+for[#:]?\s*([A-Za-z0-9\s,.-]+?)(?:Location|Due|Project|Supervisor|\n)'
    ]
    for pattern in purpose_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["lending_purpose"]:
            purpose = clean_extracted_text(match.group(1), "purpose")
            if len(purpose) > 5:
                extracted["lending_purpose"] = purpose
                break
    
    # Look for location information
    location_patterns = [
        r'Location[#:]?\s*([A-Za-z0-9\s,.-]+?)(?:Purpose|Due|Project|Supervisor|\n)',
        r'Lab[#:]?\s*([A-Za-z0-9\s,.-]+?)(?:Purpose|Due|Project|Supervisor|\n)',
        r'Room[#:]?\s*([A-Za-z0-9\s,.-]+?)(?:Purpose|Due|Project|Supervisor|\n)'
    ]
    for pattern in location_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["lending_location"]:
            location = clean_extracted_text(match.group(1), "location")
            if len(location) > 2:
                extracted["lending_location"] = location
                break
    
    # Look for emergency contact
    emergency_patterns = [
        r'Emergency\s+Contact[#:]?\s*([A-Za-z\s]+?)(?:Phone|Email|Department|\n)',
        r'Emergency[#:]?\s*([A-Za-z\s]+?)(?:Phone|Email|Department|\n)'
    ]
    for pattern in emergency_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["emergency_contact_name"]:
            emergency = clean_extracted_text(match.group(1), "name")
            if len(emergency) > 2:
                extracted["emergency_contact_name"] = emergency
                break
    
    # Look for issued by / lender name (enhanced staff patterns)
    issued_patterns = [
        r'Issued\s+by\s+Staff:\s*([A-Za-z\s\.\-]+?)(?:Staff\s+ID|Date|Time|Invoice|Due|\n|$)',
        r'Issued\s+by\s+Staff[#:]?\s*([A-Za-z\s\.\-]+?)(?:Staff\s+ID|Date|Time|Invoice|Due|\n|$)',
        r'Staff:\s*([A-Za-z\s\.\-]+?)(?:Staff\s+ID|Date|Time|Invoice|Due|\n|$)',
        r'Staff[#:]?\s*([A-Za-z\s\.\-]+?)(?:Staff\s+ID|Date|Time|Invoice|Due|\n|$)',
        r'Dr\.\s+([A-Za-z\s\.\-]+?)(?:Date|Time|Invoice|Due|Staff\s+ID|\n|$)',
        r'Prof\.\s+([A-Za-z\s\.\-]+?)(?:Date|Time|Invoice|Due|Staff\s+ID|\n|$)',
        r'Professor\s+([A-Za-z\s\.\-]+?)(?:Date|Time|Invoice|Due|Staff\s+ID|\n|$)',
        r'Issued\s+by[#:]?\s*([A-Za-z\s\.\-]+?)(?:Designation|Department|Date|\n)',
        r'Approved\s+By[#:]?\s*([A-Za-z\s\.\-]+?)(?:Designation|Department|Date|\n|Processing)',
        r'Lender[#:]?\s*([A-Za-z\s\.\-]+?)(?:Designation|Department|Date|\n)',
        r'Lab\s+Manager[#:]?\s*([A-Za-z\s\.\-]+?)(?:Designation|Department|Date|\n)'
    ]
    for i, pattern in enumerate(issued_patterns):
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["issued_by"]:
            issued = clean_extracted_text(match.group(1), "name")
            if len(issued) > 2:
                extracted["issued_by"] = issued
                # Only set lender_name if it's not already set (from the dedicated lender extraction above)
                if not extracted["lender_name"]:
                    extracted["lender_name"] = issued  # Add for frontend compatibility
                    api_logger.info(f"👤 Extracted lender name from issued_by with pattern {i+1}: {issued}")
                else:
                    api_logger.info(f"👤 Extracted issued_by with pattern {i+1} but lender_name already set: {issued}")
                break
        elif match:
            api_logger.info(f"👤 Pattern {i+1} found lender but field already filled: {match.group(1)}")
    
    # Extract issue date for lending_date
    issue_date_patterns = [
        r'Issue\s+Date[#:]?\s*([A-Za-z0-9,\s]+?)(?:\n|@|Due)',
        r'@\s*Issue\s+Date[#:]?\s*([A-Za-z0-9,\s]+?)(?:\n|@|Due)',
        r'Lending\s+Date[#:]?\s*([A-Za-z0-9,\s]+?)(?:\n|@|Due)',
        r'Date[#:]?\s*([A-Za-z0-9,\s]+?)(?:\n|@|Due)',
        r'(September|October|November|December|January|February|March|April|May|June|July|August)\s+\d{1,2},?\s+\d{4}'
    ]
    for i, pattern in enumerate(issue_date_patterns):
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            date_str = match.group(1).strip()
            converted_date = convert_date_to_iso_format(date_str)
            if converted_date and not extracted.get("lending_date"):
                extracted["lending_date"] = converted_date
                api_logger.info(f"📅 Extracted lending date with pattern {i+1}: {converted_date} from '{date_str}'")
                break
            elif converted_date:
                api_logger.info(f"📅 Pattern {i+1} found date but field already filled: {date_str}")
        else:
            api_logger.debug(f"📅 Issue date pattern {i+1} failed")
    
    # Look for due date patterns (enhanced with YYYY-MM-DD support)
    date_patterns = [
        r'Due\s+Date[#:]?\s*(\d{4}-\d{1,2}-\d{1,2})',  # YYYY-MM-DD format first
        r'Due\s+Date[#:]?\s*([A-Za-z0-9,\s-]+?)(?:\n|$|Invoice|Type)',
        r'Return\s+Date[#:]?\s*(\d{4}-\d{1,2}-\d{1,2})',  # YYYY-MM-DD format first  
        r'Return\s+Date[#:]?\s*([A-Za-z0-9,\s-]+?)(?:\n|$|Invoice|Type)',
        r'Expected\s+Return[#:]?\s*(\d{4}-\d{1,2}-\d{1,2})',  # YYYY-MM-DD format first
        r'Expected\s+Return[#:]?\s*([A-Za-z0-9,\s-]+?)(?:\n|$|Invoice|Type)',
        # Remove the broad (\d{4}-\d{1,2}-\d{1,2}) pattern to avoid wrong matches
        r'(September|October|November|December|January|February|March|April|May|June|July|August)\s+\d{1,2},?\s+\d{4}',
        r'Sept?\s*\d{1,2},?\s*\d{4}'
    ]
    for pattern in date_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match and not extracted["due_date"]:
            date_str = match.group(1).strip()
            converted_date = convert_date_to_iso_format(date_str)
            if converted_date:
                extracted["due_date"] = converted_date
                extracted["expected_return_date"] = converted_date
                break
    
    # Extract equipment items with enhanced parsing for lending context
    try:
        # Look for equipment/items section using multiple approaches
        equipment_lines = []
        full_text_lines = text.split('\n')
        
        # Approach 1: Look for table-like structures and "Items:" sections
        in_items_section = False
        for i, line in enumerate(full_text_lines):
            line_clean = line.strip()
            
            # Detect start of items section (enhanced to catch "Items:")
            if re.search(r'^Items:\s*$', line_clean, re.IGNORECASE):
                in_items_section = True
                api_logger.info(f"📋 Found items section start: {line_clean}")
                continue
            elif re.search(r'(TOTAL|SIGNATURE|TERMS|CONDITIONS|NOTES)', line_clean, re.IGNORECASE):
                in_items_section = False
                api_logger.info(f"📋 Items section end: {line_clean}")
            
            if in_items_section and line_clean and not re.search(r'^(Items|Item|Name|SKU|Code|Qty|Quantity|Price|Value|Total|Condition)(\s|:|$)', line_clean, re.IGNORECASE):
                equipment_lines.append(line_clean)
                api_logger.info(f"📦 Adding to equipment lines: {line_clean}")
        
        api_logger.info(f"📋 Found {len(equipment_lines)} lines in items section")
        
        # Approach 2: Look for table patterns in the entire text (enhanced for test invoice format)
        table_patterns = [
            # Pattern: Name | SKU | Qty | Unit Price | Total
            r'([A-Za-z\s\-]+)\s*\|\s*([A-Z0-9\-]+)\s*\|\s*(\d+)\s*\|\s*\$?([\d,.]+)\s*\|\s*\$?([\d,.]+)',
            # Pattern: Name SKU Qty $Price $Total (tabular)
            r'([A-Za-z\s\-]{3,})\s+([A-Z0-9\-]{2,})\s+(\d+)\s+\$?([\d,.]+)\s+\$?([\d,.]+)',
            # Pattern: Name, SKU, Qty, Price, Total (comma separated)
            r'([A-Za-z\s\-]{3,}),\s*([A-Z0-9\-]+),\s*(\d+),\s*\$?([\d,.]+),\s*\$?([\d,.]+)',
            # Pattern: Detect items with clearer boundaries
            r'(\d+)\.\s*([A-Za-z\s\-]+)\s+([A-Z0-9\-]+)\s+(\d+)\s+\$?([\d,.]+)',
            # Note: Removed the duplicate Item Name - QTY: # - $Price patterns since they're handled in enhanced_patterns
        ]
        
        # Process equipment lines first
        for line in equipment_lines:
            # Skip obvious header lines
            if re.search(r'^(Item|Name|SKU|Code|Qty|Quantity|Price|Value|Total|Condition)(\s|$)', line, re.IGNORECASE):
                continue
            
            item = extract_item_from_line(line)
            if item:
                extracted["items"].append(item)
        
        # If no items found in equipment section, scan entire text (enhanced with specific patterns)
        if not extracted["items"]:
            api_logger.info("🔍 Scanning entire text for items with specific patterns...")
            
            # Add the specific patterns for our test invoice format first
            enhanced_patterns = [
                # Pattern: Item Name - QTY: # - $Price (improved to capture full names including "Digital 6-inch")
                r'([A-Za-z][A-Za-z\s\-\d]{2,30}?)\s*-\s*QTY:\s*(\d+)\s*-\s*\$?([\d,.]+)',
                # Pattern: Item Name QTY # $Price (improved)
                r'([A-Za-z][A-Za-z\s\-\d]{3,30}?)\s+QTY:\s*(\d+)\s+\$?([\d,.]+)',
            ] + table_patterns  # Add the existing patterns after
            
            for pattern_idx, pattern in enumerate(enhanced_patterns):
                matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    groups = match.groups()
                    if len(groups) >= 3:
                        try:
                            name = groups[0].strip()
                            
                            # Skip invalid names
                            if (not name or len(name) < 3 or 
                                name.lower() in ['item', 'name', 'product', 'component', 'equipment', 'qty', 'quantity', 'price', 'total', 'sku', 'code']):
                                continue
                            
                            if pattern_idx < 2:  # Our enhanced patterns
                                sku = f"AUTO{len(extracted['items'])+1:03d}"
                                qty = int(groups[1])
                                unit_price = float(groups[2].replace(',', ''))
                                total = qty * unit_price
                                api_logger.info(f"🎯 Enhanced pattern {pattern_idx+1} matched: {name}, QTY: {qty}, Price: ${unit_price}")
                            else:
                                # Handle original patterns
                                if len(groups) >= 5:  # Full pattern with name, sku, qty, unit_price, total
                                    if groups[0].startswith(tuple('0123456789')):  # Number at start
                                        name = groups[1].strip()
                                        sku = groups[2]
                                        qty = int(groups[3])
                                        unit_price = float(groups[4].replace(',', ''))
                                        total = qty * unit_price
                                    else:
                                        name = groups[0].strip()
                                        sku = groups[1]
                                        qty = int(groups[2])
                                        unit_price = float(groups[3].replace(',', ''))
                                        total = float(groups[4].replace(',', ''))
                                elif len(groups) == 3:  # Handle Item Name - QTY: # - $Price format
                                    sku = f"AUTO{len(extracted['items'])+1:03d}"
                                    qty = int(groups[1])
                                    unit_price = float(groups[2].replace(',', ''))
                                    total = qty * unit_price
                                    api_logger.info(f"🎯 Matched 3-group pattern (idx {pattern_idx}): {name}, QTY: {qty}, Price: ${unit_price}")
                                else:
                                    sku = groups[1] if len(groups) > 1 else f"AUTO{len(extracted['items'])+1:03d}"
                                    qty = int(groups[2]) if len(groups) > 2 else 1
                                    unit_price = float(groups[3].replace(',', '')) if len(groups) > 3 else 0.0
                                    total = qty * unit_price
                            
                            # Validate item data and check for duplicates
                            if (len(name) > 2 and name.lower() not in ['item', 'name', 'product', 'component'] and
                                not any(existing_item['name'].lower() == name.lower() for existing_item in extracted["items"])):
                                item = {
                                    "name": name,
                                    "sku": sku,
                                    "serial_number": "",
                                    "quantity": qty,
                                    "unit_value": unit_price,
                                    "total_value": total,
                                    "condition_at_lending": "good",
                                    "risk_level": "low",
                                    "safety_requirements": "",
                                    "usage_purpose": extracted.get("lending_purpose", ""),
                                    "usage_location": extracted.get("lending_location", "")
                                }
                                extracted["items"].append(item)
                                api_logger.info(f"✅ Successfully extracted item: {name}")
                            elif any(existing_item['name'].lower() == name.lower() for existing_item in extracted["items"]):
                                api_logger.info(f"🔄 Skipping duplicate item: {name}")
                        except (ValueError, IndexError) as e:
                            api_logger.debug(f"Failed to parse item match: {e}")
                            continue
        
        # Fallback: Extract any product-like words if still no items (enhanced)
        if not extracted["items"]:
            api_logger.info("🔍 No items found in structured data, trying fallback extraction...")
            
            # Look for equipment names in text (expanded list)
            equipment_words = re.findall(r'\b(Oscilloscope|Multimeter|Microscope|Caliper|Micrometer|Generator|Analyzer|Sensor|Breadboard|Arduino|Resistor|Capacitor|Inductor|Transistor|IC|Chip|Module|Board|Kit|Tool|Meter|Probe|Cable|Wire|Component|Computer|Laptop|Monitor|Keyboard|Mouse|Tablet|Phone|Camera|Lens|Tripod|Battery|Charger|Adapter|Switch|Router|Hub|Speaker|Headphone|Microphone|Projector|Screen|Printer|Scanner|Drive|Disk|Memory|Card|Reader)\b', text, re.IGNORECASE)
            
            for i, equipment in enumerate(set(equipment_words)):
                if i >= 5:  # Limit to 5 items to avoid spam
                    break
                item = {
                    "name": equipment.title(),
                    "sku": f"AUTO{i+1:03d}",
                    "serial_number": "",
                    "quantity": 1,
                    "unit_value": 0.0,
                    "total_value": 0.0,
                    "condition_at_lending": "good",
                    "risk_level": "low",
                    "safety_requirements": "",
                    "usage_purpose": extracted.get("lending_purpose", ""),
                    "usage_location": extracted.get("lending_location", "")
                }
                extracted["items"].append(item)
                api_logger.info(f"🎯 Fallback extracted equipment: {equipment}")
            
            # Try to extract from any line that looks like it might contain items
            if not extracted["items"]:
                api_logger.info("🔍 Trying line-by-line extraction as final fallback...")
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if len(line) < 3 or not line:
                        continue
                    
                    # Skip obvious non-item lines
                    if re.search(r'^(date|time|total|signature|terms|conditions|notes|email|phone|address|department)', line, re.IGNORECASE):
                        continue
                    
                    # Look for lines that might contain items
                    if (re.search(r'\b(equipment|tool|device|component|item|product)\b', line, re.IGNORECASE) or
                        re.search(r'\b[A-Z]{2,}[\d\-]+\b', line) or  # SKU-like patterns
                        re.search(r'\d+\s*x\s*[A-Za-z]', line, re.IGNORECASE) or  # Quantity patterns
                        re.search(r'\$\d+', line)):  # Price patterns
                        
                        item = extract_item_from_line(line)
                        if item and len(extracted["items"]) < 10:  # Limit to avoid spam
                            extracted["items"].append(item)
                            api_logger.info(f"📦 Line extraction found: {item['name']}")
    
    except Exception as e:
        api_logger.warning(f"Failed to parse equipment items: {e}")

    # Set sensible defaults for missing but important fields
    if not extracted["lending_time"]:
        extracted["lending_time"] = "09:00"  # Default to 9 AM
    
    if not extracted["notes"] and extracted["lending_purpose"]:
        extracted["notes"] = f"Lending for: {extracted['lending_purpose']}"
    elif not extracted["notes"]:
        extracted["notes"] = "Equipment lending - see attached invoice for details"
    
    # Calculate confidence score based on extracted fields (enhanced)
    confidence = 0
    if extracted["student_name"]: confidence += 15
    if extracted["student_id"]: confidence += 15
    if extracted["student_email"]: confidence += 10
    if extracted["department"]: confidence += 10
    if extracted["due_date"]: confidence += 10
    if extracted["invoice_number"]: confidence += 5
    if extracted["project_name"]: confidence += 10
    if extracted["supervisor_name"]: confidence += 10
    if extracted["lending_purpose"]: confidence += 10
    if extracted["lending_location"]: confidence += 5
    if extracted["issued_by"]: confidence += 5
    if extracted["borrower_phone"]: confidence += 5
    if extracted["items"]: confidence += 5 * min(len(extracted["items"]), 4)  # Cap at 4 items
    
    extracted["confidence_score"] = min(confidence, 100)
    
    # Enhanced logging with comprehensive data validation (fixed for safety)
    try:
        api_logger.info(f"✨ Enhanced lending invoice parsing completed. Confidence: {extracted.get('confidence_score', 0)}%")
        api_logger.info(f"📋 Extracted Lending Data Summary:")
        api_logger.info(f"   👤 Borrower: '{extracted.get('student_name', '')}' (ID: {extracted.get('student_id', '')})")
        api_logger.info(f"   📧 Contact: {extracted.get('student_email', '')} | {extracted.get('borrower_phone', '')}")
        api_logger.info(f"   🏫 Department: '{extracted.get('department', '')}'")
        api_logger.info(f"   📁 Project: '{extracted.get('project_name', '')}' (Supervisor: {extracted.get('supervisor_name', '')})")
        
        # Safe string slicing
        purpose = extracted.get('lending_purpose', '')
        purpose_display = purpose[:50] + "..." if len(purpose) > 50 else purpose
        api_logger.info(f"   🎯 Purpose: '{purpose_display}' (Location: {extracted.get('lending_location', '')})")
        
        api_logger.info(f"   📅 Due Date: {extracted.get('due_date', '')}")
        api_logger.info(f"   👨‍💼 Issued By: '{extracted.get('issued_by', '')}'")
        api_logger.info(f"   📦 Components: {len(extracted.get('items', []))} extracted")
    except Exception as log_error:
        api_logger.warning(f"Logging error (non-critical): {log_error}")
    
    # Enhanced validation warnings (also made safe)
    try:
        if len(extracted.get('student_name', '')) < 3:
            api_logger.warning("⚠️  Student name seems too short")
        if len(extracted.get('student_id', '')) < 4:
            api_logger.warning("⚠️  Student ID seems invalid")
        if not extracted.get('student_email') and extracted.get('confidence_score', 0) > 50:
            api_logger.warning("⚠️  No valid email found despite good OCR")
        if not extracted.get('lending_purpose') and extracted.get('confidence_score', 0) > 60:
            api_logger.warning("⚠️  No lending purpose found - manual entry may be needed")
        if not extracted.get('project_name') and extracted.get('confidence_score', 0) > 70:
            api_logger.warning("⚠️  No project information found")
    except Exception as validation_error:
        api_logger.warning(f"Validation error (non-critical): {validation_error}")
    
    api_logger.info("🎯 About to return extracted data...")
    api_logger.info(f"🔧 DEBUG: extracted type = {type(extracted)}")
    api_logger.info(f"🔧 DEBUG: extracted keys = {list(extracted.keys()) if extracted else 'None'}")
    return extracted

def extract_item_from_line(line):
    """Helper function to extract item information from a single line"""
    try:
        # Enhanced patterns to handle more formats
        patterns = [
            # Pattern 1: Name SKU Qty Price Total
            r'^([A-Za-z\s\-]+?)\s+([A-Z0-9\-]{2,})\s+(\d+)\s+\$?([\d,.]+)\s+\$?([\d,.]+)',
            # Pattern 2: Name | SKU | Qty | Price | Total
            r'^([A-Za-z\s\-]+?)\s*\|\s*([A-Z0-9\-]+)\s*\|\s*(\d+)\s*\|\s*\$?([\d,.]+)\s*\|\s*\$?([\d,.]+)',
            # Pattern 3: Name, SKU, Qty, Price
            r'^([A-Za-z\s\-]{3,}),\s*([A-Z0-9\-]+),\s*(\d+),\s*\$?([\d,.]+)',
            # Pattern 4: Just name and basic info
            r'^([A-Za-z\s\-]{3,})\s+([A-Z0-9\-]{2,})',
            # Pattern 5: Detect equipment/component names with numbers
            r'^(\d+)[\.\)]\s*([A-Za-z\s\-]{3,})(?:\s+([A-Z0-9\-]+))?\s*(?:(\d+))?\s*(?:\$?([\d,.]+))?',
            # Pattern 6: Simple component name detection
            r'^([A-Za-z][A-Za-z\s\-]{2,50})(?:\s+(\d+))?\s*(?:\$?([\d,.]+))?',
            # Pattern 7: Tab or multiple space separated
            r'^([A-Za-z\s\-]{3,})\s{2,}([A-Z0-9\-]+)\s{2,}(\d+)\s{2,}\$?([\d,.]+)',
            # Pattern 8: Item Name - QTY: # - $Price (NEW - for test invoice format)
            r'^([A-Za-z\s\-]+?)\s*-\s*QTY:\s*(\d+)\s*-\s*\$?([\d,.]+)',
            # Pattern 9: Item Name - Quantity: # - Price: $#
            r'^([A-Za-z\s\-]+?)\s*-\s*Quantity:\s*(\d+)\s*-\s*Price:\s*\$?([\d,.]+)',
            # Pattern 10: Item Name QTY # $Price
            r'^([A-Za-z\s\-]+?)\s+QTY\s+(\d+)\s+\$?([\d,.]+)',
        ]
        
        for i, pattern in enumerate(patterns):
            match = re.search(pattern, line.strip())
            if match:
                groups = match.groups()
                
                # Extract name (always first group)
                name = groups[0].strip() if groups[0] else ""
                
                # Skip header-like entries and invalid names
                if (not name or len(name) < 3 or 
                    name.lower() in ['item', 'name', 'product', 'component', 'equipment', 'qty', 'quantity', 'price', 'total', 'sku', 'code']):
                    continue
                
                # Extract other fields based on pattern
                sku = ""
                quantity = 1
                unit_value = 0.0
                total_value = 0.0
                
                if i == 4:  # Pattern 5 (numbered list)
                    name = groups[1].strip() if groups[1] else ""
                    sku = groups[2] if groups[2] else f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[3]) if groups[3] else 1
                    unit_value = float(groups[4].replace(',', '')) if groups[4] else 0.0
                elif i == 5:  # Pattern 6 (simple detection)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                elif i == 7:  # Pattern 8 (Item Name - QTY: # - $Price)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                elif i == 8:  # Pattern 9 (Item Name - Quantity: # - Price: $#)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                elif i == 9:  # Pattern 10 (Item Name QTY # $Price)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                else:  # Other patterns
                    sku = groups[1] if len(groups) > 1 and groups[1] else f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[2]) if len(groups) > 2 and groups[2] else 1
                    unit_value = float(groups[3].replace(',', '')) if len(groups) > 3 and groups[3] else 0.0
                    total_value = float(groups[4].replace(',', '')) if len(groups) > 4 and groups[4] else 0.0
                
                # Skip if name still invalid
                if not name or len(name) < 3:
                    continue
                
                item = {
                    "name": name,
                    "sku": sku,
                    "serial_number": "",
                    "quantity": quantity,
                    "unit_value": unit_value,
                    "total_value": total_value if total_value > 0 else (quantity * unit_value),
                    "condition_at_lending": "good",
                    "risk_level": "low",
                    "safety_requirements": "",
                    "usage_purpose": "",
                    "usage_location": ""
                }
                
                api_logger.info(f"🔧 Extracted item with pattern {i+1}: {name} (SKU: {sku}, Qty: {quantity})")
                return item
                
    except Exception as e:
        api_logger.debug(f"Failed to extract item from line '{line}': {e}")
    
    return None

def extract_item_from_line(line):
    """Helper function to extract item information from a single line"""
    try:
        # Enhanced patterns to handle more formats
        patterns = [
            # Pattern 1: Name SKU Qty Price Total
            r'^([A-Za-z\s\-]+?)\s+([A-Z0-9\-]{2,})\s+(\d+)\s+\$?([\d,.]+)\s+\$?([\d,.]+)',
            # Pattern 2: Name | SKU | Qty | Price | Total
            r'^([A-Za-z\s\-]+?)\s*\|\s*([A-Z0-9\-]+)\s*\|\s*(\d+)\s*\|\s*\$?([\d,.]+)\s*\|\s*\$?([\d,.]+)',
            # Pattern 3: Name, SKU, Qty, Price
            r'^([A-Za-z\s\-]{3,}),\s*([A-Z0-9\-]+),\s*(\d+),\s*\$?([\d,.]+)',
            # Pattern 4: Just name and basic info
            r'^([A-Za-z\s\-]{3,})\s+([A-Z0-9\-]{2,})',
            # Pattern 5: Detect equipment/component names with numbers
            r'^(\d+)[\.\)]\s*([A-Za-z\s\-]{3,})(?:\s+([A-Z0-9\-]+))?\s*(?:(\d+))?\s*(?:\$?([\d,.]+))?',
            # Pattern 6: Simple component name detection
            r'^([A-Za-z][A-Za-z\s\-]{2,50})(?:\s+(\d+))?\s*(?:\$?([\d,.]+))?',
            # Pattern 7: Tab or multiple space separated
            r'^([A-Za-z\s\-]{3,})\s{2,}([A-Z0-9\-]+)\s{2,}(\d+)\s{2,}\$?([\d,.]+)',
            # Pattern 8: Item Name - QTY: # - $Price (NEW - for test invoice format)
            r'^([A-Za-z\s\-]+?)\s*-\s*QTY:\s*(\d+)\s*-\s*\$?([\d,.]+)',
            # Pattern 9: Item Name - Quantity: # - Price: $#
            r'^([A-Za-z\s\-]+?)\s*-\s*Quantity:\s*(\d+)\s*-\s*Price:\s*\$?([\d,.]+)',
            # Pattern 10: Item Name QTY # $Price
            r'^([A-Za-z\s\-]+?)\s+QTY\s+(\d+)\s+\$?([\d,.]+)',
        ]
        
        for i, pattern in enumerate(patterns):
            match = re.search(pattern, line.strip())
            if match:
                groups = match.groups()
                
                # Extract name (always first group)
                name = groups[0].strip() if groups[0] else ""
                
                # Skip header-like entries and invalid names
                if (not name or len(name) < 3 or 
                    name.lower() in ['item', 'name', 'product', 'component', 'equipment', 'qty', 'quantity', 'price', 'total', 'sku', 'code']):
                    continue
                
                # Extract other fields based on pattern
                sku = ""
                quantity = 1
                unit_value = 0.0
                total_value = 0.0
                
                if i == 4:  # Pattern 5 (numbered list)
                    name = groups[1].strip() if groups[1] else ""
                    sku = groups[2] if groups[2] else f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[3]) if groups[3] else 1
                    unit_value = float(groups[4].replace(',', '')) if groups[4] else 0.0
                elif i == 5:  # Pattern 6 (simple detection)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                elif i == 7:  # Pattern 8 (Item Name - QTY: # - $Price)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                elif i == 8:  # Pattern 9 (Item Name - Quantity: # - Price: $#)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                elif i == 9:  # Pattern 10 (Item Name QTY # $Price)
                    sku = f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[1]) if groups[1] else 1
                    unit_value = float(groups[2].replace(',', '')) if groups[2] else 0.0
                else:  # Other patterns
                    sku = groups[1] if len(groups) > 1 and groups[1] else f"AUTO{random.randint(100,999)}"
                    quantity = int(groups[2]) if len(groups) > 2 and groups[2] else 1
                    unit_value = float(groups[3].replace(',', '')) if len(groups) > 3 and groups[3] else 0.0
                    total_value = float(groups[4].replace(',', '')) if len(groups) > 4 and groups[4] else 0.0
                
                # Skip if name still invalid
                if not name or len(name) < 3:
                    continue
                
                item = {
                    "name": name,
                    "sku": sku,
                    "serial_number": "",
                    "quantity": quantity,
                    "unit_value": unit_value,
                    "total_value": total_value if total_value > 0 else (quantity * unit_value),
                    "condition_at_lending": "good",
                    "risk_level": "low",
                    "safety_requirements": "",
                    "usage_purpose": "",
                    "usage_location": ""
                }
                
                api_logger.info(f"🔧 Extracted item with pattern {i+1}: {name} (SKU: {sku}, Qty: {quantity})")
                return item
                
    except Exception as e:
        api_logger.debug(f"Failed to extract item from line '{line}': {e}")
    
    return None

def calculate_confidence_score(extracted_data: dict) -> float:
    """
    Calculate confidence score based on extracted data completeness
    """
    fields = ["student_name", "student_id", "student_email", "department"]
    filled_fields = sum(1 for field in fields if extracted_data.get(field))
    return min(0.9, filled_fields / len(fields))

def parse_text_simple_fallback(text: str) -> dict:
    """
    Simple fallback parsing function if the main one fails
    """
    try:
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        extracted = {
            "student_name": "",
            "student_id": "",
            "student_email": "",
            "department": "",
            "due_date": "",
            "items": [],
            "confidence_score": 30
        }
        
        full_text = ' '.join(lines)
        
        # Basic name extraction
        name_match = re.search(r'(?:Name|Student)[:\s]+([A-Za-z\s]+)', full_text, re.IGNORECASE)
        if name_match:
            extracted["student_name"] = name_match.group(1).strip()
        
        # Basic ID extraction
        id_match = re.search(r'(?:ID|Student\s+ID)[:\s]+([A-Z0-9]+)', full_text, re.IGNORECASE)
        if id_match:
            extracted["student_id"] = id_match.group(1).strip()
        
        # Basic email extraction
        email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', full_text)
        if email_match:
            extracted["student_email"] = email_match.group(1)
        
        return extracted
    except Exception as e:
        api_logger.error(f"Even fallback parsing failed: {e}")
        return {
            "student_name": "",
            "student_id": "",
            "student_email": "",
            "department": "",
            "due_date": "",
            "items": [],
            "confidence_score": 0
        }
