CREATE TABLE IF NOT EXISTS t_p95226477_messenger_creation_p.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) DEFAULT '',
  company VARCHAR(200) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  session_token VARCHAR(64),
  online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p95226477_messenger_creation_p.friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p95226477_messenger_creation_p.users(id),
  friend_id INTEGER REFERENCES t_p95226477_messenger_creation_p.users(id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS t_p95226477_messenger_creation_p.chats (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES t_p95226477_messenger_creation_p.users(id),
  user2_id INTEGER REFERENCES t_p95226477_messenger_creation_p.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS t_p95226477_messenger_creation_p.messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES t_p95226477_messenger_creation_p.chats(id),
  sender_id INTEGER REFERENCES t_p95226477_messenger_creation_p.users(id),
  text TEXT NOT NULL,
  msg_type VARCHAR(20) DEFAULT 'text',
  file_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON t_p95226477_messenger_creation_p.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON t_p95226477_messenger_creation_p.friendships(user_id, status);
