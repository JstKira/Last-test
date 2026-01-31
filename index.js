document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    document.getElementById('loading').style.display = 'block';

    reader.onload = function(event) {
        const text = event.target.result;
        processChatData(text);
    };
    reader.readAsText(file);
});

function processChatData(chatText) {
    const lines = chatText.split('\n');
    const members = {};
    let globalStats = { total: 0, media: 0, deleted: 0 };

    // Regex متوافق مع تنسيق واتساب (التاريخ والاسم)
    const lineRegex = /-\s(.*?):/;

    lines.forEach(line => {
        const match = line.match(lineRegex);
        if (match) {
            const sender = match[1].trim();
            const message = line.split(match[0])[1]?.trim() || "";

            if (!members[sender]) {
                members[sender] = { text: 0, media: 0, deleted: 0 };
            }

            globalStats.total++;

            if (message.includes("تم حذف هذه الرسالة") || message.includes("message was deleted")) {
                members[sender].deleted++;
                globalStats.deleted++;
            } else if (message.includes("<Media omitted>") || message.includes("<تم استبعاد الوسائط>")) {
                members[sender].media++;
                globalStats.media++;
            } else {
                members[sender].text++;
            }
        }
    });

    displayStats(members, globalStats);
}

function displayStats(members, global) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('totalMsg').innerText = global.total;
    document.getElementById('totalMedia').innerText = global.media;
    document.getElementById('totalDeleted').innerText = global.deleted;

    const tableBody = document.getElementById('membersBody');
    tableBody.innerHTML = '';
    const sortedMembers = Object.entries(members).sort((a, b) => b[1].text - a[1].text);

    sortedMembers.forEach(([name, data]) => {
        tableBody.innerHTML += `
            <tr>
                <td>${name}</td>
                <td>${data.text}</td>
                <td>${data.media}</td>
                <td style="color: #ff4d4d;">${data.deleted}</td>
            </tr>
        `;
    });
}
