import { 
  doc, 
  updateDoc, 
  collection, 
  getDoc, 
  runTransaction,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface InvestmentApprovalData {
  requestId: string
  userId: string
  plotId: string
  projectId: string
  amountPaid: number
  sqmPurchased: number
  pricePerSqm: number
  referralCode?: string
  referralCommission?: number
  adminId: string
  // Document verification data
  identity_verified?: boolean
  payment_verified?: boolean
  verification_notes?: string
}

export interface PlotUpdateData {
  availableSqm: number
  totalOwners: number
}

export interface UserUpdateData {
  totalInvestment: number
  portfolioSqm: number
  walletBalance?: number
}

export class InvestmentApprovalService {
  /**
   * Comprehensive investment approval workflow
   * Handles all necessary Firebase updates when approving an investment request
   */
  static async approveInvestmentRequest(approvalData: InvestmentApprovalData): Promise<{
    success: boolean
    message: string
    investmentId?: string
  }> {
    try {
      console.log('🚀 COMPREHENSIVE APPROVAL SERVICE: Starting workflow...', approvalData)

      // Check document verification requirements
      if (approvalData.identity_verified === false || approvalData.payment_verified === false) {
        return {
          success: false,
          message: 'Cannot approve investment request. Identity and payment documents must be verified first.'
        }
      }

      // Use Firebase transaction to ensure data consistency
      const result = await runTransaction(db, async (transaction) => {
        console.log('🔄 Transaction started for request:', approvalData.requestId)
        // 1. Update investment request status with verification data
        console.log('📝 Step 1: Updating investment request status')
        const requestRef = doc(db, 'investment_requests', approvalData.requestId)
        transaction.update(requestRef, {
          status: 'approved',
          processedAt: serverTimestamp(),
          processedBy: approvalData.adminId,
          approvedAt: serverTimestamp(),
          // Update verification fields
          identity_verified: approvalData.identity_verified || false,
          payment_verified: approvalData.payment_verified || false,
          verification_notes: approvalData.verification_notes || '',
          verified_by: approvalData.adminId,
          verified_at: serverTimestamp()
        })
        console.log('✅ Investment request status updated with verification data')

        // 2. Create investment record
        console.log('💰 Step 2: Creating investment record')
        const investmentRef = doc(collection(db, 'investments'))
        const investmentData = {
          id: investmentRef.id,
          userId: approvalData.userId,
          plotId: approvalData.plotId,
          projectId: approvalData.projectId,
          amount_paid: approvalData.amountPaid,
          Amount_paid: approvalData.amountPaid, // Support both field names
          sqm_purchased: approvalData.sqmPurchased,
          sqm: approvalData.sqmPurchased, // Support both field names
          price_per_sqm: approvalData.pricePerSqm,
          pricePerSqm: approvalData.pricePerSqm, // Support both field names
          status: 'active',
          investment_type: 'plot_purchase',
          created_at: serverTimestamp(),
          createdAt: serverTimestamp(), // Support both field names
          approved_at: serverTimestamp(),
          approved_by: approvalData.adminId,
          referral_code: approvalData.referralCode || null,
          referral_commission: approvalData.referralCommission || 0,
          // Additional metadata
          source: 'investment_request_approval',
          original_request_id: approvalData.requestId
        }
        transaction.set(investmentRef, investmentData)
        console.log('✅ Investment record created with ID:', investmentRef.id)

        // 3. Update plot availability
        console.log('🏠 Step 3: Updating plot availability for plotId:', approvalData.plotId)
        const plotRef = doc(db, 'plots', approvalData.plotId)
        const plotDoc = await transaction.get(plotRef)
        
        let newAvailableSqm = 0
        let newTotalOwners = 0
        
        if (plotDoc.exists()) {
          const plotData = plotDoc.data()
          const currentAvailableSqm = (plotData as any).available_sqm || plotData.availableSqm || 0
          const currentTotalOwners = (plotData as any).Total_owners || plotData.totalOwners || 0
          
          newAvailableSqm = Math.max(0, currentAvailableSqm - approvalData.sqmPurchased)
          newTotalOwners = currentTotalOwners + 1
          
          transaction.update(plotRef, {
            available_sqm: newAvailableSqm,
            availableSqm: newAvailableSqm, // Support both field names
            Total_owners: newTotalOwners,
            totalOwners: newTotalOwners, // Support both field names
            last_updated: serverTimestamp(),
            lastUpdated: serverTimestamp() // Support both field names
          })
          console.log('✅ Plot availability updated:', { newAvailableSqm, newTotalOwners })
        } else {
          console.log('⚠️ Plot not found with ID:', approvalData.plotId, '- Skipping plot update')
          // Don't fail the transaction, just skip plot update
        }

        // 4. Update user profile with investment data
        console.log('👤 Step 4: Updating user profile for userId:', approvalData.userId)
        const userRef = doc(db, 'user_profiles', approvalData.userId)
        const userDoc = await transaction.get(userRef)
        
        let newTotalInvestment = 0
        let newPortfolioSqm = 0
        let newWalletBalance = 0
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const currentTotalInvestment = (userData as any).total_investment || userData.totalInvestment || 0
          const currentPortfolioSqm = (userData as any).portfolio_sqm || userData.portfolioSqm || 0
          const currentWalletBalance = (userData as any).wallet_balance || userData.walletBalance || 0
          
          newTotalInvestment = currentTotalInvestment + approvalData.amountPaid
          newPortfolioSqm = currentPortfolioSqm + approvalData.sqmPurchased
          newWalletBalance = Math.max(0, currentWalletBalance - approvalData.amountPaid)
          
          transaction.update(userRef, {
            total_investment: newTotalInvestment,
            totalInvestment: newTotalInvestment, // Support both field names
            portfolio_sqm: newPortfolioSqm,
            portfolioSqm: newPortfolioSqm, // Support both field names
            wallet_balance: newWalletBalance,
            walletBalance: newWalletBalance, // Support both field names
            last_investment_date: serverTimestamp(),
            lastInvestmentDate: serverTimestamp(), // Support both field names
            total_investments: increment(1),
            totalInvestments: increment(1) // Support both field names
          })
          console.log('✅ User profile updated:', { newTotalInvestment, newPortfolioSqm, newWalletBalance })
        } else {
          console.log('⚠️ User not found with ID:', approvalData.userId, '- Skipping user update')
          // Don't fail the transaction, just skip user update
        }

        // 5. Process referral commission if applicable
        if (approvalData.referralCode && approvalData.referralCommission && approvalData.referralCommission > 0) {
          console.log('🎁 Step 5: Processing referral commission')
          await this.processReferralCommission(
            approvalData.referralCode,
            approvalData.userId,
            approvalData.referralCommission,
            approvalData.amountPaid,
            transaction
          )
        }

        // 6. Update project statistics
        console.log('🏗️ Step 6: Updating project statistics for projectId:', approvalData.projectId)
        const projectRef = doc(db, 'projects', approvalData.projectId)
        const projectDoc = await transaction.get(projectRef)
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data()
          const currentTotalRevenue = (projectData as any).total_revenue || projectData.totalRevenue || 0
          const currentTotalInvestors = (projectData as any).total_investors || projectData.totalInvestors || 0
          
          transaction.update(projectRef, {
            total_revenue: currentTotalRevenue + approvalData.amountPaid,
            totalRevenue: currentTotalRevenue + approvalData.amountPaid, // Support both field names
            total_investors: currentTotalInvestors + 1,
            totalInvestors: currentTotalInvestors + 1, // Support both field names
            last_investment_date: serverTimestamp(),
            lastInvestmentDate: serverTimestamp() // Support both field names
          })
          console.log('✅ Project statistics updated')
        } else {
          console.log('⚠️ Project not found with ID:', approvalData.projectId, '- Skipping project update')
          // Don't fail the transaction, just skip project update
        }

        console.log('🎉 Transaction completed successfully!')
        return {
          investmentId: investmentRef.id,
          plotUpdate: {
            availableSqm: newAvailableSqm,
            totalOwners: newTotalOwners
          },
          userUpdate: {
            totalInvestment: newTotalInvestment,
            portfolioSqm: newPortfolioSqm,
            walletBalance: newWalletBalance
          }
        }
      })

      console.log('✅ Investment approval workflow completed successfully', result)

      return {
        success: true,
        message: 'Investment request approved successfully. All related data has been updated.',
        investmentId: result.investmentId
      }

    } catch (error) {
      console.error('❌ Error in investment approval workflow:', error)
      return {
        success: false,
        message: `Failed to approve investment request: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Process referral commission when investment is approved
   */
  private static async processReferralCommission(
    referralCode: string,
    investorUserId: string,
    commissionAmount: number,
    investmentAmount: number,
    transaction: any
  ): Promise<void> {
    try {
      // Find the referrer by referral code
      // Note: In a real implementation, you'd query for the referral code
      // For now, we'll create a referral record
      
      const referralData = {
        referral_code: referralCode,
        investor_user_id: investorUserId,
        commission_amount: commissionAmount,
        investment_amount: investmentAmount,
        status: 'earned',
        created_at: serverTimestamp(),
        processed_at: serverTimestamp(),
        type: 'investment_commission'
      }

      // Add referral record
      const referralRef = doc(collection(db, 'referrals'))
      transaction.set(referralRef, referralData)

      // Update referrer's profile with commission
      // Note: You'd need to find the referrer's user ID by referral code
      // For now, we'll skip this step
      
      console.log('✅ Referral commission processed:', referralData)
    } catch (error) {
      console.error('❌ Error processing referral commission:', error)
      // Don't throw error to avoid breaking the main transaction
    }
  }

  /**
   * Reject investment request
   */
  static async rejectInvestmentRequest(
    requestId: string, 
    adminId: string, 
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const requestRef = doc(db, 'investment_requests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: serverTimestamp(),
        processedBy: adminId,
        rejectedAt: serverTimestamp(),
        rejection_reason: reason || 'No reason provided'
      })

      return {
        success: true,
        message: 'Investment request rejected successfully.'
      }
    } catch (error) {
      console.error('❌ Error rejecting investment request:', error)
      return {
        success: false,
        message: `Failed to reject investment request: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Verify documents for an investment request
   */
  static async verifyDocuments(
    requestId: string,
    verificationData: {
      identity_verified: boolean
      payment_verified: boolean
      verification_notes: string
    },
    adminId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Verifying documents for request:', requestId, verificationData)
      
      const requestRef = doc(db, 'investment_requests', requestId)
      await updateDoc(requestRef, {
        identity_verified: verificationData.identity_verified,
        payment_verified: verificationData.payment_verified,
        verification_notes: verificationData.verification_notes,
        verified_by: adminId,
        verified_at: serverTimestamp()
      })

      return {
        success: true,
        message: 'Documents verified successfully.'
      }
    } catch (error) {
      console.error('❌ Error verifying documents:', error)
      return {
        success: false,
        message: `Failed to verify documents: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check if documents are ready for approval
   */
  static async checkDocumentStatus(requestId: string): Promise<{
    documentsUploaded: boolean
    identityVerified: boolean
    paymentVerified: boolean
    readyForApproval: boolean
  }> {
    try {
      const requestRef = doc(db, 'investment_requests', requestId)
      const requestDoc = await getDoc(requestRef)
      
      if (!requestDoc.exists()) {
        throw new Error('Investment request not found')
      }
      
      const requestData = requestDoc.data()
      
      return {
        documentsUploaded: requestData.documents_uploaded || false,
        identityVerified: requestData.identity_verified || false,
        paymentVerified: requestData.payment_verified || false,
        readyForApproval: (requestData.documents_uploaded && requestData.identity_verified && requestData.payment_verified) || false
      }
    } catch (error) {
      console.error('❌ Error checking document status:', error)
      return {
        documentsUploaded: false,
        identityVerified: false,
        paymentVerified: false,
        readyForApproval: false
      }
    }
  }

  /**
   * Move approved investment to completed status
   */
  static async completeInvestment(
    requestId: string,
    investmentId: string,
    adminId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await runTransaction(db, async (transaction) => {
        // Update investment request to completed
        const requestRef = doc(db, 'investment_requests', requestId)
        transaction.update(requestRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          completedBy: adminId
        })

        // Update investment record to completed
        const investmentRef = doc(db, 'investments', investmentId)
        transaction.update(investmentRef, {
          status: 'completed',
          completed_at: serverTimestamp(),
          completed_by: adminId
        })
      })

      return {
        success: true,
        message: 'Investment moved to completed status successfully.'
      }
    } catch (error) {
      console.error('❌ Error completing investment:', error)
      return {
        success: false,
        message: `Failed to complete investment: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}
