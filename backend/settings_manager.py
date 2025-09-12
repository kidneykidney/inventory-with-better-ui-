"""
Settings Manager for Inventory Management System
Handles all application configuration with database persistence
"""
import json
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, asdict
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

# Setup logging
logger = logging.getLogger(__name__)

@dataclass
class DatabaseSettings:
    """Database configuration settings"""
    host: str = "localhost"
    port: int = 5432
    database: str = "inventory_management"
    username: str = "postgres"
    password: str = "gugan@2022"
    connection_timeout: int = 30
    command_timeout: int = 60
    max_connections: int = 20
    ssl_mode: str = "prefer"
    enable_logging: bool = True

@dataclass
class OCRSettings:
    """OCR processing configuration"""
    tesseract_path: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    confidence_threshold: float = 0.7
    processing_timeout: int = 30
    max_image_size_mb: int = 10
    supported_formats: List[str] = None
    ocr_language: str = "eng"
    enable_preprocessing: bool = True
    fallback_enabled: bool = True
    
    def __post_init__(self):
        if self.supported_formats is None:
            self.supported_formats = ["jpg", "jpeg", "png", "pdf", "tiff", "bmp"]

@dataclass
class FileUploadSettings:
    """File upload and storage settings"""
    max_file_size_mb: int = 10
    upload_directory: str = "uploads"
    allowed_image_formats: List[str] = None
    allowed_document_formats: List[str] = None
    enable_virus_scan: bool = False
    compress_images: bool = True
    generate_thumbnails: bool = True
    cleanup_temp_files: bool = True
    
    def __post_init__(self):
        if self.allowed_image_formats is None:
            self.allowed_image_formats = ["jpg", "jpeg", "png", "gif", "bmp", "tiff"]
        if self.allowed_document_formats is None:
            self.allowed_document_formats = ["pdf", "doc", "docx", "xls", "xlsx"]

@dataclass
class SecuritySettings:
    """Security and authentication settings"""
    enable_cors: bool = True
    cors_origins: List[str] = None
    api_rate_limit: int = 100  # requests per minute
    session_timeout_minutes: int = 60
    require_https: bool = False
    enable_api_keys: bool = False
    password_min_length: int = 8
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 15
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ["http://localhost:3000", "http://localhost:8000"]

@dataclass
class ApplicationSettings:
    """General application configuration"""
    app_name: str = "Inventory Management System"
    app_version: str = "1.0.0"
    company_name: str = "University Equipment Center"
    company_email: str = "equipment@university.edu"
    company_phone: str = "(555) 123-4567"
    default_currency: str = "INR"
    date_format: str = "%Y-%m-%d"
    time_format: str = "%H:%M:%S"
    timezone: str = "UTC"
    items_per_page: int = 20
    enable_dark_theme: bool = True

@dataclass
class NotificationSettings:
    """Notification and alert configuration"""
    email_enabled: bool = False
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    admin_email: str = "admin@university.edu"
    log_level: str = "INFO"
    enable_console_logging: bool = True
    enable_file_logging: bool = True
    log_file_path: str = "logs/application.log"
    log_rotation_days: int = 30

@dataclass
class BusinessSettings:
    """Business logic and operational settings"""
    invoice_number_prefix: str = "INV"
    invoice_number_format: str = "{prefix}-{year}-{sequence:04d}"
    default_departments: List[str] = None
    default_item_categories: List[str] = None
    default_invoice_type: str = "lending"
    auto_generate_barcodes: bool = True
    require_approval_over_amount: float = 1000.0
    default_loan_duration_days: int = 30
    enable_overdue_alerts: bool = True
    
    def __post_init__(self):
        if self.default_departments is None:
            self.default_departments = [
                "Computer Science", "Biology", "Chemistry", "Physics", 
                "Engineering", "Mathematics", "Business", "Arts", "Medicine"
            ]
        if self.default_item_categories is None:
            self.default_item_categories = [
                "Microscopes", "Laboratory Equipment", "Computer Hardware",
                "Scientific Instruments", "Audio Visual", "Tools", "Books"
            ]

@dataclass
class PerformanceSettings:
    """Performance and optimization settings"""
    enable_caching: bool = True
    cache_ttl_seconds: int = 300
    enable_compression: bool = True
    max_batch_size: int = 1000
    database_pool_size: int = 10
    api_timeout_seconds: int = 30
    enable_query_optimization: bool = True
    background_task_workers: int = 2

class SettingsManager:
    """
    Centralized settings management with database persistence
    """
    
    def __init__(self, db_manager=None):
        self.db_manager = db_manager
        self._settings_cache = {}
        self._initialized = False
        
        # Default settings objects
        self.database = DatabaseSettings()
        self.ocr = OCRSettings()
        self.file_upload = FileUploadSettings()
        self.security = SecuritySettings()
        self.application = ApplicationSettings()
        self.notifications = NotificationSettings()
        self.business = BusinessSettings()
        self.performance = PerformanceSettings()
        
        self._init_database_table()
        self.load_all_settings()
    
    def _init_database_table(self):
        """Initialize settings table in database"""
        if not self.db_manager:
            return
            
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS system_settings (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            key VARCHAR(100) NOT NULL,
            value TEXT NOT NULL,
            data_type VARCHAR(20) NOT NULL DEFAULT 'string',
            description TEXT,
            is_sensitive BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(category, key)
        );
        
        CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
        CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(category, key);
        """
        
        try:
            if self.db_manager.connection:
                cursor = self.db_manager.connection.cursor()
                cursor.execute(create_table_sql)
                self.db_manager.connection.commit()
                cursor.close()
                logger.info("Settings table initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize settings table: {e}")
    
    def load_all_settings(self):
        """Load all settings from database"""
        try:
            settings_data = self._load_from_database()
            if settings_data:
                self._apply_settings_data(settings_data)
            else:
                # No settings in database, save defaults
                self.save_all_settings()
            self._initialized = True
            logger.info("Settings loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load settings: {e}")
            # Use defaults if loading fails
            self._initialized = True
    
    def save_all_settings(self):
        """Save all current settings to database"""
        try:
            all_settings = {
                'database': asdict(self.database),
                'ocr': asdict(self.ocr),
                'file_upload': asdict(self.file_upload),
                'security': asdict(self.security),
                'application': asdict(self.application),
                'notifications': asdict(self.notifications),
                'business': asdict(self.business),
                'performance': asdict(self.performance)
            }
            
            for category, settings in all_settings.items():
                for key, value in settings.items():
                    self._save_setting(category, key, value)
            
            logger.info("All settings saved successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")
            return False
    
    def get_setting(self, category: str, key: str, default=None):
        """Get a specific setting value"""
        try:
            if hasattr(self, category):
                category_obj = getattr(self, category)
                if hasattr(category_obj, key):
                    return getattr(category_obj, key)
            return default
        except Exception as e:
            logger.error(f"Failed to get setting {category}.{key}: {e}")
            return default
    
    def set_setting(self, category: str, key: str, value: Any):
        """Set a specific setting value and save to database"""
        try:
            if hasattr(self, category):
                category_obj = getattr(self, category)
                if hasattr(category_obj, key):
                    setattr(category_obj, key, value)
                    self._save_setting(category, key, value)
                    return True
            return False
        except Exception as e:
            logger.error(f"Failed to set setting {category}.{key}: {e}")
            return False
    
    def get_category_settings(self, category: str) -> Dict[str, Any]:
        """Get all settings for a specific category"""
        try:
            if hasattr(self, category):
                return asdict(getattr(self, category))
            return {}
        except Exception as e:
            logger.error(f"Failed to get category settings {category}: {e}")
            return {}
    
    def update_category_settings(self, category: str, settings: Dict[str, Any]):
        """Update multiple settings in a category"""
        try:
            if not hasattr(self, category):
                return False
                
            category_obj = getattr(self, category)
            updated = []
            
            for key, value in settings.items():
                if hasattr(category_obj, key):
                    setattr(category_obj, key, value)
                    self._save_setting(category, key, value)
                    updated.append(key)
            
            logger.info(f"Updated {len(updated)} settings in category {category}")
            return True
        except Exception as e:
            logger.error(f"Failed to update category settings {category}: {e}")
            return False
    
    def reset_category_to_defaults(self, category: str):
        """Reset a category to default values"""
        try:
            if category == 'database':
                self.database = DatabaseSettings()
            elif category == 'ocr':
                self.ocr = OCRSettings()
            elif category == 'file_upload':
                self.file_upload = FileUploadSettings()
            elif category == 'security':
                self.security = SecuritySettings()
            elif category == 'application':
                self.application = ApplicationSettings()
            elif category == 'notifications':
                self.notifications = NotificationSettings()
            elif category == 'business':
                self.business = BusinessSettings()
            elif category == 'performance':
                self.performance = PerformanceSettings()
            else:
                return False
            
            # Save the reset values
            category_settings = asdict(getattr(self, category))
            for key, value in category_settings.items():
                self._save_setting(category, key, value)
            
            logger.info(f"Reset category {category} to defaults")
            return True
        except Exception as e:
            logger.error(f"Failed to reset category {category}: {e}")
            return False
    
    def export_settings(self) -> Dict[str, Any]:
        """Export all settings as a dictionary"""
        try:
            return {
                'database': asdict(self.database),
                'ocr': asdict(self.ocr),
                'file_upload': asdict(self.file_upload),
                'security': asdict(self.security),
                'application': asdict(self.application),
                'notifications': asdict(self.notifications),
                'business': asdict(self.business),
                'performance': asdict(self.performance),
                'exported_at': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to export settings: {e}")
            return {}
    
    def import_settings(self, settings_data: Dict[str, Any]) -> bool:
        """Import settings from a dictionary"""
        try:
            for category, settings in settings_data.items():
                if category == 'exported_at':
                    continue
                if hasattr(self, category) and isinstance(settings, dict):
                    self.update_category_settings(category, settings)
            
            logger.info("Settings imported successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to import settings: {e}")
            return False
    
    def validate_settings(self) -> Dict[str, List[str]]:
        """Validate all settings and return any errors"""
        errors = {}
        
        # Validate database settings
        db_errors = []
        if not self.database.host:
            db_errors.append("Database host is required")
        if self.database.port < 1 or self.database.port > 65535:
            db_errors.append("Database port must be between 1 and 65535")
        if not self.database.database:
            db_errors.append("Database name is required")
        if not self.database.username:
            db_errors.append("Database username is required")
        if errors:
            errors['database'] = db_errors
        
        # Validate OCR settings
        ocr_errors = []
        if self.ocr.confidence_threshold < 0 or self.ocr.confidence_threshold > 1:
            ocr_errors.append("OCR confidence threshold must be between 0 and 1")
        if self.ocr.processing_timeout < 1:
            ocr_errors.append("OCR processing timeout must be positive")
        if ocr_errors:
            errors['ocr'] = ocr_errors
        
        # Validate file upload settings
        upload_errors = []
        if self.file_upload.max_file_size_mb < 1:
            upload_errors.append("Maximum file size must be positive")
        if upload_errors:
            errors['file_upload'] = upload_errors
        
        # Validate application settings
        app_errors = []
        if not self.application.app_name:
            app_errors.append("Application name is required")
        if self.application.items_per_page < 1:
            app_errors.append("Items per page must be positive")
        if app_errors:
            errors['application'] = app_errors
        
        return errors
    
    def _load_from_database(self) -> Optional[Dict[str, Dict[str, Any]]]:
        """Load settings from database"""
        if not self.db_manager or not self.db_manager.connection:
            return None
            
        try:
            cursor = self.db_manager.connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT category, key, value, data_type FROM system_settings")
            rows = cursor.fetchall()
            cursor.close()
            
            settings_data = {}
            for row in rows:
                category = row['category']
                key = row['key']
                value = row['value']
                data_type = row['data_type']
                
                if category not in settings_data:
                    settings_data[category] = {}
                
                # Convert value based on data type
                if data_type == 'int':
                    value = int(value)
                elif data_type == 'float':
                    value = float(value)
                elif data_type == 'bool':
                    value = value.lower() in ('true', '1', 'yes')
                elif data_type == 'list':
                    value = json.loads(value)
                elif data_type == 'dict':
                    value = json.loads(value)
                # 'string' remains as is
                
                settings_data[category][key] = value
            
            return settings_data if settings_data else None
        except Exception as e:
            logger.error(f"Failed to load settings from database: {e}")
            return None
    
    def _save_setting(self, category: str, key: str, value: Any):
        """Save a single setting to database"""
        if not self.db_manager or not self.db_manager.connection:
            return
        
        try:
            # Determine data type and convert value
            if isinstance(value, bool):
                data_type = 'bool'
                db_value = str(value)
            elif isinstance(value, int):
                data_type = 'int'
                db_value = str(value)
            elif isinstance(value, float):
                data_type = 'float'
                db_value = str(value)
            elif isinstance(value, (list, dict)):
                data_type = 'list' if isinstance(value, list) else 'dict'
                db_value = json.dumps(value)
            else:
                data_type = 'string'
                db_value = str(value)
            
            # Determine if setting is sensitive
            sensitive_keys = ['password', 'api_key', 'secret', 'token']
            is_sensitive = any(sensitive in key.lower() for sensitive in sensitive_keys)
            
            cursor = self.db_manager.connection.cursor()
            
            # Use UPSERT (INSERT ... ON CONFLICT)
            upsert_sql = """
            INSERT INTO system_settings (category, key, value, data_type, is_sensitive, updated_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (category, key) 
            DO UPDATE SET 
                value = EXCLUDED.value,
                data_type = EXCLUDED.data_type,
                is_sensitive = EXCLUDED.is_sensitive,
                updated_at = CURRENT_TIMESTAMP
            """
            
            cursor.execute(upsert_sql, (category, key, db_value, data_type, is_sensitive))
            self.db_manager.connection.commit()
            cursor.close()
            
        except Exception as e:
            logger.error(f"Failed to save setting {category}.{key}: {e}")
    
    def _apply_settings_data(self, settings_data: Dict[str, Dict[str, Any]]):
        """Apply loaded settings data to settings objects"""
        try:
            for category, settings in settings_data.items():
                if hasattr(self, category):
                    category_obj = getattr(self, category)
                    for key, value in settings.items():
                        if hasattr(category_obj, key):
                            setattr(category_obj, key, value)
        except Exception as e:
            logger.error(f"Failed to apply settings data: {e}")

# Global settings instance
_settings_instance = None

def get_settings(db_manager=None) -> SettingsManager:
    """Get global settings instance"""
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = SettingsManager(db_manager)
    return _settings_instance

def init_settings(db_manager):
    """Initialize settings with database manager"""
    global _settings_instance
    _settings_instance = SettingsManager(db_manager)
    return _settings_instance
