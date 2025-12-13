console.log("Admin Recent Check-Ins Module Loaded");

function renderRecentCheckIns() {
    const container = document.getElementById("tabRecent");
    if (!container) return;

    const logs = JSON.parse(localStorage.getItem("checkinLogs")) || [];

    if (logs.length === 0) {
        container.innerHTML = "<p style='opacity:.6;'>No recent check-ins yet.</p>";
        return;
    }

    const recent = logs.slice(-10).reverse();

    let html = `
        <h2>Recent Check-Ins</h2>
        <table class="log-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Reason</th>
                    <th>Services</th>
                    <th>Signature</th>
                </tr>
            </thead>
            <tbody>
    `;

    recent.forEach(log => {
        html += `
            <tr>
                <td>${log.date}</td>
                <td>${log.time}</td>
                <td>${log.name}</td>
                <td>${log.company}</td>
                <td>${log.reason}</td>
                <td>${log.services}</td>
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
