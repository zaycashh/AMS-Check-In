console.log("Admin Recent Check-Ins Module Loaded");

document.addEventListener("DOMContentLoaded", renderRecentCheckIns);

function renderRecentCheckIns() {
    const container = document.getElementById("tabRecent");
    if (!container) return;

    // ✅ USE SAME STORAGE AS SEARCH LOG
    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

    if (logs.length === 0) {
        container.innerHTML = "<p style='opacity:.6;'>No recent check-ins yet.</p>";
        return;
    }

    // ✅ SORT NEWEST → OLDEST (SAFE)
    logs.sort((a, b) => {
        const aDate = new Date(`${a.date} ${a.time}`);
        const bDate = new Date(`${b.date} ${b.time}`);
        return bDate - aDate;
    });

    const recent = logs.slice(0, 10);

    let html = `
        <h2>Recent Check-Ins</h2>
        <table class="log-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Company</th>
                    <th>Reason</th>
                    <th>Collector</th>
                    <th>Signature</th>
                </tr>
            </thead>
            <tbody>
    `;

    recent.forEach(log => {
        html += `
            <tr>
                <td>${log.date || ""}</td>
                <td>${log.time || ""}</td>
                <td>${log.firstName || ""}</td>
                <td>${log.lastName || ""}</td>
                <td>${log.company || ""}</td>
                <td>${log.reason || ""}</td>
                <td>${log.collector || ""}</td>
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
