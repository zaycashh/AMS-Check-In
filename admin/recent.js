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
    // newest → oldest (within today)
    .sort((a, b) => {
        const aDate = new Date(`${a.date} ${a.time}`);
        const bDate = new Date(`${b.date} ${b.time}`);
        return bDate - aDate;
    })
    .slice(0, 10);

    const todayCount = recent.length;


    let html = `
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
`;
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

    recent.forEach(log => {
        const firstName = log.firstName || (log.name ? log.name.split(" ")[0] : "");
        const lastName  = log.lastName  || (log.name ? log.name.split(" ").slice(1).join(" ") : "");

        html += `
            <tr>
                <td>${log.date || ""}</td>
                <td>${log.time || ""}</td>
                <td>${firstName}</td>
                <td>${lastName}</td>
                <td>${log.company || ""}</td>
                <td>${log.reason || ""}</td>
                <td>
                    ${log.signature
                        ? `<img src="${log.signature}" style="height:40px;">`
                        : ""}
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}
