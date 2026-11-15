(() => {
  'use strict';

  const encoder = new TextEncoder();
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const packageRels = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const widths = [34, 21, 18, 22, 12, 20, 20, 17, 17, 35];

  function text(value) {
    return String(value ?? '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '')
      .replace(/_(x[0-9a-f]{4}_)/gi, '_x005F_$1')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/\r/g, '&#13;');
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // The workbook contains a few small XML files, so ZIP storage needs no compression library.
  function zip(files) {
    const local = [], central = [];
    let offset = 0, centralSize = 0;
    for (const [path, content] of files) {
      const name = encoder.encode(path);
      const data = encoder.encode(xml + content);
      const crc = crc32(data);
      const header = new DataView(new ArrayBuffer(30));
      header.setUint32(0, 0x04034b50, true);
      header.setUint16(4, 20, true);
      header.setUint16(12, 33, true); // 1980-01-01 in DOS date format
      header.setUint32(14, crc, true);
      header.setUint32(18, data.length, true);
      header.setUint32(22, data.length, true);
      header.setUint16(26, name.length, true);
      local.push(header.buffer, name, data);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(14, 33, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, data.length, true);
      entry.setUint32(24, data.length, true);
      entry.setUint16(28, name.length, true);
      entry.setUint32(42, offset, true);
      central.push(entry.buffer, name);
      offset += header.byteLength + name.length + data.length;
      centralSize += entry.byteLength + name.length;
    }

    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...local, ...central, end.buffer], { type: mime });
  }

  function cell(value, ref, header) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
      const serial = Math.round((value.getTime() - Date.UTC(1899, 11, 31)) / 86400000);
      return `<c r="${ref}" s="2"><v>${serial >= 60 ? serial + 1 : serial}</v></c>`;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `<c r="${ref}" s="3"><v>${value}</v></c>`;
    }
    return `<c r="${ref}"${header ? ' s="1"' : ''} t="inlineStr"><is><t xml:space="preserve">${text(value)}</t></is></c>`;
  }

  function workbook(sheet, headers, rows) {
    const range = `A1:${String.fromCharCode(64 + headers.length)}${rows.length + 1}`;
    const content = [headers, ...rows].map((values, index) => {
      const number = index + 1;
      return `<row r="${number}">${values.map((value, col) => cell(value, String.fromCharCode(65 + col) + number, index === 0)).join('')}</row>`;
    }).join('');
    return zip([
      ['[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', `<Relationships xmlns="${packageRels}"><Relationship Id="rId1" Type="${office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml', `<workbook xmlns="${main}" xmlns:r="${office}"><bookViews><workbookView/></bookViews><sheets><sheet name="${text(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', `<Relationships xmlns="${packageRels}"><Relationship Id="rId1" Type="${office}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${office}/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', `<styleSheet xmlns="${main}"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd.mm.yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0A2F4F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
      ['xl/worksheets/sheet1.xml', `<worksheet xmlns="${main}"><dimension ref="${range}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${headers.map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="${widths[i]}" customWidth="1"/>`).join('')}</cols><sheetData>${content}</sheetData><autoFilter ref="${range}"/></worksheet>`],
    ]);
  }

  function download(filename, sheet, headers, rows) {
    const url = URL.createObjectURL(workbook(sheet, headers, rows));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  window.ShipaGuestExport = { download };
})();
