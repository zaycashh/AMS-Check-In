console.log("✅ Detail Company Report Module Loaded");

// ===============================
// LOAD DETAIL COMPANY TAB
// ===============================
function loadDetailCompanyReport() {
  const container = document.getElementById("tabCompany");
  if (!container) return;

  container.innerHTML = `
    <h2 class="section-title">Detail Company Report</h2>

    <div class="filter-bar">
      <label>Company:</label>
      <select id="detailCompanySelect"></select>

      <button id="companyDetailExcelBtn">Export Excel</button>
      <button id="companyDetailPdfBtn" style="margin-left:8px;">
        Export PDF
      </button>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>First</th>
          <th>Last</th>
          <th>Reason</th>
          <th>Services</th>
        </tr>
      </thead>
      <tbody id="companyDetailBody"></tbody>
    </table>
  `;

  populateDetailCompanyDropdown();
  bindDetailCompanyButtons();
}
// ===============================
// RE-RENDER TABLE ON DATE FILTER CHANGE
// ===============================
["detailDateRange", "detailStartDate", "detailEndDate"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", () => {
    loadDetailCompanyReport();
  });
});

// ===============================
// POPULATE COMPANY DROPDOWN
// ===============================
function populateDetailCompanyDropdown() {
  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
  const select = document.getElementById("detailCompanySelect");
  if (!select) return;

  const companies = [...new Set(logs.map(l => l.company).filter(Boolean))];

  select.innerHTML = '<option value="">-- Select Company --</option>';

  companies.forEach(company => {
    const opt = document.createElement("option");
    opt.value = company;
    opt.textContent = company;
    select.appendChild(opt);
  });

  // ✅ MOVE THIS INSIDE
  select.addEventListener("change", renderCompanyDetailTable);
}
function filterByDateRange(records) {
  const range = document.getElementById("detailDateRange")?.value;
  const startInput = document.getElementById("detailStartDate")?.value;
  const endInput = document.getElementById("detailEndDate")?.value;

  if (!range && !startInput && !endInput) return records;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = null;
  let endDate = null;

  if (range === "today") {
    startDate = new Date(today);
    endDate = new Date(today);
  }

  if (range === "yesterday") {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    endDate = new Date(startDate);
  }

  if (range === "thisMonth") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);
  }

  if (startInput) startDate = new Date(startInput);
  if (endInput) endDate = new Date(endInput);

  return records.filter(r => {
    if (!r.date) return false;
    const recordDate = new Date(r.date);
    recordDate.setHours(0, 0, 0, 0);

    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;

    return true;
  });
}

// ===============================
// RENDER TABLE
// ===============================
function renderCompanyDetailTable() {
  const tbody = document.getElementById("companyDetailBody");
  const companyName = document.getElementById("detailCompanySelect")?.value;

  if (!tbody || !companyName) {
    tbody.innerHTML = "";
    return;
  }

  let records = JSON.parse(localStorage.getItem("ams_logs") || "[]")
  .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

records = filterByDateRange(records);

  tbody.innerHTML = "";

  if (!records.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">No records found</td>
      </tr>
    `;
    return;
  }

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.first || ""}</td>
      <td>${r.last || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${Array.isArray(r.services) ? r.services.join(", ") : (r.services || "")}</td>
    `;
    tbody.appendChild(tr);
  });
}
// ===============================
// BIND EXPORT BUTTONS
// ===============================
function bindDetailCompanyButtons() {

  // Excel export
  document
    .getElementById("companyDetailExcelBtn")
    ?.addEventListener("click", exportCompanyExcel);

  // PDF export
  document
    .getElementById("companyDetailPdfBtn")
    ?.addEventListener("click", exportCompanyPdf);
}

// ===============================
// DETAIL COMPANY → PDF (MATCH SEARCH LOG STYLE)
// ===============================
function exportCompanyPdf() {
  const companyName =
    document.getElementById("detailCompanySelect")?.value;

  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  let records = JSON.parse(localStorage.getItem("ams_logs") || "[]")
    .filter(r =>
      (r.company || "").toUpperCase() === companyName.toUpperCase()
    );

  // Apply date filter (same behavior as Search Log)
  records = filterByDateRange(records);

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  const { jsPDF } = window.jspdf;
const doc = new jsPDF("landscape");

/* ===============================
   HEADER BAR
================================ */
doc.setFillColor(30, 94, 150); // AMS blue
doc.rect(0, 0, doc.internal.pageSize.width, 32, "F");


/* ===============================
   LOGO (SAFE BASE64 RENDER)
================================ */
const logoImg = document.getElementById("amsLogoBase64");

if (logoImg && logoImg.complete) {
  const canvas = document.createElement("canvas");
  canvas.width = logoImg.naturalWidth;
  canvas.height = logoImg.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(logoImg, 0, 0);

  const logoBase64 = canvas.toDataURL("image/png");
  doc.addImage(logoBase64, "PNG", 14, 8, 32, 22);
}

/* ===============================
   TITLE
================================ */
doc.setTextColor(255, 255, 255);
doc.setFontSize(16);
doc.text("AMS Detail Company Report", 55, 21);

doc.setTextColor(0, 0, 0);

  /* ===============================
     META INFO
  =============================== */
  const now = new Date();
  const startY = 55;

  doc.setFontSize(12);
  doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, startY);
  doc.text(`Company: ${companyName}`, 14, startY + 10);
  doc.text(`Total Records: ${records.length}`, 14, startY + 20);

  /* ===============================
     TABLE DATA
  =============================== */
  const tableData = records.map(r => [
    r.date || "",
    r.time || "",
    r.first || "",
    r.last || "",
    r.reason || "",
    Array.isArray(r.services) ? r.services.join(", ") : (r.services || "")
  ]);

  doc.autoTable({
  startY: startY + 30,
  head: [["Date", "Time", "First", "Last", "Reason", "Services", "Signature"]],
  body: tableData,

  styles: {
    fontSize: 9,
    cellPadding: 4
  },

  headStyles: {
    fillColor: [30, 94, 150],
    textColor: 255,
    fontStyle: "bold",
    fontSize: 9
  },

  columnStyles: {
    0: { cellWidth: 90 },   // Date
    1: { cellWidth: 80 },   // Time
    2: { cellWidth: 90 },   // First
    3: { cellWidth: 90 },   // Last
    4: { cellWidth: 200 },  // Reason
    5: { cellWidth: 200 },  // Services
    6: { cellWidth: 100, halign: "center" } // Signature
  },

  didDrawCell(data) {
    if (data.column.index === 6 && data.cell.section === "body") {
      const record = records[data.row.index];
      const img = record?.signature;

      if (img && img.startsWith("data:image")) {
        const w = 40;
        const h = 18;
        const x = data.cell.x + (data.cell.width - w) / 2;
        const y = data.cell.y + (data.cell.height - h) / 2;
        doc.addImage(img, "PNG", x, y, w, h);
      }
    }
  },  // ✅ THIS COMMA WAS MISSING

  alternateRowStyles: {
    fillColor: [245, 248, 252]
  }
});

  /* ===============================
     SAVE
  =============================== */
  doc.save(`AMS_Detail_Company_${companyName}.pdf`);
}

// ===============================
// EXPORT EXCEL
// ===============================
function exportCompanyExcel() {
  const companyName =
    document.getElementById("detailCompanySelect")?.value;

  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = JSON.parse(
    localStorage.getItem("ams_logs") || "[]"
  ).filter(
    r => (r.company || "").toUpperCase() === companyName.toUpperCase()
  );

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  // ===============================
  // BUILD EXCEL DATA
  // ===============================
  const wb = XLSX.utils.book_new();

  const headerRows = [
    ["AMS Detail Company Report"],
    [`Company: ${companyName}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["Date", "Time", "First", "Last", "Reason", "Services"]
  ];

  const dataRows = records.map(r => [
    r.date || "",
    r.time || "",
    r.first || "",
    r.last || "",
    r.reason || "",
    Array.isArray(r.services) ? r.services.join(", ") : ""
  ]);

  const sheetData = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // ===============================
  // STYLING
  // ===============================

  // Merge title row
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ];

  // Column widths
  ws["!cols"] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 }
  ];

  // Freeze header row
  ws["!freeze"] = { ySplit: 5 };

  // Style title
  ws["A1"].s = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: "center" }
  };

  // Style table headers
  for (let c = 0; c <= 5; c++) {
    const cell = XLSX.utils.encode_cell({ r: 4, c });
    ws[cell].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E5E96" } },
      alignment: { horizontal: "center" }
    };
  }

  // ===============================
  // EXPORT
  // ===============================
  XLSX.utils.book_append_sheet(wb, ws, "Detail Company");

  XLSX.writeFile(
    wb,
    `AMS_Detail_Company_${companyName}.xlsx`
  );
}

// ===============================
// TAB CLICK HANDLER
// ===============================
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "tabCompany") {
      loadDetailCompanyReport();
    }
  });
});
