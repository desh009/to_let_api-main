# 🏠 Home Screen API - Simple Guide

## API Endpoint

```
GET /api/listings/home
```

এই endpoint শুধুমাত্র **user দের post করা listings** return করবে। Latest listings সবার আগে দেখাবে।

---

## Request

### URL
```
GET http://localhost:3000/api/listings/home?limit=20&offset=0
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | কতগুলো listing দেখাবে (max 50) |
| `offset` | number | 0 | Pagination এর জন্য |

### Examples

**1. First page load (প্রথম 20টা listings)**
```
GET /api/listings/home
```

**2. Load more (next 20 listings)**
```
GET /api/listings/home?offset=20&limit=20
```

**3. Load 10 at a time**
```
GET /api/listings/home?limit=10
```

---

## Response

### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "uuid-123",
      "title": "3 Bed Apartment in Dhanmondi",
      "location": "Road 5, Dhanmondi",
      "city": "Dhaka",
      "area": "Dhanmondi",
      "price": 25000,
      "bedrooms": 3,
      "bathrooms": 2,
      "description": "Spacious apartment with modern facilities",
      "contact_number": "+8801712345678",
      "images": [
        "https://storage.url/image1.jpg",
        "https://storage.url/image2.jpg"
      ],
      "image_url": "https://storage.url/image1.jpg",
      "category": "Family",
      "furnishing": "Furnished",
      "availability": "Available now",
      "available_from": null,
      "square_feet": 1500,
      "amenities": {
        "parking": true,
        "wifi": true,
        "gasLine": true,
        "lift": true,
        "generator": false,
        "water24_7": true
      },
      "is_direct_owner": true,
      "owner_id": "owner-uuid",
      "owner_name": "John Doe",
      "owner_email": "john@example.com",
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-10T08:00:00Z"
    },
    {
      "id": "uuid-456",
      "title": "Bachelor Seat in Mirpur",
      "location": "Mirpur-10",
      "city": "Dhaka",
      "area": "Mirpur",
      "price": 8000,
      "bedrooms": 1,
      "bathrooms": 1,
      "description": "Single room for bachelor",
      "contact_number": "+8801812345678",
      "images": ["https://storage.url/image3.jpg"],
      "image_url": "https://storage.url/image3.jpg",
      "category": "Bachelor",
      "furnishing": "Semi",
      "availability": "Available now",
      "available_from": null,
      "square_feet": 400,
      "amenities": {
        "parking": false,
        "wifi": true,
        "gasLine": true,
        "lift": false,
        "generator": true,
        "water24_7": true
      },
      "is_direct_owner": false,
      "owner_id": "owner-uuid-2",
      "owner_name": "Jane Smith",
      "owner_email": "jane@example.com",
      "created_at": "2024-01-09T10:00:00Z",
      "updated_at": "2024-01-09T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "offset": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

---

## 💻 Flutter Implementation

### 1. Model Class
```dart
// lib/models/listing.dart

class Listing {
  final String id;
  final String title;
  final String location;
  final String city;
  final String? area;
  final int price;
  final int bedrooms;
  final int bathrooms;
  final String description;
  final String contactNumber;
  final List<String> images;
  final String imageUrl;
  final String category;
  final String furnishing;
  final String availability;
  final int? squareFeet;
  final Map<String, dynamic> amenities;
  final bool isDirectOwner;
  final String ownerId;
  final String? ownerName;
  final String? ownerEmail;
  final DateTime createdAt;

  Listing({
    required this.id,
    required this.title,
    required this.location,
    required this.city,
    this.area,
    required this.price,
    required this.bedrooms,
    required this.bathrooms,
    required this.description,
    required this.contactNumber,
    required this.images,
    required this.imageUrl,
    required this.category,
    required this.furnishing,
    required this.availability,
    this.squareFeet,
    required this.amenities,
    required this.isDirectOwner,
    required this.ownerId,
    this.ownerName,
    this.ownerEmail,
    required this.createdAt,
  });

  factory Listing.fromJson(Map<String, dynamic> json) {
    return Listing(
      id: json['id'],
      title: json['title'],
      location: json['location'],
      city: json['city'],
      area: json['area'],
      price: json['price'],
      bedrooms: json['bedrooms'],
      bathrooms: json['bathrooms'],
      description: json['description'] ?? '',
      contactNumber: json['contact_number'],
      images: List<String>.from(json['images'] ?? []),
      imageUrl: json['image_url'],
      category: json['category'],
      furnishing: json['furnishing'],
      availability: json['availability'],
      squareFeet: json['square_feet'],
      amenities: Map<String, dynamic>.from(json['amenities'] ?? {}),
      isDirectOwner: json['is_direct_owner'] ?? true,
      ownerId: json['owner_id'],
      ownerName: json['owner_name'],
      ownerEmail: json['owner_email'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
```

---

### 2. API Service
```dart
// lib/services/listings_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;

class ListingsService {
  static const String baseUrl = 'http://localhost:3000/api/listings';

  // Get home listings
  Future<Map<String, dynamic>> getHomeListings({
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/home?limit=$limit&offset=$offset'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        final listings = (data['data'] as List)
            .map((json) => Listing.fromJson(json))
            .toList();

        return {
          'listings': listings,
          'pagination': data['pagination'],
        };
      } else {
        throw Exception('Failed to load listings');
      }
    } catch (e) {
      print('Error loading listings: $e');
      rethrow;
    }
  }
}
```

---

### 3. Home Screen Implementation
```dart
// lib/screens/home/home_screen.dart

import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ListingsService _listingsService = ListingsService();
  final ScrollController _scrollController = ScrollController();
  
  List<Listing> _listings = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _offset = 0;
  final int _limit = 20;

  @override
  void initState() {
    super.initState();
    _loadListings();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  // Load listings
  Future<void> _loadListings() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _listingsService.getHomeListings(
        limit: _limit,
        offset: _offset,
      );

      final newListings = result['listings'] as List<Listing>;
      final pagination = result['pagination'];

      setState(() {
        _listings.addAll(newListings);
        _offset += _limit;
        _hasMore = pagination['hasMore'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load listings: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Refresh listings
  Future<void> _refreshListings() async {
    setState(() {
      _listings = [];
      _offset = 0;
      _hasMore = true;
    });
    await _loadListings();
  }

  // Detect scroll to bottom
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      _loadListings();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('To-Let Bangladesh'),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: () {
              // Navigate to filter screen
              Navigator.pushNamed(context, '/filter');
            },
          ),
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () {
              // Navigate to search screen
              Navigator.pushNamed(context, '/search');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshListings,
        child: _listings.isEmpty && _isLoading
            ? Center(child: CircularProgressIndicator())
            : _listings.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.home_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No listings found'),
                        SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _refreshListings,
                          child: Text('Refresh'),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: EdgeInsets.all(16),
                    itemCount: _listings.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= _listings.length) {
                        return Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }

                      final listing = _listings[index];
                      return _buildListingCard(listing);
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to post listing screen
          Navigator.pushNamed(context, '/post-listing');
        },
        child: Icon(Icons.add),
      ),
    );
  }

  Widget _buildListingCard(Listing listing) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          // Navigate to listing detail
          Navigator.pushNamed(
            context,
            '/listing-detail',
            arguments: listing.id,
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            if (listing.images.isNotEmpty)
              Image.network(
                listing.imageUrl,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 200,
                    color: Colors.grey[300],
                    child: Icon(Icons.broken_image, size: 64),
                  );
                },
              ),

            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    listing.title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: Colors.grey),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${listing.area ?? ''}, ${listing.city}',
                          style: TextStyle(color: Colors.grey[600]),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Price and Category
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '৳${listing.price}/month',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.green[700],
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          listing.category,
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),

                  // Bedrooms, Bathrooms, Size
                  Row(
                    children: [
                      _buildInfoChip(
                        Icons.bed,
                        '${listing.bedrooms} Bed',
                      ),
                      SizedBox(width: 8),
                      _buildInfoChip(
                        Icons.bathroom,
                        '${listing.bathrooms} Bath',
                      ),
                      if (listing.squareFeet != null) ...[
                        SizedBox(width: 8),
                        _buildInfoChip(
                          Icons.square_foot,
                          '${listing.squareFeet} sqft',
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
```

---

## 🔄 How It Works

```
App Launch
    ↓
Home Screen loads
    ↓
API Call: GET /api/listings/home
    ↓
Show first 20 listings (latest first)
    ↓
User scrolls down
    ↓
Load more: GET /api/listings/home?offset=20
    ↓
Append next 20 listings
    ↓
Continue until hasMore = false
```

---

## ✨ Features

✅ **সব user posts** - শুধু user দের post করা listings
✅ **Latest first** - নতুন listing সবার আগে
✅ **Infinite scroll** - Scroll করলে automatically load হবে
✅ **Pull to refresh** - নিচে টেনে refresh করা যাবে
✅ **Pagination** - Memory efficient loading
✅ **Empty state** - কোনো listing না থাকলে message দেখাবে

---

এই API দিয়ে home screen এ সব user post listings দেখাবে! 🏠✨
