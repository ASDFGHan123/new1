import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Find the message
cursor.execute('SELECT id, conversation_id, sender_id FROM messages WHERE content = ? AND sender_id = 11', ('gggg',))
msg = cursor.fetchone()

if msg:
    print(f'Message ID: {msg[0]}')
    print(f'Conversation ID: {msg[1]}')
    print(f'Sender ID: {msg[2]}')
    
    # Check conversation details
    cursor.execute('SELECT id, conversation_type, is_deleted FROM conversations WHERE id = ?', (msg[1],))
    conv = cursor.fetchone()
    
    if conv:
        print(f'Conversation Type: {conv[1]}')
        print(f'Is Deleted: {conv[2]}')
        
        # Get participants
        cursor.execute('SELECT user_id FROM conversation_participants WHERE conversation_id = ?', (msg[1],))
        participants = cursor.fetchall()
        print(f'Participants: {[p[0] for p in participants]}')
    else:
        print('Conversation not found')
else:
    print('Message not found')

conn.close()
