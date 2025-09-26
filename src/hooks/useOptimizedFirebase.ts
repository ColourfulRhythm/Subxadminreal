import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryLimitConstraint,
  QueryOrderByConstraint,
  QueryWhereConstraint,
  DocumentSnapshot,
  Unsubscribe,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../lib/firebase'

interface OptimizedQueryOptions {
  pageSize?: number
  filters?: Record<string, any>
  orderBy?: QueryOrderByConstraint
  whereClauses?: QueryWhereConstraint[]
  includeLoadingStates?: boolean
}

// Optimized hook for handling large datasets with pagination
export function useOptimizedFirebase<T>(
  collectionName: string,
  options: OptimizedQueryOptions = {}
) {
  const {
    pageSize = 20,
    filters = {},
    orderBy: orderByClause,
    whereClauses = [],
    includeLoadingStates = true
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const buildQuery = useCallback((startAfterDoc?: DocumentSnapshot) => {
    let constraints = []
    
    // Add where clauses
    whereClauses.forEach(clause => {
      constraints.push(clause)
    })
    
    // Add custom filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        constraints.push(where(field, '==', value))
      }
    })
    
    // Add ordering
    if (orderByClause) {
      constraints.push(orderByClause)
    } else {
      constraints.push(orderBy('createdAt', 'desc'))
    }
    
    // Add limit
    constraints.push(limit(pageSize))
    
    // Add pagination
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc))
    }
    
    return query(collection(db, collectionName), ...constraints)
  }, [collectionName, pageSize, filters, orderByClause, whereClauses])

  const fetchPage = useCallback(async (startAfterDoc?: DocumentSnapshot) => {
    try {
      if (includeLoadingStates) setLoading(true)
      setError(null)

      const queryRef = buildQuery(startAfterDoc)
      const snapshot = await getDocs(queryRef)
      
      const items: T[] = []
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T)
      })

      if (startAfterDoc) {
        setData(prev => [...prev, ...items])
      } else {
        setData(items)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === pageSize)
      setTotalCount(prev => startAfterDoc ? prev + items.length : items.length)

      if (includeLoadingStates) setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      if (includeLoadingStates) setLoading(false)
    }
  }, [buildQuery, pageSize, includeLoadingStates])

  const loadMore = useCallback(() => {
    if (!hasMore) return
    fetchPage(lastDoc)
  }, [hasMore, lastDoc, fetchPage])

  const refresh = useCallback(() => {
    setData([])
    setLastDoc(null)
    setHasMore(true)
    setTotalCount(0)
    fetchPage()
  }, [fetchPage])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  return {
    data,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh
  }
}

// Hook for specific admin workflows to optimize data loading
export function useAdminDashboard() {
  const [summaries, setSummaries] = useState({
    users: 0,
    investmentRequests: 0,
    referrals: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        setLoading(true)

        // Optimize by only loading summary data instead of full details
        const [usersSnapshot, requestsSnapshot, referralsSnapshot, investmentsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'user_profiles'), limit(1))), // Count-like query
          getDocs(query(collection(db, 'investment_requests'), where('status', '==', 'pending'), limit(50))),
          getDocs(query(collection(db, 'referrals'), where('status', '==', 'pending'), limit(50))),
          getDocs(query(collection(db, 'investments'), limit(100)))
        ])

        const totalRevenue = investmentsSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data()
          return sum + (data.amount_paid || data.Amount_paid || 0)
        }, 0)

        setSummaries({
          users: usersSnapshot.size,
          investmentRequests: requestsSnapshot.size,
          referrals: referralsSnapshot.size,
          totalRevenue
        })
        setLoading(false)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setLoading(false)
      }
    }

    loadSummaryData()
  }, [])

  return { summaries, loading }
}

// Hook for real-time updates optimized for admin dashboard
export function useAdminRealTimeUpdates() {
  const [updates, setUpdates] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeCallbacks: Unsubscribe[] = []

    const listenToCollection = (collectionName: string, whereClause?: any) => {
      const queryRef = whereClause 
        ? query(collection(db, collectionName), whereClause, limit(10))
        : query(collection(db, collectionName), limit(10))
      
      const unsubscribe = onSnapshot(
        queryRef,
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          setUpdates(prev => ({ ...prev, [collectionName]: items }))
          setLoading(false)
        },
        (error) => {
          console.error(`Error listening to ${collectionName}:`, error)
        }
      )
      
      unsubscribeCallbacks.push(unsubscribe)
    }

    // Listen to critical collections for real-time updates
    listenToCollection('investment_requests', where('status', '==', 'pending'))
    listenToCollection('referrals', where('status', '==', 'pending'))
    listenToCollection('withdrawal_requests', where('status', '==', 'pending'))
    listenToCollection('user_profiles', where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)))

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  return { updates, loading }
}

// Hook for high-volume batch operations
export function useBatchOperations() {
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{
    processed: number
    failed: number
    errors: string[]
  } | null>(null)

  const processBatch = async (batchFunction: () => Promise<any>) => {
    try {
      setProcessing(true)
      setResults(null)
      
      const result = await batchFunction()
      setResults(result)
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const result = {
        processed: 0,
        failed: 1,
        errors: [errorMessage]
      }
      setResults(result)
      return result
    } finally {
      setProcessing(false)
    }
  }

  return {
    processing,
    results,
    processBatch
  }
}

// Hook for search with debouncing to prevent excessive queries
export function useOptimizedSearch<T>(
  collectionName: string,
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 500
) {
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        const searchResults = await searchFunction(searchTerm)
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchFunction, delay])

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading
  }
}
