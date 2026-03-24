// ============================================================
// webmineral.com 矿物物理属性批量抓取脚本 v2
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'webmineral_data.json');

// 读取 RRUFF 矿物名称列表
const rruff = JSON.parse(fs.readFileSync(path.join(__dirname, 'rruff_classified.json'), 'utf8'));
let allMinerals = [];
for (const cls of Object.keys(rruff).sort()) {
  for (const m of rruff[cls]) {
    allMinerals.push(m.en);
  }
}

// 加载已有进度
let fetched = {};
if (fs.existsSync(OUTPUT_FILE)) {
  fetched = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
}
console.log('总矿物: ' + allMinerals.length + ' | 已获取: ' + Object.keys(fetched).length);

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: { 'User-Agent': 'MineralDB-Academic/1.0' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// 从 HTML 表格行中提取属性值
// 格式: <b>PropertyName: </b></td>\n<td>Value   </td>
function extractProp(html, propName) {
  // 匹配 <b>propName: </b></td>\n<td>VALUE</td>
  const re = new RegExp('<b>' + propName + ':\\s*</b></td>\\s*\\n?\\s*<td>([^<]+)', 'i');
  const m = html.match(re);
  if (m) return m[1].trim().replace(/\s+$/, '');
  return null;
}

function parseHTML(html) {
  const data = {};
  
  // 硬度
  const hard = extractProp(html, 'Hardness');
  if (hard) {
    const hNum = hard.match(/([\d.]+(?:\s*-\s*[\d.]+)?)/);
    if (hNum) data.hardness = hNum[1].replace(/\s/g, '');
  }
  
  // 密度
  const dens = extractProp(html, 'Density');
  if (dens) {
    const dMatch = dens.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (dMatch) data.density = dMatch[1] + '-' + dMatch[2];
    else {
      const dSingle = dens.match(/([\d.]+)/);
      if (dSingle) data.density = dSingle[1];
    }
  }
  
  // 光泽
  const lust = extractProp(html, 'Luster');
  if (lust) data.luster = lust;
  
  // 颜色
  const col = extractProp(html, 'Color');
  if (col) data.color = col.replace(/\.\s*$/, '');
  
  // 条痕色
  const strk = extractProp(html, 'Streak');
  if (strk) data.streak = strk;
  
  // 透明度
  const dia = extractProp(html, 'Diaphaneity');
  if (dia) data.transparency = dia;
  
  // 解理
  const clv = extractProp(html, 'Cleavage');
  if (clv) data.cleavage = clv;
  
  // 断口
  const frc = extractProp(html, 'Fracture');
  if (frc) data.fracture = frc.split(' - ')[0].trim();
  
  // 晶体形态(可能有多个 Habit 行)
  const habRe = /<b>Habit:\s*<\/b><\/td>\s*\n?\s*<td>([^<]+)/gi;
  let habMatch, habits = [];
  while ((habMatch = habRe.exec(html)) !== null) {
    const h = habMatch[1].trim().split(' - ')[0].trim();
    if (h) habits.push(h);
  }
  if (habits.length > 0) data.crystalHabit = habits.join(', ');
  
  // 荧光
  const flu = extractProp(html, 'Luminescence');
  if (flu) data.fluorescence = flu;
  
  // 磁性
  const mag = extractProp(html, 'Magnetism');
  if (mag) data.magnetism = mag;
  
  // 空间群 (从 Crystal System 部分解析)
  const sgMatch = html.match(/Space Group:\s*([A-Za-z0-9\s\/\-_]+)/i);
  if (sgMatch) data.spaceGroup = sgMatch[1].trim();
  
  // 晶系 
  const csMatch = html.match(/Crystal System:<\/a><\/b><\/td>\s*\n?\s*<td>[^<]*<a[^>]*>\s*<b>([^<]+)<\/b>/i);
  if (csMatch) data.crystalSystem = csMatch[1].trim();
  
  // Strunz 编号
  const strunzMatch = html.match(/(\d{2}\.[A-Z]{2}\.\d{2})/);
  if (strunzMatch) data.strunzCode = strunzMatch[1];
  
  // 放射性
  if (html.includes('Not Radioactive')) data.radioactivity = 'Not Radioactive';
  else {
    const radMatch = html.match(/GRapi\s*=\s*([\d.]+)/i);
    if (radMatch && parseFloat(radMatch[1]) > 0) data.radioactivity = 'Radioactive';
  }
  
  // 环境/产出
  const envMatch = html.match(/<b>Environment:<\/b><\/td>\s*\n?\s*<td>([^<]+)/i);
  if (envMatch) data.environment = envMatch[1].trim();
  
  // 韧性 (Tenacity 在某些页面上有)
  const tenMatch = html.match(/<b>Tenacity:<\/b><\/td>\s*\n?\s*<td>([^<]+)/i);
  if (tenMatch) data.tenacity = tenMatch[1].trim();
  
  return data;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 并发控制
async function fetchBatch(names, concurrency) {
  let idx = 0;
  let success = 0, notFound = 0, fail = 0;
  const startTime = Date.now();
  
  async function worker() {
    while (idx < names.length) {
      const i = idx++;
      const name = names[i];
      const urlName = name.replace(/\s+/g, '').replace(/[()'"]/g, '');
      const url = 'http://webmin.mindat.org/data/' + encodeURIComponent(urlName) + '.shtml';
      
      try {
        const res = await httpGet(url);
        if (res.status === 200 && res.body.length > 1000) {
          const data = parseHTML(res.body);
          if (Object.keys(data).length >= 3) {
            fetched[name] = data;
            success++;
          } else {
            fail++;
          }
        } else {
          notFound++;
        }
      } catch(e) {
        fail++;
      }
      
      if ((success + notFound + fail) % 200 === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fetched, null, 0));
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log('[' + (success + notFound + fail) + '/' + names.length + '] ok:' + success + ' miss:' + notFound + ' err:' + fail + ' t:' + elapsed + 's total:' + Object.keys(fetched).length);
      }
      
      await sleep(100); // 100ms 间隔
    }
  }
  
  // 启动多个并发 worker
  const workers = [];
  for (let w = 0; w < concurrency; w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fetched, null, 0));
  console.log('\n=== 完成 === ok:' + success + ' miss:' + notFound + ' err:' + fail + ' total:' + Object.keys(fetched).length);
}

const toFetch = allMinerals.filter(n => !fetched[n]);
console.log('需获取: ' + toFetch.length);

fetchBatch(toFetch, 5).catch(console.error); // 5个并发
