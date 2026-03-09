# Testing the PayCebo API

## Create Payment Endpoint

The `/api/create-payment` endpoint requires an API key for authentication. Here's how to test it:

### Prerequisites
1. Make sure you have a merchant account created (use the seed script)
2. Get the API key for your merchant account

### Testing with cURL
```bash
curl -X POST http://localhost:5000/api/create-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "redirect_url": "http://localhost:3000/payment-result"
  }'
```

### Testing with Postman
1. Set the request method to POST
2. Set the URL to http://localhost:5000/api/create-payment
3. In the Headers tab, add:
   - Content-Type: application/json
   - Authorization: Bearer YOUR_API_KEY
4. In the Body tab, select "raw" and "JSON", then enter:
```json
{
  "amount": 100,
  "currency": "INR",
  "redirect_url": "http://localhost:3000/payment-result"
}
```

## Common Issues

### 403 Forbidden Error
If you're getting a 403 Forbidden error, check:
1. Is your API key correct?
2. Did you include "Bearer " before your API key?
3. Is the API key from an existing merchant in the database?

### Finding Your API Key
1. Run the seed script to create a test merchant
2. The API key will be displayed in the console
3. Or log in to the frontend and view your API key in the dashboard

## Example API Key Format
Your API key should look something like:
```
123e4567-e89b-12d3-a456-426614174000
```

Remember to include the "Bearer " prefix in the Authorization header.