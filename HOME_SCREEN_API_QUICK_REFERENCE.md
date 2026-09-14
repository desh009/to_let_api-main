# Home Screen API - Quick Reference

## 🎯 কোন Element এ কোন API

### 1️⃣ Search Bar
```dart
// User যখন search করে
GET /api/listings?area={searchQuery}&limit=20

// Example
GET /api/listings?area=Sonadanga&limit=20
```

---

### 2️⃣ Filter Chips (Family, Bachelor, etc.)
```dart
// Chip click করলে
GET /api/listings?category={type}&limit=20

// Examples
GET /api/listings?category=Family&limit=20
GET /api/listings?category=Bachelor&limit=20
```

---

### 3️⃣ Near You Section
```dart
// Page load হলে automatically
GET /api/listings?city=Khulna&limit=10

// See all click করলে
GET /api/listings?city=Khulna&limit=50
```

---

### 4️⃣ Recommended Section
```dart
// User এর preference based
GET /api/listings?furnishing=Furnished&limit=5

// Or recent searches based
GET /api/listings?bedrooms=2&category=Family&limit=5
```

---

### 5️⃣ Property Card Click
```dart
// Card click করলে details দেখার জন্য
GET /api/listings/{id}

// Example
GET /api/listings/123
```

---

### 6️⃣ Filter Button (Tune Icon)
```dart
// Filter screen এ navigate করুন
// সেখানে advanced filters apply করা যাবে
Navigator.push(context, FilterScreen());
```

---

## 💻 Complete Home Screen Code

```dart
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Listing> nearYouListings = [];
  List<Listing> recommendedListings = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() => isLoading = true);

    // API Call 1: Near you
    final nearYouResponse = await http.get(
      Uri.parse('$API_URL/listings?city=Khulna&limit=10'),
      headers: {'Authorization': 'Bearer $token'},
    );

    // API Call 2: Recommended
    final recommendedResponse = await http.get(
      Uri.parse('$API_URL/listings?furnishing=Furnished&limit=5'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (nearYouResponse.statusCode == 200) {
      final data = jsonDecode(nearYouResponse.body);
      nearYouListings = (data['data'] as List)
          .map((json) => Listing.fromJson(json))
          .toList();
    }

    if (recommendedResponse.statusCode == 200) {
      final data = jsonDecode(recommendedResponse.body);
      recommendedListings = (data['data'] as List)
          .map((json) => Listing.fromJson(json))
          .toList();
    }

    setState(() => isLoading = false);
  }

  // Search handler
  void _onSearch(String query) async {
    final response = await http.get(
      Uri.parse('$API_URL/listings?area=$query&limit=20'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Show results
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SearchResultsScreen(
            listings: data['data'],
          ),
        ),
      );
    }
  }

  // Filter by category
  void _filterByCategory(String category) async {
    final response = await http.get(
      Uri.parse('$API_URL/listings?category=$category&limit=20'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Show results
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SearchResultsScreen(
            listings: data['data'],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header
            _buildHeader(),

            // Search Bar
            TextField(
              decoration: InputDecoration(
                hintText: 'Search by area, location...',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: _onSearch,
            ),

            // Filter Chips
            Row(
              children: [
                FilterChip(
                  label: Text('Family'),
                  onSelected: (_) => _filterByCategory('Family'),
                ),
                FilterChip(
                  label: Text('Bachelor'),
                  onSelected: (_) => _filterByCategory('Bachelor'),
                ),
              ],
            ),

            // Near You
            Text('Near you - Khulna to Shiromoni'),
            SizedBox(
              height: 280,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: nearYouListings.length,
                itemBuilder: (context, index) {
                  return PropertyCard(
                    listing: nearYouListings[index],
                  );
                },
              ),
            ),

            // Recommended
            Text('Recommended for you'),
            ListView.builder(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: recommendedListings.length,
              itemBuilder: (context, index) {
                return PropertyCard(
                  listing: recommendedListings[index],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Good night, Desh Bala'),
              Text(
                'Find your next place',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## 📱 Screen Elements vs API

| Screen Element | API Call | When |
|----------------|----------|------|
| **Greeting Text** | - | Static |
| **Search Bar** | `GET /listings?area={query}` | On submit |
| **Filter Icon** | Navigate to FilterScreen | On tap |
| **Family Chip** | `GET /listings?category=Family` | On tap |
| **Bachelor Chip** | `GET /listings?category=Bachelor` | On tap |
| **Post Banner** | Navigate to PostListingScreen | On tap |
| **Near You List** | `GET /listings?city=Khulna&limit=10` | On load |
| **See all →** | `GET /listings?city=Khulna&limit=50` | On tap |
| **Property Card** | `GET /listings/{id}` | On tap |
| **Recommended List** | `GET /listings?furnishing=Furnished` | On load |
| **Post a listing** | Navigate to PostListingScreen | On tap |
| **Voice Search** | Speech recognition + API | On tap |
| **Map view** | Map screen + API | On tap |

---

## 🔄 Load Sequence

```
1. App Opens → Home Screen
   ↓
2. Show loading indicator
   ↓
3. Parallel API Calls:
   ├─> GET /listings?city=Khulna&limit=10 (Near You)
   └─> GET /listings?furnishing=Furnished&limit=5 (Recommended)
   ↓
4. Update UI with data
   ↓
5. User can interact
```

---

## ⚡ User Interactions

### Search Flow
```
User types "Sonadanga"
  ↓
Presses Enter
  ↓
API: GET /listings?area=Sonadanga&limit=20
  ↓
Navigate to SearchResultsScreen
```

### Filter Flow
```
User clicks "Family" chip
  ↓
API: GET /listings?category=Family&limit=20
  ↓
Navigate to SearchResultsScreen
```

### View Details Flow
```
User clicks property card
  ↓
API: GET /listings/123
  ↓
Navigate to ListingDetailScreen
```

---

## 🎯 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/listings` | Main listings endpoint with filters |
| `GET /api/listings/:id` | Single listing details |

**Query Parameters:**
- `city` - Filter by city
- `area` - Filter by area/location
- `category` - Filter by type (Family, Bachelor, etc.)
- `bedrooms` - Filter by bedroom count
- `furnishing` - Filter by furnishing status
- `limit` - Results per page
- `offset` - Pagination

---

## 📦 Models Required

```dart
class Listing {
  final int id;
  final String title;
  final String imageUrl;
  final double price;
  final int bedrooms;
  final int bathrooms;
  final String area;
  final String city;
  final String category;
  final int? squareFeet;
  final bool isDirectOwner;

  Listing({...});

  factory Listing.fromJson(Map<String, dynamic> json) {
    return Listing(
      id: json['id'],
      title: json['title'],
      imageUrl: json['image_url'],
      price: json['price'].toDouble(),
      bedrooms: json['bedrooms'],
      bathrooms: json['bathrooms'],
      area: json['area'] ?? json['location'],
      city: json['city'] ?? 'Khulna',
      category: json['category'],
      squareFeet: json['square_feet'],
      isDirectOwner: json['is_direct_owner'] ?? true,
    );
  }
}
```

---

## ✅ Implementation Steps

1. [ ] Create HomeScreen widget
2. [ ] Add header with greeting
3. [ ] Implement search bar
4. [ ] Add filter chips
5. [ ] Create post property banner
6. [ ] Build near you section with API
7. [ ] Build recommended section with API
8. [ ] Add property card widget
9. [ ] Implement navigation
10. [ ] Add pull to refresh
11. [ ] Handle loading states
12. [ ] Handle errors
13. [ ] Test all interactions

---

সব ready! এই guide দিয়ে Home Screen implement করতে পারবেন! 🏠✨
