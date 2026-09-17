<template>
  <div class="page manual-page">
    <div class="manual-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <h1>📖 用户手册</h1>
        <p>记账本使用指南</p>
      </div>
    </div>

    <div class="page-content">
      <!-- 一、设置账本 -->
      <section class="manual-section">
        <h2>一、设置账本</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h3>进入账本管理</h3>
              <p>点击底部「我的」→「账本管理」，进入账本列表页。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h3>新建账本</h3>
              <p>点击「新建账本」卡片，输入名称、选择图标和颜色，点击保存。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <h3>调整顺序</h3>
              <p>长按左侧 ⠿ 手柄拖动即可调整账本排序，默认账本始终置顶。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">4</div>
            <div class="step-content">
              <h3>切换账本</h3>
              <p>在首页或统计页顶部下拉选择账本，可筛选该账本的数据。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 二、设置分类与默认值 -->
      <section class="manual-section">
        <h2>二、设置分类与默认值</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h3>进入分类管理</h3>
              <p>点击「我的」→「分类管理」，可查看支出和收入分类。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h3>编辑默认金额</h3>
              <p>点击分类卡片，可修改该分类的默认金额。记账时选中该分类会自动填入金额。</p>
              <p class="tip">💡 例如：车贷设为 ￥3,000，每次选择车贷分类时金额自动填入。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <h3>新增自定义分类</h3>
              <p>点击「新建分类」，选择图标、颜色、名称，设置父分类即可。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 三、怎么记账 -->
      <section class="manual-section">
        <h2>三、怎么记账</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h3>进入记账页</h3>
              <p>点击底部「+」按钮，进入记账页面。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h3>选择类型</h3>
              <p>顶部切换「支出」或「收入」。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <h3>输入金额</h3>
              <p>使用内置计算器键盘输入金额，支持四则运算（如 100+50×2）。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">4</div>
            <div class="step-content">
              <h3>选择分类</h3>
              <p>选择一级分类后，再选择二级分类。有默认值的分类会自动填入金额。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">5</div>
            <div class="step-content">
              <h3>选择账本和日期</h3>
              <p>选择要记入的账本和消费日期，可添加备注。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">6</div>
            <div class="step-content">
              <h3>保存</h3>
              <p>点击键盘上的「保存」按钮完成记账。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 四、工资单 -->
      <section class="manual-section">
        <h2>四、工资单计算器</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h3>选择工资分类</h3>
              <p>记账时选择「工资」分类，会弹出工资单计算器。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h3>勾选项目</h3>
              <p>勾选要参与计算的工资项（基本工资、补贴、加班费等）。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <h3>自动计算</h3>
              <p>系统自动计算三金（养老、医疗、失业）、公积金、个税，显示实发工资。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">4</div>
            <div class="step-content">
              <h3>保存默认值</h3>
              <p>点击「保存默认值」按钮，下次打开自动填入上次的数值。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 五、数据同步 -->
      <section class="manual-section">
        <h2>五、数据同步</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h3>导出数据</h3>
              <p>点击「我的」→「导出数据」，生成 JSON 备份文件。</p>
              <p class="tip">⚠️ 注意：清理浏览器缓存会导致数据丢失！清缓存前请先将数据导出备份至手机。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h3>导入数据</h3>
              <p>点击「我的」→「导入数据」，选择 JSON 文件恢复数据。</p>
              <p class="tip">💡 导入采用智能合并，不会丢失现有数据。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <h3>自动备份</h3>
              <p>每月 1 号和 15 号打开应用时，系统会自动导出备份文件（同一天只备一次）。</p>
              <p class="tip">💡 自动备份仅限月初/月半，平时如需备份请手动「导出数据」。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 六、归档数据 -->
      <section class="manual-section">
        <h2>六、归档数据</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h3>什么是归档？</h3>
              <p>将 1 年前的记录移动到历史表，减少主表数据量，提升应用性能。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h3>归档后数据还在吗？</h3>
              <p>在的！归档后数据变为只读，可在明细页选择历史月份查看。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <h3>手动归档</h3>
              <p>点击「我的」→「数据归档」，可手动触发归档。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">4</div>
            <div class="step-content">
              <h3>自动归档</h3>
              <p>应用启动时会自动检查并归档超过 1 年的记录。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 七、其他功能 -->
      <section class="manual-section">
        <h2>七、其他功能</h2>
        <div class="manual-card">
          <div class="manual-step">
            <div class="step-num">📊</div>
            <div class="step-content">
              <h3>统计图表</h3>
              <p>查看收支趋势图和分类饼图，支持周/月/年切换。点击饼图可查看金额。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">🔍</div>
            <div class="step-content">
              <h3>明细筛选</h3>
              <p>可按分类、日期筛选记录，支持查看历史归档数据。</p>
            </div>
          </div>
          <div class="manual-step">
            <div class="step-num">📱</div>
            <div class="step-content">
              <h3>PWA 安装</h3>
              <p>在浏览器中打开应用，可添加到主屏幕，像原生 App 一样使用。</p>
            </div>
          </div>
        </div>
      </section>

      <div class="version-tag">记账本 v1.2.0</div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import TabBar from '@/components/TabBar.vue'
</script>

<style scoped>
.manual-page {
  background: var(--bg);
}

.manual-header {
  position: relative;
  padding: 24px 20px;
  overflow: hidden;
}
.header-bg {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(25,137,250,0.1), rgba(64,169,255,0.05));
}
.header-content {
  position: relative;
  z-index: 1;
}
.header-content h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}
.header-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 80px;
}

.manual-section {
  margin-bottom: 20px;
}
.manual-section h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--primary);
}

.manual-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow);
}

.manual-step {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.manual-step:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #40a9ff);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}
.step-content h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
}
.step-content p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}
.step-content .tip {
  margin-top: 6px;
  padding: 6px 10px;
  background: #fff7e6;
  border-radius: 6px;
  color: #d46b08;
  font-size: 12px;
}

.version-tag {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
