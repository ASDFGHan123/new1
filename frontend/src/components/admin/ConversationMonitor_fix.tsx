        const actTime = conv.last_message_at || conv.updated_at || conv.created_at;
        return {
          id: conv.id || idx + 1,
          type: conv.conversation_type === 'group' ? 'group' : 'private',
          title,
          participants: conv.participant_count || (Array.isArray(conv.participants) ? conv.participants.length : 2),
          participantsList: Array.isArray(conv.participants) ? conv.participants : [],
          lastMessage: lastMessageText,
          lastActivity: actTime ? new Date(actTime).toLocaleString() : t('common.noData'),
          messageCount: conv.message_count || 0,
          isActive: conv.is_active !== false && conv.is_deleted !== true,
          messages: conv.messages || []
        };
