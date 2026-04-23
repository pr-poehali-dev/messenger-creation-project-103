"""Поиск пользователей по номеру телефона или имени"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p95226477_messenger_creation_p")

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Session-Token",
    }

def auth_user(cur, headers):
    user_id = headers.get("X-User-Id")
    token = headers.get("X-Session-Token")
    if not user_id or not token:
        return None
    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE id = %s AND session_token = %s", (user_id, token))
    row = cur.fetchone()
    return row[0] if row else None

def normalize_phone(raw: str) -> str:
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    return digits

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers", {})
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()
    uid = auth_user(cur, headers)
    if not uid:
        conn.close()
        return {"statusCode": 401, "headers": cors(), "body": json.dumps({"error": "Не авторизован"})}

    # GET /search?q=<phone_or_name>
    if method == "GET":
        q = params.get("q", "").strip()
        if not q:
            conn.close()
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "Введите запрос"})}

        results = []
        found = False

        # Поиск по телефону
        digits = "".join(c for c in q if c.isdigit())
        if len(digits) >= 7:
            norm = normalize_phone(q)
            cur.execute(f"""
                SELECT id, name, role, company, phone, online
                FROM {SCHEMA}.users
                WHERE phone IS NOT NULL
                  AND REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') LIKE %s
                  AND id != %s
                LIMIT 10
            """, (f"%{norm}%", uid))
            rows = cur.fetchall()
            for r in rows:
                found = True
                results.append({
                    "id": r[0], "name": r[1], "role": r[2], "company": r[3],
                    "phone": r[4], "online": r[5],
                    "initials": (r[1].split()[0][:1] + (r[1].split()[1][:1] if len(r[1].split()) > 1 else "")).upper()
                })

            if not found:
                conn.close()
                return {
                    "statusCode": 200,
                    "headers": cors(),
                    "body": json.dumps({"results": [], "not_found": True, "phone": q})
                }
        else:
            # Поиск по имени
            cur.execute(f"""
                SELECT id, name, role, company, phone, online
                FROM {SCHEMA}.users
                WHERE LOWER(name) LIKE LOWER(%s) AND id != %s
                LIMIT 10
            """, (f"%{q}%", uid))
            rows = cur.fetchall()
            for r in rows:
                results.append({
                    "id": r[0], "name": r[1], "role": r[2], "company": r[3],
                    "phone": r[4], "online": r[5],
                    "initials": (r[1].split()[0][:1] + (r[1].split()[1][:1] if len(r[1].split()) > 1 else "")).upper()
                })

        conn.close()
        return {
            "statusCode": 200,
            "headers": cors(),
            "body": json.dumps({"results": results, "not_found": len(results) == 0})
        }

    conn.close()
    return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "Not found"})}
