// Print utility functions for admin dashboard
export interface PrintOptions {
  title: string;
  subtitle?: string;
  data: any[];
  headers: string[];
  filename?: string;
  dateRange?: string;
  metadata?: Record<string, any>;
}

export interface PrintData {
  title: string;
  content: string;
  subtitle?: string;
  filename?: string;
}

// Generate HTML content for printing
export const generatePrintHTML = (printData: PrintData): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${printData.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
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
            border-left: 4px solid #3b82f6;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
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
            text-align: left;
          }
          .table th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
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
            <span class="meta-label">Generated:</span>
            <span class="meta-value">${new Date().toLocaleString()}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">System:</span>
            <span class="meta-value">OffChat Admin Dashboard</span>
          </div>
        </div>
        
        <div class="content">
          ${printData.content}
        </div>
        
        <div class="footer">
          <p>© 2024 OffChat Admin Dashboard - Confidential Report</p>
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
    
    // Wait for content to load before printing
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
export const generateUserListHTML = (users: any[]) => {
  const userData = users.map(user => ({
    username: user.username || user.name || 'N/A',
    email: user.email || 'N/A',
    status: user.status || 'N/A',
    role: user.role || 'N/A',
    joindate: user.joinDate || user.createdAt || 'N/A',
    messages: user.messageCount || 0
  }));
  
  const content = generateTableHTML(
    ['Username', 'Email', 'Status', 'Role', 'Join Date', 'Messages'],
    userData
  );
  
  return {
    title: 'User Management Report',
    content: `
      <h2>User List Summary</h2>
      <p>Total Users: ${users.length}</p>
      ${content}
    `,
    filename: 'user_list_report'
  };
};

export const generateMessageAnalyticsHTML = (analytics: any) => {
  const stats = {
    totalMessages: analytics.totalMessages || 0,
    messagesToday: analytics.messagesToday || 0,
    activeUsers: analytics.activeUsers || 0,
    averageMessages: analytics.averageMessages || 0
  };
  
  const content = `
    <h2>Message Analytics Overview</h2>
    ${generateStatsHTML(stats)}
    <h3>Detailed Analytics</h3>
    <p>Message Type Distribution:</p>
    ${analytics.messageTypes ? generateTableHTML(['Type', 'Count'], Object.entries(analytics.messageTypes).map(([type, count]) => ({ type, count }))) : 'No data'}
  `;
  
  return {
    title: 'Message Analytics Report',
    content,
    filename: 'message_analytics_report'
  };
};

export const generateAuditLogsHTML = (logs: any[]) => {
  const logData = logs.map(log => ({
    timestamp: log.timestamp || log.time || 'N/A',
    action: log.action || 'N/A',
    actor: log.actor || log.user || 'N/A',
    description: log.description || 'N/A',
    severity: log.severity || 'N/A'
  }));
  
  const content = `
    <h2>Audit Logs Report</h2>
    <p>Total Log Entries: ${logs.length}</p>
    ${generateTableHTML(
      ['Timestamp', 'Action', 'Actor', 'Description', 'Severity'],
      logData
    )}
  `;
  
  return {
    title: 'Audit Logs Report',
    content,
    filename: 'audit_logs_report'
  };
};

export const generateConversationReportHTML = (conversations: any[]) => {
  const convData = conversations.map(conv => ({
    title: conv.title || 'N/A',
    type: conv.type || 'N/A',
    participants: conv.participants || 0,
    messages: conv.messageCount || 0,
    status: conv.isActive ? 'Active' : 'Inactive',
    lastActivity: conv.lastActivity || 'N/A'
  }));
  
  const content = `
    <h2>Conversation Monitoring Report</h2>
    <p>Total Conversations: ${conversations.length}</p>
    <p>Active Conversations: ${conversations.filter(c => c.isActive).length}</p>
    ${generateTableHTML(
      ['Title', 'Type', 'Participants', 'Messages', 'Status', 'Last Activity'],
      convData
    )}
  `;
  
  return {
    title: 'Conversation Report',
    content,
    filename: 'conversation_report'
  };
};

export const generateMessageHistoryHTML = (messages: any[]) => {
  const msgData = messages.map(msg => ({
    type: msg.type || 'N/A',
    content: (msg.content || '').substring(0, 100) + ((msg.content || '').length > 100 ? '...' : ''),
    recipients: msg.recipientCount || 0,
    status: msg.status || 'N/A',
    priority: msg.priority || 'N/A',
    sentAt: msg.sentAt || msg.timestamp || 'N/A'
  }));
  
  const content = `
    <h2>Message History Report</h2>
    <p>Total Messages: ${messages.length}</p>
    ${generateTableHTML(
      ['Type', 'Content', 'Recipients', 'Status', 'Priority', 'Sent At'],
      msgData
    )}
  `;
  
  return {
    title: 'Message History Report',
    content,
    filename: 'message_history_report'
  };
};

export const generateBackupReportHTML = (backupInfo: any) => {
  const content = `
    <h2>Backup Status Report</h2>
    ${generateStatsHTML({
      lastBackup: backupInfo.lastBackup || 'N/A',
      nextScheduled: backupInfo.nextScheduled || 'N/A',
      backupSize: backupInfo.size || 'N/A',
      status: backupInfo.status || 'N/A'
    })}
    <h3>Backup Details</h3>
    <p>Data Types Included:</p>
    <ul>
      ${Object.entries(backupInfo.dataTypes || {}).map(([type, included]) => 
        `<li>${type}: ${included ? 'Included' : 'Excluded'}</li>`
      ).join('')}
    </ul>
  `;
  
  return {
    title: 'Backup Status Report',
    content,
    filename: 'backup_report'
  };
};

export const generateTrashReportHTML = (trashedItems: any[], type: string) => {
  const itemsByType = trashedItems.reduce((acc, item) => {
    const itemType = item.itemType || 'Unknown';
    if (!acc[itemType]) acc[itemType] = [];
    acc[itemType].push(item);
    return acc;
  }, {});
  
  let content = `
    <h2>Trash Management Report</h2>
    <p>Total Items in Trash: ${trashedItems.length}</p>
    <p>Report Type: ${type}</p>
  `;
  
  Object.entries(itemsByType).forEach(([itemType, items]) => {
    const typedItems = items as any[];
    content += `
      <h3>${itemType} Items (${typedItems.length})</h3>
      ${generateTableHTML(
        ['Name/Title', 'ID', 'Deleted At', 'Details'],
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
    title: 'Trash Management Report',
    content,
    filename: 'trash_management_report'
  };
};

export const generateEnhancedUserListHTML = (users: any[]) => {
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
    <h2>Enhanced User Management Report</h2>
    <p>Total Users: ${users.length}</p>
    <p>Active Users: ${users.filter(u => u.status === 'active').length}</p>
    <p>Suspended Users: ${users.filter(u => u.status === 'suspended').length}</p>
    <p>Banned Users: ${users.filter(u => u.status === 'banned').length}</p>
    ${generateTableHTML(
      ['Username', 'Email', 'Status', 'Role', 'Messages', 'Reports', 'Last Active', 'Join Date'],
      userData
    )}
  `;
  
  return {
    title: 'Enhanced User List Report',
    content: content,
    filename: 'enhanced_user_list_report'
  };
};

export const generateStatsCardsHTML = (stats: any[]) => {
  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.title.toLowerCase().replace(' ', '')] = stat.value;
    return acc;
  }, {});
  
  const content = `
    <h2>Dashboard Statistics Overview</h2>
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
    filename: 'dashboard_stats_report'
  };
};