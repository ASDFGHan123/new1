# Trash Functionality Implementation Documentation

## Overview

This document describes the comprehensive trash functionality implementation across the OffChat Admin Dashboard. The trash system provides a safety net for accidental deletions and allows for data recovery across multiple entity types.

## Implemented Components

### 1. Core Trash Component (`src/components/admin/Trash.tsx`)

The central Trash component provides:

#### Features
- **Multi-type Support**: Users, Conversations, MessageTemplates, Messages, Roles
- **Search & Filtering**: Search by name/content, filter by type
- **Bulk Operations**: Select all, bulk restore, bulk permanent delete
- **Sort Options**: By deletion date, name, or type
- **Print Reports**: Generate printable trash reports
- **Restore/Permanent Delete**: Individual item management
- **Auto-cleanup Warning**: 30-day retention policy notice

#### Key Functions
```typescript
// Restore functions
onRestoreUser: (userId: string) => void;
onRestoreConversation: (conversationId: string) => void;
onRestoreMessageTemplate: (templateId: string) => void;
onRestoreMessage: (message: any) => void;
onRestoreRole: (role: Role) => void;

// Permanent delete functions
onPermanentDeleteUser: (userId: string) => void;
onPermanentDeleteConversation: (conversationId: string) => void;
onPermanentDeleteMessageTemplate: (templateId: string) => void;
onPermanentDeleteMessage: (messageId: string) => void;
onPermanentDeleteRole: (roleId: string) => void;
```

### 2. MessageTemplateDialog Enhancement (`src/components/admin/MessageTemplateDialog.tsx`)

#### Added Features
- **Trash Integration**: Move templates to trash instead of permanent deletion
- **Conditional UI**: Trash button only appears in edit mode
- **Confirmation Dialog**: Uses AlertDialog for safe deletion
- **Auto-close**: Dialog closes after successful trash operation

#### Implementation Pattern
```typescript
// Props interface extension
interface MessageTemplateDialogProps {
  // ... existing props
  onTrash?: (templateId: string) => void;
}

// Conditional trash button in DialogFooter
{mode === "edit" && template && onTrash && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">
        <Trash2 className="w-4 h-4 mr-2" />
        Move to Trash
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Move Template to Trash</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to move the template "{template.name}" to trash?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            onTrash(template.id);
            onClose();
          }}
        >
          Move to Trash
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

### 3. UserProfileViewer Enhancement (`src/components/admin/UserProfileViewer.tsx`)

#### Added Features
- **Trash Integration**: Move users to trash from profile view
- **Enhanced Data Management Section**: Added trash button alongside export/delete
- **Profile Context**: Uses user information in confirmation dialog

#### Implementation Pattern
```typescript
// Props interface extension
interface UserProfileViewerProps {
  // ... existing props
  onTrashUser?: (userId: string) => void;
}

// Integration in Data Management section
{onTrashUser && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">
        <Trash2 className="w-4 h-4 mr-2" />
        Move to Trash
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Move User to Trash</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to move {user.username} to trash?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            onTrashUser(user.id);
            onClose();
          }}
        >
          Move to Trash
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

### 4. Chat Interface Enhancement (`src/components/chat/ChatInterface.tsx`)

#### Added Features
- **Trash Integration**: Move messages to trash instead of permanent deletion
- **Conditional UI**: Text changes based on trash availability
- **Fallback Logic**: Permanent delete if no trash function available

#### Implementation Pattern
```typescript
// Props interface extension
interface ChatInterfaceProps {
  // ... existing props
  onTrashMessage?: (message: Message) => void;
}

// Enhanced delete function
const deleteMessage = (messageId: string) => {
  const messageToDelete = messages.find(msg => msg.id === messageId);
  
  if (onTrashMessage && messageToDelete) {
    // Move to trash instead of permanent delete
    onTrashMessage(messageToDelete);
  } else {
    // Permanent delete if no trash function available
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
  }
  
  setOpenMenuId(null);
};

// Conditional menu text
<DropdownMenuItem onClick={() => deleteMessage(msg.id)}>
  <Trash2 className="h-4 w-4 mr-2" />
  {onTrashMessage ? "Move to Trash" : "Delete"}
</DropdownMenuItem>
```

## AdminDashboard Integration (`src/pages/AdminDashboard.tsx`)

### Enhanced Props
```typescript
interface AdminDashboardProps {
  // ... existing props
  onTrashUser?: (userId: string) => void;
  onTrashMessage?: (message: any) => void;
  onTrashRole?: (roleId: string) => void;
}
```

### Component Integration
```typescript
// MessageTemplateDialog integration
<MessageTemplateDialog
  isOpen={showTemplateDialog}
  onClose={() => setShowTemplateDialog(false)}
  onSave={handleSaveTemplate}
  onTrash={handleTrashMessageTemplate}  // New prop
  template={selectedTemplate}
  mode={templateDialogMode}
/>

// UserProfileViewer integration
<UserProfileViewer
  user={selectedUser}
  isOpen={showProfile}
  onClose={() => setShowProfile(false)}
  onExportData={(userId) => handleExportData(userId, exportOptions)}
  onDeleteData={(userId) => handleDeleteData(userId, deleteOptions)}
  onTrashUser={handleTrashUser}  // New prop
/>
```

## Print Utils Integration (`src/lib/printUtils.ts`)

### Enhanced Print Functions
```typescript
// Existing generateTrashReportHTML function provides comprehensive trash reporting
export const generateTrashReportHTML = (trashedItems: any[], type: string) => {
  // Groups items by type
  // Generates detailed reports with statistics
  // Includes export functionality
  // Provides filtered and unfiltered views
}
```

## State Management Patterns

### 1. Trash State Structure
```typescript
// In AdminDashboard
const [trashedUsers, setTrashedUsers] = React.useState<User[]>([]);
const [trashedConversations, setTrashedConversations] = React.useState<Conversation[]>([]);
const [trashedMessageTemplates, setTrashedMessageTemplates] = React.useState<MessageTemplate[]>([]);
const [trashedMessages, setTrashedMessages] = React.useState<any[]>([]);
const [trashedRoles, setTrashedRoles] = React.useState<Role[]>([]);
```

### 2. Trash Function Patterns
```typescript
// Pattern for moving items to trash
const handleTrashItem = async (itemId: string) => {
  const itemToTrash = items.find(item => item.id === itemId);
  if (itemToTrash) {
    // Add deletion timestamp
    setTrashedItems(prev => [...prev, { ...itemToTrash, deletedAt: new Date().toISOString() }]);
    
    // Remove from active items
    setItems(prev => prev.filter(item => item.id !== itemId));
  }
};

// Pattern for restoring items
const handleRestoreItem = async (itemId: string) => {
  const trashedItem = trashedItems.find(item => item.id === itemId);
  if (trashedItem) {
    // Add back to active items
    setItems(prev => [...prev, trashedItem]);
    
    // Remove from trash
    setTrashedItems(prev => prev.filter(item => item.id !== itemId));
  }
};
```

## Security & Safety Features

### 1. Confirmation Dialogs
- All trash operations use `AlertDialog` for confirmation
- Clear descriptions of actions and consequences
- Distinguishes between "Move to Trash" and "Permanently Delete"

### 2. User Feedback
- Toast notifications for successful operations
- Clear labeling in UI to distinguish trash vs delete
- Warning messages about 30-day retention policy

### 3. Data Integrity
- Timestamps added to all trashed items
- Proper error handling for bulk operations
- Graceful fallbacks when trash functions unavailable

## Performance Considerations

### 1. Bulk Operations
- Async operations with delays to prevent overwhelming
- Progress indicators for long-running operations
- Efficient state updates using functional setState

### 2. Search & Filtering
- Client-side filtering for immediate results
- Debounced search to reduce re-renders
- Optimized sorting algorithms

### 3. Memory Management
- Proper cleanup of subscriptions and intervals
- Efficient object references
- Lazy loading where appropriate

## Future Enhancements

### 1. Planned Features
- **Auto-backup**: Automatic backup before trash operations
- **Recovery history**: Track restore operations
- **Retention policies**: Configurable cleanup schedules
- **Advanced search**: Full-text search across trashed content

### 2. Integration Points
- **Audit logging**: Log all trash operations
- **Notification system**: Alert admins about trashed items
- **Bulk import/export**: Support for large datasets
- **API integration**: Connect to backend trash services

## Usage Examples

### 1. Adding Trash to New Components
```typescript
// 1. Add onTrash prop to interface
interface ComponentProps {
  // ... existing props
  onTrashItem?: (itemId: string) => void;
}

// 2. Update function signature
export const Component = ({ onTrashItem, ...props }) => {
  // 3. Add trash button with confirmation
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">
        <Trash2 className="w-4 h-4 mr-2" />
        Move to Trash
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Move Item to Trash</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to move this item to trash?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => onTrashItem(item.id)}>
          Move to Trash
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
};

// 4. Connect in parent component
<Component onTrashItem={handleTrashItem} />
```

### 2. Bulk Operations
```typescript
// Bulk restore pattern
const handleBulkRestore = async () => {
  const restorePromises = selectedItems.map(async itemId => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      handleRestore(item);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
  
  await Promise.all(restorePromises);
  setSelectedItems([]);
  setSelectAll(false);
};
```

## Testing Guidelines

### 1. Unit Tests
- Test individual trash functions
- Verify state management updates
- Test confirmation dialog interactions
- Validate error handling scenarios

### 2. Integration Tests
- Test component interactions with trash system
- Verify bulk operations work correctly
- Test print functionality
- Validate search and filtering

### 3. User Experience Tests
- Test confirmation flows
- Verify accessibility compliance
- Test responsive design
- Validate keyboard navigation

## Conclusion

The trash functionality implementation provides a comprehensive safety net across the OffChat Admin Dashboard. The pattern-based approach ensures consistency while allowing flexibility for different entity types. The integration points are clearly defined, making it easy to add trash functionality to new components.

Key benefits:
- **Safety**: Prevents accidental data loss
- **Recovery**: Easy restoration of trashed items
- **Consistency**: Unified UI/UX patterns
- **Flexibility**: Works across different data types
- **Performance**: Optimized for scale
- **Security**: Proper confirmation and validation

This implementation forms a solid foundation for data management and can be extended with additional features as the system evolves.