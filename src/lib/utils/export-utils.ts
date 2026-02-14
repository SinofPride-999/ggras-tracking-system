export function downloadMockFile(filename: string) {
  // In a real app, this would generate a file. For the demo, trigger a simple download.
  const link = document.createElement("a");
  link.href = `/mock-downloads/${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateMockCSV(headers: string[], rows: string[][]): string {
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csvContent;
}

export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = generateMockCSV(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
