document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    document.getElementById('loading').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    
    reader.onload = (event) => processChatData(event.target.result);
    reader.readAsText(file);
});

function processChatData(chatText) {
    const lines = chatText.split(/\r?\n/);
    const members = {};
    let stats = { 
        totalRaw: 0, 
        textOnly: 0, 
        media: 0, 
        deleted: 0, 
        system: 0, 
        netActivity: 0 
    };

    // كلمات مفتاحية لاستبعاد رسائل النظام
    const systemKeywords = ["انضم", "غادر", "أضاف", "joined", "left", "added", "تغيرت", "أنشأ", "created", "security code", "رموز الأمان"];

    lines.forEach(line => {
        const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        if (!cleanLine) return;

        let sender = "", message = "";
        
        // المحرك الذكي للفصل (أندرويد + آيفون)
        if (cleanLine.includes("] ") && cleanLine.includes(": ")) {
            const parts = cleanLine.split("] ");
            const content = parts.slice(1).join("] ").split(": ");
            sender = content[0]?.trim();
            message = content.slice(1).join(": ")?.trim();
        } else if (cleanLine.includes(" - ") && cleanLine.includes(": ")) {
            const parts = cleanLine.split(" - ");
            const content = parts.slice(1).join(" - ").split(": ");
            sender = content[0]?.trim();
            message = content.slice(1).join(": ")?.trim();
        }

        if (sender && message) {
            // استبعاد رسائل النظام من تفاعل العضو
            if (systemKeywords.some(k => message.includes(k)) || sender.length > 30) {
                stats.system++;
                return;
            }

            if (!members[sender]) members[sender] = { text: 0, media: 0, deleted: 0, total: 0 };

            stats.totalRaw++;
            members[sender].total++;

            if (message.includes("تم حذف") || message.includes("deleted")) {
                members[sender].deleted++;
                stats.deleted++;
            } else if (message.includes("<Media omitted>") || message.includes("<تم استبعاد الوسائط>")) {
                members[sender].media++;
                stats.media++;
            } else {
                members[sender].text++;
                stats.textOnly++;
            }
        }
    });

    stats.netActivity = stats.totalRaw - stats.deleted;
    displayDetailedStats(members, stats);
}

function displayDetailedStats(members, stats) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // تحديث الأرقام الكلية
    document.getElementById('totalMsg').innerText = stats.totalRaw.toLocaleString();
    document.getElementById('textOnly').innerText = stats.textOnly.toLocaleString();
    document.getElementById('totalMedia').innerText = stats.media.toLocaleString();
    document.getElementById('totalDeleted').innerText = stats.deleted.toLocaleString();
    document.getElementById('systemMsg').innerText = stats.system.toLocaleString();
    document.getElementById('memberCount').innerText = Object.keys(members).length;
    document.getElementById('netStats').innerText = stats.netActivity.toLocaleString();

    const tableBody = document.getElementById('membersBody');
    tableBody.innerHTML = '';

    // الترتيب حسب "التفاعل الصافي" (أهم مقياس للقادة)
    const sorted = Object.entries(members).sort((a, b) => (b[1].total - b[1].deleted) - (a[1].total - a[1].deleted));

    sorted.forEach(([name, data]) => {
        const userNet = data.total - data.deleted;
        const row = `
            <tr>
                <td style="color:#58a6ff; font-weight:bold;">${name}</td>
                <td>${data.text}</td>
                <td>${data.media}</td>
                <td style="color:#f85149;">${data.deleted}</td>
                <td style="color:#3fb950; font-weight:bold; background: rgba(63, 185, 80, 0.1);">${userNet}</td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}
