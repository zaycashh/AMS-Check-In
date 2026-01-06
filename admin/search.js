console.log("Admin Search Module Loaded");

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
window.runSearch = function () {
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

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  /* ===== DATE RANGE ===== */
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

  /* ===== FILTER ===== */
  const filtered = logs.filter(entry => {
    const logTime = entry.timestamp
      ? new Date(entry.timestamp)
      : new Date(`${entry.date} ${entry.time || "00:00"}`);

    if (startDate && logTime < startDate) return false;
    if (endDate && logTime > endDate) return false;

    const f = entry.firstName || entry.first || "";
    const l = entry.lastName || entry.last || "";

    if (first && !f.toLowerCase().includes(first)) return false;
    if (last && !l.toLowerCase().includes(last)) return false;

    if (company && !entry.company?.toLowerCase().includes(company)) return false;

    return true;
  });

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
    const servicesText = Array.isArray(r.services) ? r.services.join(", ") : "";

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
      </td>
    `;
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

  if (value === "__custom__") {
    input.style.display = "block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
  }
};

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
      <td colspan="8" style="text-align:center;opacity:.6;">
        Use filters and click Search to view records
      </td>
    </tr>`;
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
   KEYBOARD SEARCH
========================================================= */
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    window.runSearch();
  }
});

/* =========================================================
   EXPORT PDF
========================================================= */
function exportSearchPdf() {
  const records = window.searchResults || [];
  if (!records.length) {
    alert("Please run a search first.");
    return;
  }

  // ✅ FIX: build rows properly
  const rows = records.map(r => [
    r.date || "",
    r.time || "",
    r.firstName || r.first || "",
    r.lastName || r.last || "",
    r.company || "",
    r.reason || "",
    Array.isArray(r.services) ? r.services.join(", ") : "",
    r.signature || ""
  ]);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, "F");

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", 50, 20);
  doc.setTextColor(0);

  doc.autoTable({
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
    startY: 90,
    styles: { fontSize: 9, cellPadding: 6, valign: "middle" },
    headStyles: {
      fillColor: [28, 86, 145],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      valign: "middle"
    },
     columnStyles: {
  0: { cellWidth: 24 },
  1: { cellWidth: 20 },
  2: { cellWidth: 20 },
  3: { cellWidth: 20 },
  4: { cellWidth: 40 },
  5: { cellWidth: 28 },
  6: { cellWidth: "auto" },
  7: { cellWidth: 24, halign: "center", valign: "middle" }
},
    didDrawCell: function (data) {
      if (data.column.index === 7 && data.cell.section === "body") {
        const img = data.cell.raw;
        if (img && img.startsWith("data:image")) {
          const imgWidth = 18;
          const imgHeight = 8;
          const x = data.cell.x + data.cell.width / 2 - imgWidth / 2;
          const y = data.cell.y + data.cell.height / 2 - imgHeight / 2;
          doc.addImage(img, "PNG", x, y, imgWidth, imgHeight);
        }
      }
    }
  });
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
    Services: Array.isArray(r.services) ? r.services.join(", ") : "",
    Signature: r.signature ? "Signed" : ""
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");
  XLSX.writeFile(wb, "AMS_Search_Log.xlsx");
}
window.exportSearchPdf = exportSearchPdf;
