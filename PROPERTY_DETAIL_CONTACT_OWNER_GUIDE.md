# Property Detail Screen - Contact Owner Implementation

## 📱 Screen Flow

```
Property Detail Screen
    ↓
User clicks "Contact Owner" button
    ↓
API: Create/Get conversation
    ↓
Navigate to Chat Screen
    ↓
Chat with property owner
```

---

## 🎯 API Implementation

### Step 1: Property Detail Screen

```dart
// lib/screens/property/property_detail_screen.dart

class PropertyDetailScreen extends StatefulWidget {
  final Listing listing;

  const PropertyDetailScreen({required this.listing});

  @override
  _PropertyDetailScreenState createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  bool isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Property Image
            _buildPropertyImage(),

            // Status Badges
            _buildStatusBadges(),

            // Price
            _buildPrice(),

            // Title & Location
            _buildTitleAndLocation(),

            // Property Details (Bedrooms, Bathrooms, Floor Area)
            _buildPropertyDetails(),

            // Property Description
            _buildDescription(),

            // Spacer
            SizedBox(height: 80),
          ],
        ),
      ),

      // Bottom Bar with Favorite & Contact Owner
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildPropertyImage() {
    return Stack(
      children: [
        // Main Image
        Image.network(
          widget.listing.imageUrl,
          height: 300,
          width: double.infinity,
          fit: BoxFit.cover,
        ),

        // Back Button
        Positioned(
          top: 40,
          left: 16,
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ),

        // Share Button
        Positioned(
          top: 40,
          right: 60,
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: Icon(Icons.share, color: Colors.black),
              onPressed: () {
                // Share functionality
              },
            ),
          ),
        ),

        // Favorite Button
        Positioned(
          top: 40,
          right: 16,
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: Icon(Icons.favorite_border, color: Colors.black),
              onPressed: () {
                // Toggle favorite
              },
            ),
          ),
        ),

        // Image Counter
        Positioned(
          bottom: 16,
          right: 16,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.image, color: Colors.white, size: 16),
                SizedBox(width: 4),
                Text(
                  '1/2',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadges() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.green),
            ),
            child: Text(
              'Available now',
              style: TextStyle(
                color: Colors.green[700],
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          SizedBox(width: 8),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.orange),
            ),
            child: Text(
              'No brokerage',
              style: TextStyle(
                color: Colors.orange[700],
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrice() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        '৳${widget.listing.price.toStringAsFixed(0)} /month',
        style: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildTitleAndLocation() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.listing.title,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.location_on, size: 16, color: Colors.grey),
              SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${widget.listing.area} • ${widget.listing.city}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyDetails() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildDetailItem(
            'Bedrooms',
            '${widget.listing.bedrooms} Beds',
            Icons.bed,
          ),
          _buildDetailItem(
            'Bathrooms',
            '${widget.listing.bathrooms} Baths',
            Icons.bathtub,
          ),
          _buildDetailItem(
            'Floor Area',
            '${widget.listing.squareFeet ?? 1450} sqft',
            Icons.square_foot,
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        SizedBox(height: 8),
        Icon(icon, size: 24, color: Colors.grey[700]),
        SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildDescription() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Property description',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12),
          Text(
            widget.listing.description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // Bottom Bar with Contact Owner Button
  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            offset: Offset(0, -2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: [
          // Favorite Button
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: Icon(Icons.favorite_border),
              onPressed: () {
                // Toggle favorite
              },
            ),
          ),
          SizedBox(width: 12),

          // Contact Owner Button
          Expanded(
            child: ElevatedButton.icon(
              onPressed: isLoading ? null : _contactOwner,
              icon: isLoading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Icon(Icons.chat_bubble, size: 20),
              label: Text(
                isLoading ? 'Loading...' : 'Contact Owner',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFE85A4F),
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // API Call: Contact Owner
  Future<void> _contactOwner() async {
    setState(() => isLoading = true);

    try {
      // API Call: Create or get conversation
      final response = await http.post(
        Uri.parse('$API_BASE_URL/messages/conversations'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'listingId': widget.listing.id,
          'sellerId': widget.listing.ownerId,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final conversation = data['data'];

        // Navigate to Chat Screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversationId: conversation['id'],
              otherUser: User(
                id: widget.listing.ownerId,
                name: widget.listing.ownerName ?? 'Owner',
                email: widget.listing.ownerEmail,
              ),
              listing: widget.listing, // Pass listing for chat header
            ),
          ),
        );
      } else {
        throw Exception('Failed to create conversation');
      }
    } catch (e) {
      print('Error contacting owner: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to contact owner. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }
}
```

---

## 🔗 API Call Details

### Endpoint
```
POST /api/messages/conversations
```

### Request Headers
```dart
{
  'Authorization': 'Bearer {authToken}',
  'Content-Type': 'application/json'
}
```

### Request Body
```json
{
  "listingId": 123,
  "sellerId": "owner-user-uuid"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Listing conversation created/retrieved.",
  "data": {
    "id": "conversation-uuid-456",
    "listing_id": 123,
    "buyer_id": "current-user-uuid",
    "seller_id": "owner-user-uuid",
    "buyer_unread_count": 0,
    "seller_unread_count": 0,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

## 📱 Chat Screen Auto-Message

যখন user "Contact Owner" click করবে, chat screen এ একটা **automatic first message** পাঠান:

```dart
// After creating conversation, send auto message
Future<void> _sendAutoMessage(String conversationId) async {
  final autoMessage = 
    'Property inquiry about ${widget.listing.title} in ${widget.listing.area}';

  await http.post(
    Uri.parse('$API_BASE_URL/messages/send'),
    headers: {
      'Authorization': 'Bearer $authToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'conversationId': conversationId,
      'receiverId': widget.listing.ownerId,
      'messageText': autoMessage,
      'messageType': 'system',
    }),
  );
}
```

---

## 🎯 Complete Flow with Auto-Message

```dart
Future<void> _contactOwner() async {
  setState(() => isLoading = true);

  try {
    // Step 1: Create conversation
    final convResponse = await http.post(
      Uri.parse('$API_BASE_URL/messages/conversations'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'listingId': widget.listing.id,
        'sellerId': widget.listing.ownerId,
      }),
    );

    if (convResponse.statusCode == 201) {
      final data = jsonDecode(convResponse.body);
      final conversationId = data['data']['id'];

      // Step 2: Send auto message (optional)
      await http.post(
        Uri.parse('$API_BASE_URL/messages/send'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'conversationId': conversationId,
          'receiverId': widget.listing.ownerId,
          'messageText': 'Property inquiry about ${widget.listing.title} in ${widget.listing.area}',
          'messageType': 'system',
        }),
      );

      // Step 3: Navigate to Chat Screen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            conversationId: conversationId,
            otherUser: User(
              id: widget.listing.ownerId,
              name: widget.listing.ownerName ?? 'Owner',
              email: widget.listing.ownerEmail,
            ),
            listing: widget.listing,
          ),
        ),
      );
    }
  } catch (e) {
    print('Error: $e');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Failed to contact owner')),
    );
  } finally {
    setState(() => isLoading = false);
  }
}
```

---

## 📊 User Flow Diagram

```
Property Detail Screen
    │
    ├─> User clicks "Contact Owner"
    │   ├─> Show loading indicator
    │   │
    │   ├─> API Call 1: Create Conversation
    │   │   POST /api/messages/conversations
    │   │   Body: {listingId, sellerId}
    │   │   ↓
    │   │   Response: {conversationId}
    │   │
    │   ├─> API Call 2: Send Auto Message (Optional)
    │   │   POST /api/messages/send
    │   │   Body: {conversationId, receiverId, messageText}
    │   │
    │   └─> Navigate to Chat Screen
    │       ├─> Conversation ID
    │       ├─> Owner Info
    │       └─> Listing Details (for header card)
    │
    └─> Chat Screen Opens
        ├─> Listing card displayed at top
        ├─> Auto message visible (if sent)
        └─> User can start chatting
```

---

## 🎨 Chat Screen with Listing Card

যখন property থেকে chat করা হয়, chat screen এ listing এর একটা card দেখাবে:

```dart
// In ChatScreen

@override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(
      title: Row(
        children: [
          CircleAvatar(
            backgroundImage: NetworkImage(widget.otherUser.profilePicture),
          ),
          SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.otherUser.name),
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  SizedBox(width: 4),
                  Text('Owner • Online', style: TextStyle(fontSize: 12)),
                ],
              ),
            ],
          ),
        ],
      ),
    ),
    body: Column(
      children: [
        // Listing Card at top (if conversation is about a property)
        if (widget.listing != null) _buildListingCard(),

        // Messages
        Expanded(
          child: ListView.builder(
            itemCount: messages.length,
            itemBuilder: (context, index) {
              return MessageBubble(message: messages[index]);
            },
          ),
        ),

        // Input bar
        _buildInputBar(),
      ],
    ),
  );
}

Widget _buildListingCard() {
  return Container(
    margin: EdgeInsets.all(12),
    padding: EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey[300]!),
    ),
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
                '${widget.listing!.bedrooms}bd • ${widget.listing!.bathrooms}ba • ${widget.listing!.squareFeet ?? 0} sqft',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Text(
                '৳${widget.listing!.price.toStringAsFixed(0)}/mo',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFE85A4F),
                ),
              ),
            ],
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PropertyDetailScreen(
                  listing: widget.listing!,
                ),
              ),
            );
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
  );
}
```

---

## ✅ Implementation Checklist

- [ ] Property Detail Screen UI
- [ ] Contact Owner button with loading state
- [ ] API call to create conversation
- [ ] Error handling
- [ ] Success navigation to Chat Screen
- [ ] Optional: Auto-message on contact
- [ ] Chat Screen with listing card
- [ ] Listing card "View" button
- [ ] Test end-to-end flow

---

## 🧪 Testing

```dart
// Test the flow
1. Open Property Detail Screen
2. Click "Contact Owner"
3. Verify loading indicator shows
4. Verify API call is made
5. Verify navigation to Chat Screen
6. Verify listing card is displayed
7. Verify can send messages
8. Verify "View" button works
```

---

## 📝 Error Handling

```dart
try {
  // API call
} catch (e) {
  if (e is SocketException) {
    // Network error
    showSnackBar('No internet connection');
  } else if (e is HttpException) {
    // Server error
    showSnackBar('Server error. Please try again.');
  } else if (e is FormatException) {
    // Invalid response
    showSnackBar('Invalid response from server');
  } else {
    // Generic error
    showSnackBar('Something went wrong');
  }
}
```

---

এই implementation দিয়ে "Contact Owner" button থেকে সরাসরি chat screen এ যাওয়া যাবে! 🏠💬
