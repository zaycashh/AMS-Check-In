function initGeneralReport() {
  console.log("General Report module ready");

  // 🔒 GUARD: General tab DOM not ready (cleared on admin exit)
  const totalEl = document.getElementById("totalCount");
  if (!totalEl) {
    console.warn("General report DOM not ready yet");
    return;
  }

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // SUMMARY COUNTS
  const totalCount = logs.length;
  const todayCount = logs.filter(l => l.date === today).length;
  const monthCount = logs.filter(l => l.date.startsWith(currentMonth)).length;
  const companyCount = new Set(logs.map(l => l.company)).size;

  // Inject into DOM
  totalEl.textContent = totalCount;
  document.getElementById("todayCount").textContent = todayCount;
  document.getElementById("monthCount").textContent = monthCount;
  document.getElementById("companyCount").textContent = companyCount;

  /* ===============================
     DAILY ACTIVITY TABLE
  =============================== */
  const dailyTotals = {};
  logs.forEach(l => {
    dailyTotals[l.date] = (dailyTotals[l.date] || 0) + 1;
  });

  const tbody = document.getElementById("dailyReportBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  Object.keys(dailyTotals)
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${date}</td><td>${dailyTotals[date]}</td>`;
      tbody.appendChild(tr);
    });

  /* ===============================
     TOP COMPANIES REPORT
  =============================== */
  const companyCounts = {};

  logs.forEach(l => {
    if (!l.company) return;
    const name = l.company.trim();
    companyCounts[name] = (companyCounts[name] || 0) + 1;
  });

  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const companyBody = document.getElementById("topCompaniesBody");
  if (!companyBody) return;

  companyBody.innerHTML = "";

  topCompanies.forEach(([company, count]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${company}</td><td>${count}</td>`;
    companyBody.appendChild(tr);
  });
}
