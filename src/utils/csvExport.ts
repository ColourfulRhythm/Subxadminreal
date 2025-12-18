/**
 * Utility functions for CSV export functionality
 */

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  // If value contains comma, newline, or quote, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function formatDateForCSV(date: any): string {
  if (!date) return ''
  
  // Handle Firebase timestamp objects
  if (date && typeof date === 'object' && 'toDate' in date) {
    return (date as any).toDate().toLocaleDateString('en-US')
  }
  
  // Handle Date objects
  if (date instanceof Date) {
    return date.toLocaleDateString('en-US')
  }
  
  // Handle string dates
  const dateObj = new Date(date)
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString('en-US')
  }
  
  return ''
}

/**
 * Export users to CSV
 */
export function exportUsersToCSV(users: any[], investments: any[] = []) {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Status',
    'Total Investment',
    'Portfolio (SQM)',
    'Joined Date',
    'Last Login',
    'Referral Code',
    'Wallet Balance'
  ]
  
  const getUserTotalInvestment = (userId: string, userEmail: string) => {
    return investments
      .filter(inv => 
        inv.userId === userId || 
        inv.user_id === userId || 
        inv.userEmail === userEmail || 
        (inv as any).user_email === userEmail
      )
      .reduce((total, inv) => total + ((inv as any).amount_paid || (inv as any).Amount_paid || 0), 0)
  }
  
  const getUserPortfolioSqm = (userId: string, userEmail: string) => {
    return investments
      .filter(inv => 
        inv.userId === userId || 
        inv.user_id === userId || 
        inv.userEmail === userEmail || 
        (inv as any).user_email === userEmail
      )
      .reduce((total, inv) => total + ((inv as any).sqm_purchased || inv.sqm || 0), 0)
  }
  
  const rows = users.map(user => {
    const fullName = user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'
    const totalInvestment = getUserTotalInvestment(user.id, user.email || '')
    const portfolioSqm = getUserPortfolioSqm(user.id, user.email || '')
    
    return [
      escapeCSVValue(fullName),
      escapeCSVValue(user.email || ''),
      escapeCSVValue(user.phone || ''),
      escapeCSVValue(user.status || 'N/A'),
      escapeCSVValue(totalInvestment),
      escapeCSVValue(portfolioSqm),
      escapeCSVValue(formatDateForCSV(user.created_at)),
      escapeCSVValue(formatDateForCSV(user.lastLogin)),
      escapeCSVValue(user.referral_code || ''),
      escapeCSVValue(user.wallet_balance || 0)
    ]
  })
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  downloadCSV(csvContent, `users_export_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export plots to CSV
 */
export function exportPlotsToCSV(plots: any[]) {
  const headers = [
    'Plot Name',
    'Project Name',
    'Status',
    'Total SQM',
    'Available SQM',
    'Price per SQM',
    'Total Owners',
    'Total Revenue',
    'Average Revenue',
    'Created At'
  ]
  
  const rows = plots.map(plot => {
    const totalSqm = (plot as any).total_sqm || plot.totalSqm || 0
    const availableSqm = (plot as any).available_sqm || plot.availableSqm || 0
    
    return [
      escapeCSVValue(plot.name || ''),
      escapeCSVValue(plot.projectName || ''),
      escapeCSVValue(plot.status || ''),
      escapeCSVValue(totalSqm),
      escapeCSVValue(availableSqm),
      escapeCSVValue(plot.pricePerSqm || 0),
      escapeCSVValue(plot.totalOwners || 0),
      escapeCSVValue(plot.totalRevenue || 0),
      escapeCSVValue(plot.averageRevenue || 0),
      escapeCSVValue(formatDateForCSV(plot.createdAt))
    ]
  })
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  downloadCSV(csvContent, `plots_export_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export dashboard stats to CSV
 */
export function exportDashboardStatsToCSV(stats: any, users: any[] = [], plots: any[] = []) {
  const headers = ['Metric', 'Value']
  
  const rows = [
    ['Total Users', stats.totalUsers || 0],
    ['Total Projects', stats.totalProjects || 0],
    ['Total Plots', stats.totalPlots || 0],
    ['Total SQM Sold', stats.totalSqmSold || 0],
    ['Platform Revenue', stats.platformRevenue || 0],
    ['Pending Verifications', stats.pendingVerifications || 0],
    ['Active Referrals', stats.activeReferrals || 0],
    ['Firebase Status', stats.systemHealth?.firebaseStatus || 'N/A'],
    ['Data Integrity', stats.systemHealth?.dataIntegrity || 'N/A'],
    ['Last Sync', formatDateForCSV(stats.systemHealth?.lastSync)],
    ['Active Users', users.filter((u: any) => u.status === 'active').length],
    ['Available Plots', plots.filter((p: any) => p.status === 'available').length],
    ['Total Plot Owners', plots.reduce((sum: number, p: any) => sum + (p.totalOwners || 0), 0)],
    ['Total Plot Revenue', plots.reduce((sum: number, p: any) => sum + (p.totalRevenue || 0), 0)]
  ]
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => `${escapeCSVValue(row[0])},${escapeCSVValue(row[1])}`)
  ].join('\n')
  
  downloadCSV(csvContent, `dashboard_stats_${new Date().toISOString().split('T')[0]}.csv`)
}

