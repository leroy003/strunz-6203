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
    document.getElementById('favPage').style.display = 'none';
    var header = document.getElementById('pageHeader');
    header.style.display = '';
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
        var favClass = isFavorited(classCode, divIndex, i) ? ' fav-highlight' : '';
        html += '<div class="mineral-item" onclick=\'showMineral("' + classCode + '",' + divIndex + ',' + i + ')\'>';
        html += '<div class="mineral-cn' + favClass + '">' + (m.cn || m.name || '未知') + '</div>';
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

    var className = data.name || '';
    var divName = data.divisions[divIndex].name || '';
    var subLine = className + '｜' + divName + '｜' + (m.en || '');
    if (m.formula) subLine += '｜' + escapeHtml(m.formula);
    var faved = isFavorited(classCode, divIndex, mIndex);
    var html = '<div class="modal-header">';
    html += '<div class="modal-title' + (faved ? ' fav-highlight' : '') + '" id="modalTitleText" style="cursor:pointer;" onclick="handleTitleFav(this,\'' + classCode + '\',' + divIndex + ',' + mIndex + ')">' + (m.cn || m.name || '') + '</div>';
    html += '<div class="modal-en">' + subLine + '</div>';
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

function handleTitleFav(el, classCode, divIndex, mIndex) {
    var isFaved = toggleFavorite(classCode, divIndex, mIndex);
    var title = document.getElementById('modalTitleText');
    if (title) {
        if (isFaved) {
            title.classList.add('fav-highlight');
        } else {
            title.classList.remove('fav-highlight');
        }
    }
}

function closeModal() {
    document.getElementById('mineralModal').style.display = 'none';
    // 刷新当前列表页的收藏状态
    if (currentClass && currentDivision !== null) {
        showDivision(currentClass, currentDivision, currentMineralPage);
    }
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
    if (e.key === 'Escape') {
        closeModal();
        closeSearchModal();
    }
});

function toggleSearch() {
    document.getElementById('searchModal').style.display = 'flex';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchModalResults').innerHTML = '<div class="search-modal-empty">输入关键词开始搜索</div>';
    setTimeout(function() { document.getElementById('searchInput').focus(); }, 100);
}

function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
}

function handleSearchModal(query) {
    query = (query || '').trim().toLowerCase();
    var resultsDiv = document.getElementById('searchModalResults');
    if (query.length < 2) {
        resultsDiv.innerHTML = '<div class="search-modal-empty">输入关键词开始搜索</div>';
        return;
    }
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
        resultsDiv.innerHTML = '<div class="search-modal-empty">未找到匹配的矿物</div>';
    } else {
        var html = '';
        for (var r = 0; r < results.length; r++) {
            var item = results[r];
            html += '<div class="result-item" onclick=\'closeSearchModal();showMineral("' + item.classCode + '",' + item.divIndex + ',' + item.mIndex + ')\'>';
            html += '<span class="result-cn">' + escapeHtml(item.m.cn || item.m.name || '') + '</span>';
            html += '<span class="result-en">' + escapeHtml(item.m.en || '') + '</span>';
            if (item.m.formula) html += '<div class="result-formula">' + escapeHtml(item.m.formula) + '</div>';
            html += '</div>';
        }
        html += '<div class="result-count">共找到 ' + results.length + ' 种矿物' + (results.length >= 50 ? '（仅显示前50条）' : '') + '</div>';
        resultsDiv.innerHTML = html;
    }
}

// ==================== Supabase 配置 ====================
var SUPABASE_URL = 'https://zrliaxipbmspkztbjdsr.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpybGlheGlwYm1zcGt6dGJqZHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODc4NjMsImV4cCI6MjA5MDA2Mzg2M30.2fCodpAq1LtDWm3qfepD0mF9qD5BosREfR3yLJ8dHV4';
var SUPABASE_TABLE = 'mineral_favorites';

function supabaseHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };
}

// ==================== 收藏功能 ====================
var FAV_KEY = 'mineral_favorites';
var FAV_PER_PAGE = 20; // 10行 × 2列
var currentFavPage = 0;
var favSynced = false;

function getFavorites() {
    try {
        var raw = localStorage.getItem(FAV_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveFavorites(favs) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function isFavorited(classCode, divIndex, mIndex) {
    var favs = getFavorites();
    for (var i = 0; i < favs.length; i++) {
        if (favs[i].classCode === classCode && favs[i].divIndex === divIndex && favs[i].mIndex === mIndex) return true;
    }
    return false;
}

function toggleFavorite(classCode, divIndex, mIndex) {
    var favs = getFavorites();
    var found = -1;
    for (var i = 0; i < favs.length; i++) {
        if (favs[i].classCode === classCode && favs[i].divIndex === divIndex && favs[i].mIndex === mIndex) { found = i; break; }
    }
    if (found >= 0) {
        favs.splice(found, 1);
        supabaseDeleteFav(classCode, divIndex, mIndex);
    } else {
        favs.push({ classCode: classCode, divIndex: divIndex, mIndex: mIndex, time: Date.now() });
        supabaseInsertFav(classCode, divIndex, mIndex);
    }
    saveFavorites(favs);
    return found < 0; // true=刚收藏, false=取消收藏
}

// ==================== Supabase 云端同步 ====================
function supabaseInsertFav(classCode, divIndex, mIndex) {
    try {
        fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE, {
            method: 'POST',
            headers: supabaseHeaders(),
            body: JSON.stringify({
                class_code: classCode,
                div_index: divIndex,
                m_index: mIndex,
                created_at: new Date().toISOString()
            })
        }).catch(function(e) { console.warn('Supabase insert error:', e); });
    } catch (e) { console.warn('Supabase insert error:', e); }
}

function supabaseDeleteFav(classCode, divIndex, mIndex) {
    try {
        var url = SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE
            + '?class_code=eq.' + encodeURIComponent(classCode)
            + '&div_index=eq.' + divIndex
            + '&m_index=eq.' + mIndex;
        fetch(url, {
            method: 'DELETE',
            headers: supabaseHeaders()
        }).catch(function(e) { console.warn('Supabase delete error:', e); });
    } catch (e) { console.warn('Supabase delete error:', e); }
}

function supabaseSyncFavorites() {
    try {
        fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?select=class_code,div_index,m_index,created_at&order=created_at.asc', {
            method: 'GET',
            headers: supabaseHeaders()
        }).then(function(res) {
            if (!res.ok) { console.warn('Supabase sync failed:', res.status); return; }
            return res.json();
        }).then(function(rows) {
            if (!rows || !Array.isArray(rows)) return;
            var cloudFavs = [];
            for (var i = 0; i < rows.length; i++) {
                cloudFavs.push({
                    classCode: rows[i].class_code,
                    divIndex: rows[i].div_index,
                    mIndex: rows[i].m_index,
                    time: new Date(rows[i].created_at).getTime()
                });
            }
            // 合并：云端为准，补充本地独有的
            var localFavs = getFavorites();
            var merged = cloudFavs.slice();
            for (var j = 0; j < localFavs.length; j++) {
                var lf = localFavs[j];
                var exists = false;
                for (var k = 0; k < merged.length; k++) {
                    if (merged[k].classCode === lf.classCode && merged[k].divIndex === lf.divIndex && merged[k].mIndex === lf.mIndex) { exists = true; break; }
                }
                if (!exists) {
                    merged.push(lf);
                    supabaseInsertFav(lf.classCode, lf.divIndex, lf.mIndex);
                }
            }
            saveFavorites(merged);
            favSynced = true;
            console.log('Supabase sync OK: ' + merged.length + ' favorites');
        }).catch(function(e) { console.warn('Supabase sync error:', e); });
    } catch (e) { console.warn('Supabase sync error:', e); }
}

// 页面加载时自动同步
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', supabaseSyncFavorites);
} else {
    supabaseSyncFavorites();
}

function toggleFavorites() {
    showFavPage(0);
}

function showFavPage(page) {
    currentFavPage = page || 0;
    // 隐藏其他页面
    document.getElementById('classNav').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('favPage').style.display = '';
    document.getElementById('pageHeader').style.display = 'none';

    var favs = getFavorites();
    var totalPages = Math.ceil(favs.length / FAV_PER_PAGE) || 1;
    if (currentFavPage >= totalPages) currentFavPage = totalPages - 1;
    var start = currentFavPage * FAV_PER_PAGE;
    var end = Math.min(start + FAV_PER_PAGE, favs.length);

    var html = '';
    if (favs.length === 0) {
        html = '<div class="fav-empty">还没有收藏任何矿物</div>';
    } else {
        html += '<div class="fav-grid">';
        for (var i = start; i < end; i++) {
            var f = favs[i];
            var data = allClassData[f.classCode];
            if (!data) continue;
            var div = data.divisions[f.divIndex];
            if (!div) continue;
            var minerals = div.minerals || div.species || [];
            var m = minerals[f.mIndex];
            if (!m) continue;
            html += '<div class="fav-item" onclick=\'showMineral("' + f.classCode + '",' + f.divIndex + ',' + f.mIndex + ')\'>';
            html += '<div class="fav-item-cn">' + escapeHtml(m.cn || m.name || '未知') + '</div>';
            html += '<div class="fav-item-en">' + escapeHtml(m.en || '') + '</div>';
            html += '</div>';
        }
        html += '</div>';

        if (totalPages > 1) {
            html += '<div class="pager">';
            if (currentFavPage > 0) {
                html += '<span class="pager-btn" onclick="showFavPage(' + (currentFavPage - 1) + ')">‹ 上一页</span>';
            } else {
                html += '<span class="pager-btn disabled">‹ 上一页</span>';
            }
            html += '<span class="pager-info">' + (currentFavPage + 1) + ' / ' + totalPages + '</span>';
            if (currentFavPage < totalPages - 1) {
                html += '<span class="pager-btn" onclick="showFavPage(' + (currentFavPage + 1) + ')">下一页 ›</span>';
            } else {
                html += '<span class="pager-btn disabled">下一页 ›</span>';
            }
            html += '</div>';
        }
    }
    document.getElementById('favContent').innerHTML = html;
    window.scrollTo(0, 0);
}

function closeFavPage() {
    document.getElementById('favPage').style.display = 'none';
    document.getElementById('pageHeader').style.display = '';
    goHome();
}
