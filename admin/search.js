console.log("Admin Search Module Loaded");

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

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  const filtered = logs.filter(entry => {
    if (first && !entry.firstName?.toLowerCase().includes(first)) return false;
    if (last && !entry.lastName?.toLowerCase().includes(last)) return false;
    if (company && entry.company?.toLowerCase() !== company) return false;
    return true;
  });

  renderSearchResults(filtered);
};

function renderSearchResults(results) {
  const table = document.getElementById("searchResultsTable");
  if (!table) return;

  table.innerHTML = "";

  if (results.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;opacity:.6;">No results found</td></tr>`;
    return;
  }

  results.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.firstName || ""}</td>
      <td>${r.lastName || ""}</td>
      <td>${r.company || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${r.signature ? "✔" : ""}</td>
    `;
    table.appendChild(row);
  });
}
