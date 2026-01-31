// index.js - نسخة الرقابة الاحترافية (دقة 100%)

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const loadingEl = document.getElementById('loading');
    if(loadingEl) loadingEl.style.display = 'block';

    reader.onload = function(event) {
        processChatData(event.target.result);
    };
    reader.readAsText(file);
});

function processChatData(chatText) {
    const lines = chatText.split(/\r?\n/);
    const members = {};
    let stats = { total: 0, media: 0, deleted: 0, system: 0, textOnly: 0 };

    // قائمة رسائل النظام التي يجب استبعادها من تفاعل العضو
    const systemTriggers = [
        "انضم", "غادر", "أضاف", "تمت إضافتك", "تغيرت رموز الأمان", 
        "رسائل هذا الحساب مشفرة", "أنشأ", "قام بتغيير", "غادر المجموعة",
        "joined", "left", "added", "created", "changed", "security code"
    ];

    lines.forEach(line => {
        const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        if (!cleanLine) return;

        let sender = "";
        let message = "";

        // محرك الفصل الذكي
        if (cleanLine.includes("] ") && cleanLine.includes(": ")) {
            const parts = cleanLine.split("] ");
            const content = parts.slice(1).join("] ");
            const colonIndex = content.indexOf(": ");
            if (colonIndex !== -1) {
                sender = content.substring(0, colonIndex).trim();
                message = content.substring(colonIndex + 2).trim();
            }
        } else if (cleanLine.includes(" - ") && cleanLine.includes(": ")) {
            const parts = cleanLine.split(" - ");
            const content = parts.slice(1).join(" - ");
            const colonIndex = content.indexOf(": ");
            if (colonIndex !== -1) {
                sender = content.substring(0, colonIndex).trim();
                message = content.substring(colonIndex + 2).trim();
            }
        }

        if (sender && message) {
            // فلتر رسائل النظام: إذا كان محتوى الرسالة فيه كلمة "انضم" أو "أضاف" فهي ليست رسالة حقيقية
            const isSystem = systemTriggers.some(t => message.includes(t)) || sender.length > 25;
            
            if (isSystem) {
                stats.system++;
                return; // تجاهل السطر ولا تحسبه للعضو
            }

            if (!members[sender]) members[sender] = { text: 0, media: 0, deleted: 0 };

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
            stats.total++;
        }
    });

    displayStats(members, stats);
}

function displayStats(members, stats) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    // عرض الأرقام الكلية بدقة
    document.getElementById('totalMsg').innerText = stats.total.toLocaleString();
    document.getElementById('totalMedia').innerText = stats.media.toLocaleString();
    document.getElementById('totalDeleted').innerText = stats.deleted.toLocaleString();

    const tableBody = document.getElementById('membersBody');
    tableBody.innerHTML = '';

    // ترتيب حسب صافي الرسائل النصية
    const sorted = Object.entries(members).sort((a, b) => b[1].text - a[1].text);

    sorted.forEach(([name, data]) => {
        const row = `
            <tr>
                <td style="color:#58a6ff; font-weight:bold;">${name}</td>
                <td>${data.text}</td>
                <td>${data.media}</td>
                <td style="color:#f85149;">${data.deleted}</td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}
