# 🚀 API Documentation - Sistema de Gestión de Citas Médicas

## Base URLs

- **Local Development**: `http://localhost:3000`
- **Docker Environment**: `http://api-gateway:3000`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register Patient

**POST** `/api/auth/register`

Creates a new patient account.

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123",
  "name": "Juan Pérez",
  "phone": "+521234567890",
  "date_of_birth": "1990-01-15"
}
```

**Response (201 Created):**
```json
{
  "patient": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "name": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login

**POST** `/api/auth/login`

Authenticates a patient and returns a JWT token.

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "patient": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "name": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📅 Appointment Endpoints

### Create Appointment

**POST** `/api/appointments`

Creates a new appointment.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "doctor_id": "987f6543-e21b-12d3-a456-426614174000",
  "appointment_date": "2024-11-25",
  "appointment_time": "10:00:00",
  "duration_minutes": 30,
  "reason": "Regular checkup",
  "notes": "First visit"
}
```

**Response (201 Created):**
```json
{
  "id": "abc12345-e29b-41d4-a716-446655440000",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "doctor_id": "987f6543-e21b-12d3-a456-426614174000",
  "appointment_date": "2024-11-25",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "status": "scheduled",
  "reason": "Regular checkup",
  "created_at": "2024-11-17T10:00:00Z"
}
```

### Get Appointment

**GET** `/api/appointments/{appointment_id}`

Retrieves details of a specific appointment.

**Response (200 OK):**
```json
{
  "id": "abc12345-e29b-41d4-a716-446655440000",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "doctor_id": "987f6543-e21b-12d3-a456-426614174000",
  "appointment_date": "2024-11-25",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "status": "confirmed",
  "reason": "Regular checkup",
  "notes": "Patient requested morning slot",
  "created_at": "2024-11-17T10:00:00Z",
  "updated_at": "2024-11-17T11:00:00Z"
}
```

### List Appointments

**GET** `/api/appointments`

Lists appointments with optional filters.

**Query Parameters:**
- `patient_id` (string): Filter by patient
- `doctor_id` (string): Filter by doctor
- `status` (string): Filter by status (scheduled, confirmed, cancelled, completed, no_show)
- `date_from` (date): Start date for filtering
- `date_to` (date): End date for filtering
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20, max: 100)

**Example Request:**
```http
GET /api/appointments?patient_id=550e8400&status=confirmed&page=1&page_size=10
```

**Response (200 OK):**
```json
{
  "appointments": [
    {
      "id": "abc12345",
      "patient_id": "550e8400",
      "doctor_id": "987f6543",
      "appointment_date": "2024-11-25",
      "start_time": "10:00:00",
      "status": "confirmed"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 10,
  "has_next": true,
  "has_previous": false
}
```

### Update Appointment

**PUT** `/api/appointments/{appointment_id}`

Updates an existing appointment.

**Request Body:**
```json
{
  "appointment_date": "2024-11-26",
  "appointment_time": "14:00:00",
  "status": "confirmed",
  "notes": "Rescheduled per patient request"
}
```

**Response (200 OK):**
```json
{
  "id": "abc12345",
  "status": "confirmed",
  "appointment_date": "2024-11-26",
  "start_time": "14:00:00",
  "updated_at": "2024-11-17T12:00:00Z"
}
```

### Cancel Appointment

**DELETE** `/api/appointments/{appointment_id}`

Cancels an appointment.

**Query Parameters:**
- `reason` (string): Cancellation reason

**Example Request:**
```http
DELETE /api/appointments/abc12345?reason=Patient%20request
```

**Response (204 No Content)**

### Check Availability

**GET** `/api/appointments/availability/{doctor_id}`

Gets available time slots for a doctor on a specific date.

**Query Parameters:**
- `date` (date, required): Date to check availability
- `duration_minutes` (integer): Appointment duration (default: 30)

**Example Request:**
```http
GET /api/appointments/availability/987f6543?date=2024-11-25&duration_minutes=30
```

**Response (200 OK):**
```json
{
  "doctor_id": "987f6543",
  "date": "2024-11-25",
  "available_slots": [
    {
      "start_time": "09:00:00",
      "end_time": "09:30:00"
    },
    {
      "start_time": "10:00:00",
      "end_time": "10:30:00"
    },
    {
      "start_time": "11:00:00",
      "end_time": "11:30:00"
    }
  ]
}
```

### Confirm Appointment

**POST** `/api/appointments/{appointment_id}/confirm`

Confirms a scheduled appointment.

**Response (200 OK):**
```json
{
  "id": "abc12345",
  "status": "confirmed",
  "confirmed_at": "2024-11-17T12:00:00Z"
}
```

---

## 👥 Patient Endpoints

### Get Patient Profile

**GET** `/api/patients/{patient_id}`

Retrieves patient information.

**Response (200 OK):**
```json
{
  "id": "550e8400",
  "name": "Juan Pérez",
  "email": "patient@example.com",
  "phone": "+521234567890",
  "telegram_id": "123456789",
  "date_of_birth": "1990-01-15",
  "created_at": "2024-01-01T10:00:00Z"
}
```

### Update Patient Profile

**PUT** `/api/patients/{patient_id}`

Updates patient information.

**Request Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "phone": "+529876543210",
  "address": "Av. Revolución 123, CDMX"
}
```

### Link Telegram Account

**POST** `/api/patients/telegram/link`

Links a Telegram account to a patient profile.

**Request Body:**
```json
{
  "patient_id": "550e8400",
  "telegram_id": "123456789",
  "telegram_username": "juanperez"
}
```

### Get Patient by Telegram ID

**GET** `/api/patients/telegram/{telegram_id}`

Retrieves patient information by Telegram ID. Auto-registers if not found.

---

## 📬 Notification Endpoints

### Send Notification

**POST** `/api/notifications/send`

Sends a notification to a patient.

**Request Body:**
```json
{
  "channel": "telegram",
  "recipient": "123456789",
  "template": "appointment_confirmation",
  "data": {
    "appointment_date": "2024-11-25",
    "appointment_time": "10:00",
    "doctor_name": "Dr. López"
  },
  "priority": "high"
}
```

### Send Bulk Notifications

**POST** `/api/notifications/send-bulk`

Sends notifications to multiple recipients.

**Request Body:**
```json
{
  "notifications": [
    {
      "channel": "telegram",
      "recipient": "123456789",
      "template": "appointment_reminder",
      "data": {
        "appointment_time": "10:00"
      }
    },
    {
      "channel": "email",
      "recipient": "patient@example.com",
      "template": "appointment_reminder",
      "data": {
        "appointment_time": "14:00"
      }
    }
  ]
}
```

### Get Notification Status

**GET** `/api/notifications/{notification_id}`

Retrieves the status of a sent notification.

### Retry Failed Notification

**POST** `/api/notifications/{notification_id}/retry`

Retries sending a failed notification.

---

## 🏥 Doctor Endpoints

### List Doctors

**GET** `/api/doctors`

Lists all available doctors.

**Query Parameters:**
- `specialty` (string): Filter by specialty
- `available_date` (date): Filter by availability on specific date

### Get Doctor Details

**GET** `/api/doctors/{doctor_id}`

Retrieves doctor information including specialties and availability.

---

## 🔍 Health Check

### Service Health

**GET** `/health`

Returns the health status of the service.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.0.0",
  "timestamp": "2024-11-17T10:00:00Z",
  "dependencies": {
    "database": "connected",
    "appointment-service": "healthy",
    "patient-service": "healthy",
    "notification-service": "healthy"
  }
}
```

---

## 📊 Statistics Endpoints

### Appointment Statistics

**GET** `/api/statistics/appointments`

Returns appointment statistics.

**Response (200 OK):**
```json
{
  "total_appointments": 1500,
  "scheduled_count": 50,
  "confirmed_count": 30,
  "completed_count": 1200,
  "cancelled_count": 200,
  "no_show_count": 20,
  "average_duration_minutes": 35.5,
  "busiest_day": "Monday",
  "busiest_hour": 10,
  "cancellation_rate": 0.133,
  "no_show_rate": 0.013
}
```

---

## 🚨 Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid appointment date",
  "details": {
    "field": "appointment_date",
    "issue": "Date cannot be in the past"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Appointment not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Time slot already booked"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 🔄 Webhooks

The system can send webhooks for the following events:

### Event Types

- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `appointment.confirmed`
- `appointment.completed`
- `patient.registered`
- `notification.sent`
- `notification.failed`

### Webhook Payload

```json
{
  "id": "evt_1234567890",
  "type": "appointment.created",
  "data": {
    "appointment_id": "abc12345",
    "patient_id": "550e8400",
    "doctor_id": "987f6543",
    "appointment_date": "2024-11-25",
    "appointment_time": "10:00:00"
  },
  "timestamp": "2024-11-17T10:00:00Z",
  "service": "appointment-service"
}
```

---

## 🔐 Rate Limiting

API endpoints are rate limited:

- **Authentication endpoints**: 5 requests per minute
- **Read endpoints (GET)**: 100 requests per minute
- **Write endpoints (POST, PUT, DELETE)**: 30 requests per minute

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699344000
```

---

## 🧪 Testing

### Postman Collection

A Postman collection is available at `/docs/postman-collection.json`

### Example cURL Commands

**Create Appointment:**
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "550e8400",
    "doctor_id": "987f6543",
    "appointment_date": "2024-11-25",
    "appointment_time": "10:00:00"
  }'
```

**Get Available Slots:**
```bash
curl -X GET "http://localhost:3000/api/appointments/availability/987f6543?date=2024-11-25" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD)
- All times should be in 24-hour format (HH:MM:SS)
- Appointment times must be in 15-minute intervals
- Minimum appointment duration is 15 minutes
- Maximum appointment duration is 120 minutes
- Appointments can be booked up to 90 days in advance
- Cancellations must be made at least 2 hours before appointment time
