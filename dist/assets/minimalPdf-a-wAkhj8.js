function e(e){return e.replace(/\\/g,`\\\\`).replace(/\(/g,`\\(`).replace(/\)/g,`\\)`)}function t(e){return new TextEncoder().encode(e).length}function n(n,r){let i=[n,...r].map((t,n)=>`BT /F1 12 Tf 50 ${780-n*16} Td (${e(t)}) Tj ET`).join(`
`),a=`stream\n${i}\nendstream`,o=[`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`,`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
`,`3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
`,`4 0 obj\n<< /Length ${t(i)} >>\n${a}\nendobj\n`,`5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`],s=`%PDF-1.4
`,c=[0];for(let e of o)c.push(t(s)),s+=e;let l=t(s);s+=`xref\n0 ${o.length+1}\n`,s+=`0000000000 65535 f 
`;for(let e=1;e<=o.length;e++)s+=`${String(c[e]).padStart(10,`0`)} 00000 n \n`;return s+=`trailer\n<< /Size ${o.length+1} /Root 1 0 R >>\nstartxref\n${l}\n%%EOF`,new TextEncoder().encode(s)}function r(r){if(r.length===0)return n(`Empty sheet set`,[`No pages composed.`]);let i=r.length,a=[],o=[],s=[];s.push(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`);let c=s.length;s.push(``);let l=3;for(let n=0;n<i;n++){let i=l++,c=l++;a.push(i),o.push(c);let u=r[n],d=[u.title,...u.lines].map((t,n)=>`BT /F1 12 Tf 50 ${780-n*16} Td (${e(t)}) Tj ET`).join(`
`),f=`stream\n${d}\nendstream`;s.push(`${i} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${c} 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`),s.push(`${c} 0 obj\n<< /Length ${t(d)} >>\n${f}\nendobj\n`)}let u=l;s.push(`${u} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`),s[c]=`2 0 obj\n<< /Type /Pages /Kids [${a.map(e=>`${e} 0 R`).join(` `)}] /Count ${i} >>\nendobj\n`;let d=`%PDF-1.4
`,f=[0];for(let e of s)f.push(t(d)),d+=e;let p=t(d);d+=`xref\n0 ${s.length+1}\n`,d+=`0000000000 65535 f 
`;for(let e=1;e<=s.length;e++)d+=`${String(f[e]).padStart(10,`0`)} 00000 n \n`;return d+=`trailer\n<< /Size ${s.length+1} /Root 1 0 R >>\nstartxref\n${p}\n%%EOF`,new TextEncoder().encode(d)}function i(e){return new Blob([Uint8Array.from(e)],{type:`application/pdf`})}function a(n,r,i,a=`a4`){let o=a===`letter`?`[0 0 792 612]`:`[0 0 842 595]`,s=a===`letter`?792:842,c=a===`letter`?612:595,l=``;for(let e of i)l+=String.fromCharCode(e);let u=btoa(l),d=`6 0 obj\n<< /Type /XObject /Subtype /Image /Width 1200 /Height 800 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${i.length} >>\nstream\n`,f=[`BT /F1 16 Tf 40 560 Td`,`(${e(n)}) Tj ET`,`BT /F1 10 Tf 40 540 Td`,`(${e(r)}) Tj ET`,`q ${s-80} 0 0 ${c-120} 40 40 cm /Im1 Do Q`].join(`
`),p=`stream\n${f}\nendstream`,m=[`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`,`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
`,`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox ${o} /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >> >>\nendobj\n`,`4 0 obj\n<< /Length ${t(f)} >>\n${p}\nendobj\n`,`5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
`,`${d}${u}
endstream
endobj
`],h=`%PDF-1.4
`,g=[0];for(let e of m)g.push(t(h)),h+=e;let _=t(h);h+=`xref\n0 ${m.length+1}\n`,h+=`0000000000 65535 f 
`;for(let e=1;e<=m.length;e++)h+=`${String(g[e]).padStart(10,`0`)} 00000 n \n`;return h+=`trailer\n<< /Size ${m.length+1} /Root 1 0 R >>\nstartxref\n${_}\n%%EOF`,new TextEncoder().encode(h)}export{i,n,a as r,r as t};