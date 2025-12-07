# Mobile App Testing Checklist

## Pre-Testing Setup

- [ ] Backend server is running and accessible
- [ ] API_BASE_URL in `services/api.ts` is correctly configured
- [ ] Database has test users with different hierarchy assignments
- [ ] Node modules are installed (`npm install`)
- [ ] Expo development environment is set up

## 1. Installation & Build

- [ ] `npm install` completes without errors
- [ ] `npm start` launches Expo dev server successfully
- [ ] App builds and runs on Android emulator/device
- [ ] App builds and runs on iOS simulator/device (if applicable)
- [ ] No console errors on initial load

## 2. Authentication Flow

### Login
- [ ] Login screen displays correctly
- [ ] Mobile number input accepts numbers
- [ ] Password input is masked
- [ ] Eye icon toggles password visibility
- [ ] Invalid credentials show appropriate error message
- [ ] Valid credentials successfully log in
- [ ] Loading indicator displays during login
- [ ] User redirected to home screen after successful login
- [ ] Token is stored in secure storage
- [ ] User data is stored in secure storage

### Session Management
- [ ] App restores session on restart if token is valid
- [ ] App redirects to login if token is expired/invalid
- [ ] Logout clears token and user data
- [ ] Logout redirects to login screen

## 3. Home Screen

- [ ] Home screen displays after successful login
- [ ] User name displays correctly
- [ ] User phone number displays (if available)
- [ ] User hierarchy scope displays correctly
- [ ] All menu items are visible and properly laid out
- [ ] Menu items have correct icons
- [ ] Clicking each menu item navigates to correct screen
- [ ] Logout button works correctly

## 4. Profile Screen

### Basic Information
- [ ] Profile screen loads without errors
- [ ] User name displays correctly
- [ ] Email displays correctly (or "غير متوفر")
- [ ] Mobile number displays correctly
- [ ] Membership date displays correctly
- [ ] Account status displays correctly
- [ ] Admin level displays in Arabic
- [ ] Hierarchy scope displays correctly

### Hierarchy Selector
- [ ] Hierarchy selector component renders
- [ ] Current active hierarchy is highlighted
- [ ] Available hierarchies are shown
- [ ] Unavailable hierarchies are not shown
- [ ] Hierarchy path displays for each hierarchy
- [ ] Loading indicator shows while fetching memberships
- [ ] Error handling works if API fails

### Hierarchy Switching
- [ ] User with single hierarchy sees appropriate message
- [ ] User with multiple hierarchies sees all options
- [ ] Clicking on hierarchy option shows loading
- [ ] Successful switch shows success message
- [ ] Active hierarchy updates in UI
- [ ] User data updates in AuthContext
- [ ] Switch persists after app restart
- [ ] Failed switch shows error message

## 5. Bulletins

- [ ] Bulletins screen loads without errors
- [ ] Loading indicator displays while fetching
- [ ] Bulletins list displays correctly
- [ ] Each bulletin shows title, date, and image
- [ ] Clicking bulletin navigates to details
- [ ] Pull-to-refresh works correctly
- [ ] Empty state displays if no bulletins
- [ ] Error state displays on API failure
- [ ] Retry button works on error
- [ ] Bulletins are filtered by active hierarchy
- [ ] Switching hierarchy updates bulletin list

## 6. Surveys

### Survey Menu
- [ ] Survey menu screen displays correctly
- [ ] Public surveys option is visible
- [ ] Member surveys option is visible
- [ ] Info card displays correctly
- [ ] Navigation to public surveys works
- [ ] Navigation to member surveys works

### Survey Lists
- [ ] Public surveys load correctly
- [ ] Member surveys load correctly
- [ ] Surveys are filtered by active hierarchy
- [ ] Survey cards display title and description
- [ ] Clicking survey navigates to details
- [ ] Completed surveys are marked
- [ ] Empty state displays if no surveys

### Survey Response
- [ ] Survey questions display correctly
- [ ] Different question types render properly
- [ ] User can select answers
- [ ] Submit button works
- [ ] Success message displays after submission
- [ ] Cannot submit same survey twice

## 7. Voting

### Voting Menu
- [ ] Voting menu screen displays correctly
- [ ] Electoral voting option is visible
- [ ] Opinion voting option is visible
- [ ] Navigation to electoral voting works
- [ ] Navigation to opinion voting works

### Voting Lists
- [ ] Electoral voting items load correctly
- [ ] Opinion voting items load correctly
- [ ] Voting items are filtered by active hierarchy
- [ ] Voting cards display correctly
- [ ] Clicking voting item shows options
- [ ] Can select option and submit vote
- [ ] Already voted items are marked
- [ ] Results display after voting

## 8. Reports

- [ ] Submit report screen loads correctly
- [ ] Report form displays all fields
- [ ] Can enter report title
- [ ] Can enter report description
- [ ] Can attach files/images
- [ ] Submit button works
- [ ] Loading indicator during submission
- [ ] Success message after submission
- [ ] Error handling for failed submission
- [ ] Can view list of submitted reports

## 9. Subscriptions

- [ ] Subscriptions screen loads correctly
- [ ] Subscription plans display correctly
- [ ] Plan details show (price, period, features)
- [ ] Can select and purchase plan
- [ ] Payment receipt upload works
- [ ] Active subscriptions display correctly
- [ ] Previous subscriptions are accessible

## 10. Hierarchy-Aware Content

### Original Hierarchy
- [ ] Content filtered by national level (if applicable)
- [ ] Content filtered by region
- [ ] Content filtered by locality
- [ ] Content filtered by admin unit
- [ ] Content filtered by district
- [ ] User at higher level sees content from lower levels

### Expatriate Hierarchy
- [ ] Content filtered by expatriate region
- [ ] Expatriate-specific content displays correctly
- [ ] Switching to expatriate hierarchy updates all content

### Sector Hierarchy
- [ ] Content filtered by sector national level
- [ ] Content filtered by sector region
- [ ] Content filtered by sector locality
- [ ] Content filtered by sector admin unit
- [ ] Content filtered by sector district
- [ ] Sector-specific content displays correctly
- [ ] Switching to sector hierarchy updates all content

## 11. Navigation

- [ ] All navigation paths work correctly
- [ ] Back button works on all screens
- [ ] Deep linking works (if configured)
- [ ] No navigation stack issues
- [ ] Proper screen transitions

## 12. Error Handling

- [ ] Network errors show appropriate messages
- [ ] API errors show user-friendly messages
- [ ] Loading states display correctly
- [ ] Retry mechanisms work
- [ ] Graceful degradation for missing data
- [ ] No app crashes on errors

## 13. Performance

- [ ] App loads quickly
- [ ] Smooth scrolling on lists
- [ ] No lag on navigation
- [ ] Images load efficiently
- [ ] API calls are optimized
- [ ] No memory leaks

## 14. UI/UX

- [ ] All text is in Arabic
- [ ] RTL layout works correctly
- [ ] Fonts display correctly (Tajawal)
- [ ] Colors match design (primary #2E7D32)
- [ ] Spacing and layout are consistent
- [ ] Touch targets are adequately sized
- [ ] Loading indicators are visible
- [ ] Error messages are clear
- [ ] Success messages are visible
- [ ] Icons display correctly

## 15. Security

- [ ] Tokens are stored securely
- [ ] API calls include authorization headers
- [ ] Sensitive data is not logged
- [ ] Session expires after 24 hours
- [ ] Cannot access protected routes without auth
- [ ] ADMIN users cannot login to mobile app

## 16. Edge Cases

- [ ] Works with slow internet connection
- [ ] Handles offline mode gracefully
- [ ] Works with different screen sizes
- [ ] Works with different Android versions
- [ ] Handles empty responses from API
- [ ] Handles null/undefined data gracefully
- [ ] Works when user has no hierarchy assignments
- [ ] Works when user has single hierarchy
- [ ] Works when user has multiple hierarchies

## 17. Integration Tests

- [ ] Login → View Profile → Switch Hierarchy → View Content
- [ ] Login → View Bulletins → Read Bulletin Details
- [ ] Login → Take Survey → Submit Responses
- [ ] Login → Vote → Submit Vote
- [ ] Login → Submit Report → View Report History
- [ ] Switch Hierarchy → Verify Content Updates
- [ ] Logout → Cannot Access Protected Content

## Test Users Needed

Create the following test users in the backend:

1. **Single Hierarchy User**
   - Assigned to: Original Hierarchy (Region level)
   - Purpose: Test single hierarchy experience

2. **Multi-Hierarchy User**
   - Assigned to: Original (District), Sector (Admin Unit)
   - Purpose: Test hierarchy switching

3. **Expatriate User**
   - Assigned to: Expatriate Hierarchy
   - Purpose: Test expatriate content filtering

4. **General Secretariat User**
   - Assigned to: General Secretariat level
   - Purpose: Test highest level access (sees all content)

5. **Regular User**
   - Assigned to: No admin level (USER)
   - Purpose: Test basic user experience

## Known Issues / Notes

- Add any discovered issues here during testing
- Document workarounds if applicable
- Note any features that require backend updates

## Sign-off

- [ ] All critical tests passed
- [ ] All blocking issues resolved
- [ ] App ready for deployment

**Tested by:** _________________  
**Date:** _________________  
**Version:** _________________  
**Platform:** Android / iOS  
**Device:** _________________  

