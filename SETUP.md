# PP Mobile App - Setup Guide

## Overview
This is the recovered and rebuilt mobile application for the PP system. Users can access hierarchy-based content and switch between different hierarchies (Original, Expatriate, Sector) if they are registered in multiple hierarchies.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development) or Xcode (for iOS development)
- Backend API server running at the configured endpoint

## Installation

1. Navigate to the mobile app directory:
```bash
cd ppMobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure the backend API URL:
   - Open `services/api.ts`
   - Update `API_BASE_URL` to point to your backend server:
     - For Android emulator: `http://10.0.2.2:3000/api`
     - For physical Android device: `http://YOUR_LOCAL_IP:3000/api`
     - For iOS simulator: `http://localhost:3000/api`
     - For production: `https://your-production-url.com/api`

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

Then:
- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Scan QR code with Expo Go app on your physical device

### Direct Android Build
```bash
npm run android
```

### Direct iOS Build
```bash
npm run ios
```

## Features

### Authentication
- Login with mobile number and password
- Secure token storage using expo-secure-store
- Automatic session management

### Hierarchy Management
- Users can be part of multiple hierarchies:
  - **Original Hierarchy**: National Level → Region → Locality → Admin Unit → District
  - **Expatriate Hierarchy**: Expatriate Region
  - **Sector Hierarchy**: Sector National Level → Sector Region → Sector Locality → Sector Admin Unit → Sector District

### Hierarchy Switching
- Users registered in multiple hierarchies can switch between them
- Switch functionality available in the Profile page
- Content automatically filters based on the active hierarchy

### Content Features
- **Bulletins**: View hierarchy-filtered news and announcements
- **Surveys**: Participate in public and member surveys
- **Voting**: Electoral and opinion voting
- **Reports**: Submit reports with attachments
- **Subscriptions**: Manage subscription plans
- **Profile**: View and manage user information

## Project Structure

```
ppMobile/
├── app/                      # App screens (Expo Router)
│   ├── _layout.tsx          # Root layout with AuthProvider
│   ├── index.tsx            # Entry point / redirect logic
│   ├── login.tsx            # Login screen
│   ├── home.tsx             # Home screen with menu
│   ├── profile.tsx          # User profile with hierarchy selector
│   ├── bulletin.tsx         # Bulletins list
│   ├── surveys.tsx          # Surveys menu
│   ├── voting.tsx           # Voting menu
│   └── ...                  # Other screens
├── components/              # Reusable components
│   ├── HierarchySelector.tsx # Hierarchy switching component
│   ├── AppTextInput.tsx     # Custom text input
│   └── CustomButton.tsx     # Custom button
├── context/                 # React Context
│   └── AuthContext.tsx      # Authentication context
├── services/                # API services
│   └── api.ts              # Axios API client
├── utils/                   # Utility functions
│   └── hierarchyUtils.ts   # Hierarchy helper functions
├── constants/              # App constants
│   ├── Colors.ts
│   ├── Font.ts
│   ├── FontSize.ts
│   ├── Spacing.ts
│   └── Layout.ts
├── assets/                 # Images, fonts, etc.
└── types/                  # TypeScript type definitions
```

## Key Files

### `services/api.ts`
- Centralized API client using axios
- Automatic token injection via interceptors
- Error handling and token refresh logic
- All backend endpoints

### `context/AuthContext.tsx`
- User authentication state management
- Token storage and retrieval
- User hierarchy information
- Login/logout functionality
- Update user method for hierarchy switching

### `components/HierarchySelector.tsx`
- Displays available hierarchies for the user
- Allows switching between hierarchies
- Shows current hierarchy path
- Updates AuthContext when hierarchy changes

### `utils/hierarchyUtils.ts`
- Helper functions for hierarchy display
- Hierarchy level name translation (Arabic)
- User scope description
- Hierarchy path formatting

## Environment Variables

Currently, configuration is done directly in `services/api.ts`. For production, consider using environment variables:

```
API_BASE_URL=https://your-backend-url.com/api
```

## API Integration

The app connects to the following backend endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/active-hierarchy` - Switch active hierarchy
- `GET /api/users/hierarchy-memberships` - Get user's hierarchy memberships

### Content
- `GET /api/content/bulletins` - Get bulletins (hierarchy-filtered)
- `GET /api/content/surveys` - Get surveys (hierarchy-filtered)
- `GET /api/content/voting` - Get voting items (hierarchy-filtered)
- `POST /api/content/reports` - Submit report

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `GET /api/content/subscriptions/active` - Get user subscriptions
- `POST /api/subscriptions/subscribe` - Create subscription

## Testing

1. Ensure backend server is running
2. Update API_BASE_URL in `services/api.ts`
3. Run the app: `npm start`
4. Test with different user accounts that have different hierarchy memberships
5. Verify hierarchy switching works correctly
6. Verify content filtering based on active hierarchy

## Troubleshooting

### Connection Issues
- Verify backend server is running
- Check API_BASE_URL configuration
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical devices, ensure they're on the same network as the backend

### Token Issues
- Clear app data and re-login
- Check token expiration (24 hours by default)
- Verify JWT_SECRET matches backend configuration

### Hierarchy Issues
- Verify user has correct hierarchy assignments in database
- Check backend hierarchy endpoints are working
- Ensure activeHierarchy field is properly set in user profile

## Building for Production

### Android APK
```bash
eas build --platform android --profile production
```

### iOS
```bash
eas build --platform ios --profile production
```

Note: Requires EAS CLI and configuration. See Expo documentation for details.

## Notes

- All screens are in Arabic (RTL)
- Uses Tajawal font family
- Primary color: #2E7D32 (green)
- Supports Android API level 21+
- Requires active internet connection

## Support

For issues or questions, contact the development team.

