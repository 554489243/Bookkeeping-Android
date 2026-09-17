const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        LevelFormat, PageNumber, PageBreak, ShadingType, VerticalAlign } = require('docx');

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerShading = { fill: "1989FA", type: ShadingType.CLEAR };
const altShading = { fill: "F0F7FF", type: ShadingType.CLEAR };

function hCell(text, width) {
  return new TableCell({
    borders: cellBorders, width: { size: width, type: WidthType.DXA }, shading: headerShading,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22 })] })]
  });
}

function dCell(text, width, sh) {
  const c = { borders: cellBorders, width: { size: width, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text, size: 21 })] })] };
  if (sh) c.shading = sh;
  return new TableCell(c);
}

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function h3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] }); }
function p(t) { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, size: 22 })] }); }
function bl(t, ref) { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 22 })] }); }
function num(t, ref) { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 22 })] }); }
function tip(t) { return new Paragraph({ spacing: { before: 80, after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: "💡 ", size: 22 }), new TextRun({ text: t, size: 22, italics: true, color: "666666" })] }); }
function brk() { return new Paragraph({ children: [new PageBreak()] }); }
function sp() { return new Paragraph({ spacing: { before: 2000 } }); }

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", quickFormat: true,
        run: { size: 48, bold: true, color: "1989FA", font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER } },
      { id: "Subtitle", name: "Subtitle", basedOn: "Normal", quickFormat: true,
        run: { size: 28, color: "999999", font: "Microsoft YaHei" },
        paragraph: { spacing: { after: 400 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1989FA", font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: "333333", font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "555555", font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b4", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b5", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b6", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b7", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b8", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b9", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b10", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b11", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b12", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b13", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b14", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b15", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n6", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "记账本 · 用户指引", size: 18, color: "999999" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "第 ", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" }), new TextRun({ text: " 页 / 共 ", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "999999" }), new TextRun({ text: " 页", size: 18, color: "999999" })] })] }) },
    children: [
      // ===== 封面 =====
      sp(),
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("记账本")] }),
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("用户功能指引")] }),
      new Paragraph({ heading: "Subtitle", children: [new TextRun("v1.0 · 2026年9月")] }),
      new Paragraph({ heading: "Subtitle", children: [new TextRun("个人轻量级记账 PWA 应用")] }),
      brk(),

      // ===== 目录 =====
      h1("目录"),
      p("一、应用简介"), p("二、安装到桌面"), p("三、明细页 — 查看账单"),
      p("四、统计页 — 图表分析"), p("五、记账页 — 记录收支"),
      p("六、工资单功能"), p("七、账本管理"), p("八、分类管理"),
      p("九、数据归档"), p("十、常见问题"),
      brk(),

      // ===== 一、应用简介 =====
      h1("一、应用简介"),
      h2("1.1 产品特点"),
      bl("完全免费：无广告、无内购、无服务器成本", "b1"),
      bl("离线可用：数据存于浏览器，无需网络", "b1"),
      bl("隐私安全：所有数据只在你的设备本地", "b1"),
      bl("PWA 应用：可添加到桌面，像原生 App 一样使用", "b1"),
      bl("跨平台：支持 iOS、Android、电脑浏览器", "b1"),
      h2("1.2 适用场景"),
      bl("日常消费记账（餐饮、交通、购物等）", "b2"),
      bl("工资收入记录（含工资单计算）", "b2"),
      bl("多账本管理（日常、旅行、生意等分开记账）", "b2"),
      bl("查看收支趋势和分类占比", "b2"),
      brk(),

      // ===== 二、安装到桌面 =====
      h1("二、安装到桌面"),
      h2("2.1 iPhone / iPad（Safari）"),
      num("打开 Safari 浏览器，访问应用网址", "n1"),
      num("点击底部「分享」按钮（方框带向上箭头）", "n1"),
      num("滑动找到「添加到主屏幕」", "n1"),
      num("点击「添加」，图标将出现在桌面", "n1"),
      h2("2.2 Android（Chrome）"),
      num("打开 Chrome 浏览器，访问应用网址", "n2"),
      num("点击右上角「⋮」菜单", "n2"),
      num("选择「添加到主屏幕」或「安装应用」", "n2"),
      num("点击「添加」确认", "n2"),
      h2("2.3 电脑浏览器"),
      num("打开 Chrome / Edge 浏览器", "n3"),
      num("点击地址栏右侧的「⊕」或「安装」图标", "n3"),
      num("点击「安装」确认", "n3"),
      tip("安装后，应用会像独立程序一样运行，没有浏览器地址栏。"),
      brk(),

      // ===== 三、明细页 =====
      h1("三、明细页 — 查看账单"),
      p("打开应用后默认进入明细页，这里展示你的所有收支记录。"),
      h2("3.1 顶部区域"),
      bl("账本选择器：点击切换账本，默认「全部」汇总所有账本", "b3"),
      bl("月份选择：点击左右箭头切换月份，或点「全部」查看全部", "b3"),
      h2("3.2 概览卡片"),
      bl("显示当前月的总支出、总收入和笔数", "b4"),
      bl("点击月份选择器可切换查看不同月份", "b4"),
      h2("3.3 分类筛选"),
      bl("第一行：一级分类横排显示，点击选中", "b5"),
      bl("第二行：选中一级分类后，展开对应的二级分类", "b5"),
      bl("选中二级分类后，列表只显示该分类的记录", "b5"),
      h2("3.4 账单列表"),
      bl("按日期分组显示，每组有每日小计", "b6"),
      bl("每条记录显示：分类图标、分类名称、金额、备注", "b6"),
      bl("左滑可删除单条记录（需二次确认）", "b6"),
      bl("点击记录可进入编辑页面", "b6"),
      h2("3.5 历史数据"),
      bl("选择 1 个月前的月份时，自动加载历史归档数据", "b7"),
      bl("历史数据只读显示，不可编辑或删除", "b7"),
      bl("页面顶部显示「📦 历史数据（只读）」提示", "b7"),
      brk(),

      // ===== 四、统计页 =====
      h1("四、统计页 — 图表分析"),
      p("点击底部「统计」标签进入图表分析页面。"),
      h2("4.1 视图切换"),
      bl("本周：显示本周 7 天的收支趋势", "b8"),
      bl("本月：显示本月每天的收支趋势", "b8"),
      bl("本年：显示本年 12 个月的收支趋势", "b8"),
      h2("4.2 趋势图"),
      bl("蓝色柱状图：支出", "b9"),
      bl("绿色柱状图：收入", "b9"),
      bl("随视图切换自动更新数据范围", "b9"),
      h2("4.3 饼图"),
      bl("支出饼图：各支出分类占比", "b10"),
      bl("收入饼图：各收入分类占比", "b10"),
      bl("无数据时显示「暂无数据」提示", "b10"),
      brk(),

      // ===== 五、记账页 =====
      h1("五、记账页 — 记录收支"),
      p("点击右下角「+」按钮进入记账页。"),
      h2("5.1 类型切换"),
      bl("顶部切换「支出」或「收入」", "b11"),
      bl("切换后分类列表自动更新", "b11"),
      h2("5.2 金额输入（计算器键盘）"),
      bl("使用内置计算器键盘输入金额", "b12"),
      bl("支持加减乘除四则运算（如 100+50*2）", "b12"),
      bl("按「=」键计算结果", "b12"),
      bl("按「C」键清空重新输入", "b12"),
      bl("金额显示格式：￥10.88", "b12"),
      tip("键盘固定在底部，上方内容可滚动查看。"),
      h2("5.3 分类选择"),
      bl("第一行：一级分类横排，点击选中", "b13"),
      bl("第二行：选中一级后展开二级分类", "b13"),
      bl("选中含默认金额的二级分类（如车贷 ¥3,000），自动填入计算器", "b13"),
      bl("不选分类时，默认归入「其他」", "b13"),
      h2("5.4 其他信息"),
      bl("日期：默认今天，可点击修改", "b14"),
      bl("备注：可选输入", "b14"),
      bl("账本：选择记在哪个账本（默认当前账本）", "b14"),
      h2("5.5 保存"),
      bl("键盘右侧有「保存」按钮", "b15"),
      bl("金额必须大于 0", "b15"),
      bl("保存后自动返回明细页", "b15"),
      brk(),

      // ===== 六、工资单功能 =====
      h1("六、工资单功能"),
      p("选择「工资」分类时，会自动弹出工资单编辑弹窗。"),
      h2("6.1 收入项目"),
      new Table({
        columnWidths: [3120, 3120, 3120],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [hCell("项目", 3120), hCell("类型", 3120), hCell("默认金额", 3120)] }),
          new TableRow({ children: [dCell("基本工资", 3120), dCell("收入", 3120), dCell("¥5,100", 3120)] }),
          new TableRow({ children: [dCell("电脑补贴", 3120, altShading), dCell("收入", 3120, altShading), dCell("¥200", 3120, altShading)] }),
          new TableRow({ children: [dCell("通讯补贴", 3120), dCell("收入", 3120), dCell("¥100", 3120)] }),
          new TableRow({ children: [dCell("加班费", 3120, altShading), dCell("收入", 3120, altShading), dCell("¥0", 3120, altShading)] }),
          new TableRow({ children: [dCell("防暑费", 3120), dCell("收入", 3120), dCell("¥0", 3120)] }),
        ]
      }),
      h2("6.2 扣除项目"),
      new Table({
        columnWidths: [3120, 3120, 3120],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [hCell("项目", 3120), hCell("类型", 3120), hCell("计算方式", 3120)] }),
          new TableRow({ children: [dCell("请假扣除", 3120), dCell("扣除", 3120), dCell("手动输入", 3120)] }),
          new TableRow({ children: [dCell("养老 8%", 3120, altShading), dCell("扣除", 3120, altShading), dCell("基本工资 × 8%", 3120, altShading)] }),
          new TableRow({ children: [dCell("医疗 2%", 3120), dCell("扣除", 3120), dCell("基本工资 × 2%", 3120)] }),
          new TableRow({ children: [dCell("失业 0.5%", 3120, altShading), dCell("扣除", 3120, altShading), dCell("基本工资 × 0.5%", 3120, altShading)] }),
          new TableRow({ children: [dCell("公积金 12%", 3120), dCell("扣除", 3120), dCell("基本工资 × 12%", 3120)] }),
          new TableRow({ children: [dCell("个税", 3120, altShading), dCell("扣除", 3120, altShading), dCell("按税率表计算", 3120, altShading)] }),
        ]
      }),
      h2("6.3 使用步骤"),
      num("在记账页选择「收入」类型", "n4"),
      num("选择「工资」下的二级分类", "n4"),
      num("自动弹出工资单编辑弹窗", "n4"),
      num("勾选/取消各项目，修改金额", "n4"),
      num("点击确认，自动计算实发金额", "n4"),
      num("确认后生成文本格式备注，保存到记账", "n4"),
      tip("修改后的默认值会自动保存，下次打开自动填充。"),
      brk(),

      // ===== 七、账本管理 =====
      h1("七、账本管理"),
      p("点击「我的」→「账本管理」进入。"),
      h2("7.1 功能说明"),
      bl("创建账本：名称 + 图标 + 颜色", "b1"),
      bl("编辑账本：修改名称、图标、颜色", "b1"),
      bl("删除账本：删除账本及其全部记录（需确认）", "b1"),
      bl("排序：上移/下移调整显示顺序", "b1"),
      bl("隐藏：隐藏后不在选择器中显示", "b1"),
      h2("7.2 默认账本"),
      bl("首次使用自动创建「📱日常」账本", "b2"),
      bl("默认账本固定在顶部，不可删除", "b2"),
      bl("可设置其他账本为默认", "b2"),
      brk(),

      // ===== 八、分类管理 =====
      h1("八、分类管理"),
      p("点击「我的」→「分类管理」进入。"),
      h2("8.1 支出分类"),
      new Table({
        columnWidths: [1800, 1800, 1800, 1800, 2160],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({ tableHeader: true, children: [hCell("分类", 1800), hCell("图标", 1800), hCell("分类", 1800), hCell("图标", 1800), hCell("默认金额", 2160)] }),
          new TableRow({ children: [dCell("餐饮", 1800), dCell("🍜", 1800), dCell("交通", 1800), dCell("🚙", 1800), dCell("—", 2160)] }),
          new TableRow({ children: [dCell("购物", 1800, altShading), dCell("🛒", 1800, altShading), dCell("居住", 1800, altShading), dCell("🏠", 1800, altShading), dCell("车贷 ¥3,000 / 房贷 ¥5,000", 2160, altShading)] }),
          new TableRow({ children: [dCell("娱乐", 1800), dCell("🎮", 1800), dCell("医疗", 1800), dCell("💊", 1800), dCell("—", 2160)] }),
          new TableRow({ children: [dCell("教育", 1800, altShading), dCell("📚", 1800, altShading), dCell("其他", 1800, altShading), dCell("📦", 1800, altShading), dCell("—", 2160, altShading)] }),
        ]
      }),
      h2("8.2 收入分类"),
      bl("工资（含基本工资、奖金、补贴等子类）", "b3"),
      bl("理财（含利息、收益、分红等子类）", "b3"),
      bl("其他", "b3"),
      h2("8.3 内置 vs 自定义"),
      bl("内置分类（带「内置」标记）：不可删除/改名/改图标，但可改默认金额", "b4"),
      bl("自定义分类：可自由增删改", "b4"),
      bl("点击「+」添加新分类", "b4"),
      bl("左滑删除自定义分类", "b4"),
      brk(),

      // ===== 九、数据归档 =====
      h1("九、数据归档"),
      p("1 年前的记录会自动归档到历史表，保持应用运行轻量。"),
      h2("9.1 自动归档"),
      bl("每次打开应用时自动检查", "b5"),
      bl("归档条件：当前日期 - 1 年之前的记录", "b5"),
      bl("归档后实时表更轻量，查询更快", "b5"),
      h2("9.2 手动归档"),
      bl("点击「我的」→「数据归档」", "b6"),
      bl("显示可归档的记录条数", "b6"),
      bl("点击确认后执行归档", "b6"),
      h2("9.3 查看历史数据"),
      bl("在明细页选择 1 个月前的月份", "b7"),
      bl("自动从历史表加载数据", "b7"),
      bl("历史数据只读，不可编辑或删除", "b7"),
      brk(),

      // ===== 十、常见问题 =====
      h1("十、常见问题"),
      h2("Q1: 数据会丢失吗？"),
      new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: "数据存在浏览器本地（IndexedDB），只要不清除浏览器数据就不会丢失。建议定期归档旧数据。", size: 22 })] }),
      h2("Q2: 换了手机数据还在吗？"),
      new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: "数据只存在当前设备。如需迁移，请在旧设备导出数据（JSON），再在新设备导入。", size: 22 })] }),
      h2("Q3: 为什么有些分类不能删除？"),
      new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: "带「内置」标记的分类是系统预设的，不可删除/改名/改图标，但可以修改默认金额。", size: 22 })] }),
      h2("Q4: 工资单的默认值怎么改？"),
      new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: "在工资单弹窗中修改各项金额后，点击确认。修改后的值会自动保存为新的默认值。", size: 22 })] }),
      h2("Q5: 如何离线使用？"),
      new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: "将应用添加到桌面后，PWA 会自动缓存所有资源。即使没有网络，也可以正常记账和查看历史。", size: 22 })] }),
      h2("Q6: 应用更新后数据还在吗？"),
      new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: "在。PWA 更新只替换程序文件，IndexedDB 中的数据完全保留。", size: 22 })] }),

      new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "— 指引结束 —", size: 22, color: "999999", italics: true })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:/myData/demo/Bookkeeping/docs/记账本用户指引.docx", buffer);
  console.log("Done!");
});
