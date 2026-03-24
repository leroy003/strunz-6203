#!/usr/bin/env node
// ============================================================
// RRUFF CSV → Strunz 分类 矿物数据解析器
// 从 RRUFF_Export CSV 提取 IMA 认可矿物数据
// 并按化学成分推断 Strunz 大类归属
// ============================================================

const fs = require('fs');
const path = require('path');

// 读取 CSV
const csvPath = path.join(__dirname, 'rruff_ima.csv');
const raw = fs.readFileSync(csvPath, 'utf8');

// 简单 CSV 解析器（处理引号内的逗号和换行）
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n') { row.push(field.trim()); field = ''; if (row.length > 1) rows.push(row); row = []; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.length > 1) rows.push(row); }
  return rows;
}

const allRows = parseCSV(raw);
const header = allRows[0];
console.log('CSV 表头:', header);
console.log('总记录数:', allRows.length - 1);

// 字段索引
const IDX = {};
header.forEach((h, i) => { IDX[h] = i; });

// 过滤 IMA 认可矿物 (Approved 或 Grandfathered)
const imaRows = [];
for (let i = 1; i < allRows.length; i++) {
  const row = allRows[i];
  const status = (row[IDX['IMA Status']] || '').toLowerCase();
  if (status.includes('approved') || status.includes('grandfathered')) {
    imaRows.push(row);
  }
}
console.log('IMA 认可矿物数:', imaRows.length);

// ============================================================
// Strunz 大类推断规则（基于化学成分和化学式）
// ============================================================
// Class 1: 元素 - 纯元素或简单合金
// Class 2: 硫化物 - 含S, Se, Te与金属的化合物
// Class 3: 卤化物 - 含F, Cl, Br, I为主要阴离子
// Class 4: 氧化物 - 金属+O(不含复杂阴离子基团)
// Class 5: 碳酸盐/硝酸盐 - 含CO3或NO3
// Class 6: 硼酸盐 - 含B和O
// Class 7: 硫酸盐等 - 含SO4, CrO4, MoO4, WO4
// Class 8: 磷酸盐等 - 含PO4, AsO4, VO4
// Class 9: 硅酸盐 - 含Si和O
// Class 10: 有机 - 含C-H有机键

function classifyMineral(name, formula, elements) {
  const elems = (elements || '').split(' ').map(e => e.trim()).filter(Boolean);
  const f = (formula || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // Class 10: 有机矿物（含C和H，但不含硅酸盐/碳酸盐特征）
  if (elems.includes('C') && elems.includes('H') && !elems.includes('Si') &&
      !f.includes('co3') && !f.includes('(co3)') &&
      elems.length <= 5 && !elems.includes('S')) {
    return '10';
  }

  // Class 9: 硅酸盐（含Si和O，且Si不只是微量）
  if (elems.includes('Si') && elems.includes('O') && !f.includes('sio2') !== true) {
    // 排除纯 SiO2（应归入氧化物）和 SiC（碳化物）
    if (f === 'sio2' || name === 'Quartz' || name === 'Cristobalite' || name === 'Tridymite' || name === 'Coesite' || name === 'Stishovite') {
      return '04'; // SiO2 多形体归入氧化物
    }
    if (elems.includes('Si') && elems.includes('O') && elems.length >= 3) {
      return '09';
    }
  }

  // Class 8: 磷酸盐、砷酸盐、钒酸盐
  if ((f.includes('po4') || f.includes('(po4)') || f.includes('aso4') || f.includes('(aso4)') ||
       f.includes('vo4') || f.includes('(vo4)') ||
       f.includes('p5+') || f.includes('as5+') || f.includes('v5+')) &&
      elems.includes('O')) {
    return '08';
  }
  // 额外：含P和O的很可能是磷酸盐
  if (elems.includes('P') && elems.includes('O') && !elems.includes('S') && !elems.includes('Si')) {
    return '08';
  }

  // Class 7: 硫酸盐、铬酸盐、钼酸盐、钨酸盐
  if ((f.includes('so4') || f.includes('(so4)') || f.includes('s6+') ||
       f.includes('cro4') || f.includes('(cro4)') ||
       f.includes('moo4') || f.includes('(moo4)') ||
       f.includes('wo4') || f.includes('(wo4)')) &&
      elems.includes('O')) {
    return '07';
  }

  // Class 6: 硼酸盐
  if (elems.includes('B') && elems.includes('O') && !elems.includes('Si')) {
    return '06';
  }

  // Class 5: 碳酸盐和硝酸盐
  if ((f.includes('co3') || f.includes('(co3)') || f.includes('c4+') ||
       f.includes('no3') || f.includes('(no3)')) &&
      elems.includes('O')) {
    return '05';
  }

  // Class 3: 卤化物
  if ((elems.includes('F') || elems.includes('Cl') || elems.includes('Br') || elems.includes('I')) &&
      !elems.includes('O') && !elems.includes('S')) {
    return '03';
  }
  // 含卤素但也含O的可能是氧卤化物（Class 3.D）
  if ((elems.includes('F') || elems.includes('Cl') || elems.includes('Br') || elems.includes('I')) &&
      elems.includes('O') && !elems.includes('S') && !elems.includes('Si') && !elems.includes('P') &&
      !elems.includes('C') && !elems.includes('B') && !f.includes('so4')) {
    return '03';
  }

  // Class 2: 硫化物和硫盐
  if ((elems.includes('S') || elems.includes('Se') || elems.includes('Te')) &&
      !elems.includes('O')) {
    return '02';
  }
  // 含S但不含氧酸根的也可能是硫化物
  if (elems.includes('S') && !f.includes('so4') && !f.includes('(so4)') &&
      !elems.includes('O') || (elems.includes('S') && !elems.includes('O') && !elems.includes('Si'))) {
    return '02';
  }

  // Class 4: 氧化物和氢氧化物
  if (elems.includes('O') && !elems.includes('Si') && !elems.includes('P') &&
      !elems.includes('C') && !elems.includes('B') && !elems.includes('S') &&
      !elems.includes('N')) {
    return '04';
  }
  // 含O和OH的
  if (elems.includes('O') && elems.includes('H') && elems.length <= 4 &&
      !elems.includes('Si') && !elems.includes('C')) {
    return '04';
  }

  // Class 1: 元素矿物（1-2种元素，纯金属/非金属）
  if (elems.length <= 2 && !elems.includes('O') && !elems.includes('S') &&
      !elems.includes('F') && !elems.includes('Cl')) {
    return '01';
  }

  // 默认：根据元素猜测
  if (elems.includes('Si')) return '09';
  if (elems.includes('S') && elems.includes('O')) return '07';
  if (elems.includes('S')) return '02';
  if (elems.includes('O')) return '04';

  return '04'; // fallback
}

// ============================================================
// 晶系映射（英文→中文）
// ============================================================
const crystalSystemMap = {
  'isometric': '等轴晶系', 'cubic': '等轴晶系',
  'tetragonal': '四方晶系',
  'orthorhombic': '正交晶系',
  'hexagonal': '六方晶系',
  'trigonal': '三方晶系',
  'monoclinic': '单斜晶系',
  'triclinic': '三斜晶系',
  'amorphous': '非晶质',
  '': '未知'
};

// ============================================================
// 化学式美化（加下标符号）
// ============================================================
function beautifyFormula(f) {
  if (!f) return '';
  // 将数字下标替换为 Unicode 下标
  const subMap = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
  // 简单规则：元素符号后紧跟的数字变下标
  let result = f;
  // 替换 _n_ 格式的下标（RRUFF格式）
  result = result.replace(/_(\d+)_/g, (m, d) => d.split('').map(c => subMap[c] || c).join(''));
  // 替换 <sub>n</sub> 格式
  result = result.replace(/<sub>(\d+)<\/sub>/gi, (m, d) => d.split('').map(c => subMap[c] || c).join(''));
  return result;
}

// ============================================================
// 处理所有 IMA 矿物
// ============================================================
const classified = {};
for (let c = 1; c <= 10; c++) {
  classified[String(c).padStart(2, '0')] = [];
}

let classifiedCount = 0;
for (const row of imaRows) {
  const name = row[IDX['Mineral Name']] || '';
  const rruffFormula = row[IDX['RRUFF Chemistry (plain)']] || '';
  const imaFormula = row[IDX['IMA Chemistry (plain)']] || '';
  const elements = row[IDX['Chemistry Elements']] || '';
  const imaNumber = row[IDX['IMA Number']] || '';
  const country = row[IDX['Country of Type Locality']] || '';
  const year = row[IDX['Year First Published']] || '';
  const crystalSys = row[IDX['Crystal Systems']] || '';
  const status = row[IDX['IMA Status']] || '';

  const cls = classifyMineral(name, imaFormula || rruffFormula, elements);
  const formula = beautifyFormula(imaFormula || rruffFormula);
  const crystal = crystalSystemMap[crystalSys.toLowerCase()] || crystalSys || '未知';

  classified[cls].push({
    en: name,
    formula: formula,
    imaNumber: imaNumber,
    crystal: crystal,
    locality: country,
    discoveryYear: year ? year + '年' : '未知',
    elements: elements
  });
  classifiedCount++;
}

// 统计
console.log('\n=== Strunz 分类统计 ===');
let total = 0;
for (let c = 1; c <= 10; c++) {
  const code = String(c).padStart(2, '0');
  console.log('Class ' + code + ': ' + classified[code].length + ' 种');
  total += classified[code].length;
}
console.log('总计: ' + total + ' 种 IMA 矿物已分类');

// 保存为 JSON 供 generate_all.js 使用
const outputPath = path.join(__dirname, 'rruff_classified.json');
fs.writeFileSync(outputPath, JSON.stringify(classified, null, 2));
console.log('\n已保存到: ' + outputPath);

// 额外：打印每类的前5个矿物名作为检查
console.log('\n=== 每类前5个矿物 ===');
for (let c = 1; c <= 10; c++) {
  const code = String(c).padStart(2, '0');
  const samples = classified[code].slice(0, 5).map(m => m.en);
  console.log('Class ' + code + ': ' + samples.join(', '));
}
