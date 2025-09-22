import { collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function testFirebaseCollections() {
  console.log('🔍 Testing Firebase Collections...')
  
  const collections = [
    'user_profiles',
    'projects', 
    'plots',
    'investment_requests',
    'withdrawalRequests',
    'referrals',
    'investments',
    'priceUpdates',
    'notifications'
  ]
  
  const results: any = {}
  
  for (const collectionName of collections) {
    try {
      console.log(`📊 Checking collection: ${collectionName}`)
      const collectionRef = collection(db, collectionName)
      const q = query(collectionRef, limit(5)) // Get first 5 documents
      const snapshot = await getDocs(q)
      
      results[collectionName] = {
        exists: !snapshot.empty,
        count: snapshot.size,
        documents: snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      }
      
      console.log(`✅ ${collectionName}: ${snapshot.size} documents found`)
      if (snapshot.size > 0) {
        console.log(`📄 Sample document:`, snapshot.docs[0].data())
      }
    } catch (error) {
      console.error(`❌ Error accessing ${collectionName}:`, error)
      results[collectionName] = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  return results
}
