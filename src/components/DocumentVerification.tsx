import { useState } from 'react'
import { 
  Download, 
  Eye, 
  CheckCircle, 
  FileText, 
  CreditCard,
  User,
  AlertTriangle,
  Clock,
  Shield
} from 'lucide-react'
import { InvestmentRequest } from '../types'

interface DocumentVerificationProps {
  request: InvestmentRequest
  onVerify: (requestId: string, verificationData: VerificationData) => Promise<void>
  onDownload: (url: string, filename: string) => Promise<void>
}

interface VerificationData {
  identity_verified: boolean
  payment_verified: boolean
  verification_notes: string
}

export default function DocumentVerification({ 
  request, 
  onVerify, 
  onDownload 
}: DocumentVerificationProps) {
  const [verificationData, setVerificationData] = useState<VerificationData>({
    identity_verified: request.identity_verified || false,
    payment_verified: request.payment_verified || false,
    verification_notes: request.verification_notes || ''
  })
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      await onVerify(request.id, verificationData)
    } catch (error) {
      console.error('Error verifying documents:', error)
      alert('Failed to verify documents. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      await onDownload(url, filename)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document. Please try again.')
    }
  }

  const getDocumentStatus = () => {
    if (!request.documents_uploaded) {
      return { status: 'missing', color: 'red', icon: AlertTriangle }
    }
    if (request.identity_verified && request.payment_verified) {
      return { status: 'verified', color: 'green', icon: CheckCircle }
    }
    if (request.identity_verified || request.payment_verified) {
      return { status: 'partial', color: 'yellow', icon: Clock }
    }
    return { status: 'pending', color: 'blue', icon: Shield }
  }

  const documentStatus = getDocumentStatus()
  const StatusIcon = documentStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
          <p className="text-sm text-gray-600">
            Verify identity and payment documents before approval
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-5 w-5 text-${documentStatus.color}-500`} />
          <span className={`text-sm font-medium text-${documentStatus.color}-600 capitalize`}>
            {documentStatus.status}
          </span>
        </div>
      </div>

      {/* Document Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Identity Document</p>
              <p className="text-xs text-gray-500">
                {request.identity_verified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payment Receipt</p>
              <p className="text-xs text-gray-500">
                {request.payment_verified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity Document */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Identity Document
            </h4>
            {request.identity_verified && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          {request.means_of_id_url ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Identity Document</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(request.means_of_id_url!, 'identity_document.pdf')}
                    className="text-blue-600 hover:text-blue-800"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(request.means_of_id_url, '_blank')}
                    className="text-green-600 hover:text-green-800"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="identity-verified"
                  checked={verificationData.identity_verified}
                  onChange={(e) => setVerificationData({
                    ...verificationData,
                    identity_verified: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="identity-verified" className="text-sm text-gray-700">
                  Mark as verified
                </label>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No identity document uploaded</p>
            </div>
          )}
        </div>

        {/* Payment Receipt */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Receipt
            </h4>
            {request.payment_verified && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          {request.payment_receipt_url ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Payment Receipt</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(request.payment_receipt_url!, 'payment_receipt.pdf')}
                    className="text-blue-600 hover:text-blue-800"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(request.payment_receipt_url, '_blank')}
                    className="text-green-600 hover:text-green-800"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payment-verified"
                  checked={verificationData.payment_verified}
                  onChange={(e) => setVerificationData({
                    ...verificationData,
                    payment_verified: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="payment-verified" className="text-sm text-gray-700">
                  Mark as verified
                </label>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No payment receipt uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Notes */}
      <div className="card">
        <h4 className="text-md font-medium text-gray-900 mb-3">Verification Notes</h4>
        <textarea
          value={verificationData.verification_notes}
          onChange={(e) => setVerificationData({
            ...verificationData,
            verification_notes: e.target.value
          })}
          placeholder="Add notes about document verification..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Verification Summary */}
      <div className="card">
        <h4 className="text-md font-medium text-gray-900 mb-3">Verification Summary</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Documents Uploaded:</span>
            <span className={`text-sm font-medium ${request.documents_uploaded ? 'text-green-600' : 'text-red-600'}`}>
              {request.documents_uploaded ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Upload Date:</span>
            <span className="text-sm text-gray-900">
              {request.uploaded_at ? (() => {
                const date = new Date(request.uploaded_at)
                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString()
              })() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verified By:</span>
            <span className="text-sm text-gray-900">
              {request.verified_by || 'Not verified'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verified At:</span>
            <span className="text-sm text-gray-900">
              {request.verified_at ? (() => {
                const date = new Date(request.verified_at)
                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString()
              })() : 'Not verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleVerify}
          disabled={isVerifying || (!verificationData.identity_verified && !verificationData.payment_verified)}
          className={`px-4 py-2 rounded-lg font-medium ${
            isVerifying || (!verificationData.identity_verified && !verificationData.payment_verified)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isVerifying ? 'Verifying...' : 'Save Verification'}
        </button>
      </div>
    </div>
  )
}
