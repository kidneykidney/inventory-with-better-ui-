import requests
import json

# Check multiple invoice types to understand different data structures
try:
    response = requests.get('http://127.0.0.1:8000/api/invoices')
    if response.status_code == 200:
        invoices = response.json()
        
        # Check LEN010 specifically
        for invoice in invoices:
            if invoice.get('invoice_number') == 'LEN010':
                print('=== LEN010 Analysis ===')
                print('Invoice type:', invoice.get('invoice_type', 'unknown'))
                print('Status:', invoice.get('status', 'unknown'))
                print('Creation method:', invoice.get('notes', 'No notes'))
                
                # Get detailed invoice data
                detail_response = requests.get(f'http://127.0.0.1:8000/api/invoices/{invoice["id"]}')
                if detail_response.status_code == 200:
                    detail = detail_response.json()
                    print('Items count:', len(detail.get('items', [])))
                    print('Order ID:', detail.get('order_id', 'None'))
                    print('Manual creation?:', 'manual' in str(detail.get('notes', '')).lower())
                    
                    if detail.get('items'):
                        print('\nItems found:')
                        for item in detail['items']:
                            print(f'- {item.get("product_name", "N/A")}: {item.get("quantity", 0)} units')
                    else:
                        print('\nNo items in this invoice')
                        
                        # Check if this invoice has an order_id and check the order items
                        if detail.get('order_id'):
                            print('\nChecking associated order items...')
                            order_response = requests.get(f'http://127.0.0.1:8000/api/orders/{detail["order_id"]}')
                            if order_response.status_code == 200:
                                order_data = order_response.json()
                                print(f'Order has {len(order_data.get("items", []))} items')
                                for item in order_data.get('items', []):
                                    print(f'- Order item: {item.get("product_name", "N/A")}: {item.get("quantity", 0)} units')
                break
        
        # Also check other invoice types for comparison
        print('\n=== Other Invoice Types ===')
        invoice_types = {}
        for invoice in invoices[:5]:  # Check first 5 invoices
            inv_type = 'manual' if 'manual' in str(invoice.get('notes', '')).lower() else 'auto'
            if inv_type not in invoice_types:
                invoice_types[inv_type] = []
            invoice_types[inv_type].append(invoice['invoice_number'])
        
        for inv_type, numbers in invoice_types.items():
            print(f'{inv_type.upper()} invoices: {", ".join(numbers)}')
            
    else:
        print('Failed to get invoices:', response.status_code)
        
except Exception as e:
    print('Error:', e)