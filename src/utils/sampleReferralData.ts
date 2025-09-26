import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface SampleReferralData {
  referrerId: string
  referrerEmail: string
  referredUserId: string
  referredUserEmail: string
  commission: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: Date
  paidAt?: Date
}

/**
 * Create sample referral data for testing
 */
export const createSampleReferralData = (): SampleReferralData[] => {
  return [
    {
      referrerId: 'user-123',
      referrerEmail: 'john.doe@example.com',
      referredUserId: 'user-456',
      referredUserEmail: 'jane.smith@example.com',
      commission: 25000,
      status: 'paid',
      createdAt: new Date('2024-01-15'),
      paidAt: new Date('2024-01-20')
    },
    {
      referrerId: 'user-123',
      referrerEmail: 'john.doe@example.com',
      referredUserId: 'user-789',
      referredUserEmail: 'mike.wilson@example.com',
      commission: 30000,
      status: 'pending',
      createdAt: new Date('2024-01-18')
    },
    {
      referrerId: 'user-456',
      referrerEmail: 'jane.smith@example.com',
      referredUserId: 'user-101',
      referredUserEmail: 'sarah.jones@example.com',
      commission: 20000,
      status: 'paid',
      createdAt: new Date('2024-01-10'),
      paidAt: new Date('2024-01-15')
    },
    {
      referrerId: 'user-789',
      referrerEmail: 'mike.wilson@example.com',
      referredUserId: 'user-202',
      referredUserEmail: 'alex.brown@example.com',
      commission: 15000,
      status: 'cancelled',
      createdAt: new Date('2024-01-12')
    },
    {
      referrerId: 'user-101',
      referrerEmail: 'sarah.jones@example.com',
      referredUserId: 'user-303',
      referredUserEmail: 'emma.davis@example.com',
      commission: 35000,
      status: 'paid',
      createdAt: new Date('2024-01-08'),
      paidAt: new Date('2024-01-12')
    }
  ]
}

/**
 * Add sample referral data to Firebase
 */
export const addSampleReferralData = async (): Promise<{
  success: boolean
  message: string
  count: number
}> => {
  try {
    console.log('🔄 Adding sample referral data to Firebase...')
    
    const sampleData = createSampleReferralData()
    const referralsRef = collection(db, 'referrals')
    
    const promises = sampleData.map(async (referral) => {
      const docRef = await addDoc(referralsRef, {
        ...referral,
        createdAt: serverTimestamp(),
        paidAt: referral.paidAt ? serverTimestamp() : null
      })
      console.log(`✅ Added referral: ${docRef.id}`)
      return docRef.id
    })
    
    const docIds = await Promise.all(promises)
    
    console.log(`✅ Successfully added ${docIds.length} sample referrals`)
    
    return {
      success: true,
      message: `Successfully added ${docIds.length} sample referrals to Firebase`,
      count: docIds.length
    }
  } catch (error) {
    console.error('❌ Error adding sample referral data:', error)
    return {
      success: false,
      message: `Failed to add sample referral data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      count: 0
    }
  }
}

/**
 * Check if referrals collection has data
 */
export const checkReferralsData = async (): Promise<{
  hasData: boolean
  count: number
  sampleData?: any
}> => {
  try {
    const referralsRef = collection(db, 'referrals')
    const snapshot = await getDocs(referralsRef)
    
    if (snapshot.size > 0) {
      const sampleData = snapshot.docs[0].data()
      return {
        hasData: true,
        count: snapshot.size,
        sampleData
      }
    }
    
    return {
      hasData: false,
      count: 0
    }
  } catch (error) {
    console.error('❌ Error checking referrals data:', error)
    return {
      hasData: false,
      count: 0
    }
  }
}
