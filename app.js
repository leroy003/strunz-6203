// Mineral Database Application
var allClassData = {
    '01': typeof class01Data !== 'undefined' ? class01Data : null,
    '02': typeof class02Data !== 'undefined' ? class02Data : null,
    '03': typeof class03Data !== 'undefined' ? class03Data : null,
    '04': typeof class04Data !== 'undefined' ? class04Data : null,
    '05': typeof class05Data !== 'undefined' ? class05Data : null,
    '06': typeof class06Data !== 'undefined' ? class06Data : null,
    '07': typeof class07Data !== 'undefined' ? class07Data : null,
    '08': typeof class08Data !== 'undefined' ? class08Data : null,
    '09': typeof class09Data !== 'undefined' ? class09Data : null,
    '10': typeof class10Data !== 'undefined' ? class10Data : null
};

var currentClass = null;
var currentDivision = null;

function goHome() {
    document.getElementById('classNav').style.display = '';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchInput').value = '';
    currentClass = null;
    currentDivision = null;
}

function showClass(code) {
    var data = allClassData[code];
    if (!data) { alert('数据加载失败: Class ' + code); return; }
    currentClass = code;
    currentDivision = null;
    document.getElementById('classNav').style.display = 'none';
    document.getElementById('mainContent').style.display = '';
    document.getElementById('breadcrumbClass').textContent = data.name;
    document.getElementById('breadcrumbDiv').textContent = '';

    var html = '<h2 class="page-title">' + data.name + ' <span class="class-en">' + data.en + '</span><span class="count">(' + data.count + ' 种矿物)</span></h2>';
    html += '<div class="division-list">';
    for (var i = 0; i < data.divisions.length; i++) {
        var d = data.divisions[i];
        html += '<div class="division-card" onclick="showDivision(\'' + code + '\',' + i + ')">';
        html += '<div class="division-code">' + d.code + '</div>';
        html += '<div class="division-name">' + d.name + '</div>';
        html += '<div class="division-en">' + (d.en || '') + '</div>';
        html += '<div class="division-count">' + d.count + ' 种矿物</div>';
        html += '</div>';
    }
    html += '</div>';
    document.getElementById('contentArea').innerHTML = html;
}

function showDivision(classCode, divIndex) {
    var data = allClassData[classCode];
    if (!data) return;
    var div = data.divisions[divIndex];
    currentDivision = divIndex;
    document.getElementById('breadcrumbDiv').textContent = div.code + ' ' + div.name;

    var minerals = div.minerals || div.species || [];
    var html = '<span class="back-btn" onclick="showClass(\'' + classCode + '\')">← 返回</span>';
    html += '<h2 class="page-title">' + div.code + ' ' + div.name + '<span class="count">(' + div.count + ' 种)</span></h2>';
    html += '<div class="mineral-grid">';
    for (var i = 0; i < minerals.length; i++) {
        var m = minerals[i];
        html += '<div class="mineral-item" onclick=\'showMineral("' + classCode + '",' + divIndex + ',' + i + ')\'>';
        html += '<div class="mineral-cn">' + (m.cn || m.name || '未知') + '</div>';
        html += '<div class="mineral-en">' + (m.en || '') + '</div>';
        html += '<div class="mineral-formula">' + escapeHtml(m.formula || '') + '</div>';
        html += '</div>';
    }
    html += '</div>';
    document.getElementById('contentArea').innerHTML = html;
}

function showMineral(classCode, divIndex, mIndex) {
    var data = allClassData[classCode];
    if (!data) return;
    var m = data.divisions[divIndex].minerals[mIndex] || data.divisions[divIndex].species[mIndex];
    if (!m) return;

    var propLabels = {
        formula:'化学式', strunzCode:'Strunz编号', imaNumber:'IMA编号',
        crystal:'晶系', spaceGroup:'空间群', crystalHabit:'晶体形态',
        hardness:'莫氏硬度', density:'密度 (g/cm³)', luster:'光泽',
        color:'颜色', streak:'条痕色', transparency:'透明度',
        cleavage:'解理', fracture:'断口', tenacity:'韧性/脆性',
        refractiveIndex:'折射率', birefringence:'双折射', pleochroism:'多色性',
        fluorescence:'荧光', locality:'产地', associatedMinerals:'共生矿物',
        uses:'用途', rarity:'稀有度', discoveryYear:'发现年份'
    };

    var html = '<div class="modal-title">' + (m.cn || m.name || '') + '</div>';
    html += '<div class="modal-en">' + (m.en || '') + '</div>';
    html += '<div class="modal-formula">' + escapeHtml(m.formula || '') + '</div>';
    html += '<div class="props-grid">';

    var keys = Object.keys(propLabels);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k === 'formula') continue;
        var val = m[k];
        if (val === undefined || val === null || val === '') continue;
        html += '<div class="prop-item"><div class="prop-label">' + propLabels[k] + '</div><div class="prop-value">' + escapeHtml(String(val)) + '</div></div>';
    }
    html += '</div>';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('mineralModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('mineralModal').style.display = 'none';
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function handleSearch(query) {
    query = query.trim().toLowerCase();
    var resultsDiv = document.getElementById('searchResults');
    if (query.length < 2) { resultsDiv.style.display = 'none'; return; }
    var results = [];
    var codes = Object.keys(allClassData);
    for (var ci = 0; ci < codes.length && results.length < 50; ci++) {
        var cd = allClassData[codes[ci]];
        if (!cd) continue;
        for (var di = 0; di < cd.divisions.length && results.length < 50; di++) {
            var minerals = cd.divisions[di].minerals || cd.divisions[di].species || [];
            for (var mi = 0; mi < minerals.length && results.length < 50; mi++) {
                var m = minerals[mi];
                var cn = (m.cn || m.name || '').toLowerCase();
                var en = (m.en || '').toLowerCase();
                var f = (m.formula || '').toLowerCase();
                if (cn.indexOf(query) !== -1 || en.indexOf(query) !== -1 || f.indexOf(query) !== -1) {
                    results.push({ m: m, classCode: codes[ci], divIndex: di, mIndex: mi });
                }
            }
        }
    }
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#8892b0;">未找到匹配的矿物</div>';
    } else {
        var html = '';
        for (var r = 0; r < results.length; r++) {
            var item = results[r];
            html += '<div class="result-item" onclick=\'showMineral("' + item.classCode + '",' + item.divIndex + ',' + item.mIndex + ')\'>';
            html += '<span class="result-cn">' + (item.m.cn || item.m.name || '') + '</span> ';
            html += '<span class="result-en">' + (item.m.en || '') + '</span>';
            html += '<div class="result-formula">' + escapeHtml(item.m.formula || '') + '</div>';
            html += '</div>';
        }
        resultsDiv.innerHTML = html;
    }
    resultsDiv.style.display = '';
    document.getElementById('classNav').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});
