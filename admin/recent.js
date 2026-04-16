/* =========================================================
   CLOUD RECENT FETCH (LOCAL-FIRST + SILENT SYNC)
========================================================= */

let recentCloudCache = null;

async function fetchRecentLogs() {
  // ✅ Always have instant local fallback
  const localLogs = JSON.parse(
    localStorage.getItem("ams_logs") || "[]"
  );

  // ✅ Prevent multiple cloud calls
  if (recentCloudCache) return recentCloudCache;

  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );

    if (!res.ok) return localLogs;

    const logs = await res.json();

    // ✅ Cache once
    recentCloudCache = logs;

    // ✅ Save for all devices + all modules
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    return logs;
  } catch {
    // ✅ Silent fallback (no console errors)
    return localLogs;
  }
}

console.log("Admin Recent Check-Ins Module Loaded");

/* =========================================================
   RENDER HELPERS
========================================================= */

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function normalizeTimestamp(log) {
  if (log._ts) return log._ts;

  let ts = log.timestamp;

  // 🔁 Backward compatibility
  if (!ts && log.date) {
    const t = log.time || "00:00";
    ts = new Date(`${log.date} ${t}`).getTime();
  }

  return ts || null;
}

function dedupeById(logs) {
  return Array.from(
    new Map(
      logs
        .filter(l => l && l.id)
        .map(l => [l.id, l])
    ).values()
  );
}

/* =========================================================
   PAINT UI (NO FETCHING HERE)
========================================================= */

function paintRecent(container, logs) {
  const uniqueLogs = dedupeById(logs);

  if (!uniqueLogs.length) {
    container.innerHTML =
      "<p style='opacity:.6;'>No recent check-ins yet.</p>";
    return;
  }

  const { start, end } = getTodayRange();

  const recent = uniqueLogs
    .map(log => {
      const ts = normalizeTimestamp(log);
      return ts ? { ...log, _ts: ts } : null;
    })
    .filter(
      log =>
        log &&
        log._ts >= start.getTime() &&
        log._ts <= end.getTime()
    )
    .sort((a, b) => b._ts - a._ts)
    .slice(0, 20);

  const todayCount = recent.length;

  let html = `
    <h2 style="display:flex;align-items:center;gap:10px;">
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

    const servicesText = Array.isArray(entry.services)
      ? entry.services.join(", ")
      : entry.services || entry.service || "";

    const signatureHtml = entry.signature
      ? `<img src="${entry.signature}" style="max-width:120px;max-height:40px;">`
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

/* =========================================================
   MAIN ENTRY (INSTANT + BACKGROUND SYNC)
========================================================= */

async function renderRecentCheckIns() {
  const container = document.getElementById("tabRecent");
  if (!container) return;

  // ✅ INSTANT render from local cache
  const localLogs = JSON.parse(
    localStorage.getItem("ams_logs") || "[]"
  );
  paintRecent(container, localLogs);

  // ✅ Background cloud sync (does NOT block UI)
  fetchRecentLogs().then(cloudLogs => {
    paintRecent(container, cloudLogs);
  });
}
