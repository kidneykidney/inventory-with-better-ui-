"""
Script to install invoice system to database
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os

def install_invoice_system():
    """Install invoice system to the database"""
    connection_params = {
        'host': 'localhost',
        'database': 'inventory_management',
        'user': 'postgres',
        'password': 'gugan@2022',
        'port': 5432
    }
    
    try:
        # Connect to database
        conn = psycopg2.connect(**connection_params)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # Read and execute the invoice schema
        schema_file = os.path.join(os.path.dirname(__file__), 'invoice_schema.sql')
        
        if os.path.exists(schema_file):
            with open(schema_file, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
            
            print("Executing invoice schema...")
            cursor.execute(schema_sql)
            print("Invoice schema installed successfully!")
        else:
            print("Invoice schema file not found!")
            return False
        
        # Verify installation
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'invoices'")
        result = cursor.fetchone()
        
        if result and result[0] > 0:
            print("✓ Invoices table created successfully")
        else:
            print("✗ Failed to create invoices table")
            return False
        
        # Check other tables
        tables_to_check = ['invoice_items', 'invoice_images', 'student_acknowledgments', 'invoice_transactions']
        for table in tables_to_check:
            cursor.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{table}'")
            result = cursor.fetchone()
            if result and result[0] > 0:
                print(f"✓ {table} table created successfully")
            else:
                print(f"✗ Failed to create {table} table")
        
        # Create sample data if orders exist
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'approved'")
        approved_orders = cursor.fetchone()[0]
        
        if approved_orders > 0:
            print(f"Found {approved_orders} approved orders. Creating sample invoices...")
            
            # Create invoices for approved orders
            cursor.execute("""
                INSERT INTO invoices (
                    order_id,
                    student_id,
                    invoice_type,
                    status,
                    total_items,
                    due_date,
                    issued_by,
                    notes
                )
                SELECT 
                    o.id,
                    o.student_id,
                    'lending',
                    'issued',
                    o.total_items,
                    o.expected_return_date,
                    'System Administrator',
                    'Auto-generated invoice for order ' || o.order_number
                FROM orders o
                WHERE o.status = 'approved'
                AND NOT EXISTS (
                    SELECT 1 FROM invoices i WHERE i.order_id = o.id
                )
            """)
            
            cursor.execute("SELECT COUNT(*) FROM invoices")
            invoice_count = cursor.fetchone()[0]
            print(f"✓ Created {invoice_count} invoices")
        
        # Create sample acknowledgments
        cursor.execute("""
            INSERT INTO student_acknowledgments (
                invoice_id,
                student_id,
                acknowledgment_type,
                acknowledgment_method,
                acknowledgment_location,
                notes
            )
            SELECT 
                i.id,
                i.student_id,
                'receipt',
                'digital_signature',
                'Equipment Room',
                'Sample acknowledgment for testing'
            FROM invoices i
            WHERE NOT EXISTS (
                SELECT 1 FROM student_acknowledgments sa WHERE sa.invoice_id = i.id
            )
            LIMIT 3
        """)
        
        cursor.execute("SELECT COUNT(*) FROM student_acknowledgments")
        ack_count = cursor.fetchone()[0]
        print(f"✓ Created {ack_count} sample acknowledgments")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Invoice system installation completed successfully!")
        print("\nYou can now:")
        print("1. Access Invoice Management from the main menu")
        print("2. Upload physical invoice photos using camera")
        print("3. View invoice dashboard and analytics")
        print("4. Track student acknowledgments")
        
        return True
        
    except Exception as e:
        print(f"Error installing invoice system: {e}")
        return False

if __name__ == "__main__":
    install_invoice_system()
