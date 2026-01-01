console.log("Admin Recent Check-Ins Module Loaded");

function renderRecentCheckIns() {
  const container = document.getElementById("tabRecent");
  if (!container) return;

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  if (logs.length === 0) {
    container.innerHTML = "<p style='opacity:.6;'>No recent check-ins yet.</p>";
    return;
  }

  // TODAY ONLY
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recent = logs
    .filter(log => {
      if (!log.date) return false;

      const logDate = new Date(log.date + "T00:00:00");
      logDate.setHours(0, 0, 0, 0);

      return logDate.getTime() === today.getTime();
    })
    .sort((a, b) => {
      const aDate = new Date(`${a.date} ${a.time}`);
      const bDate = new Date(`${b.date} ${b.time}`);
      return bDate - aDate;
    })
    .slice(0, 10);

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

    html += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.time}</td>
        <td>${firstName}</td>
        <td>${lastName}</td>
        <td>${entry.company}</td>
        <td>${entry.reason}</td>
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
