import requests
import json

# First, let's get all invoices to find the ID for LEN009
try:
    response = requests.get('http://127.0.0.1:8000/api/invoices')
    if response.status_code == 200:
        invoices = response.json()
        for invoice in invoices:
            if invoice.get('invoice_number') == 'LEN009':
                print('Found LEN009 with ID:', invoice['id'])
                
                # Now get the detailed invoice data
                detail_response = requests.get(f'http://127.0.0.1:8000/api/invoices/{invoice["id"]}')
                if detail_response.status_code == 200:
                    detail = detail_response.json()
                    
                    print('\nAvailable invoice fields:')
                    for key in sorted(detail.keys()):
                        if key != 'items':  # Skip items for now
                            print(f'  {key}: {detail[key]}')
                    
                    print('\nInvoice Items:')
                    for item in detail.get('items', []):
                        print('\nAvailable item fields:')
                        for key in sorted(item.keys()):
                            print(f'  {key}: {item[key]}')
                        break  # Just show first item
                    break
        else:
            print('LEN009 not found in invoices list')
    else:
        print('Failed to get invoices:', response.status_code)
except Exception as e:
    print('Error:', e)