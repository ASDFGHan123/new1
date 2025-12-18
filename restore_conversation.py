import sqlite3
from datetime import datetime

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# The conversation ID
conv_id = 'e58c5102d36240308f3a865c278c3fa1'

# Check current participants
cursor.execute('SELECT user_id FROM conversation_participants WHERE conversation_id = ?', (conv_id,))
participants = [p[0] for p in cursor.fetchall()]
print(f'Current participants: {participants}')

# Add NaveedAhmad (user 37) if not present
if 37 not in participants:
    now = datetime.now().isoformat()
    cursor.execute('INSERT INTO conversation_participants (conversation_id, user_id, joined_at, unread_count) VALUES (?, ?, ?, ?)', (conv_id, 37, now, 0))
    conn.commit()
    print('Added NaveedAhmad (user 37) to conversation')
else:
    print('NaveedAhmad already in conversation')

# Verify
cursor.execute('SELECT user_id FROM conversation_participants WHERE conversation_id = ?', (conv_id,))
participants = [p[0] for p in cursor.fetchall()]
print(f'Updated participants: {participants}')

conn.close()
