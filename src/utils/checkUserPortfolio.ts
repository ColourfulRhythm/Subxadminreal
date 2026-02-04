import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface PortfolioItem {
  id: string
  plotId: string
  plotName: string
  sqm: number
  amountPaid: number
  status: string
  createdAt: any
  projectName?: string
}

interface UserPortfolio {
  user: {
    id: string
    email: string
    fullName: string
    phone?: string
  } | null
  investments: PortfolioItem[]
  totalSqm: number
  totalInvestment: number
}

/**
 * Check what a user owns in their portfolio by email
 */
export async function checkUserPortfolioByEmail(email: string): Promise<UserPortfolio> {
  const normalizedEmail = email.toLowerCase().trim()
  
  console.log(`🔍 Checking portfolio for: ${normalizedEmail}`)
  
  const result: UserPortfolio = {
    user: null,
    investments: [],
    totalSqm: 0,
    totalInvestment: 0
  }

  try {
    // Step 1: Find user by email in user_profiles
    console.log('📋 Step 1: Finding user in user_profiles...')
    const usersSnapshot = await getDocs(collection(db, 'user_profiles'))
    
    let foundUser: any = null
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      const userEmail = (userData.email || '').toLowerCase().trim()
      if (userEmail === normalizedEmail) {
        foundUser = {
          id: doc.id,
          email: userData.email || normalizedEmail,
          fullName: userData.full_name || userData.firstName + ' ' + userData.lastName || 'N/A',
          phone: userData.phone || userData.phone_number || undefined
        }
      }
    })

    if (foundUser) {
      result.user = foundUser
      console.log(`✅ Found user: ${foundUser.fullName} (ID: ${foundUser.id})`)
    } else {
      console.log('⚠️ User not found in user_profiles, will search investments by email only')
    }

    // Step 2: Query investments collection
    console.log('📋 Step 2: Querying investments collection...')
    const investmentsSnapshot = await getDocs(collection(db, 'investments'))
    
    investmentsSnapshot.forEach((doc) => {
      const investment = doc.data()
      
      // Check multiple email field variations
      const investmentEmail = (
        investment.userEmail || 
        investment.user_email || 
        ''
      ).toLowerCase().trim()
      
      // Check if this investment belongs to the user
      const matchesEmail = investmentEmail === normalizedEmail
      const matchesUserId = foundUser && (
        investment.userId === foundUser.id || 
        investment.user_id === foundUser.id
      )
      
      if (matchesEmail || matchesUserId) {
        const sqm = Number(investment.sqm_purchased || investment.sqm || 0)
        const amountPaid = Number(
          investment.amount_paid || 
          investment.Amount_paid || 
          investment.totalAmount || 
          0
        )
        
        const portfolioItem: PortfolioItem = {
          id: doc.id,
          plotId: investment.plotId || investment.plot_id || 'N/A',
          plotName: investment.plotName || investment.plot_name || 'N/A',
          sqm: sqm,
          amountPaid: amountPaid,
          status: investment.status || 'unknown',
          createdAt: investment.createdAt || investment.created_at || null,
          projectName: investment.projectName || investment.project_title || investment.project_name || undefined
        }
        
        result.investments.push(portfolioItem)
        result.totalSqm += sqm
        result.totalInvestment += amountPaid
      }
    })

    console.log(`✅ Found ${result.investments.length} investment(s)`)
    console.log(`📊 Total SQM: ${result.totalSqm}`)
    console.log(`💰 Total Investment: ₦${result.totalInvestment.toLocaleString()}`)

    return result
  } catch (error) {
    console.error('❌ Error checking user portfolio:', error)
    throw error
  }
}

/**
 * Format and display portfolio information
 */
export function formatPortfolioOutput(portfolio: UserPortfolio): string {
  let output = '\n' + '='.repeat(60) + '\n'
  output += 'PORTFOLIO SUMMARY\n'
  output += '='.repeat(60) + '\n\n'
  
  if (portfolio.user) {
    output += `User Information:\n`
    output += `  Name: ${portfolio.user.fullName}\n`
    output += `  Email: ${portfolio.user.email}\n`
    if (portfolio.user.phone) {
      output += `  Phone: ${portfolio.user.phone}\n`
    }
    output += `  User ID: ${portfolio.user.id}\n\n`
  } else {
    output += `User: Not found in user_profiles (searched by email)\n\n`
  }
  
  output += `Portfolio Statistics:\n`
  output += `  Total Investments: ${portfolio.investments.length}\n`
  output += `  Total SQM: ${portfolio.totalSqm.toLocaleString()} sqm\n`
  output += `  Total Investment Value: ₦${portfolio.totalInvestment.toLocaleString()}\n\n`
  
  if (portfolio.investments.length > 0) {
    output += 'Investment Details:\n'
    output += '-'.repeat(60) + '\n'
    
    portfolio.investments.forEach((inv, index) => {
      output += `\n${index + 1}. ${inv.plotName}\n`
      output += `   Plot ID: ${inv.plotId}\n`
      if (inv.projectName) {
        output += `   Project: ${inv.projectName}\n`
      }
      output += `   SQM: ${inv.sqm.toLocaleString()} sqm\n`
      output += `   Amount Paid: ₦${inv.amountPaid.toLocaleString()}\n`
      output += `   Status: ${inv.status}\n`
      if (inv.createdAt) {
        const date = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt)
        output += `   Date: ${date.toLocaleDateString()}\n`
      }
    })
  } else {
    output += 'No investments found for this user.\n'
  }
  
  output += '\n' + '='.repeat(60) + '\n'
  
  return output
}

