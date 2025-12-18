import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

conv_id = 'e58c5102d36240308f3a865c278c3fa1'

# Get the other participant (not user 11)
cursor.execute('SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != 11', (conv_id,))
other_user_id = cursor.fetchone()[0]

# Get the other user's username
cursor.execute('SELECT username FROM users WHERE id = ?', (other_user_id,))
username = cursor.fetchone()[0]

print(f'Other user: {username} (ID: {other_user_id})')

# Update conversation title
cursor.execute('UPDATE conversations SET title = ? WHERE id = ?', (username, conv_id))
conn.commit()

print(f'Updated conversation title to: {username}')

conn.close()
