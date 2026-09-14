# Flutter Messaging Implementation Guide

## 📱 Screen Structure

```
lib/
├── screens/
│   ├── messages/
│   │   ├── messages_screen.dart          # Main messages list
│   │   ├── chat_screen.dart              # One-on-one chat
│   │   ├── search_users_screen.dart      # Search users (NEW)
│   │   └── widgets/
│   │       ├── conversation_item.dart
│   │       ├── message_bubble.dart
│   │       └── listing_card.dart
│   └── listings/
│       └── listing_detail_screen.dart    # Property details
├── services/
│   ├── api_service.dart
│   ├── messaging_service.dart
│   └── supabase_service.dart
└── models/
    ├── conversation.dart
    ├── message.dart
    └── user.dart
```

---

## 🎯 কোন Screen এ কোন API Call

### 1️⃣ Property Detail Screen (Listing Details)
**যখন user property দেখছে এবং owner কে contact করবে**

```dart
// lib/screens/listings/listing_detail_screen.dart

class ListingDetailScreen extends StatelessWidget {
  final Listing listing;

  // "Contact Owner" button click করলে
  Future<void> _contactOwner(BuildContext context) async {
    try {
      // API Call: Create property-based conversation
      final response = await http.post(
        Uri.parse('$API_BASE_URL/messages/conversations'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'listingId': listing.id,
          'sellerId': listing.ownerId,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final conversation = Conversation.fromJson(data['data']);

        // Navigate to chat screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversationId: conversation.id,
              otherUser: User(
                id: listing.ownerId,
                name: listing.ownerName,
                email: listing.ownerEmail,
              ),
              listing: listing,
            ),
          ),
        );
      }
    } catch (e) {
      print('Error creating conversation: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start conversation')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Property details...
          
          // Contact Owner Button
          ElevatedButton(
            onPressed: () => _contactOwner(context),
            child: Text('Contact Owner'),
          ),
        ],
      ),
    );
  }
}
```

---

### 2️⃣ Messages Screen (Main Conversations List)
**সব conversations দেখার জন্য**

```dart
// lib/screens/messages/messages_screen.dart

class MessagesScreen extends StatefulWidget {
  @override
  _MessagesScreenState createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Conversation> conversations = [];
  int totalUnread = 0;
  String selectedFilter = 'all'; // 'all', 'unread', 'system'
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadConversations();
    _loadUnreadCount();
    _setupRealtimeSubscription();
  }

  // API Call 1: Load conversations
  Future<void> _loadConversations() async {
    setState(() => isLoading = true);
    
    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/messages/conversations?filter=$selectedFilter&limit=50'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          conversations = (data['data'] as List)
              .map((json) => Conversation.fromJson(json))
              .toList();
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading conversations: $e');
      setState(() => isLoading = false);
    }
  }

  // API Call 2: Load unread count
  Future<void> _loadUnreadCount() async {
    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/messages/unread-count'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          totalUnread = data['data']['unreadCount'];
        });
      }
    } catch (e) {
      print('Error loading unread count: $e');
    }
  }

  // Setup Supabase Realtime
  void _setupRealtimeSubscription() {
    final supabase = Supabase.instance.client;
    
    supabase
        .channel('conversations')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'conversations',
          callback: (payload) {
            print('Conversation updated: ${payload}');
            _loadConversations();
            _loadUnreadCount();
          },
        )
        .subscribe();
  }

  // Navigate to Search Users (NEW)
  void _openSearchUsers() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SearchUsersScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Messages'),
        actions: [
          // Unread badge
          if (totalUnread > 0)
            Badge(
              label: Text('$totalUnread'),
              child: Icon(Icons.notifications),
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter Tabs
          Row(
            children: [
              _buildFilterChip('All', 'all'),
              _buildFilterChip('Unread', 'unread'),
              _buildFilterChip('System', 'system'),
            ],
          ),
          
          // Conversations List
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadConversations,
                    child: ListView.builder(
                      itemCount: conversations.length,
                      itemBuilder: (context, index) {
                        final conversation = conversations[index];
                        return ConversationItem(
                          conversation: conversation,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ChatScreen(
                                  conversationId: conversation.id,
                                  otherUser: conversation.otherUser,
                                  listing: conversation.listing,
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
          ),
          
          // Need Help Button
          ListTile(
            leading: Icon(Icons.phone),
            title: Text('Need help?'),
            subtitle: Text('Contact support team 24/7'),
            trailing: Icon(Icons.arrow_forward_ios),
            onTap: () {
              // Open support
            },
          ),
        ],
      ),
      
      // Floating Action Button - New Message
      floatingActionButton: FloatingActionButton(
        onPressed: _openSearchUsers,
        child: Icon(Icons.edit),
        tooltip: 'New Message',
      ),
    );
  }

  Widget _buildFilterChip(String label, String filter) {
    final isSelected = selectedFilter == filter;
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 4),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            selectedFilter = filter;
          });
          _loadConversations();
        },
      ),
    );
  }

  @override
  void dispose() {
    Supabase.instance.client.removeAllChannels();
    super.dispose();
  }
}
```

---

### 3️⃣ Search Users Screen (NEW)
**যেকোনো user কে message করার জন্য**

```dart
// lib/screens/messages/search_users_screen.dart

class SearchUsersScreen extends StatefulWidget {
  @override
  _SearchUsersScreenState createState() => _SearchUsersScreenState();
}

class _SearchUsersScreenState extends State<SearchUsersScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<User> searchResults = [];
  bool isSearching = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    _debounce = Timer(Duration(milliseconds: 500), () {
      if (_searchController.text.length >= 2) {
        _searchUsers(_searchController.text);
      } else {
        setState(() => searchResults = []);
      }
    });
  }

  // API Call: Search users
  Future<void> _searchUsers(String query) async {
    setState(() => isSearching = true);

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/messages/users/search?q=$query&limit=20'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          searchResults = (data['data'] as List)
              .map((json) => User.fromJson(json))
              .toList();
          isSearching = false;
        });
      }
    } catch (e) {
      print('Error searching users: $e');
      setState(() => isSearching = false);
    }
  }

  // API Call: Create direct conversation
  Future<void> _startConversation(User user) async {
    try {
      final response = await http.post(
        Uri.parse('$API_BASE_URL/messages/conversations'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'otherUserId': user.id,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final conversation = Conversation.fromJson(data['data']);

        // Navigate to chat screen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversationId: conversation.id,
              otherUser: user,
              listing: null, // No listing for direct message
            ),
          ),
        );
      }
    } catch (e) {
      print('Error creating conversation: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start conversation')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('New Message'),
      ),
      body: Column(
        children: [
          // Search Input
          Padding(
            padding: EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users by name or email...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              autofocus: true,
            ),
          ),
          
          // Search Results
          Expanded(
            child: isSearching
                ? Center(child: CircularProgressIndicator())
                : searchResults.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              _searchController.text.isEmpty
                                  ? 'Search for users'
                                  : 'No users found',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: searchResults.length,
                        itemBuilder: (context, index) {
                          final user = searchResults[index];
                          return ListTile(
                            leading: CircleAvatar(
                              child: Text(user.name[0].toUpperCase()),
                              backgroundColor: Colors.red,
                            ),
                            title: Text(user.name),
                            subtitle: Text(user.email),
                            trailing: Icon(Icons.arrow_forward_ios),
                            onTap: () => _startConversation(user),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }
}
```

---

### 4️⃣ Chat Screen (One-on-One Chat)
**Message send/receive করার জন্য**

```dart
// lib/screens/messages/chat_screen.dart

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final User otherUser;
  final Listing? listing; // null for direct messages

  const ChatScreen({
    required this.conversationId,
    required this.otherUser,
    this.listing,
  });

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Message> messages = [];
  bool isLoading = true;
  bool isSending = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _markAsRead();
    _setupRealtimeSubscription();
  }

  // API Call 1: Load messages
  Future<void> _loadMessages() async {
    setState(() => isLoading = true);

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/messages/conversations/${widget.conversationId}/messages?limit=100'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          messages = (data['data'] as List)
              .map((json) => Message.fromJson(json))
              .toList();
          isLoading = false;
        });

        // Auto scroll to bottom
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      }
    } catch (e) {
      print('Error loading messages: $e');
      setState(() => isLoading = false);
    }
  }

  // API Call 2: Send message
  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final messageText = _messageController.text.trim();
    _messageController.clear();

    // Optimistic UI update
    final tempMessage = Message(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      conversationId: widget.conversationId,
      senderId: 'current-user-id', // Replace with actual user ID
      receiverId: widget.otherUser.id,
      messageText: messageText,
      messageType: 'text',
      isRead: false,
      createdAt: DateTime.now(),
    );

    setState(() {
      messages.add(tempMessage);
    });
    _scrollToBottom();

    try {
      setState(() => isSending = true);

      final response = await http.post(
        Uri.parse('$API_BASE_URL/messages/send'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'conversationId': widget.conversationId,
          'receiverId': widget.otherUser.id,
          'messageText': messageText,
          'messageType': 'text',
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final sentMessage = Message.fromJson(data['data']);

        // Replace temp message with real one
        setState(() {
          final index = messages.indexWhere((m) => m.id == tempMessage.id);
          if (index != -1) {
            messages[index] = sentMessage;
          }
        });
      } else {
        // Remove temp message on error
        setState(() {
          messages.removeWhere((m) => m.id == tempMessage.id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send message')),
        );
      }
    } catch (e) {
      print('Error sending message: $e');
      setState(() {
        messages.removeWhere((m) => m.id == tempMessage.id);
      });
    } finally {
      setState(() => isSending = false);
    }
  }

  // API Call 3: Mark as read
  Future<void> _markAsRead() async {
    try {
      await http.post(
        Uri.parse('$API_BASE_URL/messages/mark-as-read'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'conversationId': widget.conversationId,
        }),
      );
    } catch (e) {
      print('Error marking as read: $e');
    }
  }

  // Setup Supabase Realtime
  void _setupRealtimeSubscription() {
    final supabase = Supabase.instance.client;

    supabase
        .channel('chat-${widget.conversationId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: widget.conversationId,
          ),
          callback: (payload) {
            print('New message received: ${payload.newRecord}');
            final newMessage = Message.fromJson(payload.newRecord);
            
            setState(() {
              messages.add(newMessage);
            });
            _scrollToBottom();
            _markAsRead();
          },
        )
        .subscribe();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            CircleAvatar(
              child: Text(widget.otherUser.name[0].toUpperCase()),
              backgroundColor: Colors.red,
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.otherUser.name,
                    style: TextStyle(fontSize: 16),
                  ),
                  Text(
                    'Online',
                    style: TextStyle(fontSize: 12, color: Colors.green),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.phone),
            onPressed: () {
              // Call functionality
            },
          ),
          IconButton(
            icon: Icon(Icons.more_vert),
            onPressed: () {
              // More options
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Listing Card (if property-based conversation)
          if (widget.listing != null)
            Container(
              padding: EdgeInsets.all(12),
              color: Colors.white,
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      widget.listing!.imageUrl,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.listing!.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${widget.listing!.bedrooms}bd • ${widget.listing!.bathrooms}ba',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        Text(
                          '৳${widget.listing!.price.toStringAsFixed(0)}/mo',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      // Navigate to listing detail
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: Text('View'),
                  ),
                ],
              ),
            ),

          // Date Separator
          Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text(
              'Today • 2 min',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ),

          // Messages List
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final message = messages[index];
                      final isMine = message.senderId != widget.otherUser.id;

                      return MessageBubble(
                        message: message,
                        isMine: isMine,
                      );
                    },
                  ),
          ),

          // Input Bar
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey[300]!)),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(Icons.attach_file),
                  onPressed: () {
                    // Attach file
                  },
                ),
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Message ${widget.otherUser.name}...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[200],
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.red,
                  child: isSending
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : IconButton(
                          icon: Icon(Icons.send, color: Colors.white, size: 20),
                          onPressed: _sendMessage,
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    Supabase.instance.client.removeChannel('chat-${widget.conversationId}');
    super.dispose();
  }
}
```

---

## 📊 Summary Table

| Screen | API Calls | Purpose |
|--------|-----------|---------|
| **Property Detail** | `POST /conversations` | Contact owner about property |
| **Messages List** | `GET /conversations`<br>`GET /unread-count` | Show all conversations + unread badge |
| **Search Users** | `GET /users/search`<br>`POST /conversations` | Find & message any user |
| **Chat** | `GET /conversations/:id/messages`<br>`POST /send`<br>`POST /mark-as-read` | Send/receive messages |

---

## 🎯 Navigation Flow

```
1. Property Screen → Contact Owner
   └─> POST /conversations {listingId, sellerId}
       └─> Navigate to Chat Screen

2. Messages Screen → New Message (Floating Button)
   └─> Navigate to Search Users Screen
       └─> GET /users/search?q=...
           └─> Select user
               └─> POST /conversations {otherUserId}
                   └─> Navigate to Chat Screen

3. Messages Screen → Click conversation
   └─> Navigate to Chat Screen
```

---

এই implementation দিয়ে আপনার Flutter app এ সম্পূর্ণ messaging system কাজ করবে! 🚀
