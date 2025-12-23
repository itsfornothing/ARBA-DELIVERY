# Manual Testing Guide for Delivery API Endpoint Fix

This guide provides step-by-step instructions for manually testing the delivery platform API endpoints and customer dashboard functionality.

## Prerequisites

1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:3000`
3. Test user accounts created (customer, courier, admin)

## Quick Start

### 1. Run Automated Backend Tests

```bash
cd Mohamedo/backend
python test_manual_endpoints.py
```

This will automatically test all API endpoints and generate a report.

### 2. Start Development Servers

**Backend:**
```bash
cd Mohamedo/backend
python manage.py runserver
```

**Frontend:**
```bash
cd Mohamedo/frontend
npm run dev
```

## Manual Browser Testing

### Test 1: Customer Dashboard - No 404 Errors

**Objective:** Verify that the customer dashboard loads without any 404 errors in the browser console.

**Steps:**
1. Open browser and navigate to `http://localhost:3000/auth/login`
2. Login with customer credentials:
   - Username: `test_customer`
   - Password: `testpass123`
3. Open browser Developer Tools (F12)
4. Go to the Console tab
5. Navigate to the customer dashboard
6. Check for any 404 errors in the console

**Expected Results:**
- ✅ No 404 errors for `/api/notifications/unread_count/`
- ✅ No 404 errors for `/api/orders/real_time_updates/`
- ✅ No 404 errors for `/api/notifications/`
- ✅ No 404 errors for `/api/orders/`
- ✅ Dashboard loads successfully with all data

**Common Issues:**
- If you see 404 errors, check that the backend URL routing is correct
- Verify that ViewSets are registered with empty basename prefix
- Check that custom action decorators are properly configured

### Test 2: Unread Count Display

**Objective:** Verify that the unread notification count displays correctly.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Look at the notification bell icon in the header
4. Check if the unread count badge is displayed

**Expected Results:**
- ✅ Unread count badge shows correct number
- ✅ Badge updates when notifications are marked as read
- ✅ No loading spinner stuck on the badge

**API Endpoint Tested:**
- `GET /api/notifications/unread_count/`
- Response format: `{"unread_count": 0}`

### Test 3: Real-time Updates

**Objective:** Verify that real-time updates work correctly.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Wait for 30 seconds (default polling interval)
4. Check browser console for real-time update requests
5. Create a new order in another tab/window
6. Wait for the dashboard to update

**Expected Results:**
- ✅ Real-time updates endpoint is called every 30 seconds
- ✅ New orders appear on the dashboard without manual refresh
- ✅ Notifications update automatically
- ✅ No errors in console during polling

**API Endpoint Tested:**
- `GET /api/orders/real_time_updates/`
- Response format: `{"orders": [], "notifications": [], "timestamp": "...", "has_updates": true}`

### Test 4: Loading States

**Objective:** Verify that loading indicators work correctly.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Observe loading spinners during initial data fetch
4. Click the refresh button
5. Observe loading states during refresh

**Expected Results:**
- ✅ Loading spinner shows during initial load
- ✅ Skeleton screens show for orders and notifications
- ✅ Refresh button shows spinning icon during refresh
- ✅ Loading states clear after data is loaded
- ✅ No stuck loading states

### Test 5: Error Handling

**Objective:** Verify that error messages are user-friendly.

**Steps:**
1. Stop the backend server
2. Login as customer (if already logged in, refresh the page)
3. Observe error messages
4. Start the backend server
5. Click "Try again" button

**Expected Results:**
- ✅ User-friendly error message displayed (not technical error)
- ✅ "Try again" button is available
- ✅ Dashboard recovers after backend is restarted
- ✅ No unhandled exceptions in console

## Testing with Different User Roles

### Test 6: Courier Dashboard

**Objective:** Verify that courier users can access appropriate data.

**Steps:**
1. Logout from customer account
2. Login with courier credentials:
   - Username: `test_courier`
   - Password: `testpass123`
3. Navigate to courier dashboard
4. Check browser console for errors
5. Verify that courier sees:
   - Assigned orders
   - Available orders
   - Notifications

**Expected Results:**
- ✅ No 404 errors in console
- ✅ Courier sees only relevant orders
- ✅ Real-time updates work for courier
- ✅ Unread count displays correctly

### Test 7: Admin Dashboard

**Objective:** Verify that admin users can access all data.

**Steps:**
1. Logout from courier account
2. Login with admin credentials:
   - Username: `test_admin`
   - Password: `testpass123`
3. Navigate to admin dashboard
4. Check browser console for errors
5. Verify that admin sees:
   - All orders
   - All notifications
   - System statistics

**Expected Results:**
- ✅ No 404 errors in console
- ✅ Admin sees all orders from all users
- ✅ Real-time updates work for admin
- ✅ Unread count displays correctly

## Error Scenario Testing

### Test 8: Network Disconnection

**Objective:** Verify that the application handles network errors gracefully.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Open browser Developer Tools
4. Go to Network tab
5. Set throttling to "Offline"
6. Wait for next real-time update request
7. Observe error handling
8. Set throttling back to "Online"
9. Observe recovery

**Expected Results:**
- ✅ User-friendly error message displayed
- ✅ No unhandled exceptions
- ✅ Application recovers when network is restored
- ✅ Retry mechanism works correctly

### Test 9: Invalid Authentication

**Objective:** Verify that invalid authentication is handled correctly.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Open browser Developer Tools
4. Go to Application/Storage tab
5. Delete the `auth_token` from localStorage
6. Wait for next API request or refresh page
7. Observe behavior

**Expected Results:**
- ✅ User is redirected to login page
- ✅ No unhandled exceptions
- ✅ Clear error message about session expiration
- ✅ User can login again successfully

### Test 10: Invalid Data Handling

**Objective:** Verify that invalid API responses are handled gracefully.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Try to access a non-existent order: `http://localhost:3000/customer/orders/99999`
4. Observe error handling

**Expected Results:**
- ✅ User-friendly 404 error message
- ✅ No unhandled exceptions
- ✅ User can navigate back to dashboard
- ✅ Application remains stable

## API Response Format Verification

### Test 11: Unread Count Response Format

**Objective:** Verify that the unread count endpoint returns the correct format.

**Steps:**
1. Open browser Developer Tools
2. Go to Network tab
3. Login as customer
4. Navigate to customer dashboard
5. Find the request to `/api/notifications/unread_count/`
6. Check the response

**Expected Response:**
```json
{
  "unread_count": 0
}
```

**Verification:**
- ✅ Response is a JSON object
- ✅ Contains `unread_count` field
- ✅ Value is a number
- ✅ HTTP status is 200

### Test 12: Real-time Updates Response Format

**Objective:** Verify that the real-time updates endpoint returns the correct format.

**Steps:**
1. Open browser Developer Tools
2. Go to Network tab
3. Login as customer
4. Navigate to customer dashboard
5. Find the request to `/api/orders/real_time_updates/`
6. Check the response

**Expected Response:**
```json
{
  "orders": [],
  "notifications": [],
  "timestamp": "2024-01-01T00:00:00Z",
  "has_updates": false
}
```

**Verification:**
- ✅ Response is a JSON object
- ✅ Contains `orders` field (array)
- ✅ Contains `notifications` field (array)
- ✅ Contains `timestamp` field (ISO format string)
- ✅ Contains `has_updates` field (boolean)
- ✅ HTTP status is 200

### Test 13: Error Response Format

**Objective:** Verify that error responses have consistent format.

**Steps:**
1. Open browser Developer Tools
2. Go to Network tab
3. Try to access an endpoint without authentication
4. Check the error response

**Expected Response:**
```json
{
  "error": "Authentication credentials were not provided."
}
```

**Verification:**
- ✅ Response is a JSON object
- ✅ Contains `error` field with descriptive message
- ✅ HTTP status is 401
- ✅ Error message is user-friendly

## Performance Testing

### Test 14: Dashboard Load Time

**Objective:** Verify that the dashboard loads within acceptable time.

**Steps:**
1. Open browser Developer Tools
2. Go to Network tab
3. Clear cache
4. Login as customer
5. Navigate to customer dashboard
6. Measure load time

**Expected Results:**
- ✅ Initial page load < 2 seconds
- ✅ API requests complete < 1 second each
- ✅ No unnecessary duplicate requests
- ✅ Smooth user experience

### Test 15: Real-time Update Performance

**Objective:** Verify that real-time updates don't cause performance issues.

**Steps:**
1. Login as customer
2. Navigate to customer dashboard
3. Leave dashboard open for 5 minutes
4. Monitor browser console and performance
5. Check for memory leaks or performance degradation

**Expected Results:**
- ✅ No memory leaks
- ✅ Consistent polling interval (30 seconds)
- ✅ No performance degradation over time
- ✅ CPU usage remains reasonable

## Test Results Summary

After completing all tests, fill out this checklist:

### Customer Dashboard Tests
- [ ] No 404 errors in console
- [ ] Unread count displays correctly
- [ ] Real-time updates work
- [ ] Loading states work correctly
- [ ] Error handling is user-friendly

### User Role Tests
- [ ] Customer role works correctly
- [ ] Courier role works correctly
- [ ] Admin role works correctly

### Error Scenario Tests
- [ ] Network disconnection handled gracefully
- [ ] Invalid authentication handled correctly
- [ ] Invalid data handled gracefully

### API Response Format Tests
- [ ] Unread count response format correct
- [ ] Real-time updates response format correct
- [ ] Error response format consistent

### Performance Tests
- [ ] Dashboard loads quickly
- [ ] Real-time updates perform well

## Troubleshooting

### Issue: 404 Errors for API Endpoints

**Symptoms:**
- Console shows 404 errors for `/api/notifications/unread_count/`
- Console shows 404 errors for `/api/orders/real_time_updates/`

**Solution:**
1. Check that backend server is running
2. Verify URL routing configuration in `notifications/urls.py` and `orders/urls.py`
3. Ensure ViewSets are registered with empty basename prefix
4. Run `python manage.py validate_endpoints` to check endpoint registration

### Issue: Unread Count Not Displaying

**Symptoms:**
- Notification bell shows no badge
- Loading spinner stuck on badge

**Solution:**
1. Check browser console for errors
2. Verify API response format
3. Check that `apiClient.getUnreadCount()` is being called
4. Verify authentication token is valid

### Issue: Real-time Updates Not Working

**Symptoms:**
- Dashboard doesn't update automatically
- No polling requests in network tab

**Solution:**
1. Check that `realTimeTracker` is properly initialized
2. Verify polling interval is set correctly (30 seconds)
3. Check browser console for errors
4. Ensure component subscribes to real-time updates

### Issue: Error Messages Not User-Friendly

**Symptoms:**
- Technical error messages displayed to users
- Stack traces visible in UI

**Solution:**
1. Check `ErrorBoundary` component is wrapping dashboard
2. Verify `apiClient` error handling is working
3. Check that error messages are being formatted correctly
4. Ensure `createApiError` function is being used

## Automated Testing

In addition to manual testing, run the automated test suites:

### Backend Tests
```bash
cd Mohamedo/backend
python test_manual_endpoints.py
pytest tests/test_delivery_api_endpoint_fix_properties.py
pytest tests/test_delivery_api_endpoint_fix_integration.py
```

### Frontend Tests
```bash
cd Mohamedo/frontend
npm test -- src/__tests__/delivery-api-endpoint-fix-properties.test.tsx
npm test -- src/__tests__/delivery-api-endpoint-fix-integration.test.tsx
```

## Conclusion

This manual testing guide covers all aspects of the delivery API endpoint fix. By following these tests, you can verify that:

1. All API endpoints are accessible and return correct data
2. The customer dashboard works without 404 errors
3. Real-time updates function correctly
4. Error handling is user-friendly
5. Different user roles have appropriate access
6. Performance is acceptable

If all tests pass, the delivery API endpoint fix is working correctly and ready for production deployment.
