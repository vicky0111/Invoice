// Email Configuration for EmailJS
// DETAILED SETUP INSTRUCTIONS:

// STEP 1: Create Account
// 1. Go to https://www.emailjs.com/
// 2. Click "Sign Up" and create a free account

// STEP 2: Get PUBLIC_KEY
// 1. After login, go to "Account" page
// 2. Copy the "Public Key" from the Account page
// 3. Replace "YOUR_EMAILJS_PUBLIC_KEY" below with this key

// STEP 3: Add Email Service & Get SERVICE_ID
// 1. Go to "Email Services" page
// 2. Click "Add New Service"
// 3. Choose your email provider (Gmail recommended)
// 4. Follow the setup wizard (you'll need to connect your Gmail)
// 5. After setup, copy the "Service ID" (looks like: service_xxxxxxx)
// 6. Replace "YOUR_EMAILJS_SERVICE_ID" below with this Service ID

// STEP 4: Create Email Template & Get TEMPLATE_ID
// 1. Go to "Email Templates" page
// 2. Click "Create New Template"
// 3. Use the template content provided below in this file
// 4. Save the template and copy the "Template ID" (looks like: template_xxxxxxx)
// 5. Replace "YOUR_EMAILJS_TEMPLATE_ID" below with this Template ID

export const EMAIL_CONFIG = {
  // Replace with your actual Public Key from Account page
  PUBLIC_KEY: "ZGDwSSNc5vEQV4hte",
  
  // Replace with your actual Service ID from Email Services page
  SERVICE_ID: "service_vwgekkb",
  
  // Replace with your actual Template ID from Email Templates page
  TEMPLATE_ID: "template_9hfb6b2",
};

// EMAIL TEMPLATE TO CREATE IN EMAILJS:
// When creating your email template, use this exact content:

// TEMPLATE SUBJECT:
// Invoice {{invoice_id}} - Thank you for your purchase!

// TEMPLATE BODY (HTML):
/*
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-title { color: #1890ff; font-size: 28px; margin: 0; }
        .invoice-id { color: #666; font-size: 16px; margin: 10px 0; }
        .details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .amount { font-size: 24px; color: #1890ff; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="invoice-title">INVOICE</h1>
            <p class="invoice-id">Invoice #{{invoice_id}}</p>
        </div>
        
        <h2>Dear {{customer_name}},</h2>
        <p>Thank you for your purchase! Here are the details of your order:</p>
        
        <div class="details">
            <p><strong>Invoice ID:</strong> {{invoice_id}}</p>
            <p><strong>Total Amount:</strong> <span class="amount">₹{{total_amount}}</span></p>
            <p><strong>Items Purchased:</strong></p>
            <div>{{items}}</div>
        </div>
        
        <p>You can view and print your invoice by visiting our store or contacting us.</p>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p><strong>Your Store Name</strong></p>
        </div>
    </div>
</body>
</html>
*/

// TEMPLATE VARIABLES TO MAP:
// In EmailJS template editor, make sure these variables are available:
// - {{to_email}} -> Customer email (IMPORTANT: Also set this as "To Email" in EmailJS template settings)
// - {{to_name}} -> Customer name for the "To Name" field
// - {{customer_name}} -> Customer name for the email content
// - {{invoice_id}} -> Invoice ID
// - {{total_amount}} -> Total amount
// - {{items}} -> List of purchased items

// IMPORTANT EMAIL SETUP:
// 1. In your EmailJS template, go to "Settings" tab
// 2. Set "To Email" field to: {{to_email}}
// 3. Set "To Name" field to: {{to_name}} 
// 4. This ensures the email goes to the customer's email address

// AFTER SETUP:
// Once you have all three values (PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID),
// and configured the recipient fields correctly,
// replace them in the EMAIL_CONFIG object above and the email functionality will work!
