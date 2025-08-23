#!/usr/bin/env python3
"""
College Incubation Inventory Management System
Project Data Viewer - Execute SQL queries and display formatted results
"""

import psycopg2
import psycopg2.extras
from datetime import datetime
import sys

def connect_to_database():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='inventory_management',
            user='postgres',
            password='gugan@2022',
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def execute_query(conn, query, title="Query Result"):
    """Execute a query and display formatted results"""
    try:
        cur = conn.cursor()
        cur.execute(query)
        results = cur.fetchall()
        
        print(f"\n{'='*60}")
        print(f"📊 {title}")
        print(f"{'='*60}")
        
        if not results:
            print("No data found.")
            return
        
        # Get column names
        colnames = [desc[0] for desc in cur.description]
        
        # Calculate column widths
        col_widths = {}
        for col in colnames:
            col_widths[col] = len(col)
        
        for row in results:
            for col in colnames:
                val_str = str(row[col]) if row[col] is not None else 'NULL'
                col_widths[col] = max(col_widths[col], len(val_str))
        
        # Print header
        header_parts = []
        separator_parts = []
        for col in colnames:
            width = min(col_widths[col], 25)  # Max width of 25
            header_parts.append(f"{col:<{width}}")
            separator_parts.append("-" * width)
        
        print(" | ".join(header_parts))
        print("-|-".join(separator_parts))
        
        # Print rows
        for row in results[:50]:  # Limit to first 50 rows
            row_parts = []
            for col in colnames:
                width = min(col_widths[col], 25)
                val = row[col] if row[col] is not None else 'NULL'
                val_str = str(val)
                if len(val_str) > 25:
                    val_str = val_str[:22] + "..."
                row_parts.append(f"{val_str:<{width}}")
            print(" | ".join(row_parts))
        
        if len(results) > 50:
            print(f"\n... and {len(results) - 50} more rows")
        
        print(f"\nTotal rows: {len(results)}")
        cur.close()
        
    except Exception as e:
        print(f"❌ Query execution failed: {e}")

def main():
    """Main function to display project data"""
    print("🏢 COLLEGE INCUBATION INVENTORY MANAGEMENT SYSTEM")
    print("📊 PROJECT DATA ANALYSIS")
    print(f"⏰ Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    conn = connect_to_database()
    if not conn:
        return
    
    try:
        # 1. Database Overview
        overview_query = """
        SELECT 
            'categories' as table_name, 
            COUNT(*) as record_count,
            'Product categories in the system' as description
        FROM categories
        UNION ALL
        SELECT 'products', COUNT(*), 'Inventory items available for lending' FROM products
        UNION ALL
        SELECT 'students', COUNT(*), 'Registered students who can borrow items' FROM students
        UNION ALL
        SELECT 'orders', COUNT(*), 'Borrowing requests and orders' FROM orders
        UNION ALL
        SELECT 'order_items', COUNT(*), 'Individual items within orders' FROM order_items
        ORDER BY table_name;
        """
        execute_query(conn, overview_query, "DATABASE OVERVIEW")
        
        # 2. Categories with Product Count
        categories_query = """
        SELECT 
            c.id,
            c.name as category_name,
            c.description,
            COUNT(p.id) as total_products,
            c.created_at::date as created_date
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name, c.description, c.created_at
        ORDER BY c.name;
        """
        execute_query(conn, categories_query, "CATEGORIES WITH PRODUCT COUNT")
        
        # 3. Products Inventory Summary
        products_query = """
        SELECT 
            p.id,
            p.name as product_name,
            p.sku,
            c.name as category,
            p.quantity_available,
            p.quantity_total,
            p.unit_price,
            p.status,
            p.location,
            CASE 
                WHEN p.quantity_available = 0 THEN '❌ OUT'
                WHEN p.quantity_available <= COALESCE(p.minimum_stock_level, 5) THEN '⚠️ LOW'
                ELSE '✅ OK'
            END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name;
        """
        execute_query(conn, products_query, "PRODUCTS INVENTORY")
        
        # 4. Students with Order Statistics
        students_query = """
        SELECT 
            s.id,
            s.name as student_name,
            s.email,
            s.department,
            s.year_of_study,
            s.is_active,
            COUNT(DISTINCT o.id) as total_orders,
            COALESCE(SUM(o.total_value), 0) as total_borrowed_value
        FROM students s
        LEFT JOIN orders o ON s.id = o.student_id
        GROUP BY s.id, s.name, s.email, s.department, s.year_of_study, s.is_active
        ORDER BY total_orders DESC, s.name;
        """
        execute_query(conn, students_query, "STUDENTS WITH ORDER STATISTICS")
        
        # 5. Orders Summary
        orders_query = """
        SELECT 
            o.order_number,
            s.name as student_name,
            o.status,
            o.total_items,
            o.total_value,
            o.requested_date::date,
            o.expected_return_date::date,
            CASE 
                WHEN o.status = 'approved' AND o.expected_return_date < CURRENT_DATE 
                THEN '⚠️ OVERDUE'
                ELSE '✅ ON TIME'
            END as return_status
        FROM orders o
        JOIN students s ON o.student_id = s.id
        ORDER BY o.requested_date DESC
        LIMIT 20;
        """
        execute_query(conn, orders_query, "RECENT ORDERS (Last 20)")
        
        # 6. Financial Summary
        financial_query = """
        SELECT 
            'Total Inventory Value' as metric,
            CONCAT('$', ROUND(SUM(quantity_available * unit_price), 2)) as value
        FROM products WHERE status = 'active'
        UNION ALL
        SELECT 
            'Active Orders Value',
            CONCAT('$', ROUND(COALESCE(SUM(total_value), 0), 2))
        FROM orders WHERE status IN ('pending', 'approved')
        UNION ALL
        SELECT 
            'Completed Orders Value',
            CONCAT('$', ROUND(COALESCE(SUM(total_value), 0), 2))
        FROM orders WHERE status = 'completed';
        """
        execute_query(conn, financial_query, "FINANCIAL SUMMARY")
        
        # 7. Low Stock Alert
        low_stock_query = """
        SELECT 
            p.name as product_name,
            p.sku,
            p.quantity_available,
            COALESCE(p.minimum_stock_level, 5) as min_level,
            p.unit_price,
            CASE 
                WHEN p.quantity_available = 0 THEN '🔴 CRITICAL'
                WHEN p.quantity_available <= 2 THEN '🟡 LOW'
                ELSE '🟠 MEDIUM'
            END as priority
        FROM products p
        WHERE p.quantity_available <= COALESCE(p.minimum_stock_level, 5)
          AND p.status = 'active'
        ORDER BY p.quantity_available ASC;
        """
        execute_query(conn, low_stock_query, "LOW STOCK ALERT")
        
        print(f"\n{'='*80}")
        print("✅ PROJECT DATA ANALYSIS COMPLETE")
        print(f"💡 Use the queries in 'project_data_queries.sql' for detailed analysis")
        print(f"{'='*80}")
        
    except Exception as e:
        print(f"❌ Error during data analysis: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    main()
