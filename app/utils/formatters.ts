export function getFileFormat(fileType: string): string {
  const format = fileType.split('/').pop() || fileType;
  
  const formatMap: Record<string, string> = {
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'msword': 'DOC',
    'pdf': 'PDF',
    'plain': 'TXT',
    'text/plain': 'TXT'
  };

  return formatMap[format] || format.toUpperCase();
} 