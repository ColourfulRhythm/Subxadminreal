# Firebase Setup Guide for Subx Admin Dashboard

## 🔥 Firebase Configuration

### Step 1: Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/project/subx-825e9/overview)
2. Click on the gear icon (Project Settings)
3. Scroll down to "Your apps" section
4. If you don't have a web app, click "Add app" and select Web (</>) icon
5. Copy the Firebase configuration object

### Step 2: Update Firebase Config
Replace the placeholder values in `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "subx-825e9.firebaseapp.com",
  projectId: "subx-825e9",
  storageBucket: "subx-825e9.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
}
```

## 📊 Required Firestore Collections

Based on your data mapping, ensure these collections exist in your Firestore:

### Core Collections:
1. **`user_profiles`** - User account information
2. **`projects`** - Land development projects
3. **`plots`** - Individual land plots
4. **`investmentRequests`** - Pending investment applications
5. **`investments`** - Completed investments
6. **`withdrawalRequests`** - Withdrawal requests
7. **`referrals`** - Referral data and commissions
8. **`notifications`** - System notifications (optional)
9. **`priceUpdates`** - Price change history (optional)

## 🔐 Firestore Security Rules

Set up these security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access only - adjust based on your auth setup
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Or if using custom claims:
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

## 📋 Collection Structure Examples

### user_profiles Collection
```javascript
{
  id: "user123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  lastLogin: "2024-01-20T15:30:00Z",
  totalInvestments: 45000,
  portfolio: [
    {
      id: "plot1",
      plotId: "plot123",
      plotName: "Plot A-12",
      sqm: 100,
      purchasePrice: 25000,
      purchaseDate: "2024-01-10T10:00:00Z",
      currentValue: 27000
    }
  ],
  referralCode: "JOHN123",
  referredBy: "ref456"
}
```

### projects Collection
```javascript
{
  id: "proj1",
  name: "Green Valley Estate",
  description: "Premium residential development",
  location: "Lagos, Nigeria",
  totalPlots: 150,
  totalSqm: 45000,
  pricePerSqm: 250,
  status: "active",
  startDate: "2023-06-01T00:00:00Z",
  expectedCompletion: "2025-12-31T00:00:00Z",
  developerId: "dev1",
  developerName: "Prime Developers Ltd",
  revenue: 875000,
  isApproved: true
}
```

### plots Collection
```javascript
{
  id: "plot1",
  projectId: "proj1",
  projectName: "Green Valley Estate",
  name: "Plot A-12",
  totalSqm: 1000,
  availableSqm: 300,
  pricePerSqm: 250,
  totalOwners: 7,
  totalRevenue: 175000,
  averageRevenue: 25000,
  status: "popular",
  ownershipPercentage: 70,
  purchases: [
    {
      id: "purchase1",
      userId: "user1",
      userName: "John Doe",
      sqm: 100,
      price: 25000,
      purchaseDate: "2024-01-15T10:00:00Z",
      status: "completed"
    }
  ],
  createdAt: "2023-06-01T00:00:00Z",
  updatedAt: "2024-01-20T10:00:00Z"
}
```

### investmentRequests Collection
```javascript
{
  id: "req1",
  userId: "user1",
  userEmail: "john.doe@email.com",
  userName: "John Doe",
  plotId: "plot1",
  plotName: "Plot A-12",
  sqm: 100,
  pricePerSqm: 250,
  totalAmount: 25000,
  status: "pending",
  createdAt: "2024-01-20T10:30:00Z",
  referralCode: "REF123",
  referralCommission: 2500,
  paymentMethod: "Bank Transfer",
  paymentStatus: "pending"
}
```

### referrals Collection
```javascript
{
  id: "ref1",
  referrerId: "user1",
  referrerEmail: "john.doe@email.com",
  referredUserId: "user5",
  referredUserEmail: "alice.brown@email.com",
  commission: 2500,
  status: "paid",
  createdAt: "2024-01-15T10:00:00Z",
  paidAt: "2024-01-16T10:00:00Z"
}
```

## 🚀 Testing the Connection

1. Start the development server:
```bash
npm run dev
```

2. Open the dashboard and navigate to "Investment Requests" tab
3. Click the "Test Firebase Connection" button
4. Check the browser console for any errors

## 🔧 Common Issues & Solutions

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution**: Ensure your Firebase config is correctly updated in `src/lib/firebase.ts`

### Issue: "Permission denied" errors
**Solution**: Check your Firestore security rules and ensure admin access is properly configured

### Issue: "Collection not found" errors
**Solution**: Verify all required collections exist in your Firestore database

### Issue: Real-time updates not working
**Solution**: Ensure you have proper read permissions in Firestore rules

## 📱 Authentication Setup (Optional)

If you want to add admin authentication:

1. Enable Authentication in Firebase Console
2. Set up authentication providers (Email/Password recommended)
3. Create admin users with custom claims
4. Update the dashboard to handle authentication

## 🔍 Data Validation

The dashboard expects these field types:
- **Dates**: Should be Firestore Timestamp objects or ISO strings
- **Numbers**: Should be numeric values, not strings
- **Arrays**: Should be proper JavaScript arrays
- **Objects**: Should be proper JavaScript objects

## 📈 Performance Optimization

For better performance with large datasets:
1. Add indexes for frequently queried fields
2. Implement pagination for large collections
3. Use Firestore's built-in caching
4. Consider using Firestore offline persistence

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Firebase project permissions
3. Ensure all collections have the expected structure
4. Test with a small dataset first

---

**Note**: This setup guide assumes you have admin access to the Firebase project. Make sure to replace placeholder values with your actual Firebase configuration.
