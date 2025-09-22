import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function inspectFirebaseData() {
  console.log('🔍 Inspecting Firebase Data Structure...')
  
  const results: any = {}
  
  // Inspect user_profiles collection
  try {
    const usersSnapshot = await getDocs(collection(db, 'user_profiles'))
    console.log(`📊 user_profiles: ${usersSnapshot.size} documents`)
    if (usersSnapshot.size > 0) {
      const sampleUser = usersSnapshot.docs[0].data()
      console.log('📄 Sample user data:', sampleUser)
      results.user_profiles = {
        count: usersSnapshot.size,
        sample: sampleUser,
        fields: Object.keys(sampleUser)
      }
    }
  } catch (error) {
    console.error('❌ Error accessing user_profiles:', error)
  }

  // Inspect projects collection
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'))
    console.log(`📊 projects: ${projectsSnapshot.size} documents`)
    if (projectsSnapshot.size > 0) {
      const sampleProject = projectsSnapshot.docs[0].data()
      console.log('📄 Sample project data:', sampleProject)
      results.projects = {
        count: projectsSnapshot.size,
        sample: sampleProject,
        fields: Object.keys(sampleProject)
      }
    }
  } catch (error) {
    console.error('❌ Error accessing projects:', error)
  }

  // Inspect plots collection
  try {
    const plotsSnapshot = await getDocs(collection(db, 'plots'))
    console.log(`📊 plots: ${plotsSnapshot.size} documents`)
    if (plotsSnapshot.size > 0) {
      const samplePlot = plotsSnapshot.docs[0].data()
      console.log('📄 Sample plot data:', samplePlot)
      results.plots = {
        count: plotsSnapshot.size,
        sample: samplePlot,
        fields: Object.keys(samplePlot)
      }
    }
  } catch (error) {
    console.error('❌ Error accessing plots:', error)
  }

  // Inspect referrals collection
  try {
    const referralsSnapshot = await getDocs(collection(db, 'referrals'))
    console.log(`📊 referrals: ${referralsSnapshot.size} documents`)
    if (referralsSnapshot.size > 0) {
      const sampleReferral = referralsSnapshot.docs[0].data()
      console.log('📄 Sample referral data:', sampleReferral)
      results.referrals = {
        count: referralsSnapshot.size,
        sample: sampleReferral,
        fields: Object.keys(sampleReferral)
      }
    }
  } catch (error) {
    console.error('❌ Error accessing referrals:', error)
  }

  // Inspect investment_requests collection
  try {
    const investmentRequestsSnapshot = await getDocs(collection(db, 'investment_requests'))
    console.log(`📊 investment_requests: ${investmentRequestsSnapshot.size} documents`)
    if (investmentRequestsSnapshot.size > 0) {
      const sampleRequest = investmentRequestsSnapshot.docs[0].data()
      console.log('📄 Sample investment request data:', sampleRequest)
      results.investment_requests = {
        count: investmentRequestsSnapshot.size,
        sample: sampleRequest,
        fields: Object.keys(sampleRequest)
      }
    }
  } catch (error) {
    console.error('❌ Error accessing investment_requests:', error)
  }

  // Inspect investments collection
  try {
    const investmentsSnapshot = await getDocs(collection(db, 'investments'))
    console.log(`📊 investments: ${investmentsSnapshot.size} documents`)
    if (investmentsSnapshot.size > 0) {
      const sampleInvestment = investmentsSnapshot.docs[0].data()
      console.log('📄 Sample investment data:', sampleInvestment)
      results.investments = {
        count: investmentsSnapshot.size,
        sample: sampleInvestment,
        fields: Object.keys(sampleInvestment)
      }
    }
  } catch (error) {
    console.error('❌ Error accessing investments:', error)
  }

  return results
}
