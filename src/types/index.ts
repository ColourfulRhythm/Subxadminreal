export interface User {
  id: string
  email: string
  full_name: string
  firstName?: string
  lastName?: string
  phone?: string
  isActive?: boolean
  created_at: Date
  lastLogin?: Date
  totalInvestments?: number
  portfolio?: PortfolioItem[]
  referral_code: string
  referred_by?: string
  wallet_balance?: number
  address?: string
  occupation?: string
  bank_name?: string
  avatar_url?: string
  user_id?: string
  migrated_at?: Date
  updated_at?: Date
  date_of_birth?: string
  source_table?: string
}

export interface PortfolioItem {
  id: string
  plotId: string
  plotName: string
  sqm: number
  purchasePrice: number
  purchaseDate: Date
  currentValue: number
}

export interface Project {
  id: string
  name: string
  description: string
  location: string
  totalPlots: number
  totalSqm: number
  pricePerSqm: number
  status: 'planning' | 'active' | 'completed' | 'paused'
  startDate: Date
  expectedCompletion?: Date
  developerId: string
  developerName: string
  revenue: number
  isApproved: boolean
}

export interface Plot {
  id: string
  projectId: string
  projectName: string
  name: string
  totalSqm: number
  availableSqm: number
  pricePerSqm: number
  totalOwners: number
  Total_owners?: number // Added for Firebase compatibility
  totalRevenue: number
  averageRevenue: number
  status: 'available' | 'popular' | 'low_stock' | 'sold_out'
  ownershipPercentage: number
  purchases: PlotPurchase[]
  createdAt: Date
  updatedAt: Date
}

export interface PlotPurchase {
  id: string
  userId: string
  userName: string
  sqm: number
  price: number
  purchaseDate: Date
  status: 'pending' | 'completed' | 'cancelled'
}

export interface InvestmentRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  plotId: string
  plotName: string
  sqm: number
  pricePerSqm: number
  totalAmount: number
  Amount_paid?: number // Added for Firebase compatibility
  amount_paid?: number // Added for Firebase compatibility
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: Date
  processedAt?: Date
  referralCode?: string
  referralCommission?: number
  paymentMethod: string
  paymentStatus: 'pending' | 'verified' | 'failed'
}

export interface WithdrawalRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  amount: number
  type: 'referral' | 'investment_return' | 'other'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  bankDetails: {
    accountNumber: string
    bankName: string
    accountName: string
  }
  createdAt: Date
  processedAt?: Date
  processedBy?: string
}

export interface ReferralData {
  id: string
  referrerId: string
  referrerEmail: string
  referredUserId: string
  referredUserEmail: string
  commission: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: Date
  paidAt?: Date
}

export interface DashboardStats {
  totalUsers: number
  totalProjects: number
  totalPlots: number
  totalSqmSold: number
  platformRevenue: number
  pendingVerifications: number
  activeReferrals: number
  systemHealth: {
    firebaseStatus: 'connected' | 'disconnected' | 'error'
    dataIntegrity: 'healthy' | 'issues_detected'
    lastSync: Date
  }
}

export interface RecentActivity {
  id: string
  type: 'user_registration' | 'investment' | 'withdrawal' | 'system_notification'
  description: string
  timestamp: Date
  userId?: string
  amount?: number
  status?: string
}

export interface PriceUpdate {
  id: string
  plotId: string
  plotName: string
  oldPrice: number
  newPrice: number
  updatedBy: string
  updatedAt: Date
  reason: string
}
