// Builds the MamaTrack GPS research report as a .docx laid out to the
// Kyambogo University Undergraduate Research Project/Report Guidelines (2025):
// Times New Roman 12, 1.5 line spacing throughout, table captions above and
// figure captions below in bold and indented, unnumbered title page, roman
// preliminary pages and arabic body pages.
//
//   node report/build_docx.cjs
//

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, Header, Footer,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, LevelFormat, NumberFormat, PageNumber,
  TableOfContents, PositionalTab, PositionalTabAlignment, PositionalTabLeader,
  PositionalTabRelativeTo, SectionType, convertInchesToTwip,
  Bookmark, SimpleField, InternalHyperlink,
} = require('docx');

const { ACRONYMS, TERMS, ABSTRACT, CH1, CH2 } = require('./content.cjs');
const { CH3, CH4, CH5, CH6, REFERENCES } = require('./content2.cjs');

const HERE = __dirname;
const DIAGRAMS = path.join(HERE, 'diagrams');

const FONT = 'Times New Roman';
const SIZE = 24;         // 12 pt in half-points
const LINE = 360;        // 1.5 line spacing in twentieths of a point
const CAP_INDENT = 360;  // caption indent, roughly five spaces

// Caption page numbers in the List of Tables and List of Figures are Word
// PAGEREF fields pointing at a bookmark on each caption, so Word resolves them
// itself on field update rather than the build having to lay the document out.
const bookmarkId = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_');

// ------------------------------------------------------------------ helpers

const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: SIZE, ...opts });

const para = (text, opts = {}) => new Paragraph({
  children: Array.isArray(text) ? text : [run(text)],
  spacing: { line: LINE, after: 160 },
  alignment: AlignmentType.JUSTIFIED,
  ...opts,
});

const plain = (text, opts = {}) => new Paragraph({
  children: [run(text, opts.runOpts || {})],
  spacing: { line: LINE, after: opts.after === undefined ? 120 : opts.after },
  alignment: opts.alignment || AlignmentType.LEFT,
  indent: opts.indent,
});

const blank = (count = 1) => Array.from({ length: count }, () => new Paragraph({
  children: [run('')], spacing: { line: LINE },
}));

// Centred, bold, uppercase heading used for every preliminary page and for the
// chapter titles. outlineLevel keeps them in the generated table of contents.
const bigHeading = (text, level = 1) => new Paragraph({
  children: [run(text, { bold: true })],
  alignment: AlignmentType.CENTER,
  heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
  spacing: { line: LINE, before: 240, after: 280 },
});

const sub2 = (num, text) => new Paragraph({
  children: [run(`${num} ${text}`, { bold: true })],
  heading: HeadingLevel.HEADING_2,
  spacing: { line: LINE, before: 280, after: 140 },
});

const sub3 = (num, text) => new Paragraph({
  children: [run(`${num} ${text}`, { bold: true })],
  heading: HeadingLevel.HEADING_3,
  spacing: { line: LINE, before: 220, after: 120 },
});

const bullet = (text) => new Paragraph({
  children: [run(text)],
  numbering: { reference: 'bullets', level: 0 },
  spacing: { line: LINE, after: 100 },
  alignment: AlignmentType.JUSTIFIED,
});

const numbered = (text, ref) => new Paragraph({
  children: [run(text)],
  numbering: { reference: ref, level: 0 },
  spacing: { line: LINE, after: 100 },
  alignment: AlignmentType.JUSTIFIED,
});

// Guidelines: captions bold and indented; table caption above, figure below.
// Each caption carries a bookmark so the lists can reference its page.
const caption = (label, text) => new Paragraph({
  children: [
    new Bookmark({
      id: bookmarkId(label.replace(/:$/, '')),
      children: [run(`${label} ${text}`, { bold: true })],
    }),
  ],
  spacing: { line: LINE, before: 120, after: 160 },
  indent: { left: CAP_INDENT },
});

// Explanatory notes under a table or figure are set one point smaller.
const smallNote = (text) => new Paragraph({
  children: [new TextRun({ text, font: FONT, size: 22, italics: true })],
  spacing: { line: LINE, after: 200 },
  indent: { left: CAP_INDENT },
});

const CONTENT_WIDTH = 9360; // 6.5 inches in DXA

function table(head, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const scaled = widths.map(w => Math.round(w * CONTENT_WIDTH / total));

  const cell = (text, i, isHead) => new TableCell({
    width: { size: scaled[i], type: WidthType.DXA },
    shading: isHead
      ? { type: ShadingType.CLEAR, fill: 'E8ECEE', color: 'auto' }
      : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 22, bold: !!isHead })],
      spacing: { line: 240, after: 0 },
    })],
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: scaled,
    rows: [
      new TableRow({
        tableHeader: true,
        children: head.map((h, i) => cell(h, i, true)),
      }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}

function figure(file) {
  const buf = fs.readFileSync(path.join(DIAGRAMS, file));
  // Aspect ratios of the source plates, used to scale each to the text width.
  const ratios = {
    'fig01_system_architecture.png': 0.729,
    'fig02_module_architecture.png': 0.724,
    'fig03_context_diagram.png': 0.721,
    'fig04_dfd_level0.png': 0.615,
    'fig05_dfd_level1.png': 0.687,
    'fig06_er_diagram.png': 0.743,
    'fig07_use_case.png': 0.715,
    'fig08_state_machine.png': 0.593,
    'fig09_sequence.png': 0.700,
    'fig10_offline_sync.png': 0.623,
  };
  const width = 600; // px at 96 dpi -> 6.25 inches
  return new Paragraph({
    children: [new ImageRun({
      data: buf,
      type: 'png',
      transformation: { width, height: Math.round(width * ratios[file]) },
    })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE, before: 160, after: 60 },
  });
}

// Placeholder frame for a screen capture the author inserts.
function shotPlate(label) {
  return new Paragraph({
    children: [new TextRun({
      text: `[ Insert screen capture: ${label} ]`,
      font: FONT, size: 22, italics: true, color: '808080',
    })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE, before: 200, after: 200 },
    border: {
      top:    { style: BorderStyle.DASHED, size: 6, color: 'AAAAAA', space: 20 },
      bottom: { style: BorderStyle.DASHED, size: 6, color: 'AAAAAA', space: 20 },
      left:   { style: BorderStyle.DASHED, size: 6, color: 'AAAAAA', space: 20 },
      right:  { style: BorderStyle.DASHED, size: 6, color: 'AAAAAA', space: 20 },
    },
  });
}

function codeBlock(lines) {
  return lines.map((l, i) => new Paragraph({
    children: [new TextRun({ text: l || ' ', font: 'Courier New', size: 18 })],
    spacing: { line: 240, after: 0 },
    indent: { left: CAP_INDENT },
    keepNext: i < lines.length - 1,
  }));
}

// Dot-leader entry used by the List of Tables and List of Figures. The label
// links to the caption and the page number is a PAGEREF field Word resolves.
function listEntry(label, key) {
  const anchor = bookmarkId(key);
  return new Paragraph({
    children: [
      new InternalHyperlink({ anchor, children: [run(label)] }),
      new TextRun({
        font: FONT, size: SIZE,
        children: [new PositionalTab({
          alignment: PositionalTabAlignment.RIGHT,
          relativeTo: PositionalTabRelativeTo.MARGIN,
          leader: PositionalTabLeader.DOT,
        })],
      }),
      new SimpleField(`PAGEREF ${anchor} \\h`, '–'),
    ],
    spacing: { line: LINE, after: 80 },
  });
}

// ------------------------------------------------------- chapter rendering

const FIGURE_INDEX = [];
const TABLE_INDEX = [];

function renderNodes(nodes) {
  const out = [];
  for (const node of nodes) {
    switch (node.t) {
      case 'p':    out.push(para(node.x)); break;
      case 'h2':   out.push(sub2(node.n, node.x)); break;
      case 'h3':   out.push(sub3(node.n, node.x)); break;
      case 'b':    out.push(bullet(node.x)); break;
      case 'n':    out.push(numbered(node.x, 'ordered')); break;
      case 'note': out.push(smallNote(node.x)); break;
      case 'code': out.push(...codeBlock(node.x)); break;
      case 'fig':
        FIGURE_INDEX.push({ label: `Figure ${node.n}: ${node.cap}`, key: `Figure ${node.n}` });
        out.push(figure(node.img));
        out.push(caption(`Figure ${node.n}:`, node.cap));
        break;
      case 'shot':
        FIGURE_INDEX.push({ label: `Figure ${node.n}: ${node.cap}`, key: `Figure ${node.n}` });
        out.push(shotPlate(node.cap));
        out.push(caption(`Figure ${node.n}:`, node.cap));
        break;
      case 'tbl':
        TABLE_INDEX.push({ label: `Table ${node.n}: ${node.cap}`, key: `Table ${node.n}` });
        out.push(caption(`Table ${node.n}:`, node.cap));
        out.push(table(node.head, node.rows, node.widths));
        out.push(new Paragraph({ children: [run('')], spacing: { line: LINE, after: 160 } }));
        break;
      default: throw new Error(`unknown node type ${node.t}`);
    }
  }
  return out;
}

const chapter = (title, nodes) => [
  new Paragraph({ children: [new PageBreak()] }),
  bigHeading(title),
  ...renderNodes(nodes),
];

// Body is rendered before the preliminary pages so that FIGURE_INDEX and
// TABLE_INDEX are populated by the time the lists are built.
const BODY = [
  bigHeading('CHAPTER ONE: INTRODUCTION'),
  ...renderNodes(CH1),
  ...chapter('CHAPTER TWO: LITERATURE REVIEW', CH2),
  ...chapter('CHAPTER THREE: RESEARCH METHODOLOGY', CH3),
  ...chapter('CHAPTER FOUR: SYSTEMS ANALYSIS AND REQUIREMENTS COLLECTION', CH4),
  ...chapter('CHAPTER FIVE: SYSTEM DESIGN, IMPLEMENTATION, TESTING AND VALIDATION', CH5),
  ...chapter('CHAPTER SIX: DISCUSSION, RECOMMENDATIONS AND CONCLUSION', CH6),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('REFERENCES'),
  ...REFERENCES.map(r => new Paragraph({
    children: [run(r)],
    spacing: { line: LINE, after: 160 },
    indent: { left: 720, hanging: 720 },
    alignment: AlignmentType.JUSTIFIED,
  })),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('APPENDICES'),
  sub2('Appendix I:', 'Introductory and Permission Letter'),
  para('A letter of introduction from the Department of Computer Science, School of Computing and Information Science, Kyambogo University, requesting permission to conduct the study at Mukono General Hospital and its surrounding health centres, together with the written approval granted by the District Health Office.'),
  sub2('Appendix II:', 'Questionnaire'),
  para('The structured questionnaire administered to expectant mothers and Village Health Team members, covering device ownership, network availability at the respondent’s home, the means currently used to summon help during an obstetric emergency, and the time typically taken for assistance to arrive.'),
  sub2('Appendix III:', 'Interview Schedule'),
  para('The semi-structured interview schedule used with midwives, obstetricians, ambulance drivers and district health administrators, covering the current dispatch procedure, the points at which location information is lost, and specific incidents in which locating a patient failed.'),
  sub2('Appendix IV:', 'Budget'),
  ...renderNodes([{
    t: 'tbl', n: 'A1', cap: 'Research Budget',
    head: ['Item', 'Description', 'Amount (UGX)'],
    widths: [2600, 4560, 2200],
    rows: [
      ['Transport', 'Field visits to Mukono General Hospital, Nama and Koome', '450,000'],
      ['Communication', 'Airtime and data during requirements collection and testing', '180,000'],
      ['Stationery', 'Printing of instruments, binding of the report', '220,000'],
      ['Cloud services', 'Database and hosting during development and validation', '300,000'],
      ['Contingency', 'Unforeseen expenditure at ten per cent', '115,000'],
      ['Total', '', '1,265,000'],
    ],
  }]),
  sub2('Appendix V:', 'Time Schedule'),
  ...renderNodes([{
    t: 'tbl', n: 'A2', cap: 'Research Time Schedule',
    head: ['Phase', 'Activity', 'Weeks'],
    widths: [2600, 4560, 2200],
    rows: [
      ['Research and requirements', 'Literature review, requirements gathering, architecture', '1 – 3'],
      ['System development', 'Database design, portal implementation, GPS and map integration', '4 – 7'],
      ['Validation and documentation', 'Testing, simulated scenario validation, report writing', '8 – 10'],
    ],
  }]),
  sub2('Appendix VI:', 'Sample Code'),
  para('The database schema listing and further extracts from the emergency dispatch, synchronisation and geolocation modules of the delivered system.'),
];

// ------------------------------------------------------- preliminary pages

const TITLE_PAGE = [
  ...blank(2),
  plain('A GPS-BASED MATERNAL EMERGENCY RESPONSE AND MONITORING SYSTEM FOR IMPROVING HEALTH IN UGANDA', { alignment: AlignmentType.CENTER, runOpts: { bold: true }, after: 240 }),
  ...blank(1),
  plain('CASE STUDY: MUKONO DISTRICT', { alignment: AlignmentType.CENTER, runOpts: { bold: true }, after: 240 }),
  ...blank(2),
  plain('BY', { alignment: AlignmentType.CENTER, after: 200 }),
  plain('MUHINDA PRAISE FRANCIS', { alignment: AlignmentType.CENTER, runOpts: { bold: true }, after: 40 }),
  plain('23/U/ITD/08374/PD', { alignment: AlignmentType.CENTER, after: 40 }),
  plain('francispraise10@gmail.com  ·  +256-(0)-742 912806', { alignment: AlignmentType.CENTER, after: 180 }),
  plain('NABUKEERA ZAHARAH RAMULAH', { alignment: AlignmentType.CENTER, runOpts: { bold: true }, after: 40 }),
  plain('23/U/ITD/14136/PD', { alignment: AlignmentType.CENTER, after: 40 }),
  plain('zahranabujeera60@gmail.com  ·  +256-(0)-769 966851', { alignment: AlignmentType.CENTER, after: 180 }),
  plain('KATO HASSAN', { alignment: AlignmentType.CENTER, runOpts: { bold: true }, after: 40 }),
  plain('23/U/ITD/06601/PD', { alignment: AlignmentType.CENTER, after: 40 }),
  plain('Khassankato37@gmail.com  ·  +256-(0)-751 109404', { alignment: AlignmentType.CENTER, after: 240 }),
  ...blank(2),
  plain('A RESEARCH REPORT SUBMITTED TO THE DEPARTMENT OF COMPUTER SCIENCE, SCHOOL OF COMPUTING AND INFORMATION SCIENCE IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE BACHELORS DEGREE IN INFORMATION TECHNOLOGY AND COMPUTING OF KYAMBOGO UNIVERSITY', { alignment: AlignmentType.CENTER, after: 300 }),
  ...blank(2),
  plain('AUGUST 2026', { alignment: AlignmentType.CENTER, runOpts: { bold: true } }),
];

const signature = (name, role) => [
  ...blank(1),
  plain('Signature :…………………………………….          Date:………………………………', { after: 160 }),
  plain(name, { runOpts: { bold: true }, after: 20 }),
  plain(`(${role})`, { after: 200 }),
];

const PRELIM = [
  bigHeading('DECLARATION'),
  para('We, Muhinda Praise Francis, Nabukeera Zaharah Ramulah and Kato Hassan, declare that the work presented in this research report is our original work and has not been submitted to any University or Institution of Higher Learning for any academic award. All work from other authors has been fully and properly acknowledged and cited.'),
  ...signature('Muhinda Praise Francis', 'Researcher'),
  ...signature('Nabukeera Zaharah Ramulah', 'Researcher'),
  ...signature('Kato Hassan', 'Researcher'),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('APPROVAL'),
  para('This is to certify that this research report titled: “A GPS-Based Maternal Emergency Response and Monitoring System for Improving Health in Uganda” has been carried out under my supervision and is now ready for submission to the Examinations Board and Senate of Kyambogo University.'),
  ...signature('Ms. Ahimbisibwe Shallon', 'Supervisor'),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('DEDICATION'),
  para('We dedicate this work to the mothers of Mukono District, and to the memory of those whose lives were lost not for want of medicine but for want of being found in time. We dedicate it also to our families, whose patience and support carried us through this study, and to the Village Health Team members who walk to those homes.'),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('ACKNOWLEDGEMENT'),
  para('We wish to express our sincere gratitude to our supervisor, Ms. Ahimbisibwe Shallon, whose guidance and patient page-by-page review shaped both this report and the system it describes.'),
  para('We are grateful to the Department of Computer Science and the School of Computing and Information Science, Kyambogo University, for the academic foundation on which this work rests, and to the members of the research committee for their direction.'),
  para('We thank the management and clinical staff of Mukono General Hospital, the midwives and obstetricians who gave their time to be interviewed during demanding shifts, the ambulance drivers who allowed us to observe their work, and the district health administrators who granted access to referral records. We thank collectively the expectant mothers and the Village Health Team members who completed our questionnaires; their accounts of waiting for help that could not find them are the reason this system exists.'),
  para('Finally, we thank our families and colleagues for their encouragement throughout the period of this study.'),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('LIST OF ACRONYMS'),
  ...ACRONYMS.map(([a, full]) => new Paragraph({
    children: [run(a, { bold: true }), run(` ${full}`)],
    spacing: { line: LINE, after: 60 },
    indent: { left: 1440, hanging: 1440 },
  })),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('DEFINITION OF TERMS USED'),
  ...TERMS.map(([term, def]) => new Paragraph({
    children: [run(`${term}. `, { bold: true }), run(def)],
    spacing: { line: LINE, after: 140 },
    alignment: AlignmentType.JUSTIFIED,
  })),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('TABLE OF CONTENTS'),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  smallNote('This table, and the page numbers in the List of Tables and List of Figures, are generated fields. To populate them in Microsoft Word, press Ctrl+A then F9, and choose “Update entire table”.'),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('LIST OF TABLES'),
  ...TABLE_INDEX.map(t => listEntry(t.label, t.key)),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('LIST OF FIGURES'),
  ...FIGURE_INDEX.map(f => listEntry(f.label, f.key)),

  new Paragraph({ children: [new PageBreak()] }),
  bigHeading('ABSTRACT'),
  ...renderNodes(ABSTRACT),
];

// ------------------------------------------------------------------ document

const PAGE = {
  margin: {
    top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
    left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25),
  },
};

const footer = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SIZE })],
  })],
});

const doc = new Document({
  creator: 'Muhinda Praise Francis, Nabukeera Zaharah Ramulah, Kato Hassan',
  title: 'A GPS-Based Maternal Emergency Response and Monitoring System for Improving Health in Uganda',
  description: 'Undergraduate research report, Kyambogo University',
  styles: {
    default: {
      document: { run: { font: FONT, size: SIZE }, paragraph: { spacing: { line: LINE } } },
      heading1: { run: { font: FONT, size: SIZE, bold: true, color: '000000' } },
      heading2: { run: { font: FONT, size: SIZE, bold: true, color: '000000' } },
      heading3: { run: { font: FONT, size: SIZE, bold: true, color: '000000' } },
    },
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'ordered',
        levels: [{
          level: 0, format: LevelFormat.LOWER_ROMAN, text: '(%1)', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // Title page — no page number.
    { properties: { page: PAGE }, children: TITLE_PAGE },
    // Preliminary pages — lower-case roman, restarting at i.
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { ...PAGE, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } },
      },
      footers: { default: footer() },
      children: PRELIM,
    },
    // Body — arabic, restarting at 1.
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { ...PAGE, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      footers: { default: footer() },
      children: BODY,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(HERE, 'MamaTrack_GPS_Research_Report.docx');
  fs.writeFileSync(out, buf);
  console.log(`wrote ${out} (${(buf.length / 1e6).toFixed(2)} MB)`);
  console.log(`figures: ${FIGURE_INDEX.length}, tables: ${TABLE_INDEX.length}`);
  console.log('page numbers: PAGEREF fields — press Ctrl+A then F9 in Word to populate');
});
