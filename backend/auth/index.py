"""Регистрация, вход и выход пользователей мессенджера"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p95226477_messenger_creation_p")

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Session-Token",
    }

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    # POST /register
    if method == "POST" and path.endswith("/register"):
        name = body.get("name", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        role = body.get("role", "").strip()
        company = body.get("company", "").strip()

        if not name or not email or not password:
            conn.close()
            return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Заполните все обязательные поля"})}

        token = secrets.token_hex(32)
        pw_hash = hash_password(password)

        cur.execute(
            f"SELECT id FROM {SCHEMA}.users WHERE email = %s",
            (email,)
        )
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь с таким email уже существует"})}

        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, email, role, company, password_hash, session_token, online) VALUES (%s, %s, %s, %s, %s, %s, true) RETURNING id, name, email, role, company",
            (name, email, role, company, pw_hash, token)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "user": {"id": row[0], "name": row[1], "email": row[2], "role": row[3], "company": row[4]},
                "token": token
            })
        }

    # POST /login
    if method == "POST" and path.endswith("/login"):
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        pw_hash = hash_password(password)

        cur.execute(
            f"SELECT id, name, email, role, company FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
            (email, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Неверный email или пароль"})}

        token = secrets.token_hex(32)
        cur.execute(f"UPDATE {SCHEMA}.users SET session_token = %s, online = true WHERE id = %s", (token, row[0]))
        conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "user": {"id": row[0], "name": row[1], "email": row[2], "role": row[3], "company": row[4]},
                "token": token
            })
        }

    # POST /logout
    if method == "POST" and path.endswith("/logout"):
        user_id = event.get("headers", {}).get("X-User-Id")
        if user_id:
            cur.execute(f"UPDATE {SCHEMA}.users SET session_token = NULL, online = false WHERE id = %s", (user_id,))
            conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
