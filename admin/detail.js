/* =========================================================
   CLOUD DETAIL FETCH (SAFE + NON-BLOCKING)
========================================================= */
let detailCloudCache = null;
let detailCloudAttempted = false;

function getLocalDetailLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

async function fetchDetailLogs() {
  if (detailCloudAttempted) return detailCloudCache || getLocalDetailLogs();
  detailCloudAttempted = true;

  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const logs = await res.json();
    detailCloudCache = logs;

    localStorage.setItem("ams_logs", JSON.stringify(logs));

    console.log("☁️ Detail logs loaded from cloud:", logs.length);
    return logs;
  } catch {
    console.warn("⚠️ Using local detail logs");
    return getLocalDetailLogs();
  }
}
/* =========================================================
   LOGO (PDF)
========================================================= */
let amsLogoBase64 = null;

(function loadLogo() {
  const img = new Image();
  img.src = "logo.png"; // adjust path if needed
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    amsLogoBase64 = canvas.toDataURL("image/png");
  };
})();

console.log("✅ Detail Company Report Module Loaded");

/* =========================================================
   LOAD DETAIL COMPANY TAB
========================================================= */
function loadDetailCompanyReport() {
  const container = document.getElementById("tabCompany");
  if (!container) return;

  container.innerHTML = `
    <h2 class="section-title">Detail Company Report</h2>

    <div class="filter-bar">
  <label>Company:</label>
  <select id="detailCompanySelect"></select>

  <label style="margin-left:12px;">Date Range:</label>
  <select id="detailDateRange">
    <option value="">All Dates</option>
    <option value="today">Today</option>
    <option value="yesterday">Yesterday</option>
    <option value="thisWeek">This Week</option>
    <option value="lastWeek">Last Week</option>
    <option value="thisMonth">This Month</option>
    <option value="lastMonth">Last Month</option>
    <option value="thisYear">This Year</option>
    <option value="lastYear">Last Year</option>
    <option value="custom">Custom</option>
  </select>

  <span id="detailCustomDates" style="display:none;margin-left:8px;">
    <input type="date" id="detailStartDate">
    <input type="date" id="detailEndDate">
  </span>

  <div class="export-right">
  <button id="companyDetailExcelBtn">Export Excel</button>
  <button id="companyDetailPdfBtn">Export PDF</button>
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

<div class="detail-actions">
  <button id="detailSearchBtn">Search</button>
  <button id="detailClearBtn">Clear</button>
</div>
  `;

  // Instant render from local
  populateDetailCompanyDropdown(getLocalDetailLogs());

  // Silent cloud refresh
  fetchDetailLogs().then(logs => {
    populateDetailCompanyDropdown(logs);
  });

  bindDetailCompanyButtons();
  bindDetailActionButtons();
}

/* =========================================================
   POPULATE COMPANY DROPDOWN
========================================================= */
function populateDetailCompanyDropdown(logs) {
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

function bindDetailActionButtons() {
  const searchBtn = document.getElementById("detailSearchBtn");
  const clearBtn = document.getElementById("detailClearBtn");

  if (searchBtn) {
    searchBtn.onclick = () => {
      renderCompanyDetailTable();
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      document.getElementById("detailCompanySelect").value = "";
      document.getElementById("detailDateRange").value = "";
      document.getElementById("detailStartDate").value = "";
      document.getElementById("detailEndDate").value = "";

      const custom = document.getElementById("detailCustomDates");
      if (custom) custom.style.display = "none";

      document.getElementById("companyDetailBody").innerHTML = "";
    };
  }
}

/* =========================================================
   DATE FILTER (TIMESTAMP SAFE)
========================================================= */
function filterByDateRange(records) {
  const range = document.getElementById("detailDateRange")?.value;
  const startInput = document.getElementById("detailStartDate")?.value;
  const endInput = document.getElementById("detailEndDate")?.value;

  if (!range && !startInput && !endInput) return records;

  let startTs = null;
  let endTs = null;
  const now = Date.now();

  switch (range) {
  case "today": {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    startTs = d.getTime();
    endTs = startTs + 86400000 - 1;
    break;
  }

  case "yesterday": {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    endTs = d.getTime() - 1;
    startTs = endTs - 86400000 + 1;
    break;
  }

  case "thisWeek": {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    startTs = d.getTime() - d.getDay() * 86400000;
    endTs = now;
    break;
  }

  case "lastWeek": {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    endTs = d.getTime() - d.getDay() * 86400000 - 1;
    startTs = endTs - 7 * 86400000 + 1;
    break;
  }

  case "thisMonth": {
    const d = new Date();
    startTs = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    endTs = now;
    break;
  }

  case "lastMonth": {
    const d = new Date();
    startTs = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    endTs = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59).getTime();
    break;
  }

  case "thisYear": {
    const d = new Date();
    startTs = new Date(d.getFullYear(), 0, 1).getTime();
    endTs = now;
    break;
  }

  case "lastYear": {
    const y = new Date().getFullYear() - 1;
    startTs = new Date(y, 0, 1).getTime();
    endTs = new Date(y, 11, 31, 23, 59, 59).getTime();
    break;
  }
}

  if (startInput) startTs = new Date(startInput).getTime();
  if (endInput) endTs = new Date(endInput).getTime() + 86400000 - 1;

  return records.filter(r => {
    let ts = r.timestamp;
    if (!ts && r.date) {
      const time = r.time || "00:00";
      ts = new Date(`${r.date} ${time}`).getTime();
    }
    if (!ts) return false;
    if (startTs !== null && ts < startTs) return false;
    if (endTs !== null && ts > endTs) return false;
    return true;
  });
}

/* =========================================================
   RENDER TABLE
========================================================= */
function renderCompanyDetailTable() {
  const tbody = document.getElementById("companyDetailBody");
  const companyName = document.getElementById("detailCompanySelect")?.value;

  if (!tbody || !companyName) {
    tbody.innerHTML = "";
    return;
  }

  const logs = detailCloudCache || getLocalDetailLogs();

  let records = logs.filter(
    r => (r.company || "").toUpperCase() === companyName.toUpperCase()
  );

  records = filterByDateRange(records);

  tbody.innerHTML = "";

  if (!records.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">No records found</td>
      </tr>`;
    return;
  }

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.first || r.firstName || ""}</td>
      <td>${r.last || r.lastName || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${getServicesText(r)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   SERVICES NORMALIZER
========================================================= */
function getServicesText(r) {
  if (Array.isArray(r.services)) return r.services.join(", ");
  if (Array.isArray(r.tests)) return r.tests.join(", ");
  if (typeof r.services === "string") return r.services;
  if (typeof r.tests === "string") return r.tests;

  const list = [];
  if (r.dot) list.push("DOT Drug Test");
  if (r.nonDot) list.push("NON-DOT Drug Test");
  if (r.vision) list.push("Vision Test");
  if (r.alcohol) list.push("Alcohol Test");
  return list.join(", ");
}

/* =========================================================
   EXPORT BUTTONS
========================================================= */
function bindDetailCompanyButtons() {
  document.getElementById("companyDetailExcelBtn")
    ?.addEventListener("click", exportCompanyExcel);

  document.getElementById("companyDetailPdfBtn")
    ?.addEventListener("click", exportCompanyPdf);
}

/* =========================================================
   EXPORT EXCEL
========================================================= */
function getDetailDateRangeLabel() {
  const range = document.getElementById("detailDateRange")?.value;
  const start = document.getElementById("detailStartDate")?.value;
  const end = document.getElementById("detailEndDate")?.value;

  if (!range) return "ALL DATES";

  switch (range) {
    case "today": return "TODAY";
    case "yesterday": return "YESTERDAY";
    case "thisWeek": return "THIS WEEK";
    case "lastWeek": return "LAST WEEK";
    case "thisMonth": return "THIS MONTH";
    case "lastMonth": return "LAST MONTH";
    case "thisYear": return "THIS YEAR";
    case "lastYear": return "LAST YEAR";
    case "custom":
      if (start && end) {
        return `CUSTOM: ${start} – ${end}`;
      }
      return "CUSTOM RANGE";
    default:
      return "ALL DATES";
  }
}

function exportCompanyExcel() {
  const companyName =
    document.getElementById("detailCompanySelect")?.value;

  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = filterByDateRange(
    (detailCloudCache || getLocalDetailLogs()).filter(
      r => (r.company || "").toUpperCase() === companyName.toUpperCase()
    )
  );

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  const header = [
  ["AMS Detail Company Report"],
  [`Company: ${companyName}`],
  [`Date Range: ${getDetailDateRangeLabel()}`],
  [`Generated: ${new Date().toLocaleString()}`],
  [],
  ["Date", "Time", "First", "Last", "Reason", "Services", "Signed"]
];

  const rows = records.map(r => [
  r.date || "",
  r.time || "",
  r.first || r.firstName || "",
  r.last || r.lastName || "",
  r.reason || "",
  getServicesText(r),
  r.signature ? "YES" : "NO"   // ✅ SIGNED COLUMN
]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  const wb = XLSX.utils.book_new();

  ws["!merges"] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }
];
   ws["!cols"] = [
  { wch: 14 }, // Date
  { wch: 10 }, // Time
  { wch: 14 }, // First
  { wch: 14 }, // Last
  { wch: 20 }, // Reason
  { wch: 30 }, // Services
  { wch: 10 }  // Signed
];

  XLSX.utils.book_append_sheet(wb, ws, "Detail Company");
  XLSX.writeFile(wb, `AMS_Detail_Company_${companyName}.xlsx`);
}

/* =========================================================
   EXPORT PDF (MATCH SEARCH LOG)
========================================================= */
function exportCompanyPdf() {
  const companyName =
    document.getElementById("detailCompanySelect")?.value;

  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = filterByDateRange(
    (detailCloudCache || getLocalDetailLogs()).filter(
      r => (r.company || "").toUpperCase() === companyName.toUpperCase()
    )
  );

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  const PAGE_WIDTH = doc.internal.pageSize.width;

  /* ===============================
     HEADER BAR
  =============================== */
  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, PAGE_WIDTH, 34, "F");

  /* ===============================
     LOGO
  =============================== */
  if (amsLogoBase64) {
    doc.addImage(amsLogoBase64, "PNG", 10, 8, 28, 18);
  }

  /* ===============================
     TITLE
  =============================== */
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text(
    "AMS Detail Company Report",
    PAGE_WIDTH / 2,
    16,
    { align: "center" }
  );

  /* ===============================
     COMPANY LABEL (RESTORED)
  =============================== */
  doc.setFontSize(11);
doc.text(
  `Company: ${companyName}`,
  PAGE_WIDTH / 2,
  24,
  { align: "center" }
);

doc.setFontSize(10);
doc.text(
  `Date Range: ${getDetailDateRangeLabel()}`,
  PAGE_WIDTH / 2,
  30,
  { align: "center" }
);


  doc.setTextColor(0);

  /* ===============================
     TABLE DATA
  =============================== */
  const rows = records.map(r => [
    r.date || "",
    r.time || "",
    r.first || r.firstName || "",
    r.last || r.lastName || "",
    r.reason || "",
    getServicesText(r),
    ""
  ]);

  /* ===============================
     TABLE
  =============================== */
  doc.autoTable({
    startY: 42,
    margin: { left: 8, right: 8 },
    head: [[
      "Date",
      "Time",
      "First",
      "Last",
      "Reason",
      "Services",
      "Signature"
    ]],
    body: rows,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle"
    },
    headStyles: {
      fillColor: [30, 94, 150],
      textColor: 255
    },
    columnStyles: {
      6: { cellWidth: 28 }
    },
    didDrawCell(data) {
      if (data.column.index === 6 && data.cell.section === "body") {
        const img = records[data.row.index]?.signature;
        if (img?.startsWith("data:image")) {
          doc.addImage(
            img,
            "PNG",
            data.cell.x + 4,
            data.cell.y + 2,
            20,
            8
          );
        }
      }
    }
  });

  /* ===============================
     FOOTER — GENERATED TIME (RESTORED)
  =============================== */
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    PAGE_WIDTH - 10,
    doc.internal.pageSize.height - 8,
    { align: "right" }
  );

  doc.save(`AMS_Detail_Company_${companyName}_${Date.now()}.pdf`);
}

/* =========================================================
   TAB HANDLER
========================================================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "tabCompany") {
      loadDetailCompanyReport();
    }
  });
});
document.addEventListener("change", e => {
  if (e.target.id === "detailDateRange") {
    const customWrap = document.getElementById("detailCustomDates");
    if (customWrap) {
      customWrap.style.display =
        e.target.value === "custom" ? "inline-block" : "none";
    }
  }
});
