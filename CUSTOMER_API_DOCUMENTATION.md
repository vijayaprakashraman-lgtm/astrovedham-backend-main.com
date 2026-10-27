# AstroVedham - Mobile App Developer API Documentation

This document contains all API specifications, request/response structures, and workflows required for integrating the **AstroVedham Customer Mobile App** (Android / iOS / Flutter / React Native).

---

## 1. General Information & Base URL

- **Development Base URL**: `http://<your-server-ip>:5002/api`
- **Production Base URL**: `https://astrovedham.com/api`
- **Content-Type**: `application/json` (All requests send and receive JSON)
- **Authentication**: JWT Bearer Token in HTTP header:
  ```http
  Authorization: Bearer <customer_jwt_token>
  ```

---

## 2. Complete Endpoints Quick Reference

| # | Endpoint | Method | Auth Required | Description |
|---|---|---|:---:|---|
| **1** | `/api/customer/send_otp` | `POST` | ❌ No | Send 6-digit OTP to customer mobile |
| **2** | `/api/customer/verify_otp` | `POST` | ❌ No | Verify OTP & Login / Auto-Register |
| **3** | `/api/customer/profile` | `GET` | ✅ Yes | Get logged-in customer profile |
| **4** | `/api/customer/update_profile` | `POST` | ✅ Yes | Update customer name / email |
| **5** | `/api/customer/plan_types` | `GET / POST` | ❌ No | Get list of all 10 horoscope types |
| **6** | `/api/customer/getplans` | `GET / POST` | ❌ No | Get all active user plans (pricing) |
| **7** | `/api/customer/plans/:type` | `GET` | ❌ No | Get plan for a specific horoscope type |
| **8** | `/api/customer/buy_now` | `POST` | ✅ Yes | Buy plan & get Cashfree PG payment link |
| **9** | `/api/customer/verify_payment`| `POST` | ❌ No | Verify Cashfree payment status |
| **10**| `/api/customer/my_plans` | `GET` | ✅ Yes | Get customer's purchased plans & transactions |
| **11**| `/api/customer/generate_horoscope` | `POST` | ✅ Yes | Place horoscope order (all 10 types) |
| **12**| `/api/customer/orders` | `GET` | ✅ Yes | Get customer's order history & PDF links |

---

## 3. Authentication (Mobile Number & OTP)

### 3.1 Send OTP
Sends a 6-digit OTP valid for 5 minutes.

- **URL**: `POST /api/customer/send_otp`
- **Request Body**:
  ```json
  {
    "mobile": "9876543210"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "OTP sent successfully",
    "data": {
      "mobile": "9876543210",
      "otp": "492810",
      "expires_in_seconds": 300
    }
  }
  ```
  *(Note: `otp` is returned in response during development for quick testing).*

---

### 3.2 Verify OTP & Login / Auto-Registration
Verifies OTP, creates account if new, and returns JWT session token (valid for 30 days).

- **URL**: `POST /api/customer/verify_otp`
- **Request Body**:
  ```json
  {
    "mobile": "9876543210",
    "otp": "492810"
  }
  ```
  *(Master test OTP `123456` can also be used during development).*
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "customer": {
        "_id": "673cf981a8b9c1234567890a",
        "mobile": "9876543210",
        "name": "",
        "email": "",
        "role": "customer",
        "is_active": true,
        "purchased_plans": [],
        "transactions": []
      }
    }
  }
  ```
> **IMPORTANT**: Save `data.token` in device local storage / SecureStorage. Send it in `Authorization: Bearer <token>` for all protected APIs.

---

## 4. Customer Profile

### 4.1 Get Profile
- **URL**: `GET /api/customer/profile`
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "data": {
      "_id": "673cf981a8b9c1234567890a",
      "mobile": "9876543210",
      "name": "Karthik",
      "email": "karthik@gmail.com",
      "role": "customer",
      "purchased_plans": [],
      "transactions": []
    }
  }
  ```

### 4.2 Update Profile
- **URL**: `POST /api/customer/update_profile`
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "Karthik Kumar",
    "email": "karthik@gmail.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "Profile updated successfully",
    "data": {
      "_id": "673cf981a8b9c1234567890a",
      "mobile": "9876543210",
      "name": "Karthik Kumar",
      "email": "karthik@gmail.com"
    }
  }
  ```

---

## 5. Plans Catalog (Public)

### 5.1 Get All Horoscope Plan Types
Returns catalog metadata for all 10 horoscope types.

- **URL**: `GET /api/customer/plan_types`
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "Plan types fetched successfully",
    "data": [
      {
        "plan_type": "Single",
        "name": "Single Horoscope",
        "description": "Quick astrological overview, rasi, nakshatra, and key planetary charts.",
        "icon": "star",
        "badge": "Popular",
        "available_plans_count": 1,
        "starting_price": 100
      },
      {
        "plan_type": "Life",
        "name": "Life Horoscope",
        "description": "Comprehensive lifelong astrological predictions, mahadasha, and bhukti analysis.",
        "icon": "book",
        "badge": "Recommended",
        "available_plans_count": 1,
        "starting_price": 999
      }
    ]
  }
  ```

---

### 5.2 Get All User Plans (`getplans`)
Returns all active plans with pricing, discount %, and final amounts.

- **URL**: `GET /api/customer/getplans` *(or `POST /api/customer/getplans`)*
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "Plans fetched successfully",
    "plan_type": "All",
    "total_plans": 10,
    "data": [
      {
        "_id": "673cfa01a8b9c...",
        "plan_type": "Single",
        "plan_type_name": "Single Horoscope",
        "plan_name": "Single Horoscope Plan",
        "plan_details": "Single page horoscope report",
        "count": 1,
        "total_amount": 100,
        "discount_percent": 10,
        "discount_amount": 10,
        "final_amount": 90,
        "savings": 10,
        "currency": "INR",
        "currency_symbol": "₹",
        "type_icon": "star",
        "type_badge": "Popular"
      }
    ]
  }
  ```

---

### 5.3 Get Plan for a Specific Type
- **URL**: `GET /api/customer/plans/:plan_type` *(e.g. `GET /api/customer/plans/Single`)*
- **Query Alternative**: `GET /api/customer/plans?plan_type=Life`

---

## 6. Buy Now & Cashfree Payment Gateway

### 6.1 Buy Now (Generate Cashfree Payment Link)
Generates an online payment link and session ID with Cashfree PG.

- **URL**: `POST /api/customer/buy_now` *(or `/buy_plan`)*
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "plan_id": "673cfa01a8b9c...",
    "return_url": "https://astrovedham.com/payment_status?order_id={order_id}"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "Cashfree payment link generated successfully",
    "data": {
      "order_id": "CF_1729789234567_A8B9C",
      "payment_link": "https://payments.cashfree.com/order/#session_...",
      "payment_session_id": "session_...",
      "order_amount": 90,
      "currency": "INR",
      "plan": {
        "_id": "673cfa01a8b9c...",
        "plan_name": "Single Horoscope Plan",
        "plan_type": "Single",
        "count": 1,
        "final_amount": 90
      },
      "customer": {
        "_id": "673cf981...",
        "mobile": "9876543210",
        "name": "Karthik",
        "email": "karthik@gmail.com"
      }
    }
  }
  ```
> **Mobile App Action**:
> - Open `data.payment_link` in an In-App Browser (or Webview) or use Cashfree Mobile SDK with `payment_session_id`.
> - When payment finishes, call the verify endpoint below.

---

### 6.2 Verify Payment Status
Checks payment outcome with Cashfree. Upon success, credits the plan into the customer's account.

- **URL**: `POST /api/customer/verify_payment`
- **Request Body**:
  ```json
  {
    "order_id": "CF_1729789234567_A8B9C"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "message": "Payment successful! Plan activated.",
    "data": {
      "order_id": "CF_1729789234567_A8B9C",
      "status": "SUCCESS",
      "order_status": "PAID",
      "plan_name": "Single Horoscope Plan",
      "plan_type": "Single",
      "count": 1,
      "amount": 90
    }
  }
  ```

---

### 6.3 My Purchased Plans & Transaction History
- **URL**: `GET /api/customer/my_plans`
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "data": {
      "customer_id": "673cf981...",
      "mobile": "9876543210",
      "plan_pursch": [
        {
          "order_id": "CF_1729789234567_A8B9C",
          "plan_id": "673cfa01...",
          "plan_name": "Single Horoscope Plan",
          "plan_type": "Single",
          "count": 1,
          "remaining_count": 1,
          "amount_paid": 90,
          "status": "ACTIVE",
          "purchased_at": "2026-10-26T08:30:00.000Z"
        }
      ],
      "transactions": [
        {
          "order_id": "CF_1729789234567_A8B9C",
          "amount": 90,
          "count": 1,
          "status": "SUCCESS",
          "paid_at": "2026-10-26T08:30:00.000Z",
          "gateway": "CASHFREE"
        }
      ]
    }
  }
  ```

---

## 7. Horoscope Generation / Place Order API (`generateHoroscopeHandler`)

- **Method**: `POST`
- **Endpoint**: `/api/customer/generate_horoscope` *(or `/api/customer/place_order`)*
- **Header**: `Authorization: Bearer <token>`
- **Database Collection**: Saves into MongoDB `order_history` collection.
- **Fields Rules**:
  - `language`: Automatically set to `"ta"` (Tamil).
  - `cus_id`: Automatically set to customer's `_id`.
  - `fnc_id`: Set to `null` (empty).
  - `fathername`, `mothername`, `other_details`: Omitted.

---

### 7.1 Individual Horoscope Types (8 Types)
Applies to:
- `Single` (Single Horoscope)
- `Life` (Life Horoscope)
- `Yearly` (Yearly Horoscope)
- `Super` (Super Horoscope)
- `Numerology` (Numerology Horoscope)
- `Gemstone` (Gemstone Horoscope)
- `Wealth` (Wealth Horoscope)
- `MarriageH` (Personal Marriage Horoscope)

#### Field Requirements:
| Field | Type | Required | Description |
|---|---|:---:|---|
| `horoscope_type` | String | **Yes** | Type identifier (e.g. `"Single"`, `"Life"`, `"Wealth"`) |
| `name` | String | **Yes** | Person's name |
| `gender` | String | **Yes** | `"M"` (Male) or `"F"` (Female) |
| `dob` | String | **Yes** | Date of birth in `YYYY-MM-DD` |
| `tob` | String | **Yes** | Time of birth in `HH:mm` (24-hour format) |
| `place` | String | **Yes** | Place of birth |
| `mobile` | String | *Optional* | 10-digit mobile (defaults to login mobile) |
| `emailid` | String | *Optional* | Contact email |
| `is_whatsapp` | Boolean | *Optional* | Default `true` |

#### Sample Request Body (Single Horoscope):
```json
{
  "horoscope_type": "Single",
  "name": "Karthik",
  "gender": "M",
  "dob": "1998-05-15",
  "tob": "06:30",
  "place": "COIMBATORE",
  "mobile": "9876543210",
  "is_whatsapp": true,
  "emailid": "karthik@gmail.com"
}
```

#### Sample Request Body (Life Horoscope):
```json
{
  "horoscope_type": "Life",
  "name": "Suresh Kumar",
  "gender": "M",
  "dob": "1995-10-22",
  "tob": "14:45",
  "place": "CHENNAI",
  "mobile": "9876543210",
  "is_whatsapp": true,
  "emailid": "suresh@gmail.com"
}
```

---

### 7.2 Marriage Matching Types (2 Types)
Applies to:
- `Marriage` (Simple Marriage Matching)
- `ProMarriage` (Pro Marriage Matching with Dosha Analysis)

#### Field Requirements:
| Field | Type | Required | Description |
|---|---|:---:|---|
| `horoscope_type` | String | **Yes** | `"Marriage"` or `"ProMarriage"` |
| `name` | String | **Yes** | Groom / Male Name |
| `dob` | String | **Yes** | Male Date of birth (`YYYY-MM-DD`) |
| `tob` | String | **Yes** | Male Time of birth (`HH:mm`) |
| `place` | String | **Yes** | Male Place of birth |
| `fname` | String | **Yes** | Bride / Female Name |
| `fdob` | String | **Yes** | Female Date of birth (`YYYY-MM-DD`) |
| `ftob` | String | **Yes** | Female Time of birth (`HH:mm`) |
| `fplace` | String | **Yes** | Female Place of birth |
| `cname` | String | *Optional* | Contact person name |
| `mobile` | String | *Optional* | 10-digit mobile |
| `emailid` | String | *Optional* | Contact email |
| `is_whatsapp` | Boolean | *Optional* | Default `true` |

#### Sample Request Body (Marriage Matching):
```json
{
  "horoscope_type": "Marriage",
  "name": "Karthik",
  "dob": "1998-05-15",
  "tob": "06:30",
  "place": "COIMBATORE",
  "fname": "Priya",
  "fdob": "2000-08-20",
  "ftob": "14:15",
  "fplace": "MADURAI",
  "cname": "Karthik",
  "mobile": "9876543210",
  "is_whatsapp": true,
  "emailid": "karthik@gmail.com"
}
```

#### Sample Request Body (Pro Marriage Matching):
```json
{
  "horoscope_type": "ProMarriage",
  "name": "Saravanan",
  "dob": "1996-02-18",
  "tob": "08:05",
  "place": "THANJAVUR",
  "fname": "Deepa",
  "fdob": "1999-06-25",
  "ftob": "17:30",
  "fplace": "TIRUCHIRAPPALLI",
  "cname": "Saravanan",
  "mobile": "9876543210",
  "is_whatsapp": true,
  "emailid": "saravanan@gmail.com"
}
```

---

### 7.3 Success Response (All 10 Types)
```json
{
  "status": "S",
  "message": "Horoscope order placed successfully",
  "order_id": "695152c6261126e156880821",
  "data": {
    "order_id": "695152c6261126e156880821",
    "cus_id": "673cf981...",
    "fnc_id": null,
    "horoscope_type": "Single",
    "name": "Karthik",
    "mobile": "9876543210",
    "emailid": "karthik@gmail.com",
    "language": "ta",
    "status": "Pending",
    "created_at": "2026-10-26T09:00:00.000Z"
  }
}
```

---

## 8. Customer Order History & PDF Download

### 8.1 Get Customer Orders
Returns all orders placed by the logged-in customer, their current status, and generated PDF file URLs.

- **URL**: `GET /api/customer/orders` *(or `/order_history`)*
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "status": "S",
    "total": 1,
    "data": [
      {
        "_id": "695152c6261126e156880821",
        "cus_id": "673cf981...",
        "fnc_id": null,
        "horoscope_type": "Single",
        "name": "Karthik",
        "gender": "M",
        "dob": "1998-05-15T00:00:00.000Z",
        "tob": "06:30",
        "place": "COIMBATORE",
        "mobile": "9876543210",
        "language": "ta",
        "status": "Completed",
        "fileurl": "695152c6261126e156880821_1767542544905.pdf",
        "created_at": "2026-10-26T09:00:00.000Z"
      }
    ]
  }
  ```

### 8.2 Downloading / Viewing Horoscope PDF
When an order's `status` becomes `"Completed"`, the PDF is viewable at:
```
http://<your-server-ip>:5002/viewhoroscope/<fileurl>
```
*Example:* `https://astrovedham.com/viewhoroscope/695152c6261126e156880821_1767542544905.pdf`

---

## 9. Error Response Formats

All error responses return standard HTTP status codes (`400`, `401`, `404`, `500`) with:
```json
{
  "status": "E",
  "message": "Specific error description here"
}
```

When JWT authentication fails:
```json
{
  "status": "UA",
  "message": "Authorization token is required / Invalid or expired token"
}
```
*(The mobile app should intercept `401` or `status: "UA"` and navigate the user to the OTP login screen).*

