// Firebase Collections Configuration for subx-825e9 project
// This file maps all the data points to their respective collections

export const COLLECTIONS = {
  // Core Collections
  USER_PROFILES: 'user_profiles',
  PROJECTS: 'projects', 
  PLOTS: 'plots',
  INVESTMENT_REQUESTS: 'investmentRequests',
  INVESTMENTS: 'investments',
  PLOT_OWNERSHIP: 'plot_ownership',
  WITHDRAWAL_REQUESTS: 'withdrawalRequests',
  REFERRALS: 'referrals',
  NOTIFICATIONS: 'notifications',
  PRICE_UPDATES: 'priceUpdates',
} as const

// Data Point Mappings
export const DATA_MAPPINGS = {
  // Dashboard Overview Tab
  DASHBOARD: {
    totalUsers: COLLECTIONS.USER_PROFILES,
    totalProjects: COLLECTIONS.PROJECTS,
    totalPlots: COLLECTIONS.PLOTS,
    totalSqmSold: COLLECTIONS.PLOTS, // calculated from (totalSqm - availableSqm)
    platformRevenue: COLLECTIONS.PLOTS, // sum of totalRevenue
    pendingVerifications: COLLECTIONS.INVESTMENT_REQUESTS, // status = 'pending'
    activeReferrals: COLLECTIONS.REFERRALS, // status = 'pending' or 'paid'
    recentUserRegistrations: COLLECTIONS.USER_PROFILES,
    recentInvestments: COLLECTIONS.INVESTMENTS,
    systemNotifications: COLLECTIONS.NOTIFICATIONS,
  },

  // User Management Tab
  USER_MANAGEMENT: {
    allUserProfiles: COLLECTIONS.USER_PROFILES,
    userPortfolios: COLLECTIONS.INVESTMENTS,
    userInvestmentHistory: COLLECTIONS.INVESTMENTS,
    userActivityMetrics: COLLECTIONS.USER_PROFILES,
    userEngagementData: COLLECTIONS.USER_PROFILES,
  },

  // Project Management Tab
  PROJECT_MANAGEMENT: {
    allProjectsData: COLLECTIONS.PROJECTS,
    projectStatus: COLLECTIONS.PROJECTS,
    projectRevenue: COLLECTIONS.INVESTMENTS, // calculated from amount_paid by plot via plotId
    developerInformation: COLLECTIONS.PROJECTS,
    projectApprovals: COLLECTIONS.PROJECTS,
    projectTimeline: COLLECTIONS.PROJECTS,
  },

  // Plot Management Tab
  PLOT_MANAGEMENT: {
    allPlotsData: COLLECTIONS.PLOTS,
    plotAvailability: COLLECTIONS.PLOTS,
    ownerCount: COLLECTIONS.PLOTS,
    revenueTracking: COLLECTIONS.PLOTS,
    plotStatus: COLLECTIONS.PLOTS,
    ownershipPercentage: COLLECTIONS.PLOTS, // calculated
    purchaseHistory: COLLECTIONS.PLOTS, // purchases array
  },

  // Investment Requests Tab
  INVESTMENT_REQUESTS: {
    allRequests: COLLECTIONS.INVESTMENT_REQUESTS,
    requestStatus: COLLECTIONS.INVESTMENT_REQUESTS,
    userInformation: COLLECTIONS.INVESTMENT_REQUESTS,
    plotInformation: COLLECTIONS.INVESTMENT_REQUESTS,
    amountDetails: COLLECTIONS.INVESTMENT_REQUESTS,
    paymentStatus: COLLECTIONS.INVESTMENT_REQUESTS,
    referralData: COLLECTIONS.INVESTMENT_REQUESTS,
    processingTimestamps: COLLECTIONS.INVESTMENT_REQUESTS,
  },

  // Withdrawal Management Tab
  WITHDRAWAL_MANAGEMENT: {
    allWithdrawalRequests: COLLECTIONS.WITHDRAWAL_REQUESTS,
    withdrawalStatus: COLLECTIONS.WITHDRAWAL_REQUESTS,
    userInformation: COLLECTIONS.WITHDRAWAL_REQUESTS,
    amountAndType: COLLECTIONS.WITHDRAWAL_REQUESTS,
    bankDetails: COLLECTIONS.WITHDRAWAL_REQUESTS,
    processingData: COLLECTIONS.WITHDRAWAL_REQUESTS,
    timelineData: COLLECTIONS.WITHDRAWAL_REQUESTS,
  },

  // Referral Analytics Tab
  REFERRAL_ANALYTICS: {
    allReferralsData: COLLECTIONS.REFERRALS,
    referrerInformation: COLLECTIONS.USER_PROFILES, // referrerId, referrerEmail
    referredUserInfo: COLLECTIONS.REFERRALS,
    commissionData: COLLECTIONS.REFERRALS,
    paymentTimestamps: COLLECTIONS.REFERRALS,
    topReferrersMetrics: COLLECTIONS.REFERRALS, // aggregated
    referralPerformance: COLLECTIONS.REFERRALS, // calculated
  },

  // Pricing Management Tab
  PRICING_MANAGEMENT: {
    allPlotsPricing: COLLECTIONS.PLOTS,
    priceHistory: COLLECTIONS.PRICE_UPDATES,
    plotDetails: COLLECTIONS.PLOTS,
    statusInformation: COLLECTIONS.PLOTS,
    updateHistory: COLLECTIONS.PLOTS,
    bulkPricingData: COLLECTIONS.PLOTS,
  },

  // Analytics
  ANALYTICS: {
    monthlyRevenueTrends: COLLECTIONS.INVESTMENTS,
    userRegistrationTrends: COLLECTIONS.USER_PROFILES,
    plotSalesTrends: COLLECTIONS.PLOTS,
    referralConversionRates: COLLECTIONS.REFERRALS, // calculated
    projectCompletionRates: COLLECTIONS.PROJECTS,
    paymentSuccessRates: COLLECTIONS.INVESTMENT_REQUESTS, // calculated
  },
} as const

// Field Mappings for specific calculations
export const FIELD_MAPPINGS = {
  USER_PROFILES: {
    verificationStatus: 'isVerified', // Note: This field doesn't exist, using investment_requests instead
    activityMetrics: ['lastLogin', 'totalInvestments'],
    engagementData: ['createdAt', 'lastLogin'],
  },
  
  PLOTS: {
    availability: ['availableSqm', 'totalSqm'],
    ownership: ['totalOwners', 'totalSqm', 'availableSqm'],
    revenue: ['totalRevenue', 'averageRevenue'],
    pricing: ['pricePerSqm', 'currentPrice'],
  },
  
  INVESTMENT_REQUESTS: {
    status: 'status',
    userInfo: ['userName', 'userEmail'],
    plotInfo: ['plotName', 'plotId'],
    amountInfo: ['sqm', 'pricePerSqm', 'totalAmount'],
    paymentInfo: ['paymentStatus', 'paymentMethod'],
    referralInfo: ['referralCode', 'referralCommission'],
    timestamps: ['createdAt', 'processedAt'],
  },
  
  PROJECTS: {
    revenue: 'totalRevenue', // Calculated from investments collection
    developerInfo: ['developerId', 'developerName'],
    approvals: 'isApproved',
    timeline: ['startDate', 'expectedCompletion'],
  },
} as const

// Helper function to get collection name for a data point
export function getCollectionForDataPoint(category: keyof typeof DATA_MAPPINGS, dataPoint: string): string {
  const categoryMappings = DATA_MAPPINGS[category] as Record<string, string>
  return categoryMappings[dataPoint] || ''
}

// Helper function to get all collections used
export function getAllCollections(): string[] {
  const collections = new Set<string>()
  
  Object.values(DATA_MAPPINGS).forEach(category => {
    Object.values(category).forEach(collection => {
      collections.add(collection)
    })
  })
  
  return Array.from(collections)
}
