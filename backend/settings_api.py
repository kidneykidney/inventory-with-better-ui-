from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import os
from pathlib import Path

router = APIRouter()
settings_router = router  # Export as settings_router for main.py

# Settings file path
SETTINGS_FILE = Path("data/settings.json")

class SettingsModel(BaseModel):
    settings: Dict[str, Any]

class SettingUpdate(BaseModel):
    key: str
    value: Any
    category: Optional[str] = None

# Default settings structure
DEFAULT_SETTINGS = {
    "organization": {
        "company_name": "College Incubation Center",
        "company_address": "123 College Street, Education City",
        "contact_email": "admin@college.edu",
        "contact_phone": "+1-234-567-8900",
        "website": "https://college.edu",
        "enable_branches": False,
        "default_branch": "Main Branch",
        "base_currency": "INR",
        "currency_symbol": "₹",
        "decimal_places": 2,
        "enable_tax": True,
        "default_tax_rate": 18,
        "tax_inclusive": False
    },
    "users_control": {
        "max_users": 100,
        "user_registration": True,
        "email_verification": True,
        "custom_roles": True,
        "role_hierarchy": False,
        "default_department": "General",
        "department_codes": False
    },
    "customization": {
        "enable_orders": True,
        "enable_invoicing": True,
        "enable_analytics": True,
        "enable_reports": True,
        "email_header": "Welcome to our system",
        "email_footer": "Best regards, Team",
        "invoice_email_template": "Your invoice is ready",
        "enable_sms": False,
        "sms_provider": "Twilio"
    },
    "automation": {
        "auto_approve_orders": 1000,
        "require_manager_approval": False,
        "approval_timeout_days": 7,
        "daily_reports": True,
        "weekly_summary": True,
        "low_stock_alerts": True,
        "auto_return_reminder": True,
        "overdue_escalation": True,
        "auto_invoice_generation": False,
        "backup_schedule": "Daily",
        "report_schedule": "Weekly"
    },
    "data_admin": {
        "auto_backup": True,
        "backup_retention_days": 30,
        "backup_location": "./backups",
        "default_export_format": "Excel",
        "include_images": True
    },
    "integrations": {
        "accounting_integration": False,
        "erp_system": "Custom",
        "sync_frequency": "Daily",
        "api_rate_limit": 100,
        "webhook_notifications": False
    }
}

def ensure_settings_file():
    """Ensure settings file exists with default values"""
    if not SETTINGS_FILE.exists():
        SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(DEFAULT_SETTINGS, f, indent=2)

def load_settings():
    """Load settings from file"""
    ensure_settings_file()
    try:
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return DEFAULT_SETTINGS

def save_settings(settings: Dict[str, Any]):
    """Save settings to file"""
    ensure_settings_file()
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

@router.get("/")
async def get_settings():
    """Get all settings"""
    try:
        settings = load_settings()
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load settings: {str(e)}")

@router.get("")
async def get_settings_without_slash():
    """Get all settings (without trailing slash)"""
    return await get_settings()

@router.get("/{category}")
async def get_category_settings(category: str):
    """Get settings for a specific category"""
    try:
        settings = load_settings()
        if category not in settings:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
        return {"success": True, "settings": settings[category]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load category settings: {str(e)}")

@router.post("/")
async def update_all_settings(settings_data: SettingsModel):
    """Update all settings"""
    try:
        save_settings(settings_data.settings)
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.post("/{category}")
async def update_category_settings(category: str, settings_data: Dict[str, Any]):
    """Update settings for a specific category"""
    try:
        current_settings = load_settings()
        if category not in current_settings:
            current_settings[category] = {}
        
        current_settings[category].update(settings_data)
        save_settings(current_settings)
        
        return {"success": True, "message": f"Category '{category}' settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update category settings: {str(e)}")

@router.put("/{category}/{key}")
async def update_single_setting(category: str, key: str, setting_update: SettingUpdate):
    """Update a single setting"""
    try:
        current_settings = load_settings()
        if category not in current_settings:
            current_settings[category] = {}
        
        current_settings[category][key] = setting_update.value
        save_settings(current_settings)
        
        return {"success": True, "message": f"Setting '{key}' in category '{category}' updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update setting: {str(e)}")

@router.delete("/{category}/{key}")
async def delete_setting(category: str, key: str):
    """Delete a specific setting"""
    try:
        current_settings = load_settings()
        if category not in current_settings or key not in current_settings[category]:
            raise HTTPException(status_code=404, detail=f"Setting '{key}' in category '{category}' not found")
        
        del current_settings[category][key]
        save_settings(current_settings)
        
        return {"success": True, "message": f"Setting '{key}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete setting: {str(e)}")

@router.post("/reset")
async def reset_settings():
    """Reset all settings to default values"""
    try:
        save_settings(DEFAULT_SETTINGS)
        return {"success": True, "message": "Settings reset to defaults successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset settings: {str(e)}")

@router.post("/reset/{category}")
async def reset_category_settings(category: str):
    """Reset a category to default values"""
    try:
        if category not in DEFAULT_SETTINGS:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found in defaults")
        
        current_settings = load_settings()
        current_settings[category] = DEFAULT_SETTINGS[category].copy()
        save_settings(current_settings)
        
        return {"success": True, "message": f"Category '{category}' reset to defaults successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset category: {str(e)}")

@router.get("/export")
async def export_settings():
    """Export all settings"""
    try:
        settings = load_settings()
        return {"success": True, "settings": settings, "message": "Settings exported successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export settings: {str(e)}")

@router.post("/import")
async def import_settings(settings_data: SettingsModel):
    """Import settings from uploaded data"""
    try:
        # Validate imported settings against expected structure
        imported_settings = settings_data.settings
        
        # Merge with current settings to preserve any missing categories
        current_settings = load_settings()
        for category, category_settings in imported_settings.items():
            if category in DEFAULT_SETTINGS:
                current_settings[category] = category_settings
        
        save_settings(current_settings)
        return {"success": True, "message": "Settings imported successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import settings: {str(e)}")

@router.post("/category")
async def save_category_settings(category_data: Dict[str, Any]):
    """Save category settings (alternative endpoint)"""
    try:
        category = category_data.get('category')
        settings_data = category_data.get('settings', {})
        
        if not category:
            raise HTTPException(status_code=400, detail="Category is required")
        
        return await update_category_settings(category, settings_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save category settings: {str(e)}")

@router.post("/validate")
async def validate_settings(settings_data: Dict[str, Any]):
    """Validate settings without saving"""
    try:
        # Basic validation - check if required fields exist
        errors = []
        
        # Check organization settings
        if 'organization' in settings_data:
            org = settings_data['organization']
            if not org.get('company_name'):
                errors.append("Company name is required")
            if not org.get('contact_email'):
                errors.append("Contact email is required")
        
        # Check users_control settings
        if 'users_control' in settings_data:
            users = settings_data['users_control']
            if users.get('max_users', 0) <= 0:
                errors.append("Max users must be greater than 0")
        
        if errors:
            return {"success": False, "errors": errors}
        
        return {"success": True, "message": "Settings validation passed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate settings: {str(e)}")

@router.get("/test/{test_type}")
async def test_setting(test_type: str):
    """Test specific setting configurations"""
    try:
        settings = load_settings()
        
        if test_type == "email":
            # Test email configuration
            email_settings = settings.get('customization', {})
            if email_settings.get('email_header') and email_settings.get('email_footer'):
                return {"success": True, "message": "Email configuration is valid"}
            else:
                return {"success": False, "message": "Email configuration is incomplete"}
        
        elif test_type == "backup":
            # Test backup configuration
            data_settings = settings.get('data_admin', {})
            if data_settings.get('auto_backup') and data_settings.get('backup_location'):
                return {"success": True, "message": "Backup configuration is valid"}
            else:
                return {"success": False, "message": "Backup configuration is incomplete"}
        
        elif test_type == "integration":
            # Test integration settings
            integration_settings = settings.get('integrations', {})
            if integration_settings.get('erp_system'):
                return {"success": True, "message": "Integration configuration is valid"}
            else:
                return {"success": False, "message": "Integration configuration is incomplete"}
        
        else:
            return {"success": False, "message": f"Unknown test type: {test_type}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test setting: {str(e)}")