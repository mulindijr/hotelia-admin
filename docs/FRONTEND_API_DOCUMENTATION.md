# Hotelia PMS — Frontend API Documentation & Integration Guide

> **Target Stack**: React (18+) + Tailwind CSS + Axios + React Query / Custom Hooks  
> **Backend Baseline**: Hotelia Laravel API v1 (Sanctum Authentication, Spatie QueryBuilder, Spatie Permissions)  
> **Base URL**: `http://localhost:8000/api/v1` (Or configured environment `VITE_API_BASE_URL/api/v1`)  
> **Document Purpose**: Single authoritative reference guide for building the Hotelia frontend application without needing to inspect backend source code.

---

## Table of Contents
1. [API Overview](#1-api-overview)
2. [Complete Endpoint Catalogue](#2-complete-endpoint-catalogue)
3. [Authentication & User Management](#3-authentication--user-management)
4. [Dashboard & Operational Analytics](#4-dashboard--operational-analytics)
5. [Hotels & Properties Management](#5-hotels--properties-management)
6. [Rooms & Room Types Management](#6-rooms--room-types-management)
7. [Reservations & Bookings Workflow](#7-reservations--bookings-workflow)
8. [Guests & Customer Management](#8-guests--customer-management)
9. [Payments, Billing & Invoicing](#9-payments-billing--invoicing)
10. [Staff, Users, Roles & Permissions](#10-staff-users-roles--permissions)
11. [Reports & Financial Analytics](#11-reports--financial-analytics)
12. [Search, Filters & Pagination Conventions](#12-search-filters--pagination-conventions)
13. [File & Image Uploads / Media Streams](#13-file--image-uploads--media-streams)
14. [API Response Structures & Envelopes](#14-api-response-structures--envelopes)
15. [React Integration Architecture & Examples](#15-react-integration-architecture--examples)
16. [Frontend Page → Endpoint Mapping](#16-frontend-page--endpoint-mapping)
17. [Frontend Implementation Workflow](#17-frontend-implementation-workflow)
18. [API Considerations, Gotchas & Quirks](#18-api-considerations-gotchas--quirks)

---

## 1. API Overview

### Base URL & Versioning
- **Base Endpoint**: `http://localhost:8000/api/v1`
- **Versioning Strategy**: URI Prefixing (`/api/v1/...`). All operational endpoints are under `v1`.

### Authentication Mechanism
- **Mechanism**: Laravel Sanctum Personal Access Tokens (Bearer Token).
- **Header**: `Authorization: Bearer <plainTextToken>`
- **Token Acquisition**: Obtained upon successful login at `POST /api/v1/auth/login`.

### Required Request Headers
For standard JSON API requests:
```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <your_access_token>
```
For file upload requests (e.g., Hotel Logo):
```http
Accept: application/json
Content-Type: multipart/form-data
Authorization: Bearer <your_access_token>
```

### Token Lifecycle & Expiration Behavior
1. **Storage**: The token returned from `/auth/login` must be stored securely on the client side (`localStorage` or `sessionStorage` alongside app state).
2. **State Hydration**: On application load, execute `GET /api/v1/auth/me` or `GET /api/v1/auth/status` to verify token validity and hydrate user profile and permission strings.
3. **Token Refresh**: Active sessions can request a refreshed token via `POST /api/v1/auth/refresh-token` (rate limited to 10 attempts/min per user). The old token is invalidated immediately.
4. **Account Lockout**: After 3 consecutive failed login attempts, the account is temporarily locked for 15 minutes. The API returns HTTP status `423 Locked` with `seconds_remaining`.
5. **Password Changes & Resets**: Changing password via `/auth/change-password` or resetting via `/auth/reset-password` revokes active tokens across devices.

### Standard HTTP Status Codes
| HTTP Code | Description | Meaning for React App |
| :--- | :--- | :--- |
| **200 OK** | Success | Request succeeded; process `data` payload. |
| **201 Created** | Resource Created | Record successfully created (e.g. new booking, room). |
| **204 No Content** | Deleted / Success | Deletion succeeded; update local state. |
| **400 Bad Request** | Invalid Action | Business logic error (e.g. invalid reset link). |
| **401 Unauthenticated** | Missing / Invalid Token | Token expired or invalid; clear state and redirect to `/login`. |
| **403 Forbidden** | Permission Denied | User lacks required Spatie permission string; show access denied banner. |
| **404 Not Found** | Resource Missing | Entity ID does not exist; display 404 page or alert. |
| **422 Unprocessable Content** | Validation Failed | Request payload failed rules; render inline form error messages. |
| **423 Locked** | Account Locked | Too many failed logins; show lockout timer. |
| **429 Too Many Requests** | Rate Limit Exceeded | Throttled; notify user to wait. |
| **500 Internal Error** | Server Error | Backend crash; display generic fallback boundary. |

---

## 2. Complete Endpoint Catalogue

The Hotelia API contains **105 registered routes**. Below is the detailed breakdown for every frontend-relevant endpoint grouped logically.

### 1. Authentication & Security
- `POST /api/v1/auth/login` (Public, Throttle: 5/min)
- `POST /api/v1/auth/forgot-password` (Public, Throttle: 5/min)
- `POST /api/v1/auth/reset-password` (Public, Throttle: 5/min)
- `GET /api/v1/auth/me` (Auth: Sanctum)
- `GET /api/v1/auth/status` (Auth: Sanctum)
- `POST /api/v1/auth/logout` (Auth: Sanctum)
- `POST /api/v1/auth/logout-all` (Auth: Sanctum)
- `POST /api/v1/auth/refresh-token` (Auth: Sanctum, Throttle: 10/min)
- `POST /api/v1/auth/change-password` (Auth: Sanctum, Throttle: 10/min)
- `GET /api/v1/login-history` (Auth: Sanctum)
- `GET /api/v1/failed-logins` (Permission: `view activity logs`)

### 2. Hotels & Property Settings
- `GET /api/v1/hotels` (Permission: `view hotels`)
- `POST /api/v1/hotels` (Permission: `create hotels`)
- `GET /api/v1/hotels/{hotel}` (Permission: `view hotels`)
- `PUT /api/v1/hotels/{hotel}` (Permission: `update hotels`)
- `DELETE /api/v1/hotels/{hotel}` (Permission: `delete hotels`)
- `GET /api/v1/hotels/{hotel}/settings` (Permission: `view hotels`)
- `PUT /api/v1/hotels/{hotel}/settings` (Permission: `update hotels`)

### 3. Room Management & Amenities
- `GET /api/v1/amenities` (Permission: `view amenities`)
- `POST /api/v1/amenities` (Permission: `create amenities`)
- `PUT /api/v1/amenities/{amenity}` (Permission: `update amenities`)
- `DELETE /api/v1/amenities/{amenity}` (Permission: `delete amenities`)
- `GET /api/v1/hotels/{hotel}/room-types` (Permission: `view room types`)
- `POST /api/v1/hotels/{hotel}/room-types` (Permission: `create room types`)
- `GET /api/v1/hotels/{hotel}/room-types/{roomType}` (Permission: `view room types`)
- `PUT /api/v1/hotels/{hotel}/room-types/{roomType}` (Permission: `update room types`)
- `DELETE /api/v1/hotels/{hotel}/room-types/{roomType}` (Permission: `delete room types`)
- `GET /api/v1/hotels/{hotel}/rooms` (Permission: `view rooms`)
- `POST /api/v1/hotels/{hotel}/rooms` (Permission: `create rooms`)
- `GET /api/v1/hotels/{hotel}/rooms/{room}` (Permission: `view rooms`)
- `PUT /api/v1/hotels/{hotel}/rooms/{room}` (Permission: `update rooms`)
- `DELETE /api/v1/hotels/{hotel}/rooms/{room}` (Permission: `delete rooms`)
- `GET /api/v1/hotels/{hotel}/availability` (Auth: Sanctum)

### 4. Reservations & Bookings
- `GET /api/v1/hotels/{hotel}/bookings` (Permission: `view bookings`)
- `POST /api/v1/hotels/{hotel}/bookings` (Permission: `create bookings`)
- `GET /api/v1/hotels/{hotel}/bookings/{booking}` (Permission: `view bookings`)
- `PUT /api/v1/hotels/{hotel}/bookings/{booking}` (Permission: `update bookings`)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/cancel` (Permission: `cancel bookings`)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/check-in` (Permission: `check in guests`)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/check-out` (Permission: `check out guests`)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/no-show` (Permission: `cancel bookings`)

### 5. Billing, Invoices & Payments
- `GET /api/v1/hotels/{hotel}/bookings/{booking}/invoice` (Auth: Sanctum)
- `GET /api/v1/hotels/{hotel}/bookings/{booking}/invoice/pdf` (Auth: Sanctum)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/invoice/regenerate` (Auth: Sanctum)
- `GET /api/v1/hotels/{hotel}/bookings/{booking}/payments` (Auth: Sanctum)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/payments` (Auth: Sanctum)
- `GET /api/v1/hotels/{hotel}/bookings/{booking}/payments/{payment}/receipt/pdf` (Auth: Sanctum)
- `POST /api/v1/hotels/{hotel}/bookings/{booking}/payments/{payment}/status` (Auth: Sanctum)

### 6. Guests / Customers
- `GET /api/v1/guests` (Permission: `view guests`)
- `POST /api/v1/guests` (Permission: `create guests`)
- `GET /api/v1/guests/{guest}` (Permission: `view guests`)
- `PUT /api/v1/guests/{guest}` (Permission: `update guests`)
- `DELETE /api/v1/guests/{guest}` (Permission: `delete guests`)
- `GET /api/v1/guests/{guest}/bookings` (Permission: `view bookings`)

### 7. Housekeeping Operations
- `GET /api/v1/hotels/{hotel}/housekeeping` (Permission: `view housekeeping`)
- `POST /api/v1/hotels/{hotel}/housekeeping` (Permission: `manage housekeeping`)
- `GET /api/v1/hotels/{hotel}/housekeeping/{task}` (Permission: `view housekeeping`)
- `PUT /api/v1/hotels/{hotel}/housekeeping/{task}` (Permission: `manage housekeeping`)
- `DELETE /api/v1/hotels/{hotel}/housekeeping/{task}` (Permission: `manage housekeeping`)

### 8. Maintenance Requests
- `GET /api/v1/hotels/{hotel}/maintenance` (Permission: `view maintenance`)
- `POST /api/v1/hotels/{hotel}/maintenance` (Permission: `manage maintenance`)
- `GET /api/v1/hotels/{hotel}/maintenance/{maintenanceRequest}` (Permission: `view maintenance`)
- `PUT /api/v1/hotels/{hotel}/maintenance/{maintenanceRequest}` (Permission: `manage maintenance`)
- `DELETE /api/v1/hotels/{hotel}/maintenance/{maintenanceRequest}` (Permission: `manage maintenance`)

### 9. Rate Plans & Dynamic Pricing Rules
- `GET /api/v1/hotels/{hotel}/rate-plans` (Auth: Sanctum)
- `POST /api/v1/hotels/{hotel}/rate-plans` (Auth: Sanctum)
- `GET /api/v1/hotels/{hotel}/rate-plans/{rate_plan}` (Auth: Sanctum)
- `PUT /api/v1/hotels/{hotel}/rate-plans/{rate_plan}` (Auth: Sanctum)
- `DELETE /api/v1/hotels/{hotel}/rate-plans/{rate_plan}` (Auth: Sanctum)
- `GET /api/v1/hotels/{hotel}/pricing-rules` (Auth: Sanctum)
- `POST /api/v1/hotels/{hotel}/pricing-rules` (Auth: Sanctum)
- `GET /api/v1/hotels/{hotel}/pricing-rules/{pricing_rule}` (Auth: Sanctum)
- `PUT /api/v1/hotels/{hotel}/pricing-rules/{pricing_rule}` (Auth: Sanctum)
- `DELETE /api/v1/hotels/{hotel}/pricing-rules/{pricing_rule}` (Auth: Sanctum)

### 10. Services & Extra Amenities
- `GET /api/v1/hotels/{hotel}/services` (Permission: `view services`)
- `POST /api/v1/hotels/{hotel}/services` (Permission: `create services`)
- `GET /api/v1/hotels/{hotel}/services/{service}` (Permission: `view services`)
- `PUT /api/v1/hotels/{hotel}/services/{service}` (Permission: `update services`)
- `DELETE /api/v1/hotels/{hotel}/services/{service}` (Permission: `delete services`)

### 11. Reports & Operational Dashboard
- `GET /api/v1/hotels/{hotel}/reports/dashboard` (Permission: `view reports`)
- `GET /api/v1/hotels/{hotel}/reports/revenue` (Permission: `view reports`)

### 12. Staff, User Management & Security Admin
- `GET /api/v1/hotels/{hotel}/users` (Permission: `view users`)
- `POST /api/v1/hotels/{hotel}/users` (Permission: `create users`)
- `GET /api/v1/hotels/{hotel}/users/{user}` (Permission: `view users`)
- `PUT /api/v1/hotels/{hotel}/users/{user}` (Permission: `update users`)
- `DELETE /api/v1/hotels/{hotel}/users/{user}` (Permission: `delete users`)
- `POST /api/v1/admin/users/{user}/unlock` (Permission: `update users`)
- `GET /api/v1/admin/audit-logs` (Permission: `view activity logs`)

### 13. System Notifications
- `GET /api/v1/notifications` (Auth: Sanctum)
- `POST /api/v1/notifications/{id}/read` (Auth: Sanctum)
- `POST /api/v1/notifications/read-all` (Auth: Sanctum)

---

## 3. Authentication & User Management

### Endpoints Detail

#### 1. Login
- **Method**: `POST`
- **URL**: `/api/v1/auth/login`
- **Auth**: Public (`throttle:auth-login`, 5 attempts/min per IP)
- **Purpose**: Authenticate user credentials and return Sanctum Bearer token with user permissions.
- **Request Body**:
  ```json
  {
    "email": "admin@hotelia.app",
    "password": "Password123!"
  }
  ```
- **Validation Rules**:
  - `email`: `required | string | email`
  - `password`: `required | string`
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Login successful",
    "token": "1|laravel_sanctum_token_string...",
    "user": {
      "id": 1,
      "first_name": "Admin",
      "last_name": "User",
      "full_name": "Admin User",
      "email": "admin@hotelia.app",
      "phone": "+254700000000",
      "is_active": true,
      "roles": [
        {
          "id": 1,
          "name": "super_admin",
          "guard_name": "web"
        }
      ]
    },
    "permissions": [
      "view hotels", "create hotels", "update hotels", "delete hotels",
      "view rooms", "create rooms", "update rooms", "delete rooms",
      "view bookings", "create bookings", "update bookings", "cancel bookings",
      "check in guests", "check out guests", "view guests", "create guests",
      "update guests", "delete guests", "view housekeeping", "manage housekeeping",
      "view maintenance", "manage maintenance", "view services", "create services",
      "update services", "delete services", "view reports", "view users",
      "create users", "update users", "delete users", "view activity logs"
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"message": "Invalid credentials"}`
  - `423 Locked`: `{"message": "Account is temporarily locked.", "locked_until": "2026-09-22T09:00:00Z", "seconds_remaining": 842}`
  - `403 Forbidden`: `{"message": "Your account is inactive. Please contact support."}`

#### 2. Get Current User Profile
- **Method**: `GET`
- **URL**: `/api/v1/auth/me`
- **Auth**: Required (`auth:sanctum`)
- **Purpose**: Fetch authenticated user record with eager-loaded `roles` and `permissions`.
- **Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": 1,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@hotelia.app",
      "roles": [...],
      "permissions": [...]
    }
  }
  ```

#### 3. Auth Status Check
- **Method**: `GET`
- **URL**: `/api/v1/auth/status`
- **Auth**: Required (`auth:sanctum`)
- **Purpose**: Quick check for active session token validity.
- **Response (`200 OK`)**:
  ```json
  {
    "authenticated": true,
    "user_id": 1,
    "roles": ["super_admin"]
  }
  ```

#### 4. Refresh Token
- **Method**: `POST`
- **URL**: `/api/v1/auth/refresh-token`
- **Auth**: Required (`auth:sanctum`, `throttle:auth-sensitive`, 10 attempts/min)
- **Purpose**: Revoke current token and generate a fresh Sanctum token.
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Token refreshed successfully",
    "token": "2|new_sanctum_token_string..."
  }
  ```

#### 5. Logout
- **Method**: `POST`
- **URL**: `/api/v1/auth/logout`
- **Auth**: Required (`auth:sanctum`)
- **Purpose**: Revoke current access token and mark login history logout time.
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

#### 6. Logout All Devices
- **Method**: `POST`
- **URL**: `/api/v1/auth/logout-all`
- **Auth**: Required (`auth:sanctum`)
- **Purpose**: Revoke all tokens issued for the authenticated user across all browsers/devices.
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Logged out from all devices"
  }
  ```

#### 7. Change Password
- **Method**: `POST`
- **URL**: `/api/v1/auth/change-password`
- **Auth**: Required (`auth:sanctum`, `throttle:auth-sensitive`)
- **Purpose**: Change current user password subject to history policy (cannot reuse last 5 passwords).
- **Request Body**:
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewPassword123!",
    "new_password_confirmation": "NewPassword123!"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

#### 8. Forgot Password
- **Method**: `POST`
- **URL**: `/api/v1/auth/forgot-password`
- **Auth**: Public (`throttle:auth-login`)
- **Request Body**:
  ```json
  {
    "email": "admin@hotelia.app"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "We have emailed your password reset link."
  }
  ```

#### 9. Reset Password
- **Method**: `POST`
- **URL**: `/api/v1/auth/reset-password`
- **Auth**: Public (`throttle:auth-login`)
- **Request Body**:
  ```json
  {
    "token": "reset-token-from-email",
    "email": "admin@hotelia.app",
    "password": "NewPassword123!",
    "password_confirmation": "NewPassword123!"
  }
  ```

#### 10. Login History
- **Method**: `GET`
- **URL**: `/api/v1/login-history`
- **Auth**: Required (`auth:sanctum`)
- **Purpose**: Retrieve history of recent successful logins for current user.

#### 11. Failed Logins Audit
- **Method**: `GET`
- **URL**: `/api/v1/failed-logins`
- **Auth**: Required (`permission:view activity logs`)
- **Purpose**: Security dashboard feed listing recent failed login attempts.

---

## 4. Dashboard & Operational Analytics

### Overview
Dashboard statistics are hotel-scoped and calculated via `ReportController`. Responses are cached for 5 minutes (`hotel:{id}:dashboard_stats`) on the backend for optimal performance.

### 1. Operational Dashboard Statistics
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/reports/dashboard`
- **Auth**: Required (`permission:view reports`)
- **Path Parameters**: `hotel` (Integer) - Hotel ID
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Dashboard Statistics Retrieved Successfully.",
    "data": {
      "total_rooms": 50,
      "occupied_rooms": 32,
      "occupancy_rate": 64.0,
      "room_statuses": {
        "available": 12,
        "occupied": 32,
        "cleaning": 4,
        "maintenance": 2
      },
      "housekeeping_tasks": {
        "pending": 5,
        "in_progress": 3,
        "completed": 15
      },
      "active_maintenance_requests": 2,
      "active_bookings_count": 32
    }
  }
  ```

### 2. Revenue & Financial Analytics KPIs
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/reports/revenue`
- **Auth**: Required (`permission:view reports`)
- **Query Parameters**:
  - `start_date` (Optional, `YYYY-MM-DD`, default: 30 days ago)
  - `end_date` (Optional, `YYYY-MM-DD`, default: today)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Revenue Statistics Retrieved Successfully.",
    "data": {
      "period": {
        "start_date": "2026-08-01",
        "end_date": "2026-08-31",
        "days": 30
      },
      "payments_collected": 45200.0,
      "total_invoiced": 48500.0,
      "room_revenue": 42000.0,
      "nights_sold": 280,
      "adr": 150.0,
      "revpar": 96.0,
      "payment_methods": {
        "cash": 5200.0,
        "card": 24000.0,
        "mpesa": 14000.0,
        "bank_transfer": 2000.0
      }
    }
  }
  ```

---

## 5. Hotels & Properties Management

### Endpoints Detail

#### 1. List Hotels
- **Method**: `GET`
- **URL**: `/api/v1/hotels`
- **Auth**: Required (`permission:view hotels`)
- **Query Params**: `page`, `per_page`, `filter[name]`, `sort`
- **Response (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Hotelia Grand Resort",
        "slug": "hotelia-grand-resort",
        "email": "info@hoteliagrand.com",
        "phone": "+254711223344",
        "country": "Kenya",
        "city": "Nairobi",
        "address": "123 Mara Road",
        "description": "Luxury 5-star resort in Nairobi",
        "logo": "http://localhost:8000/storage/hotels/logos/default.png",
        "is_active": true,
        "created_at": "2026-01-01T00:00:00.000000Z",
        "updated_at": "2026-01-01T00:00:00.000000Z"
      }
    ],
    "links": { "first": "...", "last": "...", "prev": null, "next": null },
    "meta": { "current_page": 1, "from": 1, "last_page": 1, "per_page": 15, "total": 1 }
  }
  ```

#### 2. Create Hotel
- **Method**: `POST`
- **URL**: `/api/v1/hotels`
- **Auth**: Required (`permission:create hotels`)
- **Content-Type**: `multipart/form-data` or `application/json`
- **Request Fields**:
  - `name` (Required, string)
  - `email` (Required, string, email, unique)
  - `phone` (Required, string)
  - `country` (Required, string)
  - `city` (Required, string)
  - `address` (Required, string)
  - `description` (Optional, string)
  - `logo` (Optional, image file: jpeg, png, jpg, max 2048KB)

#### 3. View Hotel Details
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}`
- **Auth**: Required (`permission:view hotels`)

#### 4. Update Hotel
- **Method**: `PUT` or `PATCH`
- **URL**: `/api/v1/hotels/{hotel}`
- **Auth**: Required (`permission:update hotels`)

#### 5. Delete Hotel
- **Method**: `DELETE`
- **URL**: `/api/v1/hotels/{hotel}`
- **Auth**: Required (`permission:delete hotels`)

#### 6. View Hotel Settings
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/settings`
- **Auth**: Required (`permission:view hotels`)

#### 7. Update Hotel Settings
- **Method**: `PUT` or `PATCH`
- **URL**: `/api/v1/hotels/{hotel}/settings`
- **Auth**: Required (`permission:update hotels`)
- **Request Body**:
  ```json
  {
    "currency": "USD",
    "check_in_time": "14:00",
    "check_out_time": "11:00",
    "tax_rate": 16.0,
    "cancellation_grace_period_hours": 24
  }
  ```

---

## 6. Rooms & Room Types Management

### 1. Global Amenities
- **Endpoints**:
  - `GET /api/v1/amenities` (`permission:view amenities`)
  - `POST /api/v1/amenities` (`permission:create amenities`)
  - `PUT /api/v1/amenities/{amenity}` (`permission:update amenities`)
  - `DELETE /api/v1/amenities/{amenity}` (`permission:delete amenities`)
- **Amenity Schema**:
  ```json
  {
    "id": 1,
    "name": "High-Speed Wi-Fi",
    "description": "Complimentary 100Mbps fiber internet"
  }
  ```

### 2. Room Types (Category)
- **Endpoints**:
  - `GET /api/v1/hotels/{hotel}/room-types` (`permission:view room types`)
  - `POST /api/v1/hotels/{hotel}/room-types` (`permission:create room types`)
  - `GET /api/v1/hotels/{hotel}/room-types/{roomType}` (`permission:view room types`)
  - `PUT /api/v1/hotels/{hotel}/room-types/{roomType}` (`permission:update room types`)
  - `DELETE /api/v1/hotels/{hotel}/room-types/{roomType}` (`permission:delete room types`)
- **Store/Update Request Payload**:
  ```json
  {
    "name": "Deluxe Ocean View",
    "description": "Spacious room with king bed and balcony",
    "capacity": 2,
    "beds": 1,
    "base_price": 180.00,
    "amenity_ids": [1, 2, 4]
  }
  ```

### 3. Individual Rooms
- **Endpoints**:
  - `GET /api/v1/hotels/{hotel}/rooms` (`permission:view rooms`)
  - `POST /api/v1/hotels/{hotel}/rooms` (`permission:create rooms`)
  - `GET /api/v1/hotels/{hotel}/rooms/{room}` (`permission:view rooms`)
  - `PUT /api/v1/hotels/{hotel}/rooms/{room}` (`permission:update rooms`)
  - `DELETE /api/v1/hotels/{hotel}/rooms/{room}` (`permission:delete rooms`)
- **Room Model Fields**:
  - `room_number`: string (e.g. "101")
  - `room_type_id`: integer
  - `floor`: integer (optional)
  - `status`: enum (`available`, `occupied`, `cleaning`, `maintenance`)

### 4. Room Availability Matrix
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/availability`
- **Query Params**: `start_date` (`YYYY-MM-DD`), `end_date` (`YYYY-MM-DD`), `room_type_id` (optional)
- **Purpose**: Generates date grid showing occupied/available rooms for tape chart calendars.

---

## 7. Reservations & Bookings Workflow

### Complete Booking Lifecycle
```
[Create Reservation] ──> [Pending / Confirmed]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               [Check-In]          [Cancel / No-Show]
                    │                   │
                    ▼                   ▼
              [Occupied Room]      [Rooms Released]
                    │
                    ▼
               [Check-Out] ──> [Auto-Creates Housekeeping Task & Room Set to Cleaning]
```

### Endpoints Detail

#### 1. List Bookings
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/bookings`
- **Auth**: Required (`permission:view bookings`)
- **Query Filters**: `filter[status]`, `filter[guest_id]`, `filter[check_in_date]`, `filter[check_out_date]`, `per_page`

#### 2. Create Booking
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings`
- **Auth**: Required (`permission:create bookings`)
- **Request Body**:
  ```json
  {
    "guest_id": 1,
    "check_in_date": "2026-10-01",
    "check_out_date": "2026-10-05",
    "adults": 2,
    "children": 0,
    "room_ids": [1, 2],
    "service_ids": [1],
    "notes": "Late check-in requested"
  }
  ```
- **Validation Notes**: Validates room availability to prevent double-booking overlaps.

#### 3. View Booking Details
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}`
- **Auth**: Required (`permission:view bookings`)
- **Includes**: `guest`, `rooms.roomType`, `services`

#### 4. Update Booking
- **Method**: `PUT` or `PATCH`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}`
- **Auth**: Required (`permission:update bookings`)

#### 5. Check-In Guest
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/check-in`
- **Auth**: Required (`permission:check in guests`)
- **Side Effect**: Updates booking status to `checked_in` and room status to `occupied`.

#### 6. Check-Out Guest
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/check-out`
- **Auth**: Required (`permission:check out guests`)
- **Side Effect**: Updates booking status to `checked_out`, sets room status to `cleaning`, and automatically creates a pending `HousekeepingTask`.

#### 7. Cancel Booking
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/cancel`
- **Auth**: Required (`permission:cancel bookings`)
- **Side Effect**: Marks status as `cancelled` and releases room holds.

#### 8. Mark No-Show
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/no-show`
- **Auth**: Required (`permission:cancel bookings`)

---

## 8. Guests & Customer Management

### Endpoints Detail
- `GET /api/v1/guests` (`permission:view guests`) - Search by `filter[search]`, `filter[email]`, `filter[phone]`
- `POST /api/v1/guests` (`permission:create guests`) - Register new guest profile
- `GET /api/v1/guests/{guest}` (`permission:view guests`) - View guest details
- `PUT /api/v1/guests/{guest}` (`permission:update guests`) - Update profile
- `DELETE /api/v1/guests/{guest}` (`permission:delete guests`) - Delete profile
- `GET /api/v1/guests/{guest}/bookings` (`permission:view bookings`) - View complete stay history for guest

### Guest Request Payload Example
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+254712345678",
  "nationality": "Kenyan",
  "national_id": "33445566",
  "passport_number": "A12345678"
}
```

---

## 9. Payments, Billing & Invoicing

### 1. Booking Invoice Details
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/invoice`
- **Auth**: Required

### 2. Download Invoice PDF Stream
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/invoice/pdf`
- **Response**: Binary PDF file (`Content-Type: application/pdf`).

### 3. Regenerate Invoice
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/invoice/regenerate`

### 4. Record Payment
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/payments`
- **Request Body**:
  ```json
  {
    "amount": 350.00,
    "payment_method": "card",
    "transaction_reference": "TXN-99887766"
  }
  ```
- **Accepted `payment_method` Values**: `cash`, `card`, `mpesa`, `bank_transfer`

### 5. Download Payment Receipt PDF
- **Method**: `GET`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/payments/{payment}/receipt/pdf`

### 6. Update Payment Status
- **Method**: `POST`
- **URL**: `/api/v1/hotels/{hotel}/bookings/{booking}/payments/{payment}/status`
- **Request Body**: `{"status": "completed"}` (Options: `pending`, `completed`, `failed`, `refunded`)

---

## 10. Staff, Users, Roles & Permissions

### Role Hierarchy
1. `super_admin`: Full system access, multi-hotel management, security unlock.
2. `hotel_manager`: Full access to assigned hotel operations, reports, user creation.
3. `receptionist`: Bookings, check-in, check-out, guest management, payment recording.
4. `housekeeper`: Viewing and completing housekeeping room tasks.
5. `accountant`: Viewing billing, reports, invoicing, financial summaries.

### User Management Endpoints
- `GET /api/v1/hotels/{hotel}/users` (`permission:view users`)
- `POST /api/v1/hotels/{hotel}/users` (`permission:create users`)
- `GET /api/v1/hotels/{hotel}/users/{user}` (`permission:view users`)
- `PUT /api/v1/hotels/{hotel}/users/{user}` (`permission:update users`)
- `DELETE /api/v1/hotels/{hotel}/users/{user}` (`permission:delete users`)
- `POST /api/v1/admin/users/{user}/unlock` (`permission:update users`) - Clears account lockout and resets failed login counter.
- `GET /api/v1/admin/audit-logs` (`permission:view activity logs`) - System activity trail.

---

## 11. Reports & Financial Analytics

*(See Section 4 for details on `/reports/dashboard` and `/reports/revenue`)*

---

## 12. Search, Filters & Pagination Conventions

### Spatie QueryBuilder Integration
All list endpoints support standard Spatie QueryBuilder parameters:
- **Filtering**: `filter[field_name]=value`
- **Sorting**: `sort=created_at` (ascending) or `sort=-created_at` (descending)
- **Pagination**: `page=1&per_page=15`
- **Includes / Relationships**: `include=guest,rooms.roomType`

### Example React API Call URL
```http
GET /api/v1/hotels/1/bookings?filter[status]=checked_in&sort=-check_in_date&page=1&per_page=20
```

---

## 13. File & Image Uploads / Media Streams

1. **Hotel Logo Upload**:
   Use `FormData` when submitting to `POST /api/v1/hotels` or `PUT /api/v1/hotels/{id}`:
   ```javascript
   const formData = new FormData();
   formData.append('name', 'Grand Hotel');
   formData.append('logo', logoFileObject);
   await api.post('/hotels', formData, {
     headers: { 'Content-Type': 'multipart/form-data' }
   });
   ```

2. **PDF Downloads (Invoices & Receipts)**:
   Must set `responseType: 'blob'` in Axios:
   ```javascript
   const response = await api.get(`/hotels/${hotelId}/bookings/${bookingId}/invoice/pdf`, {
     responseType: 'blob'
   });
   const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
   window.open(blobUrl);
   ```

---

## 14. API Response Structures & Envelopes

### Single Item Success Envelope
```json
{
  "success": true,
  "message": "Resource Description Retrieved Successfully.",
  "data": { ... }
}
```

### Paginated Collection Envelope
```json
{
  "data": [ ... ],
  "links": {
    "first": "http://localhost:8000/api/v1/hotels/1/bookings?page=1",
    "last": "http://localhost:8000/api/v1/hotels/1/bookings?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/v1/hotels/1/bookings?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  },
  "success": true,
  "message": "Bookings Retrieved Successfully."
}
```

### Standard Validation Error Envelope (HTTP 422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "check_out_date": ["The check out date must be a date after check in date."]
  }
}
```

---

## 15. React Integration Architecture & Examples

### Recommended Project Directory Structure
```
src/
├── api/
│   ├── client.js          # Axios instance with interceptors
│   ├── auth.js            # Login, logout, me, refresh token
│   ├── hotels.js          # Hotel CRUD & settings
│   ├── rooms.js           # Rooms, room types, availability
│   ├── bookings.js        # Reservation workflow & check-in/out
│   ├── guests.js          # Guest profile CRUD
│   ├── payments.js        # Billing, payments, PDF downloads
│   └── reports.js         # Dashboard & revenue KPIs
├── context/
│   └── AuthContext.jsx    # React Auth Provider & state
├── hooks/
│   ├── useAuth.js
│   ├── useBookings.js
│   └── useDashboard.js
```

### Axios Client Setup (`src/api/client.js`)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotelia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Auth & Lockouts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hotelia_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 16. Frontend Page → Endpoint Mapping

| React Page / Screen | HTTP Method | Endpoint URL | Required Permission | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Login Screen** | `POST` | `/api/v1/auth/login` | Public | Authenticate user & fetch token |
| **Dashboard** | `GET` | `/api/v1/hotels/{hotel}/reports/dashboard` | `view reports` | Display real-time stats & KPIs |
| **Revenue Analytics** | `GET` | `/api/v1/hotels/{hotel}/reports/revenue` | `view reports` | Financial charts (ADR, RevPAR) |
| **Hotels List** | `GET` | `/api/v1/hotels` | `view hotels` | Property listing table |
| **Hotel Settings** | `GET` / `PUT` | `/api/v1/hotels/{hotel}/settings` | `update hotels` | Configure tax, currency, times |
| **Tape Chart / Matrix**| `GET` | `/api/v1/hotels/{hotel}/availability` | `view rooms` | Room availability grid calendar |
| **Bookings List** | `GET` | `/api/v1/hotels/{hotel}/bookings` | `view bookings` | Manage reservations |
| **New Reservation** | `POST` | `/api/v1/hotels/{hotel}/bookings` | `create bookings` | Reserve room for guest |
| **Booking Details** | `GET` | `/api/v1/hotels/{hotel}/bookings/{id}`| `view bookings` | Detailed booking view |
| **Check-In Modal** | `POST` | `/api/v1/hotels/{hotel}/bookings/{id}/check-in` | `check in guests` | Execute check-in |
| **Check-Out Modal** | `POST` | `/api/v1/hotels/{hotel}/bookings/{id}/check-out` | `check out guests` | Execute check-out |
| **Invoice Viewer** | `GET` | `/api/v1/hotels/{hotel}/bookings/{id}/invoice/pdf` | `view bookings` | Download invoice PDF |
| **Payments List** | `GET` / `POST` | `/api/v1/hotels/{hotel}/bookings/{id}/payments` | `view bookings` | View & record payments |
| **Guests Directory** | `GET` / `POST` | `/api/v1/guests` | `view guests` | Guest CRM lookup |
| **Staff & Users** | `GET` / `POST` | `/api/v1/hotels/{hotel}/users` | `view users` | Manage staff accounts |
| **Security Audit Logs** | `GET` | `/api/v1/admin/audit-logs` | `view activity logs` | Review system security logs |

---

## 17. Frontend Implementation Workflow

1. **Setup Core API Client & Auth Provider**: Configure Axios interceptors, Sanctum token storage, and permission check helpers.
2. **Build Login & Security Screens**: Implement Login form with account lock timer (HTTP 423 support) and Password Reset flow.
3. **App Shell & Layout**: Implement Sidebar navigation dynamically filtering links based on `user.permissions` array.
4. **Dashboard Page**: Connect `/reports/dashboard` and `/reports/revenue` to render metric cards and charts.
5. **Hotel & Room Configuration**: Implement Hotel Settings, Room Types, and Amenities CRUD.
6. **Guests CRM**: Implement Guest search and profile management.
7. **Bookings & Availability Matrix**: Build Tape Chart grid using `/availability` and Reservation form with overlap validation.
8. **Check-In / Check-Out Operations**: Implement status transition buttons with auto-generated housekeeping tasks.
9. **Billing & PDF Downloads**: Connect Invoice generation and PDF Blob download streams.

---

## 18. API Considerations, Gotchas & Quirks

> [!WARNING]
> **No Public Registration**: The API does NOT provide `/auth/register`. Do not build a public registration form. New users are created internally by managers via `/api/v1/hotels/{hotel}/users` or super admins via `/api/v1/admin/users`.

> [!IMPORTANT]
> **Account Lockout Alert**: 3 failed login attempts lock the account for 15 minutes. Always handle HTTP `423` status code in the login component.

> [!NOTE]
> **Date Format**: All dates in query params and request bodies must strictly use `YYYY-MM-DD` format.
