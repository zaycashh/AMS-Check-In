/* =========================================================
   CLOUD RECENT FETCH (WITH FALLBACK)
========================================================= */
let recentCloudCache = null;

async function fetchRecentLogs() {
  // 1️⃣ Load instantly from local cache
  const localLogs = JSON.parse(
    localStorage.getItem("ams_logs") || "[]"
  );

  // 2️⃣ Prevent duplicate cloud calls
  if (recentCloudCache) return recentCloudCache;

  // 3️⃣ Silent cloud sync (no console errors)
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );

    if (!res.ok) return localLogs;

    const logs = await res.json();
    recentCloudCache = logs;

    // Save for all devices
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    return logs;
  } catch {
    // Stay quiet, keep local
    return localLogs;
  }
}

console.log("Admin Recent Check-Ins Module Loaded");

async function renderRecentCheckIns() {
  const container = document.getElementById("tabRecent");
  if (!container) return;

  const logs = await fetchRecentLogs();
   // ✅ REMOVE DUPLICATES BY RECORD ID (CRITICAL FIX)
const uniqueLogs = Array.from(
  new Map(
    logs
      .filter(l => l && l.id) // safety
      .map(l => [l.id, l])
  ).values()
);

  if (uniqueLogs.length === 0) {
    container.innerHTML = "<p style='opacity:.6;'>No recent check-ins yet.</p>";
    return;
  }

  // TODAY ONLY (TIMESTAMP SAFE)
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);

const recent = uniqueLogs
  .map(log => {
    let ts = log.timestamp;

    // 🔁 BACKWARD COMPATIBILITY FIX
    if (!ts && log.date) {
      const timePart = log.time ? log.time : "00:00";
      ts = new Date(`${log.date} ${timePart}`).getTime();
    }

    return { ...log, _ts: ts };
  })
  .filter(log => {
    if (!log._ts) return false;

    return (
      log._ts >= startOfToday.getTime() &&
      log._ts <= endOfToday.getTime()
    );
  })
  .sort((a, b) => b._ts - a._ts)
  .slice(0, 20);

  const todayCount = recent.length;

  let html = `
    <h2 style="display:flex; align-items:center; gap:10px;">
      Recent Check-Ins
      <span style="
        background:#1e88e5;
        color:#fff;
        padding:3px 10px;
        border-radius:999px;
        font-size:0.85rem;
        font-weight:600;
      ">
        Today: ${todayCount}
      </span>
    </h2>

    <table class="log-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Company</th>
          <th>Reason</th>
          <th>Services</th>
          <th>Signature</th>
        </tr>
      </thead>
      <tbody>
  `;

  recent.forEach(entry => {
    const firstName =
      entry.firstName ||
      entry.first ||
      (entry.name ? entry.name.split(" ")[0] : "");

    const lastName =
      entry.lastName ||
      entry.last ||
      (entry.name ? entry.name.split(" ").slice(1).join(" ") : "");

    const signatureHtml = entry.signature
      ? `<img src="${entry.signature}" style="max-width:120px; max-height:40px;">`
      : "";

    const servicesText = Array.isArray(entry.services)
  ? entry.services.join(", ")
  : entry.services
    ? entry.services
    : entry.service
      ? entry.service
      : "";

html += `
<tr>
  <td>${entry.date || ""}</td>
  <td>${entry.time || ""}</td>
  <td>${firstName}</td>
  <td>${lastName}</td>
  <td>${entry.company || ""}</td>
  <td>${entry.reason || ""}</td>
  <td>${servicesText}</td>
  <td>${signatureHtml}</td>
</tr>
`;

  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
