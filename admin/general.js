/* =========================================================
   GENERAL REPORT MODULE (ADMIN)
   Safe & isolated — does not modify main system
========================================================= */

console.log("Admin General Report Module Loaded");

function initGeneralReport() {
  console.log("General Report module ready");

  const logs = JSON.parse(localStorage.getItem("amsLogs")) || [];

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // SUMMARY COUNTS
  const totalCount = logs.length;
  const todayCount = logs.filter(l => l.date === today).length;
  const monthCount = logs.filter(l => l.date.startsWith(currentMonth)).length;
  const companyCount = new Set(logs.map(l => l.company)).size;

  // Inject into DOM
  document.getElementById("totalCount").textContent = totalCount;
  document.getElementById("todayCount").textContent = todayCount;
  document.getElementById("monthCount").textContent = monthCount;
  document.getElementById("companyCount").textContent = companyCount;

  // DAILY ACTIVITY TABLE
  const dailyTotals = {};
  logs.forEach(l => {
    dailyTotals[l.date] = (dailyTotals[l.date] || 0) + 1;
  });

  const tbody = document.getElementById("dailyReportBody");
  tbody.innerHTML = "";

  Object.keys(dailyTotals)
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${date}</td><td>${dailyTotals[date]}</td>`;
      tbody.appendChild(tr);
    });
}
