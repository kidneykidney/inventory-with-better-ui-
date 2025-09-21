#!/usr/bin/env python3
"""
Complete Database Export Script
==============================
This script exports ALL data from both databases with complete schema and data.
"""

import os
import sys
import psycopg2
from datetime import datetime

def connect_to_database(database_name):
    """Connect to specified database"""
    try:
        connection = psycopg2.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database=database_name
        )
        return connection
    except Exception as e:
        print(f"❌ Error connecting to {database_name}: {e}")
        return None

def get_all_tables(connection):
    """Get all tables in the database"""
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        return tables
    except Exception as e:
        print(f"❌ Error getting tables: {e}")
        return []

def get_table_data(connection, table_name):
    """Get all data from a table"""
    try:
        cursor = connection.cursor()
        
        # Get column information
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position;
        """, (table_name,))
        columns = cursor.fetchall()
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]
        
        # Get actual data
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        cursor.close()
        return {
            'columns': columns,
            'row_count': row_count,
            'rows': rows
        }
    except Exception as e:
        print(f"❌ Error getting data from {table_name}: {e}")
        return None

def generate_create_table_sql(connection, table_name):
    """Generate CREATE TABLE statement"""
    try:
        cursor = connection.cursor()
        
        # Get table structure
        cursor.execute("""
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position;
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        # Get primary key info
        cursor.execute("""
            SELECT column_name
            FROM information_schema.key_column_usage kcu
            JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
            WHERE tc.table_name = %s 
            AND tc.constraint_type = 'PRIMARY KEY'
            ORDER BY kcu.ordinal_position;
        """, (table_name,))
        
        primary_keys = [row[0] for row in cursor.fetchall()]
        
        # Get foreign key info
        cursor.execute("""
            SELECT 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.key_column_usage kcu
            JOIN information_schema.constraint_column_usage ccu 
            ON kcu.constraint_name = ccu.constraint_name
            JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
            WHERE tc.table_name = %s 
            AND tc.constraint_type = 'FOREIGN KEY';
        """, (table_name,))
        
        foreign_keys = cursor.fetchall()
        
        cursor.close()
        
        # Generate CREATE TABLE SQL
        sql_parts = [f"CREATE TABLE {table_name} ("]
        
        column_definitions = []
        for col in columns:
            col_name, data_type, max_length, is_nullable, default_val = col
            
            # Build column definition
            col_def = f"    {col_name} {data_type.upper()}"
            
            if max_length and data_type in ['character varying', 'varchar', 'char']:
                col_def += f"({max_length})"
            
            if is_nullable == 'NO':
                col_def += " NOT NULL"
            
            if default_val:
                col_def += f" DEFAULT {default_val}"
            
            column_definitions.append(col_def)
        
        sql_parts.append(',\n'.join(column_definitions))
        
        # Add primary key
        if primary_keys:
            pk_columns = ', '.join(primary_keys)
            sql_parts.append(f",\n    PRIMARY KEY ({pk_columns})")
        
        sql_parts.append("\n);")
        
        create_table_sql = ''.join(sql_parts)
        
        # Add foreign keys as separate ALTER TABLE statements
        fk_statements = []
        for fk in foreign_keys:
            col_name, ref_table, ref_column = fk
            fk_statements.append(
                f"ALTER TABLE {table_name} ADD CONSTRAINT fk_{table_name}_{col_name} "
                f"FOREIGN KEY ({col_name}) REFERENCES {ref_table}({ref_column});"
            )
        
        return create_table_sql, fk_statements
        
    except Exception as e:
        print(f"❌ Error generating CREATE TABLE for {table_name}: {e}")
        return None, []

def generate_insert_statements(table_name, table_data):
    """Generate INSERT statements for table data"""
    if not table_data or not table_data['rows']:
        return []
    
    columns = [col[0] for col in table_data['columns']]
    column_list = ', '.join(columns)
    
    insert_statements = []
    
    for row in table_data['rows']:
        # Convert row values to SQL format
        values = []
        for val in row:
            if val is None:
                values.append('NULL')
            elif isinstance(val, str):
                # Escape single quotes
                escaped_val = val.replace("'", "''")
                values.append(f"'{escaped_val}'")
            elif isinstance(val, bool):
                values.append('TRUE' if val else 'FALSE')
            elif isinstance(val, (int, float)):
                values.append(str(val))
            else:
                # For other types (datetime, etc.), convert to string
                values.append(f"'{str(val)}'")
        
        values_list = ', '.join(values)
        insert_statements.append(f"INSERT INTO {table_name} ({column_list}) VALUES ({values_list});")
    
    return insert_statements

def export_database(database_name, output_file):
    """Export complete database with schema and data"""
    print(f"🔄 Exporting database: {database_name}")
    
    connection = connect_to_database(database_name)
    if not connection:
        return False
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"-- ================================================\n")
            f.write(f"-- COMPLETE DATABASE EXPORT: {database_name}\n")
            f.write(f"-- Generated on: {datetime.now()}\n")
            f.write(f"-- ================================================\n\n")
            
            # Write database creation
            f.write(f"-- Create database\n")
            f.write(f"CREATE DATABASE {database_name};\n")
            f.write(f"\\c {database_name};\n\n")
            
            # Get all tables
            tables = get_all_tables(connection)
            print(f"📋 Found {len(tables)} tables")
            
            # First pass: Create all tables
            f.write("-- ================================================\n")
            f.write("-- TABLE CREATION STATEMENTS\n")
            f.write("-- ================================================\n\n")
            
            all_foreign_keys = []
            
            for table in tables:
                print(f"📄 Processing table: {table}")
                
                # Get table structure
                create_sql, fk_statements = generate_create_table_sql(connection, table)
                if create_sql:
                    f.write(f"-- Table: {table}\n")
                    f.write(create_sql)
                    f.write("\n\n")
                    all_foreign_keys.extend(fk_statements)
            
            # Write foreign key constraints
            if all_foreign_keys:
                f.write("-- ================================================\n")
                f.write("-- FOREIGN KEY CONSTRAINTS\n")
                f.write("-- ================================================\n\n")
                for fk in all_foreign_keys:
                    f.write(fk + "\n")
                f.write("\n")
            
            # Second pass: Insert all data
            f.write("-- ================================================\n")
            f.write("-- DATA INSERTION STATEMENTS\n")
            f.write("-- ================================================\n\n")
            
            total_rows = 0
            for table in tables:
                table_data = get_table_data(connection, table)
                if table_data and table_data['rows']:
                    f.write(f"-- Data for table: {table} ({table_data['row_count']} rows)\n")
                    insert_statements = generate_insert_statements(table, table_data)
                    for stmt in insert_statements:
                        f.write(stmt + "\n")
                    f.write("\n")
                    total_rows += table_data['row_count']
                    print(f"✅ Exported {table_data['row_count']} rows from {table}")
                else:
                    f.write(f"-- No data in table: {table}\n\n")
            
            # Write summary
            f.write("-- ================================================\n")
            f.write("-- EXPORT SUMMARY\n")
            f.write("-- ================================================\n")
            f.write(f"-- Database: {database_name}\n")
            f.write(f"-- Tables: {len(tables)}\n")
            f.write(f"-- Total Rows: {total_rows}\n")
            f.write(f"-- Export Date: {datetime.now()}\n")
            f.write("-- ================================================\n")
            
            print(f"✅ Exported {len(tables)} tables with {total_rows} total rows")
        
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error exporting database {database_name}: {e}")
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("🗄️ COMPLETE DATABASE EXPORT")
    print("=" * 60)
    
    # List of databases to export
    databases = ['inventory_db', 'inventory_management']
    
    export_success = True
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for db_name in databases:
        output_file = f"COMPLETE_EXPORT_{db_name}_{timestamp}.sql"
        print(f"\n📦 Starting export of {db_name}...")
        
        if export_database(db_name, output_file):
            print(f"✅ Successfully exported {db_name} to {output_file}")
        else:
            print(f"❌ Failed to export {db_name}")
            export_success = False
    
    # Create a combined export file
    combined_file = f"COMPLETE_DATABASE_EXPORT_ALL_{timestamp}.sql"
    print(f"\n🔄 Creating combined export file: {combined_file}")
    
    try:
        with open(combined_file, 'w', encoding='utf-8') as combined:
            combined.write("-- ================================================\n")
            combined.write("-- COMPLETE DATABASE EXPORT - ALL DATABASES\n")
            combined.write(f"-- Generated on: {datetime.now()}\n")
            combined.write("-- ================================================\n\n")
            
            for db_name in databases:
                individual_file = f"COMPLETE_EXPORT_{db_name}_{timestamp}.sql"
                if os.path.exists(individual_file):
                    combined.write(f"-- ================================================\n")
                    combined.write(f"-- DATABASE: {db_name}\n")
                    combined.write(f"-- ================================================\n\n")
                    
                    with open(individual_file, 'r', encoding='utf-8') as individual:
                        combined.write(individual.read())
                    combined.write("\n\n")
        
        print(f"✅ Combined export created: {combined_file}")
        
    except Exception as e:
        print(f"❌ Error creating combined export: {e}")
        export_success = False
    
    if export_success:
        print("\n" + "=" * 60)
        print("🎉 COMPLETE DATABASE EXPORT FINISHED!")
        print("=" * 60)
        print(f"📁 Files created:")
        for db_name in databases:
            print(f"   - COMPLETE_EXPORT_{db_name}_{timestamp}.sql")
        print(f"   - {combined_file}")
        print("\n💾 All your data has been exported successfully!")
    else:
        print("\n❌ Export completed with errors!")
    
    return export_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)