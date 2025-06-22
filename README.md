# Resource Management / Service Booking System

This is a service booking web application built with **Flask**, **MySQL**, **HTML/CSS/JS**.

## 🔧 Features

- User and Worker registration and login
- Booking system based on department and time slot
- Worker availability and profile
- Admin dashboard (optional)
- Secure password storage
- Dynamic department-service mapping

---

## 🛠️ Project Setup

### 📦 1. Clone the Repository

```bash
git clone https://github.com/NirajChandra19/Flask_Session_Booking.git
cd Flask_Session_Booking
```

### 🐍 2. Set Up Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 📦 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🧾 Database Setup

### ✅ Import the SQL Schema

This project includes a ready-to-use schema file:  
📄 **`service_booking.sql`**

### Steps:

1. Open a terminal or MySQL Workbench
2. Run the following command:

```bash
mysql -u root -p < service_booking.sql
```

This will:
- Create the `service_booking` database
- Set up all required tables
- Add relationships and constraints

> 💡 You can also open `service_booking.sql` manually in MySQL Workbench and run it.

---

## 🔐 Environment Configuration

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=service_booking
SECRET_KEY=your_secret_key_here
```

> You can copy from `.env.template`.

---

## 🚀 Run the App

```bash
flask run
```

Visit: [http://127.0.0.1:5000](http://127.0.0.1:5000)
