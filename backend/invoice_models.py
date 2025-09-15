"""
Pydantic models for Invoice Management System
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums for invoice system
class InvoiceType(str, Enum):
    LENDING = "lending"
    RETURN = "return"
    DAMAGE = "damage"
    REPLACEMENT = "replacement"

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    ACKNOWLEDGED = "acknowledged"
    ARCHIVED = "archived"

class ImageType(str, Enum):
    PHYSICAL_INVOICE = "physical_invoice"
    SIGNATURE = "signature"
    DAMAGE_PHOTO = "damage_photo"
    RETURN_PHOTO = "return_photo"

class ReturnCondition(str, Enum):
    GOOD = "good"
    DAMAGED = "damaged"
    LOST = "lost"
    NOT_RETURNED = "not_returned"

class AcknowledmentType(str, Enum):
    RECEIPT = "receipt"
    RETURN = "return"
    DAMAGE = "damage"
    REPLACEMENT = "replacement"

class AcknowledmentMethod(str, Enum):
    DIGITAL_SIGNATURE = "digital_signature"
    PHOTO = "photo"
    EMAIL = "email"
    IN_PERSON = "in_person"

class UploadMethod(str, Enum):
    CAMERA = "camera"
    FILE_UPLOAD = "file_upload"
    SCAN = "scan"

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"

# Base models
class InvoiceBase(BaseModel):
    invoice_type: InvoiceType = InvoiceType.LENDING
    
    # Enhanced lending information
    lending_purpose: Optional[str] = None
    lending_location: Optional[str] = None
    project_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    supervisor_email: Optional[str] = None
    lending_terms: Optional[str] = None
    
    # Enhanced borrower information
    borrower_phone: Optional[str] = None
    borrower_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    # Enhanced timing
    requested_start_date: Optional[datetime] = None
    actual_lending_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    grace_period_days: Optional[int] = 7
    
    # Financial information
    security_deposit: Optional[float] = 0.0
    late_return_fee: Optional[float] = 0.0
    
    # Authority information
    issuer_designation: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None
    
    # Additional information
    special_instructions: Optional[str] = None
    risk_assessment: Optional[str] = "low"
    acknowledgment_method: Optional[str] = "digital_signature"
    
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    order_id: Optional[str] = None  # Allow manual invoice creation without order
    student_id: str
    issued_by: str
    due_date: Optional[datetime] = None

class InvoiceCreateWithStudent(InvoiceBase):
    """Create invoice with automatic student creation - Enhanced for lending"""
    student_name: str
    student_id: Optional[str] = None
    student_email: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    issued_by: str = "OCR System"
    due_date: Optional[datetime] = None

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    has_physical_copy: Optional[bool] = None
    physical_invoice_captured: Optional[bool] = None
    physical_invoice_notes: Optional[str] = None
    acknowledged_by_student: Optional[bool] = None
    notes: Optional[str] = None

class InvoiceItemBase(BaseModel):
    product_id: str
    product_name: str
    product_sku: str
    
    # Enhanced component information
    product_category: Optional[str] = None
    product_description: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    
    # Quantity and availability
    quantity: int
    available_quantity: Optional[int] = None
    
    # Financial details
    unit_value: float = 0.00
    replacement_cost: Optional[float] = 0.00
    
    # Lending terms for this specific item
    lending_duration_days: Optional[int] = None
    max_lending_duration: Optional[int] = None
    special_handling_required: Optional[bool] = False
    handling_instructions: Optional[str] = None
    
    # Timeline
    expected_return_date: Optional[datetime] = None
    grace_period_end_date: Optional[datetime] = None
    
    # Condition tracking
    condition_at_lending: Optional[str] = "good"
    condition_notes: Optional[str] = None
    
    # Risk and safety
    risk_level: Optional[str] = "low"
    safety_requirements: Optional[str] = None
    training_required: Optional[bool] = False
    certification_required: Optional[bool] = False
    
    # Usage tracking
    usage_purpose: Optional[str] = None
    usage_location: Optional[str] = None
    co_users: Optional[List[str]] = []
    
    notes: Optional[str] = None

class InvoiceItemCreate(InvoiceItemBase):
    invoice_id: str
    order_item_id: Optional[str] = None

class InvoiceItemUpdate(BaseModel):
    actual_return_date: Optional[datetime] = None
    return_condition: Optional[ReturnCondition] = None
    damage_assessment: Optional[str] = None
    damage_fee: Optional[float] = 0.00
    replacement_needed: Optional[bool] = None
    replacement_fee: Optional[float] = 0.00
    notes: Optional[str] = None

class InvoiceImageBase(BaseModel):
    image_type: ImageType
    image_filename: Optional[str] = None
    upload_method: UploadMethod = UploadMethod.CAMERA
    notes: Optional[str] = None

class InvoiceImageCreate(InvoiceImageBase):
    invoice_id: str
    image_url: str
    uploaded_by: str
    image_size: Optional[int] = None
    image_format: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None
    capture_timestamp: Optional[datetime] = None

class InvoiceImageUpload(BaseModel):
    """Model for handling base64 image uploads"""
    image_type: ImageType
    image_data: str = Field(..., description="Base64 encoded image data")
    image_filename: str
    uploaded_by: str
    upload_method: UploadMethod = UploadMethod.CAMERA
    device_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class InvoiceImageUploadPayload(BaseModel):
    """Model for handling frontend upload payload (includes invoice_id for compatibility)"""
    invoice_id: Optional[str] = None  # Frontend sends this but we ignore it
    image_type: ImageType
    image_data: str = Field(..., description="Base64 encoded image data")
    image_filename: str
    uploaded_by: str
    upload_method: UploadMethod = UploadMethod.CAMERA
    device_info: Optional[Dict[str, Any]] = None
    capture_timestamp: Optional[str] = None
    notes: Optional[str] = None

class StudentAcknowledmentBase(BaseModel):
    acknowledgment_type: AcknowledmentType
    acknowledgment_method: AcknowledmentMethod = AcknowledmentMethod.DIGITAL_SIGNATURE
    acknowledgment_location: Optional[str] = None
    witness_name: Optional[str] = None
    notes: Optional[str] = None

class StudentAcknowledmentCreate(StudentAcknowledmentBase):
    invoice_id: str
    student_id: str
    signature_image_url: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    digital_signature_data: Optional[str] = None

class InvoiceTransactionCreate(BaseModel):
    invoice_id: str
    transaction_type: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    performed_by: str
    changes_summary: Optional[str] = None
    change_reason: Optional[str] = None

# Response models
class InvoiceItem(InvoiceItemBase):
    id: str
    invoice_id: str
    order_item_id: Optional[str] = None
    total_value: float
    actual_return_date: Optional[datetime] = None
    return_condition: Optional[str] = None
    damage_assessment: Optional[str] = None
    damage_fee: float
    replacement_needed: bool
    replacement_fee: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvoiceImage(InvoiceImageBase):
    id: str
    invoice_id: str
    image_url: str
    uploaded_by: str
    image_size: Optional[int] = None
    image_format: Optional[str] = None
    capture_timestamp: Optional[datetime] = None
    device_info: Optional[Dict[str, Any]] = None
    processing_status: str
    ocr_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StudentAcknowledment(StudentAcknowledmentBase):
    id: str
    invoice_id: str
    student_id: str
    acknowledged_at: datetime
    signature_image_url: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    digital_signature_data: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceTransaction(BaseModel):
    id: str
    invoice_id: str
    transaction_type: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    performed_by: str
    changes_summary: Optional[str] = None
    change_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Invoice(InvoiceBase):
    id: str
    invoice_number: str
    order_id: Optional[str] = None  # Allow NULL values
    student_id: Optional[str] = None  # Allow NULL values
    status: str
    total_items: int
    total_value: float
    lending_fee: float
    damage_fee: float
    replacement_fee: float
    issue_date: datetime
    due_date: Optional[datetime] = None
    acknowledgment_date: Optional[datetime] = None
    has_physical_copy: bool
    physical_invoice_captured: bool
    physical_invoice_image_url: Optional[str] = None
    physical_invoice_notes: Optional[str] = None
    issued_by: Optional[str] = None
    acknowledged_by_student: bool
    student_signature_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvoiceDetail(Invoice):
    """Extended invoice model with related data"""
    # Order information
    order_number: Optional[str] = None
    order_status: Optional[str] = None
    requested_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    
    # Student information
    student_name: Optional[str] = None
    student_id_number: Optional[str] = None
    student_email: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    
    # Related items
    items: List[InvoiceItem] = []
    images: List[InvoiceImage] = []
    acknowledgments: List[StudentAcknowledment] = []
    transactions: List[InvoiceTransaction] = []
    
    # Summary counts
    item_count: int = 0
    image_count: int = 0
    acknowledgment_count: int = 0
    latest_acknowledgment: Optional[datetime] = None

    class Config:
        from_attributes = True

# Dashboard and reporting models
class InvoiceSummary(BaseModel):
    total_invoices: int
    issued_invoices: int
    acknowledged_invoices: int
    pending_returns: int
    overdue_returns: int
    physical_invoices_captured: int
    total_lending_value: float

class InvoiceStats(BaseModel):
    by_type: Dict[str, int]
    by_status: Dict[str, int]
    by_month: Dict[str, int]
    recent_activity: List[Dict[str, Any]]

class CameraUploadResponse(BaseModel):
    """Response model for camera uploads"""
    success: bool
    message: str
    image_id: Optional[str] = None
    image_url: Optional[str] = None
    processing_status: str = "pending"
    ocr_extracted: Optional[dict] = None

class BulkInvoiceCreate(BaseModel):
    """Model for creating multiple invoices from orders"""
    order_ids: List[str]
    issued_by: str
    notes: Optional[str] = None

class InvoiceSearchFilter(BaseModel):
    """Model for filtering invoices"""
    status: Optional[str] = None
    invoice_type: Optional[str] = None
    student_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    has_physical_copy: Optional[bool] = None
    acknowledged: Optional[bool] = None
