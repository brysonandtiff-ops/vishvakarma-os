/**
 * Minimal PDF 1.4 generator for text-based blueprint summaries.
 */

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function buildTextPdf(title: string, lines: string[]): Uint8Array {
  const bodyLines = [title, ...lines];
  const textOps = bodyLines
    .map((line, index) => `BT /F1 12 Tf 50 ${780 - index * 16} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');

  const content = `stream\n${textOps}\nendstream`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${byteLength(textOps)} >>\n${content}\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(byteLength(pdf));
    pdf += object;
  }

  const xrefStart = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export function pdfBytesToBlob(pdfBytes: Uint8Array): Blob {
  return new Blob([Uint8Array.from(pdfBytes)], { type: 'application/pdf' });
}
