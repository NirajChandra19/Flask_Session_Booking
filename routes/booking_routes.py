from flask import Blueprint, render_template, request, jsonify, session, redirect
from datetime import datetime, time, timedelta
from db import db

booking_bp = Blueprint('booking', __name__)


# ================================
# Generate Time Slots
# ================================
def generate_slots(start_time, end_time):
    slots = []
    start = datetime.strptime(
        str(start_time),
        "%H:%M:%S"
    )

    end = datetime.strptime(
        str(end_time),
        "%H:%M:%S"
    )

    while start < end:
        slots.append(
            start.strftime("%I:%M %p")
        )
        start += timedelta(hours=1)
    return slots

# ================================
# Booking Page
# ================================
@booking_bp.route("/book-service-page")
def book_service_page():
    if "user_id" not in session:
        return redirect("/login")

    selected_worker_id = request.args.get("worker_id")
    selected_date = request.args.get("date")
    
    cursor = db.cursor(dictionary=True)

    selected_worker = None
    selected_department_name = None
    departments = []
    slots = []

    # ==========================================
    # SELECTED WORKER BOOKING
    # ==========================================
    if selected_worker_id:
        # Fetch worker with availability
        cursor.execute("""
            SELECT
                id,
                name,
                fee,
                available_from,
                available_to
            FROM workers
            WHERE id = %s
        """, (selected_worker_id,))

        selected_worker = cursor.fetchone()

        # Generate worker slots
        if selected_worker:
            slots = generate_slots(
                selected_worker['available_from'],
                selected_worker['available_to']
            )
        
        cursor.execute("""
            SELECT time
            FROM bookings
            WHERE worker_id = %s
            AND date = %s
            AND status IN (
                'Pending Payment',
                'Confirmed'
            )
        """, (selected_worker_id,selected_date))

        booked_slots = cursor.fetchall()

        booked_times = []

        for b in booked_slots:

            booked_times.append(
                datetime.strptime(
                    str(b['time']),
                    "%H:%M:%S"
                ).strftime("%I:%M %p")
            )

        slots = [
            slot for slot in slots
            if slot not in booked_times
        ]
        # Fetch worker department
        cursor.execute("""
            SELECT d.name
            FROM departments d
            JOIN worker_departments wd
            ON d.id = wd.department_id
            WHERE wd.worker_id = %s
            LIMIT 1
        """, (selected_worker_id,))
        dept = cursor.fetchone()

        if dept:
            selected_department_name = dept["name"]
    # ==========================================
    # EMERGENCY BOOKING
    # ==========================================
    else:
        # Show all departments
        cursor.execute("""
            SELECT name
            FROM departments
        """)
        departments = cursor.fetchall()
        # General slots
        slots = [
            "09:00 AM",
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "01:00 PM",
            "02:00 PM",
            "03:00 PM",
            "04:00 PM"
        ]
    cursor.close()
    
    return render_template(
        "booking.html",
        selected_worker=selected_worker,
        selected_department_name=selected_department_name,
        departments=departments,
        slots=slots
    )
    
# ---- BOOKING ----
def time_to_minutes(t):
    if isinstance(t, timedelta):
        return t.seconds // 60
    if isinstance(t, time):
        return t.hour * 60 + t.minute
    return None

# @booking_bp.route('/book', methods=['POST'])
# def book_service():
#     if 'user_id' not in session:
#         return jsonify({'error': 'User not logged in'}), 401

#     data = request.get_json()

#     department_name = data.get('department')
#     date_str = data.get('date')
#     time_str = data.get('time')
#     contact = data.get('contact')
#     selected_worker_id = data.get('worker_id')

#     if not all([department_name, date_str, time_str, contact]):
#         return jsonify({'error': 'Missing required fields'}), 400

#     try:
#         # Convert frontend AM/PM time
#         booking_datetime = datetime.strptime(
#             f"{date_str} {time_str}",
#             "%Y-%m-%d %I:%M %p"
#         )
#         # Prevent past booking
#         if booking_datetime < datetime.now():
#             return jsonify({
#                 'error': 'Cannot book past time'
#             }), 400
#     except ValueError:
#         return jsonify({
#             'error': 'Invalid date or time format'
#         }), 400

#     booking_time = booking_datetime.time()
#     booking_minutes = time_to_minutes(booking_time)

#     user_id = session['user_id']
#     cursor = db.cursor(dictionary=True)

#     # ------------------------------
#     # GET DEPARTMENT BY NAME
#     # ------------------------------
#     cursor.execute(
#         "SELECT id, name FROM departments WHERE name = %s",
#         (department_name,)
#     )
#     dept = cursor.fetchone()

#     if not dept:
#         cursor.close()
#         return jsonify({'error': 'Invalid department selected'}), 400

#     department_id = dept['id']
#     service_name = dept['name']

#     # ==================================================
#     # CASE 1: SELECTED (LOCKED) WORKER
#     # ==================================================
#     if selected_worker_id:
#         worker_id = int(selected_worker_id)

#         cursor.execute("""
#             SELECT available_from, available_to, status
#             FROM workers
#             WHERE id = %s
#         """, (worker_id,))
#         worker = cursor.fetchone()

#         if not worker or worker['status'] != 'available':
#             cursor.close()
#             return jsonify({'error': 'Selected worker not available'}), 400

#         from_minutes = time_to_minutes(worker['available_from'])
#         to_minutes = time_to_minutes(worker['available_to'])

#         if not (from_minutes <= booking_minutes < to_minutes):
#             cursor.close()
#             return jsonify({'error': 'Worker not available at selected time'}), 400

#         cursor.execute("""
#             SELECT 1 FROM worker_departments
#             WHERE worker_id = %s AND department_id = %s
#         """, (worker_id, department_id))

#         if not cursor.fetchone():
#             cursor.close()
#             return jsonify({'error': 'Worker not in selected department'}), 400

#         cursor.execute("""
#             SELECT time FROM bookings
#             WHERE worker_id = %s AND date = %s AND status = 'booked'
#         """, (worker_id, date_str))
#         bookings = cursor.fetchall()

#         for b in bookings:
#             try:
#                 existing_dt = datetime.strptime(
#                     f"{date_str} {b['time']}", "%Y-%m-%d %H:%M:%S"
#                 )
#             except ValueError:
#                 existing_dt = datetime.strptime(
#                     f"{date_str} {b['time']}", "%Y-%m-%d %H:%M"
#                 )

#             if abs((existing_dt - booking_datetime).total_seconds()) < 3600:
#                 cursor.close()
#                 return jsonify({'error': 'Worker already booked near this time'}), 400

#         assigned_worker_id = worker_id

#     # ==================================================
#     # CASE 2: EMERGENCY BOOKING (AUTO ASSIGN)
#     # ==================================================
#     else:
#         cursor.execute("""
#             SELECT w.id, w.available_from, w.available_to
#             FROM workers w
#             JOIN worker_departments wd ON w.id = wd.worker_id
#             WHERE wd.department_id = %s
#             AND w.status = 'available'
#         """, (department_id,))
#         workers = cursor.fetchall()

#         assigned_worker_id = None

#         for w in workers:
#             from_m = time_to_minutes(w['available_from'])
#             to_m = time_to_minutes(w['available_to'])

#             if not (from_m <= booking_minutes < to_m):
#                 continue

#             cursor.execute("""
#                 SELECT time FROM bookings
#                 WHERE worker_id = %s AND date = %s AND status = 'booked'
#             """, (w['id'], date_str))
#             bookings = cursor.fetchall()

#             conflict = False
#             for b in bookings:
#                 try:
#                     existing_dt = datetime.strptime(
#                         f"{date_str} {b['time']}", "%Y-%m-%d %H:%M:%S"
#                     )
#                 except ValueError:
#                     existing_dt = datetime.strptime(
#                         f"{date_str} {b['time']}", "%Y-%m-%d %H:%M"
#                     )

#                 if abs((existing_dt - booking_datetime).total_seconds()) < 3600:
#                     conflict = True
#                     break

#             if not conflict:
#                 assigned_worker_id = w['id']
#                 break

#         if not assigned_worker_id:
#             cursor.close()
#             return jsonify({'error': 'All workers are busy'}), 400

#     # ------------------------------
#     # INSERT BOOKING
#     # ------------------------------
#     cursor.execute("""
#         INSERT INTO bookings
#         (user_id, worker_id, service, date, time, contact, status)

#         VALUES (%s, %s, %s, %s, %s, %s, 'booked')
#     """, (
#         user_id,
#         assigned_worker_id,
#         service_name,
#         date_str,
#         booking_datetime.strftime("%H:%M:%S"),
#         contact
#     ))

#     db.commit()
#     cursor.close()

#     return jsonify({
#         'message': 'Booking successful!',
#         'worker_id': assigned_worker_id
#     }), 200
