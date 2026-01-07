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
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");

  if (!start || !end) return;

  if (value === "custom") {
    start.style.display = "inline-block";
    end.style.display = "inline-block";
  } else {
    start.style.display = "none";
    end.style.display = "none";
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

  /* ================= HEADER ================= */
  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, "F");

  if (window.amsLogoBase64) {
    doc.addImage(amsLogoBase64, "PNG", 10, 6, 28, 18);
  }

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", doc.internal.pageSize.width / 2, 20, {
    align: "center"
  });
  doc.setTextColor(0);

  /* ================= TABLE DATA ================= */
  const rows = records.map(r => [
    (r.date || "").replace(/\s+/g, ""),
    (r.time || "").replace(/\s+/g, " "),
    r.firstName || r.first || "",
    r.lastName || r.last || "",
    r.company || "",
    r.reason || "",
    getServicesText(r),
    ""
  ]);

  doc.autoTable({
  startY: 36,

  margin: { left: 8, right: 8 }, // ⬅ SHIFT ENTIRE TABLE LEFT

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
    cellPadding: 5,
    valign: "middle",
    overflow: "linebreak"
  },

  headStyles: {
  fillColor: [28, 86, 145],
  textColor: 255,
  fontStyle: "bold"
},

  columnStyles: {
  0: { cellWidth: 26 },                 // Date
  1: { cellWidth: 26 },                 // Time
  2: { cellWidth: 26 },                 // First
  3: { cellWidth: 26 },                 // Last
  4: { cellWidth: 52 },                 // Company
  5: { cellWidth: 42, halign: "left" }, // Reason ⬅️
  6: { cellWidth: 44, halign: "left" }, // Services ⬅️
  7: { cellWidth: 28, halign: "center"} // Signature
},

  didDrawCell: function (data) {
    if (data.column.index === 7 && data.cell.section === "body") {
      const record = records[data.row.index];
      const img = record?.signature;
      if (img && img.startsWith("data:image")) {
        doc.addImage(
          img,
          "PNG",
          data.cell.x + (data.cell.width - 18) / 2,
          data.cell.y + (data.cell.height - 8) / 2,
          18,
          8
        );
      }
    }
  }
});

  doc.save("AMS_Search_Log.pdf");
};

