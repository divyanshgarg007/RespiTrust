import hashlib
import hmac
import os
import secrets
import time
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import main as M  

router = APIRouter()

STAFF_TTL = 12 * 3600       
MAX_FAILS = 5               
LOCK_SECONDS = 300
PBKDF2_ROUNDS = 200_000
_fails = {}                  



def db():
    return M.get_db()


def now():
    return time.time()


def tlog(tag, msg=""):
    try:
        M.tlog(tag, msg)
    except Exception:
        print(f"[{tag}] {msg}", flush=True)


SCHEMA = """
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pw_salt TEXT NOT NULL,
    pw_hash TEXT NOT NULL,
    reg_no TEXT,
    speciality TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at REAL NOT NULL,
    last_login REAL
);
CREATE TABLE IF NOT EXISTS staff_sessions (
    token TEXT PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    history_id INTEGER NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    doctor_id INTEGER,
    status TEXT NOT NULL DEFAULT 'open',
    user_note TEXT,
    created_at REAL NOT NULL,
    claimed_at REAL,
    verdict TEXT,
    remarks TEXT,
    reviewed_at REAL
);
CREATE TABLE IF NOT EXISTS case_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    sender_role TEXT NOT NULL,
    sender_label TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    lang TEXT,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at REAL NOT NULL
);
"""


def _hash(pw: str, salt_hex: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(salt_hex), PBKDF2_ROUNDS).hex()


def _new_pw(pw: str):
    salt = secrets.token_hex(16)
    return salt, _hash(pw, salt)


def audit(actor, action, detail=""):
    conn = db()
    conn.execute(
        "INSERT INTO audit (actor, action, detail, created_at) VALUES (?,?,?,?)",
        (actor, action, str(detail)[:500], now()),
    )
    conn.commit()
    conn.close()


def create_staff(conn, email, name, role, password, reg_no=None, speciality=None):
    salt, h = _new_pw(password)
    conn.execute(
        "INSERT INTO staff (email, name, role, pw_salt, pw_hash, reg_no, speciality, active, created_at) "
        "VALUES (?,?,?,?,?,?,?,1,?)",
        (email.strip().lower(), name.strip(), role, salt, h, reg_no, speciality, now()),
    )


def init():
    conn = db()
    conn.executescript(SCHEMA)
    conn.commit()
    admin = conn.execute("SELECT id FROM staff WHERE role='admin' LIMIT 1").fetchone()
    if not admin:
        email = os.environ.get("RESPITRUST_ADMIN_EMAIL", "admin@respitrust.com").strip().lower()
        pw = os.environ.get("RESPITRUST_ADMIN_PASSWORD", "Admin@12345")
        create_staff(conn, email, "RespiTrust Admin", "admin", pw)
        conn.commit()
        print("=" * 64, flush=True)
        print(" ADMIN ACCOUNT CREATED (first run)", flush=True)
        print(f"   email   : {email}", flush=True)
        print(f"   password: {pw}", flush=True)
        print(" Change this password after your first login (Admin > Account).", flush=True)
        print(" Before putting the site online, set RESPITRUST_ADMIN_PASSWORD first.", flush=True)
        print("=" * 64, flush=True)
    conn.close()



def _bearer(authorization, token):
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1].strip()
    return token


def staff_required(authorization, token, role):
    t = _bearer(authorization, token)
    if not t:
        raise HTTPException(status_code=401, detail="Please log in.")
    conn = db()
    r = conn.execute(
        "SELECT s.*, ss.expires_at AS exp FROM staff_sessions ss "
        "JOIN staff s ON s.id = ss.staff_id WHERE ss.token = ?",
        (t,),
    ).fetchone()
    conn.close()
    if not r or r["exp"] < now() or not r["active"]:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    if role and r["role"] != role:
        raise HTTPException(status_code=403, detail="Not allowed.")
    return dict(r)


def user_phone(authorization, token=None):
    t = _bearer(authorization, token)
    if not t:
        return None
    conn = db()
    row = conn.execute("SELECT phone FROM sessions WHERE token = ?", (t,)).fetchone()
    conn.close()
    return row["phone"] if row else None


def user_required(authorization, token=None):
    p = user_phone(authorization, token)
    if not p:
        raise HTTPException(status_code=401, detail="Please log in.")
    return p


def mask_phone(p):
    if not p:
        return ""
    return ("*" * max(0, len(p) - 4)) + p[-4:]



class LoginBody(BaseModel):
    email: str = Field(..., max_length=200)
    password: str = Field(..., max_length=200)
    portal: str = Field(..., max_length=10)   # 'doctor' or 'admin'


@router.post("/api/staff/login")
def staff_login(body: LoginBody):
    email = body.email.strip().lower()
    portal = body.portal.strip().lower()
    if portal not in ("doctor", "admin"):
        raise HTTPException(status_code=400, detail="Unknown portal.")
    f = _fails.get(email)
    if f and f[1] > now():
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Try again in a few minutes.")

    conn = db()
    r = conn.execute("SELECT * FROM staff WHERE email = ?", (email,)).fetchone()
    ok = False
    if r:
        ok = hmac.compare_digest(_hash(body.password, r["pw_salt"]), r["pw_hash"])
    else:
        _hash(body.password, "00" * 16)  
    if not ok or r["role"] != portal or not r["active"]:
        conn.close()
        cnt = (f[0] if f else 0) + 1
        _fails[email] = [cnt, now() + LOCK_SECONDS if cnt >= MAX_FAILS else 0]
        if cnt >= MAX_FAILS:
            _fails[email][0] = 0
        tlog("PORTAL", f"login FAILED portal={portal} email={email}")
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    _fails.pop(email, None)
    tok = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO staff_sessions (token, staff_id, created_at, expires_at) VALUES (?,?,?,?)",
        (tok, r["id"], now(), now() + STAFF_TTL),
    )
    conn.execute("UPDATE staff SET last_login = ? WHERE id = ?", (now(), r["id"]))
    conn.execute("DELETE FROM staff_sessions WHERE expires_at < ?", (now(),))
    conn.commit()
    conn.close()
    audit(email, "login", portal)
    tlog("PORTAL", f"login OK portal={portal} email={email}")
    return {"token": tok, "role": r["role"], "name": r["name"], "email": r["email"]}


@router.post("/api/staff/logout")
def staff_logout(authorization: str = Header(default=None)):
    t = _bearer(authorization, None)
    if t:
        conn = db()
        conn.execute("DELETE FROM staff_sessions WHERE token = ?", (t,))
        conn.commit()
        conn.close()
    return {"ok": True}


@router.get("/api/staff/me")
def staff_me(authorization: str = Header(default=None)):
    s = staff_required(authorization, None, None)
    return {"name": s["name"], "email": s["email"], "role": s["role"],
            "reg_no": s["reg_no"], "speciality": s["speciality"]}


class ChangePwBody(BaseModel):
    old_password: str = Field(..., max_length=200)
    new_password: str = Field(..., min_length=8, max_length=200)


@router.post("/api/staff/change-password")
def change_password(body: ChangePwBody, authorization: str = Header(default=None)):
    s = staff_required(authorization, None, None)
    if not hmac.compare_digest(_hash(body.old_password, s["pw_salt"]), s["pw_hash"]):
        raise HTTPException(status_code=400, detail="Old password is wrong.")
    salt, h = _new_pw(body.new_password)
    conn = db()
    conn.execute("UPDATE staff SET pw_salt=?, pw_hash=? WHERE id=?", (salt, h, s["id"]))
    conn.commit()
    conn.close()
    audit(s["email"], "change_password")
    return {"ok": True}



def _scan(h):
    return {
        "history_id": h["id"],
        "prediction_key": h["prediction_key"],
        "confidence": h["confidence"],
        "region_text": h["region_text"],
        "created_at": h["created_at"],
    }


def _messages(conn, case_id):
    rows = conn.execute(
        "SELECT * FROM case_messages WHERE case_id = ? ORDER BY id ASC", (case_id,)
    ).fetchall()
    return [
        {"id": m["id"], "sender_role": m["sender_role"], "sender_label": m["sender_label"],
         "body": m["body"], "created_at": m["created_at"]}
        for m in rows
    ]


def _doctor_name(conn, doctor_id):
    if not doctor_id:
        return None
    r = conn.execute("SELECT name FROM staff WHERE id = ?", (doctor_id,)).fetchone()
    return r["name"] if r else None


def case_summary(conn, c, viewer):
    h = conn.execute("SELECT * FROM history WHERE id = ?", (c["history_id"],)).fetchone()
    last = conn.execute(
        "SELECT sender_role, created_at FROM case_messages WHERE case_id=? ORDER BY id DESC LIMIT 1", (c["id"],)
    ).fetchone()
    n = conn.execute("SELECT COUNT(*) AS n FROM case_messages WHERE case_id=?", (c["id"],)).fetchone()["n"]
    d = {
        "id": c["id"],
        "status": c["status"],
        "created_at": c["created_at"],
        "doctor_name": _doctor_name(conn, c["doctor_id"]),
        "verdict": c["verdict"],
        "message_count": n,
        "last_sender": last["sender_role"] if last else None,
        "last_at": last["created_at"] if last else None,
        "scan": _scan(h) if h else None,
    }
    if viewer == "doctor":
        d["patient"] = f"Patient #{c['id']} ({mask_phone(c['phone'])})"
    elif viewer == "admin":
        d["phone"] = c["phone"]
    return d


def case_detail(conn, c, viewer):
    d = case_summary(conn, c, viewer)
    d["user_note"] = c["user_note"]
    d["remarks"] = c["remarks"]
    d["reviewed_at"] = c["reviewed_at"]
    d["messages"] = _messages(conn, c["id"])
    d["previous_scans"] = []
    show_prev = viewer == "admin" or (viewer == "doctor" and c["doctor_id"] is not None)
    if show_prev:
        rows = conn.execute(
            "SELECT * FROM history WHERE phone = ? ORDER BY created_at DESC LIMIT 20", (c["phone"],)
        ).fetchall()
        d["previous_scans"] = [_scan(r) for r in rows]
    return d


def add_message(conn, case_id, role, label, body):
    conn.execute(
        "INSERT INTO case_messages (case_id, sender_role, sender_label, body, created_at) VALUES (?,?,?,?,?)",
        (case_id, role, label, body.strip(), now()),
    )


def history_image_response(conn, history_id, allowed_phone):
    row = conn.execute("SELECT * FROM history WHERE id = ?", (history_id,)).fetchone()
    if not row or row["phone"] != allowed_phone or not os.path.exists(row["image_path"]):
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(row["image_path"], media_type="image/png")


class MsgBody(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)



class NewCaseBody(BaseModel):
    history_id: int
    note: Optional[str] = Field(default="", max_length=1000)


@router.post("/api/cases")
def user_create_case(body: NewCaseBody, authorization: str = Header(default=None)):
    phone = user_required(authorization)
    conn = db()
    h = conn.execute("SELECT * FROM history WHERE id = ? AND phone = ?", (body.history_id, phone)).fetchone()
    if not h:
        conn.close()
        raise HTTPException(status_code=404, detail="Scan not found.")
    existing = conn.execute("SELECT * FROM cases WHERE history_id = ?", (body.history_id,)).fetchone()
    if existing:
        out = case_summary(conn, existing, "user")
        conn.close()
        return {"case": out, "already": True}
    cur = conn.execute(
        "INSERT INTO cases (history_id, phone, status, user_note, created_at) VALUES (?,?, 'open', ?, ?)",
        (body.history_id, phone, (body.note or "").strip(), now()),
    )
    cid = cur.lastrowid
    if (body.note or "").strip():
        add_message(conn, cid, "user", "Patient", body.note)
    conn.commit()
    c = conn.execute("SELECT * FROM cases WHERE id = ?", (cid,)).fetchone()
    out = case_summary(conn, c, "user")
    conn.close()
    tlog("CASE", f"new case #{cid} from ...{phone[-4:]} (scan {body.history_id})")
    return {"case": out, "already": False}


@router.get("/api/cases")
def user_cases(authorization: str = Header(default=None)):
    phone = user_required(authorization)
    conn = db()
    rows = conn.execute("SELECT * FROM cases WHERE phone = ? ORDER BY id DESC", (phone,)).fetchall()
    out = [case_summary(conn, c, "user") for c in rows]
    conn.close()
    return {"cases": out}


def _own_case(conn, case_id, phone):
    c = conn.execute("SELECT * FROM cases WHERE id = ? AND phone = ?", (case_id, phone)).fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")
    return c


@router.get("/api/cases/{case_id}")
def user_case_detail(case_id: int, authorization: str = Header(default=None)):
    phone = user_required(authorization)
    conn = db()
    c = _own_case(conn, case_id, phone)
    d = case_detail(conn, c, "user")
    conn.close()
    return d


@router.post("/api/cases/{case_id}/messages")
def user_post_message(case_id: int, body: MsgBody, authorization: str = Header(default=None)):
    phone = user_required(authorization)
    conn = db()
    c = _own_case(conn, case_id, phone)
    add_message(conn, c["id"], "user", "Patient", body.body)
    conn.commit()
    conn.close()
    tlog("CASE", f"#{case_id} patient says: {body.body[:80]}")
    return {"ok": True}


class ChatLogBody(BaseModel):
    role: str = Field(..., max_length=10)      
    text: str = Field(..., min_length=1, max_length=2000)
    lang: Optional[str] = Field(default="", max_length=5)


@router.post("/api/chatlog")
def chatlog(body: ChatLogBody, authorization: str = Header(default=None)):
    phone = user_phone(authorization)
    role = "user" if body.role == "user" else "bot"
    conn = db()
    conn.execute(
        "INSERT INTO chat_logs (phone, role, text, lang, created_at) VALUES (?,?,?,?,?)",
        (phone, role, body.text, body.lang, now()),
    )
    conn.commit()
    conn.close()
    return {"ok": True}



def _doctor_case(conn, case_id, doc):
    c = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not c or (c["doctor_id"] is not None and c["doctor_id"] != doc["id"]):
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")
    return c


@router.get("/api/doctor/cases")
def doctor_cases(filter: str = "open", authorization: str = Header(default=None)):
    doc = staff_required(authorization, None, "doctor")
    conn = db()
    if filter == "mine":
        rows = conn.execute(
            "SELECT * FROM cases WHERE doctor_id = ? AND status != 'reviewed' ORDER BY id DESC", (doc["id"],)
        ).fetchall()
    elif filter == "reviewed":
        rows = conn.execute(
            "SELECT * FROM cases WHERE doctor_id = ? AND status = 'reviewed' ORDER BY reviewed_at DESC", (doc["id"],)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM cases WHERE doctor_id IS NULL ORDER BY id DESC").fetchall()
    out = [case_summary(conn, c, "doctor") for c in rows]
    conn.close()
    return {"cases": out}


@router.get("/api/doctor/cases/{case_id}")
def doctor_case(case_id: int, authorization: str = Header(default=None)):
    doc = staff_required(authorization, None, "doctor")
    conn = db()
    c = _doctor_case(conn, case_id, doc)
    d = case_detail(conn, c, "doctor")
    conn.close()
    return d


@router.post("/api/doctor/cases/{case_id}/claim")
def doctor_claim(case_id: int, authorization: str = Header(default=None)):
    doc = staff_required(authorization, None, "doctor")
    conn = db()
    c = _doctor_case(conn, case_id, doc)
    if c["doctor_id"] is None:
        conn.execute(
            "UPDATE cases SET doctor_id=?, status='in_review', claimed_at=? WHERE id=? AND doctor_id IS NULL",
            (doc["id"], now(), case_id),
        )
        add_message(conn, case_id, "system", "System", f"{doc['name']} has taken your case.")
        conn.commit()
    conn.close()
    audit(doc["email"], "claim_case", case_id)
    tlog("CASE", f"#{case_id} taken by {doc['name']}")
    return {"ok": True}


@router.post("/api/doctor/cases/{case_id}/messages")
def doctor_post_message(case_id: int, body: MsgBody, authorization: str = Header(default=None)):
    doc = staff_required(authorization, None, "doctor")
    conn = db()
    c = _doctor_case(conn, case_id, doc)
    if c["doctor_id"] != doc["id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Take the case first.")
    add_message(conn, case_id, "doctor", doc["name"], body.body)
    conn.commit()
    conn.close()
    tlog("CASE", f"#{case_id} {doc['name']} says: {body.body[:80]}")
    return {"ok": True}


class ReviewBody(BaseModel):
    verdict: str = Field(..., max_length=20)     # agree | disagree | need_more
    remarks: str = Field(..., min_length=1, max_length=3000)


@router.post("/api/doctor/cases/{case_id}/review")
def doctor_review(case_id: int, body: ReviewBody, authorization: str = Header(default=None)):
    doc = staff_required(authorization, None, "doctor")
    if body.verdict not in ("agree", "disagree", "need_more"):
        raise HTTPException(status_code=400, detail="Bad verdict.")
    conn = db()
    c = _doctor_case(conn, case_id, doc)
    if c["doctor_id"] != doc["id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Take the case first.")
    conn.execute(
        "UPDATE cases SET verdict=?, remarks=?, reviewed_at=?, status='reviewed' WHERE id=?",
        (body.verdict, body.remarks.strip(), now(), case_id),
    )
    add_message(conn, case_id, "system", "System", f"{doc['name']} has completed the review.")
    conn.commit()
    conn.close()
    audit(doc["email"], "review_case", f"{case_id}:{body.verdict}")
    tlog("CASE", f"#{case_id} reviewed by {doc['name']} verdict={body.verdict}")
    return {"ok": True}


@router.get("/api/doctor/cases/{case_id}/image")
def doctor_image(case_id: int, history_id: Optional[int] = None, token: str = None,
                 authorization: str = Header(default=None)):
    doc = staff_required(authorization, token, "doctor")
    conn = db()
    c = _doctor_case(conn, case_id, doc)
    hid = history_id or c["history_id"]
    if hid != c["history_id"] and c["doctor_id"] != doc["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Take the case first.")
    resp = history_image_response(conn, hid, c["phone"])
    conn.close()
    return resp



@router.get("/api/admin/overview")
def admin_overview(authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    conn = db()

    def one(sql, args=()):
        return conn.execute(sql, args).fetchone()[0]

    day = now() - 86400
    out = {
        "users": one("SELECT COUNT(*) FROM (SELECT phone FROM history UNION SELECT phone FROM sessions)"),
        "scans": one("SELECT COUNT(*) FROM history"),
        "scans_24h": one("SELECT COUNT(*) FROM history WHERE created_at > ?", (day,)),
        "doctors": one("SELECT COUNT(*) FROM staff WHERE role='doctor' AND active=1"),
        "cases_open": one("SELECT COUNT(*) FROM cases WHERE status='open'"),
        "cases_in_review": one("SELECT COUNT(*) FROM cases WHERE status='in_review'"),
        "cases_reviewed": one("SELECT COUNT(*) FROM cases WHERE status='reviewed'"),
        "messages": one("SELECT COUNT(*) FROM case_messages WHERE sender_role IN ('user','doctor')"),
        "chat_logs": one("SELECT COUNT(*) FROM chat_logs"),
        "verdict_agree": one("SELECT COUNT(*) FROM cases WHERE verdict='agree'"),
        "verdict_disagree": one("SELECT COUNT(*) FROM cases WHERE verdict='disagree'"),
        "verdict_need_more": one("SELECT COUNT(*) FROM cases WHERE verdict='need_more'"),
    }
    conn.close()
    return out


@router.get("/api/admin/users")
def admin_users(authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    conn = db()
    rows = conn.execute(
        """
        SELECT p.phone,
               (SELECT COUNT(*) FROM history h WHERE h.phone = p.phone) AS scans,
               (SELECT MAX(created_at) FROM history h WHERE h.phone = p.phone) AS last_scan,
               (SELECT COUNT(*) FROM cases c WHERE c.phone = p.phone) AS cases,
               (SELECT COUNT(*) FROM chat_logs l WHERE l.phone = p.phone) AS chat_msgs
        FROM (SELECT phone FROM history UNION SELECT phone FROM sessions) p
        ORDER BY last_scan DESC
        """
    ).fetchall()
    conn.close()
    return {"users": [dict(r) for r in rows]}


@router.get("/api/admin/cases")
def admin_cases(status: str = "", authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    conn = db()
    if status in ("open", "in_review", "reviewed"):
        rows = conn.execute("SELECT * FROM cases WHERE status = ? ORDER BY id DESC", (status,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM cases ORDER BY id DESC").fetchall()
    out = [case_summary(conn, c, "admin") for c in rows]
    conn.close()
    return {"cases": out}


@router.get("/api/admin/cases/{case_id}")
def admin_case(case_id: int, authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    conn = db()
    c = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")
    d = case_detail(conn, c, "admin")
    conn.close()
    return d


@router.get("/api/admin/cases/{case_id}/image")
def admin_image(case_id: int, history_id: Optional[int] = None, token: str = None,
                authorization: str = Header(default=None)):
    staff_required(authorization, token, "admin")
    conn = db()
    c = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")
    resp = history_image_response(conn, history_id or c["history_id"], c["phone"])
    conn.close()
    return resp


@router.get("/api/admin/messages")
def admin_messages(limit: int = 200, authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    limit = max(1, min(limit, 1000))
    conn = db()
    rows = conn.execute(
        "SELECT m.*, c.phone FROM case_messages m JOIN cases c ON c.id = m.case_id ORDER BY m.id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return {"messages": [
        {"id": r["id"], "case_id": r["case_id"], "phone": r["phone"], "sender_role": r["sender_role"],
         "sender_label": r["sender_label"], "body": r["body"], "created_at": r["created_at"]}
        for r in rows
    ]}


@router.get("/api/admin/chatlogs")
def admin_chatlogs(phone: str = "", limit: int = 300, authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    limit = max(1, min(limit, 2000))
    conn = db()
    if phone:
        rows = conn.execute(
            "SELECT * FROM chat_logs WHERE phone = ? ORDER BY id DESC LIMIT ?", (phone, limit)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM chat_logs ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return {"logs": [dict(r) for r in rows]}


@router.get("/api/admin/doctors")
def admin_doctors(authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    conn = db()
    rows = conn.execute(
        "SELECT id, email, name, reg_no, speciality, active, created_at, last_login "
        "FROM staff WHERE role='doctor' ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return {"doctors": [dict(r) for r in rows]}


class NewDoctorBody(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    name: str = Field(..., min_length=2, max_length=120)
    password: str = Field(..., min_length=8, max_length=200)
    reg_no: Optional[str] = Field(default="", max_length=60)
    speciality: Optional[str] = Field(default="", max_length=200)


@router.post("/api/admin/doctors")
def admin_add_doctor(body: NewDoctorBody, authorization: str = Header(default=None)):
    adm = staff_required(authorization, None, "admin")
    if "@" not in body.email or "." not in body.email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Enter a valid email.")
    conn = db()
    try:
        create_staff(conn, body.email, body.name, "doctor", body.password, body.reg_no, body.speciality)
        conn.commit()
    except Exception:
        conn.close()
        raise HTTPException(status_code=400, detail="This email is already registered.")
    conn.close()
    audit(adm["email"], "add_doctor", body.email)
    return {"ok": True}


class ActiveBody(BaseModel):
    active: bool


@router.post("/api/admin/doctors/{doc_id}/active")
def admin_doctor_active(doc_id: int, body: ActiveBody, authorization: str = Header(default=None)):
    adm = staff_required(authorization, None, "admin")
    conn = db()
    conn.execute("UPDATE staff SET active=? WHERE id=? AND role='doctor'", (1 if body.active else 0, doc_id))
    if not body.active:
        conn.execute("DELETE FROM staff_sessions WHERE staff_id = ?", (doc_id,))
    conn.commit()
    conn.close()
    audit(adm["email"], "doctor_active", f"{doc_id}:{body.active}")
    return {"ok": True}


class ResetPwBody(BaseModel):
    password: str = Field(..., min_length=8, max_length=200)


@router.post("/api/admin/doctors/{doc_id}/password")
def admin_doctor_password(doc_id: int, body: ResetPwBody, authorization: str = Header(default=None)):
    adm = staff_required(authorization, None, "admin")
    salt, h = _new_pw(body.password)
    conn = db()
    conn.execute("UPDATE staff SET pw_salt=?, pw_hash=? WHERE id=? AND role='doctor'", (salt, h, doc_id))
    conn.execute("DELETE FROM staff_sessions WHERE staff_id = ?", (doc_id,))
    conn.commit()
    conn.close()
    audit(adm["email"], "doctor_password_reset", doc_id)
    return {"ok": True}


@router.get("/api/admin/audit")
def admin_audit(limit: int = 200, authorization: str = Header(default=None)):
    staff_required(authorization, None, "admin")
    limit = max(1, min(limit, 1000))
    conn = db()
    rows = conn.execute("SELECT * FROM audit ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return {"audit": [dict(r) for r in rows]}



def install(app):
    init()
    app.include_router(router)
    tlog("PORTAL", "doctor + admin portals + cases enabled")
