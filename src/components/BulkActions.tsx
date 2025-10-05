import { useState } from 'react'
import { 
  CheckSquare, 
  Square, 
  Zap, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Download,
  RefreshCw,
  Tag,
  FileCheck
} from 'lucide-react'
import { BulkOperationsService } from '../services/bulkOperations'

interface BulkActionsProps {
  items: any[]
  onUpdate: () => void
  type: 'investment_requests' | 'users' | 'referrals'
}

export default function BulkActions({ items, onUpdate, type }: BulkActionsProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [operating, setOperating] = useState(false)
  const [operationType, setOperationType] = useState<string>('')
  const [results, setResults] = useState<any>(null)

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(item => item.id)))
    }
  }

  // Removed unused handleSelectItem function

  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) return
    
    setOperating(true)
    setOperationType(action)
    setResults(null)

    try {
      const itemIds = Array.from(selectedItems)
      const adminId = 'admin' // This should come from authentication context

      let result
      switch (action) {
        case 'approve_requests':
          if (type === 'investment_requests') {
            result = await BulkOperationsService.bulkApproveRequests(itemIds, adminId)
          }
          break
        case 'reject_requests':
          if (type === 'investment_requests') {
            result = await BulkOperationsService.bulkRejectRequests(itemIds, adminId, 'Bulk rejection')
          }
          break
        case 'verify_users':
          if (type === 'users') {
            result = await BulkOperationsService.bulkVerifyDocuments(itemIds, adminId)
          }
          break
        case 'activate_users':
          if (type === 'users') {
            result = await BulkOperationsService.bulkToggleUsers(itemIds, 'activate', adminId)
          }
          break
        case 'deactivate_users':
          if (type === 'users') {
            result = await BulkOperationsService.bulkToggleUsers(itemIds, 'deactivate', adminId)
          }
          break
        case 'auto_process_low_value':
          result = await BulkOperationsService.autoProcessLowValueRequests(25000, adminId)
          break
        default:
          throw new Error('Unknown action')
      }

      setResults(result)
      if (result && result.success) {
        onUpdate() // Refresh data
        setSelectedItems(new Set())
      }
    } catch (error) {
      console.error('Bulk operation failed:', error)
      setResults({
        success: false,
        processed: 0,
        failed: selectedItems.size,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setOperating(false)
      setOperationType('')
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'approve_requests': return 'Approve Selected'
      case 'reject_requests': return 'Reject Selected'
      case 'verify_users': return 'Verify Selected'
      case 'activate_users': return 'Activate Selected'
      case 'deactivate_users': return 'Deactivate Selected'
      case 'auto_process_low_value': return 'Auto-Process Low Value'
      default: return action
    }
  }

  // Removed unused getActionIcon function

  const availableActions = {
    investment_requests: [
      { action: 'approve_requests', label: 'Approve Selected', icon: CheckSquare },
      { action: 'reject_requests', label: 'Reject Selected', icon: Square },
      { action: 'auto_process_low_value', label: 'Auto-Process Low Value', icon: Zap }
    ],
    users: [
      { action: 'verify_users', label: 'Verify Identity', icon: FileCheck },
      { action: 'activate_users', label: 'Activate Selected', icon: Users },
      { action: 'deactivate_users', label: 'Deactivate Selected', icon: Users }
    ],
    referrals: [
      { action: 'approve_requests', label: 'Process Referrals', icon: TrendingUp }
    ]
  }

  if (items.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedItems.size === items.length && items.length > 0}
              onChange={handleSelectAll}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">
              Select All ({selectedItems.size}/{items.length})
            </span>
          </label>
          <span className="text-sm text-gray-500">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 text-gray-400" />
          <Tag className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-600">Bulk Operations</span>
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            Actions for {selectedItems.size} selected:
          </span>
          
          <div className="flex flex-wrap gap-2">
            {availableActions[type]?.map(({ action, label, icon: Icon }) => (
              <button
                key={action}
                onClick={() => handleBulkAction(action)}
                disabled={operating && operationType === action}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition
                  ${operating && operationType === action 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {operating && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">
            {getActionText(operationType)}... Please wait
          </span>
        </div>
      )}

      {results && (
        <div className={`p-4 rounded-lg ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start space-x-3">
            {results.success ? 
              <CheckSquare className="h-5 w-5 text-green-600 mt-0.5" /> : 
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            }
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                Bulk Operation Results
              </h4>
              <div className="mt-2 text-sm space-y-1">
                <div>
                  ✅ Processed: {results.processed}
                </div>
                <div>
                  ❌ Failed: {results.failed}
                </div>
                {results.errors.length > 0 && (
                  <div>
                    <div className="font-medium">Errors:</div>
                    <ul className="ml-4 list-disc">
                      {results.errors.slice(0, 3).map((error: string, index: number) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                    </ul>
                    {results.errors.length > 3 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{results.errors.length - 3} more errors
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <button
          onClick={() => handleBulkAction('auto_process_low_value')}
          disabled={operating}
          className={`
            flex items-center justify-center space-x-2 p-3 rounded-lg text-sm font-medium transition
            ${operating 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
            }
          `}
        >
          <Zap className="h-4 w-4" />
          <span>Auto-Process Low Value</span>
        </button>

        <button
          onClick={() => {
            const csvContent = type === 'investment_requests' 
              ? generateInvestmentCSV(items.filter(item => selectedItems.has(item.id)))
              : generateUserCSV(items.filter(item => selectedItems.has(item.id)))
            
            downloadCSV(csvContent, `${type}_export.csv`)
          }}
          disabled={selectedItems.size === 0}
          className={`
            flex items-center justify-center space-x-2 p-3 rounded-lg text-sm font-medium transition
            ${selectedItems.size === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }
          `}
        >
          <Download className="h-4 w-4" />
          <span>Export Selected</span>
        </button>

        <button
          onClick={() => {
            // Implementation for advanced filtering
            console.log('Advanced filtering for bulk operations')
          }}
          className="flex items-center justify-center space-x-2 p-3 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
        >
          <Tag className="h-4 w-4" />
          <span>Advanced Filter</span>
        </button>
      </div>
    </div>
  )
}

// Helper functions for CSV export
function generateInvestmentCSV(requests: any[]): string {
  const headers = 'User,Email,Plot,Amount,Status,Created\n'
  const rows = requests.map(request => 
    `${request.userName || ''},${request.userEmail || ''},${request.plotName || ''},${request.amount_paid || 0},${request.status || ''},${request.createdAt || ''}\n`
  ).join('')
  
  return headers + rows
}

function generateUserCSV(users: any[]): string {
  const headers = 'Name,Email,Status,Created,Investment\n'
  const rows = users.map(user => 
    `${user.full_name || ''},${user.email || ''},${user.status || ''},${user.created_at || ''},${user.totalInvestments || 0}\n`
  ).join('')
  
  return headers + rows
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
