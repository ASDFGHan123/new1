# Localization Quick Reference Guide

## Supported Languages

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| English | `en` | LTR | ✅ Complete |
| Pashto | `ps` | RTL | ✅ Complete |
| Dari | `prs` | RTL | ✅ Complete |

## Quick Start

### Using Translations in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### With Dynamic Values

```typescript
// Translation: "users.userDeleted": "User {{username}} deleted"
<p>{t('users.userDeleted', { username: 'Ahmed' })}</p>
// Output: "User Ahmed deleted" (or translated equivalent)
```

### Language Switcher

Add to your layout:
```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

<LanguageSwitcher />
```

## Translation File Structure

All translation files are located in: `src/i18n/locales/`

### File Organization

```
src/i18n/
├── config.ts                 # i18n configuration
├── locales/
│   ├── en.json              # English translations
│   ├── ps.json              # Pashto translations
│   └── prs.json             # Dari translations
```

## Common Translation Keys

### Authentication
- `auth.signIn` - Sign In
- `auth.signUp` - Sign Up
- `auth.loginFailed` - Login failed
- `auth.accountPending` - Account pending approval

### User Management
- `users.addUser` - Add User
- `users.deleteUser` - Delete User
- `users.userApproved` - User Approved
- `users.userRejected` - User Rejected

### Admin Dashboard
- `admin.dashboard` - Dashboard
- `admin.userManagement` - User Management
- `admin.moderation` - Moderation
- `admin.settings` - Settings

### Common Actions
- `common.save` - Save
- `common.cancel` - Cancel
- `common.delete` - Delete
- `common.edit` - Edit
- `common.search` - Search

### Error Messages
- `errors.somethingWentWrong` - Something went wrong
- `errors.networkError` - Network Error
- `errors.serverError` - Server Error

## RTL Support

### Automatic Handling
The system automatically:
- Detects language direction
- Sets HTML `dir` attribute
- Applies RTL/LTR styling
- Persists user preference

### CSS Best Practices for RTL

❌ **Avoid:**
```css
margin-left: 10px;
padding-right: 20px;
text-align: left;
```

✅ **Use:**
```css
margin-inline-start: 10px;
padding-inline-end: 20px;
text-align: start;
```

## Adding New Translations

### Step 1: Add to English (en.json)
```json
{
  "section": {
    "newKey": "English text"
  }
}
```

### Step 2: Add to Pashto (ps.json)
```json
{
  "section": {
    "newKey": "پشتو متن"
  }
}
```

### Step 3: Add to Dari (prs.json)
```json
{
  "section": {
    "newKey": "متن دری"
  }
}
```

### Step 4: Use in Component
```typescript
const { t } = useTranslation();
t('section.newKey');
```

## Translation Categories

### 1. Common (70 keys)
Basic UI elements, navigation, status indicators

### 2. Authentication (15 keys)
Login, signup, account status, password management

### 3. Admin Dashboard (20 keys)
Dashboard navigation, profile, settings, moderation

### 4. User Management (30 keys)
User operations, roles, status management

### 5. Conversations (25 keys)
Chat monitoring, participants, message viewing

### 6. Moderation (35 keys)
User review, warnings, suspensions, banning

### 7. Permissions (25 keys)
Role management, permission assignment

### 8. Messages (40 keys)
Message history, templates, backup/restore

### 9. Trash (15 keys)
Deleted items recovery, permanent deletion

### 10. Audit Logs (20 keys)
Log viewing, action tracking, monitoring

### 11. Settings (15 keys)
System settings, backup frequency

### 12. Errors (10 keys)
Error messages and notifications

## Testing Translations

### Manual Testing Checklist
- [ ] Switch between all three languages
- [ ] Verify RTL layout for Pashto and Dari
- [ ] Check all UI elements display correctly
- [ ] Test with long text strings
- [ ] Verify special characters render properly
- [ ] Test on mobile devices

### Browser DevTools
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Look for `i18nextLng` key
4. Change value to test different languages

## Troubleshooting

### Issue: Translations not updating
**Solution:** 
- Clear browser cache
- Clear localStorage
- Restart development server

### Issue: RTL layout broken
**Solution:**
- Check CSS uses logical properties (start/end)
- Verify `dir` attribute is set on HTML element
- Check for hardcoded left/right values

### Issue: Missing translation key
**Solution:**
- Check key exists in all three language files
- Verify spelling and case sensitivity
- Check for typos in component code

### Issue: Special characters not displaying
**Solution:**
- Ensure file is saved as UTF-8
- Check browser supports the language
- Verify font supports the characters

## Performance Tips

1. **Lazy Load Translations**
   - Translations load on app initialization
   - No performance impact on load time

2. **Cache User Preference**
   - Language preference stored in localStorage
   - Persists across sessions

3. **Optimize Bundle Size**
   - Each language file is separate
   - Only loaded when needed

## Accessibility

- Language switcher is keyboard accessible
- Screen readers announce language changes
- Proper `lang` attribute on HTML element
- ARIA labels for language options

## Future Enhancements

Potential improvements:
1. Add more languages (Arabic, Turkish, Urdu)
2. Implement pluralization rules
3. Add date/time localization
4. Currency formatting support
5. Number formatting per locale
6. Translation management UI

## Resources

- **i18next Documentation:** https://www.i18next.com/
- **React i18next:** https://react.i18next.com/
- **Language Codes:** https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

## Support

For issues or questions:
1. Check the LOCALIZATION_COMPLETION.md file
2. Review translation files for examples
3. Check component implementation in src/components/LanguageSwitcher.tsx
4. Review i18n configuration in src/i18n/config.ts

---

**Last Updated:** 2024
**Status:** Production Ready
