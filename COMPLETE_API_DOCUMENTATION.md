# 🏠 To-Let API - Complete Documentation

## 📋 Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Listings APIs](#listings-apis)
3. [Messaging APIs](#messaging-apis)
4. [Upload APIs](#upload-apis)
5. [Flutter Integration](#flutter-integration)
6. [Database Setup](#database-setup)

---

## 🔐 Authentication APIs

### Base URL: `/api/auth`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/register` | POST | ❌ | Register new user |
| `/login` | POST | ❌ | Login user |
| `/logout` | POST | ✅ | Logout user |
| `/me` | GET | ✅ | Get current user |
| `/refresh` | POST | ❌ | Refresh token |
| `/forgot-password` | POST | ❌ | Request password reset |
| `/reset-password` | POST | ✅ | Reset password |

#### 1. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "uid": "uuid-123",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "idToken": "access-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out."
}
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "uid": "uuid-123",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

#### 5. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

---

## 🏘️ Listings APIs

### Base URL: `/api/listings`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | ❌ | Get all listings (with filters) |
| `/` | POST | ✅ | Create new listing |
| `/:id` | GET | ❌ | Get single listing |
| `/:id` | PATCH | ✅ | Update listing (owner only) |
| `/:id` | DELETE | ✅ | Delete listing (owner only) |
| `/my/listings` | GET | ✅ | Get user's listings |
| `/filters/options` | GET | ❌ | Get filter options |

#### 1. Get Listings with Filters
```http
GET /api/listings?city=Dhaka&minPrice=5000&maxPrice=15000&bedrooms=2&category=apartment
```

**Query Parameters:**
- `city` - Filter by city (Dhaka, Chittagong, etc.)
- `area` - Filter by area
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `category` - apartment, house, room, sublet, hostel, office, shop
- `bedrooms` - Number of bedrooms (1-6)
- `furnishing` - furnished, semi-furnished, unfurnished
- `availability` - available, upcoming, unavailable
- `amenities.parking` - true/false
- `amenities.wifi` - true/false
- `amenities.gas` - true/false
- `amenities.lift` - true/false
- `amenities.generator` - true/false
- `offset` - Pagination offset (default: 0)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "title": "Beautiful 3 bed apartment in Dhanmondi",
      "description": "Spacious apartment...",
      "price": 25000,
      "category": "apartment",
      "location": {
        "city": "Dhaka",
        "area": "Dhanmondi",
        "address": "Road 5, House 23",
        "latitude": 23.7461,
        "longitude": 90.3742
      },
      "bedrooms": 3,
      "bathrooms": 2,
      "size": 1500,
      "furnishing": "furnished",
      "availability": "available",
      "amenities": {
        "parking": true,
        "wifi": true,
        "gas": true,
        "lift": true,
        "generator": false
      },
      "images": ["url1", "url2"],
      "owner": {
        "id": "owner-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+8801712345678"
      },
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "offset": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

#### 2. Get Filter Options
```http
GET /api/listings/filters/options
```

**Response:**
```json
{
  "data": {
    "cities": ["Dhaka", "Chittagong", "Sylhet", "Rajshahi"],
    "areas": {
      "Dhaka": ["Dhanmondi", "Gulshan", "Banani", "Mirpur"],
      "Chittagong": ["Agrabad", "Nasirabad", "Khulshi"]
    },
    "categories": ["apartment", "house", "room", "sublet", "hostel", "office", "shop"],
    "priceRanges": [
      { "label": "Under 5000", "min": 0, "max": 5000 },
      { "label": "5000-10000", "min": 5000, "max": 10000 },
      { "label": "10000-20000", "min": 10000, "max": 20000 },
      { "label": "20000-30000", "min": 20000, "max": 30000 },
      { "label": "Above 30000", "min": 30000, "max": null }
    ],
    "bedroomOptions": [1, 2, 3, 4, 5, 6],
    "furnishingOptions": ["furnished", "semi-furnished", "unfurnished"],
    "availabilityOptions": ["available", "upcoming", "unavailable"],
    "amenities": ["parking", "wifi", "gas", "lift", "generator"]
  }
}
```

#### 3. Create Listing
```http
POST /api/listings
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Beautiful 3 bed apartment",
  "description": "Spacious apartment in prime location",
  "price": 25000,
  "category": "apartment",
  "location": {
    "city": "Dhaka",
    "area": "Dhanmondi",
    "address": "Road 5, House 23",
    "latitude": 23.7461,
    "longitude": 90.3742
  },
  "bedrooms": 3,
  "bathrooms": 2,
  "size": 1500,
  "furnishing": "furnished",
  "availability": "available",
  "amenities": {
    "parking": true,
    "wifi": true,
    "gas": true,
    "lift": true,
    "generator": false
  },
  "images": ["url1", "url2"],
  "phone": "+8801712345678"
}
```

#### 4. Update Listing
```http
PATCH /api/listings/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 27000,
  "availability": "available"
}
```

#### 5. Delete Listing
```http
DELETE /api/listings/{id}
Authorization: Bearer {token}
```

#### 6. Get My Listings
```http
GET /api/listings/my/listings
Authorization: Bearer {token}
```

---

## 💬 Messaging APIs

### Base URL: `/api/messages`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/conversations` | POST | ✅ | Create/get conversation |
| `/conversations` | GET | ✅ | List conversations |
| `/conversations/:id/messages` | GET | ✅ | Get messages |
| `/send` | POST | ✅ | Send message |
| `/mark-as-read` | POST | ✅ | Mark messages as read |
| `/unread-count` | GET | ✅ | Get unread count |
| `/users/search` | GET | ✅ | Search users |

#### 1. Create/Get Conversation

**Property-based conversation:**
```http
POST /api/messages/conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "listingId": "listing-uuid",
  "sellerId": "seller-uuid"
}
```

**Direct conversation (any user to any user):**
```http
POST /api/messages/conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "otherUserId": "user-uuid"
}
```

**Response:**
```json
{
  "data": {
    "id": "conversation-uuid",
    "listingId": "listing-uuid",
    "sellerId": "seller-uuid",
    "buyerId": "buyer-uuid",
    "lastMessage": "Hello, is this available?",
    "lastMessageAt": "2024-01-10T08:00:00Z",
    "unreadCount": 0,
    "listing": {
      "id": "listing-uuid",
      "title": "3 bed apartment",
      "price": 25000,
      "image": "url"
    },
    "otherUser": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### 2. List Conversations
```http
GET /api/messages/conversations?type=all&offset=0&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `type` - all, unread, system (default: all)
- `offset` - Pagination offset (default: 0)
- `limit` - Items per page (default: 20)

#### 3. Get Messages
```http
GET /api/messages/conversations/{conversationId}/messages?offset=0&limit=50
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "message-uuid",
      "conversationId": "conversation-uuid",
      "senderId": "sender-uuid",
      "content": "Hello, is this available?",
      "isRead": false,
      "isDeleted": false,
      "createdAt": "2024-01-10T08:00:00Z",
      "sender": {
        "id": "sender-uuid",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "offset": 0,
    "limit": 50,
    "hasMore": false
  }
}
```

#### 4. Send Message
```http
POST /api/messages/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "conversationId": "conversation-uuid",
  "content": "Hello, is this still available?"
}
```

#### 5. Mark as Read
```http
POST /api/messages/mark-as-read
Authorization: Bearer {token}
Content-Type: application/json

{
  "conversationId": "conversation-uuid"
}
```

#### 6. Get Unread Count
```http
GET /api/messages/unread-count
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "unreadCount": 5
  }
}
```

#### 7. Search Users
```http
GET /api/messages/users/search?q=john
Authorization: Bearer {token}
```

**Query Parameters:**
- `q` - Search query (minimum 2 characters)
- `limit` - Results limit (default: 10)

**Response:**
```json
{
  "data": [
    {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

---

## 📤 Upload APIs

### Base URL: `/api/upload`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/images` | POST | ✅ | Upload images (base64) |
| `/images/presigned` | POST | ✅ | Get presigned URL |

#### 1. Upload Images (Base64)
```http
POST /api/upload/images
Authorization: Bearer {token}
Content-Type: application/json

{
  "images": [
    {
      "filename": "image1.jpg",
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "urls": [
      "https://supabase-storage.com/property-images/uuid-1.jpg",
      "https://supabase-storage.com/property-images/uuid-2.jpg"
    ]
  }
}
```

#### 2. Get Presigned URL
```http
POST /api/upload/images/presigned
Authorization: Bearer {token}
Content-Type: application/json

{
  "filenames": ["image1.jpg", "image2.jpg"]
}
```

**Response:**
```json
{
  "data": {
    "presignedUrls": [
      {
        "filename": "image1.jpg",
        "uploadUrl": "https://supabase-storage.com/...",
        "publicUrl": "https://supabase-storage.com/property-images/uuid-1.jpg"
      }
    ]
  }
}
```

---

## 📱 Flutter Integration Guide

### Setup Dependencies
```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.0
  supabase_flutter: ^2.0.0
```

### 1. Auth Service
```dart
class AuthService {
  static const String baseUrl = 'http://localhost:3000/api/auth';
  
  Future<Map<String, dynamic>?> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _storeToken(data['data']['idToken']);
      return data['data'];
    }
    return null;
  }
  
  Future<bool> logout() async {
    final token = await _getToken();
    await http.post(
      Uri.parse('$baseUrl/logout'),
      headers: {'Authorization': 'Bearer $token'},
    );
    await _clearToken();
    return true;
  }
}
```

### 2. Listings Service
```dart
class ListingsService {
  static const String baseUrl = 'http://localhost:3000/api/listings';
  
  Future<List<Listing>> getListings({
    String? city,
    int? minPrice,
    int? maxPrice,
    String? category,
  }) async {
    final queryParams = <String, String>{};
    if (city != null) queryParams['city'] = city;
    if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
    if (category != null) queryParams['category'] = category;
    
    final uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);
    final response = await http.get(uri);
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['data'] as List)
          .map((json) => Listing.fromJson(json))
          .toList();
    }
    return [];
  }
}
```

### 3. Messaging Service with Realtime
```dart
class MessagingService {
  static const String baseUrl = 'http://localhost:3000/api/messages';
  final SupabaseClient supabase = Supabase.instance.client;
  
  // Subscribe to realtime messages
  RealtimeChannel subscribeToMessages(
    String conversationId,
    Function(Message) onNewMessage,
  ) {
    return supabase
        .channel('messages:$conversationId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: conversationId,
          ),
          callback: (payload) {
            final message = Message.fromJson(payload.newRecord);
            onNewMessage(message);
          },
        )
        .subscribe();
  }
  
  // Send message
  Future<void> sendMessage(String conversationId, String content) async {
    final token = await AuthService().getStoredToken();
    await http.post(
      Uri.parse('$baseUrl/send'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'conversationId': conversationId,
        'content': content,
      }),
    );
  }
}
```

---

## 🗄️ Database Setup

### 1. Run Schema Files
```bash
# Run main schema
psql -h your-supabase-host -U postgres -d postgres < supabase/schema.sql

# Run messages schema
psql -h your-supabase-host -U postgres -d postgres < supabase/messages-schema.sql
```

### 2. Create Storage Bucket
```sql
-- Create property-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Set storage policies
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);
```

### 3. Enable Realtime
```sql
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

### 4. Sample Data
```bash
# Insert sample data
psql -h your-supabase-host -U postgres -d postgres < sample-data.sql
```

---

## 🚀 Deployment

### Environment Variables (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
PORT=3000
PASSWORD_RESET_REDIRECT_URL=your-app://reset-password
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## ✅ Complete API Checklist

### Authentication ✅
- [x] Register
- [x] Login
- [x] Logout
- [x] Get current user
- [x] Refresh token
- [x] Forgot password
- [x] Reset password

### Listings ✅
- [x] Get all listings with filters
- [x] Get single listing
- [x] Create listing
- [x] Update listing
- [x] Delete listing
- [x] Get my listings
- [x] Get filter options

### Messaging ✅
- [x] Create conversation (property & direct)
- [x] List conversations
- [x] Get messages
- [x] Send message
- [x] Mark as read
- [x] Unread count
- [x] Search users
- [x] Realtime support

### Upload ✅
- [x] Upload images (base64)
- [x] Get presigned URLs

### Home Screen ✅
- [x] Near you listings
- [x] Recommended listings
- [x] Search listings
- [x] Category filters

---

## 📚 Additional Documentation Files

- `API_FILTER_DOCUMENTATION.md` - Detailed filter implementation
- `API_MESSAGES_DOCUMENTATION.md` - Messaging system details
- `DIRECT_MESSAGING_GUIDE.md` - Direct messaging implementation
- `FLUTTER_MESSAGING_IMPLEMENTATION.md` - Complete Flutter messaging guide
- `HOME_SCREEN_API_GUIDE.md` - Home screen implementation
- `LOGOUT_API_GUIDE.md` - Logout & token management
- `PROPERTY_DETAIL_CONTACT_OWNER_GUIDE.md` - Contact owner flow

---

**আপনার To-Let API এখন সম্পূর্ণ ready! 🎉**

All endpoints tested and documented. Flutter integration guides provided. Database schema complete. Ready for production deployment!
