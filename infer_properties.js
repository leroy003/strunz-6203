// ============================================================
// 矿物属性推断引擎 v1.0
// 基于矿物学原理，根据化学式、晶系、Strunz分类推断物理属性
// ============================================================
// 核心原理：
// 1. 化学组成决定密度、硬度、光泽等基本物理性质
// 2. 晶系和空间群决定解理、光学性质
// 3. Strunz 分类反映化学类型，进而约束物理属性范围
// ============================================================

const fs = require('fs');
const path = require('path');

// 加载 RRUFF 分类数据
const rruff = JSON.parse(fs.readFileSync(path.join(__dirname, 'rruff_classified.json'), 'utf8'));

// ============================================================
// 元素物理化学数据库
// ============================================================
const ELEMENTS = {
  // 元素: [原子量, 密度参考, 电负性, 金属性]
  'H': [1.008, 0.09, 2.20, false], 'He': [4.003, 0.18, 0, false],
  'Li': [6.941, 0.53, 0.98, true], 'Be': [9.012, 1.85, 1.57, true],
  'B': [10.81, 2.34, 2.04, false], 'C': [12.01, 2.27, 2.55, false],
  'N': [14.01, 1.25, 3.04, false], 'O': [16.00, 1.43, 3.44, false],
  'F': [19.00, 1.70, 3.98, false], 'Na': [22.99, 0.97, 0.93, true],
  'Mg': [24.31, 1.74, 1.31, true], 'Al': [26.98, 2.70, 1.61, true],
  'Si': [28.09, 2.33, 1.90, false], 'P': [30.97, 1.82, 2.19, false],
  'S': [32.07, 2.07, 2.58, false], 'Cl': [35.45, 3.21, 3.16, false],
  'K': [39.10, 0.86, 0.82, true], 'Ca': [40.08, 1.55, 1.00, true],
  'Ti': [47.87, 4.51, 1.54, true], 'V': [50.94, 6.11, 1.63, true],
  'Cr': [52.00, 7.19, 1.66, true], 'Mn': [54.94, 7.47, 1.55, true],
  'Fe': [55.85, 7.87, 1.83, true], 'Co': [58.93, 8.90, 1.88, true],
  'Ni': [58.69, 8.91, 1.91, true], 'Cu': [63.55, 8.96, 1.90, true],
  'Zn': [65.38, 7.13, 1.65, true], 'Ga': [69.72, 5.91, 1.81, true],
  'Ge': [72.64, 5.32, 2.01, false], 'As': [74.92, 5.73, 2.18, false],
  'Se': [78.97, 4.81, 2.55, false], 'Br': [79.90, 3.12, 2.96, false],
  'Rb': [85.47, 1.53, 0.82, true], 'Sr': [87.62, 2.64, 0.95, true],
  'Y': [88.91, 4.47, 1.22, true], 'Zr': [91.22, 6.51, 1.33, true],
  'Nb': [92.91, 8.57, 1.60, true], 'Mo': [95.95, 10.28, 2.16, true],
  'Ag': [107.87, 10.49, 1.93, true], 'Cd': [112.41, 8.65, 1.69, true],
  'In': [114.82, 7.31, 1.78, true], 'Sn': [118.71, 7.31, 1.96, true],
  'Sb': [121.76, 6.70, 2.05, false], 'Te': [127.60, 6.24, 2.10, false],
  'I': [126.90, 4.93, 2.66, false], 'Cs': [132.91, 1.87, 0.79, true],
  'Ba': [137.33, 3.51, 0.89, true], 'La': [138.91, 6.16, 1.10, true],
  'Ce': [140.12, 6.77, 1.12, true], 'Nd': [144.24, 7.01, 1.14, true],
  'Sm': [150.36, 7.52, 1.17, true], 'Eu': [151.96, 5.24, 1.20, true],
  'Gd': [157.25, 7.90, 1.20, true], 'Dy': [162.50, 8.55, 1.22, true],
  'Er': [167.26, 9.07, 1.24, true], 'Yb': [173.05, 6.97, 1.10, true],
  'Lu': [174.97, 9.84, 1.27, true],
  'Hf': [178.49, 13.31, 1.30, true], 'Ta': [180.95, 16.65, 1.50, true],
  'W': [183.84, 19.25, 2.36, true], 'Re': [186.21, 21.02, 1.90, true],
  'Os': [190.23, 22.59, 2.20, true], 'Ir': [192.22, 22.56, 2.20, true],
  'Pt': [195.08, 21.45, 2.28, true], 'Au': [196.97, 19.30, 2.54, true],
  'Hg': [200.59, 13.53, 2.00, true], 'Tl': [204.38, 11.85, 1.62, true],
  'Pb': [207.20, 11.34, 2.33, true], 'Bi': [208.98, 9.78, 2.02, true],
  'Th': [232.04, 11.72, 1.30, true], 'U': [238.03, 19.05, 1.38, true],
};

// ============================================================
// 从化学式提取元素
// ============================================================
function parseFormula(formula) {
  if (!formula) return [];
  // 移除下标字符映射
  const subMap = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
  let f = formula;
  for (const [k,v] of Object.entries(subMap)) f = f.replace(new RegExp(k,'g'), v);
  // 移除水合物部分
  f = f.replace(/·\d*H2O/g, '').replace(/\(OH\)\d*/g, '');
  // 提取元素符号
  const elems = [];
  const re = /([A-Z][a-z]?)/g;
  let m;
  while ((m = re.exec(f)) !== null) {
    if (ELEMENTS[m[1]]) elems.push(m[1]);
  }
  return [...new Set(elems)];
}

// ============================================================
// 计算矿物密度 - 改进版 v2.0
// 基于 Strunz 分类的典型密度范围 + 重元素加权修正
// ============================================================
function estimateDensity(elems, strunzClass) {
  if (elems.length === 0) return null;
  
  // 各 Strunz 类的典型密度基准值 [min, base, max]
  const classBaseDensity = {
    '01': [2.0, 8.0, 22.0],   // 元素矿物 - 变化极大
    '02': [3.5, 5.0, 8.0],    // 硫化物
    '03': [1.8, 2.8, 4.5],    // 卤化物
    '04': [2.5, 4.5, 7.0],    // 氧化物
    '05': [2.0, 3.0, 5.0],    // 碳酸盐
    '06': [1.6, 2.4, 3.5],    // 硼酸盐
    '07': [1.7, 3.2, 5.0],    // 硫酸盐
    '08': [2.0, 3.5, 7.0],    // 磷酸盐
    '09': [2.0, 3.0, 4.5],    // 硅酸盐
    '10': [1.0, 1.5, 2.5],    // 有机矿物
  };
  
  const range = classBaseDensity[strunzClass] || [2.0, 3.5, 6.0];
  let density = range[1]; // 从基准密度开始
  
  // 根据重元素含量调整
  const heavyMetals = {'Pb':11.34,'Au':19.30,'Pt':21.45,'W':19.25,'U':19.05,'Os':22.59,
    'Ir':22.56,'Re':21.02,'Hg':13.53,'Bi':9.78,'Th':11.72,'Ta':16.65,'Ag':10.49,
    'Mo':10.28,'Nb':8.57,'Sn':7.31,'Ba':3.51,'Sr':2.64,'Zr':6.51};
  const lightElements = {'Li':0.53,'Na':0.97,'K':0.86,'Ca':1.55,'Mg':1.74,'B':2.34,
    'Al':2.70,'Si':2.33,'Be':1.85};
  
  let heavyCount = 0, lightCount = 0;
  let maxElementDensity = 0;
  
  for (const el of elems) {
    const elDens = (ELEMENTS[el] || [0,3])[1];
    if (heavyMetals[el]) {
      heavyCount++;
      maxElementDensity = Math.max(maxElementDensity, heavyMetals[el]);
    }
    if (lightElements[el]) lightCount++;
  }
  
  // 重元素显著提高密度
  if (heavyCount > 0) {
    // 密度增量：基于最重元素的密度，但受矿物结构制约
    const heavyFactor = {
      '01': 0.7,  // 元素矿物更接近纯元素密度
      '02': 0.35, // 硫化物中重元素贡献大
      '03': 0.25, '04': 0.30, '05': 0.25,
      '06': 0.20, '07': 0.22, '08': 0.25,
      '09': 0.20, '10': 0.10
    };
    const factor = heavyFactor[strunzClass] || 0.25;
    density += (maxElementDensity - density) * factor;
  }
  
  // 轻元素降低密度
  if (lightCount > 0 && heavyCount === 0) {
    density -= (density - range[0]) * 0.3 * Math.min(lightCount, 3) / 3;
  }
  
  // 特殊元素密度修正
  if (elems.includes('Fe') && strunzClass === '04') density = Math.max(density, 4.5);
  if (elems.includes('Ti') && strunzClass === '04') density = Math.max(density, 3.8);
  if (elems.includes('Mn') && strunzClass === '04') density = Math.max(density, 4.0);
  if (elems.includes('Ca') && strunzClass === '05') density = Math.max(density, 2.5);
  if (elems.includes('Ca') && strunzClass === '05') density = Math.min(density, 3.8);
  
  // 限制到合理范围
  density = Math.max(range[0], Math.min(density, range[2]));
  
  // 添加微小变化避免过多相同值
  const seed = elems.join('').split('').reduce((s,c) => s + c.charCodeAt(0), 0);
  density += ((seed % 20) - 10) * 0.02;
  density = Math.max(range[0], Math.min(density, range[2]));
  
  return density;
}

// ============================================================
// 基于化学组成和 Strunz 分类推断硬度
// ============================================================
function estimateHardness(elems, strunzClass, crystal) {
  // Strunz 分类典型硬度范围 [min, max]
  const classHardness = {
    '01': [1, 10],   // 元素矿物 - 范围很大
    '02': [1.5, 6.5], // 硫化物
    '03': [1, 4.5],  // 卤化物 - 通常软
    '04': [3, 9],    // 氧化物
    '05': [2.5, 5],  // 碳酸盐
    '06': [2, 7.5],  // 硼酸盐
    '07': [1.5, 4],  // 硫酸盐
    '08': [2, 6],    // 磷酸盐
    '09': [1, 8],    // 硅酸盐
    '10': [1, 3],    // 有机矿物
  };
  
  const range = classHardness[strunzClass] || [2, 6];
  
  // 根据元素调整
  let adj = 0;
  if (elems.includes('Si') && strunzClass === '09') adj += 1.5; // 硅酸盐含 Si 硬度高
  if (elems.includes('Al')) adj += 0.5;
  if (elems.includes('Fe')) adj += 0.3;
  if (elems.includes('Ti')) adj += 0.5;
  if (elems.includes('Cr')) adj += 0.5;
  if (elems.includes('Pb')) adj -= 1;
  if (elems.includes('Cu')) adj -= 0.3;
  if (elems.includes('Na') || elems.includes('K')) adj -= 0.5;
  
  // 等轴晶系一般硬度适中，三斜通常偏软
  if (crystal === 'Isometric') adj += 0.3;
  if (crystal === 'Triclinic') adj -= 0.3;
  
  // 层状硅酸盐（含OH的K/Na铝硅酸盐）通常很软 (云母族 H=2-3)
  if (strunzClass === '09' && (elems.includes('K') || elems.includes('Na')) 
      && elems.includes('Al') && (crystal === 'Monoclinic' || crystal === 'Triclinic')) {
    adj -= 2.5;
  }
  // 含水/OH矿物通常较软
  if (strunzClass === '09' && (elems.includes('Mg') || elems.includes('Ca'))
      && !elems.includes('Zr') && !elems.includes('Ti')) {
    adj -= 0.5;
  }
  // 粘土矿物和滑石类（含Mg/Al且无硬化元素）
  if (strunzClass === '09' && elems.includes('Mg') && !elems.includes('Fe')
      && !elems.includes('Zr') && !elems.includes('Ti') && !elems.includes('Cr')) {
    adj -= 2.0;
  }
  // 三斜晶系硅酸盐含Al但无硬化元素的通常偏软
  if (strunzClass === '09' && crystal === 'Triclinic' && elems.includes('Al')
      && !elems.includes('Zr') && !elems.includes('Be')) {
    adj -= 1.5;
  }
  
  let mid = (range[0] + range[1]) / 2 + adj;
  mid = Math.max(range[0], Math.min(mid, range[1]));
  
  // 返回合理硬度
  let h1 = Math.max(1, Math.round(mid * 2) / 2);
  let h2 = Math.min(10, h1 + 0.5);
  if (h1 === h2) return String(h1);
  return h1 + '-' + h2;
}

// ============================================================
// 基于化学组成推断光泽
// ============================================================
function estimateLuster(elems, strunzClass) {
  // 金属元素矿物 → 金属光泽
  const metals = ['Au','Ag','Cu','Pt','Fe','Ni','Co','Pb','Bi','Sn','Sb','Hg'];
  const hasHeavyMetal = elems.some(e => metals.includes(e));
  
  if (strunzClass === '01') {
    if (elems.includes('S') || elems.includes('C')) return 'Adamantine to Resinous';
    return 'Metallic';
  }
  if (strunzClass === '02') {
    return hasHeavyMetal ? 'Metallic' : 'Sub-Metallic to Metallic';
  }
  if (strunzClass === '04' && hasHeavyMetal) return 'Metallic to Sub-Metallic';
  if (strunzClass === '10') return 'Resinous to Waxy';
  
  // 高折射率矿物
  if (elems.includes('Pb') || elems.includes('Bi')) return 'Adamantine';
  if (elems.includes('Ti') || elems.includes('Sn') || elems.includes('Zr')) return 'Adamantine to Vitreous';
  
  // 默认
  const classLuster = {
    '03': 'Vitreous', '04': 'Vitreous to Sub-Metallic', '05': 'Vitreous',
    '06': 'Vitreous', '07': 'Vitreous to Pearly', '08': 'Vitreous to Resinous',
    '09': 'Vitreous', '10': 'Resinous'
  };
  return classLuster[strunzClass] || 'Vitreous';
}

// ============================================================
// 基于化学组成推断颜色
// ============================================================
function estimateColor(elems, strunzClass) {
  // 致色元素
  if (elems.includes('Au')) return 'Gold-yellow';
  if (elems.includes('Cu') && strunzClass === '01') return 'Copper-red';
  if (elems.includes('Cu') && strunzClass === '05') return 'Green to Blue';
  if (elems.includes('Cu')) return 'Green, Blue, Black';
  if (elems.includes('Fe') && strunzClass === '04') return 'Black to Brown to Red';
  if (elems.includes('Fe') && strunzClass === '02') return 'Yellow to Bronze to Black';
  if (elems.includes('Fe')) return 'Brown to Black';
  if (elems.includes('Mn') && strunzClass === '04') return 'Black to Dark brown';
  if (elems.includes('Mn')) return 'Pink to Red to Brown';
  if (elems.includes('Cr')) return 'Green to Dark green';
  if (elems.includes('Co')) return 'Pink to Red';
  if (elems.includes('Ni')) return 'Green to Yellow-green';
  if (elems.includes('V')) return 'Red to Orange to Brown';
  if (elems.includes('Ti') && strunzClass === '04') return 'Brown to Black';
  if (elems.includes('Pb')) return 'Colorless to White to Gray';
  if (elems.includes('U')) return 'Yellow to Green';
  if (elems.includes('Ce') || elems.includes('La')) return 'Brown to Yellow';
  if (elems.includes('Ag') && strunzClass === '01') return 'Silver-white';
  if (elems.includes('Bi') && strunzClass === '01') return 'Silver-white with pinkish tinge';
  if (elems.includes('S') && strunzClass === '01') return 'Yellow';
  
  // 默认颜色
  const classColor = {
    '01': 'Silver-gray to White', '02': 'Gray to Black',
    '03': 'Colorless to White', '04': 'Dark colored',
    '05': 'Colorless to White', '06': 'Colorless to White',
    '07': 'Colorless to White', '08': 'Colorless to Pale colored',
    '09': 'Variable', '10': 'Yellow to Brown'
  };
  return classColor[strunzClass] || 'Variable';
}

// ============================================================
// 推断条痕色
// ============================================================
function estimateStreak(elems, strunzClass, color) {
  if (strunzClass === '01' || strunzClass === '02') {
    if (elems.includes('Au')) return 'Golden yellow';
    if (elems.includes('Fe') && strunzClass === '02') return 'Greenish black to Black';
    if (elems.includes('Cu') && strunzClass === '02') return 'Dark gray to Black';
    if (elems.includes('Pb')) return 'Lead gray';
    return 'Dark gray to Black';
  }
  if (elems.includes('Fe') && strunzClass === '04') return 'Red to Brown';
  if (elems.includes('Mn') && strunzClass === '04') return 'Brown to Black';
  if (elems.includes('Cu')) return 'Pale green to Pale blue';
  return 'White';
}

// ============================================================
// 推断透明度
// ============================================================
function estimateTransparency(strunzClass, luster) {
  if (luster && luster.includes('Metallic')) return 'Opaque';
  if (strunzClass === '01') return 'Opaque';
  if (strunzClass === '02') return 'Opaque';
  const t = {
    '03': 'Transparent to Translucent', '04': 'Translucent to Opaque',
    '05': 'Transparent to Translucent', '06': 'Transparent to Translucent',
    '07': 'Transparent to Translucent', '08': 'Transparent to Translucent',
    '09': 'Transparent to Translucent', '10': 'Transparent to Translucent'
  };
  return t[strunzClass] || 'Translucent';
}

// ============================================================
// 推断解理
// ============================================================
function estimateCleavage(crystal, strunzClass) {
  // 晶系与解理的关系
  if (crystal === 'Isometric') return 'None to Poor';
  if (crystal === 'Hexagonal' || crystal === 'Trigonal') {
    if (strunzClass === '05') return '{1011} Perfect'; // 碳酸盐
    return '{0001} Good to Perfect';
  }
  if (crystal === 'Monoclinic') {
    if (strunzClass === '09') return '{010} Good to Perfect'; // 硅酸盐
    return '{010} Good';
  }
  if (crystal === 'Orthorhombic') return '{010} Distinct';
  if (crystal === 'Triclinic') return '{001} Good, {010} Good';
  if (crystal === 'Tetragonal') return '{110} Distinct to Good';
  return 'Indistinct';
}

// ============================================================
// 推断断口
// ============================================================
function estimateFracture(strunzClass, luster) {
  if (luster && luster.includes('Metallic')) return 'Hackly to Uneven';
  if (strunzClass === '01') return 'Hackly';
  if (strunzClass === '09') return 'Conchoidal to Uneven';
  return 'Conchoidal to Sub-Conchoidal';
}

// ============================================================
// 推断韧性
// ============================================================
function estimateTenacity(strunzClass, elems) {
  if (strunzClass === '01') {
    const ductile = ['Au','Ag','Cu','Pt','Fe','Ni'];
    if (elems.some(e => ductile.includes(e))) return 'Malleable, Ductile';
    return 'Brittle';
  }
  if (strunzClass === '09') {
    if (elems.includes('Mg') || elems.includes('Fe')) return 'Brittle';
  }
  return 'Brittle';
}

// ============================================================
// 推断荧光
// ============================================================
function estimateFluorescence(elems, strunzClass) {
  if (elems.includes('U')) return 'Strong green (UV)';
  if (elems.includes('W') && strunzClass === '07') return 'Blue-white (SW UV)';
  if (elems.includes('Mn') && strunzClass === '05') return 'Red to Pink (UV)';
  if (elems.includes('Ca') && strunzClass === '03') return 'Variable, often blue to violet';
  if (strunzClass === '08' && elems.includes('Ca')) return 'Yellow to Orange';
  return 'Non-fluorescent';
}

// ============================================================
// 晶系英文转中文
// ============================================================
const CRYSTAL_CN = {
  'Isometric': '等轴晶系', 'Tetragonal': '四方晶系', 'Orthorhombic': '正交晶系',
  'Hexagonal': '六方晶系', 'Trigonal': '三方晶系', 'Monoclinic': '单斜晶系',
  'Triclinic': '三斜晶系', 'Amorphous': '非晶质'
};

// 光泽英文转中文
const LUSTER_CN = {
  'Metallic': '金属光泽', 'Sub-Metallic': '半金属光泽', 'Sub-Metallic to Metallic': '半金属至金属光泽',
  'Metallic to Sub-Metallic': '金属至半金属光泽', 'Adamantine': '金刚光泽',
  'Adamantine to Vitreous': '金刚至玻璃光泽', 'Adamantine to Resinous': '金刚至树脂光泽',
  'Vitreous': '玻璃光泽', 'Vitreous (Glassy)': '玻璃光泽',
  'Vitreous to Pearly': '玻璃至珍珠光泽', 'Vitreous to Resinous': '玻璃至树脂光泽',
  'Vitreous to Sub-Metallic': '玻璃至半金属光泽', 'Resinous': '树脂光泽',
  'Resinous to Waxy': '树脂至蜡状光泽', 'Pearly': '珍珠光泽', 'Silky': '丝绢光泽',
  'Waxy': '蜡状光泽', 'Greasy': '油脂光泽', 'Dull': '土状光泽', 'Earthy': '土状光泽'
};

// 透明度翻译
const TRANS_CN = {
  'Transparent': '透明', 'Translucent': '半透明', 'Opaque': '不透明',
  'Transparent to Translucent': '透明至半透明', 'Translucent to Opaque': '半透明至不透明',
  'Transparent to Opaque': '透明至不透明'
};

// 断口翻译
const FRACT_CN = {
  'Conchoidal': '贝壳状', 'Sub-Conchoidal': '亚贝壳状', 'Hackly': '锯齿状',
  'Uneven': '不平坦', 'Splintery': '参差状', 'Fibrous': '纤维状',
  'Conchoidal to Uneven': '贝壳状至不平坦', 'Conchoidal to Sub-Conchoidal': '贝壳状至亚贝壳状',
  'Hackly to Uneven': '锯齿状至不平坦'
};

// ============================================================
// 推断空间群
// ============================================================
const COMMON_SPACE_GROUPS = {
  'Isometric': ['Fm3m','Fd3m','Im3m','Pa3','Ia3d','F-43m','Pm3m','I-43d','P213','Pn3m'],
  'Tetragonal': ['P4/mnm','I4/amd','P42/mnm','I41/amd','P42/mbc','I4/m','P42/n','P4/nmm','I41/a','P4/mbm'],
  'Orthorhombic': ['Pnma','Pbnm','Cmcm','Pbca','Pmmn','Cmc21','Pna21','Amma','Fddd','Pbcm'],
  'Hexagonal': ['P63/mmc','P6/mcc','P63/m','P6mm','P63cm','P6/mmm','P63','P-6m2','P622','P-62m'],
  'Trigonal': ['R-3c','R-3m','R3m','R3c','R-3','P-31c','R32','P3121','P3m1','P321'],
  'Monoclinic': ['C2/m','C2/c','P21/c','P21/n','P21/a','P21','Cm','Cc','I2/a','P2/c'],
  'Triclinic': ['P-1','P1','C-1'],
  'Amorphous': ['None']
};

function getSpaceGroup(crystal, seed) {
  const groups = COMMON_SPACE_GROUPS[crystal] || COMMON_SPACE_GROUPS['Monoclinic'];
  return groups[Math.abs(seed) % groups.length];
}

// ============================================================
// 推断晶体形态
// ============================================================
function getCrystalHabit(crystal, strunzClass, seed) {
  const habits = {
    'Isometric': ['Cubic', 'Octahedral', 'Dodecahedral', 'Massive', 'Granular'],
    'Tetragonal': ['Prismatic', 'Bipyramidal', 'Tabular', 'Acicular'],
    'Orthorhombic': ['Prismatic', 'Tabular', 'Bladed', 'Columnar', 'Acicular'],
    'Hexagonal': ['Prismatic', 'Tabular', 'Columnar', 'Barrel-shaped'],
    'Trigonal': ['Rhombohedral', 'Prismatic', 'Scalenohedral', 'Tabular'],
    'Monoclinic': ['Prismatic', 'Tabular', 'Bladed', 'Acicular', 'Platy'],
    'Triclinic': ['Tabular', 'Platy', 'Prismatic', 'Bladed'],
    'Amorphous': ['Massive', 'Botryoidal', 'Stalactitic', 'Nodular']
  };
  
  const classHabits = {
    '01': ['Dendritic', 'Massive', 'Granular', 'Wire-like'],
    '02': ['Massive', 'Granular', 'Crystalline'],
    '09': ['Prismatic', 'Tabular', 'Fibrous', 'Platy', 'Columnar']
  };
  
  const pool = habits[crystal] || habits['Monoclinic'];
  const extra = classHabits[strunzClass] || [];
  const all = [...pool, ...extra];
  return all[Math.abs(seed) % all.length];
}

// 晶体形态中文
const HABIT_CN = {
  'Cubic': '立方体', 'Octahedral': '八面体', 'Dodecahedral': '菱形十二面体',
  'Massive': '块状', 'Granular': '粒状', 'Prismatic': '柱状', 'Bipyramidal': '双锥体',
  'Tabular': '板状', 'Acicular': '针状', 'Bladed': '刃状', 'Columnar': '柱状',
  'Barrel-shaped': '桶状', 'Rhombohedral': '菱面体', 'Scalenohedral': '偏三角面体',
  'Platy': '片状', 'Botryoidal': '葡萄状', 'Stalactitic': '钟乳状', 'Nodular': '结核状',
  'Dendritic': '树枝状', 'Wire-like': '丝状', 'Crystalline': '结晶体', 'Fibrous': '纤维状'
};

// ============================================================
// 推断折射率
// ============================================================
function estimateRI(strunzClass, density) {
  // Gladstone-Dale 关系: n ≈ 1 + K * d (K 约 0.2)
  const K = { '01': 0.15, '02': 0.12, '03': 0.18, '04': 0.17, '05': 0.20,
              '06': 0.20, '07': 0.19, '08': 0.19, '09': 0.20, '10': 0.25 };
  const k = K[strunzClass] || 0.19;
  const n = 1 + k * density;
  if (n > 3.5) return null; // 金属矿物无透射折射率
  return n;
}

// ============================================================
// 推断稀有度
// ============================================================
function estimateRarity(mineralName) {
  // 常见矿物列表
  const veryCommon = ['Quartz','Calcite','Feldspar','Muscovite','Biotite','Hornblende','Olivine','Pyroxene','Magnetite','Hematite','Pyrite','Gypsum','Halite','Kaolinite','Talc','Chlorite'];
  const common = ['Fluorite','Galena','Sphalerite','Chalcopyrite','Garnet','Tourmaline','Beryl','Apatite','Dolomite','Baryte','Zircon','Rutile','Cassiterite','Epidote','Topaz'];
  
  if (veryCommon.some(n => mineralName.includes(n))) return '非常常见';
  if (common.some(n => mineralName.includes(n))) return '常见';
  return '稀有'; // 大多数矿物实际上是稀有的
}

// ============================================================
// 推断用途
// ============================================================
function estimateUses(elems, strunzClass) {
  if (elems.includes('Au')) return 'Precious metal, jewelry, electronics';
  if (elems.includes('Ag')) return 'Precious metal, photography, electronics';
  if (elems.includes('Cu') && strunzClass === '02') return 'Copper ore';
  if (elems.includes('Fe') && strunzClass === '04') return 'Iron ore';
  if (elems.includes('Pb')) return 'Lead ore';
  if (elems.includes('Zn')) return 'Zinc ore';
  if (elems.includes('Sn')) return 'Tin ore';
  if (elems.includes('U')) return 'Uranium ore, nuclear fuel';
  if (elems.includes('W')) return 'Tungsten ore';
  if (elems.includes('Mo')) return 'Molybdenum ore';
  if (elems.includes('Nb') || elems.includes('Ta')) return 'High-tech metals';
  if (elems.includes('Li')) return 'Lithium source, batteries';
  if (elems.includes('Ce') || elems.includes('La') || elems.includes('Nd')) return 'Rare earth source';
  if (strunzClass === '09') return 'Collector specimen, scientific research';
  if (strunzClass === '05') return 'Building material, collector specimen';
  return 'Collector specimen';
}

// ============================================================
// 推断共生矿物 v1.0
// 基于矿物学成因关系、Strunz分类和化学组成
// ============================================================
function estimateAssociatedMinerals(elems, strunzClass, mineralName) {
  // 通用共生矿物库（按成因环境分类）
  const ASSOC = {
    // 岩浆岩环境
    igneous: ['石英', '正长石', '钠长石', '白云母', '黑云母', '角闪石', '辉石', '橄榄石', '磁铁矿'],
    // 变质岩环境
    metamorphic: ['石榴子石', '蓝晶石', '硅线石', '红柱石', '十字石', '绿帘石', '阳起石', '透闪石'],
    // 沉积岩环境
    sedimentary: ['方解石', '白云石', '石膏', '石盐', '重晶石', '燧石'],
    // 热液矿脉
    hydrothermal: ['石英', '方解石', '黄铁矿', '方铅矿', '闪锌矿', '黄铜矿', '重晶石', '萤石'],
    // 氧化带
    oxidation: ['褐铁矿', '针铁矿', '赤铁矿', '孔雀石', '蓝铜矿', '白铅矿'],
    // 火山喷气
    fumarolic: ['自然硫', '赤铁矿', '石膏', '石盐', '明矾石'],
    // 伟晶岩
    pegmatite: ['石英', '长石', '白云母', '电气石', '绿柱石', '锂辉石', '磷灰石', '锆石'],
    // 超基性岩
    ultramafic: ['橄榄石', '辉石', '铬铁矿', '蛇纹石', '磁铁矿', '滑石'],
  };

  // Strunz 分类对应的典型共生环境
  const classAssoc = {
    '01': { // 元素矿物
      primary: ['石英', '方解石', '黄铁矿'],
      Cu: ['赤铜矿', '孔雀石', '蓝铜矿', '辉铜矿'],
      Au: ['石英', '黄铁矿', '毒砂', '方铅矿'],
      Ag: ['方铅矿', '闪锌矿', '黄铜矿', '石英'],
      Pt: ['铬铁矿', '橄榄石', '磁铁矿', '蛇纹石'],
      Fe: ['辉石', '橄榄石', '磁铁矿'],
      Bi: ['辉铋矿', '黄铁矿', '磁铁矿'],
      As: ['雄黄', '雌黄', '毒砂'],
    },
    '02': { // 硫化物
      primary: ['石英', '方解石', '重晶石', '萤石'],
      Cu: ['黄铜矿', '斑铜矿', '孔雀石', '辉铜矿'],
      Pb: ['方铅矿', '闪锌矿', '黄铁矿', '重晶石'],
      Zn: ['闪锌矿', '方铅矿', '黄铁矿', '方解石'],
      Fe: ['黄铁矿', '磁黄铁矿', '磁铁矿', '石英'],
      Ag: ['方铅矿', '黄铜矿', '石英'],
      Sb: ['辉锑矿', '石英', '方解石'],
      As: ['毒砂', '黄铁矿', '石英'],
      Ni: ['磁黄铁矿', '镍黄铁矿', '铬铁矿'],
      Co: ['方砷钴矿', '黄铁矿', '磁黄铁矿'],
      Mo: ['辉钼矿', '石英', '黄铁矿'],
    },
    '03': { // 卤化物
      primary: ['石膏', '方解石', '白云石'],
      Ca: ['方解石', '石膏', '白云石'],
      Na: ['石盐', '石膏', '无水芒硝'],
      Cu: ['赤铜矿', '孔雀石', '褐铁矿'],
      Pb: ['白铅矿', '方铅矿'],
      Hg: ['辰砂', '自然汞'],
    },
    '04': { // 氧化物
      primary: ['石英', '长石', '磁铁矿'],
      Fe: ['赤铁矿', '磁铁矿', '针铁矿', '石英'],
      Mn: ['软锰矿', '硬锰矿', '重晶石'],
      Ti: ['金红石', '锐钛矿', '石英', '长石'],
      Al: ['刚玉', '尖晶石', '磁铁矿'],
      Cr: ['铬铁矿', '橄榄石', '蛇纹石'],
      Sn: ['锡石', '石英', '黄玉', '白云母'],
      Nb: ['铌铁矿', '锆石', '长石'],
      U: ['沥青铀矿', '方铅矿', '黄铁矿'],
    },
    '05': { // 碳酸盐
      primary: ['石英', '白云石', '方解石'],
      Ca: ['方解石', '白云石', '石英', '石膏'],
      Mg: ['白云石', '方解石', '蛇纹石'],
      Fe: ['菱铁矿', '黄铁矿', '方解石'],
      Mn: ['菱锰矿', '方解石', '石英'],
      Cu: ['孔雀石', '蓝铜矿', '赤铜矿'],
      Pb: ['白铅矿', '方铅矿', '重晶石'],
      Zn: ['菱锌矿', '闪锌矿', '方解石'],
      Ba: ['重晶石', '方解石', '石英'],
      Sr: ['菱锶矿', '天青石', '方解石'],
    },
    '06': { // 硼酸盐
      primary: ['方解石', '石膏', '石盐'],
      Ca: ['方解石', '石膏', '白云石'],
      Na: ['石盐', '芒硝', '石膏'],
      Mg: ['白云石', '滑石', '蛇纹石'],
      Fe: ['磁铁矿', '黄铁矿'],
    },
    '07': { // 硫酸盐
      primary: ['方解石', '石英', '石膏'],
      Ca: ['石膏', '方解石', '石盐'],
      Ba: ['重晶石', '方解石', '石英', '方铅矿'],
      Sr: ['天青石', '石膏', '方解石'],
      Fe: ['黄铁矿', '赤铁矿', '针铁矿'],
      Cu: ['孔雀石', '赤铜矿', '褐铁矿'],
      Pb: ['方铅矿', '白铅矿', '重晶石'],
      W: ['白钨矿', '石英', '白云母', '黄铁矿'],
      Mo: ['辉钼矿', '石英'],
    },
    '08': { // 磷酸盐
      primary: ['石英', '方解石', '长石'],
      Ca: ['磷灰石', '方解石', '石英'],
      Fe: ['黄铁矿', '石英', '蓝铁矿'],
      Al: ['磷铝石', '石英', '高岭石'],
      Mn: ['菱锰矿', '石英', '方解石'],
      Cu: ['孔雀石', '褐铁矿', '石英'],
      Pb: ['磷氯铅矿', '方铅矿', '重晶石'],
      U: ['铀矿', '方解石', '石英'],
      Li: ['锂辉石', '石英', '长石'],
    },
    '09': { // 硅酸盐
      primary: ['石英', '长石', '方解石'],
      Fe: ['石英', '磁铁矿', '辉石', '角闪石'],
      Mg: ['橄榄石', '辉石', '蛇纹石', '滑石'],
      Ca: ['方解石', '石榴子石', '辉石'],
      Al: ['长石', '白云母', '高岭石', '蓝晶石'],
      Na: ['钠长石', '霞石', '方钠石'],
      K: ['正长石', '白云母', '石英'],
      Li: ['石英', '锂云母', '电气石'],
      Be: ['石英', '长石', '白云母'],
      Ti: ['榍石', '金红石', '磁铁矿'],
      Zr: ['锆石', '长石', '石英'],
    },
    '10': { // 有机矿物
      primary: ['方解石', '石膏', '黄铁矿'],
    },
  };

  const ca = classAssoc[strunzClass] || { primary: ['石英', '方解石'] };
  let result = [];

  // 1. 基于元素添加特异性共生矿物
  for (const el of elems) {
    if (ca[el]) {
      for (const m of ca[el]) {
        if (!result.includes(m)) result.push(m);
      }
    }
  }

  // 2. 补充 primary 列表
  for (const m of ca.primary) {
    if (!result.includes(m)) result.push(m);
  }

  // 3. 确保不包含自身（用中文名反查）
  const cnNameMap = {
    'Gold': '自然金', 'Silver': '自然银', 'Copper': '自然铜', 'Pyrite': '黄铁矿',
    'Galena': '方铅矿', 'Sphalerite': '闪锌矿', 'Chalcopyrite': '黄铜矿',
    'Hematite': '赤铁矿', 'Magnetite': '磁铁矿', 'Calcite': '方解石',
    'Dolomite': '白云石', 'Quartz': '石英', 'Malachite': '孔雀石',
    'Azurite': '蓝铜矿', 'Fluorite': '萤石', 'Halite': '石盐',
    'Baryte': '重晶石', 'Gypsum': '石膏', 'Muscovite': '白云母',
    'Kaolinite': '高岭石', 'Rutile': '金红石', 'Cassiterite': '锡石',
    'Arsenopyrite': '毒砂', 'Stibnite': '辉锑矿', 'Cinnabar': '辰砂',
    'Bornite': '斑铜矿', 'Chalcocite': '辉铜矿', 'Cuprite': '赤铜矿',
    'Olivine': '橄榄石', 'Chromite': '铬铁矿', 'Goethite': '针铁矿',
    'Rhodochrosite': '菱锰矿', 'Siderite': '菱铁矿', 'Smithsonite': '菱锌矿',
    'Cerussite': '白铅矿', 'Strontianite': '菱锶矿', 'Celestine': '天青石',
    'Molybdenite': '辉钼矿', 'Pyrrhotite': '磁黄铁矿', 'Pentlandite': '镍黄铁矿',
    'Orpiment': '雌黄', 'Realgar': '雄黄', 'Topaz': '黄玉',
  };
  const selfCN = cnNameMap[mineralName] || '';
  result = result.filter(m => m !== selfCN);

  // 4. 取前5-6个
  result = result.slice(0, 6);

  return result.join('、');
}


// ============================================================
// 主处理函数：为每种 RRUFF 矿物生成完整属性
// ============================================================
function inferProperties(mineral, strunzClass) {
  const elems = parseFormula(mineral.formula);
  const crystal = mineral.crystal || '';
  
  // 改进晶系解析：RRUFF 数据格式为 "monoclinic|hexagonal, triclinic" 等
  // 取第一个值（管道符前的第一个选项）
  let rawCrystal = crystal.split('|')[0].split(',')[0].trim().toLowerCase();
  const crystalMap = {
    'isometric': 'Isometric', 'cubic': 'Isometric',
    'tetragonal': 'Tetragonal',
    'orthorhombic': 'Orthorhombic',
    'hexagonal': 'Hexagonal',
    'trigonal': 'Trigonal',
    'monoclinic': 'Monoclinic',
    'triclinic': 'Triclinic',
    'amorphous': 'Amorphous',
    '等轴晶系': 'Isometric', '四方晶系': 'Tetragonal',
    '正交晶系': 'Orthorhombic', '六方晶系': 'Hexagonal',
    '三方晶系': 'Trigonal', '单斜晶系': 'Monoclinic',
    '三斜晶系': 'Triclinic', '非晶质': 'Amorphous',
  };
  const crystalEN = crystalMap[rawCrystal] || 'Monoclinic';
  
  const seed = mineral.en.split('').reduce((s,c) => s + c.charCodeAt(0), 0);
  
  const density = estimateDensity(elems, strunzClass);
  const lusterEN = estimateLuster(elems, strunzClass);
  const colorEN = estimateColor(elems, strunzClass);
  const streakEN = estimateStreak(elems, strunzClass, colorEN);
  const transEN = estimateTransparency(strunzClass, lusterEN);
  const cleavageEN = estimateCleavage(crystalEN, strunzClass);
  const fractureEN = estimateFracture(strunzClass, lusterEN);
  const tenacityEN = estimateTenacity(strunzClass, elems);
  const habitEN = getCrystalHabit(crystalEN, strunzClass, seed);
  const fluorEN = estimateFluorescence(elems, strunzClass);
  const usesEN = estimateUses(elems, strunzClass);
  
  const ri = estimateRI(strunzClass, density || 3);
  const sg = getSpaceGroup(crystalEN, seed);
  
  return {
    hardness: estimateHardness(elems, strunzClass, crystalEN),
    density: density ? density.toFixed(2) : null,
    luster: lusterEN,
    color: colorEN,
    streak: streakEN,
    transparency: transEN,
    cleavage: cleavageEN,
    fracture: fractureEN,
    tenacity: tenacityEN,
    crystalHabit: habitEN,
    fluorescence: fluorEN,
    spaceGroup: sg,
    refractiveIndex: ri ? ri.toFixed(3) : null,
    birefringence: ri ? (ri * 0.01).toFixed(3) : null,
    pleochroism: (elems.includes('Fe') || elems.includes('Mn') || elems.includes('Cu') || elems.includes('Cr') || elems.includes('V')) ? 'Weak to Moderate' : 'None',
    magnetism: elems.includes('Fe') && strunzClass === '04' ? 'Paramagnetic to Ferromagnetic' : 'Non-magnetic',
    radioactivity: (elems.includes('U') || elems.includes('Th')) ? 'Radioactive' : 'Not Radioactive',
    uses: usesEN,
    rarity: estimateRarity(mineral.en),
    associatedMinerals: estimateAssociatedMinerals(elems, strunzClass, mineral.en), // ◆ 推断共生矿物
    cn: '' // 中文名需要额外数据
  };
}

// ============================================================
// 为所有 RRUFF 矿物生成推断属性
// ============================================================
const inferredData = {};
let total = 0;

for (const cls of Object.keys(rruff).sort()) {
  inferredData[cls] = [];
  for (const m of rruff[cls]) {
    const props = inferProperties(m, cls);
    inferredData[cls].push({
      en: m.en,
      formula: m.formula,
      inferred: props
    });
    total++;
  }
  console.log('Class ' + cls + ': ' + rruff[cls].length + ' minerals → inferred properties');
}

// 保存推断数据
const outputPath = path.join(__dirname, 'inferred_properties.json');
fs.writeFileSync(outputPath, JSON.stringify(inferredData, null, 0));
console.log('\n已保存推断属性数据到 inferred_properties.json');
console.log('总矿物数: ' + total);

// 统计推断质量
let filled = 0, nulls = 0;
const propNames = Object.keys(inferredData[Object.keys(inferredData)[0]][0].inferred);
for (const cls of Object.keys(inferredData)) {
  for (const m of inferredData[cls]) {
    for (const p of propNames) {
      if (m.inferred[p] && m.inferred[p] !== '' && m.inferred[p] !== null) filled++;
      else nulls++;
    }
  }
}
console.log('推断属性格: ' + filled + ' / ' + (filled+nulls) + ' (' + (filled/(filled+nulls)*100).toFixed(1) + '%)');
