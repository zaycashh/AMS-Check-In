console.log("General Report Module Loaded");

let generalCloudCache = null;

async function fetchGeneralLogs() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Cloud fetch failed");
    const logs = await res.json();
    generalCloudCache = logs;
    console.log("☁️ General logs loaded from cloud:", logs.length);
    return logs;
  } catch (err) {
    console.warn("⚠️ Cloud unavailable, using local logs");
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
  }
}

async function initGeneralReport() {
  const container = document.getElementById("tabGeneral");
  if (!container) {
    console.warn("General tab container not found");
    return;
  }

  /* ===============================
     RENDER GENERAL REPORT UI
  =============================== */
  container.innerHTML = `
    <h2 class="section-title">General Report</h2>

    <div class="report-cards">
      <div class="report-card">
        <h3>Total Check-Ins</h3>
        <p id="totalCount">...</p>
      </div>

      <div class="report-card">
        <h3>Today</h3>
        <p id="todayCount">...</p>
      </div>

      <div class="report-card">
        <h3>This Month</h3>
        <p id="monthCount">...</p>
      </div>

      <div class="report-card">
        <h3>Companies</h3>
        <p id="companyCount">...</p>
      </div>
    </div>

    <h3 style="margin-top:20px;">Daily Activity</h3>
    <table class="log-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Total Check-Ins</th>
        </tr>
      </thead>
      <tbody id="dailyReportBody"></tbody>
    </table>

    <h3 style="margin-top:30px;">Top Companies</h3>
    <table class="log-table">
      <thead>
        <tr>
          <th>Company</th>
          <th>Total Check-Ins</th>
        </tr>
      </thead>
      <tbody id="topCompaniesBody"></tbody>
    </table>
  `;

  /* ===============================
     LOAD DATA FROM CLOUD
  =============================== */
  const logs = await fetchGeneralLogs();

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // COUNTS
  document.getElementById("totalCount").textContent = logs.length;
  document.getElementById("todayCount").textContent =
    logs.filter(l => l.date === today).length;

  document.getElementById("monthCount").textContent =
    logs.filter(l => l.date?.startsWith(currentMonth)).length;

  document.getElementById("companyCount").textContent =
    new Set(logs.map(l => l.company).filter(Boolean)).size;

  /* ===============================
     DAILY ACTIVITY
  =============================== */
  const dailyTotals = {};
  logs.forEach(l => {
    if (!l.date) return;
    dailyTotals[l.date] = (dailyTotals[l.date] || 0) + 1;
  });

  const dailyBody = document.getElementById("dailyReportBody");
  dailyBody.innerHTML = "";

  Object.keys(dailyTotals)
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${date}</td><td>${dailyTotals[date]}</td>`;
      dailyBody.appendChild(tr);
    });

  /* ===============================
     TOP COMPANIES
  =============================== */
  const companyCounts = {};
  logs.forEach(l => {
    if (!l.company) return;
    companyCounts[l.company] = (companyCounts[l.company] || 0) + 1;
  });

  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const companyBody = document.getElementById("topCompaniesBody");
  companyBody.innerHTML = "";

  topCompanies.forEach(([company, count]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${company}</td><td>${count}</td>`;
    companyBody.appendChild(tr);
  });
}

