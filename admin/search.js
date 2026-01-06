console.log("Admin Search Module Loaded");

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  return d;
}

document.addEventListener("DOMContentLoaded", () => {
  populateSearchCompanies();
  clearSearchTable();
});

// Make search globally accessible
window.runSearch = function () {
  const first = document
    .getElementById("filterFirstName")
    ?.value.trim()
    .toLowerCase();

  const last = document
    .getElementById("filterLastName")
    ?.value.trim()
    .toLowerCase();

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document
    .getElementById("searchFilterCompanyText")
    ?.value.trim()
    .toLowerCase();

  const company =
    companySelect?.value === "__custom__"
      ? companyText
      : companySelect?.value.toLowerCase();

  const range = document.getElementById("filterDateRange")?.value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  /* ===============================
     DATE RANGE PREP
  =============================== */
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
  // ✅ Ensure endDate includes the full day
if (endDate) {
  endDate.setHours(23, 59, 59, 999);
}

  /* ===============================
     FILTER LOGS
  =============================== */
  const filtered = logs.filter(entry => {
    // Normalize log datetime safely
    const logTime = entry.timestamp
      ? new Date(entry.timestamp)
      : new Date(`${entry.date} ${entry.time || "00:00"}`);

    logTime.setSeconds(0, 0);

    if (startDate && logTime < startDate) return false;
    if (endDate && logTime > endDate) return false;

    const entryFirst = entry.firstName || entry.first || entry.fname || "";
    const entryLast = entry.lastName || entry.last || entry.lname || "";

    if (first && !entryFirst.toLowerCase().includes(first)) return false;
    if (last && !entryLast.toLowerCase().includes(last)) return false;

    if (
      company &&
      company !== "" &&
      !entry.company?.toLowerCase().includes(company)
    ) return false;

    return true;
  });

  /* ===============================
     SORT — NEWEST → OLDEST
  =============================== */
  filtered.sort((a, b) => {
    const ta = a.timestamp || new Date(a.date).getTime();
    const tb = b.timestamp || new Date(b.date).getTime();
    return tb - ta;
  });

  window.searchResults = filtered;
  renderSearchResults(filtered);
}; // ✅ CLOSE runSearch

/* =========================================================
   RENDER RESULTS
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

  if (results.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">
          No matching records
        </td>
      </tr>`;
    return;
  }

  results.forEach(r => {
    const row = document.createElement("tr");
    const servicesText = Array.isArray(r.services)
  ? r.services.join(", ")
  : "";

row.innerHTML = `
  <td>${r.date || ""}</td>
  <td>${r.time || ""}</td>
  <td>${r.firstName || r.first || r.fname || ""}</td>
  <td>${r.lastName || r.last || r.lname || ""}</td>
  <td>${r.company || ""}</td>
  <td>${r.reason || ""}</td>
  <td>${servicesText}</td>
  <td>
    ${
      r.signature
        ? `<img src="${r.signature}" style="width:120px;height:40px;object-fit:contain;border:1px solid #ccc;background:#fff;">`
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

/* =========================================================
   CLEAR SEARCH
========================================================= */
function clearSearchTable() {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (!table) return;

  if (counter) counter.textContent = "";

  table.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;opacity:.6;">
        Use filters and click Search to view records
      </td>
    </tr>`;
}

window.toggleSearchCompanyText = function (value) {
  const input = document.getElementById("searchFilterCompanyText");
  if (!input) return;

  if (value === "__custom__") {
    input.style.display = "block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
  }
};

/* =========================================================
   KEYBOARD SEARCH
========================================================= */
document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;

  const el = document.activeElement;
  if (!el) return;

  const allowedIds = [
    "filterFirstName",
    "filterLastName",
    "searchFilterCompanyText",
    "filterStartDate",
    "filterEndDate"
  ];

  if (allowedIds.includes(el.id)) {
    e.preventDefault();
    window.runSearch();
  }
});

/* =========================================================
   CUSTOM DATE TOGGLE
========================================================= */
window.toggleCustomDateRange = function (value) {
  const wrapper = document.getElementById("customDateRange");
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");

  if (!wrapper) return;

  if (value === "custom") {
    wrapper.style.display = "block";
    start?.focus();
  } else {
    wrapper.style.display = "none";
    if (start) start.value = "";
    if (end) end.value = "";
  }
};

/* =========================================================
   CLEAR BUTTON
========================================================= */
window.clearSearch = function () {
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document.getElementById("searchFilterCompanyText");

  if (companySelect) companySelect.value = "";
  if (companyText) {
    companyText.value = "";
    companyText.style.display = "none";
  }

  const dateRange = document.getElementById("filterDateRange");
  if (dateRange) dateRange.value = "";

  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";

  window.searchResults = [];
  clearSearchTable();
};

/* =========================================================
   EXPORT PDF
========================================================= */
function exportSearchPdf() {
  const records = Array.isArray(window.searchResults)
    ? window.searchResults
    : [];

  if (!records.length) {
    alert("Please run a search before exporting the PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  /* ===== HEADER BAR ===== */
  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, doc.internal.pageSize.width, 32, "F");

  /* ===== LOGO ===== */
  const logoImg = document.getElementById("amsLogoBase64");
  if (logoImg && logoImg.complete) {
    const c = document.createElement("canvas");
    c.width = logoImg.naturalWidth;
    c.height = logoImg.naturalHeight;
    c.getContext("2d").drawImage(logoImg, 0, 0);
    doc.addImage(c.toDataURL("image/png"), "PNG", 14, 8, 32, 22);
  }

  /* ===== TITLE ===== */
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", 55, 21);
  doc.setTextColor(0);

  /* ===== META ===== */
  const startY = 55;
  const now = new Date();
  doc.setFontSize(11);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, startY);
  doc.text(`Total Records: ${records.length}`, 14, startY + 8);

  /* ===== TABLE DATA ===== */
  const tableData = records.map(r => [
    r.date || "",
    r.time || "",
    r.firstName || r.first || "",
    r.lastName || r.last || "",
    r.company || "",
    r.reason || "",
    Array.isArray(r.services) ? r.services.join(", ") : "",
    "" // Signature placeholder
  ]);

  /* ===== TABLE ===== */
  doc.autoTable({
    startY: startY + 18,

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

    body: tableData,

    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle"
    },

    headStyles: {
      fillColor: [30, 94, 150],
      textColor: 255,
      fontStyle: "bold"
    },

    alternateRowStyles: {
      fillColor: [245, 248, 252]
    },

    columnStyles: {
      0: { cellWidth: 26 }, // Date
      1: { cellWidth: 22 }, // Time
      2: { cellWidth: 26 }, // First
      3: { cellWidth: 26 }, // Last
      4: { cellWidth: 60 }, // Company
      5: { cellWidth: 36 }, // Reason
      6: { cellWidth: 50 }, // Services
      7: { cellWidth: 30 }  // Signature
    },

    didDrawCell: function (data) {
      // ✅ SIGNATURE COLUMN ONLY
      if (data.section === "body" && data.column.index === 7) {
        const rec = records[data.row.index];
        if (rec.signature && rec.signature.startsWith("data:image")) {
          const imgWidth = 24;
          const imgHeight = 8;
          const x = data.cell.x + (data.cell.width - imgWidth) / 2;
          const y = data.cell.y + (data.cell.height - imgHeight) / 2;
          doc.addImage(rec.signature, "PNG", x, y, imgWidth, imgHeight);
        }
      }
    }
  });

  const today = new Date().toISOString().split("T")[0];
  doc.save(`AMS_Search_Log_${today}.pdf`);
}

/* =========================================================
   EXPORT EXCEL
========================================================= */
function exportSearchLogExcel() {
  const results = window.searchResults || [];
  if (!results.length) {
    alert("No records to export.");
    return;
  }

  const data = results.map(r => ({
    Date: r.date || "",
    Time: r.time || "",
    "First Name": (r.firstName || r.first || "").toUpperCase(),
    "Last Name": (r.lastName || r.last || "").toUpperCase(),
    Company: r.company || "",
    Reason: r.reason || "",
    Services: r.services || "",
    Signature: r.signature ? "Signed" : "—"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");
  XLSX.writeFile(wb, `AMS_Search_Log_${new Date().toISOString().split("T")[0]}.xlsx`);
}
