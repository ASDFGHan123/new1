# ChatInterface Localization Quick Reference

## String Replacements Needed

Replace the following hardcoded strings in `src/components/chat/ChatInterface.tsx`:

### Header Section
```typescript
// Line ~1050: Replace
"General Chat" → t('chat.generalChat')
"Community discussion space" → t('chat.communityDiscussion')
"Profile Settings" → t('chat.profileSettings')
"Profile Image" → t('chat.profileImage')
```

### Messages Section
```typescript
// Line ~1100: Replace
"Loading messages..." → t('chat.loadingMessages')
"Retry ({retryCount}/3)" → t('chat.retry') + ` (${retryCount}/3)`
"Edited" → t('chat.edited')
"Forwarded" → t('chat.forwarded')
```

### Dropdown Menu
```typescript
// Line ~1200: Replace
"Copy" → t('chat.copy')
"Forward" → t('chat.forward')
"Share" → t('chat.share')
"Move to Trash" → t('chat.moveToTrash')
"Delete" → t('chat.deleteMessage')
```

### Input Section
```typescript
// Line ~1300: Replace
"Type your message..." → t('chat.typeMessage')
"Start voice recording" → t('chat.startRecording')
"Recording" → t('chat.recording')
"Stop Recording" → t('chat.stopRecording')
"Cancel Recording" → t('chat.cancelRecording')
"Drop files to attach" → t('chat.dropFilesToAttach')
"Support for images, documents, and more" → t('chat.supportedFormats')
```

### Error Messages
```typescript
// Line ~1350: Replace
"Microphone access denied. Please enable microphone permissions in your browser settings." 
→ t('chat.microphoneAccessDenied')

"To enable microphone access: Click the camera/microphone icon in your browser's address bar → Select \"Allow\""
→ t('chat.enableMicrophone')

"Dismiss" → t('common.dismiss')
```

### Button Labels
```typescript
// Line ~1400: Replace
"Save" → t('chat.save')
"Cancel" → t('common.cancel')
"Edit" → t('common.edit')
"Delete" → t('chat.deleteMessage')
```

## Implementation Steps

### Step 1: Add Import
```typescript
import { useTranslation } from 'react-i18next';
```

### Step 2: Add Hook in Component
```typescript
export const ChatInterface = ({ user, onLogout, onUpdateUser, onTrashMessage, conversationId = "general" }: ChatInterfaceProps) => {
  const { t } = useTranslation();
  // ... rest of component
}
```

### Step 3: Replace Strings
Use find and replace or manually update each string reference.

### Step 4: Test
- Switch to Pashto language
- Switch to Dari language
- Verify all text displays correctly
- Test RTL layout

## Error Handling Localization

### Current Error Messages to Localize
```typescript
// Line ~130: Retry logic error
setMessagesError(errorMessage);
// Already uses t() for localized messages

// Line ~275: Microphone error
setMicPermissionError('Microphone access denied...');
// Should use: t('chat.microphoneAccessDenied')

// Line ~400: Copy to clipboard
console.log('Message copied to clipboard');
// Should use: t('chat.messageCopied')

// Line ~420: Share error
console.error('Error sharing: ', err);
// Should use: t('chat.failedToShare')
```

## State Management Strings

### Messages to Localize in State Updates
```typescript
// Line ~100: API error handling
throw new Error(response.error || 'Failed to fetch messages');
// Should use: t('chat.failedToLoadMessages')

throw new Error(response.error || 'Failed to send message');
// Should use: t('chat.failedToSendMessage')

throw new Error(response.error || 'Failed to edit message');
// Should use: t('chat.failedToEditMessage')

throw new Error(response.error || 'Failed to delete message');
// Should use: t('chat.failedToDeleteMessage')
```

## UI Component Strings

### Dialog and Button Labels
```typescript
// Profile Settings Dialog
<DialogTitle>Profile Settings</DialogTitle>
// Should use: t('chat.profileSettings')

<Label>Profile Image</Label>
// Should use: t('chat.profileImage')

// Message Input Placeholder
placeholder="Type your message..."
// Should use: placeholder={t('chat.typeMessage')}

// Voice Recording Button
title="Start voice recording"
// Should use: title={t('chat.startRecording')}
```

## Dropdown Menu Items

### Message Actions
```typescript
<DropdownMenuItem onClick={() => copyToClipboard(msg)}>
  <Copy className="h-4 w-4 mr-2" />
  Copy
</DropdownMenuItem>
// Should use: {t('chat.copy')}

<DropdownMenuItem onClick={() => forwardMessage(msg)}>
  <Forward className="h-4 w-4 mr-2" />
  Forward
</DropdownMenuItem>
// Should use: {t('chat.forward')}

<DropdownMenuItem onClick={() => shareMessage(msg)}>
  <Share2 className="h-4 w-4 mr-2" />
  Share
</DropdownMenuItem>
// Should use: {t('chat.share')}

<DropdownMenuItem onClick={() => deleteMessage(msg.id)}>
  <Trash2 className="h-4 w-4 mr-2" />
  {onTrashMessage ? "Move to Trash" : "Delete"}
</DropdownMenuItem>
// Should use: {onTrashMessage ? t('chat.moveToTrash') : t('chat.deleteMessage')}
```

## Complete Example

### Before
```typescript
export const ChatInterface = ({ user, onLogout, onUpdateUser, onTrashMessage, conversationId = "general" }: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  
  return (
    <div>
      <h2 className="text-xl font-semibold">General Chat</h2>
      <p className="text-sm text-muted-foreground">Community discussion space</p>
      <Input placeholder="Type your message..." />
    </div>
  );
};
```

### After
```typescript
import { useTranslation } from 'react-i18next';

export const ChatInterface = ({ user, onLogout, onUpdateUser, onTrashMessage, conversationId = "general" }: ChatInterfaceProps) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  
  return (
    <div>
      <h2 className="text-xl font-semibold">{t('chat.generalChat')}</h2>
      <p className="text-sm text-muted-foreground">{t('chat.communityDiscussion')}</p>
      <Input placeholder={t('chat.typeMessage')} />
    </div>
  );
};
```

## Testing Translations

### Pashto Test Strings
- "General Chat" → "عمومي چټ"
- "Type your message..." → "خپل پیغام ولیکئ..."
- "Send Message" → "پیغام لېږل"

### Dari Test Strings
- "General Chat" → "چت عمومی"
- "Type your message..." → "پیام خود را بنویسید..."
- "Send Message" → "ارسال پیام"

## Performance Considerations

1. The `useTranslation()` hook is already optimized
2. No additional memoization needed for translation keys
3. Language switching will automatically re-render with new translations
4. RTL/LTR switching is handled by i18n config

## Accessibility

Ensure all translated strings:
- Are properly escaped for HTML
- Support screen readers
- Maintain proper contrast ratios
- Include proper ARIA labels where needed

## Common Pitfalls to Avoid

1. ❌ Don't hardcode strings in JSX
2. ❌ Don't forget to add keys to all three locale files
3. ❌ Don't use string concatenation with translations
4. ❌ Don't forget the `t()` function call
5. ✅ Do use `t('key.path')` for all user-facing text
6. ✅ Do test in all three languages
7. ✅ Do verify RTL layout works correctly
