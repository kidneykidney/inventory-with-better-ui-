"""
Settings API Router
Provides REST endpoints for managing system settings
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, validator
import logging
from datetime import datetime

from database_manager import DatabaseManager, get_db
from settings_manager import get_settings, SettingsManager

# Setup logging
logger = logging.getLogger(__name__)

# Create router
settings_router = APIRouter(tags=["settings"])

# Pydantic models for API requests/responses
class SettingUpdate(BaseModel):
    """Model for updating a single setting"""
    category: str
    key: str
    value: Any
    
    @validator('category')
    def validate_category(cls, v):
        valid_categories = [
            'database', 'ocr', 'file_upload', 'security', 
            'application', 'notifications', 'business', 'performance'
        ]
        if v not in valid_categories:
            raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v

class CategorySettingsUpdate(BaseModel):
    """Model for updating multiple settings in a category"""
    category: str
    settings: Dict[str, Any]
    
    @validator('category')
    def validate_category(cls, v):
        valid_categories = [
            'database', 'ocr', 'file_upload', 'security', 
            'application', 'notifications', 'business', 'performance'
        ]
        if v not in valid_categories:
            raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v

class SettingsImport(BaseModel):
    """Model for importing settings"""
    settings: Dict[str, Any]
    overwrite_existing: bool = True

class SettingsValidationResponse(BaseModel):
    """Model for settings validation response"""
    is_valid: bool
    errors: Dict[str, List[str]]
    warnings: Dict[str, List[str]] = {}

# API Endpoints

@settings_router.get("/")
async def get_all_settings(db: DatabaseManager = Depends(get_db)):
    """Get all system settings"""
    try:
        settings = get_settings(db)
        return {
            "success": True,
            "data": settings.export_settings(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get all settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve settings"
        )

@settings_router.get("/categories")
async def get_settings_categories():
    """Get list of available settings categories"""
    try:
        categories = {
            "database": {
                "name": "Database Settings",
                "description": "PostgreSQL connection and database configuration",
                "icon": "database"
            },
            "ocr": {
                "name": "OCR Settings", 
                "description": "Tesseract OCR processing configuration",
                "icon": "scan"
            },
            "file_upload": {
                "name": "File Upload Settings",
                "description": "File upload limits and storage configuration",
                "icon": "upload"
            },
            "security": {
                "name": "Security Settings",
                "description": "Authentication, CORS, and security policies",
                "icon": "shield"
            },
            "application": {
                "name": "Application Settings",
                "description": "General application and company information",
                "icon": "settings"
            },
            "notifications": {
                "name": "Notifications",
                "description": "Email, alerts, and logging configuration",
                "icon": "notifications"
            },
            "business": {
                "name": "Business Logic",
                "description": "Invoice numbering, departments, and business rules",
                "icon": "business"
            },
            "performance": {
                "name": "Performance Settings",
                "description": "Caching, optimization, and performance tuning",
                "icon": "speed"
            }
        }
        
        return {
            "success": True,
            "data": categories
        }
    except Exception as e:
        logger.error(f"Failed to get settings categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve settings categories"
        )

@settings_router.get("/category/{category}")
async def get_category_settings(category: str, db: DatabaseManager = Depends(get_db)):
    """Get settings for a specific category"""
    try:
        settings = get_settings(db)
        category_settings = settings.get_category_settings(category)
        
        if not category_settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{category}' not found"
            )
        
        return {
            "success": True,
            "data": {
                "category": category,
                "settings": category_settings
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get category settings for {category}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve settings for category '{category}'"
        )

@settings_router.get("/setting/{category}/{key}")
async def get_single_setting(category: str, key: str, db: DatabaseManager = Depends(get_db)):
    """Get a specific setting value"""
    try:
        settings = get_settings(db)
        value = settings.get_setting(category, key)
        
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Setting '{category}.{key}' not found"
            )
        
        return {
            "success": True,
            "data": {
                "category": category,
                "key": key,
                "value": value
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get setting {category}.{key}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve setting '{category}.{key}'"
        )

@settings_router.put("/setting")
async def update_single_setting(
    setting_update: SettingUpdate, 
    db: DatabaseManager = Depends(get_db)
):
    """Update a single setting"""
    try:
        settings = get_settings(db)
        success = settings.set_setting(
            setting_update.category, 
            setting_update.key, 
            setting_update.value
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update setting '{setting_update.category}.{setting_update.key}'"
            )
        
        return {
            "success": True,
            "message": f"Setting '{setting_update.category}.{setting_update.key}' updated successfully",
            "data": {
                "category": setting_update.category,
                "key": setting_update.key,
                "value": setting_update.value
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update setting {setting_update.category}.{setting_update.key}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update setting"
        )

@settings_router.put("/category")
async def update_category_settings(
    category_update: CategorySettingsUpdate,
    db: DatabaseManager = Depends(get_db)
):
    """Update multiple settings in a category"""
    try:
        settings = get_settings(db)
        success = settings.update_category_settings(
            category_update.category,
            category_update.settings
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update settings for category '{category_update.category}'"
            )
        
        return {
            "success": True,
            "message": f"Settings for category '{category_update.category}' updated successfully",
            "data": {
                "category": category_update.category,
                "updated_count": len(category_update.settings)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update category settings for {category_update.category}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update category settings"
        )

@settings_router.post("/reset/{category}")
async def reset_category_settings(category: str, db: DatabaseManager = Depends(get_db)):
    """Reset a category to default values"""
    try:
        settings = get_settings(db)
        success = settings.reset_category_to_defaults(category)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{category}' not found"
            )
        
        return {
            "success": True,
            "message": f"Category '{category}' reset to default values",
            "data": settings.get_category_settings(category)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reset category {category}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset category settings"
        )

@settings_router.post("/validate")
async def validate_settings(db: DatabaseManager = Depends(get_db)):
    """Validate all current settings"""
    try:
        settings = get_settings(db)
        errors = settings.validate_settings()
        
        is_valid = len(errors) == 0
        
        # Generate some warnings for common issues
        warnings = {}
        
        # Check OCR path exists
        import os
        if not os.path.exists(settings.ocr.tesseract_path):
            warnings['ocr'] = warnings.get('ocr', [])
            warnings['ocr'].append(f"Tesseract path '{settings.ocr.tesseract_path}' does not exist")
        
        # Check database connection
        try:
            db.connect()
            db.disconnect()
        except Exception:
            warnings['database'] = warnings.get('database', [])
            warnings['database'].append("Cannot connect to database with current settings")
        
        return {
            "success": True,
            "data": {
                "is_valid": is_valid,
                "errors": errors,
                "warnings": warnings,
                "validated_at": datetime.now().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Failed to validate settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate settings"
        )

@settings_router.get("/export")
async def export_settings(db: DatabaseManager = Depends(get_db)):
    """Export all settings as JSON"""
    try:
        settings = get_settings(db)
        exported_data = settings.export_settings()
        
        return {
            "success": True,
            "data": exported_data,
            "message": "Settings exported successfully"
        }
    except Exception as e:
        logger.error(f"Failed to export settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export settings"
        )

@settings_router.post("/import")
async def import_settings(
    settings_import: SettingsImport,
    db: DatabaseManager = Depends(get_db)
):
    """Import settings from JSON"""
    try:
        settings = get_settings(db)
        success = settings.import_settings(settings_import.settings)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to import settings"
            )
        
        return {
            "success": True,
            "message": "Settings imported successfully",
            "data": {
                "imported_at": datetime.now().isoformat(),
                "categories_imported": len(settings_import.settings)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to import settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to import settings"
        )

@settings_router.get("/test/database")
async def test_database_connection(db: DatabaseManager = Depends(get_db)):
    """Test database connection with current settings"""
    try:
        settings = get_settings(db)
        
        # Create a new database manager with current settings
        from database_manager import DatabaseManager
        test_db = DatabaseManager()
        test_db.connection_params = {
            'host': settings.database.host,
            'database': settings.database.database,
            'user': settings.database.username,
            'password': settings.database.password,
            'port': settings.database.port
        }
        
        # Test connection
        connected = test_db.connect()
        
        if connected:
            # Run a simple test query
            result = test_db.execute_query("SELECT version() as db_version")
            test_db.disconnect()
            
            return {
                "success": True,
                "message": "Database connection successful",
                "data": {
                    "connected": True,
                    "database_version": result[0]['db_version'] if result else "Unknown"
                }
            }
        else:
            return {
                "success": False,
                "message": "Database connection failed",
                "data": {"connected": False}
            }
            
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return {
            "success": False,
            "message": f"Database connection test failed: {str(e)}",
            "data": {"connected": False, "error": str(e)}
        }

@settings_router.get("/test/ocr")
async def test_ocr_configuration(db: DatabaseManager = Depends(get_db)):
    """Test OCR configuration"""
    try:
        settings = get_settings(db)
        
        # Check if Tesseract path exists
        import os
        tesseract_exists = os.path.exists(settings.ocr.tesseract_path)
        
        # Try to import and test Tesseract
        ocr_working = False
        ocr_version = None
        error_message = None
        
        try:
            import pytesseract
            pytesseract.pytesseract.tesseract_cmd = settings.ocr.tesseract_path
            
            # Test with a simple string
            from PIL import Image, ImageDraw, ImageFont
            import io
            
            # Create a test image
            img = Image.new('RGB', (200, 100), color='white')
            draw = ImageDraw.Draw(img)
            draw.text((10, 30), "TEST OCR", fill='black')
            
            # Test OCR
            test_text = pytesseract.image_to_string(img)
            ocr_working = "TEST" in test_text or "OCR" in test_text
            
            # Get version
            ocr_version = pytesseract.get_tesseract_version()
            
        except Exception as e:
            error_message = str(e)
        
        return {
            "success": True,
            "data": {
                "tesseract_path_exists": tesseract_exists,
                "tesseract_path": settings.ocr.tesseract_path,
                "ocr_working": ocr_working,
                "ocr_version": str(ocr_version) if ocr_version else None,
                "error": error_message,
                "confidence_threshold": settings.ocr.confidence_threshold,
                "supported_formats": settings.ocr.supported_formats
            }
        }
        
    except Exception as e:
        logger.error(f"OCR configuration test failed: {e}")
        return {
            "success": False,
            "message": f"OCR test failed: {str(e)}",
            "data": {"error": str(e)}
        }

@settings_router.get("/health")
async def settings_health_check(db: DatabaseManager = Depends(get_db)):
    """Overall health check for settings system"""
    try:
        settings = get_settings(db)
        
        # Check if settings are initialized
        initialized = settings._initialized
        
        # Validate settings
        validation_errors = settings.validate_settings()
        is_valid = len(validation_errors) == 0
        
        # Count total settings
        all_settings = settings.export_settings()
        total_settings = sum(len(category_settings) for category_settings in all_settings.values() if isinstance(category_settings, dict))
        
        return {
            "success": True,
            "data": {
                "initialized": initialized,
                "valid": is_valid,
                "total_settings": total_settings,
                "categories": len(all_settings) - 1,  # Exclude 'exported_at'
                "validation_errors": validation_errors,
                "last_loaded": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Settings health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Settings health check failed"
        )
