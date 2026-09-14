# Flutter API Calls - Quick Reference

## 🎯 কোন Screen এ কোন API Call

### 1. Property Detail Screen (যখন user property দেখছে)

```dart
// Contact Owner button এ click করলে
POST /api/messages/conversations
Body: {
  "listingId": 123,
  "sellerId": "owner-uuid"
}

// Response পেলে Chat Screen এ navigate করুন
```

---

### 2. Messages Screen (Main conversations list)

#### Load Conversations
```dart
GET /api/messages/conversations?filter=all&limit=50
```

#### Load Unread Count
```dart
GET /api/messages/unread-count
```

#### Realtime Setup
```dart
Supabase.instance.client
  .channel('conversations')
  .onPostgresChanges(...)
  .subscribe();
```

---

### 3. Search Users Screen (New Message করার জন্য)

#### Search Users
```dart
GET /api/messages/users/search?q=rahman&limit=20
```

#### Start Direct Conversation
```dart
POST /api/messages/conversations
Body: {
  "otherUserId": "target-user-uuid"
}

// Response পেলে Chat Screen এ navigate করুন
```

---

### 4. Chat Screen (Message send/receive)

#### Load Messages
```dart
GET /api/messages/conversations/{conversationId}/messages?limit=100
```

#### Send Message
```dart
POST /api/messages/send
Body: {
  "conversationId": "conv-uuid",
  "receiverId": "other-user-uuid",
  "messageText": "Hello!",
  "messageType": "text"
}
```

#### Mark as Read
```dart
POST /api/messages/mark-as-read
Body: {
  "conversationId": "conv-uuid"
}
```

#### Realtime Messages
```dart
Supabase.instance.client
  .channel('chat-{conversationId}')
  .onPostgresChanges(...)
  .subscribe();
```

---

## 📱 Complete Code Examples

### Property Detail Screen
```dart
// Contact Owner button handler
onPressed: () async {
  final response = await http.post(
    Uri.parse('$API_URL/messages/conversations'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'listingId': listing.id,
      'sellerId': listing.ownerId,
    }),
  );
  
  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          conversationId: data['data']['id'],
          otherUser: User(...),
          listing: listing,
        ),
      ),
    );
  }
}
```

---

### Messages Screen
```dart
// Load conversations
Future<void> loadConversations() async {
  final response = await http.get(
    Uri.parse('$API_URL/messages/conversations?filter=all'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    setState(() {
      conversations = data['data'];
    });
  }
}

// Load unread count
Future<void> loadUnreadCount() async {
  final response = await http.get(
    Uri.parse('$API_URL/messages/unread-count'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    setState(() {
      unreadCount = data['data']['unreadCount'];
    });
  }
}

// Setup realtime
void setupRealtime() {
  Supabase.instance.client
    .channel('conversations')
    .onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'conversations',
      callback: (payload) {
        loadConversations();
        loadUnreadCount();
      },
    )
    .subscribe();
}
```

---

### Search Users Screen
```dart
// Search users
Future<void> searchUsers(String query) async {
  if (query.length < 2) return;
  
  final response = await http.get(
    Uri.parse('$API_URL/messages/users/search?q=$query'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    setState(() {
      users = data['data'];
    });
  }
}

// Start conversation
Future<void> startConversation(String userId) async {
  final response = await http.post(
    Uri.parse('$API_URL/messages/conversations'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'otherUserId': userId}),
  );
  
  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          conversationId: data['data']['id'],
          otherUser: selectedUser,
          listing: null, // No listing for direct message
        ),
      ),
    );
  }
}
```

---

### Chat Screen
```dart
// Load messages
Future<void> loadMessages() async {
  final response = await http.get(
    Uri.parse('$API_URL/messages/conversations/$conversationId/messages'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    setState(() {
      messages = data['data'];
    });
  }
}

// Send message
Future<void> sendMessage(String text) async {
  final response = await http.post(
    Uri.parse('$API_URL/messages/send'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'conversationId': conversationId,
      'receiverId': otherUser.id,
      'messageText': text,
      'messageType': 'text',
    }),
  );
  
  if (response.statusCode == 201) {
    // Message sent successfully
  }
}

// Mark as read
Future<void> markAsRead() async {
  await http.post(
    Uri.parse('$API_URL/messages/mark-as-read'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'conversationId': conversationId}),
  );
}

// Setup realtime
void setupRealtime() {
  Supabase.instance.client
    .channel('chat-$conversationId')
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
        setState(() {
          messages.add(Message.fromJson(payload.newRecord));
        });
        scrollToBottom();
      },
    )
    .subscribe();
}
```

---

## 🚀 Dependencies Required

```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  supabase_flutter: ^2.0.0
```

---

## 🔐 API Base URL Setup

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api';
  
  static String get messagesUrl => '$baseUrl/messages';
  static String get conversationsUrl => '$messagesUrl/conversations';
  static String get sendUrl => '$messagesUrl/send';
  static String get unreadCountUrl => '$messagesUrl/unread-count';
  static String get searchUsersUrl => '$messagesUrl/users/search';
}
```

---

## 📊 Navigation Flow Chart

```
App Start
    │
    ├─> Property Detail Screen
    │   └─> "Contact Owner" button
    │       └─> POST /messages/conversations {listingId, sellerId}
    │           └─> Chat Screen (with listing card)
    │
    ├─> Messages Screen
    │   ├─> GET /messages/conversations
    │   ├─> GET /messages/unread-count
    │   ├─> Realtime subscription
    │   │
    │   ├─> Click conversation → Chat Screen
    │   │
    │   └─> "New Message" FAB
    │       └─> Search Users Screen
    │           ├─> GET /messages/users/search?q=...
    │           └─> Select user
    │               └─> POST /messages/conversations {otherUserId}
    │                   └─> Chat Screen (no listing card)
    │
    └─> Chat Screen
        ├─> GET /messages/conversations/:id/messages
        ├─> POST /messages/send
        ├─> POST /messages/mark-as-read
        └─> Realtime subscription
```

---

## ✅ Checklist

- [ ] Property Detail Screen → Contact Owner button
- [ ] Messages Screen → Load conversations
- [ ] Messages Screen → Unread count badge
- [ ] Messages Screen → Filter tabs (All, Unread, System)
- [ ] Messages Screen → FAB for New Message
- [ ] Search Users Screen → Search functionality
- [ ] Search Users Screen → Start conversation
- [ ] Chat Screen → Load messages
- [ ] Chat Screen → Send message
- [ ] Chat Screen → Mark as read
- [ ] Chat Screen → Listing card (if property-based)
- [ ] Realtime setup for all screens
- [ ] Error handling
- [ ] Loading states

---

এই guide দিয়ে আপনি সহজেই Flutter app এ সব API integrate করতে পারবেন! 🎯
