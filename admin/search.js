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
  
// DATE RANGE LOGIC (PREP ONLY)
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
  const filtered = logs.filter(entry => {
  // Normalize log date
  const logDate = normalizeDate(entry.date);
  if (!logDate) return false;

  // Apply date range
  if (startDate && logDate < startDate) return false;
  if (endDate && logDate > endDate) return false;

  // Name filters (support legacy keys)
const entryFirst = entry.firstName || entry.first || entry.fname || "";
const entryLast = entry.lastName || entry.last || entry.lname || "";

if (first && !entryFirst.toLowerCase().includes(first)) return false;
if (last && !entryLast.toLowerCase().includes(last)) return false;
// Company filter
if (company && !entry.company?.toLowerCase().includes(company)) return false;

return true;
});
  
  renderSearchResults(filtered);
};

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
        <td colspan="7" style="text-align:center;opacity:.6;">
          No matching records
        </td>
      </tr>
    `;
    return;
  }

  results.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.firstName || r.first || r.fname || ""}</td>
      <td>${r.lastName || r.last || r.lname || ""}</td>
      <td>${r.company || ""}</td>
      <td>${r.reason || ""}</td>
      <td>
  ${
    r.signature
      ? `<img 
           src="${r.signature}" 
           style="width:120px; height:40px; object-fit:contain; border:1px solid #ccc; background:#fff;"
           alt="Signature"
         />`
      : ""
  }
</td>

    `;
    table.appendChild(row);
  });
}

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

function clearSearchTable() {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (!table) return;

  if (counter) counter.textContent = "";

  table.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; opacity:.6;">
        Use filters and click Search to view records
      </td>
    </tr>
  `;
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
// UX: Press Enter to trigger Search
document.addEventListener("keydown", function (e) {
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
    if (typeof window.runSearch === "function") {
      window.runSearch();
    }
  }
});
// UX: Toggle custom date inputs
window.toggleCustomDateRange = function (value) {
  const wrapper = document.getElementById("customDateRange");
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");

  if (!wrapper) return;

  if (value === "custom") {
    wrapper.style.display = "block";
    if (start) start.focus();
  } else {
    wrapper.style.display = "none";
    if (start) start.value = "";
    if (end) end.value = "";
  }
};
// Clear Search button handler
window.clearSearch = function () {
  // Clear text inputs
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";

  // Reset company dropdown
  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document.getElementById("searchFilterCompanyText");

  if (companySelect) companySelect.value = "";
  if (companyText) {
    companyText.value = "";
    companyText.style.display = "none"; // 👈 THIS IS THE FIX
  }

  // Reset date range
  const dateRange = document.getElementById("filterDateRange");
  if (dateRange) dateRange.value = "";

  const startDate = document.getElementById("filterStartDate");
  const endDate = document.getElementById("filterEndDate");

  if (startDate) startDate.value = "";
  if (endDate) endDate.value = "";

  // Clear results table + counter
  clearSearchTable();
};
function exportSearchPdf() {
  const records = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  if (!records.length) {
    alert("No records found.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  /* HEADER BAR */
  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, doc.internal.pageSize.width, 32, "F");

  /* LOGO */
  const logoImg = document.getElementById("amsLogoBase64");
  if (logoImg && logoImg.complete) {
    const canvas = document.createElement("canvas");
    canvas.width = logoImg.naturalWidth;
    canvas.height = logoImg.naturalHeight;
    canvas.getContext("2d").drawImage(logoImg, 0, 0);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 14, 8, 32, 22);
  }

  /* TITLE */
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", 55, 21);
  doc.setTextColor(0, 0, 0);

  const startY = 55;
  const now = new Date();

  doc.setFontSize(12);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, startY);
  doc.text(`Total Records: ${records.length}`, 14, startY + 10);

  const tableData = records.map(r => [
  r.date || "",
  r.time || "",
  r.first || r.firstName || "",
  r.last || r.lastName || "",
  r.company || "",
  r.reason || "",
  "" // ✅ signature placeholder ONLY
]);

  doc.autoTable({
    startY: startY + 20,
    head: [["Date", "Time", "First", "Last", "Company", "Reason", "Signature"]],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: [30, 94, 150],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9
    },
    ,
didDrawCell: function (data) {
  if (data.section === "body" && data.column.index === 6) {
    const record = records[data.row.index];

    if (
      record.signature &&
      record.signature.startsWith("data:image")
    ) {
      const imgWidth = 35;
      const imgHeight = 12;

      const x = data.cell.x + (data.cell.width - imgWidth) / 2;
      const y = data.cell.y + (data.cell.height - imgHeight) / 2;

      doc.addImage(
        record.signature,
        "PNG",
        x,
        y,
        imgWidth,
        imgHeight
      );
    }
  }
}
});

  doc.save("AMS_Search_Log_Report.pdf");
}

