"""Получение и отправка сообщений в чатах мессенджера"""
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
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()
    uid = auth_user(cur, headers)
    if not uid:
        conn.close()
        return {"statusCode": 401, "headers": cors(), "body": json.dumps({"error": "Не авторизован"})}

    # GET /chats — список чатов пользователя
    path = event.get("path", "/")
    if method == "GET" and path.endswith("/chats"):
        cur.execute(f"""
            SELECT c.id,
                   CASE WHEN c.user1_id = %s THEN u2.id ELSE u1.id END as peer_id,
                   CASE WHEN c.user1_id = %s THEN u2.name ELSE u1.name END as peer_name,
                   CASE WHEN c.user1_id = %s THEN u2.role ELSE u1.role END as peer_role,
                   CASE WHEN c.user1_id = %s THEN u2.online ELSE u1.online END as peer_online,
                   (SELECT m.text FROM {SCHEMA}.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_msg,
                   (SELECT m.created_at FROM {SCHEMA}.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_time,
                   (SELECT COUNT(*) FROM {SCHEMA}.messages m WHERE m.chat_id = c.id AND m.sender_id != %s) as unread
            FROM {SCHEMA}.chats c
            JOIN {SCHEMA}.users u1 ON c.user1_id = u1.id
            JOIN {SCHEMA}.users u2 ON c.user2_id = u2.id
            WHERE c.user1_id = %s OR c.user2_id = %s
            ORDER BY last_time DESC NULLS LAST
        """, (uid, uid, uid, uid, uid, uid, uid))
        rows = cur.fetchall()
        conn.close()
        chats = []
        for r in rows:
            chats.append({
                "id": r[0], "peer_id": r[1], "peer_name": r[2],
                "peer_role": r[3], "peer_online": r[4],
                "last_msg": r[5] or "", "last_time": r[6].strftime("%H:%M") if r[6] else "",
                "unread": int(r[7])
            })
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"chats": chats})}

    # GET /messages?chat_id=X — сообщения чата
    if method == "GET" and path.endswith("/messages"):
        chat_id = event.get("queryStringParameters", {}).get("chat_id")
        cur.execute(f"""
            SELECT m.id, m.sender_id, m.text, m.msg_type, m.file_name,
                   to_char(m.created_at, 'HH24:MI') as time
            FROM {SCHEMA}.messages m
            WHERE m.chat_id = %s
            ORDER BY m.created_at ASC
        """, (chat_id,))
        rows = cur.fetchall()
        conn.close()
        msgs = [{"id": r[0], "sender_id": r[1], "text": r[2], "type": r[3], "file_name": r[4], "time": r[5], "out": r[1] == uid} for r in rows]
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({"messages": msgs})}

    # POST /messages — отправить сообщение
    if method == "POST" and path.endswith("/messages"):
        peer_id = body.get("peer_id")
        text = body.get("text", "").strip()
        if not peer_id or not text:
            conn.close()
            return {"statusCode": 400, "headers": cors(), "body": json.dumps({"error": "Укажите получателя и текст"})}

        u1, u2 = (min(uid, peer_id), max(uid, peer_id))
        cur.execute(f"SELECT id FROM {SCHEMA}.chats WHERE user1_id = %s AND user2_id = %s", (u1, u2))
        row = cur.fetchone()
        if row:
            chat_id = row[0]
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.chats (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (u1, u2))
            chat_id = cur.fetchone()[0]

        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (chat_id, sender_id, text, msg_type) VALUES (%s, %s, %s, 'text') RETURNING id, to_char(created_at, 'HH24:MI')",
            (chat_id, uid, text)
        )
        msg_row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": json.dumps({
            "message": {"id": msg_row[0], "chat_id": chat_id, "text": text, "time": msg_row[1], "out": True}
        })}

    conn.close()
    return {"statusCode": 404, "headers": cors(), "body": json.dumps({"error": "Not found"})}
