# Localized Report Printing System

## Overview

The admin dashboard now supports printing and downloading reports in three languages:
- **English (en)** - LTR (Left-to-Right)
- **Pashto (ps)** - RTL (Right-to-Left)
- **Dari (prs)** - RTL (Right-to-Left)

## Files Added

### Core Files

1. **`src/lib/printUtils.ts`** (Updated)
   - Enhanced with full Pashto and Dari translations
   - All report generation functions support language parameter
   - Automatic RTL/LTR layout adjustment
   - Proper font selection for each language

2. **`src/lib/reportTranslations.ts`** (New)
   - Helper utilities for report translations
   - Language detection and formatting functions
   - RTL/LTR direction helpers
   - Locale-specific date formatting

3. **`src/i18n/locales/ps-reports.json`** (New)
   - Pashto translations for all report elements
   - Table headers, labels, and messages

4. **`src/i18n/locales/prs-reports.json`** (New)
   - Dari translations for all report elements
   - Table headers, labels, and messages

5. **`src/components/admin/LocalizedReportExample.tsx`** (New)
   - Example component showing report usage
   - Demonstrates all report types
   - Language selection interface

## Supported Report Types

### 1. User Management Report
```typescript
generateUserListHTML(users, language)
```
- Lists all users with details
- Shows username, email, role, join date, message count
- Supports filtering and sorting

### 2. Conversation Monitoring Report
```typescript
generateConversationReportHTML(conversations, language)
```
- Displays active and inactive conversations
- Shows participant count and message statistics
- Includes last activity timestamp

### 3. Audit Logs Report
```typescript
generateAuditLogsHTML(logs, language)
```
- System activity and security events
- Action, actor, timestamp, and severity
- Detailed descriptions of each action

### 4. Message Analytics Report
```typescript
generateMessageAnalyticsHTML(analytics, language)
```
- Message statistics and trends
- Message type distribution
- Active user metrics

### 5. Trash Management Report
```typescript
generateTrashReportHTML(items, type, language)
```
- Deleted items organized by type
- Deletion timestamp and actor
- Item details and recovery options

### 6. Backup Status Report
```typescript
generateBackupReportHTML(backupInfo, language)
```
- Backup schedule and status
- Data types included
- Last backup timestamp

## Usage Examples

### Basic Report Generation

```typescript
import { generateUserListHTML, openPrintWindow } from '@/lib/printUtils';

// Generate report in Pashto
const reportData = generateUserListHTML(users, 'ps');

// Open in print dialog
openPrintWindow(reportData);

// Or download as HTML file
downloadPrintHTML(reportData);
```

### With Language Selection

```typescript
import { useState } from 'react';
import { PrintLanguage } from '@/lib/printUtils';

export function ReportComponent() {
  const [language, setLanguage] = useState<PrintLanguage>('en');

  const handlePrint = () => {
    const report = generateConversationReportHTML(conversations, language);
    openPrintWindow(report);
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value as PrintLanguage)}>
        <option value="en">English</option>
        <option value="ps">پشتو</option>
        <option value="prs">دری</option>
      </select>
      <button onClick={handlePrint}>Print Report</button>
    </div>
  );
}
```

### Using Report Translation Helper

```typescript
import { getReportTranslation, formatDateForReport, isRTLLanguage } from '@/lib/reportTranslations';

const language = 'ps'; // Pashto

// Get translated text
const title = getReportTranslation('reports.users', language);
const username = getReportTranslation('tables.username', language);

// Format date with language locale
const formattedDate = formatDateForReport(new Date(), language);

// Check if RTL
if (isRTLLanguage(language)) {
  // Apply RTL styles
}
```

## Translation Keys

### Report Keys
- `reports.generated` - "Generated"
- `reports.system` - "System"
- `reports.offchat` - "OffChat Admin Dashboard"
- `reports.confidential` - Confidential notice
- `reports.date` - "Report Date"
- `reports.period` - "Report Period"
- `reports.users` - "User Management Report"
- `reports.analytics` - "Message Analytics Report"
- `reports.audit` - "Audit Logs Report"
- `reports.trash` - "Trash Management Report"
- `reports.backup` - "Backup Status Report"
- `reports.summary` - "Summary"
- `reports.totalItems` - "Total Items"
- `reports.activeItems` - "Active Items"
- `reports.inactiveItems` - "Inactive Items"

### Table Column Keys
- `tables.title` - "Title"
- `tables.type` - "Type"
- `tables.participants` - "Participants"
- `tables.messages` - "Messages"
- `tables.status` - "Status"
- `tables.lastactivity` - "Last Activity"
- `tables.username` - "Username"
- `tables.email` - "Email"
- `tables.role` - "Role"
- `tables.joindate` - "Join Date"
- `tables.action` - "Action"
- `tables.actor` - "Actor"
- `tables.timestamp` - "Timestamp"
- `tables.description` - "Description"
- `tables.severity` - "Severity"
- `tables.content` - "Content"
- `tables.recipients` - "Recipients"
- `tables.priority` - "Priority"
- `tables.sentAt` - "Sent At"
- `tables.deletedAt` - "Deleted At"
- `tables.details` - "Details"

### Statistics Keys
- `stats.totalUsers` - "Total Users"
- `stats.activeUsers` - "Active Users"
- `stats.suspendedUsers` - "Suspended Users"
- `stats.bannedUsers` - "Banned Users"
- `stats.totalMessages` - "Total Messages"
- `stats.todayMessages` - "Messages Today"
- `stats.averageMessages` - "Average Messages"

### Conversation Keys
- `conversations.title` - "Conversation Report"
- `conversations.monitoring` - "Conversation Monitoring Report"
- `conversations.total` - "Total Conversations"
- `conversations.active` - "Active Conversations"

## Language Features

### English (en)
- Left-to-Right (LTR) layout
- Standard English fonts
- Locale: `en-US`

### Pashto (ps)
- Right-to-Left (RTL) layout
- Unicode-compatible fonts (Segoe UI, Arial Unicode MS)
- Locale: `ps-AF`
- Proper Pashto text rendering

### Dari (prs)
- Right-to-Left (RTL) layout
- Unicode-compatible fonts (Segoe UI, Arial Unicode MS)
- Locale: `fa-AF`
- Proper Dari text rendering

## Styling Features

All reports automatically include:

1. **Responsive Layout**
   - Adjusts for print and screen viewing
   - Mobile-friendly design

2. **RTL Support**
   - Automatic text direction
   - Reversed flex layouts for RTL languages
   - Proper border positioning

3. **Professional Styling**
   - Color-coded headers and footers
   - Alternating row colors for readability
   - Proper spacing and typography

4. **Print Optimization**
   - Print-specific CSS rules
   - Page break handling
   - Optimized margins and padding

## Integration with Admin Dashboard

### Adding to Existing Components

```typescript
import { generateUserListHTML, openPrintWindow } from '@/lib/printUtils';
import { useTranslation } from 'react-i18next';

export function UserManagementPage() {
  const { i18n } = useTranslation();

  const handlePrintReport = () => {
    const report = generateUserListHTML(
      users,
      i18n.language as PrintLanguage
    );
    openPrintWindow(report);
  };

  return (
    <div>
      {/* Your component content */}
      <button onClick={handlePrintReport}>
        {i18n.t('common.print')} {i18n.t('userManagement.userManagement')}
      </button>
    </div>
  );
}
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Limited support (no RTL CSS Grid)

## Performance Considerations

1. **Large Datasets**
   - Reports with 1000+ rows may take time to render
   - Consider pagination for very large reports

2. **Memory Usage**
   - HTML generation is memory-efficient
   - Large reports may require more memory for PDF conversion

3. **Print Performance**
   - Browser print dialog handles rendering
   - Large reports may take time to print

## Troubleshooting

### RTL Text Not Displaying Correctly
- Ensure browser has Unicode font support
- Check that language code is correct ('ps' or 'prs')
- Verify font-family includes Unicode fonts

### Print Dialog Not Opening
- Check browser popup blocker settings
- Ensure `openPrintWindow()` is called from user interaction
- Verify window.open() is not blocked

### Translations Not Showing
- Verify translation keys exist in JSON files
- Check language code matches available translations
- Ensure JSON files are properly formatted

### Date Formatting Issues
- Verify locale string is correct for language
- Check system locale settings
- Use `formatDateForReport()` helper for consistency

## Future Enhancements

1. **PDF Export**
   - Direct PDF generation without print dialog
   - Better formatting control

2. **Email Reports**
   - Send reports via email
   - Scheduled report generation

3. **Report Templates**
   - Custom report layouts
   - Branding options

4. **Advanced Filtering**
   - Date range selection
   - Custom column selection
   - Data aggregation options

5. **Multi-language Support**
   - Additional languages
   - Custom translation management

## Support

For issues or questions about localized reports:
1. Check the example component: `LocalizedReportExample.tsx`
2. Review translation files in `src/i18n/locales/`
3. Consult the `reportTranslations.ts` helper utilities
4. Check browser console for errors
