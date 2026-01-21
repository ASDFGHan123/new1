// Print utility functions for admin dashboard
export type PrintLanguage = 'en' | 'ps' | 'prs';

const translations: Record<PrintLanguage, Record<string, string>> = {
  en: {
    'report.generated': 'Generated',
    'report.system': 'System',
    'report.offchat': 'OffChat Admin Dashboard',
    'report.confidential': '© 2026 OffChat Admin Dashboard - Confidential Report',
    'report.date': 'Report Date',
    'report.period': 'Report Period',
    'conversation.title': 'Conversation Report',
    'conversation.monitoring': 'Conversation Monitoring Report',
    'conversation.total': 'Total Conversations',
    'conversation.active': 'Active Conversations',
    'table.title': 'Title',
    'table.type': 'Type',
    'table.participants': 'Participants',
    'table.messages': 'Messages',
    'table.status': 'Status',
    'table.lastactivity': 'Last Activity',
    'table.username': 'Username',
    'table.email': 'Email',
    'table.role': 'Role',
    'table.joindate': 'Join Date',
    'table.action': 'Action',
    'table.actor': 'Actor',
    'table.timestamp': 'Timestamp',
    'table.description': 'Description',
    'table.severity': 'Severity',
    'table.content': 'Content',
    'table.recipients': 'Recipients',
    'table.priority': 'Priority',
    'table.sentAt': 'Sent At',
    'table.deletedAt': 'Deleted At',
    'table.details': 'Details',
    'report.users': 'User Management Report',
    'report.analytics': 'Message Analytics Report',
    'report.audit': 'Audit Logs Report',
    'report.trash': 'Trash Management Report',
    'report.backup': 'Backup Status Report',
    'report.summary': 'Summary',
    'report.totalItems': 'Total Items',
    'report.activeItems': 'Active Items',
    'report.inactiveItems': 'Inactive Items',
    'stats.totalUsers': 'Total Users',
    'stats.activeUsers': 'Active Users',
    'stats.suspendedUsers': 'Suspended Users',
    'stats.bannedUsers': 'Banned Users',
    'stats.totalMessages': 'Total Messages',
    'stats.todayMessages': 'Messages Today',
    'stats.averageMessages': 'Average Messages',
  },
  ps: {
    'report.generated': 'تیاری شوی',
    'report.system': 'سیستم',
    'report.offchat': 'OffChat ادمین ډیشبورډ',
    'report.confidential': '© 2026 OffChat ادمین ډیشبورډ - محرمانه رپورٹ',
    'report.date': 'د رپورٹ نېټه',
    'report.period': 'د رپورٹ مودې',
    'conversation.title': 'کالو کاري رپورٹ',
    'conversation.monitoring': 'کالو کاري نظارت رپورٹ',
    'conversation.total': 'ټول کالو کاري',
    'conversation.active': 'فعال کالو کاري',
    'table.title': 'عنوان',
    'table.type': 'قسم',
    'table.participants': 'شرکت کونکي',
    'table.messages': 'پیغامونه',
    'table.status': 'حالت',
    'table.lastactivity': 'آخری فعالیت',
    'table.username': 'د کارن نوم',
    'table.email': 'بریښنالیک',
    'table.role': 'رول',
    'table.joindate': 'د غړیتوب نېټه',
    'table.action': 'کړنه',
    'table.actor': 'کارن',
    'table.timestamp': 'وخت نېټه',
    'table.description': 'تفصیل',
    'table.severity': 'شدت',
    'table.content': 'محتوا',
    'table.recipients': 'ترلاسه کوونکي',
    'table.priority': 'لومړیتوب',
    'table.sentAt': 'لېږل شوی په',
    'table.deletedAt': 'ړنګ شوی په',
    'table.details': 'تفصیلات',
    'report.users': 'د کارنانو مدیریت رپورٹ',
    'report.analytics': 'د پیغام تحلیل رپورٹ',
    'report.audit': 'د حسابرسی راپورونه رپورٹ',
    'report.trash': 'د کثافاتو مدیریت رپورٹ',
    'report.backup': 'د بیک اپ حالت رپورٹ',
    'report.summary': 'خلاصه',
    'report.totalItems': 'ټول توکي',
    'report.activeItems': 'فعال توکي',
    'report.inactiveItems': 'غیرفعال توکي',
    'stats.totalUsers': 'ټول کارنان',
    'stats.activeUsers': 'فعال کارنان',
    'stats.suspendedUsers': 'تعلیق شوي کارنان',
    'stats.bannedUsers': 'بند شوي کارنان',
    'stats.totalMessages': 'ټول پیغامونه',
    'stats.todayMessages': 'د امروز پیغامونه',
    'stats.averageMessages': 'اوسط پیغامونه',
  },
  prs: {
    'report.generated': 'تیار شده',
    'report.system': 'سیستم',
    'report.offchat': 'OffChat داشبورد ادمین',
    'report.confidential': '© 2026 OffChat داشبورد ادمین - گزارش محرمانه',
    'report.date': 'تاریخ گزارش',
    'report.period': 'دوره گزارش',
    'conversation.title': 'گزارش گفتگو',
    'conversation.monitoring': 'گزارش نظارت گفتگو',
    'conversation.total': 'کل گفتگو',
    'conversation.active': 'گفتگوی فعال',
    'table.title': 'عنوان',
    'table.type': 'نوع',
    'table.participants': 'شرکت کنندگان',
    'table.messages': 'پیام ها',
    'table.status': 'وضعیت',
    'table.lastactivity': 'آخرین فعالیت',
    'table.username': 'نام کاربری',
    'table.email': 'ایمیل',
    'table.role': 'نقش',
    'table.joindate': 'تاریخ عضویت',
    'table.action': 'عمل',
    'table.actor': 'کاربر',
    'table.timestamp': 'برچسب زمانی',
    'table.description': 'توضیح',
    'table.severity': 'شدت',
    'table.content': 'محتوا',
    'table.recipients': 'گیرندگان',
    'table.priority': 'اولویت',
    'table.sentAt': 'ارسال شده در',
    'table.deletedAt': 'حذف شده در',
    'table.details': 'جزئیات',
    'report.users': 'گزارش مدیریت کاربران',
    'report.analytics': 'گزارش تجزیه و تحلیل پیام',
    'report.audit': 'گزارش گزارشات حسابرسی',
    'report.trash': 'گزارش مدیریت زباله',
    'report.backup': 'گزارش وضعیت پشتیبانگیری',
    'report.summary': 'خلاصه',
    'report.totalItems': 'کل موارد',
    'report.activeItems': 'موارد فعال',
    'report.inactiveItems': 'موارد غیرفعال',
    'stats.totalUsers': 'کل کاربران',
    'stats.activeUsers': 'کاربران فعال',
    'stats.suspendedUsers': 'کاربران تعلیق شده',
    'stats.bannedUsers': 'کاربران مسدود شده',
    'stats.totalMessages': 'کل پیامها',
    'stats.todayMessages': 'پیامهای امروز',
    'stats.averageMessages': 'میانگین پیامها',
  }
};

const t = (key: string, lang: PrintLanguage = 'en'): string => {
  return translations[lang]?.[key] || translations['en'][key] || key;
};

export interface PrintOptions {
  title: string;
  subtitle?: string;
  data: any[];
  headers: string[];
  filename?: string;
  dateRange?: string;
  metadata?: Record<string, any>;
  language?: PrintLanguage;
}

export interface PrintData {
  title: string;
  content: string;
  subtitle?: string;
  filename?: string;
  language?: PrintLanguage;
}

// Generate HTML content for printing
export const generatePrintHTML = (printData: PrintData): string => {
  const lang = printData.language || 'en';
  const isRTL = lang === 'ps' || lang === 'prs';
  const borderDir = isRTL ? 'right' : 'left';
  const textAlign = isRTL ? 'right' : 'left';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  
  return `
    <!DOCTYPE html>
    <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${lang}">
      <head>
        <meta charset="UTF-8">
        <title>${printData.title}</title>
        <style>
          body {
            font-family: ${isRTL ? "'Segoe UI', 'Arial Unicode MS', sans-serif" : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"};
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
            direction: ${isRTL ? 'rtl' : 'ltr'};
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin: 0;
          }
          .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin: 5px 0 0 0;
          }
          .meta-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-${borderDir}: 4px solid #3b82f6;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            flex-direction: ${flexDir};
          }
          .meta-label {
            font-weight: 600;
            color: #374151;
          }
          .meta-value {
            color: #6b7280;
          }
          .content {
            line-height: 1.6;
            text-align: ${textAlign};
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th,
          .table td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: ${textAlign};
          }
          .table th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .header { margin-bottom: 20px; }
            .meta-info { margin-bottom: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${printData.title}</h1>
          ${printData.subtitle ? `<p class="subtitle">${printData.subtitle}</p>` : ''}
        </div>
        
        <div class="meta-info">
          <div class="meta-row">
            <span class="meta-label">${t('report.generated', lang)}:</span>
            <span class="meta-value">${new Date().toLocaleString(lang === 'ps' ? 'ps-AF' : lang === 'prs' ? 'fa-AF' : 'en-US')}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${t('report.system', lang)}:</span>
            <span class="meta-value">${t('report.offchat', lang)}</span>
          </div>
        </div>
        
        <div class="content">
          ${printData.content}
        </div>
        
        <div class="footer">
          <p>${t('report.confidential', lang)}</p>
        </div>
      </body>
    </html>
  `;
};

// Generate table HTML
export const generateTableHTML = (headers: string[], data: any[]): string => {
  if (!data.length) return '<p>No data available</p>';
  
  const headerRow = headers.map(header => `<th>${header}</th>`).join('');
  const dataRows = data.map(row => {
    const cells = headers.map(header => {
      const value = row[header.toLowerCase().replace(' ', '')] || row[header] || row[Object.keys(row)[0]];
      return `<td>${value || ''}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  
  return `
    <table class="table">
      <thead>
        <tr>${headerRow}</tr>
      </thead>
      <tbody>${dataRows}</tbody>
    </table>
  `;
};

// Generate statistics HTML
export const generateStatsHTML = (stats: Record<string, any>): string => {
  const statsEntries = Object.entries(stats).map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `
      <div class="stat-card">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    `;
  }).join('');
  
  return `<div class="stats-grid">${statsEntries}</div>`;
};

// Open print window
export const openPrintWindow = (printData: PrintData): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(generatePrintHTML(printData));
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Download print content as HTML file
export const downloadPrintHTML = (printData: PrintData): void => {
  const htmlContent = generatePrintHTML(printData);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = printData.filename || `${printData.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to get item details for trash reports
function getItemDetails(item: any, type: string): string {
  switch (type) {
    case 'User':
      return `Role: ${item.role} | Messages: ${item.messageCount || 0}`;
    case 'Conversation':
      return `${item.type} | Participants: ${item.participants?.length || 0}`;
    case 'Template':
      return `Category: ${item.category}`;
    case 'Role':
      return `Permissions: ${item.permissions?.length || 0}`;
    case 'Message':
      return `Content: ${(item.content || '').substring(0, 50)}...`;
    default:
      return 'No additional details';
  }
}

// Specific print generators for different data types
export const generateUserListHTML = (users: any[], language: PrintLanguage = 'en') => {
  const userData = users.map(user => ({
    username: user.username || user.name || 'N/A',
    email: user.email || 'N/A',
    status: user.status || 'N/A',
    role: user.role || 'N/A',
    joindate: user.join_date ? new Date(user.join_date).toLocaleDateString() : (user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'),
    messages: user.message_count || 0
  }));
  
  const content = generateTableHTML(
    [t('table.username', language), t('table.email', language), 'Status', t('table.role', language), t('table.joindate', language), t('table.messages', language)],
    userData
  );
  
  return {
    title: t('report.users', language),
    content: `
      <h2>${t('report.summary', language)}</h2>
      <p>${t('report.totalItems', language)}: ${users.length}</p>
      ${content}
    `,
    filename: 'user_list_report',
    language
  };
};

export const generateMessageAnalyticsHTML = (analytics: any, language: PrintLanguage = 'en') => {
  const stats = {
    [t('stats.totalMessages', language)]: analytics.totalMessages || 0,
    [t('stats.todayMessages', language)]: analytics.messagesToday || 0,
    [t('stats.activeUsers', language)]: analytics.activeUsers || 0,
    [t('stats.averageMessages', language)]: analytics.averageMessages || 0
  };
  
  const content = `
    <h2>${t('report.summary', language)}</h2>
    ${generateStatsHTML(stats)}
    <h3>${t('table.type', language)} ${t('table.description', language)}</h3>
    <p>${t('table.messages', language)}:</p>
    ${analytics.messageTypes ? generateTableHTML([t('table.type', language), 'Count'], Object.entries(analytics.messageTypes).map(([type, count]) => ({ type, count }))) : 'No data'}
  `;
  
  return {
    title: t('report.analytics', language),
    content,
    filename: 'message_analytics_report',
    language
  };
};

export const generateAuditLogsHTML = (logs: any[], language: PrintLanguage = 'en') => {
  const logData = logs.map(log => ({
    timestamp: log.timestamp || log.time || 'N/A',
    action: log.action || 'N/A',
    actor: log.actor || log.user || 'N/A',
    description: log.description || 'N/A',
    severity: log.severity || 'N/A'
  }));
  
  const content = `
    <h2>${t('report.summary', language)}</h2>
    <p>${t('report.totalItems', language)}: ${logs.length}</p>
    ${generateTableHTML(
      [t('table.timestamp', language), t('table.action', language), t('table.actor', language), t('table.description', language), t('table.severity', language)],
      logData
    )}
  `;
  
  return {
    title: t('report.audit', language),
    content,
    filename: 'audit_logs_report',
    language
  };
};

export const generateConversationReportHTML = (conversations: any[], language: PrintLanguage = 'en') => {
  const convData = conversations.map(conv => ({
    title: conv.title || 'N/A',
    type: conv.type || 'N/A',
    participants: conv.participants || 0,
    messages: conv.messageCount || 0,
    status: conv.isActive ? 'Active' : 'Inactive',
    lastactivity: conv.lastActivity || 'N/A'
  }));
  
  const content = `
    <h2>${t('conversation.monitoring', language)}</h2>
    <p>${t('conversation.total', language)}: ${conversations.length}</p>
    <p>${t('conversation.active', language)}: ${conversations.filter(c => c.isActive).length}</p>
    ${generateTableHTML(
      [t('table.title', language), t('table.type', language), t('table.participants', language), t('table.messages', language), t('table.status', language), t('table.lastactivity', language)],
      convData
    )}
  `;
  
  return {
    title: t('conversation.title', language),
    content,
    filename: 'conversation_report',
    language
  };
};

export const generateMessageHistoryHTML = (messages: any[], language: PrintLanguage = 'en') => {
  const msgData = messages.map(msg => ({
    type: msg.type || 'N/A',
    content: (msg.content || '').substring(0, 100) + ((msg.content || '').length > 100 ? '...' : ''),
    recipients: msg.recipientCount || 0,
    status: msg.status || 'N/A',
    priority: msg.priority || 'N/A',
    sentAt: msg.sentAt || msg.timestamp || 'N/A'
  }));
  
  const content = `
    <h2>${t('report.summary', language)}</h2>
    <p>${t('report.totalItems', language)}: ${messages.length}</p>
    ${generateTableHTML(
      [t('table.type', language), t('table.content', language), t('table.recipients', language), 'Status', t('table.priority', language), t('table.sentAt', language)],
      msgData
    )}
  `;
  
  return {
    title: 'Message History Report',
    content,
    filename: 'message_history_report',
    language
  };
};

export const generateBackupReportHTML = (backupInfo: any, language: PrintLanguage = 'en') => {
  const content = `
    <h2>${t('report.summary', language)}</h2>
    ${generateStatsHTML({
      [t('report.date', language)]: backupInfo.lastBackup || 'N/A',
      'Next Scheduled': backupInfo.nextScheduled || 'N/A',
      'Backup Size': backupInfo.size || 'N/A',
      'Status': backupInfo.status || 'N/A'
    })}
    <h3>${t('table.details', language)}</h3>
    <p>${t('table.type', language)}:</p>
    <ul>
      ${Object.entries(backupInfo.dataTypes || {}).map(([type, included]) => 
        `<li>${type}: ${included ? 'Included' : 'Excluded'}</li>`
      ).join('')}
    </ul>
  `;
  
  return {
    title: t('report.backup', language),
    content,
    filename: 'backup_report',
    language
  };
};

export const generateTrashReportHTML = (trashedItems: any[], type: string, language: PrintLanguage = 'en') => {
  const itemsByType = trashedItems.reduce((acc, item) => {
    const itemType = item.itemType || 'Unknown';
    if (!acc[itemType]) acc[itemType] = [];
    acc[itemType].push(item);
    return acc;
  }, {});
  
  let content = `
    <h2>${t('report.summary', language)}</h2>
    <p>${t('report.totalItems', language)}: ${trashedItems.length}</p>
    <p>${t('table.type', language)}: ${type}</p>
  `;
  
  Object.entries(itemsByType).forEach(([itemType, items]) => {
    const typedItems = items as any[];
    content += `
      <h3>${itemType} ${t('report.totalItems', language)} (${typedItems.length})</h3>
      ${generateTableHTML(
        ['Name/Title', 'ID', t('table.deletedAt', language), t('table.details', language)],
        typedItems.map((item: any) => ({
          name: item.username || item.title || item.name || 'Unknown',
          id: item.id,
          deletedAt: item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'Unknown',
          details: getItemDetails(item, itemType)
        }))
      )}
    `;
  });
  
  return {
    title: t('report.trash', language),
    content,
    filename: 'trash_management_report',
    language
  };
};

export const generateEnhancedUserListHTML = (users: any[], language: PrintLanguage = 'en') => {
  const userData = users.map(user => ({
    username: user.username || 'N/A',
    email: user.email || 'N/A',
    status: user.status || 'N/A',
    role: user.role || 'N/A',
    messages: user.messageCount || 0,
    reports: user.reportCount || 0,
    lastActive: user.lastActive || 'N/A',
    joindate: user.joinDate || 'N/A'
  }));
  
  const content = `
    <h2>${t('report.summary', language)}</h2>
    <p>${t('stats.totalUsers', language)}: ${users.length}</p>
    <p>${t('stats.activeUsers', language)}: ${users.filter(u => u.status === 'active').length}</p>
    <p>${t('stats.suspendedUsers', language)}: ${users.filter(u => u.status === 'suspended').length}</p>
    <p>${t('stats.bannedUsers', language)}: ${users.filter(u => u.status === 'banned').length}</p>
    ${generateTableHTML(
      [t('table.username', language), t('table.email', language), t('table.status', language), t('table.role', language), t('table.messages', language), 'Reports', 'Last Active', t('table.joindate', language)],
      userData
    )}
  `;
  
  return {
    title: t('report.users', language),
    content: content,
    filename: 'enhanced_user_list_report',
    language
  };
};

export const generateStatsCardsHTML = (stats: any[], language: PrintLanguage = 'en') => {
  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.title.toLowerCase().replace(' ', '')] = stat.value;
    return acc;
  }, {});
  
  const content = `
    <h2>${t('report.summary', language)}</h2>
    ${generateStatsHTML(statsMap)}
    <h3>Performance Indicators</h3>
    ${generateTableHTML(
      ['Metric', 'Value', 'Change'],
      stats.map(stat => ({
        metric: stat.title,
        value: stat.value.toLocaleString(),
        change: `${stat.change >= 0 ? '+' : ''}${stat.change}%`
      }))
    )}
  `;
  
  return {
    title: 'Dashboard Statistics Report',
    content,
    filename: 'dashboard_stats_report',
    language
  };
};
