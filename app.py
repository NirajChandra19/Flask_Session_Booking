from flask import Flask, request, jsonify, session, render_template, redirect, url_for , flash
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_session import Session
import mysql.connector
from datetime import datetime, time, timedelta
import os
import random
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static', template_folder='templates')

CORS(app, supports_credentials=True)
app.secret_key = 'supersecretkey'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['WORKER_FOLDER'] = 'static/profile_photos/worker_photos'
app.config['USER_FOLDER'] = 'static/profile_photos/user_photos'
app.permanent_session_lifetime = timedelta(days=1)
Session(app)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Connect to MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="niraj19",
    database="service_booking"
)

# ---- ROUTES ----

@app.route("/")
@app.route("/home")
def home():
    return render_template("dashboard.html")

@app.route("/login-page")
def login_page():
    role = request.args.get("role", "")
    return render_template("login.html", role=role)

@app.route("/register-user")
def register_user_page():
    return render_template("signup.html")

@app.route("/register-worker")
def register_worker_page():
    return render_template("worker_signup.html")

@app.route("/book-service-page", methods=["GET", "POST"])
def book_service_page():
    if "user_id" not in session:
        return redirect("/login")
    return render_template("booking.html")

@app.route('/worker-assigned-jobs-page')
def worker_assigned_jobs_page():
    if 'worker_id' not in session:
        return redirect('/login')
    return render_template('worker_assigned_jobs.html',username=session.get('username'))

@app.route("/user-bookings")
def user_bookings():
    if 'user_id' not in session or session.get('role') != 'user':
        return redirect(url_for("login_page"))
    return render_template("user_bookings.html", username=session.get('username'))


@app.route("/services")
def services():
    if 'user_id' not in session:
        return redirect(url_for("login_page"))
    return render_template("services.html")

# ---- AUTH ----

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    cursor = db.cursor(dictionary=True)

    # Check if role is valid
    if role == "user":
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    elif role == "worker":
        cursor.execute("SELECT * FROM workers WHERE email = %s", (email,))
    else:
        cursor.close()
        return jsonify({"error": "Invalid role"}), 400

    user = cursor.fetchone()
    cursor.close()

    # Email not found
    if not user:
        return jsonify({"error": "Invalid email"}), 401

    # Password incorrect
    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    # Successful login
    session['user_id'] = user['id']
    session['username'] = user['name']
    session['role'] = role
    if role == 'worker':
        session['worker_id'] = user['id']

    return jsonify({"message": "Login successful", "username": user['name'], "role": role}), 200

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    role = data.get('role')
    email = data.get('email')

    cursor = db.cursor(dictionary=True)

    if role == "user":
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "User already exists"}), 409

        hashed = generate_password_hash(data["password"])
        cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (data["name"], email, hashed))
        db.commit()
        cursor.close()
        return jsonify({"message": "User registered successfully"}), 201

    elif role == "worker":
        cursor.execute("SELECT * FROM workers WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Worker already exists"}), 409

        hashed = generate_password_hash(data["password"])
        print(f"Password:- {hashed}")
        cursor.execute("""
            INSERT INTO workers (name, email, password, contact)
            VALUES (%s, %s, %s, %s)
        """, (data["name"], email, hashed, data['contact']))
        db.commit()
        cursor.close()
        return jsonify({"message": "Worker registered successfully"}), 201

    cursor.close()
    return jsonify({"error": "Invalid role"}), 400

# ---- BOOKING ----

@app.route('/departments')
def get_departments():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, name FROM departments ORDER BY name")
    departments = cursor.fetchall()
    cursor.close()
    return jsonify(departments)

from datetime import datetime, timedelta

@app.route('/book', methods=['POST'])
def book_service():
    if 'user_id' not in session:
        return jsonify({'error': 'User not logged in'}), 401

    data = request.get_json()
    department_id = data.get('department')
    date_str = data.get('date')  # "YYYY-MM-DD"
    time_str = data.get('time')  # "HH:MM"
    contact = data.get('contact')

    if not all([department_id, date_str, time_str, contact]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        booking_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify({'error': 'Invalid date or time format'}), 400

    user_id = session['user_id']
    cursor = db.cursor(dictionary=True)

    # Get department/service name
    cursor.execute("SELECT name FROM departments WHERE id = %s", (department_id,))
    dept = cursor.fetchone()
    if not dept:
        cursor.close()
        return jsonify({'error': 'Invalid department selected'}), 400
    service_name = dept['name']

    # Step 1: Get available workers
    cursor.execute("""
        SELECT w.id FROM workers w
        JOIN worker_departments wd ON w.id = wd.worker_id
        WHERE wd.department_id = %s
        AND %s BETWEEN w.available_from AND w.available_to
        AND w.status = 'available'
    """, (department_id, time_str))
    potential_workers = cursor.fetchall()

    if not potential_workers:
        cursor.close()
        return jsonify({'error': 'No workers are available'}), 400

    # Step 2: Check for 1-hour conflict for each worker
    available_worker_id = None
    for worker in potential_workers:
        worker_id = worker['id']

        cursor.execute("""
            SELECT time FROM bookings 
            WHERE worker_id = %s AND date = %s AND status = 'booked'
        """, (worker_id, date_str))
        bookings = cursor.fetchall()

        conflict = False
        for b in bookings:
            db_time = b['time']
            try:
                existing_dt = datetime.strptime(f"{date_str} {str(db_time)}", "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    existing_dt = datetime.strptime(f"{date_str} {str(db_time)}", "%Y-%m-%d %H:%M")
                except ValueError:
                    continue  # skip malformed time

            if abs((existing_dt - booking_datetime).total_seconds()) < 3600:
                conflict = True
                break

        if not conflict:
            available_worker_id = worker_id
            break

    if not available_worker_id:
        cursor.close()
        return jsonify({'error': 'All available workers are already booked within a 1-hour window. Please choose a different time.'}), 400

    # Format time for DB as HH:MM
    booking_time_str = booking_datetime.strftime("%H:%M")

    # Insert the booking
    cursor.execute("""
        INSERT INTO bookings (user_id, worker_id, service, date, time, contact, status)
        VALUES (%s, %s, %s, %s, %s, %s, 'booked')
    """, (user_id, available_worker_id, service_name, date_str, booking_time_str, contact))

    db.commit()
    cursor.close()

    return jsonify({'message': 'Booking successful! Worker assigned.'}), 200


# user booking system
@app.route('/get_user_bookings_by_department')
def get_user_bookings_by_department():
    if 'user_id' not in session:
        return jsonify([])

    user_id = session['user_id']
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                b.id, 
                b.service AS service_name,   -- Make sure 'service' column exists in bookings table
                b.date, 
                b.time, 
                b.status,
                w.name AS worker_name,
                w.contact AS worker_contact,
                w.fee AS worker_fee
            FROM bookings b
            LEFT JOIN workers w ON b.worker_id = w.id
            WHERE b.user_id = %s
            ORDER BY b.date DESC, b.time DESC
        """, (user_id,))

        bookings = cursor.fetchall()

        for booking in bookings:
            if hasattr(booking['date'], 'isoformat'):
                booking['date'] = booking['date'].isoformat()
            if hasattr(booking['time'], 'isoformat'):
                booking['time'] = booking['time'].isoformat()
            else:
                booking['time'] = str(booking['time'])

        cursor.close()
        return jsonify(bookings)

    except Exception as e:
        cursor.close()
        return jsonify({'error': str(e)}), 500

@app.route('/cancel_booking/<int:booking_id>', methods=['POST'])
def cancel_booking(booking_id):
    print(f"Cancel booking called with id={booking_id}")
    # Simulate success
    return jsonify({'success': True})

@app.route('/delete_booking/<int:booking_id>', methods=['POST'])
def delete_booking(booking_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user_id = session['user_id']
    cursor = db.cursor()
    try:
        # Verify booking exists and belongs to this user
        cursor.execute("SELECT id FROM bookings WHERE id = %s AND user_id = %s", (booking_id, user_id))
        booking = cursor.fetchone()
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found or not authorized'})

        # Delete the booking
        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
        db.commit()
        cursor.close()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        cursor.close()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/get_worker_jobs')
def get_worker_jobs():
    if 'worker_id' not in session:
        return jsonify([])

    worker_id = session['worker_id']
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            b.id, b.date, b.time, b.status, 
            b.service AS service_name, 
            u.name AS user_name,
            u.address AS user_address,
            b.contact AS user_contact
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.worker_id = %s AND b.status = 'booked'
        ORDER BY b.date DESC, b.time DESC
    """, (worker_id,))
    
    jobs = cursor.fetchall()
    cursor.close()

    # Convert time if it's a timedelta
    for job in jobs:
        if isinstance(job['time'], timedelta):
            total_seconds = int(job['time'].total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            job['time'] = f"{hours:02}:{minutes:02}"

    return jsonify(jobs)


@app.route('/services-data')
def services_data():
    cur = mysql.connection.cursor(dictionary=True)
    
    # Get all departments (professions)
    cur.execute("SELECT * FROM worker_departments")
    departments = cur.fetchall()

    # For each department, get workers who are available
    for dept in departments:
        cur.execute("""
            SELECT id, name, status
            FROM workers w
            JOIN worker_departments wd ON w.id = wd.worker_id
            WHERE wd.department_id = %s AND w.status = 'available'
        """, (dept['id'],))
        dept['workers'] = cur.fetchall()

    cur.close()
    return render_template('services.html', services=departments)


@app.route('/update_user_profile', methods=['POST'])
def update_user_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = session['user_id']

    cursor = db.cursor(dictionary=True)

    # Only update the fields provided in the request
    if 'name' in data:
        cursor.execute("UPDATE users SET name = %s WHERE id = %s", (data['name'], user_id))

    if 'contact' in data:
        cursor.execute("UPDATE users SET contact = %s WHERE id = %s", (data['contact'], user_id))

    if 'address' in data:
        cursor.execute("UPDATE users SET address = %s WHERE id = %s", (data['address'], user_id))

    db.commit()
    cursor.close()

    return jsonify({'message': 'Profile updated successfully'})


@app.route("/user-profile")
def user_profile():
    if 'user_id' not in session or session.get('role') != 'user':
        return redirect(url_for("login_page"))

    user_id = session.get('user_id')
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    # Build image URL if image exists, else None
    profile_image_url = None
    if user and user.get('image'):
        profile_image_url = url_for('static', filename=f"profile_photos/user_photos/{user['image']}")

    return render_template("user_profile.html", user=user, profile_image_url=profile_image_url)


@app.route('/worker-profile')
def worker_profile():
    if 'worker_id' not in session:
        return redirect(url_for("login_page"))

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT name FROM departments")
    departments = [row['name'] for row in cursor.fetchall()]

    worker_id = session['worker_id']

    cursor.execute("""
        SELECT d.name FROM departments d
        JOIN worker_departments wp ON wp.department_id = d.id
        WHERE wp.worker_id = %s
    """, (worker_id,))
    worker_departments = [row['name'] for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM workers WHERE id = %s", (worker_id,))
    worker = cursor.fetchone()
    cursor.close()

    # Build image URL if image filename exists, else None
    profile_image_url = None
    if worker and worker.get('image'):
        profile_image_url = url_for('static', filename=f"profile_photos/worker_photos/{worker['image']}")

    return render_template(
        "worker_profile.html",
        worker=worker, 
        departments=departments, 
        departments_list=worker_departments,
        profile_image_url=profile_image_url
    )

@app.route('/update_worker_profile', methods=['POST'])
def update_worker_profile():
    if 'worker_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json()
    worker_id = session['worker_id']
    departments = data.get('departments')  # Expect a list of department names or None

    cursor = db.cursor(dictionary=True)

    try:
        # === Step 1: Dynamically build the update query ===
        update_fields = []
        values = []

        for field in ['name', 'contact', 'fee', 'about', 'available_from', 'available_to']:
            if field in data and data[field] != "":
                update_fields.append(f"{field} = %s")
                values.append(data[field])

        if update_fields:
            update_query = f"UPDATE workers SET {', '.join(update_fields)} WHERE id = %s"
            values.append(worker_id)
            cursor.execute(update_query, values)
            print(f"Updated worker {worker_id} fields: {update_fields}")

        # === Step 2: Update departments only if provided ===
        if departments is not None:
            cursor.execute("DELETE FROM worker_departments WHERE worker_id = %s", (worker_id,))
            print(f"Deleted previous departments for worker {worker_id}")

            for dept_name in departments:
                cursor.execute("SELECT id FROM departments WHERE name = %s", (dept_name,))
                dept_row = cursor.fetchone()

                if dept_row:
                    dept_id = dept_row['id']
                    cursor.execute(
                        "INSERT INTO worker_departments (worker_id, department_id) VALUES (%s, %s)",
                        (worker_id, dept_id)
                    )
                    print(f"Linked worker {worker_id} to department {dept_id}")
                else:
                    print(f"Department '{dept_name}' not found.")

        db.commit()
        return jsonify({'success': True, 'message': 'Profile updated successfully.'})

    except Exception as e:
        db.rollback()
        print(f"Exception during profile update: {str(e)}")
        return jsonify({'success': False, 'message': f'Update failed: {str(e)}'}), 500

    finally:
        cursor.close()


@app.route('/update-worker-status', methods=['POST'])
def update_worker_status():
    if 'worker_id' not in session:
        return jsonify({'success': False, 'message': 'Login required.'})

    worker_id = session['worker_id']
    new_status = request.form.get('status')

    if new_status not in ['available', 'not available']:
        return jsonify({'success': False, 'message': 'Invalid status.'})

    cursor = db.cursor(dictionary=True)
    cursor.execute("UPDATE workers SET status = %s WHERE id = %s", (new_status, worker_id))
    db.commit()
    cursor.close()

    return jsonify({'success': True})



#PROFILE UPDATE FOR WORKERS/USER 

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper: save profile photo
def save_profile_photo(file, user_id, role):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1]
        new_filename = f"{role}_{user_id}.{ext}"

        folder = app.config['WORKER_FOLDER'] if role == 'worker' else app.config['USER_FOLDER']
        os.makedirs(folder, exist_ok=True)  # Ensure the folder exists

        filepath = os.path.join(folder, new_filename)
        file.save(filepath)
        return new_filename
    return None


@app.route('/update-profile-photo', methods=['POST'])
def update_profile_photo():
    if 'worker_id' in session and session.get('role') == 'worker':
        user_id = session['worker_id']
        role = 'worker'
        folder = app.config['WORKER_FOLDER']
        table = 'workers'
    elif 'user_id' in session and session.get('role') == 'user':
        user_id = session['user_id']
        role = 'user'
        folder = app.config['USER_FOLDER']
        table = 'users'
    else:
        return "Unauthorized", 401

    file = request.files.get('image')
    if not file or file.filename == '':
        return "No file uploaded", 400

    filename = save_profile_photo(file, user_id, role)
    if not filename:
        return "Invalid file type", 400

    cursor = db.cursor()
    cursor.execute(f"UPDATE {table} SET image = %s WHERE id = %s", (filename, user_id))
    db.commit()
    cursor.close()

    # Redirect to appropriate profile page
    if role == 'worker':
        return redirect(url_for('worker_profile'))
    else:
        return redirect(url_for('user_profile'))

@app.route('/settings')
def settings():
    role = session.get('role')

    if role == 'user':
        user_id = session.get('user_id')
        return render_template('settings.html', role='user', user_id=user_id)

    elif role == 'worker':
        worker_id = session.get('worker_id')
        return render_template('settings.html', role='worker', user_id=worker_id)

    else:
        return redirect(url_for('login_page'))

@app.route('/change-password', methods=['POST'])
def change_password():
    role = session.get('role')
    user_id = session.get('user_id') if role == 'user' else session.get('worker_id')
    table = 'users' if role == 'user' else 'workers'

    old_password = request.form.get('old_password')
    new_password = request.form.get('new_password')

    try:
        db.ping(reconnect=True)  # Ensure connection is alive
        cursor = db.cursor(dictionary=True)
        cursor.execute(f"SELECT password FROM {table} WHERE id = %s", (user_id,))
        record = cursor.fetchone()

        if record and check_password_hash(record['password'], old_password):
            new_hashed = generate_password_hash(new_password)
            cursor.execute(f"UPDATE {table} SET password = %s WHERE id = %s", (new_hashed, user_id))
            db.commit()
            flash("Password changed successfully.", "success")
        else:
            flash("Old password is incorrect.", "error")

        cursor.close()
        return redirect('/settings')

    except Exception as e:
        flash("Something went wrong. Please try again.", "error")
        return redirect('/settings')

@app.route('/delete-account', methods=['POST'])
def delete_account():
    role = session.get('role')
    user_id = session.get('user_id') if role == 'user' else session.get('worker_id')
    cursor = db.cursor()

    try:
        if role == 'worker':
            # Delete related rows in worker_departments first
            cursor.execute("DELETE FROM worker_departments WHERE worker_id = %s", (user_id,))
            cursor.execute("DELETE FROM workers WHERE id = %s", (user_id,))
        else:
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))

        db.commit()
        session.clear()
        return redirect(url_for('home'))

    except mysql.connector.Error as err:
        db.rollback()
        return f"Error deleting account: {err}", 500

    
@app.route('/check-session')
def check_session():
    if 'username' in session and 'role' in session:
        return jsonify({
            'loggedIn': True,
            'username': session['username'],
            'role': session['role']
        })
    return jsonify({'loggedIn': False})

# ---- LOGOUT ----

@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(url_for("home"))

# ---- RUN ----

if __name__ == "__main__":
    app.run(debug=True)
