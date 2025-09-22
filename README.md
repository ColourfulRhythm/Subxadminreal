# Subx Admin Dashboard

A comprehensive admin dashboard for the Subx land investment platform, built with React, TypeScript, and Tailwind CSS.

## Features

### 🏠 Dashboard Overview
- Real-time statistics and metrics
- System health monitoring
- Recent activity feed
- Revenue and growth analytics

### 👥 User Management
- User profile management and portfolio tracking
- Account controls (activate/deactivate, verify users)
- User analytics and engagement metrics
- Email list management and export

### 🏗️ Project Management
- Monitor all land development projects
- Track project status and progress
- Manage developer applications and approvals
- Developer performance tracking

### 🗺️ Plot Management (Enhanced)
- Real-time plot analytics with live availability calculation
- Owner count tracking and revenue metrics
- Dynamic status indicators (Available, Popular, Low Stock, Sold Out)
- Plot details modal with performance metrics
- Manual recalculation tools

### 💰 Investment Requests (Current Focus)
- View and process all pending investment requests
- Approve/reject investment applications
- Move approved requests to investments collection
- Real-time request monitoring with debug tools
- Referral commission processing

### 💸 Withdrawal Management
- Review and process withdrawal requests
- Manage referral payouts
- Financial controls and audit trails
- Bank account verification

### 🔗 Referral Analytics
- Track referral performance and earnings
- Manage referral codes and commissions
- Top referrers tracking and analytics
- Referral trend analysis

### 💲 Pricing Management
- Update plot prices in real-time
- Bulk price adjustments
- Price history tracking
- Dynamic pricing controls

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ColourfulRhythm/Subxadminreal.git
cd Subxadminreal
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase configuration:
   - Create a Firebase project
   - Enable Firestore, Authentication, and Storage
   - Update `src/lib/firebase.ts` with your Firebase config

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Setup

### Required Collections

The dashboard expects the following Firestore collections:

- `users` - User profiles and portfolios
- `projects` - Land development projects
- `plots` - Individual plots with pricing and ownership data
- `investmentRequests` - Pending investment applications
- `investments` - Completed investments
- `withdrawalRequests` - Withdrawal requests
- `referrals` - Referral data and commissions
- `priceUpdates` - Price change history

### Data Structure

See `src/types/index.ts` for the complete data structure definitions.

## Features in Detail

### Real-time Updates
All data is synced in real-time using Firebase's onSnapshot listeners, ensuring the dashboard always shows current information.

### Responsive Design
The dashboard is fully responsive and works seamlessly on desktop, tablet, and mobile devices.

### Role-based Access
The dashboard is designed for admin users with full access to all platform management features.

### Data Export
Most sections include data export functionality for reporting and analysis.

## Development

### Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks (Firebase integration)
├── lib/           # Utility libraries (Firebase config)
├── pages/         # Main page components
├── types/         # TypeScript type definitions
└── App.tsx        # Main application component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

The dashboard can be deployed to any static hosting service:

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

### Recommended Hosting
- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software developed for Subx platform.

## Support

For support and questions, please contact the development team.

---

**Note**: This dashboard requires proper Firebase configuration and admin access to the Subx platform. Ensure all Firebase collections are properly set up before use.
