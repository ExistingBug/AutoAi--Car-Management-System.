"""
auth.py — Minimal authentication & image‑upload backend
Uses SQLite (zero‑config) + Flask sessions + werkzeug password hashing.
"""

import os
import uuid
import sqlite3
from functools import wraps
from datetime import datetime

from flask import (
    Blueprint, request, redirect, url_for,
    session, jsonify, current_app, send_from_directory
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# ─────────────────────────────────────────────────────────────
# Blueprint
# ─────────────────────────────────────────────────────────────

auth_bp = Blueprint("auth", __name__)

# Allowed image and document extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "pdf", "doc", "docx"}

def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ─────────────────────────────────────────────────────────────
# Database helpers
# ─────────────────────────────────────────────────────────────

def _get_db():
    """Return a connection to the SQLite database (creates file if needed)."""
    db_path = os.path.join(current_app.root_path, "vahansathi.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row          # dict‑like rows
    conn.execute("PRAGMA journal_mode=WAL") # better concurrency
    return conn


def init_db():
    """Create the tables if they don't already exist."""
    conn = _get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            email       TEXT    NOT NULL UNIQUE,
            phone       TEXT    NOT NULL DEFAULT '',
            password    TEXT    NOT NULL,
            avatar_path TEXT    DEFAULT '',
            created_at  TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS uploads (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            filename    TEXT    NOT NULL,
            original    TEXT    NOT NULL,
            mime_type   TEXT    DEFAULT '',
            size_bytes  INTEGER DEFAULT 0,
            uploaded_at TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS car_documents (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            car_name    TEXT,
            doc_type    TEXT,
            issue_date  TEXT,
            expiry_date TEXT,
            notes       TEXT,
            file_paths  TEXT,
            created_at  TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS service_records (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL,
            car_name       TEXT,
            service_type   TEXT,
            date           TEXT,
            center         TEXT,
            odo            TEXT,
            cost           TEXT,
            notes          TEXT,
            next_due       TEXT,
            file_paths     TEXT,
            created_at     TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS insurance_records (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL,
            provider       TEXT,
            policy         TEXT,
            valid_from     TEXT,
            valid_until    TEXT,
            file_paths     TEXT,
            created_at     TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()
    print("✅ Database tables ready")


# ─────────────────────────────────────────────────────────────
# Login‑required decorator
# ─────────────────────────────────────────────────────────────

def login_required(f):
    """Redirect to login page if user is not authenticated."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("home"))
        return f(*args, **kwargs)
    return decorated


# ─────────────────────────────────────────────────────────────
# Auth routes
# ─────────────────────────────────────────────────────────────

@auth_bp.route("/api/register", methods=["POST"])
def register():
    """
    Register a new user.
    Accepts multipart/form‑data with:
        name, email, phone, password, avatar (file, optional)
    """
    name     = request.form.get("name", "").strip()
    email    = request.form.get("email", "").strip().lower()
    phone    = request.form.get("phone", "").strip()
    password = request.form.get("password", "").strip()
    avatar   = request.files.get("avatar")

    # ── Validation ──
    if not name:
        return jsonify({"ok": False, "error": "Name is required"}), 400
    if not email or "@" not in email:
        return jsonify({"ok": False, "error": "Valid email is required"}), 400
    if not password or len(password) < 8:
        return jsonify({"ok": False, "error": "Password must be ≥ 8 characters"}), 400

    conn = _get_db()

    # Check duplicate
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"ok": False, "error": "Email already registered"}), 409

    # ── Save avatar (if provided) ──
    avatar_path = ""
    if avatar and avatar.filename and _allowed_file(avatar.filename):
        upload_dir = os.path.join(current_app.root_path, "uploads", "avatars")
        os.makedirs(upload_dir, exist_ok=True)
        ext = avatar.filename.rsplit(".", 1)[1].lower()
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        avatar.save(os.path.join(upload_dir, safe_name))
        avatar_path = f"avatars/{safe_name}"

    # ── Insert user ──
    hashed = generate_password_hash(password)
    now = datetime.utcnow().isoformat()
    cur = conn.execute(
        "INSERT INTO users (name, email, phone, password, avatar_path, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (name, email, phone, hashed, avatar_path, now),
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()

    # Auto‑login after register
    session["user_id"]   = user_id
    session["user_name"] = name
    session["user_email"] = email

    return jsonify({"ok": True, "message": "Account created", "user_id": user_id})


@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    """
    Log in with JSON or form data: { email, password }
    """
    # Accept both JSON and form‑data
    if request.is_json:
        data = request.get_json()
        email    = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
    else:
        email    = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

    if not email or not password:
        return jsonify({"ok": False, "error": "Email and password are required"}), 400

    conn = _get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"ok": False, "error": "Invalid email or password"}), 401

    session["user_id"]    = user["id"]
    session["user_name"]  = user["name"]
    session["user_email"] = user["email"]

    return jsonify({
        "ok": True,
        "message": "Logged in",
        "user": {
            "id":     user["id"],
            "name":   user["name"],
            "email":  user["email"],
            "avatar": user["avatar_path"],
        }
    })


@auth_bp.route("/api/logout", methods=["POST"])
def api_logout():
    """Clear server session → log out."""
    session.clear()
    return jsonify({"ok": True, "message": "Logged out"})


@auth_bp.route("/api/me")
def me():
    """Return the currently‑logged‑in user (or 401)."""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "Not authenticated"}), 401

    conn = _get_db()
    user = conn.execute("SELECT id, name, email, phone, avatar_path, created_at FROM users WHERE id = ?",
                        (session["user_id"],)).fetchone()
    conn.close()

    if not user:
        session.clear()
        return jsonify({"ok": False, "error": "User not found"}), 401

    return jsonify({
        "ok": True,
        "user": dict(user)
    })


# ─────────────────────────────────────────────────────────────
# Image upload routes
# ─────────────────────────────────────────────────────────────

@auth_bp.route("/api/upload", methods=["POST"])
def upload_image():
    """
    Upload one or more images.  Requires login.
    Accepts multipart/form‑data with field name 'images' (multiple allowed).
    """
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "Login required"}), 401

    files = request.files.getlist("images")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"ok": False, "error": "No files selected"}), 400

    upload_dir = os.path.join(current_app.root_path, "uploads", "images")
    os.makedirs(upload_dir, exist_ok=True)

    saved = []
    conn = _get_db()
    now = datetime.utcnow().isoformat()

    for f in files:
        if not f.filename or not _allowed_file(f.filename):
            continue

        original = secure_filename(f.filename)
        ext = original.rsplit(".", 1)[1].lower()
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        dest = os.path.join(upload_dir, safe_name)
        f.save(dest)
        size = os.path.getsize(dest)

        conn.execute(
            "INSERT INTO uploads (user_id, filename, original, mime_type, size_bytes, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)",
            (session["user_id"], safe_name, original, f.content_type or "", size, now),
        )

        saved.append({
            "filename": safe_name,
            "original": original,
            "size":     size,
            "url":      f"/uploads/images/{safe_name}",
        })

    conn.commit()
    conn.close()

    if not saved:
        return jsonify({"ok": False, "error": "No valid image files found"}), 400

    return jsonify({"ok": True, "uploaded": saved, "count": len(saved)})


@auth_bp.route("/api/uploads", methods=["GET"])
def list_uploads():
    """Return all images uploaded by the current user."""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "Login required"}), 401

    conn = _get_db()
    rows = conn.execute(
        "SELECT id, filename, original, mime_type, size_bytes, uploaded_at FROM uploads WHERE user_id = ? ORDER BY uploaded_at DESC",
        (session["user_id"],),
    ).fetchall()
    conn.close()

    uploads = []
    for r in rows:
        uploads.append({
            **dict(r),
            "url": f"/uploads/images/{r['filename']}",
        })

    return jsonify({"ok": True, "uploads": uploads})


@auth_bp.route("/api/uploads/<int:upload_id>", methods=["DELETE"])
def delete_upload(upload_id):
    """Delete an uploaded image (owner only)."""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "Login required"}), 401

    conn = _get_db()
    row = conn.execute("SELECT * FROM uploads WHERE id = ? AND user_id = ?",
                       (upload_id, session["user_id"])).fetchone()
    if not row:
        conn.close()
        return jsonify({"ok": False, "error": "Upload not found"}), 404

    # Remove file from disk
    path = os.path.join(current_app.root_path, "uploads", "images", row["filename"])
    if os.path.exists(path):
        os.remove(path)

    conn.execute("DELETE FROM uploads WHERE id = ?", (upload_id,))
    conn.commit()
    conn.close()

    return jsonify({"ok": True, "message": "Deleted"})

# ─────────────────────────────────────────────────────────────
# Minimal Record Endpoints
# ─────────────────────────────────────────────────────────────

def _save_attached_files(files):
    """Helper to save uploaded files and return comma-separated URLs."""
    urls = []
    upload_dir = os.path.join(current_app.root_path, "uploads", "images")
    os.makedirs(upload_dir, exist_ok=True)
    for f in files:
        if not f.filename or not _allowed_file(f.filename): continue
        ext = f.filename.rsplit(".", 1)[1].lower()
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        f.save(os.path.join(upload_dir, safe_name))
        urls.append(f"/uploads/images/{safe_name}")
    return ",".join(urls)

@auth_bp.route("/api/records/document", methods=["GET", "POST"])
def api_car_documents():
    if "user_id" not in session: return jsonify({"ok":False, "error":"Login required"}), 401
    conn = _get_db()
    if request.method == "POST":
        user_id = session["user_id"]
        car_name = request.form.get("car", "")
        doc_type = request.form.get("doc_type", "")
        issue = request.form.get("issue", "")
        expiry = request.form.get("expiry", "")
        notes = request.form.get("notes", "")
        files = request.files.getlist("images")
        file_paths = _save_attached_files(files)
        now = datetime.utcnow().isoformat()
        cur = conn.execute(
            "INSERT INTO car_documents (user_id, car_name, doc_type, issue_date, expiry_date, notes, file_paths, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (user_id, car_name, doc_type, issue, expiry, notes, file_paths, now)
        )
        conn.commit()
        conn.close()
        return jsonify({"ok":True, "message":"Saved document", "id":cur.lastrowid})
    else:
        rows = conn.execute("SELECT * FROM car_documents WHERE user_id=? ORDER BY created_at DESC", (session["user_id"],)).fetchall()
        conn.close()
        return jsonify({"ok":True, "records":[dict(r) for r in rows]})

@auth_bp.route("/api/records/service", methods=["GET", "POST"])
def api_service_records():
    if "user_id" not in session: return jsonify({"ok":False, "error":"Login required"}), 401
    conn = _get_db()
    if request.method == "POST":
        form = request.form
        user_id = session["user_id"]
        file_paths = _save_attached_files(request.files.getlist("images"))
        now = datetime.utcnow().isoformat()
        cur = conn.execute(
            "INSERT INTO service_records (user_id, car_name, service_type, date, center, odo, cost, notes, next_due, file_paths, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (user_id, form.get("car"), form.get("type"), form.get("date"), form.get("center"), form.get("odo"), form.get("cost"), form.get("notes"), form.get("next"), file_paths, now)
        )
        conn.commit()
        conn.close()
        return jsonify({"ok":True, "message":"Saved service record"})
    else:
        rows = conn.execute("SELECT * FROM service_records WHERE user_id=? ORDER BY date DESC, created_at DESC", (session["user_id"],)).fetchall()
        conn.close()
        return jsonify({"ok":True, "records":[dict(r) for r in rows]})

@auth_bp.route("/api/records/insurance", methods=["GET", "POST"])
def api_insurance_records():
    if "user_id" not in session: return jsonify({"ok":False, "error":"Login required"}), 401
    conn = _get_db()
    if request.method == "POST":
        form = request.form
        user_id = session["user_id"]
        file_paths = _save_attached_files(request.files.getlist("images"))
        now = datetime.utcnow().isoformat()
        cur = conn.execute(
            "INSERT INTO insurance_records (user_id, provider, policy, valid_from, valid_until, file_paths, created_at) VALUES (?,?,?,?,?,?,?)",
            (user_id, form.get("provider"), form.get("policy"), form.get("from"), form.get("to"), file_paths, now)
        )
        conn.commit()
        conn.close()
        return jsonify({"ok":True, "message":"Saved insurance"})
    else:
        rows = conn.execute("SELECT * FROM insurance_records WHERE user_id=? ORDER BY created_at DESC", (session["user_id"],)).fetchall()
        conn.close()
        return jsonify({"ok":True, "records":[dict(r) for r in rows]})



# ─────────────────────────────────────────────────────────────
# Serve uploaded files
# ─────────────────────────────────────────────────────────────

@auth_bp.route("/uploads/<path:filepath>")
def serve_upload(filepath):
    """Serve files from the uploads directory."""
    upload_root = os.path.join(current_app.root_path, "uploads")
    return send_from_directory(upload_root, filepath)
