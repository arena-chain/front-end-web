# Mobile Ticket Booking Implementation Guide

This guide outlines the steps to implement the full ticket booking flow in the mobile application (Flutter). It covers data models, API integration, state management, and UI implementation.

## 1. Data Models (Dart)

Create the necessary Dart models to match the backend schemas.

### Tournament & TicketType
```dart
enum TournamentFormat { SINGLE_ELIMINATION, DOUBLE_ELIMINATION, SWISS, ROUND_ROBIN }
enum TournamentStatus { DRAFT, OPEN_REGISTRATION, ONGOING, COMPLETED, CANCELLED }

class TicketType {
  final String name;
  final double price;
  final int capacity;

  TicketType({required this.name, required this.price, required this.capacity});

  factory TicketType.fromJson(Map<String, dynamic> json) {
    return TicketType(
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      capacity: json['capacity'],
    );
  }
}

class Tournament {
  final String id;
  final String name;
  final String description;
  final DateTime startDate;
  final DateTime endDate;
  final List<TicketType> ticketTypes;
  final String? bannerImageUrl;

  Tournament({
    required this.id,
    required this.name,
    required this.description,
    required this.startDate,
    required this.endDate,
    required this.ticketTypes,
    this.bannerImageUrl,
  });

  factory Tournament.fromJson(Map<String, dynamic> json) {
    return Tournament(
      id: json['_id'],
      name: json['name'],
      description: json['description'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      ticketTypes: (json['ticketTypes'] as List<dynamic>?)
              ?.map((e) => TicketType.fromJson(e))
              .toList() ??
          [],
      bannerImageUrl: json['bannerImageUrl'],
    );
  }
}
```

### Reservation & Ticket
```dart
class Reservation {
  final String id;
  final String tournamentId;
  final String userId;
  final List<String> ticketIds;
  final String status;
  final double totalPrice;
  final DateTime expiresAt;

  Reservation({
    required this.id,
    required this.tournamentId,
    required this.userId,
    required this.ticketIds,
    required this.status,
    required this.totalPrice,
    required this.expiresAt,
  });

  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['_id'],
      tournamentId: json['tournament'] is String ? json['tournament'] : json['tournament']['_id'],
      userId: json['user'] is String ? json['user'] : json['user']['_id'],
      ticketIds: List<String>.from(json['tickets'] is List ? json['tickets'] : []), // Adjust based on population
      status: json['status'],
      totalPrice: (json['totalPrice'] as num).toDouble(),
      expiresAt: DateTime.parse(json['expiresAt']),
    );
  }
}

class Ticket {
  final String id;
  final String ticketNumber;
  final String qrCode; // Base64 or data URL
  final String type;
  final String status;

  Ticket({
    required this.id,
    required this.ticketNumber,
    required this.qrCode,
    required this.type,
    required this.status,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['_id'],
      ticketNumber: json['ticketNumber'],
      qrCode: json['qrCode'],
      type: json['type'],
      status: json['status'],
    );
  }
}
```

## 2. API Service Integration

Implement the service methods to interact with the backend.

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class BookingService {
  final String baseUrl = 'YOUR_API_URL'; // e.g., http://localhost:3000

  Future<Map<String, String>> _getHeaders() async {
    // Retrieve token from secure storage
    String token = await _getToken(); 
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // 1. Create Reservation
  Future<Reservation> createReservation(String tournamentId, String ticketType, int quantity) async {
    final response = await http.post(
      Uri.parse('$baseUrl/reservations'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'tournament': tournamentId,
        'ticketType': ticketType,
        'quantity': quantity,
        // 'user': userId // User ID is usually extracted from token on backend, but check if required in body
        // If your backend requires user ID in body, extract it from token payload and send it.
      }),
    );

    if (response.statusCode == 201) {
      return Reservation.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create reservation: ${response.body}');
    }
  }

  // 2. Confirm Reservation (Mock Payment or Real)
  Future<Reservation> confirmReservation(String reservationId, String paymentId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/reservations/$reservationId/confirm'),
      headers: await _getHeaders(),
      body: jsonEncode({'paymentId': paymentId}),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return Reservation.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to confirm reservation: ${response.body}');
    }
  }

  // 3. Get My Tickets
  Future<List<Ticket>> getMyTickets() async {
    // If backend requires userId query param:
    // String userId = ...;
    // Uri.parse('$baseUrl/tickets/my-tickets?userId=$userId')
    
    final response = await http.get(
      Uri.parse('$baseUrl/tickets/my-tickets'), // Or with query param if needed
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((e) => Ticket.fromJson(e)).toList();
    } else {
      throw Exception('Failed to fetch tickets');
    }
  }
  
  Future<String> _getToken() async {
    // Implement token retrieval logic (e.g., flutter_secure_storage)
    return 'your_jwt_token';
  }
}
```

## 3. UI Implementation Flow

### A. Tournament Details & Ticket Selection
On the `TournamentDetailsScreen`, display the list of available `ticketTypes`.

```dart
// Widget for Ticket Type Selection
class TicketTypeSelector extends StatefulWidget {
  final List<TicketType> ticketTypes;
  final Function(String type, int quantity) onSelectionChanged;

  const TicketTypeSelector({Key? key, required this.ticketTypes, required this.onSelectionChanged}) : super(key: key);

  @override
  _TicketTypeSelectorState createState() => _TicketTypeSelectorState();
}

class _TicketTypeSelectorState extends State<TicketTypeSelector> {
  Map<String, int> quantities = {};

  @override
  Widget build(BuildContext context) {
    return Column(
      children: widget.ticketTypes.map((type) {
        int qty = quantities[type.name] ?? 0;
        return Card(
          child: ListTile(
            title: Text(type.name),
            subtitle: Text('\$${type.price.toStringAsFixed(2)}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: Icon(Icons.remove),
                  onPressed: qty > 0 ? () {
                    setState(() {
                      quantities[type.name] = qty - 1;
                      widget.onSelectionChanged(type.name, quantities[type.name]!);
                    });
                  } : null,
                ),
                Text('$qty'),
                IconButton(
                  icon: Icon(Icons.add),
                  onPressed: () {
                    setState(() {
                      quantities[type.name] = qty + 1;
                      widget.onSelectionChanged(type.name, quantities[type.name]!);
                    });
                  },
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
```

### B. Booking Logic
When the user clicks "Book Now":

1.  **Collect Selection**: Get the selected ticket type and quantity.
2.  **Call API**: `bookingService.createReservation(...)`.
3.  **Navigate**: Go to a `ConfirmationScreen` passing the returned `Reservation` object.

### C. Confirmation & Payment
On `ConfirmationScreen`:

1.  Display "Total Price" and reservation details.
2.  **Payment**: Integrate generic payment button (e.g., "Pay Now").
    -   On success, generate a mock `paymentId` (or real one from Stripe/PayPal SDK).
3.  **Confirm**: Call `bookingService.confirmReservation(reservationId, paymentId)`.
4.  **Success**: On success, navigate to `BookingSuccessScreen` or `MyTicketsScreen`.

### D. Displaying Tickets (QR Code)
Use `qr_flutter` package to render the QR code.

```dart
import 'package:qr_flutter/qr_flutter.dart';

class TicketWidget extends StatelessWidget {
  final Ticket ticket;

  const TicketWidget({Key? key, required this.ticket}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(ticket.type, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          SizedBox(height: 10),
          QrImageView(
            data: ticket.qrCode, // Assuming qrCode is the data string
            version: QrVersions.auto,
            size: 200.0,
          ),
          SizedBox(height: 10),
          Text('Ticket #: ${ticket.ticketNumber}'),
          Text('Status: ${ticket.status}'),
        ],
      ),
    );
  }
}
```

## 4. Summary of Workflow

1.  **User** browses tournament -> Views Ticket Types.
2.  **User** selects "VIP" x 2.
3.  **App** calls `POST /reservations`. Backend reserves spots, returns `Reservation` with `expiresAt`.
4.  **App** shows "Pay $XXX within 15 mins".
5.  **User** pays.
6.  **App** calls `POST /reservations/:id/confirm`.
7.  **Backend** generates `Tickets`, updates Reservation status.
8.  **App** redirects to "My Tickets", retrieves tickets -> Shows QR Codes.
