import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { User, Project, Plot, InvestmentRequest, WithdrawalRequest, ReferralData, DashboardStats } from '../types'

// Generic hook for Firebase operations
export function useFirebase<T>(
  collectionName: string,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const collectionRef = collection(db, collectionName)
        unsubscribe = onSnapshot(
          collectionRef,
          (snapshot) => {
            const items: T[] = []
            snapshot.forEach((doc) => {
              items.push({ id: doc.id, ...doc.data() } as T)
            })
            setData(items)
            setLoading(false)
          },
          (err) => {
            setError(err.message)
            setLoading(false)
          }
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, dependencies)

  const add = async (item: Omit<T, 'id'>) => {
    try {
      const collectionRef = collection(db, collectionName)
      await addDoc(collectionRef, item)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
      return false
    }
  }

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, updates)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
      return false
    }
  }

  const remove = async (id: string) => {
    try {
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
      return false
    }
  }

  return {
    data,
    loading,
    error,
    add,
    update,
    remove
  }
}

// Specific hooks for each data type
export function useUsers() {
  return useFirebase<User>('users')
}

export function useProjects() {
  return useFirebase<Project>('projects')
}

export function usePlots() {
  return useFirebase<Plot>('plots')
}

export function useInvestmentRequests() {
  return useFirebase<InvestmentRequest>('investmentRequests')
}

export function useWithdrawalRequests() {
  return useFirebase<WithdrawalRequest>('withdrawalRequests')
}

export function useReferrals() {
  return useFirebase<ReferralData>('referrals')
}

// Dashboard stats hook
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch data from multiple collections
        const [usersSnapshot, projectsSnapshot, plotsSnapshot, requestsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'plots')),
          getDocs(collection(db, 'investmentRequests'))
        ])

        const totalUsers = usersSnapshot.size
        const totalProjects = projectsSnapshot.size
        const totalPlots = plotsSnapshot.size
        const totalSqmSold = plotsSnapshot.docs.reduce((sum, doc) => {
          const plot = doc.data() as Plot
          return sum + (plot.totalSqm - plot.availableSqm)
        }, 0)
        const platformRevenue = plotsSnapshot.docs.reduce((sum, doc) => {
          const plot = doc.data() as Plot
          return sum + plot.totalRevenue
        }, 0)
        const pendingVerifications = usersSnapshot.docs.filter(doc => {
          const user = doc.data() as User
          return !user.isVerified
        }).length

        const activeReferrals = requestsSnapshot.docs.filter(doc => {
          const request = doc.data() as InvestmentRequest
          return request.referralCode
        }).length

        setStats({
          totalUsers,
          totalProjects,
          totalPlots,
          totalSqmSold,
          platformRevenue,
          pendingVerifications,
          activeReferrals,
          systemHealth: {
            firebaseStatus: 'connected',
            dataIntegrity: 'healthy',
            lastSync: new Date()
          }
        })
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

// Utility functions for specific operations
export const firebaseUtils = {
  // Investment request operations
  async approveInvestmentRequest(requestId: string) {
    const docRef = doc(db, 'investmentRequests', requestId)
    await updateDoc(docRef, {
      status: 'approved',
      processedAt: new Date()
    })
  },

  async rejectInvestmentRequest(requestId: string) {
    const docRef = doc(db, 'investmentRequests', requestId)
    await updateDoc(docRef, {
      status: 'rejected',
      processedAt: new Date()
    })
  },

  async moveToInvestments(requestId: string) {
    const docRef = doc(db, 'investmentRequests', requestId)
    const requestDoc = await getDoc(docRef)
    
    if (requestDoc.exists()) {
      const requestData = requestDoc.data()
      // Move to investments collection
      await addDoc(collection(db, 'investments'), requestData)
      // Update status
      await updateDoc(docRef, {
        status: 'completed',
        processedAt: new Date()
      })
    }
  },

  // Withdrawal operations
  async approveWithdrawal(withdrawalId: string) {
    const docRef = doc(db, 'withdrawalRequests', withdrawalId)
    await updateDoc(docRef, {
      status: 'approved',
      processedAt: new Date(),
      processedBy: 'current_admin'
    })
  },

  async rejectWithdrawal(withdrawalId: string) {
    const docRef = doc(db, 'withdrawalRequests', withdrawalId)
    await updateDoc(docRef, {
      status: 'rejected',
      processedAt: new Date(),
      processedBy: 'current_admin'
    })
  },

  async completeWithdrawal(withdrawalId: string) {
    const docRef = doc(db, 'withdrawalRequests', withdrawalId)
    await updateDoc(docRef, {
      status: 'completed',
      processedAt: new Date(),
      processedBy: 'current_admin'
    })
  },

  // User operations
  async updateUserStatus(userId: string, updates: Partial<User>) {
    const docRef = doc(db, 'users', userId)
    await updateDoc(docRef, updates)
  },

  // Plot operations
  async updatePlotPrice(plotId: string, newPrice: number, reason: string) {
    const docRef = doc(db, 'plots', plotId)
    const plotDoc = await getDoc(docRef)
    
    if (plotDoc.exists()) {
      const currentData = plotDoc.data()
      await updateDoc(docRef, {
        pricePerSqm: newPrice,
        previousPrice: currentData.pricePerSqm,
        updatedAt: new Date(),
        updatedBy: 'current_admin'
      })

      // Add to price history
      await addDoc(collection(db, 'priceUpdates'), {
        plotId,
        plotName: currentData.name,
        oldPrice: currentData.pricePerSqm,
        newPrice,
        updatedBy: 'current_admin',
        updatedAt: new Date(),
        reason
      })
    }
  },

  // Referral operations
  async processReferralCommission(referralId: string, action: 'pay' | 'cancel') {
    const docRef = doc(db, 'referrals', referralId)
    const updates: any = {
      status: action === 'pay' ? 'paid' : 'cancelled'
    }
    
    if (action === 'pay') {
      updates.paidAt = new Date()
    }
    
    await updateDoc(docRef, updates)
  },

  // Bulk operations
  async bulkUpdatePlotPrices(plotIds: string[], priceIncreasePercent: number) {
    const batch = plotIds.map(async (plotId) => {
      const docRef = doc(db, 'plots', plotId)
      const plotDoc = await getDoc(docRef)
      
      if (plotDoc.exists()) {
        const currentData = plotDoc.data()
        const newPrice = Math.round(currentData.pricePerSqm * (1 + priceIncreasePercent / 100))
        
        await updateDoc(docRef, {
          pricePerSqm: newPrice,
          previousPrice: currentData.pricePerSqm,
          updatedAt: new Date(),
          updatedBy: 'current_admin'
        })

        await addDoc(collection(db, 'priceUpdates'), {
          plotId,
          plotName: currentData.name,
          oldPrice: currentData.pricePerSqm,
          newPrice,
          updatedBy: 'current_admin',
          updatedAt: new Date(),
          reason: `Bulk update: ${priceIncreasePercent}% increase`
        })
      }
    })

    await Promise.all(batch)
  },

  // Test connection
  async testConnection() {
    try {
      await getDocs(collection(db, 'users'))
      return { connected: true, message: 'Connection successful' }
    } catch (error) {
      return { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      }
    }
  }
}
