import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:")
for row in cursor.fetchall():
    print(f"  {row[0]}")

# Get users
cursor.execute("SELECT id, username FROM users_user LIMIT 10")
print("\nUsers:")
for row in cursor.fetchall():
    print(f"  ID: {row[0]}, Username: {row[1]}")

# Get conversations
cursor.execute("SELECT id, conversation_type FROM conversations LIMIT 5")
print("\nConversations:")
for row in cursor.fetchall():
    print(f"  ID: {row[0]}, Type: {row[1]}")

# Get participants for first conversation
cursor.execute("SELECT id, conversation_type FROM conversations LIMIT 1")
conv_id = cursor.fetchone()[0]
print(f"\nParticipants for conversation {conv_id}:")
cursor.execute("""
    SELECT cp.user_id, u.username 
    FROM conversation_participants cp 
    JOIN users_user u ON cp.user_id = u.id 
    WHERE cp.conversation_id = ?
""", (conv_id,))
for row in cursor.fetchall():
    print(f"  User ID: {row[0]}, Username: {row[1]}")

conn.close()
