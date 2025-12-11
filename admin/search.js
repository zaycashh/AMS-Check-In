/* ============================================================
   ADMIN SEARCH MODULE – PREMIUM VERSION (NO DUPLICATES)
============================================================ */

console.log("Admin Search Module Loaded");

/* --------------------------------------
   LOAD LOGS
-------------------------------------- */
function getLogs() {
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

/* --------------------------------------
   DATE HELPERS
-------------------------------------- */
function toDate(d) {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
}

function getRange(range) {
    const today = toDate(new Date());

    switch (range) {
        case "today": return { start: today, end: today };

        case "yesterday":
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            return { start: y, end: y };

        case "thisWeek":
            const wStart = new Date(today);
            wStart.setDate(today.getDate() - today.getDay());
            return { start: wStart, end: today };

        case "lastWeek":
            const lwEnd = new Date(today);
            lwEnd.setDate(today.getDate() - today.getDay() - 1);
            const lwStart = new Date(lwEnd);
            lwStart.setDate(lwEnd.getDate() - 6);
            return { start: lwStart, end: lwEnd };

        case "thisMonth":
            return {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today
            };

        case "lastMonth":
            return {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0)
            };

        case "thisYear":
            return {
                start: new Date(today.getFullYear(), 0, 1),
                end: today
            };

        case "lastYear":
            return {
                start: new Date(today.getFullYear() - 1, 0, 1),
                end: new Date(today.getFullYear() - 1, 11, 31)
            };

        default:
            return null;
    }
}

/* ============================================================
   FILTER + RESULTS
============================================================ */

let filteredResults = [];

function applyFilters() {
    const logs = getLogs();

    const nameFilter = document.getElementById("filterName").value.toLowerCase();
    const companyFilter = document.getElementById("filterCompany").value;
    const startDate = document.getElementById("filterDateStart").value;
    const endDate = document.getElementById("filterDateEnd").value;
    const range = document.getElementById("filterDateRange").value;

    let start = null;
    let end = null;

    if (range) {
        const r = getRange(range);
        start = r.start;
        end = r.end;
    } else {
        if (startDate) start = toDate(startDate);
        if (endDate) end = toDate(endDate);
    }

    filteredResults = logs.filter(log => {
        const fullName = `${log.first} ${log.last}`.toLowerCase();
        const logDate = toDate(log.date);

        if (nameFilter && !fullName.includes(nameFilter)) return false;
        if (companyFilter && log.company !== companyFilter) return false;
        if (start && logDate < start) return false;
        if (end && logDate > end) return false;

        return true;
    });

    renderFilteredResults(filteredResults);
}

/* --------------------------------------
   RENDER RESULTS INTO TABLE
-------------------------------------- */
function renderFilteredResults(list) {
    const tbody = document.getElementById("searchResults");
    tbody.innerHTML = "";

    list.forEach(log => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.first} ${log.last}</td>
            <td>${log.company}</td>
            <td>${log.reason}</td>
            <td>${log.services}</td>
            <td><img src="${log.signature}" class="sig-thumb"></td>
        `;
        tbody.appendChild(row);
    });
}

/* ============================================================
   POPULATE DROPDOWN
============================================================ */
function populateCompanyDropdown() {
    const logs = getLogs();
    const unique = [...new Set(logs.map(l => l.company).filter(Boolean))];

    const select = document.getElementById("filterCompany");
    select.innerHTML = `<option value="">All Companies</option>`;

    unique.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

/* ============================================================
   EXPORT XLS
============================================================ */
function exportToExcel() {
    if (!filteredResults.length) {
        alert("No records to export.");
        return;
    }

    let table = `
        <table border="1">
            <thead>
                <tr style="background:#e6e6e6; font-weight:bold;">
                    <th>Date</th>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Reason</th>
                    <th>Services</th>
                </tr>
            </thead><tbody>
    `;

    filteredResults.forEach(log => {
        table += `
            <tr>
                <td>${log.date}</td>
                <td>${log.time}</td>
                <td>${log.first} ${log.last}</td>
                <td>${log.company}</td>
                <td>${log.reason}</td>
                <td>${log.services}</td>
            </tr>
        `;
    });

    table += "</tbody></table>";

    const blob = new Blob([table], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "AMS_Search_Report.xls";
    a.click();
}

/* ============================================================
   EXPORT PDF (PREMIUM FORMAT)
============================================================ */
async function exportToPDF() {
    const logs = filteredResults || getLogs();
    if (!logs.length) {
        alert("No records to export.");
        return;
    }

    async function getBase64(imgUrl) {
        return new Promise(resolve => {
            let img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function () {
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                c.getContext("2d").drawImage(img, 0, 0);
                resolve(c.toDataURL("image/png"));
            };
            img.src = imgUrl;
        });
    }

    const tableBody = [
        [
            { text: "Date", bold: true },
            { text: "Time", bold: true },
            { text: "Name", bold: true },
            { text: "Company", bold: true },
            { text: "Reason", bold: true },
            { text: "Services", bold: true },
            { text: "Signature", bold: true }
        ]
    ];

    for (let log of logs) {
        const sig = log.signature ? await getBase64(log.signature) : "";

        tableBody.push([
            log.date,
            log.time,
            `${log.first} ${log.last}`,
            log.company,
            log.reason,
            log.services,
            sig ? { image: sig, width: 80 } : ""
        ]);
    }

    const docDef = {
        pageOrientation: "landscape",
        pageSize: "LETTER",

        header: {
            columns: [
                { text: "AMS Check-In Report", fontSize: 16, bold: true, margin: [20, 10] },
                { text: new Date().toLocaleDateString(), alignment: "right", margin: [0, 10, 20, 0] }
            ]
        },

        footer: function (currentPage, pageCount) {
            return {
                text: `Page ${currentPage} of ${pageCount}`,
                alignment: "center",
                margin: [0, 10, 0, 0]
            };
        },

        content: [
            {
                table: {
                    headerRows: 1,
                    widths: ["auto", "auto", "*", "*", "*", "*", 100],
                    body: tableBody
                }
            }
        ]
    };

    pdfMake.createPdf(docDef).download("AMS_Report.pdf");
}

/* ============================================================
   INIT EVENT LISTENERS
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    populateCompanyDropdown();
    applyFilters();

    document.getElementById("filterName").addEventListener("input", applyFilters);
    document.getElementById("filterCompany").addEventListener("change", applyFilters);
    document.getElementById("filterDateStart").addEventListener("change", applyFilters);
    document.getElementById("filterDateEnd").addEventListener("change", applyFilters);
    document.getElementById("filterDateRange").addEventListener("change", applyFilters);

    const btnXLS = document.getElementById("btnExportExcel");
    if (btnXLS) btnXLS.addEventListener("click", exportToExcel);

    const btnPDF = document.getElementById("btnExportPDF");
    if (btnPDF) btnPDF.addEventListener("click", exportToPDF);
});
