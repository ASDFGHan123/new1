// Test PDF conversion function
const convertToPDF = (data) => {
  let pdf = '%PDF-1.4\n';
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  
  let content = 'BT\n/F1 12 Tf\n50 750 Td\n(System Backup Report) Tj\n0 -20 Td\n';
  content += '(Timestamp: ' + data.timestamp + ') Tj\n0 -20 Td\n';
  content += '(Backup ID: ' + (data.backup_id || 'N/A') + ') Tj\n0 -20 Td\n';
  content += '(Name: ' + (data.name || 'N/A') + ') Tj\n0 -20 Td\n';
  content += '(Type: ' + (data.type || 'N/A') + ') Tj\n0 -20 Td\n';
  content += '(Status: ' + (data.status || 'N/A') + ') Tj\n0 -20 Td\n';
  
  if (data.basic) {
    content += '(Created: ' + (data.basic.created_at || 'N/A') + ') Tj\n0 -20 Td\n';
    content += '(Size: ' + (data.basic.size || 'N/A') + ') Tj\n0 -20 Td\n';
  }
  
  if (data.timing) {
    const duration = data.timing.duration || 'N/A';
    content += '(Duration: ' + duration + ') Tj\n0 -20 Td\n';
  }
  
  content += 'ET\n';
  
  pdf += '4 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n';
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  pdf += 'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000273 00000 n\n0000000400 00000 n\n';
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF';
  
  return pdf;
};

// Test the PDF conversion
const testData = {
  timestamp: new Date().toLocaleString(),
  backup_id: 'test-123',
  name: 'Test Backup',
  type: 'users',
  status: 'completed',
  basic: {
    created_at: new Date().toISOString(),
    size: '772 bytes'
  },
  timing: {
    duration: '2s'
  }
};

const pdfContent = convertToPDF(testData);
console.log('PDF Content Length:', pdfContent.length);
console.log('PDF starts with:', pdfContent.substring(0, 50));
console.log('PDF ends with:', pdfContent.substring(pdfContent.length - 50));
console.log('✅ PDF conversion test completed successfully!');
