// index.js - النسخة الاحترافية لمحلل الرقابة (ممالك لاست)

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // إظهار واجهة التحميل
    const loadingEl = document.getElementById('loading');
    if(loadingEl) loadingEl.style.display = 'block';

    reader.onload = function(event) {
        const text = event.target.result;
        processChatData(text);
    };
    reader.readAsText(file);
});

function processChatData(chatText) {
    const lines = chatText.split(/\r?\n/); // تقسيم النص لأسطر بشكل سليم
    const members = {};
    let globalStats = { total: 0, media: 0, deleted: 0 };

    // المصفوفات الخاصة بالأنماط الشائعة
    const mediaPatterns = ["<Media omitted>", "<تم استبعاد الوسائط>", "photo", "video", "sticker", "audio", "Ptt"];
    const deletedPatterns = ["تم حذف هذه الرسالة", "This message was deleted", "لقد حذفت أنت هذه الرسالة"];

    lines.forEach(line => {
        // تنظيف السطر من الرموز المخفية (Invisible characters) التي تفسد التحليل
        const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        if (!cleanLine) return;

        let sender = "";
        let message = "";

        // المحرك الذكي للتعرف على المرسل (يدعم آيفون وأندرويد)
        if (cleanLine.includes("] ") && cleanLine.includes(": ")) {
            // نمط الآيفون: [10/01/2026, 1:40 PM] الاسم: الرسالة
            const parts = cleanLine.split("] ");
            const content = parts.slice(1).join("] "); // دمج ما بعد التاريخ
            const colonIndex = content.indexOf(": ");
            if (colonIndex !== -1) {
                sender = content.substring(0, colonIndex).trim();
                message = content.substring(colonIndex + 2).trim();
            }
        } else if (cleanLine.includes(" - ") && cleanLine.includes(": ")) {
            // نمط الأندرويد: 10/01/2026, 1:40 PM - الاسم: الرسالة
            const parts = cleanLine.split(" - ");
            const content = parts.slice(1).join(" - ");
            const colonIndex = content.indexOf(": ");
            if (colonIndex !== -1) {
                sender = content.substring(0, colonIndex).trim();
                message = content.substring(colonIndex + 2).trim();
            }
        }

        // إذا نجح المحرك في استخراج المرسل
        if (sender && message) {
            // تجاهل رسائل النظام الطويلة جداً التي لا تمثل أسماء حقيقية
            if (sender.length > 30) return;

            if (!members[sender]) {
                members[sender] = { text: 0, media: 0, deleted: 0 };
            }

            globalStats.total++;

            // التحقق من نوع الرسالة
            const lowerMsg = message.toLowerCase();
            
            const isDeleted = deletedPatterns.some(p => message.includes(p));
            const isMedia = mediaPatterns.some(p => message.includes(p));

            if (isDeleted) {
                members[sender].deleted++;
                globalStats.deleted++;
            } else if (isMedia) {
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
    const loadingEl = document.getElementById('loading');
    const dashboardEl = document.getElementById('dashboard');
    if(loadingEl) loadingEl.style.display = 'none';
    if(dashboardEl) dashboardEl.style.display = 'block';

    document.getElementById('totalMsg').innerText = global.total.toLocaleString();
    document.getElementById('totalMedia').innerText = global.media.toLocaleString();
    document.getElementById('totalDeleted').innerText = global.deleted.toLocaleString();

    const tableBody = document.getElementById('membersBody');
    tableBody.innerHTML = '';

    // ترتيب الأعضاء حسب النشاط الفعلي (رسائل + وسائط)
    const sortedMembers = Object.entries(members).sort((a, b) => {
        return (b[1].text + b[1].media) - (a[1].text + a[1].media);
    });

    sortedMembers.forEach(([name, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align:right; font-weight:bold; color: #58a6ff;">${name}</td>
            <td>${data.text.toLocaleString()}</td>
            <td>${data.media.toLocaleString()}</td>
            <td style="color: #f85149;">${data.deleted.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}
