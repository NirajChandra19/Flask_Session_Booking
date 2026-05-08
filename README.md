# Resource Management / Service Booking System

A full-stack service booking web application built using **Flask**, **MySQL**, **HTML**, **CSS**, and **JavaScript**.  
The system connects users with workers/service providers for booking services based on department, availability, and time slots.

---

## 🔧 Features

### 👤 User Features
- User registration and login
- Browse workers by department/service
- Book workers based on available time slots
- View active and booking history
- Cancel or complete bookings
- Rate workers after service completion
- Razorpay online payment integration

### 🛠️ Worker Features
- Worker registration and login
- Manage profile and availability
- Set service fee and departments
- View assigned bookings
- Track booking history
- Upload profile photo

### 🔒 Security Features
- Secure password hashing
- Session-based authentication
- Protected routes and role-based access
- Environment variable support using `.env`

---

# 🛠️ Tech Stack

- **Backend:** Flask (Python)
- **Frontend:** HTML, CSS, JavaScript
- **Database:** MySQL
- **Authentication:** Flask Session
- **Payment Gateway:** Razorpay

---

# 📦 Project Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/NirajChandra19/Flask_Session_Booking.git
cd Flask_Session_Booking
```

---

## 2️⃣ Create Virtual Environment

### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / Mac
```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🧾 Database Setup

## ✅ Import SQL File

The project includes:

```text
service_booking.sql
```

This file:
- Creates the database
- Creates all required tables
- Adds relationships and constraints

---

## Import Using MySQL Terminal

```bash
mysql -u root -p < service_booking.sql
```

Or import manually using **MySQL Workbench**.

---

# 🔐 Environment Variables

Create a `.env` file in the project root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=service_booking

SECRET_KEY=your_secret_key

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
```

---

# 🚀 Run the Application

```bash
python app.py
```

or

```bash
flask run
```

Open in browser:

```text
http://127.0.0.1:5000
```

---

# 📁 Project Structure

```text
Flask_Session_Booking/
│
├── app.py
├── db.py
├── requirements.txt
├── service_booking.sql
├── .env
│
├── routes/
│   ├── booking_routes.py
│   └── payment_routes.py
│
├── templates/
│
├── static/
│   ├── css/
│   ├── js/
│   └── profile_photos/
│
└── flask_session/
```

---

# 📌 Future Enhancements

- AI-based worker recommendation
- Real-time notifications
- Chat system between users and workers
- Email/SMS booking alerts
- Mobile application support

---

# 👨‍💻 Author

**Niraj Chandra**

GitHub Repository:  
https://github.com/NirajChandra19/Flask_Session_Booking