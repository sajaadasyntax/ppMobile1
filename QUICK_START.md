# Quick Start Guide

## Get the App Running in 5 Minutes

### Step 1: Install Dependencies
```bash
cd ppMobile
npm install
```

### Step 2: Configure Backend URL
Open `services/api.ts` and update line 5:

```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Change this!
```

**Common configurations:**
- Android Emulator: `http://10.0.2.2:3000/api`
- iOS Simulator: `http://localhost:3000/api`
- Physical Device (same network): `http://192.168.1.XXX:3000/api`
- Production: `https://your-domain.com/api`

### Step 3: Start the Backend Server
In a separate terminal:
```bash
cd ppBackend
npm run dev
```

Verify it's running at `http://localhost:3000`

### Step 4: Start the Mobile App
```bash
npm start
```

Press `a` for Android or `i` for iOS

### Step 5: Test Login
Use these test credentials (or create your own):
- Mobile: `+249900000001`
- Password: `123456`

## What's Working

✅ **Authentication**
- Login/logout with mobile number
- Secure token storage
- Session management

✅ **Hierarchy System**
- Users can belong to multiple hierarchies (Original, Expatriate, Sector)
- Switch between hierarchies in Profile page
- Content automatically filters by active hierarchy

✅ **Core Features**
- Bulletins (news/announcements)
- Surveys (public & member)
- Voting (electoral & opinion)
- Reports submission
- Subscriptions
- Profile management

✅ **Multi-Hierarchy Support** ⭐
- Original: National → Region → Locality → Admin Unit → District
- Expatriate: Expatriate Region
- Sector: Sector National → Sector Region → Sector Locality → Sector Admin Unit → Sector District

## Key Files

| File | Purpose |
|------|---------|
| `services/api.ts` | All API calls - **UPDATE URL HERE** |
| `context/AuthContext.tsx` | User authentication state |
| `components/HierarchySelector.tsx` | Switch between hierarchies |
| `app/login.tsx` | Login screen |
| `app/home.tsx` | Main menu |
| `app/profile.tsx` | User profile with hierarchy selector |

## Testing Different Hierarchies

### Test User 1: Single Hierarchy
Create a user assigned to only Region level in Original hierarchy.
- Should see content from that region and below
- Should NOT see hierarchy selector (only 1 hierarchy)

### Test User 2: Multi-Hierarchy
Create a user assigned to both Original (District) and Sector (Admin Unit).
- Should see hierarchy selector in Profile
- Can switch between Original and Sector
- Content updates when switching

### Test User 3: Expatriate
Create a user assigned to Expatriate hierarchy.
- Should see expatriate-specific content
- Can switch if also in other hierarchies

## Troubleshooting

### Can't connect to backend
- ✅ Backend server is running
- ✅ Used correct IP/URL in `api.ts`
- ✅ Phone/emulator can reach backend (same network for physical devices)
- ✅ No firewall blocking connection

### Login fails
- ✅ User exists in database
- ✅ Mobile number format is correct (+249XXXXXXXXX)
- ✅ Password is correct
- ✅ User status is 'active' in database
- ✅ User role is not 'ADMIN' (admins can't use mobile app)

### Content not showing
- ✅ Content exists in database
- ✅ Content is published
- ✅ Content is assigned to user's hierarchy level
- ✅ User's active hierarchy is set correctly

### Hierarchy selector not showing
- ✅ User is assigned to multiple hierarchies (check database)
- ✅ Backend endpoint `/users/hierarchy-memberships` returns data
- ✅ Profile page loaded successfully

## Need More Help?

📖 **Full Documentation:**
- `SETUP.md` - Complete setup guide
- `TESTING_CHECKLIST.md` - Testing guide
- `MIGRATION_NOTES.md` - Technical details
- `RECOVERY_SUMMARY.md` - What was done

🔧 **Check Backend:**
- Verify Prisma schema matches requirements
- Check API endpoints are working
- Verify user has correct hierarchy assignments

## Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Type check
npm run typecheck

# Clear cache and restart
npx expo start -c
```

## Success Checklist

- [ ] Dependencies installed
- [ ] Backend URL configured
- [ ] Backend server running
- [ ] App starts without errors
- [ ] Can login with test user
- [ ] Home screen displays
- [ ] Can navigate to Profile
- [ ] Can view Bulletins
- [ ] If multi-hierarchy user: Can switch hierarchies

✨ **You're all set!** The app is ready to use.

