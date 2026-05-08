from flask import Blueprint, request, jsonify, session
from datetime import datetime
import razorpay
from db import db
from db import client

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/proceed_to_payment', methods=['POST'])
def proceed_to_payment():

    if 'user_id' not in session:
        return jsonify({
            "success": False,
            "message": "Login required"
        })

    data = request.get_json()

    worker_id = data.get('worker_id')
    date = data['date']
    time = datetime.strptime(
                data['time'],
                "%I:%M %p"
            ).strftime("%H:%M:%S")
    amount = data.get('fee', 0)
    service = data['department']
    contact = data['contact']

    user_id = session['user_id']

    cursor = db.cursor(dictionary=True)
    if not worker_id:
        cursor.execute("""
            SELECT w.id, w.fee
            FROM workers w

            JOIN worker_departments wd
            ON w.id = wd.worker_id

            JOIN departments d
            ON d.id = wd.department_id

            WHERE d.name = %s
            AND w.status = 'available'
            AND w.id NOT IN (
                SELECT worker_id
                FROM bookings
                WHERE date = %s
                AND time = %s
                AND status IN ('Pending Payment','Confirmed')
            )
            ORDER BY RAND()
            LIMIT 1
        """, (service, date, time))

        worker = cursor.fetchone()
        if not worker:
            cursor.close()
            return jsonify({
                "success": False,
                "message": "No workers available"
            })
        worker_id = worker['id']
        amount = worker['fee']

    # DELETE old pending bookings older than 5 mins
    cursor.execute("""
        DELETE FROM bookings
        WHERE status='Pending Payment'
        AND created_at < NOW() - INTERVAL 5 MINUTE
    """)

    db.commit()

    # Check slot already booked
    cursor.execute("""
        SELECT * FROM bookings
        WHERE worker_id=%s
        AND date=%s
        AND time=%s
        AND status IN ('Pending Payment','Confirmed')
    """, (worker_id, date, time))

    existing = cursor.fetchone()

    if existing:
        cursor.close()
        return jsonify({
            "success": False,
            "message": "Slot already booked"
        })

    # Create temporary booking
    cursor.execute("""
        INSERT INTO bookings (
            user_id,
            worker_id,
            service,
            date,
            time,
            contact,
            status
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_id,
        worker_id,
        service,
        date,
        time,
        contact,
        'Pending Payment'
    ))

    booking_id = cursor.lastrowid

    db.commit()

    # Create Razorpay order
    order = client.order.create({
        "amount": int(amount * 100),
        "currency": "INR",
        "payment_capture": 1
    })

    razorpay_order_id = order['id']

    # Insert payment record
    cursor.execute("""
        INSERT INTO payments (
            booking_id,
            user_id,
            worker_id,
            amount,
            payment_status,
            razorpay_order_id
        )
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (
        booking_id,
        user_id,
        worker_id,
        amount,
        'Pending',
        razorpay_order_id
    ))

    db.commit()
    cursor.close()
    
    return jsonify({
        "success": True,
        "key": "rzp_test_Smfc6G29sD2iUM",
        "amount": amount,
        "order_id": razorpay_order_id,
        "booking_id": booking_id
    })
    
@payment_bp.route('/payment_success', methods=['POST'])
def payment_success():

    data = request.get_json()

    order_id = data['order_id']
    payment_id = data['payment_id']

    cursor = db.cursor()

    # Update payment
    cursor.execute("""
        UPDATE payments
        SET payment_status='Paid',
            transaction_id=%s
        WHERE razorpay_order_id=%s
    """, (payment_id, order_id))

    # Confirm booking
    cursor.execute("""
        UPDATE bookings
        SET status='Confirmed'
        WHERE id=(
            SELECT booking_id
            FROM payments
            WHERE razorpay_order_id=%s
        )
    """, (order_id,))

    db.commit()
    cursor.close()
    
    return jsonify({
        "success": True
    })

@payment_bp.route('/payment_cancel', methods=['POST'])
def payment_cancel():
    data = request.get_json()
    order_id = data['order_id']
    
    cursor = db.cursor()
    # Get booking id
    cursor.execute("""
        SELECT booking_id
        FROM payments
        WHERE razorpay_order_id=%s
    """, (order_id,))
    
    booking = cursor.fetchone()
    
    if booking:
        booking_id = booking[0]
        # Delete payment
        cursor.execute("""
            DELETE FROM payments
            WHERE booking_id=%s
        """, (booking_id,))

        # Delete booking
        cursor.execute("""
            DELETE FROM bookings
            WHERE id=%s
        """, (booking_id,))

        db.commit()
        cursor.close()

    return jsonify({
        "success": True
    })