# Home Screen API Implementation Guide

## 📱 Home Screen Features & API Calls

আপনার Home Screen এ যা যা আছে এবং তাদের API:

---

## 🎯 Screen Elements & API Mapping

### 1. Search Bar
**"Search by area, location, or building name"**

```dart
// API Call
GET /api/listings?city={city}&area={searchQuery}&limit=20

// Example
GET /api/listings?city=Khulna&area=Sonadanga&limit=20
```

### 2. Filter Chips (Family, Bachelor Male, Bachelor)
**Property type filter buttons**

```dart
// API Call
GET /api/listings?category={type}&limit=20

// Examples
GET /api/listings?category=Family&limit=20
GET /api/listings?category=Bachelor&limit=20
```

### 3. Post Property Banner
**"LIMITED OFFER - Post your property for free this month"**

```dart
// Navigate to Post Listing Screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => PostListingScreen(),
  ),
);
```

### 4. Near You - Location Based
**"Near you - Khulna to Shiromoni"**

```dart
// API Call
GET /api/listings?city=Khulna&area=Shiromoni&limit=10&offset=0

// With user's current location
GET /api/listings?city={userCity}&limit=10
```

### 5. Property Cards
**Individual listing cards**

```dart
// API Call for listing details
GET /api/listings/{id}

// Favorite/Like functionality
POST /api/listings/{id}/favorite  // Need to create this
```

### 6. Recommended For You
**"BASED ON FILTER - Personalized recommendations"**

```dart
// API Call based on user's previous searches/filters
GET /api/listings?category=Sublet&bedrooms=1&limit=5

// Or based on user preferences
GET /api/listings?city=Khulna&furnishing=Furnished&limit=5
```

### 7. Bottom Navigation
- Home (current screen)
- Favorites (saved properties)
- Messages (chat)
- Profile

---

## 📝 Complete Home Screen Implementation

```dart
// lib/screens/home/home_screen.dart

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Listing> nearYouListings = [];
  List<Listing> recommendedListings = [];
  String selectedCategory = '';
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  // API Call 1: Load all home screen data
  Future<void> _loadHomeData() async {
    setState(() => isLoading = true);

    await Future.wait([
      _loadNearYouListings(),
      _loadRecommendedListings(),
    ]);

    setState(() => isLoading = false);
  }

  // API Call 2: Near you listings
  Future<void> _loadNearYouListings() async {
    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/listings?city=Khulna&limit=10'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          nearYouListings = (data['data'] as List)
              .map((json) => Listing.fromJson(json))
              .toList();
        });
      }
    } catch (e) {
      print('Error loading near you listings: $e');
    }
  }

  // API Call 3: Recommended listings
  Future<void> _loadRecommendedListings() async {
    try {
      // Based on user's preferences or recent searches
      final response = await http.get(
        Uri.parse('$API_BASE_URL/listings?furnishing=Furnished&limit=5'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          recommendedListings = (data['data'] as List)
              .map((json) => Listing.fromJson(json))
              .toList();
        });
      }
    } catch (e) {
      print('Error loading recommended listings: $e');
    }
  }

  // API Call 4: Search listings
  Future<void> _searchListings(String query) async {
    if (query.isEmpty) return;

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/listings?area=$query&limit=20'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Navigate to search results screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => SearchResultsScreen(
              listings: (data['data'] as List)
                  .map((json) => Listing.fromJson(json))
                  .toList(),
              searchQuery: query,
            ),
          ),
        );
      }
    } catch (e) {
      print('Error searching listings: $e');
    }
  }

  // API Call 5: Filter by category
  Future<void> _filterByCategory(String category) async {
    setState(() => selectedCategory = category);

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/listings?category=$category&limit=20'),
        headers: {'Authorization': 'Bearer $authToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Navigate to filtered results
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => SearchResultsScreen(
              listings: (data['data'] as List)
                  .map((json) => Listing.fromJson(json))
                  .toList(),
              searchQuery: category,
            ),
          ),
        );
      }
    } catch (e) {
      print('Error filtering by category: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: isLoading
            ? Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    _buildHeader(),

                    // Search Bar
                    _buildSearchBar(),

                    // Filter Chips
                    _buildFilterChips(),

                    // Post Property Banner
                    _buildPostPropertyBanner(),

                    // Near You Section
                    _buildNearYouSection(),

                    // Recommended Section
                    _buildRecommendedSection(),

                    // Bottom Actions
                    _buildBottomActions(),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  // Header with greeting and notification
  Widget _buildHeader() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Good night, Desh Bala',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              SizedBox(height: 4),
              Text(
                'Find your next place',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          // Notification bell (we'll skip this as per your request)
          // IconButton(
          //   icon: Icon(Icons.notifications_outlined),
          //   onPressed: () {},
          // ),
        ],
      ),
    );
  }

  // Search Bar
  Widget _buildSearchBar() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search by area, location, or bu...',
                prefixIcon: Icon(Icons.search, color: Colors.grey),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey[100],
              ),
              onSubmitted: _searchListings,
            ),
          ),
          SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
              color: Color(0xFFE85A4F),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: Icon(Icons.tune, color: Colors.white),
              onPressed: () {
                // Open filter screen
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => FilterScreen(),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // Filter Chips
  Widget _buildFilterChips() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          _buildChip('👨‍👩‍👧‍👦 Family', 'Family'),
          SizedBox(width: 8),
          _buildChip('👤 Bachelor Male', 'Bachelor'),
          SizedBox(width: 8),
          _buildChip('👤 Bachelor', 'Bachelor'),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String category) {
    final isSelected = selectedCategory == category;
    return GestureDetector(
      onTap: () => _filterByCategory(category),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Color(0xFFE85A4F) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  // Post Property Banner
  Widget _buildPostPropertyBanner() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFE85A4F), Color(0xFFD84A3E)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LIMITED OFFER',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Post your property for\nfree this month',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PostListingScreen(),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Color(0xFFE85A4F),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                'Post Now',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Near You Section
  Widget _buildNearYouSection() {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Near you - Khulna to Shiromoni',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  // Show all nearby listings
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => SearchResultsScreen(
                        listings: nearYouListings,
                        searchQuery: 'Near You',
                      ),
                    ),
                  );
                },
                child: Text(
                  'See all →',
                  style: TextStyle(color: Color(0xFFE85A4F)),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 16),
            itemCount: nearYouListings.length,
            itemBuilder: (context, index) {
              final listing = nearYouListings[index];
              return _buildPropertyCard(listing);
            },
          ),
        ),
      ],
    );
  }

  // Recommended Section
  Widget _buildRecommendedSection() {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recommended for you',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'BASED ON FILTER',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFFE85A4F),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        ListView.builder(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          padding: EdgeInsets.symmetric(horizontal: 16),
          itemCount: recommendedListings.length,
          itemBuilder: (context, index) {
            final listing = recommendedListings[index];
            return _buildRecommendedCard(listing);
          },
        ),
      ],
    );
  }

  // Property Card (Horizontal)
  Widget _buildPropertyCard(Listing listing) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListingDetailScreen(listing: listing),
          ),
        );
      },
      child: Container(
        width: 200,
        margin: EdgeInsets.only(right: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    listing.imageUrl,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                // Favorite button
                Positioned(
                  top: 8,
                  right: 8,
                  child: CircleAvatar(
                    backgroundColor: Colors.white,
                    radius: 18,
                    child: Icon(Icons.favorite_border, size: 20),
                  ),
                ),
                // Badge
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${listing.bedrooms} beds • ${listing.category}',
                      style: TextStyle(fontSize: 10),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            // Price
            Text(
              '৳${listing.price.toStringAsFixed(0)} /mo',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            // Details
            Text(
              '${listing.bedrooms}BHK • ${listing.area} • ${listing.city}',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // Recommended Card (Vertical)
  Widget _buildRecommendedCard(Listing listing) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListingDetailScreen(listing: listing),
          ),
        );
      },
      child: Container(
        margin: EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            // Image
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    listing.imageUrl,
                    height: 100,
                    width: 100,
                    fit: BoxFit.cover,
                  ),
                ),
                // Verified badge
                if (listing.isDirectOwner)
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.verified, color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'VERIFIED',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(width: 12),
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    '৳${listing.price.toStringAsFixed(0)} /mo',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFE85A4F),
                    ),
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.bed, size: 14, color: Colors.grey),
                      SizedBox(width: 4),
                      Text(
                        '${listing.bedrooms} bd',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.bathtub, size: 14, color: Colors.grey),
                      SizedBox(width: 4),
                      Text(
                        '${listing.bathrooms} ba',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      SizedBox(width: 8),
                      Text(
                        '${listing.squareFeet ?? 0} sqft',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 12, color: Colors.grey),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${listing.area} • ${listing.city}',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Favorite button
            IconButton(
              icon: Icon(Icons.favorite_border),
              onPressed: () {
                // Toggle favorite
              },
            ),
          ],
        ),
      ),
    );
  }

  // Bottom Actions
  Widget _buildBottomActions() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PostListingScreen(),
                  ),
                );
              },
              icon: Icon(Icons.add),
              label: Text('Post a listing'),
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
          SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {
                // Open voice search
              },
              icon: Icon(Icons.mic),
              label: Text('Voice Search'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Color(0xFFE85A4F),
                padding: EdgeInsets.symmetric(vertical: 16),
                side: BorderSide(color: Color(0xFFE85A4F)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          SizedBox(width: 12),
          OutlinedButton.icon(
            onPressed: () {
              // Open map view
            },
            icon: Icon(Icons.map),
            label: Text('Map view'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.black87,
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              side: BorderSide(color: Colors.grey[300]!),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Bottom Navigation
  Widget _buildBottomNavigation() {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Color(0xFFE85A4F),
      unselectedItemColor: Colors.grey,
      currentIndex: 0,
      items: [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.favorite_border),
          label: 'Favorites',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline),
          label: 'Messages',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          label: 'Profile',
        ),
      ],
      onTap: (index) {
        if (index == 2) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MessagesScreen(),
            ),
          );
        }
        // Handle other navigation
      },
    );
  }
}
```

---

## 📊 API Endpoints Summary for Home Screen

| Feature | API Endpoint | Method | Parameters |
|---------|-------------|--------|------------|
| **Near You** | `/api/listings` | GET | `city=Khulna&limit=10` |
| **Recommended** | `/api/listings` | GET | `furnishing=Furnished&limit=5` |
| **Search** | `/api/listings` | GET | `area={query}&limit=20` |
| **Filter by Category** | `/api/listings` | GET | `category={type}&limit=20` |
| **Listing Details** | `/api/listings/{id}` | GET | - |

---

## 🔄 Data Flow

```
Home Screen Load
    ↓
1. GET /api/listings?city=Khulna&limit=10
   → Near You listings
    ↓
2. GET /api/listings?furnishing=Furnished&limit=5
   → Recommended listings
    ↓
Display on screen

User Actions:
├─> Search → GET /api/listings?area={query}
├─> Filter Chip → GET /api/listings?category={type}
├─> Click Card → Navigate to Detail Screen
├─> Post Now → Navigate to Post Listing Screen
└─> Messages → Navigate to Messages Screen
```

---

## ✅ Implementation Checklist

- [ ] Header with greeting
- [ ] Search bar with filter button
- [ ] Category filter chips
- [ ] Post property banner
- [ ] Near you horizontal list
- [ ] Recommended vertical list
- [ ] Property cards with images
- [ ] Favorite button functionality
- [ ] Bottom action buttons
- [ ] Bottom navigation bar
- [ ] Pull to refresh
- [ ] Loading states
- [ ] Error handling

---

এই implementation দিয়ে আপনার Home Screen এর সব functionality কাজ করবে! 🏠🎉
