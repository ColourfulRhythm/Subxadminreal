import { InvestmentRequest } from '../types'

/**
 * Sample investment request with security document fields
 * This can be used to test the document verification functionality
 */
export const createSampleRequestWithDocuments = (): Partial<InvestmentRequest> => {
  return {
    // Basic request data
    id: 'sample-request-123',
    userId: 'user-456',
    userEmail: 'john.doe@example.com',
    userName: 'John Doe',
    plotId: 'plot-789',
    plotName: 'Luxury Villa Plot A1',
    sqm: 500,
    pricePerSqm: 1000,
    totalAmount: 500000,
    amount_paid: 500000,
    status: 'pending_approval',
    createdAt: new Date(),
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'pending',
    
    // New security verification fields
    means_of_id_url: 'https://storage.googleapis.com/your-bucket/identity_docs/user_456_passport.pdf',
    payment_receipt_url: 'https://storage.googleapis.com/your-bucket/payment_docs/user_456_receipt.pdf',
    documents_uploaded: true,
    uploaded_at: new Date(),
    
    // Verification status (initially false)
    identity_verified: false,
    payment_verified: false,
    verification_notes: '',
    verified_by: undefined,
    verified_at: undefined
  }
}

/**
 * Sample request without documents (for testing missing document flow)
 */
export const createSampleRequestWithoutDocuments = (): Partial<InvestmentRequest> => {
  return {
    // Basic request data
    id: 'sample-request-456',
    userId: 'user-789',
    userEmail: 'jane.smith@example.com',
    userName: 'Jane Smith',
    plotId: 'plot-101',
    plotName: 'Commercial Plot B2',
    sqm: 1000,
    pricePerSqm: 800,
    totalAmount: 800000,
    amount_paid: 800000,
    status: 'pending_approval',
    createdAt: new Date(),
    paymentMethod: 'Credit Card',
    paymentStatus: 'pending',
    
    // Security fields - no documents uploaded
    means_of_id_url: undefined,
    payment_receipt_url: undefined,
    documents_uploaded: false,
    uploaded_at: undefined,
    
    // Verification status
    identity_verified: false,
    payment_verified: false,
    verification_notes: '',
    verified_by: undefined,
    verified_at: undefined
  }
}

/**
 * Sample request with verified documents
 */
export const createSampleRequestWithVerifiedDocuments = (): Partial<InvestmentRequest> => {
  return {
    // Basic request data
    id: 'sample-request-789',
    userId: 'user-101',
    userEmail: 'mike.wilson@example.com',
    userName: 'Mike Wilson',
    plotId: 'plot-202',
    plotName: 'Residential Plot C3',
    sqm: 750,
    pricePerSqm: 1200,
    totalAmount: 900000,
    amount_paid: 900000,
    status: 'pending_approval',
    createdAt: new Date(),
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'verified',
    
    // Security fields with documents
    means_of_id_url: 'https://storage.googleapis.com/your-bucket/identity_docs/user_101_drivers_license.pdf',
    payment_receipt_url: 'https://storage.googleapis.com/your-bucket/payment_docs/user_101_bank_receipt.pdf',
    documents_uploaded: true,
    uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    
    // Verification status - verified
    identity_verified: true,
    payment_verified: true,
    verification_notes: 'All documents verified successfully. Identity matches payment details.',
    verified_by: 'admin-user-123',
    verified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  }
}

/**
 * Get all sample requests for testing
 */
export const getAllSampleRequests = (): Partial<InvestmentRequest>[] => {
  return [
    createSampleRequestWithDocuments(),
    createSampleRequestWithoutDocuments(),
    createSampleRequestWithVerifiedDocuments()
  ]
}
