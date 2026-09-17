const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ size: 'A4', margin: 60 });
const out = fs.createWriteStream('D:/myData/demo/Bookkeeping/docs/记账本用户指引.pdf');
doc.pipe(out);

// Register Chinese font
doc.registerFont('CN', 'C:/Windows/Fonts/Deng.ttf');
doc.registerFont('CNB', 'C:/Windows/Fonts/Dengb.ttf');

const W = 475; // writable width
let y = 60;

function checkPage(h) { if (y + h > 780) { doc.addPage(); y = 60; } }
function checkPageMid() { if (y > 600) { doc.addPage(); y = 60; } }

function title(t) {
  checkPage(80);
  doc.font('CNB').fontSize(28).fillColor('#1989FA').text(t, 60, y, { align: 'center', width: W });
  y += 40;
}

function subtitle(t) {
  doc.font('CN').fontSize(12).fillColor('#999').text(t, 60, y, { align: 'center', width: W });
  y += 20;
}

function h1(t) {
  checkPage(40);
  y += 10;
  doc.font('CNB').fontSize(16).fillColor('#1989FA').text(t, 60, y);
  y += 22;
  doc.moveTo(60, y).lineTo(535, y).strokeColor('#1989FA').stroke();
  y += 15;
}

function h2(t) {
  checkPage(30);
  doc.font('CNB').fontSize(13).fillColor('#333').text(t, 60, y);
  y += 20;
}

function p(t) {
  checkPage(20);
  doc.font('CN').fontSize(10).fillColor('#333').text(t, 60, y, { width: W });
  y += 16;
}

function bullet(t) {
  checkPage(18);
  doc.font('CN').fontSize(10).fillColor('#333').text('•', 72, y, { width: 20 });
  doc.text(t, 90, y, { width: W - 30 });
  y += 16;
}

function numbered(n, t) {
  checkPage(18);
  doc.font('CN').fontSize(10).fillColor('#333').text(`${n}.`, 72, y, { width: 30 });
  doc.text(t, 95, y, { width: W - 35 });
  y += 16;
}

function tip(t) {
  checkPage(18);
  doc.font('CN').fontSize(9).fillColor('#666').text(`💡 ${t}`, 80, y, { width: W - 20, oblique: true });
  y += 16;
}

function tableRow(cols, isHeader, shading) {
  const colW = W / cols.length;
  const rowH = isHeader ? 22 : 18;
  checkPage(rowH + 4);
  
  if (shading) {
    doc.rect(60, y, W, rowH).fillColor(shading).fill();
  }
  
  cols.forEach((text, i) => {
    doc.font(isHeader ? 'CNB' : 'CN').fontSize(isHeader ? 9 : 9)
       .fillColor(isHeader ? '#FFF' : '#333')
       .text(text, 65 + i * colW, y + 3, { width: colW - 10 });
  });
  
  // Border
  doc.rect(60, y, W, rowH).strokeColor('#CCC').stroke();
  cols.forEach((_, i) => {
    doc.moveTo(60 + i * colW, y).lineTo(60 + i * colW, y + rowH).strokeColor('#CCC').stroke();
  });
  
  y += rowH;
}

function qa(q, a) {
  checkPage(40);
  doc.font('CNB').fontSize(10).fillColor('#333').text(q, 60, y);
  y += 16;
  doc.font('CN').fontSize(10).fillColor('#555').text(a, 80, y, { width: W - 20 });
  y += 30;
}

// ===== 封面 =====
y = 250;
title('记账本');
title('用户功能指引');
subtitle('v1.0 · 2026年9月');
subtitle('个人轻量级记账 PWA 应用');
doc.moveTo(160, y).lineTo(435, y).strokeColor('#1989FA').stroke();
y += 15;
subtitle('https://554489243.github.io/Bubu12Money');
doc.addPage();
y = 60;

// ===== 目录 =====
h1('目录');
const toc = [
  '一、应用简介', '二、安装到桌面', '三、明细页 — 查看账单',
  '四、统计页 — 图表分析', '五、记账页 — 记录收支',
  '六、工资单功能', '七、账本管理', '八、分类管理',
  '九、数据归档', '十、常见问题'
];
toc.forEach(t => p(t));
doc.addPage();
y = 60;

// ===== 一、应用简介 =====
h1('一、应用简介');
h2('1.1 产品特点');
bullet('完全免费：无广告、无内购、无服务器成本');
bullet('离线可用：数据存于浏览器，无需网络');
bullet('隐私安全：所有数据只在你的设备本地');
bullet('PWA 应用：可添加到桌面，像原生 App 一样使用');
bullet('跨平台：支持 iOS、Android、电脑浏览器');

h2('1.2 适用场景');
bullet('日常消费记账（餐饮、交通、购物等）');
bullet('工资收入记录（含工资单计算）');
bullet('多账本管理（日常、旅行、生意等分开记账）');
bullet('查看收支趋势和分类占比');
doc.addPage();
y = 60;

// ===== 二、安装到桌面 =====
h1('二、安装到桌面');
h2('2.1 iPhone / iPad（Safari）');
numbered(1, '打开 Safari 浏览器，访问应用网址');
numbered(2, '点击底部「分享」按钮（方框带向上箭头）');
numbered(3, '滑动找到「添加到主屏幕」');
numbered(4, '点击「添加」，图标将出现在桌面');

h2('2.2 Android（Chrome）');
numbered(1, '打开 Chrome 浏览器，访问应用网址');
numbered(2, '点击右上角「⋮」菜单');
numbered(3, '选择「添加到主屏幕」或「安装应用」');
numbered(4, '点击「添加」确认');

h2('2.3 电脑浏览器');
numbered(1, '打开 Chrome / Edge 浏览器');
numbered(2, '点击地址栏右侧的「⊕」或「安装」图标');
numbered(3, '点击「安装」确认');
tip('安装后，应用会像独立程序一样运行，没有浏览器地址栏。');
doc.addPage();
y = 60;

// ===== 三、明细页 =====
h1('三、明细页 — 查看账单');
p('打开应用后默认进入明细页，这里展示你的所有收支记录。');

h2('3.1 顶部区域');
bullet('账本选择器：点击切换账本，默认「全部」汇总所有账本');
bullet('月份选择：点击左右箭头切换月份，或点「全部」查看全部');

h2('3.2 概览卡片');
bullet('显示当前月的总支出、总收入和笔数');
bullet('点击月份选择器可切换查看不同月份');

h2('3.3 分类筛选');
bullet('第一行：一级分类横排显示，点击选中');
bullet('第二行：选中一级分类后，展开对应的二级分类');
bullet('选中二级分类后，列表只显示该分类的记录');

h2('3.4 账单列表');
bullet('按日期分组显示，每组有每日小计');
bullet('每条记录显示：分类图标、分类名称、金额、备注');
bullet('左滑可删除单条记录（需二次确认）');
bullet('点击记录可进入编辑页面');

h2('3.5 历史数据');
bullet('选择 1 个月前的月份时，自动加载历史归档数据');
bullet('历史数据只读显示，不可编辑或删除');
bullet('页面顶部显示「📦 历史数据（只读）」提示');
doc.addPage();
y = 60;

// ===== 四、统计页 =====
h1('四、统计页 — 图表分析');
p('点击底部「统计」标签进入图表分析页面。');

h2('4.1 视图切换');
bullet('本周：显示本周 7 天的收支趋势');
bullet('本月：显示本月每天的收支趋势');
bullet('本年：显示本年 12 个月的收支趋势');

h2('4.2 趋势图');
bullet('蓝色柱状图：支出');
bullet('绿色柱状图：收入');
bullet('随视图切换自动更新数据范围');

h2('4.3 饼图');
bullet('支出饼图：各支出分类占比');
bullet('收入饼图：各收入分类占比');
bullet('无数据时显示「暂无数据」提示');
doc.addPage();
y = 60;

// ===== 五、记账页 =====
h1('五、记账页 — 记录收支');
p('点击右下角「+」按钮进入记账页。');

h2('5.1 类型切换');
bullet('顶部切换「支出」或「收入」');
bullet('切换后分类列表自动更新');

h2('5.2 金额输入（计算器键盘）');
bullet('使用内置计算器键盘输入金额');
bullet('支持加减乘除四则运算（如 100+50*2）');
bullet('按「=」键计算结果');
bullet('按「C」键清空重新输入');
bullet('金额显示格式：￥10.88');
tip('键盘固定在底部，上方内容可滚动查看。');

h2('5.3 分类选择');
bullet('第一行：一级分类横排，点击选中');
bullet('第二行：选中一级后展开二级分类');
bullet('选中含默认金额的二级分类（如车贷 ¥3,000），自动填入计算器');
bullet('不选分类时，默认归入「其他」');

h2('5.4 其他信息');
bullet('日期：默认今天，可点击修改');
bullet('备注：可选输入');
bullet('账本：选择记在哪个账本（默认当前账本）');

h2('5.5 保存');
bullet('键盘右侧有「保存」按钮');
bullet('金额必须大于 0');
bullet('保存后自动返回明细页');
doc.addPage();
y = 60;

// ===== 六、工资单功能 =====
h1('六、工资单功能');
p('选择「工资」分类时，会自动弹出工资单编辑弹窗。');

h2('6.1 收入项目');
tableRow(['项目', '类型', '默认金额'], true);
tableRow(['基本工资', '收入', '¥5,100']);
tableRow(['电脑补贴', '收入', '¥200'], false, '#F0F7FF');
tableRow(['通讯补贴', '收入', '¥100']);
tableRow(['加班费', '收入', '¥0'], false, '#F0F7FF');
tableRow(['防暑费', '收入', '¥0']);
y += 8;

h2('6.2 扣除项目');
tableRow(['项目', '类型', '计算方式'], true);
tableRow(['请假扣除', '扣除', '手动输入']);
tableRow(['养老 8%', '扣除', '基本工资 × 8%'], false, '#F0F7FF');
tableRow(['医疗 2%', '扣除', '基本工资 × 2%']);
tableRow(['失业 0.5%', '扣除', '基本工资 × 0.5%'], false, '#F0F7FF');
tableRow(['公积金 12%', '扣除', '基本工资 × 12%']);
tableRow(['个税', '扣除', '按税率表计算'], false, '#F0F7FF');
y += 8;

h2('6.3 使用步骤');
numbered(1, '在记账页选择「收入」类型');
numbered(2, '选择「工资」下的二级分类');
numbered(3, '自动弹出工资单编辑弹窗');
numbered(4, '勾选/取消各项目，修改金额');
numbered(5, '点击确认，自动计算实发金额');
numbered(6, '确认后生成文本格式备注，保存到记账');
tip('修改后的默认值会自动保存，下次打开自动填充。');
doc.addPage();
y = 60;

// ===== 七、账本管理 =====
h1('七、账本管理');
p('点击「我的」→「账本管理」进入。');

h2('7.1 功能说明');
bullet('创建账本：名称 + 图标 + 颜色');
bullet('编辑账本：修改名称、图标、颜色');
bullet('删除账本：删除账本及其全部记录（需确认）');
bullet('排序：上移/下移调整显示顺序');
bullet('隐藏：隐藏后不在选择器中显示');

h2('7.2 默认账本');
bullet('首次使用自动创建「📱日常」账本');
bullet('默认账本固定在顶部，不可删除');
bullet('可设置其他账本为默认');
doc.addPage();
y = 60;

// ===== 八、分类管理 =====
h1('八、分类管理');
p('点击「我的」→「分类管理」进入。');

h2('8.1 支出分类');
tableRow(['分类', '图标', '分类', '图标', '默认金额'], true);
tableRow(['餐饮', '🍜', '交通', '🚙', '—']);
tableRow(['购物', '🛒', '居住', '🏠', '车贷 ¥3,000 / 房贷 ¥5,000'], false, '#F0F7FF');
tableRow(['娱乐', '🎮', '医疗', '💊', '—']);
tableRow(['教育', '📚', '其他', '📦', '—'], false, '#F0F7FF');
y += 8;

h2('8.2 收入分类');
bullet('工资（含基本工资、奖金、补贴等子类）');
bullet('理财（含利息、收益、分红等子类）');
bullet('其他');

h2('8.3 内置 vs 自定义');
bullet('内置分类（带「内置」标记）：不可删除/改名/改图标，但可改默认金额');
bullet('自定义分类：可自由增删改');
bullet('点击「+」添加新分类');
bullet('左滑删除自定义分类');
doc.addPage();
y = 60;

// ===== 九、数据归档 =====
h1('九、数据归档');
p('1 年前的记录会自动归档到历史表，保持应用运行轻量。');

h2('9.1 自动归档');
bullet('每次打开应用时自动检查');
bullet('归档条件：当前日期 - 1 年之前的记录');
bullet('归档后实时表更轻量，查询更快');

h2('9.2 手动归档');
bullet('点击「我的」→「数据归档」');
bullet('显示可归档的记录条数');
bullet('点击确认后执行归档');

h2('9.3 查看历史数据');
bullet('在明细页选择 1 个月前的月份');
bullet('自动从历史表加载数据');
bullet('历史数据只读，不可编辑或删除');
doc.addPage();
y = 60;

// ===== 十、常见问题 =====
h1('十、常见问题');

qa('Q1: 数据会丢失吗？', '数据存在浏览器本地（IndexedDB），只要不清除浏览器数据就不会丢失。建议定期归档旧数据。');
qa('Q2: 换了手机数据还在吗？', '数据只存在当前设备。如需迁移，请在旧设备导出数据（JSON），再在新设备导入。');
qa('Q3: 为什么有些分类不能删除？', '带「内置」标记的分类是系统预设的，不可删除/改名/改图标，但可以修改默认金额。');
qa('Q4: 工资单的默认值怎么改？', '在工资单弹窗中修改各项金额后，点击确认。修改后的值会自动保存为新的默认值。');
qa('Q5: 如何离线使用？', '将应用添加到桌面后，PWA 会自动缓存所有资源。即使没有网络，也可以正常记账和查看历史。');
qa('Q6: 应用更新后数据还在吗？', '在。PWA 更新只替换程序文件，IndexedDB 中的数据完全保留。');

y += 20;
doc.moveTo(160, y).lineTo(435, y).strokeColor('#1989FA').stroke();
y += 12;
doc.font('CN').fontSize(9).fillColor('#999').text('— 指引结束 —', 60, y, { align: 'center', width: W });

doc.end();
