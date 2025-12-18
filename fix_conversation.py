import sqlite3
from datetime import datetime

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

conv_id = 'e58c5102d36240308f3a865c278c3fa1'

# Get the latest message timestamp
cursor.execute('SELECT MAX(timestamp) FROM messages WHERE conversation_id = ?', (conv_id,))
latest_msg_time = cursor.fetchone()[0]

print(f'Latest message time: {latest_msg_time}')

# Update conversation's last_message_at
if latest_msg_time:
    cursor.execute('UPDATE conversations SET last_message_at = ? WHERE id = ?', (latest_msg_time, conv_id))
    conn.commit()
    print('Updated conversation last_message_at')

# Verify
cursor.execute('SELECT id, last_message_at, is_deleted FROM conversations WHERE id = ?', (conv_id,))
print('Conversation:', cursor.fetchone())

conn.close()
