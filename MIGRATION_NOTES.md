# Mobile App Recovery - Migration Notes

## What Was Recovered

The mobile app was accidentally deleted but some files were recovered in a jumbled state. This document outlines what was rebuilt and what changes were made.

## Files Rebuilt from Scratch

### 1. `services/api.ts`
**Status:** Completely rebuilt  
**Reason:** Original file was corrupted (binary data)  
**Changes:**
- Added all backend API endpoints
- Implemented axios interceptors for token management
- Added proper TypeScript types
- Updated endpoint paths to match backend routes
- Added comprehensive error handling

### 2. `app/home.tsx`
**Status:** Completely rebuilt  
**Reason:** Original file was partially corrupted  
**Changes:**
- Simplified routing (removed `/(protected)/` prefix)
- Updated to use new API service
- Added proper loading and error states
- Added hierarchy scope display
- Updated menu items with icons

## Files Updated/Fixed

### 1. `context/AuthContext.tsx`
**Status:** Updated  
**Changes:**
- Added `ActiveHierarchy` enum
- Extended `User` interface to include sector hierarchy fields
- Added `updateUser` method for hierarchy switching
- Added support for expatriate and sector hierarchies

### 2. `app/_layout.tsx`
**Status:** Already correct  
**No changes needed**

### 3. `app/index.tsx`
**Status:** Updated  
**Changes:**
- Added proper authentication check
- Routes to `/home` instead of `/(protected)/home`
- Routes to `/login` instead of `/(auth)/login`

### 4. `app/login.tsx`
**Status:** Updated  
**Changes:**
- Fixed routing (removed `/(auth)/` and `/(protected)/` prefixes)
- Removed signup button (users are registered via admin panel)
- Uses updated API service

### 5. `app/profile.tsx`
**Status:** Updated  
**Changes:**
- Fixed routing (removed `/(auth)/` prefix)
- Already had HierarchySelector component integration
- Uses updated API service

### 6. `app/bulletin.tsx`
**Status:** Already correct  
**No changes needed** - Already uses API service properly

### 7. `app/surveys.tsx`
**Status:** Updated  
**Changes:**
- Fixed routing (removed `/(protected)/` prefix)

### 8. `app/voting.tsx`
**Status:** Updated  
**Changes:**
- Fixed routing (removed `/(protected)/` prefix)

### 9. `package.json`
**Status:** Updated  
**Changes:**
- Added `axios` dependency
- Added `expo-secure-store` dependency

## New Components Created

### 1. `components/HierarchySelector.tsx`
**Status:** New component  
**Purpose:** Allow users to switch between different hierarchies  
**Features:**
- Displays all available hierarchies for a user
- Shows current active hierarchy
- Displays hierarchy path for each hierarchy
- Allows switching between hierarchies
- Updates AuthContext when hierarchy changes
- Shows loading states
- Handles errors gracefully

## Breaking Changes

### Routing Structure
**Old:** Used route groups like `/(auth)/login` and `/(protected)/home`  
**New:** Flat routing structure like `/login` and `/home`  
**Impact:** All navigation code was updated to use new routes

### API Service
**Old:** Had partial/corrupted implementation  
**New:** Complete implementation with all endpoints  
**Impact:** All screens now use centralized API service

### Hierarchy Switching
**Old:** Not implemented  
**New:** Full implementation via HierarchySelector  
**Impact:** Users can now switch between hierarchies in the profile page

## Backend API Changes Required

### Endpoint Updates
1. Hierarchy switching endpoint changed from `POST /users/switch-hierarchy` to `PUT /users/active-hierarchy`
2. All other endpoints should already exist in the backend

### Required Backend Endpoints
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/profile`
- `PUT /api/users/active-hierarchy`
- `GET /api/users/hierarchy-memberships`
- `GET /api/content/bulletins`
- `GET /api/content/surveys`
- `GET /api/content/voting`
- `POST /api/content/reports`
- `GET /api/subscriptions/plans`
- `GET /api/content/subscriptions/active`

## Database Schema Requirements

Users must have the following fields:
- `activeHierarchy` (enum: ORIGINAL, EXPATRIATE, SECTOR)
- Original hierarchy fields: `nationalLevelId`, `regionId`, `localityId`, `adminUnitId`, `districtId`
- Expatriate hierarchy: `expatriateRegionId`
- Sector hierarchy: `sectorNationalLevelId`, `sectorRegionId`, `sectorLocalityId`, `sectorAdminUnitId`, `sectorDistrictId`

## Configuration Changes

### API Base URL
Located in: `services/api.ts`

```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api'; // For Android emulator
```

Update this based on your environment:
- Android emulator: `http://10.0.2.2:3000/api`
- iOS simulator: `http://localhost:3000/api`
- Physical device: `http://YOUR_LOCAL_IP:3000/api`
- Production: `https://your-production-url.com/api`

## Testing Requirements

### Test Users
Create test users with different hierarchy configurations:
1. User with only original hierarchy
2. User with original + sector hierarchies
3. User with expatriate hierarchy
4. User at general secretariat level
5. Regular user with no admin level

### Test Scenarios
1. Login with each test user
2. Verify correct hierarchy display
3. Test hierarchy switching (for multi-hierarchy users)
4. Verify content filtering per hierarchy
5. Test all navigation paths
6. Verify logout and session management

## Known Issues

None at the moment. Document any issues found during testing.

## Next Steps

1. Install dependencies: `npm install`
2. Update API_BASE_URL in `services/api.ts`
3. Ensure backend server is running
4. Test login with various users
5. Test hierarchy switching
6. Verify all screens and navigation
7. Run through testing checklist

## Documentation

- `SETUP.md` - Installation and configuration guide
- `TESTING_CHECKLIST.md` - Comprehensive testing checklist
- `README.md` - Project overview (if exists)

## Support

For issues or questions during migration, refer to:
1. Backend API documentation
2. Database schema (Prisma schema)
3. Admin panel implementation (for reference)

