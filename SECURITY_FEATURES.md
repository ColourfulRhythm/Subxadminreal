# Security Document Verification System

## Overview

This system implements comprehensive document verification for investment requests, ensuring that identity and payment documents are properly verified before approving any investment.

## New Fields Added to Investment Requests

### Document Upload Fields
- `means_of_id_url`: URL to identity document (passport, driver's license, etc.)
- `payment_receipt_url`: URL to payment receipt/proof
- `documents_uploaded`: Boolean flag indicating if documents were uploaded
- `uploaded_at`: Timestamp when documents were uploaded

### Verification Fields
- `identity_verified`: Admin verification status for identity document
- `payment_verified`: Admin verification status for payment document
- `verification_notes`: Admin notes during verification process
- `verified_by`: Admin user ID who verified the documents
- `verified_at`: Timestamp when verification was completed

## Components Added

### 1. DocumentVerification Component (`/src/components/DocumentVerification.tsx`)
- Displays uploaded documents with download/preview options
- Allows admins to verify identity and payment documents
- Shows verification status and progress
- Includes verification notes functionality

### 2. FileManagementService (`/src/services/fileManagement.ts`)
- Handles document downloads
- Document preview functionality
- File type validation
- Document accessibility checks

### 3. Enhanced InvestmentApprovalService
- Added document verification checks before approval
- New `verifyDocuments()` method for document verification
- New `checkDocumentStatus()` method for status checking
- Enhanced approval workflow with security requirements

## Admin Dashboard Features

### Investment Requests Table
- New "Documents" column showing upload and verification status
- Visual indicators for document status:
  - ✅ Green: Documents uploaded and verified
  - ⚠️ Yellow: Documents uploaded but pending verification
  - ❌ Red: Documents missing
- New "Verify Documents" button (Shield icon) for requests with uploaded documents

### Document Verification Modal
- Comprehensive document review interface
- Download and preview functionality for both identity and payment documents
- Verification checkboxes for each document type
- Verification notes field
- Summary of verification status and history

## Workflow

### 1. User Submission
1. User submits investment request
2. User uploads identity document (passport, driver's license, etc.)
3. User uploads payment receipt/proof
4. System sets `documents_uploaded: true` and `uploaded_at` timestamp

### 2. Admin Review
1. Admin sees request in dashboard with document status indicators
2. Admin clicks "Verify Documents" button
3. Admin downloads and reviews identity document
4. Admin downloads and reviews payment receipt
5. Admin marks documents as verified
6. Admin adds verification notes
7. Admin saves verification status

### 3. Approval Process
1. System checks if both documents are verified
2. If verified, approval can proceed
3. If not verified, approval is blocked with error message
4. Approved requests include verification metadata

## Security Features

### Document Access
- Secure document URLs (should be behind authentication)
- Download tracking and audit logs
- Document type validation
- File size and format restrictions

### Verification Requirements
- Both identity and payment documents must be verified before approval
- Verification notes are required for audit trail
- Admin user tracking for all verification actions
- Timestamp tracking for all verification activities

## Usage Examples

### Adding Sample Data
```typescript
import { createSampleRequestWithDocuments } from '../utils/sampleSecurityData'

// Create a request with uploaded documents
const sampleRequest = createSampleRequestWithDocuments()
```

### Verifying Documents
```typescript
import { InvestmentApprovalService } from '../services/investmentApprovalService'

// Verify documents for a request
const result = await InvestmentApprovalService.verifyDocuments(
  'request-id',
  {
    identity_verified: true,
    payment_verified: true,
    verification_notes: 'All documents verified successfully'
  },
  'admin-user-id'
)
```

### Checking Document Status
```typescript
// Check if documents are ready for approval
const status = await InvestmentApprovalService.checkDocumentStatus('request-id')
console.log('Ready for approval:', status.readyForApproval)
```

## Database Schema

The `investment_requests` collection now includes these additional fields:

```javascript
{
  // ... existing fields ...
  
  // Document upload fields
  means_of_id_url: "https://storage.googleapis.com/bucket/identity_docs/user_123_passport.pdf",
  payment_receipt_url: "https://storage.googleapis.com/bucket/payment_docs/user_123_receipt.pdf",
  documents_uploaded: true,
  uploaded_at: "2024-01-20T10:30:00Z",
  
  // Verification fields
  identity_verified: true,
  payment_verified: true,
  verification_notes: "All documents verified successfully",
  verified_by: "admin-user-123",
  verified_at: "2024-01-20T11:00:00Z"
}
```

## Testing

Use the sample data utilities to test different scenarios:

1. **Request with documents pending verification**
2. **Request without documents uploaded**
3. **Request with verified documents ready for approval**

## Security Considerations

1. **Document Storage**: Ensure documents are stored securely with proper access controls
2. **URL Security**: Document URLs should be signed and have expiration times
3. **Audit Trail**: All document access and verification actions are logged
4. **Access Control**: Only authorized admins can access document verification features
5. **Data Retention**: Implement proper document retention policies

## Future Enhancements

1. **Document OCR**: Automatic text extraction from identity documents
2. **Face Matching**: Compare identity document photo with user profile
3. **Payment Verification**: Automatic payment confirmation with banks
4. **Document Templates**: Standardized document upload templates
5. **Bulk Verification**: Batch verification of multiple requests
6. **Advanced Analytics**: Document verification metrics and reporting
