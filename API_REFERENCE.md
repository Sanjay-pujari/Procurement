# ProcurePro API Reference

## Base URL
```
http://localhost:9998/api
```

## Authentication
All endpoints (except login and register) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 📋 RFQ Endpoints

### Get All RFQs
```http
GET /api/RFQ
Authorization: Bearer <token>
```

### Get RFQ by ID
```http
GET /api/RFQ/{id}
Authorization: Bearer <token>
```

### Create RFQ
```http
POST /api/RFQ
Authorization: Bearer <token>
Roles: Admin, ProcurementManager

{
  "title": "Office Furniture",
  "terms": "Payment within 30 days",
  "dueDate": "2025-10-15T00:00:00Z",
  "status": 0,
  "items": [
    {
      "description": "Office Desk",
      "specification": "Wood finish",
      "quantity": 10,
      "unit": "pieces"
    }
  ],
  "rfqVendors": [
    { "vendorId": "vendor-guid-here" }
  ]
}
```

### Update RFQ
```http
PUT /api/RFQ/{id}
Authorization: Bearer <token>
Roles: Admin, ProcurementManager
```

### Delete RFQ
```http
DELETE /api/RFQ/{id}
Authorization: Bearer <token>
Roles: Admin
```

### Publish RFQ
```http
POST /api/RFQ/{id}/publish
Authorization: Bearer <token>
Roles: Admin, ProcurementManager
```

### Close RFQ
```http
POST /api/RFQ/{id}/close
Authorization: Bearer <token>
Roles: Admin, ProcurementManager
```

---

## 💼 Bid Endpoints

### Get All Bids
```http
GET /api/Bid
Authorization: Bearer <token>
Roles: Admin, ProcurementManager, Approver
```

### Get Bids by RFQ
```http
GET /api/Bid/by-rfq/{rfqId}
Authorization: Bearer <token>
Roles: Admin, ProcurementManager, Approver
```

### Submit Bid
```http
POST /api/Bid
Authorization: Bearer <token>
Roles: Vendor

{
  "rfqId": "rfq-guid-here",
  "vendorId": "vendor-guid-here",
  "visibility": 1,
  "items": [
    {
      "description": "Office Desk",
      "quantity": 10,
      "unitPrice": 1500
    }
  ]
}
```
*Note: `totalAmount` and `score` are calculated automatically*

### Evaluate Bid
```http
POST /api/Bid/{id}/evaluate
Authorization: Bearer <token>
Roles: Admin, ProcurementManager, Approver
```

---

## 📄 Purchase Order Endpoints

### Get All Purchase Orders
```http
GET /api/PurchaseOrder
Authorization: Bearer <token>
```

### Get PO by Bid
```http
GET /api/PurchaseOrder/by-bid/{bidId}
Authorization: Bearer <token>
```

### Create Purchase Order
```http
POST /api/PurchaseOrder
Authorization: Bearer <token>
Roles: Admin, ProcurementManager

{
  "bidId": "bid-guid-here",
  "amendmentsJson": null
}
```

### Acknowledge PO (Vendor)
```http
POST /api/PurchaseOrder/{id}/acknowledge
Authorization: Bearer <token>
Roles: Vendor
```

### Complete PO
```http
POST /api/PurchaseOrder/{id}/complete
Authorization: Bearer <token>
Roles: Admin, ProcurementManager
```

---

## 💰 Invoice Endpoints

### Get All Invoices
```http
GET /api/Invoice
Authorization: Bearer <token>
```

### Get Invoices by PO
```http
GET /api/Invoice/by-po/{poId}
Authorization: Bearer <token>
```

### Create Invoice
```http
POST /api/Invoice
Authorization: Bearer <token>
Roles: Vendor

{
  "purchaseOrderId": "po-guid-here",
  "amount": 45000
}
```

### Mark Invoice as Paid
```http
POST /api/Invoice/{id}/mark-paid
Authorization: Bearer <token>
Roles: Admin, ProcurementManager
```

### Mark Invoice as Partially Paid
```http
POST /api/Invoice/{id}/mark-partially-paid
Authorization: Bearer <token>
Roles: Admin, ProcurementManager
```

---

## 👥 User Management Endpoints

### Get All Users
```http
GET /api/UserManagement/users
Authorization: Bearer <token>
Roles: Admin
```

### Create User
```http
POST /api/UserManagement/users
Authorization: Bearer <token>
Roles: Admin

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "companyName": "Company Inc",
  "roles": ["ProcurementManager"]
}
```

### Update User
```http
PUT /api/UserManagement/users/{id}
Authorization: Bearer <token>
Roles: Admin

{
  "displayName": "John Doe Updated",
  "companyName": "New Company",
  "isActive": true,
  "roles": ["Admin"]
}
```

### Deactivate User
```http
POST /api/UserManagement/users/{id}/deactivate
Authorization: Bearer <token>
Roles: Admin
```

### Reset Password
```http
POST /api/UserManagement/users/{id}/reset-password
Authorization: Bearer <token>
Roles: Admin

{
  "newPassword": "NewSecurePass123!"
}
```

---

## 🔐 Role Management Endpoints

### Get All Roles
```http
GET /api/RoleManagement
Authorization: Bearer <token>
Roles: Admin
```

### Create Role
```http
POST /api/RoleManagement
Authorization: Bearer <token>
Roles: Admin

{
  "name": "CustomRole"
}
```

### Add User to Role
```http
POST /api/RoleManagement/{roleId}/users/{userId}
Authorization: Bearer <token>
Roles: Admin
```

### Remove User from Role
```http
DELETE /api/RoleManagement/{roleId}/users/{userId}
Authorization: Bearer <token>
Roles: Admin
```

---

## 📊 Dashboard Endpoint

### Get Summary Statistics
```http
GET /api/Dashboard/summary
Authorization: Bearer <token>

Response:
{
  "bids": 3,
  "rfqs": 3,
  "rfps": 2,
  "rfis": 2,
  "pos": 2,
  "invoices": 3,
  "rfqByStatus": [
    { "status": "Published", "count": 2 }
  ]
}
```

---

## 🔑 Enums Reference

### RFQ Status
- `0` - Draft
- `1` - Published
- `2` - Closed
- `3` - Awarded

### Tender Visibility
- `0` - Open
- `1` - Closed

### PO Status
- `0` - Issued
- `1` - Acknowledged
- `2` - Completed

### Payment Status
- `0` - Pending
- `1` - Partially Paid
- `2` - Paid

---

## 🧪 Testing with Sample Data

### Test Credentials:
```
Admin:
- Email: admin@procurepro.local
- Password: Admin#12345
```

### Sample Vendor IDs:
Check the database after seeding or use the `/api/Vendors` endpoint to get actual vendor GUIDs.

---

## 🔧 Configuration

### JWT Settings (appsettings.json):
```json
{
  "Jwt": {
    "Issuer": "ProcurePro",
    "Audience": "ProcureProClient",
    "Secret": "your-secret-key-here",
    "ExpiryMinutes": 120
  }
}
```

### CORS Settings:
Currently allows all origins in development. Update `Program.cs` for production.

---

## 📝 Notes

- All GUIDs are auto-generated by the API
- Dates should be in ISO 8601 format
- All monetary amounts are decimal type
- Scores are calculated automatically by the `IBidScoringService`
- Sample data is seeded only if tables are empty

---

**For more details, visit:** `http://localhost:9998/swagger`

