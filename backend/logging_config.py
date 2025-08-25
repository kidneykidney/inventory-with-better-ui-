import logging
import logging.handlers
import os
import sys
from datetime import datetime
import json
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add any extra fields
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'api_endpoint'):
            log_entry["api_endpoint"] = record.api_endpoint
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'duration'):
            log_entry["duration_ms"] = record.duration
        if hasattr(record, 'status_code'):
            log_entry["status_code"] = record.status_code
        if hasattr(record, 'ip_address'):
            log_entry["ip_address"] = record.ip_address
        
        return json.dumps(log_entry, default=str)

def setup_logging():
    """Configure logging for the inventory management system"""
    
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler with simple format for development
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)
    
    # File handler for all logs (rotating)
    all_logs_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(logs_dir, 'inventory_system.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    all_logs_handler.setFormatter(JSONFormatter())
    all_logs_handler.setLevel(logging.INFO)
    
    # File handler for error logs only
    error_logs_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(logs_dir, 'inventory_errors.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10
    )
    error_logs_handler.setFormatter(JSONFormatter())
    error_logs_handler.setLevel(logging.ERROR)
    
    # File handler for API access logs
    api_logs_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(logs_dir, 'inventory_api.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10
    )
    api_logs_handler.setFormatter(JSONFormatter())
    api_logs_handler.setLevel(logging.INFO)
    
    # Add handlers to root logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(all_logs_handler)
    root_logger.addHandler(error_logs_handler)
    
    # Create API-specific logger
    api_logger = logging.getLogger('inventory.api')
    api_logger.addHandler(api_logs_handler)
    api_logger.propagate = True  # Also send to root logger
    
    # Create database-specific logger
    db_logger = logging.getLogger('inventory.database')
    db_logger.setLevel(logging.INFO)
    
    # Suppress some noisy third-party loggers
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    
    return {
        'main': logging.getLogger('inventory.main'),
        'api': logging.getLogger('inventory.api'),
        'database': logging.getLogger('inventory.database'),
        'auth': logging.getLogger('inventory.auth'),
        'orders': logging.getLogger('inventory.orders'),
        'products': logging.getLogger('inventory.products'),
        'students': logging.getLogger('inventory.students')
    }

# Performance monitoring decorator
def log_performance(logger_name: str = 'inventory.api'):
    """Decorator to log function performance"""
    def decorator(func):
        import asyncio
        import time
        from functools import wraps
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger = logging.getLogger(logger_name)
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000  # Convert to milliseconds
                
                logger.info(
                    f"Function {func.__name__} completed successfully",
                    extra={
                        'function': func.__name__,
                        'duration': duration,
                        'status': 'success'
                    }
                )
                return result
                
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                logger.error(
                    f"Function {func.__name__} failed: {str(e)}",
                    extra={
                        'function': func.__name__,
                        'duration': duration,
                        'status': 'error',
                        'error': str(e)
                    },
                    exc_info=True
                )
                raise
                
        # Check if function is async
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            # For sync functions, use regular wrapper
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                logger = logging.getLogger(logger_name)
                start_time = time.time()
                
                try:
                    result = func(*args, **kwargs)
                    duration = (time.time() - start_time) * 1000
                    
                    logger.info(
                        f"Function {func.__name__} completed successfully",
                        extra={
                            'function': func.__name__,
                            'duration': duration,
                            'status': 'success'
                        }
                    )
                    return result
                    
                except Exception as e:
                    duration = (time.time() - start_time) * 1000
                    logger.error(
                        f"Function {func.__name__} failed: {str(e)}",
                        extra={
                            'function': func.__name__,
                            'duration': duration,
                            'status': 'error',
                            'error': str(e)
                        },
                        exc_info=True
                    )
                    raise
            return sync_wrapper
    return decorator

# Initialize loggers when module is imported
LOGGERS = setup_logging()

# Export commonly used loggers
main_logger = LOGGERS['main']
api_logger = LOGGERS['api']
db_logger = LOGGERS['database']
