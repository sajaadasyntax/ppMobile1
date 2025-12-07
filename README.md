# PP Mobile App

## Overview

This is the mobile application for the PP (Political Party) system, built with Expo and React Native. The app allows party members to access hierarchy-based content, participate in surveys, vote on issues, and manage their subscriptions.

## ✨ Key Features

- **Multi-Hierarchy Support**: Users can belong to multiple hierarchies (Original, Expatriate, Sector) and switch between them
- **Hierarchy-Filtered Content**: All content is automatically filtered based on user's position and active hierarchy
- **Secure Authentication**: JWT-based authentication with secure token storage
- **Bulletins & News**: View party announcements and news
- **Surveys**: Participate in public and member-specific surveys
- **Voting**: Electoral and opinion voting
- **Reports**: Submit reports with attachments
- **Subscriptions**: Manage membership subscriptions
- **Profile Management**: View and update profile information

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure backend URL in services/api.ts
# Update API_BASE_URL to your backend server

# Start the app
npm start
```

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Get running in 5 minutes |
| [SETUP.md](./SETUP.md) | Complete installation & configuration guide |
| [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) | Comprehensive testing checklist |
| [MIGRATION_NOTES.md](./MIGRATION_NOTES.md) | Technical migration details |
| [RECOVERY_SUMMARY.md](./RECOVERY_SUMMARY.md) | Recovery process documentation |

## 🏗️ Project Structure

```
ppMobile/
├── app/                      # App screens (Expo Router)
│   ├── _layout.tsx          # Root layout with AuthProvider
│   ├── index.tsx            # Entry point
│   ├── login.tsx            # Login screen
│   ├── home.tsx             # Home screen with menu
│   ├── profile.tsx          # User profile
│   ├── bulletin.tsx         # Bulletins list
│   └── ...                  # Other screens
├── components/              # Reusable components
│   ├── HierarchySelector.tsx # Hierarchy switching
│   ├── AppTextInput.tsx     # Custom input
│   └── CustomButton.tsx     # Custom button
├── context/                 # React Context
│   └── AuthContext.tsx      # Auth state management
├── services/                # API services
│   └── api.ts              # API client
├── utils/                   # Utilities
│   └── hierarchyUtils.ts   # Hierarchy helpers
├── constants/              # App constants
├── assets/                 # Images, fonts
└── types/                  # TypeScript types
```

## 🔑 Key Technologies

- **Expo SDK 54** - Development framework
- **React Native 0.81** - Mobile framework
- **Expo Router 6** - File-based routing
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Expo Secure Store** - Secure token storage
- **NativeWind** - Tailwind for React Native

## 🌐 Backend Integration

The app connects to the PP backend API for all data. Required endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/users/profile` - User profile
- `PUT /api/users/active-hierarchy` - Switch hierarchy
- `GET /api/users/hierarchy-memberships` - Get memberships
- `GET /api/content/bulletins` - Bulletins
- `GET /api/content/surveys` - Surveys
- `GET /api/content/voting` - Voting items
- `POST /api/content/reports` - Submit reports

See [SETUP.md](./SETUP.md) for complete API documentation.

## 🎨 Design System

- **Primary Color**: #2E7D32 (Green)
- **Font**: Tajawal (Arabic)
- **Direction**: RTL (Right-to-Left)
- **Language**: Arabic

## 🔐 Authentication

- JWT-based authentication
- Token stored in expo-secure-store
- 24-hour token expiration
- Automatic token injection in API calls
- Session management

## 🏛️ Hierarchy System

### Three Hierarchy Types

1. **Original Hierarchy**
   - National Level → Region → Locality → Admin Unit → District
   - Traditional administrative structure

2. **Expatriate Hierarchy**
   - Expatriate Region
   - For party members abroad

3. **Sector Hierarchy**
   - Sector National Level → Sector Region → Sector Locality → Sector Admin Unit → Sector District
   - For sector-specific organizations

### Hierarchy Switching

Users assigned to multiple hierarchies can switch between them in the Profile page:
- View all available hierarchies
- See current active hierarchy
- Switch with one tap
- Content automatically updates

## 🧪 Testing

```bash
# Type check
npm run typecheck

# Start with cache clear
npx expo start -c
```

See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for complete testing guide.

## 📱 Building

### Development
```bash
# Android
npm run android

# iOS
npm run ios
```

### Production
```bash
# Android APK/AAB
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

## 🐛 Troubleshooting

### Connection Issues
- Verify backend server is running
- Check API_BASE_URL configuration
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical devices, ensure same network as backend

### Login Issues
- Verify user exists and is active
- Check mobile number format (+249XXXXXXXXX)
- Ensure user role is not ADMIN (admins use web panel)

### Content Not Showing
- Verify content is published in backend
- Check user's hierarchy assignments
- Ensure content is assigned to user's hierarchy level

## 🤝 Contributing

1. Follow existing code style
2. Use TypeScript for type safety
3. Test on both Android and iOS
4. Update documentation for new features
5. Follow component structure conventions

## 📄 License

Proprietary - PP System

## 📞 Support

For issues or questions:
- Check documentation in this directory
- Review backend API documentation
- Contact development team

---

**Version**: 1.2.0  
**Last Updated**: November 2024  
**Status**: ✅ Fully Functional
