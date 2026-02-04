import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'

interface InvestmentRecord {
  id: string
  userId?: string
  user_id?: string
  userEmail?: string
  user_email?: string
  plotId?: string
  plot_id?: string
  projectId?: string
  project_id?: string
  sqm?: number
  sqm_purchased?: number
  amount_paid?: number
  Amount_paid?: number
  price_per_sqm?: number
  pricePerSqm?: number
  [key: string]: any
}

interface OwnershipRecord {
  userId: string
  plotId: string
  investmentId: string
  [key: string]: any
}

/**
 * Migrate existing investments to plot_ownership collection
 * This script finds all investments that don't have corresponding ownership records
 * and creates them.
 */
export async function migrateInvestmentsToOwnership(): Promise<{
  success: boolean
  message: string
  stats: {
    totalInvestments: number
    existingOwnership: number
    created: number
    failed: number
    errors: string[]
  }
}> {
  const stats = {
    totalInvestments: 0,
    existingOwnership: 0,
    created: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    console.log('🔄 Starting migration: Investments → Plot Ownership')
    console.log('='.repeat(60))

    // Step 1: Get all investments
    console.log('📋 Step 1: Fetching all investments...')
    const investmentsSnapshot = await getDocs(collection(db, 'investments'))
    const investments: InvestmentRecord[] = []
    
    investmentsSnapshot.forEach((doc) => {
      investments.push({ id: doc.id, ...doc.data() } as InvestmentRecord)
    })
    
    stats.totalInvestments = investments.length
    console.log(`✅ Found ${investments.length} total investments`)

    // Step 2: Get all existing ownership records to avoid duplicates
    console.log('\n📋 Step 2: Fetching existing ownership records...')
    const ownershipSnapshot = await getDocs(collection(db, 'plot_ownership'))
    const existingOwnership = new Set<string>()
    
    ownershipSnapshot.forEach((doc) => {
      const data = doc.data()
      const investmentId = data.investmentId || data.investment_id
      if (investmentId) {
        existingOwnership.add(investmentId)
      }
    })
    
    stats.existingOwnership = existingOwnership.size
    console.log(`✅ Found ${existingOwnership.size} existing ownership records`)

    // Step 3: Process each investment
    console.log('\n📋 Step 3: Processing investments...')
    console.log('-'.repeat(60))

    for (let i = 0; i < investments.length; i++) {
      const investment = investments[i]
      const investmentId = investment.id

      // Skip if ownership record already exists
      if (existingOwnership.has(investmentId)) {
        console.log(`⏭️  [${i + 1}/${investments.length}] Skipping ${investmentId} - ownership exists`)
        continue
      }

      try {
        // Get required fields
        const userId = investment.userId || investment.user_id
        const plotId = investment.plotId || investment.plot_id
        const sqm = investment.sqm_purchased || investment.sqm || 0
        const amountPaid = investment.amount_paid || investment.Amount_paid || 0
        const pricePerSqm = investment.price_per_sqm || investment.pricePerSqm || 0

        if (!userId || !plotId) {
          stats.failed++
          const error = `Investment ${investmentId}: Missing userId or plotId`
          stats.errors.push(error)
          console.log(`❌ [${i + 1}/${investments.length}] ${error}`)
          continue
        }

        // Fetch user data
        const userRef = doc(db, 'user_profiles', userId)
        const userDoc = await getDoc(userRef)
        const userData = userDoc.exists() ? userDoc.data() : {}

        // Fetch plot data
        const plotRef = doc(db, 'plots', plotId)
        const plotDoc = await getDoc(plotRef)
        const plotData = plotDoc.exists() ? plotDoc.data() : {}

        // Get user email and name
        const userEmail = investment.userEmail || investment.user_email || (userData as any).email || ''
        const userName = investment.userName || investment.user_name || (userData as any).full_name || (userData as any).userName || ''

        // Get plot and project names
        const plotName = investment.plotName || investment.plot_name || (plotData as any).name || (plotData as any).plotName || ''
        const projectId = investment.projectId || investment.project_id || (plotData as any).projectId || (plotData as any).project_id || ''
        const projectName = investment.projectName || investment.project_title || (plotData as any).projectName || (plotData as any).project_name || ''

        // Create ownership record
        const ownershipData = {
          userId: userId,
          user_id: userId,
          userEmail: userEmail,
          user_email: userEmail,
          userName: userName,
          user_name: userName,
          plotId: plotId,
          plot_id: plotId,
          plotName: plotName,
          plot_name: plotName,
          projectId: projectId,
          project_id: projectId,
          projectName: projectName,
          project_name: projectName,
          sqm: sqm,
          sqm_owned: sqm,
          amountPaid: amountPaid,
          amount_paid: amountPaid,
          pricePerSqm: pricePerSqm,
          price_per_sqm: pricePerSqm,
          investmentId: investmentId,
          investment_id: investmentId,
          status: investment.status || 'active',
          ownership_type: investment.investment_type || 'plot_purchase',
          created_at: investment.created_at || investment.createdAt || serverTimestamp(),
          createdAt: investment.created_at || investment.createdAt || serverTimestamp(),
          source: investment.source || 'migration',
          original_request_id: investment.original_request_id || null
        }

        await addDoc(collection(db, 'plot_ownership'), ownershipData)
        stats.created++
        console.log(`✅ [${i + 1}/${investments.length}] Created ownership for investment ${investmentId} (User: ${userEmail})`)

      } catch (error) {
        stats.failed++
        const errorMsg = `Investment ${investmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        stats.errors.push(errorMsg)
        console.log(`❌ [${i + 1}/${investments.length}] ${errorMsg}`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log(`   Total Investments: ${stats.totalInvestments}`)
    console.log(`   Existing Ownership: ${stats.existingOwnership}`)
    console.log(`   Created: ${stats.created}`)
    console.log(`   Failed: ${stats.failed}`)
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`)
      stats.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`)
      })
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`)
      }
    }
    console.log('='.repeat(60))

    return {
      success: stats.failed === 0,
      message: `Migration completed: ${stats.created} ownership records created, ${stats.failed} failed`,
      stats
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats
    }
  }
}

/**
 * Check migration status - count investments without ownership records
 */
export async function checkMigrationStatus(): Promise<{
  totalInvestments: number
  totalOwnership: number
  missingOwnership: number
  sampleMissing: InvestmentRecord[]
}> {
  try {
    // Get all investments
    const investmentsSnapshot = await getDocs(collection(db, 'investments'))
    const investments: InvestmentRecord[] = []
    investmentsSnapshot.forEach((doc) => {
      investments.push({ id: doc.id, ...doc.data() } as InvestmentRecord)
    })

    // Get all ownership records
    const ownershipSnapshot = await getDocs(collection(db, 'plot_ownership'))
    const ownershipByInvestment = new Set<string>()
    ownershipSnapshot.forEach((doc) => {
      const data = doc.data()
      const investmentId = data.investmentId || data.investment_id
      if (investmentId) {
        ownershipByInvestment.add(investmentId)
      }
    })

    // Find missing
    const missing = investments.filter(inv => !ownershipByInvestment.has(inv.id))

    return {
      totalInvestments: investments.length,
      totalOwnership: ownershipSnapshot.size,
      missingOwnership: missing.length,
      sampleMissing: missing.slice(0, 10)
    }
  } catch (error) {
    console.error('Error checking migration status:', error)
    throw error
  }
}

