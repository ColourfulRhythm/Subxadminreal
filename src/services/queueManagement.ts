import { 
  collection, 
  doc, 
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface QueueItem {
  id: string
  type: 'investment' | 'verification' | 'withdrawal' | 'user_management'
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  processedAt?: Date
  assignedTo?: string
  metadata: any
}

export class QueueManagementService {
  
  // Add items to processing queue
  static async addToQueue(
    type: QueueItem['type'],
    priority: QueueItem['priority'] = 'medium',
    metadata: any,
    itemId: string
  ) {
    try {
      const queueRef = collection(db, 'admin_queue')
      await addDoc(queueRef, {
        type,
        priority,
        status: 'pending',
        itemId,
        metadata,
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding item to queue:', error)
      throw error
    }
  }

  // Get next items from queue (prioritizing high priority)
  static async getQueueItems(limit: number = 20): Promise<QueueItem[]> {
    try {
      const queueQuery = query(
        collection(db, 'admin_queue'),
        where('status', '==', 'pending'),
        orderBy('priority', 'desc'), // High priority first
        orderBy('createdAt', 'asc'),   // Then by request time
        limit(limit)
      )

      const queueSnapshot = await getDocs(queueQuery)
      return queueSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as QueueItem[]
    } catch (error) {
      console.error('Error getting queue items:', error)
      return []
    }
  }

  // Mark item as processing
  static async startProcessing(queueId: string, adminId: string) {
    try {
      const queueRef = doc(db, 'admin_queue', queueId)
      await updateDoc(queueRef, {
        status: 'processing',
        assignedTo: adminId,
        startedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error starting item processing:', error)
      throw error
    }
  }

  // Mark item as completed
  static async completeProcessing(queueId: string, result: any = {}) {
    try {
      const queueRef = doc(db, 'admin_queue', queueId)
      await updateDoc(queueRef, {
        status: 'completed',
        processedAt: serverTimestamp(),
        result
      })
    } catch (error) {
      console.error('Error completing item processing:', error)
      throw error
    }
  }

  // Auto-queue pending requests based on criteria
  static async autoQueueRequests() {
    try {
      // Get all pending investment requests
      const pendingRequestsQuery = query(
        collection(db, 'investment_requests'),
        where('status', '==', 'pending'),
        where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      )

      const requestsSnapshot = await getDocs(pendingRequestsQuery)
      
      for (const requestDoc of requestsSnapshot.docs) {
        const request = requestDoc.data()
        const priority = this.calculatePriority(request)
        
        // Don't add if already queued
        const existingQueueQuery = query(
          collection(db, 'admin_queue'),
          where('itemId', '==', requestDoc.id),
          where('status', 'in', ['pending', 'processing'])
        )
        
        const existingQueue = await getDocs(existingQueueQuery)
        if (!existingQueue.empty) continue

        await this.addToQueue(
          'investment',
          priority,
          {
            requestId: requestDoc.id,
            amount: request.amount_paid || 0,
            userEmail: request.user_email || '',
            plotName: request.plot_name || '',
            createdAt: request.createdAt
          },
          requestDoc.id
        )
      }

      return true
    } catch (error) {
      console.error('Error auto-queueing requests:', error)
      return false
    }
  }

  // Calculate priority based on request characteristics
  private static calculatePriority(request: any): QueueItem['priority'] {
    const amount = request.amount_paid || 0
    const hasReferral = !!(request.referral_code)
    const hoursOld = request.createdAt ? 
      Math.abs(Date.now() - request.createdAt.toDate().getTime()) / (1000 * 60 * 60) : 
      Infinity

    // High priority: Large amounts, referrals, or urgent requests
    if (amount > 100000 || hasReferral || hoursOld > 12) {
      return 'high'
    }
    
    // Medium priority: Standard requests
    if (amount > 25000 || hoursOld > 4) {
      return 'medium'
    }

    // Low priority: Small amounts, recent requests
    return 'low'
  }

  // Batch processing for high-volume scenarios
  static async processBatch(
    queueItems: QueueItem[], 
    adminId: string,
    batchSize: number = 10
  ): Promise<{ processed: number, failed: number, errors: string[] }> {
    let processed = 0
    let failed = 0
    const errors: string[] = []

    try {
      for (let i = 0; i < queueItems.length; i += batchSize) {
        const batch = queueItems.slice(i, i + batchSize)
        
        // Start processing batch
        await Promise.all(
          batch.map(async (item) => {
            try {
              await this.startProcessing(item.id, adminId)
              
              // Simulate processing based on item type
              await this.processQueueItem(item, adminId)
              
              await this.completeProcessing(item.id, { processedAt: new Date().toISOString() })
              processed++
            } catch (error) {
              failed++
              errors.push(`Failed to process item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          })
        )

        // Add delay between batches to prevent rate limiting
        if (i + batchSize < queueItems.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        }
      }
    } catch (error) {
      errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { processed, failed, errors }
  }

  // Process individual queue item
  private static async processQueueItem(item: QueueItem, adminId: string) {
    switch (item.type) {
      case 'investment':
        // This would typically call your existing approval logic
        console.log('Processing investment request:', item.metadata)
        break
      case 'verification':
        // Process user verification
        console.log('Processing verification:', item.metadata)
        break
      default:
        console.log('Processing item:', item.type)
    }
  }

  // Get queue statistics
  static async getQueueStats(): Promise<{
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    byPriority: { high: number, medium: number, low: number }
  }> {
    try {
      const statsQuery = query(collection(db, 'admin_queue'))
      const snapshot = await getDocs(statsQuery)
      
      const stats = {
        total: snapshot.size,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byPriority: { high: 0, medium: 0, low: 0 }
      }

      snapshot.docs.forEach(doc => {
        const data = doc.data()
        stats[data.status]++
        stats.byPriority[data.priority]++
      })

      return stats
    } catch (error) {
      console.error('Error getting queue stats:', error)
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byPriority: { high: 0, medium: 0, low: 0 }
      }
    }
  }
}
