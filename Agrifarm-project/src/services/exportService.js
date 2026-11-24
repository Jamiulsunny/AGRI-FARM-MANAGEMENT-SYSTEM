export const exportService = {
  toCSV(records) {
    const headers = ['ID', 'Tag', 'Type', 'Breed', 'Gender', 'Birth Date', 'Weight (kg)', 'Health Status', 'Created At'];
    const rows = records.map(a => [
      a.id,
      escapeCSV(a.tag),
      escapeCSV(a.type),
      escapeCSV(a.breed),
      a.gender,
      a.birthDate,
      a.weight,
      escapeCSV(a.healthStatus),
      a.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    return csvContent;
  },

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

function escapeCSV(field) {
  if (field === null || field === undefined) return '""';
  let str = String(field);
  // Formula Injection Guard: prepend space if value begins with standard spreadsheet formula characters
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}