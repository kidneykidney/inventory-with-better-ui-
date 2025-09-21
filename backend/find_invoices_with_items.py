import requests

# Find an invoice that has items to test the enhanced logic
try:
    response = requests.get('http://127.0.0.1:8000/api/invoices')
    if response.status_code == 200:
        invoices = response.json()
        
        # Check each invoice for items
        for invoice in invoices[:10]:  # Check first 10
            invoice_id = invoice['id']
            detail_response = requests.get(f'http://127.0.0.1:8000/api/invoices/{invoice_id}')
            if detail_response.status_code == 200:
                detail = detail_response.json()
                items_count = len(detail.get('items', []))
                has_order = detail.get('order_id') is not None
                
                print(f'{invoice.get("invoice_number", "N/A")}: {items_count} items, order: {has_order}')
                
                if items_count > 0:
                    print(f'  ✓ Invoice {invoice.get("invoice_number")} has {items_count} items')
                    break
        else:
            print('No invoices with items found in first 10')
            
except Exception as e:
    print('Error:', e)