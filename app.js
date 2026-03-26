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
    // 不足30个时填充占位div，保证始终占满10行×3列
    var rendered = end - start;
    for (var p = rendered; p < MINERALS_PER_PAGE; p++) {
        html += '<div class="mineral-placeholder"></div>';
    }
    html += '</div>';

    html += '<div class="pager">';
    if (currentMineralPage > 0) {
        html += '<span class="pager-btn" onclick="showDivision(\'' + classCode + '\',' + divIndex + ',' + (currentMineralPage - 1) + ')">‹ 上一页</span>';
    } else {
        html += '<span class="pager-btn disabled">‹ 上一页</span>';
    }
    html += '<span class="pager-info">' + (totalPages > 0 ? (currentMineralPage + 1) + ' / ' + totalPages : '0 / 0') + '</span>';
    if (currentMineralPage < totalPages - 1) {
        html += '<span class="pager-btn" onclick="showDivision(\'' + classCode + '\',' + divIndex + ',' + (currentMineralPage + 1) + ')">下一页 ›</span>';
    } else {
        html += '<span class="pager-btn disabled">下一页 ›</span>';
    }
    html += '</div>';

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
    var aliases = getMineralAliases(m.en);
    var html = '<div class="modal-header">';
    html += '<div class="modal-title' + (faved ? ' fav-highlight' : '') + '" id="modalTitleText" style="cursor:pointer;" onclick="handleTitleFav(this,\'' + classCode + '\',' + divIndex + ',' + mIndex + ')">' + (m.cn || m.name || '') + '</div>';
    html += '<div class="modal-en">' + subLine + '</div>';
    if (aliases.length > 0) {
        html += '<div class="modal-aliases">';
        for (var ai = 0; ai < aliases.length; ai++) {
            html += '<span class="alias-tag">' + escapeHtml(aliases[ai]) + '</span>';
        }
        html += '</div>';
    }
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
    // 刷新当前可见页面的收藏状态
    var favPage = document.getElementById('favPage');
    if (favPage && favPage.style.display !== 'none') {
        showFavPage(currentFavPage);
    } else if (currentClass && currentDivision !== null) {
        showDivision(currentClass, currentDivision, currentMineralPage);
    }
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 获取某矿物的所有别名/俗称（根据英文名反查别名表）
function getMineralAliases(enName) {
    if (typeof MINERAL_ALIASES === 'undefined' || !enName) return [];
    var target = enName.toLowerCase();
    var aliases = [];
    var keys = Object.keys(MINERAL_ALIASES);
    for (var i = 0; i < keys.length; i++) {
        var a = MINERAL_ALIASES[keys[i]];
        if (a.target && a.target.toLowerCase() === target) {
            aliases.push(keys[i]);
        }
    }
    return aliases;
}

// 别名搜索：查找匹配的别名，返回 [{ alias, target, cn, desc }]
function findMatchingAliases(query) {
    if (typeof MINERAL_ALIASES === 'undefined') return [];
    var matched = [];
    var keys = Object.keys(MINERAL_ALIASES);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase().indexOf(query) !== -1) {
            var a = MINERAL_ALIASES[keys[i]];
            if (a.target && a.target !== 'ite') { // 排除非矿物种（如琥珀等）
                matched.push({ alias: keys[i], target: a.target.toLowerCase(), cn: a.cn || '', desc: a.desc || '' });
            }
        }
    }
    return matched;
}

function handleSearch(query) {
    var placeholder = document.getElementById('searchPlaceholder');
    if (placeholder) { placeholder.classList.toggle('hidden', query.length > 0); }
    query = query.trim().toLowerCase();
    var resultsDiv = document.getElementById('searchResults');
    if (query.length < 2) { resultsDiv.style.display = 'none'; return; }

    // 直接匹配
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
                    results.push({ m: m, classCode: codes[ci], divIndex: di, mIndex: mi, aliasInfo: null });
                }
            }
        }
    }

    // 别名匹配（补充直接匹配未覆盖的结果）
    var aliases = findMatchingAliases(query);
    if (aliases.length > 0) {
        // 收集已匹配的英文名，避免重复
        var matched = {};
        for (var r = 0; r < results.length; r++) {
            matched[(results[r].m.en || '').toLowerCase()] = true;
        }
        for (var ai = 0; ai < aliases.length && results.length < 50; ai++) {
            var al = aliases[ai];
            // 遍历数据找到 target 矿物
            for (var ci2 = 0; ci2 < codes.length && results.length < 50; ci2++) {
                var cd2 = allClassData[codes[ci2]];
                if (!cd2) continue;
                for (var di2 = 0; di2 < cd2.divisions.length && results.length < 50; di2++) {
                    var minerals2 = cd2.divisions[di2].minerals || cd2.divisions[di2].species || [];
                    for (var mi2 = 0; mi2 < minerals2.length && results.length < 50; mi2++) {
                        var m2 = minerals2[mi2];
                        var en2 = (m2.en || '').toLowerCase();
                        if (en2 === al.target && !matched[en2]) {
                            results.push({ m: m2, classCode: codes[ci2], divIndex: di2, mIndex: mi2, aliasInfo: al });
                            matched[en2] = true;
                        }
                    }
                }
            }
        }
    }

    if (results.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">未找到匹配的矿物</div>';
    } else {
        var html = '';
        for (var r2 = 0; r2 < results.length; r2++) {
            var item = results[r2];
            html += '<div class="result-item" onclick=\'showMineral("' + item.classCode + '",' + item.divIndex + ',' + item.mIndex + ')\'>';
            html += '<span class="result-cn">' + (item.m.cn || item.m.name || '') + '</span> ';
            html += '<span class="result-en">' + (item.m.en || '') + '</span>';
            if (item.aliasInfo) html += '<span class="result-alias-tag">别名匹配</span>';
            html += '<div class="result-formula">' + escapeHtml(item.m.formula || '') + '</div>';
            if (item.aliasInfo) html += '<div class="result-alias-desc">' + escapeHtml(item.aliasInfo.desc) + '</div>';
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

    // 直接匹配
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
                    results.push({ m: m, classCode: codes[ci], divIndex: di, mIndex: mi, aliasInfo: null });
                }
            }
        }
    }

    // 别名匹配
    var aliases = findMatchingAliases(query);
    if (aliases.length > 0) {
        var matched = {};
        for (var r = 0; r < results.length; r++) {
            matched[(results[r].m.en || '').toLowerCase()] = true;
        }
        for (var ai = 0; ai < aliases.length && results.length < 50; ai++) {
            var al = aliases[ai];
            for (var ci2 = 0; ci2 < codes.length && results.length < 50; ci2++) {
                var cd2 = allClassData[codes[ci2]];
                if (!cd2) continue;
                for (var di2 = 0; di2 < cd2.divisions.length && results.length < 50; di2++) {
                    var minerals2 = cd2.divisions[di2].minerals || cd2.divisions[di2].species || [];
                    for (var mi2 = 0; mi2 < minerals2.length && results.length < 50; mi2++) {
                        var m2 = minerals2[mi2];
                        var en2 = (m2.en || '').toLowerCase();
                        if (en2 === al.target && !matched[en2]) {
                            results.push({ m: m2, classCode: codes[ci2], divIndex: di2, mIndex: mi2, aliasInfo: al });
                            matched[en2] = true;
                        }
                    }
                }
            }
        }
    }

    if (results.length === 0) {
        // 检查是否有非矿物种的别名匹配（如琥珀、黑曜石等）
        var nonMineralHints = [];
        if (typeof MINERAL_ALIASES !== 'undefined') {
            var allKeys = Object.keys(MINERAL_ALIASES);
            for (var nk = 0; nk < allKeys.length; nk++) {
                if (allKeys[nk].toLowerCase().indexOf(query) !== -1 && MINERAL_ALIASES[allKeys[nk]].target === 'ite') {
                    nonMineralHints.push(MINERAL_ALIASES[allKeys[nk]].desc);
                }
            }
        }
        if (nonMineralHints.length > 0) {
            var hintHtml = '<div class="search-modal-empty">未找到匹配的矿物</div>';
            for (var nh = 0; nh < nonMineralHints.length; nh++) {
                hintHtml += '<div style="text-align:center;padding:8px 0;color:#b8860b;font-size:13px;">' + escapeHtml(nonMineralHints[nh]) + '</div>';
            }
            resultsDiv.innerHTML = hintHtml;
        } else {
            resultsDiv.innerHTML = '<div class="search-modal-empty">未找到匹配的矿物</div>';
        }
    } else {
        var html = '';
        for (var r2 = 0; r2 < results.length; r2++) {
            var item = results[r2];
            html += '<div class="result-item" onclick=\'closeSearchModal();showMineral("' + item.classCode + '",' + item.divIndex + ',' + item.mIndex + ')\'>';
            // 第一行：矿物名
            html += '<div class="result-line1"><span class="result-cn">' + escapeHtml(item.m.cn || item.m.name || '') + '</span></div>';
            // 第二行：英文名｜匹配别名说明
            var line2 = escapeHtml(item.m.en || '');
            if (item.aliasInfo && item.aliasInfo.desc) line2 += '<span class="result-alias-hint">｜' + escapeHtml(item.aliasInfo.desc) + '</span>';
            html += '<div class="result-line2">' + line2 + '</div>';
            // 第三行：别名标签
            var itemAliases = getMineralAliases(item.m.en);
            if (itemAliases.length > 0) {
                html += '<div class="result-line3">';
                for (var ta = 0; ta < itemAliases.length; ta++) {
                    html += '<span class="alias-tag">' + escapeHtml(itemAliases[ta]) + '</span>';
                }
                html += '</div>';
            }
            html += '</div>';
        }
        var directCount = 0, aliasCount = 0;
        for (var rc = 0; rc < results.length; rc++) {
            if (results[rc].aliasInfo) aliasCount++; else directCount++;
        }
        var countText = '共找到 ' + results.length + ' 种矿物';
        if (aliasCount > 0) countText += '（直接匹配 ' + directCount + '，别名匹配 ' + aliasCount + '）';
        if (results.length >= 50) countText += '（仅显示前50条）';
        html += '<div class="result-count">' + countText + '</div>';
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
var FAV_PER_PAGE = 8; // 4行 × 2列
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

function supabaseSyncFavorites(callback) {
    try {
        fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?select=class_code,div_index,m_index,created_at&order=created_at.asc', {
            method: 'GET',
            headers: supabaseHeaders()
        }).then(function(res) {
            if (!res.ok) { console.warn('Supabase sync failed:', res.status); if (callback) callback(false); return; }
            return res.json();
        }).then(function(rows) {
            if (!rows || !Array.isArray(rows)) { if (callback) callback(false); return; }
            var cloudFavs = [];
            for (var i = 0; i < rows.length; i++) {
                cloudFavs.push({
                    classCode: rows[i].class_code,
                    divIndex: rows[i].div_index,
                    mIndex: rows[i].m_index,
                    time: new Date(rows[i].created_at).getTime()
                });
            }
            // 云端覆盖本地
            saveFavorites(cloudFavs);
            favSynced = true;
            console.log('云端覆盖本地完成: ' + cloudFavs.length + ' 条收藏');
            if (callback) callback(true);
        }).catch(function(e) { console.warn('Supabase sync error:', e); if (callback) callback(false); });
    } catch (e) { console.warn('Supabase sync error:', e); if (callback) callback(false); }
}

// 同步收藏：以本地为准覆盖云端（先清空云端，再逐条上传本地数据）
function syncFavToCloud() {
    var btn = event && event.target;
    var originalColor = btn ? btn.style.color : '';
    if (btn) { btn.style.color = '#E5E5E5'; btn.style.pointerEvents = 'none'; }
    var localFavs = getFavorites();
    // 第一步：删除云端全部数据
    fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?id=gt.0', {
        method: 'DELETE',
        headers: supabaseHeaders()
    }).then(function(res) {
        if (!res.ok) { throw new Error('清空云端失败: ' + res.status); }
        // 第二步：把本地收藏逐条上传
        if (localFavs.length === 0) { return Promise.resolve(); }
        var rows = [];
        for (var i = 0; i < localFavs.length; i++) {
            rows.push({
                class_code: localFavs[i].classCode,
                div_index: localFavs[i].divIndex,
                m_index: localFavs[i].mIndex
            });
        }
        return fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE, {
            method: 'POST',
            headers: supabaseHeaders(),
            body: JSON.stringify(rows)
        });
    }).then(function(res) {
        if (res && !res.ok) { throw new Error('上传云端失败: ' + res.status); }
        if (btn) { btn.style.color = originalColor; btn.style.pointerEvents = ''; }
        console.log('本地 ' + localFavs.length + ' 条收藏已覆盖云端');
        showFavPage(currentFavPage);
    }).catch(function(e) {
        console.warn('同步到云端失败:', e);
        if (btn) { btn.style.color = originalColor; btn.style.pointerEvents = ''; }
        showFavPage(currentFavPage);
    });
}

// 页面加载时自动同步并进入收藏页
function initApp() {
    showFavPage(0);
    document.querySelector('.page-wrapper').classList.add('ready');
    supabaseSyncFavorites(function() {
        showFavPage(0);
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
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
    var itemCount = end - start;
    html += '<div class="fav-grid">';
    for (var i = start; i < end; i++) {
        var f = favs[i];
        var data = allClassData[f.classCode];
        if (!data) { itemCount--; continue; }
        var div = data.divisions[f.divIndex];
        if (!div) { itemCount--; continue; }
        var minerals = div.minerals || div.species || [];
        var m = minerals[f.mIndex];
        if (!m) { itemCount--; continue; }
        html += '<div class="fav-item" onclick=\'showMineral("' + f.classCode + '",' + f.divIndex + ',' + f.mIndex + ')\'>';
        html += '<div class="fav-item-cn"><span class="fav-highlight">' + escapeHtml(m.cn || m.name || '未知') + '</span></div>';
        html += '<div class="fav-item-en">' + escapeHtml(m.en || '') + '</div>';
        var favAliases = getMineralAliases(m.en);
        html += '<div class="fav-item-aliases">';
        if (favAliases.length > 0) {
            for (var ai = 0; ai < favAliases.length; ai++) {
                html += '<span class="alias-tag">' + escapeHtml(favAliases[ai]) + '</span>';
            }
        } else {
            html += '<span class="alias-tag">' + escapeHtml(m.cn || m.name || '未知') + '</span>';
        }
        html += '</div>';
        html += '</div>';
    }
    // 不足8个时用虚线占位框补齐
    for (var p = itemCount; p < FAV_PER_PAGE; p++) {
        html += '<div class="fav-item-placeholder"></div>';
    }
    html += '</div>';

    html += '<div class="pager">';
    if (currentFavPage > 0) {
        html += '<span class="pager-btn" onclick="showFavPage(' + (currentFavPage - 1) + ')">‹ 上一页</span>';
    } else {
        html += '<span class="pager-btn disabled">‹ 上一页</span>';
    }
    html += '<span class="pager-info">' + (totalPages > 0 ? (currentFavPage + 1) + ' / ' + totalPages : '0 / 0') + '</span>';
    if (currentFavPage < totalPages - 1) {
        html += '<span class="pager-btn" onclick="showFavPage(' + (currentFavPage + 1) + ')">下一页 ›</span>';
    } else {
        html += '<span class="pager-btn disabled">下一页 ›</span>';
    }
    html += '</div>';
    document.getElementById('favContent').innerHTML = html;
    window.scrollTo(0, 0);
}

function closeFavPage() {
    document.getElementById('favPage').style.display = 'none';
    document.getElementById('pageHeader').style.display = '';
    goHome();
    // 如果之前在看某个分类列表，刷新其收藏状态
    if (currentClass && currentDivision !== null) {
        showDivision(currentClass, currentDivision, currentMineralPage);
    }
}
