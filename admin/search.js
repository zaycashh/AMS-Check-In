/* =========================================================
   CLOUD SEARCH FETCH (WITH FALLBACK)
========================================================= */
async function fetchSearchLogs() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs"
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const logs = await res.json();

    // Cache for offline use
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    console.log("☁️ Search logs loaded from cloud:", logs.length);
    return logs;
  } catch (err) {
    console.warn("⚠️ Using local logs");
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
  }
}

console.log("Admin Search Module Loaded");

let amsLogoBase64 = null;

(function loadLogo() {
  const img = new Image();
  img.src = "logo.png";
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    amsLogoBase64 = canvas.toDataURL("image/png");
  };
})();
/* =========================================================
   DATE NORMALIZATION
========================================================= */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  return d;
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  populateSearchCompanies();
  clearSearchTable();
});
   
/* =========================================================
   RUN SEARCH
========================================================= */
window.runSearch = async function () {
  clearSearchTable();
  const first = document.getElementById("filterFirstName")?.value.trim().toLowerCase();
  const last = document.getElementById("filterLastName")?.value.trim().toLowerCase();

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document.getElementById("searchFilterCompanyText")?.value.trim().toLowerCase();

  const company =
    companySelect?.value === "__custom__"
      ? companyText
      : companySelect?.value.toLowerCase();

  const range = document.getElementById("filterDateRange")?.value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const logs = await fetchSearchLogs();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = null;
  let endDate = null;

  switch (range) {
    case "today":
      startDate = new Date(today);
      endDate = new Date(today);
      break;
    case "yesterday":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case "thisWeek":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      endDate = new Date(today);
      break;
    case "lastWeek":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay() - 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today);
      break;
    case "lastMonth":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today);
      break;
    case "lastYear":
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
      break;
    case "custom":
      if (startInput) startDate = normalizeDate(startInput);
      if (endInput) endDate = normalizeDate(endInput);
      break;
  }

  if (endDate) endDate.setHours(23, 59, 59, 999);

  const filtered = logs.filter(entry => {
    const logDate = normalizeDate(entry.date);
if (!logDate) return false;

if (startDate && logDate < startDate) return false;
if (endDate && logDate > endDate) return false;


    const f = entry.firstName || entry.first || "";
    const l = entry.lastName || entry.last || "";

    if (first && !f.toLowerCase().includes(first)) return false;
    if (last && !l.toLowerCase().includes(last)) return false;
    if (company && !entry.company?.toLowerCase().includes(company)) return false;

    return true;
  });
  
  if (filtered.length === 0) {
  window.searchResults = [];
  renderSearchResults([]);
  return;
}

  filtered.sort((a, b) => {
    const ta = a.timestamp || new Date(a.date).getTime();
    const tb = b.timestamp || new Date(b.date).getTime();
    return tb - ta;
  });

  window.searchResults = filtered;
  renderSearchResults(filtered);
};

/* =========================================================
   RENDER TABLE
========================================================= */
function renderSearchResults(results) {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (!table) return;

  table.innerHTML = "";

  if (counter) {
    counter.textContent =
      results.length === 0
        ? "No results found"
        : `${results.length} result${results.length > 1 ? "s" : ""} found`;
  }

  if (!results.length) {
    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">
          No matching records
        </td>
      </tr>`;
    return;
  }

  results.forEach(r => {
    const servicesValue =
      Array.isArray(r.services) ? r.services :
      Array.isArray(r.tests) ? r.tests :
      typeof r.services === "string" ? [r.services] :
      typeof r.tests === "string" ? [r.tests] : [];

    const servicesText = servicesValue.join(", ");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.firstName || r.first || ""}</td>
      <td>${r.lastName || r.last || ""}</td>
      <td>${r.company || ""}</td>
      <td>${r.reason || ""}</td>
      <td style="max-width:220px;white-space:normal;">${servicesText}</td>
      <td style="text-align:center;vertical-align:middle;">
        ${
          r.signature
            ? `<img src="${r.signature}"
                 style="width:100px;height:35px;object-fit:contain;
                        display:block;margin:0 auto;
                        border:1px solid #ccc;background:#fff;">`
            : ""
        }
      </td>`;
    table.appendChild(row);
  });
}

/* =========================================================
   COMPANY DROPDOWN
========================================================= */
function populateSearchCompanies() {
  const select = document.getElementById("searchFilterCompany");
  if (!select) return;

  select.innerHTML = `
    <option value="">All Companies</option>
    <option value="__custom__">Type Company (Custom)</option>
  `;

  const companies = JSON.parse(localStorage.getItem("ams_companies") || "[]");
  companies.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name.toLowerCase();
    opt.textContent = name;
    select.appendChild(opt);
  });
}

window.toggleSearchCompanyText = function (value) {
  const input = document.getElementById("searchFilterCompanyText");
  if (!input) return;
  input.style.display = value === "__custom__" ? "block" : "none";
  if (value === "__custom__") input.focus();
};
/* =========================================================
   CUSTOM DATE RANGE TOGGLE
========================================================= */
window.toggleCustomDateRange = function (value) {
  const wrapper = document.getElementById("customDateRange");
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");

  if (!wrapper || !start || !end) return;

  if (value === "custom") {
    wrapper.style.display = "block";
  } else {
    wrapper.style.display = "none";
    start.value = "";
    end.value = "";
  }
};

/* =========================================================
   CLEAR SEARCH
========================================================= */
function clearSearchTable() {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (counter) counter.textContent = "";
  if (table) {
    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">
          Use filters and click Search to view records
        </td>
      </tr>`;
  }
}

window.clearSearch = function () {
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";
  document.getElementById("searchFilterCompany").value = "";
  document.getElementById("searchFilterCompanyText").value = "";
  document.getElementById("searchFilterCompanyText").style.display = "none";
  document.getElementById("filterDateRange").value = "";
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  window.searchResults = [];
  clearSearchTable();
};
/* =========================================================
   SERVICES NORMALIZER (USED BY TABLE, PDF, EXCEL)
========================================================= */
function getServicesText(r) {
  if (Array.isArray(r.services)) return r.services.join(", ");
  if (typeof r.services === "string") return r.services;

  const list = [];

  if (r.dot) list.push("DOT Drug Test");
  if (r.nonDot) list.push("NON-DOT Drug Test");
  if (r.vision) list.push("Vision Test");

  return list.join(", ");
}
/* =========================================================
   EXPORT EXCEL
========================================================= */
function exportSearchLogExcel() {
  const results = window.searchResults || [];
  if (!results.length) return;

  const data = results.map(r => ({
    Date: r.date,
    Time: r.time,
    First: r.firstName || r.first,
    Last: r.lastName || r.last,
    Company: r.company,
    Reason: r.reason,
    Services: getServicesText(r),
    Signature: r.signature ? "Signed" : ""
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");
  XLSX.writeFile(wb, "AMS_Search_Log.xlsx");
}
window.exportSearchPdf = function () {
  const records = window.searchResults || [];
  if (!records.length) {
    alert("Please run a search first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  const pageWidth = doc.internal.pageSize.width;

  /* ================= HEADER ================= */
  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, pageWidth, 30, "F");

  if (window.amsLogoBase64) {
    doc.addImage(amsLogoBase64, "PNG", 8, 6, 26, 18);
  }

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  /* ================= TABLE DATA ================= */
  const rows = records.map(r => [
    r.date || "",
    r.time || "",
    r.firstName || r.first || "",
    r.lastName || r.last || "",
    r.company || "",
    r.reason || "",
    getServicesText(r),
    "" // signature drawn manually
  ]);

  doc.autoTable({
    startY: 36,

    /* 🔴 THIS IS THE KEY FIX */
    margin: { left: 8, right: 8 },

    head: [[
      "Date",
      "Time",
      "First",
      "Last",
      "Company",
      "Reason",
      "Services",
      "Signature"
    ]],

    body: rows,

    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
      overflow: "linebreak"
    },

    headStyles: {
      fillColor: [28, 86, 145],
      textColor: 255,
      fontStyle: "bold",
      halign: "left"
    },

    /* 🧮 COLUMN WIDTHS — BALANCED & LEFT-LOCKED */
    columnStyles: {
      0: { cellWidth: 26 }, // Date
      1: { cellWidth: 26 }, // Time
      2: { cellWidth: 26 }, // First
      3: { cellWidth: 26 }, // Last
      4: { cellWidth: 58 }, // Company
      5: { cellWidth: 44 }, // Reason
      6: { cellWidth: 48 }, // Services
      7: { cellWidth: 30, halign: "center" } // Signature
    },

    /*✍️ SIGNATURE DRAW */
    didDrawCell(data) {
      if (data.column.index === 7 && data.cell.section === "body") {
        const record = records[data.row.index];
        const img = record?.signature;

        if (img && img.startsWith("data:image")) {
          const w = 18;
          const h = 8;
          const x = data.cell.x + (data.cell.width - w) / 2;
          const y = data.cell.y + (data.cell.height - h) / 2;
          doc.addImage(img, "PNG", x, y, w, h);
        }
      }
    }
  });

  /* ================= GENERATED TIMESTAMP ================= */
  const generated = new Date().toLocaleString();
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Generated: ${generated}`,
    pageWidth - 8,
    doc.internal.pageSize.height - 6,
    { align: "right" }
  );

  doc.save("AMS_Search_Log.pdf");
};
