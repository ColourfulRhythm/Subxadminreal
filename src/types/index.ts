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
  status?: string // Added for compatibility
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
  status: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'completed'
  createdAt: Date
  processedAt?: Date
  referralCode?: string
  referralCommission?: number
  paymentMethod: string
  paymentStatus: 'pending' | 'verified' | 'failed'
  // Legacy snake_case properties for Firebase compatibility
  user_id?: string
  user_name?: string
  user_email?: string
  plot_name?: string
  project_title?: string
  price_per_sqm?: number
  current_price_per_sqm?: number // Added for current plot pricing
  payment_status?: string
  payment_method?: string
  referral_code?: string
  referral_commission?: number
  created_at?: Date
  sqm_purchased?: number // Added for portfolio calculations
  // Additional fields for comprehensive approval workflow
  projectId?: string
  project_id?: string
  investmentId?: string // Added to track created investment record
  approvedAt?: Date
  approved_by?: string
  processedBy?: string
  rejection_reason?: string
  completedAt?: Date
  completed_by?: string
  
  // New security verification fields
  means_of_id_url?: string           // URL to identity document (passport, driver's license, etc.)
  payment_receipt_url?: string       // URL to payment receipt/proof
  documents_uploaded?: boolean       // Flag indicating if documents were uploaded
  uploaded_at?: Date                 // Timestamp when documents were uploaded
  
  // Additional verification fields
  identity_verified?: boolean        // Admin verification status
  payment_verified?: boolean         // Admin payment verification status
  verification_notes?: string        // Admin notes during verification
  verified_by?: string             // Admin who verified the documents
  verified_at?: Date                 // When verification was completed
}

export interface Investment {
  id: string
  userId: string
  plotId: string
  projectId: string
  amount_paid: number
  Amount_paid?: number // Support both field names
  sqm_purchased: number
  sqm?: number // Support both field names
  price_per_sqm: number
  pricePerSqm?: number // Support both field names
  status: 'active' | 'completed' | 'cancelled'
  investment_type: 'plot_purchase' | 'referral_commission' | 'other'
  created_at: Date
  createdAt?: Date // Support both field names
  approved_at?: Date
  approved_by?: string
  completed_at?: Date
  completed_by?: string
  referral_code?: string
  referral_commission?: number
  source: string
  original_request_id?: string
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
  // Referral withdrawal fields
  referrer_code?: string
  referrerId?: string
  referral_amount?: number
}

export interface ReferralData {
  id: string
  referrerId: string
  referrerEmail: string
  referredUserId: string
  referredUserEmail: string
  commission: number // Keep for backward compatibility
  commission_amount: number // New field for commission data
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
