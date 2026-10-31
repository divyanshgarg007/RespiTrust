import argparse
import hashlib
import secrets
import sqlite3
import sys
import time

DB_PATH = "respitrust.db"      
ROUNDS = 200_000               


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("email")
    ap.add_argument("password")
    ap.add_argument("--reg", default="")
    ap.add_argument("--speciality", default="")
    a = ap.parse_args()

    if len(a.password) < 8:
        sys.exit("Password must be at least 8 characters.")
    if "@" not in a.email or "." not in a.email.split("@")[-1]:
        sys.exit("Enter a valid email.")

    conn = sqlite3.connect(DB_PATH)
    has = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='staff'").fetchone()
    if not has:
        sys.exit("Table 'staff' not found. Start the backend once with main_portals:app, then run this again "
                 "(and run it from the backend folder).")

    email = a.email.strip().lower()
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", a.password.encode("utf-8"), bytes.fromhex(salt), ROUNDS).hex()
    row = conn.execute("SELECT id, role FROM staff WHERE email = ?", (email,)).fetchone()
    if row:
        if row[1] != "doctor":
            sys.exit("This email belongs to a non-doctor account. Use another email.")
        conn.execute("UPDATE staff SET name=?, pw_salt=?, pw_hash=?, active=1, reg_no=?, speciality=? WHERE id=?",
                     (a.name, salt, h, a.reg, a.speciality, row[0]))
        conn.execute("DELETE FROM staff_sessions WHERE staff_id = ?", (row[0],))
        print("Doctor already existed: password reset and account enabled.")
    else:
        conn.execute("INSERT INTO staff (email, name, role, pw_salt, pw_hash, reg_no, speciality, active, created_at) "
                     "VALUES (?,?,?,?,?,?,?,1,?)", (email, a.name, "doctor", salt, h, a.reg, a.speciality, time.time()))
        print("Doctor created.")
    conn.commit()
    conn.close()
    print(f"  Login page : http://localhost:5500/doctor.html\n  Email      : {email}\n  Password   : (the one you typed)")


if __name__ == "__main__":
    main()
