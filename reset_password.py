from werkzeug.security import generate_password_hash
import mysql.connector

password = "Niraj@123"
email = "niraj12@gmail.com"

hashed = generate_password_hash(password, method="scrypt")

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="niraj19",
    database="service_booking"
)

cursor = conn.cursor()
cursor.execute(
    "UPDATE workers SET password=%s WHERE email=%s",
    (hashed, email)
)
conn.commit()

print("Password reset successfully")

cursor.close()
conn.close()
