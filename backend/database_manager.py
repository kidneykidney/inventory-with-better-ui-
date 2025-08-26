import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Dict, List, Optional, Any
import logging
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection_params = {
            'host': 'localhost',
            'database': 'inventory_management',
            'user': 'postgres',
            'password': 'gugan@2022',
            'port': 5432
        }
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**self.connection_params)
            self.connection.autocommit = True
            logger.info("Connected to PostgreSQL database successfully")
            return True
        except psycopg2.Error as e:
            logger.error(f"Error connecting to PostgreSQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Execute SELECT query and return results"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            return [dict(row) for row in results]
        except psycopg2.Error as e:
            logger.error(f"Error executing query: {e}")
            return []

    def fetch_one(self, query: str, params: tuple = None) -> Optional[Dict]:
        """Execute SELECT query and return first result"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            result = cursor.fetchone()
            cursor.close()
            return dict(result) if result else None
        except psycopg2.Error as e:
            logger.error(f"Error executing query: {e}")
            return None
    
    def execute_command(self, command: str, params: tuple = None) -> bool:
        """Execute INSERT, UPDATE, DELETE commands"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(command, params)
            self.connection.commit()
            cursor.close()
            return True
        except psycopg2.Error as e:
            logger.error(f"Error executing command: {e}")
            self.connection.rollback()
            # Re-raise the exception so the calling code can handle it specifically
            raise e
    
    def create_database_and_tables(self):
        """Create database and all tables"""
        try:
            # First connect to postgres database to create our database
            temp_params = self.connection_params.copy()
            temp_params['database'] = 'postgres'
            
            temp_conn = psycopg2.connect(**temp_params)
            temp_conn.autocommit = True
            temp_cursor = temp_conn.cursor()
            
            # Create database if it doesn't exist
            temp_cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'inventory_management'")
            if not temp_cursor.fetchone():
                temp_cursor.execute("CREATE DATABASE inventory_management")
                logger.info("Database 'inventory_management' created successfully")
            else:
                logger.info("Database 'inventory_management' already exists")
            
            temp_cursor.close()
            temp_conn.close()
            
            # Now connect to our database and create tables
            if self.connect():
                # Read and execute schema file
                schema_path = os.path.join(os.path.dirname(__file__), 'unified_inventory_schema.sql')
                with open(schema_path, 'r') as file:
                    schema_sql = file.read()
                
                cursor = self.connection.cursor()
                cursor.execute(schema_sql)
                cursor.close()
                
                logger.info("Database schema created successfully")
                return True
                
        except psycopg2.Error as e:
            logger.error(f"Error creating database and tables: {e}")
            return False
    
    def add_sample_products(self):
        """Add sample products to the database"""
        sample_products = [
            {
                'name': 'Arduino Uno R3',
                'description': 'Microcontroller board based on the ATmega328P',
                'category': 'Microcontrollers',
                'sku': 'ARD-UNO-R3',
                'quantity_total': 50,
                'quantity_available': 45,
                'is_returnable': True,
                'unit_price': 25.99,
                'location': 'Shelf A-1',
                'minimum_stock_level': 10,
                'specifications': '{"voltage": "5V", "digital_pins": 14, "analog_pins": 6}',
                'tags': ['arduino', 'microcontroller', 'development']
            },
            {
                'name': 'Raspberry Pi 4 Model B',
                'description': 'Single-board computer with ARM Cortex-A72 quad-core processor',
                'category': 'Microcontrollers',
                'sku': 'RPI-4B-4GB',
                'quantity_total': 20,
                'quantity_available': 18,
                'is_returnable': True,
                'unit_price': 75.00,
                'location': 'Shelf A-2',
                'minimum_stock_level': 5,
                'specifications': '{"ram": "4GB", "cpu": "ARM Cortex-A72", "wifi": true}',
                'tags': ['raspberry-pi', 'computer', 'linux']
            },
            {
                'name': 'Ultrasonic Sensor HC-SR04',
                'description': 'Distance measuring sensor module',
                'category': 'Sensors',
                'sku': 'SENS-HC-SR04',
                'quantity_total': 100,
                'quantity_available': 85,
                'is_returnable': True,
                'unit_price': 3.50,
                'location': 'Shelf B-1',
                'minimum_stock_level': 20,
                'specifications': '{"range": "2cm-4m", "voltage": "5V", "frequency": "40kHz"}',
                'tags': ['sensor', 'ultrasonic', 'distance']
            },
            {
                'name': 'Resistor Kit (500pcs)',
                'description': 'Assorted resistor values kit',
                'category': 'Components',
                'sku': 'COMP-RES-KIT-500',
                'quantity_total': 10,
                'quantity_available': 8,
                'is_returnable': False,  # Consumable
                'unit_price': 15.00,
                'location': 'Drawer C-1',
                'minimum_stock_level': 2,
                'specifications': '{"values": "1Ω-1MΩ", "tolerance": "5%", "power": "0.25W"}',
                'tags': ['resistor', 'components', 'kit']
            },
            {
                'name': 'Breadboard 830 points',
                'description': 'Solderless prototyping breadboard',
                'category': 'Tools',
                'sku': 'TOOL-BB-830',
                'quantity_total': 75,
                'quantity_available': 60,
                'is_returnable': True,
                'unit_price': 5.99,
                'location': 'Shelf D-1',
                'minimum_stock_level': 15,
                'specifications': '{"tie_points": 830, "size": "165x55mm"}',
                'tags': ['breadboard', 'prototyping', 'tools']
            },
            {
                'name': 'Jumper Wires (40pcs)',
                'description': 'Male to Male jumper wires',
                'category': 'Cables & Connectors',
                'sku': 'CABLE-JMP-MM-40',
                'quantity_total': 50,
                'quantity_available': 35,
                'is_returnable': False,  # Consumable
                'unit_price': 2.99,
                'location': 'Drawer E-1',
                'minimum_stock_level': 10,
                'specifications': '{"length": "20cm", "connector": "male-male"}',
                'tags': ['jumper', 'wires', 'connecting']
            }
        ]
        
        try:
            for product in sample_products:
                # Get category ID
                category_query = "SELECT id FROM categories WHERE name = %s"
                category_result = self.execute_query(category_query, (product['category'],))
                
                if category_result:
                    category_id = category_result[0]['id']
                    
                    insert_query = """
                    INSERT INTO products (
                        name, description, category_id, sku, quantity_total, 
                        quantity_available, is_returnable, unit_price, location, 
                        minimum_stock_level, specifications, tags
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
                    ON CONFLICT (sku) DO NOTHING
                    """
                    
                    self.execute_command(insert_query, (
                        product['name'], product['description'], category_id,
                        product['sku'], product['quantity_total'], 
                        product['quantity_available'], product['is_returnable'],
                        product['unit_price'], product['location'],
                        product['minimum_stock_level'], product['specifications'],
                        product['tags']
                    ))
            
            logger.info("Sample products added successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error adding sample products: {e}")
            return False

# Database service functions
db = DatabaseManager()

def init_database():
    """Initialize database with schema and sample data"""
    if db.create_database_and_tables():
        db.add_sample_products()
        return True
    return False

def get_db():
    """Get database connection"""
    if not db.connection:
        db.connect()
    return db

# FastAPI dependency injection
db_manager = DatabaseManager()

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    try:
        if not db_manager.connection or db_manager.connection.closed:
            db_manager.connect()
        yield db_manager
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise
    # Keep connection open for reuse

def get_db():
    """FastAPI dependency for database connection"""
    if not db_manager.connection or db_manager.connection.closed:
        if not db_manager.connect():
            raise Exception("Failed to connect to database")
    return db_manager

if __name__ == "__main__":
    print("Setting up inventory management database...")
    if init_database():
        print("Database setup completed successfully!")
    else:
        print("Database setup failed!")
