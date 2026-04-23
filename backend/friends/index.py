"""Управление друзьями: поиск, запросы, список друзей и предложения"""
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

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers", {})
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()
    uid = auth_user(cur, headers)
    if not uid:
        conn.close()
        return {"statusCode": 401, "headers": cors(), "body": json.dumps({"error": "Не авторизован"})}

    # GET /friends — список принятых друзей
    if method == "GET" and path.endswith("/friends"):
        cur.execute(f"""
            SELECT u.id, u.name, u.role, u.company, u.online,
                   SUBSTRING(u.name, 1, 1) || COALESCE(SUBSTRING(SPLIT_PART(u.name, ' ', 2), 1, 1), '') as initials
            FROM {SCHEMA}.friendships f
            JOIN {SCHEMA}.users u ON (
                CASE WHEN f.user_id = %s THEN f.friend_id ELSE f.user_id END = u.id
            )
            WHERE (f.user_id = %s OR f.friend_id = %s) AND f.status = 'accepted'
        """, (uid, uid, uid))
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({
            "friends": [{"id": r[0], "name": r[1], "role": r[2], "company": r[3], "online": r[4], "initials": r[5]} for r in rows]
        })}

    # GET /suggestions — люди не в друзьях
    if method == "GET" and path.endswith("/suggestions"):
        cur.execute(f"""
            SELECT u.id, u.name, u.role, u.company,
                   SUBSTRING(u.name, 1, 1) || COALESCE(SUBSTRING(SPLIT_PART(u.name, ' ', 2), 1, 1), '') as initials
            FROM {SCHEMA}.users u
            WHERE u.id != %s
              AND u.id NOT IN (
                SELECT CASE WHEN f.user_id = %s THEN f.friend_id ELSE f.user_id END
                FROM {SCHEMA}.friendships f
                WHERE (f.user_id = %s OR f.friend_id = %s)
              )
            LIMIT 20
        """, (uid, uid, uid, uid))
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({
            "suggestions": [{"id": r[0], "name": r[1], "role": r[2], "company": r[3], "initials": r[4], "mutual": 0} for r in rows]
        })}

    # GET /contacts — все пользователи (для поиска)
    if method == "GET" and path.endswith("/contacts"):
        cur.execute(f"""
            SELECT u.id, u.name, u.role, u.company, u.online,
                   SUBSTRING(u.name, 1, 1) || COALESCE(SUBSTRING(SPLIT_PART(u.name, ' ', 2), 1, 1), '') as initials
            FROM {SCHEMA}.users u WHERE u.id != %s ORDER BY u.name
        """, (uid,))
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({
            "contacts": [{"id": r[0], "name": r[1], "role": r[2], "company": r[3], "online": r[4], "initials": r[5]} for r in rows]
        })}

    # POST /friends/add — добавить в друзья
    if method == "POST" and path.endswith("/add"):
        friend_id = body.get("friend_id")
        if not friend_id:
            conn.close()
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "Укажите friend_id"})}
        cur.execute(f"""
            INSERT INTO {SCHEMA}.friendships (user_id, friend_id, status)
            VALUES (%s, %s, 'accepted')
            ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'
        """, (uid, friend_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "Not found"})}
