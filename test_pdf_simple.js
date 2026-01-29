// Simple PDF conversion test
const convertToPDF = (data) => {
  let pdf = '%PDF-1.4\n';
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  
  let content = 'BT\n/F1 12 Tf\n50 750 Td\n(System Backup Report) Tj\n0 -20 Td\n';
  content += `(Timestamp: ${data.timestamp}) Tj\n0 -20 Td\n`;
  content += `(Month: ${data.month}) Tj\n0 -40 Td\n`;
  
  content += '(System Health) Tj\n0 -20 Td\n';
  if (data.systemHealth) {
    Object.entries(data.systemHealth).forEach(([key, value]) => {
      content += `(${key}: ${value.status}) Tj\n0 -15 Td\n`;
    });
  }
  
  content += '0 -20 Td\n(Data Summary) Tj\n0 -20 Td\n';
  if (data.data && data.data.users) {
    content += `(Users: ${data.data.users.length}) Tj\n0 -15 Td\n`;
  }
  if (data.data && data.data.messages) {
    content += `(Messages: ${data.data.messages.length}) Tj\n0 -15 Td\n`;
  }
  if (data.data && data.data.conversations) {
    content += `(Conversations: ${data.data.conversations.length}) Tj\n0 -15 Td\n`;
  }
  
  content += 'ET\n';
  
  pdf += `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`;
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  pdf += 'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000273 00000 n\n0000000400 00000 n\n';
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF';
  
  return pdf;
};

// Test with proper data structure
const testData = {
  timestamp: new Date().toLocaleString(),
  month: 'current',
  data: {
    users: [],
    messages: [],
    conversations: []
  },
  systemHealth: {
    backup: { status: 'completed', count: 1 },
    database: { status: 'healthy', count: 1 },
    storage: { status: 'available', count: 1 }
  }
};

try {
  const pdfContent = convertToPDF(testData);
  console.log('✅ PDF conversion successful!');
  console.log('PDF length:', pdfContent.length);
  console.log('Starts with:', pdfContent.substring(0, 30));
  console.log('Ends with:', pdfContent.substring(pdfContent.length - 30));
} catch (error) {
  console.error('❌ PDF conversion failed:', error.message);
}
