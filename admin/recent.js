/* =========================================================
   CLOUD RECENT FETCH (LOCAL-FIRST + SILENT SYNC)
========================================================= */

let recentCloudCache = null;

async function fetchRecentLogs() {
  const localLogs = JSON.parse(
    localStorage.getItem("ams_logs") || "[]"
  );

  if (recentCloudCache) return recentCloudCache;

  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );

    if (!res.ok) return localLogs;

    const data = await res.json();
    const logs = Array.isArray(data) ? data : localLogs;

    // ✅ BATCH: Fetch missing signatures in batches of 200
    const missingSig = logs.filter(l => l.id && !l.signature);
    if (missingSig.length > 0) {
      console.log("Recent: Fetching signatures for", missingSig.length, "records...");
      for (let i = 0; i < missingSig.length; i += 200) {
        const batch = missingSig.slice(i, i + 200);
        const ids = batch.map(r => r.id);

        try {
          const sigRes = await fetch(
            "https://ams-checkin-api.josealfonsodejesus.workers.dev/signatures",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids })
            }
          );

          if (sigRes.ok) {
            const sigData = await sigRes.json();
            sigData.forEach(sig => {
              const record = batch.find(r => r.id === sig.id);
              if (record && sig.signature) record.signature = sig.signature;
            });
          }
        } catch(e) {
          console.warn("Recent: Batch signature fetch failed:", e);
        }
      }
      console.log("✅ Recent: Signatures loaded");
    }

    recentCloudCache = logs;

         try {
      const lite = logs.map(l => {
        const { signature, ...rest } = l;
        return rest;
      });
      localStorage.setItem("ams_logs", JSON.stringify(lite));
    } catch(e) {
      console.warn("⚠️ localStorage full, skipping cache");
    }
 
  } catch {
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

  if (!ts && log.date) {
    const t = log.time || "00:00";
    ts = new Date(`${log.date} ${t}`).getTime();
  }

  return ts || null;
}

function dedupeById(logs) {
  if (!Array.isArray(logs)) return [];
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

function paintRecent(container, logs, targetDate) {
  const uniqueLogs = dedupeById(logs);

  if (!uniqueLogs.length) {
    container.innerHTML =
      "<p style='opacity:.6;'>No recent check-ins yet.</p>";
    return;
  }

  const start = new Date(targetDate || new Date());
  start.setHours(0, 0, 0, 0);

  const end = new Date(targetDate || new Date());
  end.setHours(23, 59, 59, 999);

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

  const label = targetDate
    ? new Date(targetDate + "T12:00:00").toLocaleDateString()
    : "Today";
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
        ${label}: ${todayCount}
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

async function renderRecentCheckIns(targetDate) {
  const container = document.getElementById("tabRecent");
  if (!container) return;

  // ✅ INSTANT render from local cache
  const localLogs = JSON.parse(
    localStorage.getItem("ams_logs") || "[]"
  );
  paintRecent(container, localLogs, targetDate);

  // ✅ Background cloud sync (does NOT block UI)
  fetchRecentLogs().then(cloudLogs => {
    paintRecent(container, cloudLogs, targetDate);
  });
}
