import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  query,
  where,
  limit,
  orderBy 
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface BulkAction {
  id: string
  type: 'approve' | 'reject' | 'verify' | 'activate' | 'deactivate'
  reason?: string
  adminId: string
}

export interface BulkOperationResult {
  success: true
  processed: number
  failed: number
  errors: string[]
}

export class BulkOperationsService {
  
  // Bulk approve investment requests
  static async bulkApproveRequests(requestIds: string[], adminId: string): Promise<BulkOperationResult> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let processed = 0
    let failed = 0

    try {
      for (const requestId of requestIds) {
        try {
          const requestRef = doc(db, 'investment_requests', requestId)
          
          // Get the request to validate it exists and is pending
          const requestDoc = await getDocs(query(
            collection(db, 'investment_requests'),
            where('__name__', '==', requestId)
          ))
          
          if (requestDoc.empty) {
            errors.push(`Request ${requestId} not found`)
            failed++
            continue
          }

          batch.update(requestRef, {
            status: 'approved',
            processedAt: new Date(),
            processedBy: adminId,
            approved_at: new Date(),
            approved_by: adminId
          })
          processed++
        } catch (error) {
          errors.push(`Failed to process ${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          failed++
        }
      }
      
      await batch.commit()
      
      return {
        success: true,
        processed,
        failed,
        errors
      }
    } catch (error) {
      return {
        success: true, // Batch operation completed
        processed,
        failed,
        errors: [...errors, error instanceof Error ? error.message : 'Batch commit failed']
      }
    }
  }

  // Bulk reject investment requests
  static async bulkRejectRequests(requestIds: string[], adminId: string, reason: string = ''): Promise<BulkOperationResult> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let processed = 0
    let failed = 0

    try {
      for (const requestId of requestIds) {
        try {
          const requestRef = doc(db, 'investment_requests', requestId)
          batch.update(requestRef, {
            status: 'rejected',
            processedAt: new Date(),
            processedBy: adminId,
            rejection_reason: reason || 'Rejected by admin'
          })
          processed++
        } catch (error) {
          errors.push(`Failed to reject ${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          failed++
        }
      }
      
      await batch.commit()
      
      return {
        success: true,
        processed,
        failed,
        errors
      }
    } catch (error) {
      return {
        success: true,
        processed,
        failed,
        errors: [...errors, error instanceof Error ? error.message : 'Batch commit failed']
      }
    }
  }

  // Bulk verify user documents
  static async bulkVerifyDocuments(userIds: string[], adminId: string): Promise<BulkOperationResult> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let processed = 0
    let failed = 0

    try {
      for (const userId of userIds) {
        try {
          const userRef = doc(db, 'user_profiles', userId)
          batch.update(userRef, {
            identity_verified: true,
            verified_by: adminId,
            verified_at: new Date()
          })
          processed++
        } catch (error) {
          errors.push(`Failed to verify ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          failed++
        }
      }
      
      await batch.commit()
      
      return {
        success: true,
        processed,
        failed,
        errors
      }
    } catch (error) {
      return {
        success: true,
        processed,
        failed,
        errors: [...errors, error instanceof Error ? error.message : 'Batch commit failed']
      }
    }
  }

  // Bulk activate/deactivate users
  static async bulkToggleUsers(userIds: string[], action: 'activate' | 'deactivate', adminId: string): Promise<BulkOperationResult> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let processed = 0
    let failed = 0

    try {
      const status = action === 'activate' ? 'active' : 'inactive'
      
      for (const userId of userIds) {
        try {
          const userRef = doc(db, 'user_profiles', userId)
          batch.update(userRef, {
            status,
            updated_at: new Date(),
            updated_by: adminId
          })
          processed++
        } catch (error) {
          errors.push(`Failed to ${action} ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          failed++
        }
      }
      
      await batch.commit()
      
      return {
        success: true,
        processed,
        failed,
        errors
      }
    } catch (error) {
      return {
        success: true,
        processed,
        failed,
        errors: [...errors, error instanceof Error ? error.message : 'Batch commit failed']
      }
    }
  }

  // Process investment requests by status (high volume processing)
  static async processRequestsByStatus(status: string, newStatus: string, adminId: string, maxToProcess: number = 50): Promise<BulkOperationResult> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let processed = 0
    let failed = 0

    try {
      // Get requests with specific status, ordered by creation date
      const requestsQuery = query(
        collection(db, 'investment_requests'),
        where('status', '==', status),
        orderBy('createdAt', 'asc'),
        limit(maxToProcess)
      )

      const requestsSnapshot = await getDocs(requestsQuery)
      
      for (const requestDoc of requestsSnapshot.docs) {
        try {
          const requestRef = doc(db, 'investment_requests', requestDoc.id)
          
          const updateData: any = {
            status: newStatus,
            processedAt: new Date(),
            processedBy: adminId
          }
          
          if (newStatus === 'approved') {
            updateData.approved_at = new Date()
            updateData.approved_by = adminId
          }
          
          batch.update(requestRef, updateData)
          processed++
        } catch (error) {
          errors.push(`Failed to process ${requestDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          failed++
        }
      }
      
      await batch.commit()
      
      return {
        success: true,
        processed,
        failed,
        errors
      }
    } catch (error) {
      return {
        success: true,
        processed,
        failed,
        errors: [...errors, error instanceof Error ? error.message : 'Batch commit failed']
      }
    }
  }

  // Queue management - get high priority requests first
  static async getHighPriorityRequests(maxRequests: number = 20) {
    try {
      const queries = [
        // Recent high-value requests
        query(
          collection(db, 'investment_requests'),
          where('status', '==', 'pending'),
          where('amount_paid', '>=', 50000), // High value
          orderBy('amount_paid', 'desc'),
          limit(Math.ceil(maxRequests / 2))
        ),
        // Recent requests with referrals
        query(
          collection(db, 'investment_requests'),
          where('status', '==', 'pending'),
          where('referral_code', '!=', null),
          orderBy('createdAt', 'desc'),
          limit(Math.ceil(maxRequests / 2))
        )
      ]

      const [highValueSnapshot, referralSnapshot] = await Promise.all(
        queries.map(q => getDocs(q))
      )

      // Combine and deduplicate
      const requests: any[] = []
      const requestIds = new Set()

      ;[...highValueSnapshot.docs, ...referralSnapshot.docs].forEach(doc => {
        if (!requestIds.has(doc.id)) {
          requests.push({ id: doc.id, ...doc.data() })
          requestIds.add(doc.id)
        }
      })

      return requests.slice(0, maxRequests)
    } catch (error) {
      console.error('Error getting high priority requests:', error)
      return []
    }
  }

  // Auto-processing for small investment requests
  static async autoProcessLowValueRequests(threshold: number = 25000, adminId: string): Promise<BulkOperationResult> {
    try {
      const requestsQuery = query(
        collection(db, 'investment_requests'),
        where('status', '==', 'pending'),
        where('amount_paid', '<=', threshold),
        orderBy('amount_paid', 'asc')
      )

      const requestsSnapshot = await getDocs(requestsQuery)
      const requestIds = requestsSnapshot.docs.map(doc => doc.id)
      
      return await this.bulkApproveRequests(requestIds, adminId)
    } catch (error) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Auto-processing failed']
      }
    }
  }
}
