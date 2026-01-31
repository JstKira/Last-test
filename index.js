// index.js - المحرك المطور للرقابة الشاملة

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    document.getElementById('loading').style.display = 'block';
    reader.onload = (event) => processChatData(event.target.result);
    reader.readAsText(file);
});

function processChatData(chatText) {
    const lines = chatText.split(/\r?\n/);
    const members = {};
    // كائن الإحصائيات الشاملة
    let stats = { 
        totalRaw: 0,      // كل الأسطر التي تحتوي على اسم
        textOnly: 0,      // رسائل نصية صافية
        media: 0,         // صور وفيديوهات
        deleted: 0,       // رسائل محذوفة
        system: 0,        // رسائل نظام (انضم/غادر)
        netActivity: 0    // التفاعل الحقيقي (إجمالي - محذوف)
    };

    const systemKeywords = ["انضم", "غادر", "أضاف", "joined", "left", "added", "تغيرت", "أنشأ", "created"];

    lines.forEach(line => {
        const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        if (!cleanLine) return;

        let sender = "", message = "";
        // محرك استخراج البيانات (يدعم أندرويد وآيفون)
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
            // 1. فحص رسائل النظام (تجاهل)
            if (systemKeywords.some(k => message.includes(k)) || sender.length > 25) {
                stats.system++;
                return;
            }

            if (!members[sender]) members[sender] = { text: 0, media: 0, deleted: 0, total: 0 };

            stats.totalRaw++;
            members[sender].total++;

            // 2. تصنيف الرسالة
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

    // تحديث لوحة البيانات العلوية
    document.getElementById('totalMsg').innerText = stats.totalRaw.toLocaleString();
    document.getElementById('textOnly').innerText = stats.textOnly.toLocaleString();
    document.getElementById('totalMedia').innerText = stats.media.toLocaleString();
    document.getElementById('totalDeleted').innerText = stats.deleted.toLocaleString();
    document.getElementById('systemMsg').innerText = stats.system.toLocaleString();
    document.getElementById('memberCount').innerText = Object.keys(members).length;
    // إضافة خانة التفاعل الصافي (بعد خصم المحذوف)
    if(document.getElementById('netStats')) {
        document.getElementById('netStats').innerText = stats.netActivity.toLocaleString();
    }

    const tableBody = document.getElementById('membersBody');
    tableBody.innerHTML = '';

    // الترتيب حسب الرسائل النصية الصافية (الأكثر نشاطاً)
    const sorted = Object.entries(members).sort((a, b) => b[1].text - a[1].text);

    sorted.forEach(([name, data]) => {
        const netUserActivity = data.total - data.deleted;
        tableBody.innerHTML += `
            <tr>
                <td style="color:#58a6ff; font-weight:bold;">${name}</td>
                <td>${data.text}</td>
                <td>${data.media}</td>
                <td style="color:#f85149;">${data.deleted}</td>
                <td style="color:#3fb950; font-weight:bold;">${netUserActivity}</td>
            </tr>`;
    });
}
