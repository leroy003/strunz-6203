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
    var header = document.getElementById('pageHeader');
    header.classList.remove('align-right');
    header.querySelector('.title').textContent = 'Strunz 矿物查询器';
    header.querySelector('.desc').textContent = 'Strunz Mineral Query Tool';
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('headerActions').style.display = '';
    currentClass = null;
    currentDivision = null;
}

function goBack() {
    if (currentDivision !== null && currentClass !== null) {
        // 矿物列表页 → 返回分区列表页
        showClass(currentClass);
    } else {
        // 分区列表页 → 返回首页
        goHome();
    }
}

function showClass(code) {
    var data = allClassData[code];
    if (!data) { alert('数据加载失败: Class ' + code); return; }
    currentClass = code;
    currentDivision = null;
    document.getElementById('classNav').style.display = 'none';
    document.getElementById('mainContent').style.display = '';
    var header = document.getElementById('pageHeader');
    header.classList.add('align-right');
    header.querySelector('.title').textContent = data.name;
    header.querySelector('.desc').textContent = code + '｜' + data.en;
    document.getElementById('backBtn').style.display = '';
    document.getElementById('headerActions').style.display = 'none';

    var html = '<div class="class-nav">';
    for (var i = 0; i < data.divisions.length; i++) {
        var d = data.divisions[i];
        html += '<div class="list-card" onclick="showDivision(\'' + code + '\',' + i + ')">';
        html += '<div class="list-card-left">';
        html += '<div class="list-card-title">' + d.name + '</div>';
        html += '<div class="list-card-sub">' + d.code + '｜' + (d.en || '') + '</div>';
        html += '</div>';
        html += '<div class="list-card-right">';
        html += '<span class="list-card-badge">' + d.count + '</span>';
        html += '<span class="list-card-arrow">›</span>';
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    document.getElementById('contentArea').innerHTML = html;
}

var currentMineralPage = 0;
var MINERALS_PER_PAGE = 30; // 10行 × 3列

function showDivision(classCode, divIndex, page) {
    var data = allClassData[classCode];
    if (!data) return;
    var div = data.divisions[divIndex];
    currentDivision = divIndex;
    currentMineralPage = page || 0;
    var header = document.getElementById('pageHeader');
    header.classList.add('align-right');
    header.querySelector('.title').textContent = div.name;
    header.querySelector('.desc').textContent = div.code + '｜' + (div.en || '');
    document.getElementById('backBtn').style.display = '';
    var minerals = div.minerals || div.species || [];
    var totalPages = Math.ceil(minerals.length / MINERALS_PER_PAGE);
    var start = currentMineralPage * MINERALS_PER_PAGE;
    var end = Math.min(start + MINERALS_PER_PAGE, minerals.length);

    var html = '<div class="class-nav">';
    html += '<div class="mineral-grid">';
    for (var i = start; i < end; i++) {
        var m = minerals[i];
        html += '<div class="mineral-item" onclick=\'showMineral("' + classCode + '",' + divIndex + ',' + i + ')\'>';
        html += '<div class="mineral-cn">' + (m.cn || m.name || '未知') + '</div>';
        html += '<div class="mineral-en">' + (m.en || '') + '</div>';
        html += '</div>';
    }
    html += '</div>';

    if (totalPages > 1) {
        html += '<div class="pager">';
        if (currentMineralPage > 0) {
            html += '<span class="pager-btn" onclick="showDivision(\'' + classCode + '\',' + divIndex + ',' + (currentMineralPage - 1) + ')">‹ 上一页</span>';
        } else {
            html += '<span class="pager-btn disabled">‹ 上一页</span>';
        }
        html += '<span class="pager-info">' + (currentMineralPage + 1) + ' / ' + totalPages + '</span>';
        if (currentMineralPage < totalPages - 1) {
            html += '<span class="pager-btn" onclick="showDivision(\'' + classCode + '\',' + divIndex + ',' + (currentMineralPage + 1) + ')">下一页 ›</span>';
        } else {
            html += '<span class="pager-btn disabled">下一页 ›</span>';
        }
        html += '</div>';
    }

    html += '</div>';
    document.getElementById('contentArea').innerHTML = html;
    window.scrollTo(0, 0);
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

    var enFormula = (m.en || '');
    if (m.formula) enFormula += '｜' + escapeHtml(m.formula);
    var html = '<div class="modal-header">';
    html += '<div class="modal-title">' + (m.cn || m.name || '') + '</div>';
    html += '<div class="modal-en">' + enFormula + '</div>';
    html += '</div>';

    html += '<div class="props-grid2">';
    var keys = Object.keys(propLabels);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k === 'formula') continue;
        var val = m[k];
        if (val === undefined || val === null || val === '') continue;
        html += '<div class="prop-cell"><div class="prop-label">' + propLabels[k] + '</div><div class="prop-value">' + escapeHtml(String(val)) + '</div></div>';
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
    var placeholder = document.getElementById('searchPlaceholder');
    if (placeholder) { placeholder.classList.toggle('hidden', query.length > 0); }
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
        resultsDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">未找到匹配的矿物</div>';
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

function toggleSearch() {
    // TODO: 实现搜索功能
    alert('搜索功能开发中');
}

function toggleFavorites() {
    // TODO: 实现收藏功能
    alert('收藏功能开发中');
}
