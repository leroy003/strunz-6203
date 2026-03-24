// ============================================================
// 矿物中文名自动翻译引擎 v2.0
// 基于矿物学命名规律 + 化学式解析 + 已知矿物名映射
// ============================================================
const fs = require('fs');
const path = require('path');

// 加载数据
const rruff = JSON.parse(fs.readFileSync(path.join(__dirname, 'rruff_classified.json'), 'utf8'));
const existingCN = require('./mineral_cn_names.js');

// ============================================================
// 第一层：精确已知矿物名（大幅扩展）
// ============================================================
const KNOWN_NAMES = Object.assign({}, existingCN, {
  // === 补充 Class 01 元素矿物 ===
  "Algodonite": "砷铜矿", "Allargentum": "锑银矿", "Aluminium": "自然铝",
  "Anduoite": "砷钌矿", "Anyuiite": "金铅矿", "Arsenolamprite": "斜砷矿",
  "Arsenopalladinite": "砷钯矿", "Atokite": "锡钯矿", "Aurihydrargyrumite": "金汞矿",
  "Aurostibite": "锑金矿", "Belendorffite": "铜汞矿", "Brownleeite": "硅锰矿",
  "Carletonmooreite": "硅镍矿", "Cerium": "自然铈", "Chengdeite": "承德矿",
  "Cherepanovite": "砷铑矿", "Chromferide": "铁铬矿", "Clinosafflorite": "斜砷钴矿",
  "Cuproauride": "铜金合金矿", "Damiaoite": "铟铂矿", "Danbaite": "丹巴矿",
  "Domeykite": "砷铜矿", "Dyscrasite": "锑银矿", "Edscottite": "碳铁矿",
  "Eugenite": "银汞矿", "Ferchromide": "铬铁合金矿", "Ferroskutterudite": "砷铁矿",
  "Froodite": "铋钯矿", "Genkinite": "锑铂矿", "Geversite": "锑铂矿",
  "Gupeiite": "硅铁矿", "Halamishite": "磷镍矿", "Hapkeite": "硅铁矿",
  "Hollisterite": "铁铝矿", "Hongshiite": "红石矿", "Hunchunite": "珲春矿",
  "Insizwaite": "铋铂矿", "Iridarsenite": "砷铱矿", "Isoferroplatinum": "等轴铁铂矿",
  "Jedwabite": "钽铁矿", "Khamrabaevite": "碳钛矿", "Kieftite": "锑钴矿",
  "Kitagohaite": "铜铂矿", "Kolymite": "科累马矿", "Koutekite": "砷铜矿",
  "Krutovite": "砷镍矿", "Langisite": "砷钴矿", "Leadamalgam": "铅汞齐",
  "Linzhiite": "林芝矿", "Löllingite": "毒砂", "Luanheite": "滦河矿",
  "Luobusaite": "罗布莎矿", "Maldonite": "铋金矿", "Marathonite": "锗钯矿",
  "Maucherite": "砷镍矿", "Mavlyanovite": "硅锰矿", "Minakawaite": "锑铑矿",
  "Modderite": "砷钴矿", "Moschellandsbergite": "汞银矿", "Murashkoite": "磷铁矿",
  "Naldrettite": "锑钯矿", "Naquite": "那曲矿", "Nazarovite": "磷镍矿",
  "Negevite": "磷镍矿", "Nickelphosphide": "磷镍矿", "Nielsenite": "铜钯矿",
  "Nierite": "氮化硅矿", "Niggliite": "锡铂矿", "Niobocarbide": "碳铌矿",
  "Nisbite": "锑镍矿", "Nisnite": "锡镍矿", "Omeiite": "峨眉矿",
  "Orcelite": "砷镍矿", "Orthocuproplatinum": "正交铜铂矿",
  "Palladoarsenide": "砷钯矿", "Palladodymite": "砷钯矿",
  "Palladogermanide": "锗钯矿", "Palladosilicide": "硅钯矿",
  "Paolovite": "锡钯矿", "Paradocrasite": "锑砷矿",
  "Pararammelsbergite": "副砷镍矿", "Pararsenolamprite": "副斜砷矿",
  "Paraschachnerite": "副汞银矿", "Paxite": "砷铜矿",
  "Plumbopalladinite": "铅钯矿", "Polkanovite": "砷铑矿",
  "Potarite": "汞钯矿", "Qingsongite": "青松矿", "Qusongite": "曲松矿",
  "Rammelsbergite": "砷镍矿", "Rhodarsenide": "砷铑矿",
  "Rumoiite": "锡金矿", "Rustenburgite": "锡铂矿",
  "Safflorite": "砷钴矿", "Schachnerite": "银汞矿",
  "Seinäjokite": "锑铁矿", "Shosanbetsuite": "锡银矿",
  "Siderazot": "氮铁矿", "Silicon": "自然硅",
  "Skaergaardite": "铜钯矿", "Sobolevskite": "铋钯矿",
  "Stannopalladinite": "锡钯矿", "Steinhardtite": "斯坦哈特矿",
  "Stibarsen": "锑砷矿", "Stibiopalladinite": "锑钯矿",
  "Stillwaterite": "砷钯矿", "Stistaite": "锑锡矿",
  "Stolperite": "铜铝矿", "Stumpflite": "锑铂矿",
  "Sudburyite": "锑钯矿", "Tantalcarbide": "碳钽矿",
  "Tetraferroplatinum": "四方铁铂矿", "Tetrataenite": "四方镍纹石",
  "Titanium": "自然钛", "Tongbaite": "桐柏矿",
  "Transjordanite": "磷镍矿", "Uakitite": "氮钒矿",
  "Ungavaite": "锑钯矿", "Vincentite": "砷钯矿",
  "Westerveldite": "砷铁矿", "Xifengite": "锡丰矿",
  "Yixunite": "伊春矿", "Yuanjiangite": "沅江矿",
  "Zhanghengite": "张衡矿", "Zuktamrurite": "磷铁矿",
  "Zvyagintsevite": "铅钯矿",

  // === 补丁：33种特殊矿物 ===
  "Rosickýite": "单斜硫", "Sulphur": "自然硫", "Sulphur-β": "自然硫-β",
  "Bararite": "氟硅酸铵矿", "Barberiite": "氟硼酸铵矿", "Salammoniac": "硇砂",
  "Ice": "冰矿", "Ice-VII": "高压冰矿", "Lechatelierite": "焦石英",
  "Paratellurite": "仲碲矿", "Seifertite": "赛弗特石",
  "Gwihabaite": "硝酸铵矿", "Teschemacherite": "碳酸氢铵矿",
  "Ammonioborite": "硼酸铵矿", "Clinometaborite": "斜偏硼酸矿",
  "Larderellite": "硼酸铵矿", "Metaborite": "偏硼酸矿",
  "Sassolite": "硼酸矿", "Mascagnite": "硫酸铵矿",
  "Biphosphammite": "磷酸二氢铵矿", "Phosphammite": "磷酸铵矿",
  "Bosoite": "包合石英", "Chibaite": "千叶石",
  "Melanophlogite": "碳氢石英", "Mogánite": "莫甘石",
  "Silhydrite": "水硅矿", "Sinoite": "氮氧硅矿",
  "Kratochvílite": "荧蒽矿", "Marchettiite": "嘌呤矿",
  "Phylloretine": "叶脂矿", "Simonellite": "西蒙石",
  "Uricite": "尿酸矿", "Wampenite": "蒽矿",

  // === 补充 Class 02 硫化物 - 常见种 ===
  "Acanthite": "辉银矿", "Altaite": "碲铅矿", "Aguilarite": "硒银矿",
  "Argyrodite": "锗银矿", "Berzelianite": "硒铜矿", "Binnite": "砷黝铜矿",
  "Bismuthinite": "辉铋矿", "Calaverite": "碲金矿", "Canfieldite": "锡银矿",
  "Carrollite": "硫钴铜矿", "Cattierite": "硫钴矿", "Chalcostibite": "硫锑铜矿",
  "Clausthalite": "硒铅矿", "Coloradoite": "碲汞矿", "Cooperite": "硫铂矿",
  "Cosalite": "硫铋铅矿", "Cubanite": "方黄铜矿", "Digenite": "蓝辉铜矿",
  "Dimorphite": "二形硫矿", "Dioptase": "翠铜矿", "Djurleite": "准辉铜矿",
  "Emplectite": "硫铋铜矿", "Enargite": "硫砷铜矿", "Erlichmanite": "硫锇矿",
  "Famatinite": "硫砷铜矿", "Freibergite": "弗赖贝格矿",
  "Frohbergite": "碲铁矿", "Galenobismutite": "硫铋铅矿",
  "Germanite": "硫锗矿", "Godlevskite": "硫镍矿",
  "Greenockite": "硫镉矿", "Hauerite": "硫锰矿",
  "Heazlewoodite": "低硫镍矿", "Hessite": "碲银矿",
  "Hutchinsonite": "铊砷铅矿", "Idaite": "硫铁铜矿",
  "Imiterite": "碲银汞矿", "Jordanite": "硫砷铅矿",
  "Kermesite": "红锑矿", "Kesterite": "硫锡铜矿",
  "Klockmannite": "硒铜矿", "Kostovite": "碲铜金矿",
  "Krennerite": "碲金矿", "Laurite": "硫钌矿",
  "Lengenbachite": "硫砷铅矿", "Livingstonite": "辉锑汞矿",
  "Luzonite": "吕宋矿", "Matildite": "硫铋银矿",
  "Metacinnabar": "黑辰砂", "Miargyrite": "硫锑银矿",
  "Millerite": "针镍矿", "Moncheite": "碲铂矿",
  "Nagyagite": "碲硫金铅矿", "Naumannite": "硒银矿",
  "Nickeline": "红砷镍矿", "Oldhamite": "硫钙矿",
  "Orpiment": "雌黄", "Owyheeite": "硫锑铅银矿",
  "Patronite": "硫钒矿", "Petzite": "碲金银矿",
  "Polydymite": "紫硫镍矿", "Polybasite": "硫锑铜银矿",
  "Pyrargyrite": "浓红银矿", "Proustite": "淡红银矿",
  "Ramdohrite": "硫锑铅银矿", "Renierite": "硫锗铜矿",
  "Rickardite": "碲铜矿", "Routhierite": "碲铊汞矿",
  "Sartorite": "硫砷铅矿", "Semseyite": "硫锑铅矿",
  "Siegenite": "硫镍钴矿", "Smithite": "硫砷银矿",
  "Sperrylite": "砷铂矿", "Stannite": "黝锡矿",
  "Stephanite": "脆银矿", "Sternbergite": "硫银铁矿",
  "Stromeyerite": "硫铜银矿", "Sulvanite": "硫钒铜矿",
  "Sylvanite": "碲金银矿", "Tarkianite": "(Cu,Fe)(Re,Mo)₄S₈",
  "Tennantite": "砷黝铜矿", "Tetrahedrite": "黝铜矿",
  "Tiemannite": "硒汞矿", "Troilite": "陨硫铁",
  "Tungstenite": "硫钨矿", "Umangite": "硒铜矿",
  "Valleriite": "硫铁铜矿", "Vaesite": "硫镍矿",
  "Violarite": "紫硫镍矿", "Vrbaite": "铊汞砷锑硫化物",
  "Wittite": "硫铋铅矿", "Wurtzite": "纤锌矿",
  "Xanthoconite": "硫砷银矿", "Zinkenite": "锌锑矿",

  // === 补充 Class 03 卤化物 ===
  "Abhurite": "氯氧锡矿", "Acuminite": "氟铝锶矿", "Akaganeite": "铁氧氢矿",
  "Antarcticite": "氯化钙矿", "Avogadrite": "氟硼钾矿", "Bismoclite": "氯氧铋矿",
  "Calomel": "甘汞矿", "Chiolite": "氟铝钠矿", "Coccinite": "碘化汞矿",
  "Colquiriite": "氟铝锂钙矿", "Cryolithionite": "氟铝锂钠矿",
  "Cryptohalite": "氟硅铵矿", "Gagarinite-(Y)": "氟钇钠矿",
  "Gananite": "氟铋矿", "Gearksutite": "氟铝钙矿",
  "Griceite": "氟锂矿", "Kremersite": "氯铁铵矿",
  "Lafossaite": "氯碲铊矿", "Matlockite": "氯氟铅矿",
  "Neighborite": "氟镁钠矿", "Rinneite": "氯铁钾钠矿",
  "Rokuhnite": "氯化亚铁矿", "Scacchite": "氯化锰矿",
  "Sosedkoite": "氯钾铜矿", "Terlinguaite": "氯氧汞矿",
  "Tolbachite": "氯化铜矿", "Usovite": "氟铝镁钡矿",
  "Zhangpeishanite": "张佩珊矿",

  // === 补充 Class 04 氧化物 ===
  "Akdalaite": "铝氧矿", "Alexandrite": "变石",
  "Bixbyite": "方铁锰矿", "Birnessite": "水钠锰矿",
  "Brannerite": "铀钛矿", "Brookite": "板钛矿",
  "Bunsenite": "方镍矿", "Cerianite-(Ce)": "方铈矿",
  "Chalcophanite": "水锰锌矿", "Columbite": "铌铁矿",
  "Coronadite": "铅硬锰矿", "Corundum": "刚玉",
  "Crednerite": "铜锰矿", "Crichtonite": "钛铁矿",
  "Cuprite": "赤铜矿", "Delafossite": "铜铁矿",
  "Downeyite": "硒矿", "Eskolaite": "铬矿",
  "Euxenite-(Y)": "黑稀金矿", "Fergusonite-(Y)": "褐钇铌矿",
  "Ferrihydrite": "铁氧氢矿", "Freudenbergite": "钛铁钠矿",
  "Gahnite": "锌尖晶石", "Galaxite": "锰铝尖晶石",
  "Geikielite": "镁钛矿", "Groutite": "斜方水锰矿",
  "Guyanaite": "铬氧氢矿", "Hawleyite": "硫镉矿",
  "Hetaerolite": "锌锰矿", "Hollandite": "钡锰矿",
  "Hydroxylherderite": "羟磷铍钙矿", "Ixiolite": "铌钽钛矿",
  "Jacobsite": "锰铁尖晶石", "Karelianite": "钒矿",
  "Litharge": "密陀僧", "Loparite-(Ce)": "钙钛铈矿",
  "Magnesiochromite": "镁铬尖晶石", "Magnesiocoulsonite": "镁钒尖晶石",
  "Manganite": "水锰矿", "Massicot": "铅黄",
  "Minium": "铅丹", "Montroseite": "钒铁矿",
  "Mushketovite": "假象磁铁矿", "Nsutite": "水锰矿",
  "Opal": "蛋白石", "Plattnerite": "铅矿",
  "Polycrase-(Y)": "钛钇矿", "Pseudobrookite": "假板钛矿",
  "Qandilite": "钛镁铝矿", "Ramsdellite": "斜方锰矿",
  "Raspite": "板钨铅矿", "Ringwoodite": "林伍德石",
  "Romanechite": "硬锰矿", "Samarskite-(Y)": "铌钇矿",
  "Simpsonite": "钽铝矿", "Tapiolite-(Fe)": "铁钽矿",
  "Tellurite": "碲矿", "Thorianite": "方钍石",
  "Todorokite": "钡硬锰矿", "Trigonite": "砷锰铅矿",
  "Ulvöspinel": "钛铁尖晶石", "Uraninite": "晶质铀矿",
  "Wadsleyite": "瓦兹利石", "Zincite": "红锌矿",

  // === 补充 Class 05 碳酸盐 ===
  "Alstonite": "碳钡钙矿", "Ancylite-(Ce)": "碳酸铈矿",
  "Artinite": "纤菱镁矿", "Bastnäsite-(Ce)": "氟碳铈矿",
  "Beyerite": "碳铋钙矿", "Bismutite": "碳铋矿",
  "Burbankite": "碳酸钡锶钠矿", "Callaghanite": "碳铜镁矿",
  "Cordylite-(Ce)": "碳铈钡矿", "Defernite": "碳钙矿",
  "Dypingite": "水碳镁矿", "Eitelite": "碳镁钠矿",
  "Fairchildite": "碳钾钙矿", "Gaspéite": "碳镍矿",
  "Huntite": "碳钙镁矿", "Hydrocerussite": "碳铅矿",
  "Hydromagnesite": "水菱镁矿", "Ikaite": "碳酸钙六水石",
  "Kettnerite": "碳铋钙矿", "Lansfordite": "碳镁五水矿",
  "Leadhillite": "碳硫酸铅矿", "Monohydrocalcite": "碳钙一水矿",
  "Nahcolite": "天然碳酸氢钠", "Nesquehonite": "碳镁三水矿",
  "Northupite": "碳硫酸镁钠矿", "Olekminskite": "碳锶矿",
  "Otavite": "碳镉矿", "Phosgenite": "碳氯铅矿",
  "Pirssonite": "碳钠钙矿", "Plumbonacrite": "碳铅矿",
  "Rhodochrosite": "菱锰矿", "Rosasite": "碳锌铜矿",
  "Rutherfordine": "碳铀矿", "Shortite": "碳钠钙矿",
  "Sjögrenite": "碳镁铁矿", "Thermonatrite": "温泉碱",
  "Trona": "天然碱", "Vaterite": "球霰石",
  "Weloganite": "碳锆钠矿", "Zaratite": "翠镍矿",

  // === 补充 Class 06 硼酸盐 ===
  "Aksaite": "水硼镁石", "Ameghinite": "硼钠矿",
  "Aristarainite": "硼钠镁矿", "Bandylite": "硼铜矿",
  "Biringuccite": "硼钠矿", "Borcarite": "碳硼钙矿",
  "Brianroulstonite": "硼锌矿", "Calciborite": "硼钙矿",
  "Cahnite": "硼砷钙矿", "Danburite": "赛黄晶",
  "Ericaite": "硼铁镁矿", "Fluoborite": "氟硼镁矿",
  "Frolovite": "硼钙矿", "Gaudefroyite": "硼锰钙矿",
  "Ginorite": "硼钙矿", "Harkerite": "碳硼钙镁矿",
  "Hilgardite": "硼钙矿", "Inyoite": "硼钙矿",
  "Jeremejevite": "方硼铝矿", "Johachidolite": "硼铝钙矿",
  "Kotoite": "硼镁矿", "Kurnakovite": "水硼镁石",
  "Lüneburgite": "硼磷镁矿", "Meyerhofferite": "硼钙矿",
  "Nobleite": "硼钙矿", "Olshanskyite": "硼钙矿",
  "Parasibirskite": "副硼钙矿", "Probertite": "硼钠钙矿",
  "Rhodizite": "铯铝硼矿", "Rivadavite": "硼钠铁矿",
  "Sakhaite": "碳硼钙镁矿", "Sborgite": "硼钠矿",
  "Searlesite": "硼硅钠矿", "Sibirskite": "硼钙矿",
  "Strontioborite": "硼锶矿", "Suanite": "硼镁矿",
  "Szaibelyite": "板硼镁石", "Teepleite": "硼氯钠矿",
  "Tunellite": "硼锶矿", "Tusionite": "硼锰矿",
  "Veatchite": "硼锶矿", "Wardsmithite": "硼镁矿",
  "Wiserite": "硼锰矿",

  // === 补充 Class 07 硫酸盐 ===
  "Amarantite": "水硫酸铁矿", "Amarillite": "硫酸铁钠矿",
  "Arcanite": "硫酸钾矿", "Bassanite": "半水石膏",
  "Beaverite-(Cu)": "硫铁铜铅矿", "Botryogen": "水绿矾",
  "Burkeite": "碳硫酸钠矿", "Caledonite": "铅铜硫酸矿",
  "Cannonite": "硫酸铋矿", "Carphosiderite": "水硫酸铁矿",
  "Cesanite": "硫酸磷钙钠矿", "Changoite": "硫酸锌钠矿",
  "Connellite": "硫酸铜矿", "Coquimbite": "水硫酸铁矿",
  "Cuprocopiapite": "水铜矾", "Devilline": "硫铜钙矿",
  "Ettringite": "钙矾石", "Fibroferrite": "纤铁矾",
  "Ferberite": "钨铁矿", "Goslarite": "水硫酸锌矿",
  "Grandreefite": "硫氟铅矿", "Gunningite": "水硫酸锌矿",
  "Hanksite": "碳硫酸钾钠矿", "Hashemite": "铬酸钡矿",
  "Hexahydrite": "六水硫酸镁矿", "Hinsdalite": "硫磷铝铅矿",
  "Hübnerite": "钨锰矿", "Johannite": "水硫酸铜铀矿",
  "Kalinite": "钾明矾", "Kieserite": "水镁矾",
  "Ktenasite": "硫铜锌矿", "Lanarkite": "硫酸铅矿",
  "Leightonite": "硫酸铜钾钙矿", "Letovicite": "硫酸铵矿",
  "Linarite": "硫酸铜铅矿", "Löweite": "硫酸镁钠矿",
  "Mendozite": "硫酸铝钠矿", "Metavoltine": "硫酸铁钾矿",
  "Moorhouseite": "硫酸钴锰矿", "Natrochalcite": "硫酸铜钠矿",
  "Natrojarosite": "钠黄铁矾", "Newberyite": "磷酸镁矿",
  "Palmierite": "硫酸铅钾矿", "Parabutlerite": "副水铁矾",
  "Pentahydrite": "五水硫酸镁矿", "Plumbojarosite": "铅黄钾铁矾",
  "Poitevinite": "硫酸铜矿", "Powellite": "钼钙矿",
  "Rapidcreekite": "硫酸钙矿", "Raspite": "板钨铅矿",
  "Sanmartinite": "钨锌矿", "Scheelite": "白钨矿",
  "Schwertmannite": "水硫酸铁矿", "Sideronatrite": "硫酸铁钠矿",
  "Spangolite": "硫酸铜铝矿", "Stolzite": "钨铅矿",
  "Sturmanite": "硼硫酸铁钙矿", "Szomolnokite": "水硫酸亚铁矿",
  "Tamarugite": "硫酸铝钠矿", "Thaumasite": "碳硫酸硅钙矿",
  "Voltaite": "硫酸铁钾矿", "Wulfenite": "钼铅矿",
  "Zippeite": "硫酸铀钾矿",

  // === 补充 Class 08 磷酸盐 ===
  "Arrojadite-(KFe)": "磷铁矿", "Arsenoclasite": "砷锰矿",
  "Arzentzite": "砷矿", "Bayldonite": "砷铜铅矿",
  "Beudantite": "砷硫酸铁铅矿", "Cacoxenite": "黄磷铁矿",
  "Calderonite": "磷铁铅矿", "Cassidyite": "磷镍钙矿",
  "Churchite-(Y)": "磷钇矿", "Clinobarrandite": "磷铁矿",
  "Collinsite": "磷镁钙矿", "Corkite": "硫磷铁铅矿",
  "Cornubite": "砷铜矿", "Crandallite": "磷铝钙矿",
  "Dufrenite": "磷铁矿", "Durangite": "砷钠铁矿",
  "Evansite": "水磷铝矿", "Faheyite": "磷铍铁矿",
  "Ferrisicklerite": "磷铁锰矿", "Ferrostrunzite": "磷铁矿",
  "Fillowite": "磷锰钠矿", "Florencite-(Ce)": "磷铝铈矿",
  "Fluellite": "磷铝矿", "Gorceixite": "磷铝钡矿",
  "Goyazite": "磷铝锶矿", "Hagendorfite": "磷铁锰钠矿",
  "Herderite": "磷铍钙矿", "Hureaulite": "磷锰矿",
  "Hydroxylherderite": "羟磷铍钙矿", "Johnsomervilleite": "磷铁镁钠矿",
  "Kidwellite": "磷铁钠矿", "Kulanite": "磷铁钡矿",
  "Laueite": "磷铁锰矿", "Lazulite": "天蓝石",
  "Leucophosphite": "磷铁钾矿", "Lithiophilite": "磷锂锰矿",
  "Ludlamite": "磷铁矿", "Mitridatite": "磷铁钙矿",
  "Monazite-(La)": "独居石-(镧)", "Monazite-(Nd)": "独居石-(钕)",
  "Olivenite": "橄榄铜矿", "Overite": "磷铝镁钙矿",
  "Paradamite": "砷锌矿", "Paravauxite": "磷铁铝矿",
  "Plumbogummite": "磷铝铅矿", "Pseudomalachite": "磷铜矿",
  "Purpurite": "紫磷锰矿", "Pyromorphite": "磷氯铅矿",
  "Reddingite": "磷锰矿", "Roscherite": "磷铝铍矿",
  "Saleeite": "磷铀镁矿", "Scholzite": "磷锌钙矿",
  "Stewartite": "磷铁锰矿", "Strengite": "磷铁矿",
  "Switzerite": "磷锰矿", "Tarbuttite": "磷锌矿",
  "Tobernite": "铜铀云母", "Triphylite": "磷锂铁矿",
  "Tsumebite": "硫磷铜铅矿", "Turquoise": "绿松石",
  "Tyrolite": "砷硫铜钙矿", "Variscite": "磷铝石",
  "Vauquelinite": "铬磷铜铅矿", "Vivianite": "蓝铁矿",
  "Wardite": "磷铝钠矿", "Wavellite": "银星石",
  "Xenotime-(Y)": "磷钇矿",

  // === 补充 Class 09 硅酸盐 - 大量重要矿物 ===
  "Acmite": "霓辉石", "Aegirine-augite": "霓辉石",
  "Afwillite": "硅钙矿", "Agardite-(Y)": "砷铜钇矿",
  "Åkermanite": "镁黄长石", "Allanite-(Ce)": "褐帘石",
  "Allophane": "水铝英石", "Amesite": "镁铁绿泥石",
  "Andradite": "钙铁榴石", "Anorthite": "钙长石",
  "Anthophyllite": "直闪石", "Antigorite": "叶蛇纹石",
  "Arfvedsonite": "钠铁闪石", "Augite": "普通辉石",
  "Axinite-(Fe)": "铁斧石", "Babingtonite": "硅铁灰石",
  "Barkevikite": "巴氏角闪石", "Batisite": "钛钡硅矿",
  "Benitoite": "蓝锥矿", "Bertrandite": "硅铍矿",
  "Boracite": "方硼石", "Boulangerite": "毛硫锑铅矿",
  "Braunite": "硅锰矿", "Bustamite": "锰硅灰石",
  "Bytownite": "倍长石", "Cancrinite": "钙霞石",
  "Carpholite": "碳绿柱石", "Cavansite": "钒硅钙矿",
  "Celadonite": "海绿石", "Celsian": "钡长石",
  "Charoite": "查罗石", "Chondrodite": "粒硅镁石",
  "Chrysoberyl": "金绿宝石", "Chrysocolla": "硅孔雀石",
  "Clinohumite": "斜硅镁石", "Clinopyroxene": "单斜辉石",
  "Clintonite": "硅铝钙矿", "Coesite": "柯石英",
  "Coffinite": "硅铀矿", "Cordierite": "堇青石",
  "Cristobalite": "方石英", "Cummingtonite": "镁铁闪石",
  "Danalite": "铁日光榴石", "Danburite": "赛黄晶",
  "Datolite": "硼硅钙石", "Dickite": "地开石",
  "Diopside": "透辉石", "Dravite": "镁电气石",
  "Dumortierite": "蓝线石", "Edenite": "浅闪石",
  "Elbaite": "锂电气石", "Enstatite": "顽火辉石",
  "Epistilbite": "柱沸石", "Erionite-K": "钾毛沸石",
  "Eudialyte": "桃红石", "Faujasite-Na": "钠八面沸石",
  "Fayalite": "铁橄榄石", "Ferrierite-Mg": "镁沸石",
  "Ferrosilite": "铁辉石", "Forsterite": "镁橄榄石",
  "Garnet": "石榴子石", "Gehlenite": "钙铝黄长石",
  "Gibbsite": "三水铝石", "Glaucophane": "蓝闪石",
  "Gmelinite-Na": "钠菱沸石", "Goethite": "针铁矿",
  "Grandidierite": "大硅铝镁矿", "Grossular": "钙铝榴石",
  "Grunerite": "铁闪石", "Gyrolite": "水硅钙石",
  "Halloysite": "埃洛石", "Haüyne": "蓝方石",
  "Hedenbergite": "钙铁辉石", "Hemimorphite": "异极矿",
  "Heulandite-Ca": "钙片沸石", "Hisingerite": "硅铁矿",
  "Howlite": "硅硼钙石", "Humite": "硅镁石",
  "Hyalophane": "钡正长石", "Hydrogrossular": "水钙铝榴石",
  "Illite": "伊利石", "Ilvaite": "黑柱石",
  "Jadeite": "硬玉", "Kaersutite": "钛角闪石",
  "Kaolinite": "高岭石", "Kornerupine": "柱晶石",
  "Labradorite": "拉长石", "Larnite": "硅钙矿",
  "Laumontite": "浊沸石", "Lawsonite": "硬柱石",
  "Lazurite": "青金石", "Lepidolite": "锂云母",
  "Leucite": "白榴石", "Liddicoatite": "钙锂电气石",
  "Lizardite": "利蛇纹石", "Margarite": "珍珠云母",
  "Meionite": "钙柱石", "Melilite": "黄长石",
  "Mesolite": "中沸石", "Microcline": "微斜长石",
  "Monticellite": "钙镁橄榄石", "Mordenite": "丝光沸石",
  "Mullite": "莫来石", "Narsarsukite": "钛硅钠矿",
  "Natrolite": "钠沸石", "Nepheline": "霞石",
  "Nephrite": "软玉", "Norbergite": "硅镁矿",
  "Nosean": "钠方石", "Oligoclase": "奥长石",
  "Omphacite": "绿辉石", "Okenite": "硅钙矿",
  "Palygorskite": "坡缕石", "Paragonite": "钠云母",
  "Pectolite": "针钠钙石", "Periclase": "方镁石",
  "Petalite": "透锂长石", "Phlogopite": "金云母",
  "Piemontite": "红帘石", "Pigeonite": "易变辉石",
  "Pollucite": "铯沸石", "Prehnite": "葡萄石",
  "Pyrophyllite": "叶蜡石", "Pyrope": "镁铝榴石",
  "Rhodonite": "蔷薇辉石", "Riebeckite": "铁钠闪石",
  "Sanidine": "透长石", "Saponite": "皂石",
  "Scapolite": "方柱石", "Schorl": "铁电气石",
  "Scolecite": "钙沸石", "Sepiolite": "海泡石",
  "Siderophyllite": "铁叶云母", "Sillimanite": "硅线石",
  "Sodalite": "方钠石", "Spessartine": "锰铝榴石",
  "Staurolite": "十字石", "Steacyite": "钍钡硅矿",
  "Stellerite": "束沸石", "Stilbite-Ca": "钙辉沸石",
  "Stilpnomelane": "绿鳞石", "Stishovite": "斯石英",
  "Sugilite": "杉石", "Talc": "滑石",
  "Tanzanite": "坦桑石", "Tephroite": "锰橄榄石",
  "Thomsonite-Ca": "汤姆森沸石", "Thorite": "钍石",
  "Tilleyite": "碳硅钙矿", "Titanite": "榍石",
  "Topaz": "黄玉", "Tremolite": "透闪石",
  "Tridymite": "鳞石英", "Tugtupite": "硫硅铍钠矿",
  "Uvite": "镁钙电气石", "Uvarovite": "钙铬榴石",
  "Vermiculite": "蛭石", "Vesuvianite": "符山石",
  "Wairakite": "钙方沸石", "Willemite": "硅锌矿",
  "Wollastonite": "硅灰石", "Zoisite": "黝帘石",

  // === 补充 Class 10 有机矿物 ===
  "Bridgmanite": "布里奇曼石", "Butlerite": "水硫酸铁矿",
  "Calclacite": "氯醋酸钙矿", "Caoxite": "草酸钙矿",
  "Chanabayaite": "碳酸铵铜矿", "Coalingite": "碳酸镁铁矿",
  "Coskrenite-(Ce)": "草酸硫酸铈矿", "Dashkovaite": "甲酸镁矿",
  "Deveroite-(Ce)": "草酸铈矿", "Dittmarite": "磷酸铵镁矿",
  "Edoylerite": "硒汞矿", "Ernstburkeite": "硫酸镁铵矿",
  "Feroxyhyte": "铁氧氢矿", "Humboldtine": "草酸亚铁矿",
  "Julienite": "硫氰钴钠矿", "Kladnoite": "邻苯二甲酰亚胺矿",
  "Levinsonite-(Y)": "硫酸钇铝矿", "Margarosanite": "硅铅钙矿",
  "Middlebackite": "草酸铜矿", "Moolooite": "草酸铜矿",
  "Novgorodovaite": "草酸钙矿", "Paceite": "醋酸钙铜矿",
  "Phoxite": "磷草酸铵矿", "Refikite": "树脂矿",
  "Roquésite": "硫铟铜矿", "Rowleyite": "氯化钠铜矿",
  "Simonkolleite": "氯锌矿", "Swamboite-(Nd)": "硫酸铀钕矿",
  "Tinnunculite": "尿酸铵矿", "Uroxite": "尿酸矿",
  "Vimsite": "硼钙矿", "Voronkovite": "硅钠矿",
  "Weddellite": "二水草酸钙矿", "Zhemchuzhnikovite": "草酸铝镁钠矿",
});

// ============================================================
// 第二层：基于化学式的自动翻译规则
// ============================================================

// 元素中文名映射
const ELEMENT_CN = {
  'H': '氢', 'He': '氦', 'Li': '锂', 'Be': '铍', 'B': '硼', 'C': '碳',
  'N': '氮', 'O': '氧', 'F': '氟', 'Ne': '氖', 'Na': '钠', 'Mg': '镁',
  'Al': '铝', 'Si': '硅', 'P': '磷', 'S': '硫', 'Cl': '氯', 'Ar': '氩',
  'K': '钾', 'Ca': '钙', 'Sc': '钪', 'Ti': '钛', 'V': '钒', 'Cr': '铬',
  'Mn': '锰', 'Fe': '铁', 'Co': '钴', 'Ni': '镍', 'Cu': '铜', 'Zn': '锌',
  'Ga': '镓', 'Ge': '锗', 'As': '砷', 'Se': '硒', 'Br': '溴', 'Rb': '铷',
  'Sr': '锶', 'Y': '钇', 'Zr': '锆', 'Nb': '铌', 'Mo': '钼', 'Ru': '钌',
  'Rh': '铑', 'Pd': '钯', 'Ag': '银', 'Cd': '镉', 'In': '铟', 'Sn': '锡',
  'Sb': '锑', 'Te': '碲', 'I': '碘', 'Cs': '铯', 'Ba': '钡', 'La': '镧',
  'Ce': '铈', 'Pr': '镨', 'Nd': '钕', 'Sm': '钐', 'Eu': '铕', 'Gd': '钆',
  'Tb': '铽', 'Dy': '镝', 'Ho': '钬', 'Er': '铒', 'Tm': '铥', 'Yb': '镱',
  'Lu': '镥', 'Hf': '铪', 'Ta': '钽', 'W': '钨', 'Re': '铼', 'Os': '锇',
  'Ir': '铱', 'Pt': '铂', 'Au': '金', 'Hg': '汞', 'Tl': '铊', 'Pb': '铅',
  'Bi': '铋', 'Th': '钍', 'U': '铀', 'Np': '镎', 'Pu': '钚',
};

// Strunz 分类对应的后缀
const CLASS_SUFFIX = {
  '01': '矿', '02': '矿', '03': '矿', '04': '矿', '05': '矿',
  '06': '矿', '07': '矿', '08': '矿', '09': '石', '10': '矿',
};

// 阴离子组中文
const ANION_CN = {
  'S': '硫', 'Se': '硒', 'Te': '碲', 'As': '砷', 'Sb': '锑', 'Bi': '铋',
  'F': '氟', 'Cl': '氯', 'Br': '溴', 'I': '碘',
  'CO3': '碳酸', 'SO4': '硫酸', 'PO4': '磷酸', 'AsO4': '砷酸',
  'VO4': '钒酸', 'SiO4': '硅酸', 'BO3': '硼酸', 'NO3': '硝酸',
  'MoO4': '钼酸', 'WO4': '钨酸', 'CrO4': '铬酸', 'IO3': '碘酸',
};

// 解析化学式中的元素
function parseElements(formula) {
  if (!formula) return [];
  const subMap = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
  let f = formula;
  for (const [k,v] of Object.entries(subMap)) f = f.replace(new RegExp(k,'g'), v);
  f = f.replace(/·\d*H2O/g, '').replace(/\(OH\)\d*/g, '');
  const elems = [];
  const re = /([A-Z][a-z]?)/g;
  let m;
  while ((m = re.exec(f)) !== null) {
    if (ELEMENT_CN[m[1]] && !elems.includes(m[1])) elems.push(m[1]);
  }
  return elems;
}

// 基于化学式和分类自动生成中文名
function autoTranslate(en, formula, strunzClass) {
  const elems = parseElements(formula);
  if (elems.length === 0) return null;

  // 确定阴离子组
  const anionPriority = ['SO4','PO4','AsO4','VO4','SiO4','BO3','CO3','MoO4','WO4','CrO4','IO3','NO3'];
  let anion = '';
  for (const a of anionPriority) {
    if (formula.includes(a.replace(/\d/g, c => '₀₁₂₃₄₅₆₇₈₉'[c])) || formula.includes(a)) {
      anion = ANION_CN[a] || '';
      break;
    }
  }

  // 确定阴离子（简单）
  if (!anion) {
    if (strunzClass === '02') anion = '硫';
    else if (strunzClass === '03') anion = '氯';
    else if (strunzClass === '04') anion = '';
    else if (strunzClass === '05') anion = '碳酸';
    else if (strunzClass === '06') anion = '硼';
    else if (strunzClass === '07') anion = '硫酸';
    else if (strunzClass === '08') anion = '磷';
    else if (strunzClass === '09') anion = '硅';
  }

  // 过滤掉常见阴离子元素
  const anionElements = ['O','H','S','Se','Te','F','Cl','Br','I'];
  const cations = elems.filter(e => !anionElements.includes(e) && e !== 'C' && e !== 'N' && e !== 'B' && e !== 'P' && e !== 'Si');
  
  if (cations.length === 0) return null;

  // 构造中文名：阴离子前缀 + 阳离子名（取前1-2个关键阳离子）
  let cationPart = '';
  const mainCations = cations.slice(0, Math.min(3, cations.length));
  for (const c of mainCations) {
    cationPart += ELEMENT_CN[c] || '';
  }

  const suffix = CLASS_SUFFIX[strunzClass] || '矿';
  
  if (anion) {
    return anion + cationPart + suffix;
  }
  return cationPart + suffix;
}

// ============================================================
// 第三层：基于英文名后缀的翻译
// ============================================================
function translateBySuffix(en, formula, strunzClass) {
  // 去掉可能的后缀修饰
  let base = en.replace(/-(Ce|La|Y|Nd|Fe|Mn|Mg|Ca|Na|K|Cu|Zn|Pb|Ba|Sr|NH4|OH)$/,'')
              .replace(/ IV| VI| II| III| I$/,'')
              .replace(/-[αβγδ]$/,'');
  
  // 如果英文名含有地名后缀 -ite, 用化学式翻译
  return autoTranslate(en, formula, strunzClass);
}

// ============================================================
// 主程序：为所有 RRUFF 矿物生成中文名
// ============================================================
const allNames = {};
let translated = 0, fromKnown = 0, fromAuto = 0, failed = 0;

for (const cls of Object.keys(rruff).sort()) {
  for (const m of rruff[cls]) {
    // 第一层：精确匹配
    if (KNOWN_NAMES[m.en]) {
      allNames[m.en] = KNOWN_NAMES[m.en];
      fromKnown++;
      translated++;
      continue;
    }

    // 尝试去掉后缀再匹配
    const variants = [
      m.en.replace(/-(Ce|La|Y|Nd|Fe|Mn|Mg|Ca|Na|K|Cu|Zn|Pb|Ba|Sr)(\))?$/,''),
      m.en.replace(/ \(.*\)$/,''),
      m.en.replace(/-[αβγδ]$/,''),
    ];
    let found = false;
    for (const v of variants) {
      if (v !== m.en && KNOWN_NAMES[v]) {
        allNames[m.en] = KNOWN_NAMES[v];
        fromKnown++;
        translated++;
        found = true;
        break;
      }
    }
    if (found) continue;

    // 第二层：自动翻译
    const auto = autoTranslate(m.en, m.formula, cls);
    if (auto) {
      allNames[m.en] = auto;
      fromAuto++;
      translated++;
    } else {
      // 第三层：使用英文音译 + 矿后缀
      allNames[m.en] = '';  // 留空
      failed++;
    }
  }
}

console.log('=== 中文名翻译结果 ===');
console.log('总矿物: ' + Object.keys(allNames).length);
console.log('已翻译: ' + translated + ' (' + (translated/Object.keys(allNames).length*100).toFixed(1) + '%)');
console.log('  已知精确: ' + fromKnown);
console.log('  自动推断: ' + fromAuto);
console.log('  未能翻译: ' + failed);

// 生成新的 mineral_cn_names.js
const lines = ['// ============================================================',
  '// 矿物中文名数据库 v2.0',
  '// 来源: 矿物学专业翻译 + 自动翻译引擎',
  '// 总计: ' + Object.keys(allNames).length + ' 种矿物',
  '// ============================================================',
  'var MINERAL_CN_NAMES = {'];

// 按类分组输出
for (const cls of Object.keys(rruff).sort()) {
  const classNames = {
    '01': '元素矿物', '02': '硫化物和硫盐', '03': '卤化物',
    '04': '氧化物和氢氧化物', '05': '碳酸盐和硝酸盐', '06': '硼酸盐',
    '07': '硫酸盐', '08': '磷酸盐', '09': '硅酸盐', '10': '有机矿物'
  };
  lines.push('  // === ' + cls + '. ' + (classNames[cls]||'') + ' ===');
  
  for (const m of rruff[cls]) {
    if (allNames[m.en]) {
      const escaped = m.en.replace(/"/g, '\\"');
      lines.push('  "' + escaped + '": "' + allNames[m.en] + '",');
    }
  }
}

lines.push('};');
lines.push('');
lines.push('if (typeof module !== \'undefined\') module.exports = MINERAL_CN_NAMES;');

const output = lines.join('\n');
fs.writeFileSync(path.join(__dirname, 'mineral_cn_names.js'), output);
console.log('\n已保存到 mineral_cn_names.js');
console.log('文件大小: ' + (output.length / 1024).toFixed(1) + ' KB');
