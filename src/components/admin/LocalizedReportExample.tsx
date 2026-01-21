import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateUserListHTML,
  generateConversationReportHTML,
  generateAuditLogsHTML,
  generateMessageAnalyticsHTML,
  openPrintWindow,
  downloadPrintHTML,
  PrintLanguage
} from '../lib/printUtils';

/**
 * Example component showing how to generate localized reports
 * Supports English, Pashto (ps), and Dari (prs) languages
 */
export const LocalizedReportExample: React.FC = () => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<PrintLanguage>('en');

  // Example data
  const sampleUsers = [
    {
      username: 'ahmad_user',
      email: 'ahmad@example.com',
      status: 'active',
      role: 'user',
      join_date: '2024-01-15',
      message_count: 45
    },
    {
      username: 'fatima_admin',
      email: 'fatima@example.com',
      status: 'active',
      role: 'admin',
      join_date: '2023-12-01',
      message_count: 120
    }
  ];

  const sampleConversations = [
    {
      title: 'Team Discussion',
      type: 'group',
      participants: 5,
      messageCount: 234,
      isActive: true,
      lastActivity: new Date().toISOString()
    },
    {
      title: 'Private Chat',
      type: 'private',
      participants: 2,
      messageCount: 45,
      isActive: false,
      lastActivity: '2024-01-10'
    }
  ];

  const sampleAuditLogs = [
    {
      timestamp: new Date().toISOString(),
      action: 'USER_CREATED',
      actor: 'admin',
      description: 'New user account created',
      severity: 'INFO'
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'MESSAGE_DELETED',
      actor: 'moderator',
      description: 'Inappropriate message removed',
      severity: 'WARNING'
    }
  ];

  const sampleAnalytics = {
    totalMessages: 5432,
    messagesToday: 234,
    activeUsers: 89,
    averageMessages: 61,
    messageTypes: {
      'Text': 4200,
      'Image': 890,
      'Video': 342
    }
  };

  // Print user list in selected language
  const handlePrintUserList = () => {
    const reportData = generateUserListHTML(sampleUsers, selectedLanguage);
    openPrintWindow(reportData);
  };

  // Download user list as HTML
  const handleDownloadUserList = () => {
    const reportData = generateUserListHTML(sampleUsers, selectedLanguage);
    downloadPrintHTML(reportData);
  };

  // Print conversations in selected language
  const handlePrintConversations = () => {
    const reportData = generateConversationReportHTML(sampleConversations, selectedLanguage);
    openPrintWindow(reportData);
  };

  // Print audit logs in selected language
  const handlePrintAuditLogs = () => {
    const reportData = generateAuditLogsHTML(sampleAuditLogs, selectedLanguage);
    openPrintWindow(reportData);
  };

  // Print analytics in selected language
  const handlePrintAnalytics = () => {
    const reportData = generateMessageAnalyticsHTML(sampleAnalytics, selectedLanguage);
    openPrintWindow(reportData);
  };

  return (
    <div style={{ padding: '20px', direction: selectedLanguage === 'ps' || selectedLanguage === 'prs' ? 'rtl' : 'ltr' }}>
      <h1>Localized Report Generator</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="language-select">Select Language: </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as PrintLanguage)}
          style={{ padding: '8px', marginLeft: '10px' }}
        >
          <option value="en">English</option>
          <option value="ps">پشتو (Pashto)</option>
          <option value="prs">دری (Dari)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
        {/* User List Reports */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>User Management Report</h3>
          <p>Generate and print/download user list reports</p>
          <button onClick={handlePrintUserList} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Print Users
          </button>
          <button onClick={handleDownloadUserList} style={{ padding: '8px 16px' }}>
            Download Users
          </button>
        </div>

        {/* Conversation Reports */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Conversation Monitoring Report</h3>
          <p>Generate conversation activity reports</p>
          <button onClick={handlePrintConversations} style={{ padding: '8px 16px' }}>
            Print Conversations
          </button>
        </div>

        {/* Audit Log Reports */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Audit Logs Report</h3>
          <p>Generate system audit trail reports</p>
          <button onClick={handlePrintAuditLogs} style={{ padding: '8px 16px' }}>
            Print Audit Logs
          </button>
        </div>

        {/* Analytics Reports */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Message Analytics Report</h3>
          <p>Generate message statistics and analytics</p>
          <button onClick={handlePrintAnalytics} style={{ padding: '8px 16px' }}>
            Print Analytics
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Language Support</h3>
        <ul>
          <li><strong>English (en):</strong> Full LTR support with English fonts</li>
          <li><strong>Pashto (ps):</strong> RTL support with Pashto translations and Unicode fonts</li>
          <li><strong>Dari (prs):</strong> RTL support with Dari translations and Unicode fonts</li>
        </ul>
        <p>
          All reports automatically adjust layout, text direction, and fonts based on the selected language.
          RTL languages (Pashto and Dari) display with proper right-to-left text alignment and reversed flex layouts.
        </p>
      </div>
    </div>
  );
};

export default LocalizedReportExample;
