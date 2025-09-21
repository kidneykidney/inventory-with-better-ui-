import requests

# Test the enhanced logic with LEN010
try:
    response = requests.get('http://127.0.0.1:8000/api/invoices')
    if response.status_code == 200:
        invoices = response.json()
        for invoice in invoices:
            if invoice.get('invoice_number') == 'LEN010':
                invoice_id = invoice['id']
                print(f'Testing enhanced logic for LEN010 (ID: {invoice_id})')
                
                # Test the items endpoint specifically
                items_response = requests.get(f'http://127.0.0.1:8000/api/invoices/{invoice_id}/items')
                print(f'Items endpoint status: {items_response.status_code}')
                if items_response.status_code == 200:
                    items_data = items_response.json()
                    print(f'Items from endpoint: {len(items_data)} items')
                    for item in items_data:
                        print(f'  - {item.get("product_name", "N/A")}')
                else:
                    print('Items endpoint failed')
                break
except Exception as e:
    print('Error:', e)