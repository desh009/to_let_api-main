# Logout API Implementation Guide

## 📝 API Endpoints

### 1. Logout
```
POST /api/auth/logout
Authorization: Bearer {token}
```

#### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Request Body
```json
// No body required
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Successfully logged out."
}
```

---

### 2. Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "data": {
    "uid": "user-uuid-123",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

---

### 3. Refresh Token
```
POST /api/auth/refresh
```

#### Request Body
```json
{
  "refreshToken": "refresh-token-here"
}
```

#### Response (200 OK)
```json
{
  "data": {
    "user": {
      "uid": "user-uuid-123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "idToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 3600
  }
}
```

---

## 💻 Flutter Implementation

### 1. Logout Function

```dart
// lib/services/auth_service.dart

class AuthService {
  static const String baseUrl = 'http://localhost:3000/api/auth';
  
  // Logout
  Future<bool> logout() async {
    try {
      final token = await _getStoredToken();
      
      if (token == null) {
        // No token stored, just clear local data
        await _clearLocalData();
        return true;
      }

      // Call logout API
      final response = await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      // Always clear local data, regardless of API response
      await _clearLocalData();

      if (response.statusCode == 200) {
        print('Successfully logged out from server');
        return true;
      } else {
        print('Logout API failed, but local data cleared');
        return true; // Still return true since we cleared local data
      }
    } catch (e) {
      print('Logout error: $e');
      // Clear local data even on error
      await _clearLocalData();
      return true;
    }
  }

  // Clear local data
  Future<void> _clearLocalData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
    
    // Clear any other cached data
    // await prefs.clear(); // Use this to clear everything
  }

  // Get stored token
  Future<String?> _getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
}
```

---

### 2. Logout Button in Profile Screen

```dart
// lib/screens/profile/profile_screen.dart

class ProfileScreen extends StatelessWidget {
  final AuthService _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile'),
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          // Profile info...
          
          // Logout Button
          SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => _showLogoutDialog(context),
            icon: Icon(Icons.logout),
            label: Text('Logout'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Show logout confirmation dialog
  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Logout'),
        content: Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              await _handleLogout(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: Text('Logout'),
          ),
        ],
      ),
    );
  }

  // Handle logout
  Future<void> _handleLogout(BuildContext context) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      // Call logout API
      final success = await _authService.logout();

      // Hide loading
      Navigator.pop(context);

      if (success) {
        // Navigate to login screen and clear navigation stack
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) => LoginScreen(),
          ),
          (route) => false, // Remove all previous routes
        );

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully logged out'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      // Hide loading
      Navigator.pop(context);

      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Logout failed. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
```

---

### 3. Complete Auth Service with Token Management

```dart
// lib/services/auth_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'http://localhost:3000/api/auth';
  
  // Login
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Store tokens
        await _storeAuthData(data['data']);
        
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'Login failed');
      }
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }

  // Logout
  Future<bool> logout() async {
    try {
      final token = await getStoredToken();
      
      if (token != null) {
        await http.post(
          Uri.parse('$baseUrl/logout'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );
      }

      // Always clear local data
      await _clearLocalData();
      return true;
    } catch (e) {
      print('Logout error: $e');
      await _clearLocalData();
      return true;
    }
  }

  // Get current user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final token = await getStoredToken();
      
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/me'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        return null;
      }
    } catch (e) {
      print('Get user error: $e');
      return null;
    }
  }

  // Refresh token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _getRefreshToken();
      
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storeAuthData(data['data']);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print('Refresh token error: $e');
      return false;
    }
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getStoredToken();
    return token != null;
  }

  // Get stored token
  Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Get refresh token
  Future<String?> _getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('refresh_token');
  }

  // Store auth data
  Future<void> _storeAuthData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', data['idToken']);
    await prefs.setString('refresh_token', data['refreshToken']);
    await prefs.setString('user_id', data['user']['uid']);
    await prefs.setString('user_email', data['user']['email']);
    if (data['user']['name'] != null) {
      await prefs.setString('user_name', data['user']['name']);
    }
  }

  // Clear local data
  Future<void> _clearLocalData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
  }
}
```

---

## 🔄 Logout Flow

```
User Profile Screen
    ↓
User clicks "Logout" button
    ↓
Show confirmation dialog
    ↓
User confirms
    ↓
Show loading indicator
    ↓
API Call: POST /api/auth/logout
    ↓
Clear local storage
    ├─> Remove auth_token
    ├─> Remove refresh_token
    ├─> Remove user data
    └─> Clear any cached data
    ↓
Navigate to Login Screen
(Clear navigation stack)
    ↓
Show success message
```

---

## 🔐 Token Management Best Practices

### 1. Automatic Token Refresh
```dart
class ApiService {
  static Future<http.Response> makeAuthenticatedRequest(
    String url,
    {String method = 'GET', Map<String, dynamic>? body}
  ) async {
    final authService = AuthService();
    String? token = await authService.getStoredToken();

    // Make request
    http.Response response = await _makeRequest(url, token, method, body);

    // If token expired (401), try refreshing
    if (response.statusCode == 401) {
      final refreshed = await authService.refreshToken();
      
      if (refreshed) {
        // Retry with new token
        token = await authService.getStoredToken();
        response = await _makeRequest(url, token, method, body);
      } else {
        // Refresh failed, logout user
        await authService.logout();
        // Navigate to login
        throw Exception('Session expired. Please login again.');
      }
    }

    return response;
  }

  static Future<http.Response> _makeRequest(
    String url,
    String? token,
    String method,
    Map<String, dynamic>? body,
  ) async {
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    switch (method) {
      case 'GET':
        return await http.get(Uri.parse(url), headers: headers);
      case 'POST':
        return await http.post(
          Uri.parse(url),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
      default:
        throw Exception('Unsupported method: $method');
    }
  }
}
```

---

### 2. Auto Logout on Token Expiry
```dart
class AuthGuard {
  static Future<void> checkAuthentication(BuildContext context) async {
    final authService = AuthService();
    final isLoggedIn = await authService.isLoggedIn();

    if (!isLoggedIn) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => LoginScreen()),
        (route) => false,
      );
      return;
    }

    // Verify token is still valid
    final user = await authService.getCurrentUser();
    
    if (user == null) {
      // Token invalid, logout
      await authService.logout();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => LoginScreen()),
        (route) => false,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Session expired. Please login again.')),
      );
    }
  }
}
```

---

## 📊 API Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ | Register new user |
| `/api/auth/login` | POST | ❌ | Login user |
| `/api/auth/logout` | POST | ✅ | Logout user |
| `/api/auth/me` | GET | ✅ | Get current user info |
| `/api/auth/refresh` | POST | ❌ | Refresh access token |
| `/api/auth/forgot-password` | POST | ❌ | Request password reset |
| `/api/auth/reset-password` | POST | ✅ | Reset password |

---

## ✅ Implementation Checklist

- [ ] Logout API endpoint
- [ ] Get current user endpoint
- [ ] Refresh token endpoint
- [ ] AuthService class
- [ ] Token storage (SharedPreferences)
- [ ] Logout button in profile
- [ ] Logout confirmation dialog
- [ ] Clear local storage on logout
- [ ] Navigate to login after logout
- [ ] Auto token refresh
- [ ] Handle token expiry
- [ ] Show success/error messages

---

এই implementation দিয়ে complete authentication system হয়ে যাবে! 🔐✨
