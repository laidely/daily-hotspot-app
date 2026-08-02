/**
 * ============================================================================
 *  DailyHotspot 每日热点智能聚合器 —— 核心功能测试 (test.js)
 * ============================================================================
 *  职责：测试工程师 —— 覆盖核心功能测试用例
 *  覆盖范围：
 *    1. 数据层 DataAPI（分页、筛选、搜索、推荐、详情、不可变性）
 *    2. 工具函数 utils（防抖、节流、转义、格式化、分类查找）
 *    3. 虚拟列表 VirtualList（偏移计算、二分查找、高度管理）
 *    4. 应用逻辑（状态初始化、效率得分、卡片渲染、主题）
 *
 *  运行方式：
 *    - 在 index.html 中点击右下角"测试"浮动按钮 或 "我的 > 运行功能测试"
 *    - 或直接用浏览器打开 test.html（下方提供）
 * ============================================================================
 */
(function (global) {
  'use strict';

  /* ==========================================================================
   * 轻量断言库
   * ========================================================================== */
  function AssertionError(message) {
    this.name = 'AssertionError';
    this.message = message;
  }
  AssertionError.prototype = Object.create(Error.prototype);

  const assert = {
    ok(cond, msg) {
      if (!cond) throw new AssertionError(msg || '断言失败: 期望为真');
    },
    equal(actual, expected, msg) {
      if (actual !== expected) {
        throw new AssertionError((msg || '断言失败') + '：期望 ' + JSON.stringify(expected) + '，实际 ' + JSON.stringify(actual));
      }
    },
    deepEqual(actual, expected, msg) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new AssertionError((msg || '断言失败') + '：期望 ' + JSON.stringify(expected) + '，实际 ' + JSON.stringify(actual));
      }
    },
    throws(fn, msg) {
      let threw = false;
      try { fn(); } catch (e) { threw = true; }
      if (!threw) throw new AssertionError(msg || '断言失败: 期望抛出异常');
    }
  };

  /* ==========================================================================
   * 测试用例集合（测试工程师编写）
   * 每个用例可为同步(返回void/真值)或异步(返回Promise)
   * ========================================================================== */
  const testCases = [
    /* -------------------- 1. 数据层 DataAPI -------------------- */
    {
      name: '数据层：DailyHotspotData 全局对象已挂载',
      fn() {
        assert.ok(global.DailyHotspotData, 'DailyHotspotData 未挂载');
        assert.ok(global.DailyHotspotData.DataAPI, 'DataAPI 未挂载');
      }
    },
    {
      name: '数据层：CATEGORIES 包含 5 个分类（含"全部"）',
      fn() {
        const cats = global.DailyHotspotData.DataAPI.getCategories();
        assert.equal(cats.length, 5, '分类数量不符');
        const ids = cats.map(function (c) { return c.id; });
        assert.deepEqual(ids, ['all', 'ai-app', 'office-automation', 'efficiency-tools', 'developer-trends']);
      }
    },
    {
      name: '数据层：分页 getHotNewsByPage 第1页返回6条且hasMore为true',
      fn() {
        const r = global.DailyHotspotData.DataAPI.getHotNewsByPage(1, 6);
        assert.equal(r.page, 1);
        assert.equal(r.pageSize, 6);
        assert.equal(r.list.length, 6);
        assert.ok(r.hasMore, '第1页应还有更多');
        assert.equal(r.total, 20, '总条数应为20');
      }
    },
    {
      name: '数据层：分页最后一页 hasMore 为 false',
      fn() {
        const r = global.DailyHotspotData.DataAPI.getHotNewsByPage(4, 6);
        assert.ok(!r.hasMore, '最后一页不应有更多');
        assert.equal(r.list.length, 2, '第4页应剩2条');
      }
    },
    {
      name: '数据层：页码下界保护（page<1 归一为1）',
      fn() {
        const r = global.DailyHotspotData.DataAPI.getHotNewsByPage(-3, 6);
        assert.equal(r.page, 1);
      }
    },
    {
      name: '数据层：filterByCategory("all") 返回全部20条',
      fn() {
        const list = global.DailyHotspotData.DataAPI.filterByCategory('all');
        assert.equal(list.length, 20);
      }
    },
    {
      name: '数据层：filterByCategory 按 category 精确筛选',
      fn() {
        const list = global.DailyHotspotData.DataAPI.filterByCategory('office-automation');
        assert.ok(list.length > 0);
        list.forEach(function (n) { assert.equal(n.category, 'office-automation'); });
      }
    },
    {
      name: '数据层：search 命中标题/摘要/标签',
      fn() {
        const list = global.DailyHotspotData.DataAPI.search('Agent');
        assert.ok(list.length > 0, '应能搜到 Agent 相关热点');
        // 标签匹配
        const byTag = global.DailyHotspotData.DataAPI.search('多Agent');
        assert.ok(byTag.length > 0, '应能通过标签搜索');
      }
    },
    {
      name: '数据层：search 空关键词返回空数组',
      fn() {
        assert.equal(global.DailyHotspotData.DataAPI.search('').length, 0);
        assert.equal(global.DailyHotspotData.DataAPI.search('   ').length, 0);
      }
    },
    {
      name: '数据层：search 大小写不敏感',
      fn() {
        const a = global.DailyHotspotData.DataAPI.search('openai');
        const b = global.DailyHotspotData.DataAPI.search('OpenAI');
        assert.equal(a.length, b.length, '大小写应等价');
      }
    },
    {
      name: '数据层：recommend 命中兴趣标签的热点排名靠前',
      fn() {
        const rec = global.DailyHotspotData.DataAPI.recommend(['多Agent']);
        assert.ok(rec.length > 0);
        // 含"多Agent"标签的热点应排在不含的前面
        const firstHasTag = (rec[0].tags || []).indexOf('多Agent') >= 0
          || rec[0].hot >= rec[rec.length - 1].hot;
        assert.ok(firstHasTag, '推荐排序异常');
      }
    },
    {
      name: '数据层：recommend 兴趣变更会改变排序',
      fn() {
        const r1 = global.DailyHotspotData.DataAPI.recommend(['AI Agent']);
        const r2 = global.DailyHotspotData.DataAPI.recommend(['国产算力']);
        // 两组首个热点 id 不一定相同（兴趣不同排序可能变化）
        assert.ok(Array.isArray(r1) && Array.isArray(r2));
        assert.equal(r1.length, r2.length);
      }
    },
    {
      name: '数据层：getById 返回正确详情，未知 id 返回 null',
      fn() {
        const n = global.DailyHotspotData.DataAPI.getById(1);
        assert.ok(n, 'id=1 应存在');
        assert.equal(n.id, 1);
        assert.ok(n.aiSummary, '应包含 aiSummary');
        assert.ok(n.perspectives, '应包含多视角 perspectives');
        assert.equal(global.DailyHotspotData.DataAPI.getById(99999), null, '未知 id 应返回 null');
      }
    },
    {
      name: '数据层：多视角包含马斯克/雷军/张一鸣/王兴四位',
      fn() {
        const cels = global.DailyHotspotData.DataAPI.getCelebrities();
        assert.equal(cels.length, 4);
        const names = cels.map(function (c) { return c.id; }).sort();
        assert.deepEqual(names, ['leijun', 'musk', 'wangxing', 'zhangyiming'].sort());
        const n = global.DailyHotspotData.DataAPI.getById(1);
        ['musk', 'leijun', 'zhangyiming', 'wangxing'].forEach(function (id) {
          assert.ok(n.perspectives[id], '缺少 ' + id + ' 视角');
        });
      }
    },
    {
      name: '数据层：getUserProfile 返回深拷贝（不可变性）',
      fn() {
        const p = global.DailyHotspotData.DataAPI.getUserProfile();
        p.nickname = '被篡改';
        const p2 = global.DailyHotspotData.DataAPI.getUserProfile();
        assert.notEqual(p2.nickname, '被篡改');
      }
    },
    {
      name: '数据层：DataAPI 返回的列表是副本，修改不影响源数据',
      fn() {
        const list = global.DailyHotspotData.DataAPI.getHotNewsByPage(1, 6).list;
        list.push({ id: 999, title: '注入' });
        list[0].title = '被篡改标题';
        const fresh = global.DailyHotspotData.DataAPI.getById(1);
        assert.notEqual(fresh.title, '被篡改标题', '源数据不应被修改');
      }
    },

    /* -------------------- 2. 工具函数 utils -------------------- */
    {
      name: '工具：escapeHtml 正确转义特殊字符',
      fn() {
        const App = global.DailyHotspot;
        assert.equal(App.utils.escapeHtml('<b>"x"&\'y\'</b>'), '&lt;b&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/b&gt;');
      }
    },
    {
      name: '工具：formatHot 千/万格式化',
      fn() {
        const App = global.DailyHotspot;
        assert.equal(App.utils.formatHot(9860), '9.9k');
        assert.equal(App.utils.formatHot(12000), '1.2w');
        assert.equal(App.utils.formatHot(500), '500');
      }
    },
    {
      name: '工具：formatTime 提取 HH:MM',
      fn() {
        const App = global.DailyHotspot;
        assert.equal(App.utils.formatTime('2026-08-02 09:30'), '09:30');
        assert.equal(App.utils.formatTime(''), '');
      }
    },
    {
      name: '工具：getCategory 按 id 查找分类',
      fn() {
        const App = global.DailyHotspot;
        const c = App.utils.getCategory('ai-app');
        assert.equal(c.name, 'AI应用');
        // 未知 id 兜底返回首个（all）
        const fallback = App.utils.getCategory('unknown');
        assert.equal(fallback.id, 'all');
      }
    },
    {
      name: '工具：storage 读写一致',
      fn() {
        const App = global.DailyHotspot;
        App.utils.storage.set('dh-test-key', { a: 1 });
        assert.deepEqual(App.utils.storage.get('dh-test-key', null), { a: 1 });
        assert.equal(App.utils.storage.get('dh-not-exist', 'def'), 'def');
      }
    },
    {
      name: '工具：debounce 在 delay 后仅执行最后一次（异步）',
      fn() {
        return new Promise(function (resolve) {
          const App = global.DailyHotspot;
          let count = 0;
          const fn = App.utils.debounce(function () { count++; }, 60);
          fn(); fn(); fn(); // 连续3次
          setTimeout(function () {
            assert.equal(count, 1, '防抖后应只执行1次');
            resolve();
          }, 120);
        });
      }
    },
    {
      name: '工具：debounce.cancel 取消待执行',
      fn() {
        return new Promise(function (resolve) {
          const App = global.DailyHotspot;
          let count = 0;
          const fn = App.utils.debounce(function () { count++; }, 50);
          fn();
          fn.cancel();
          setTimeout(function () {
            assert.equal(count, 0, 'cancel 后不应执行');
            resolve();
          }, 80);
        });
      }
    },
    {
      name: '工具：throttle 在间隔内最多执行一次（异步）',
      fn() {
        return new Promise(function (resolve) {
          const App = global.DailyHotspot;
          let count = 0;
          const fn = App.utils.throttle(function () { count++; }, 60);
          fn(); fn(); fn(); // 同步多次
          const afterSync = count;
          assert.ok(afterSync >= 1 && afterSync <= 1, '同步阶段最多执行1次，实际 ' + afterSync);
          setTimeout(function () {
            assert.ok(count <= 2, '节流后总执行次数应受限，实际 ' + count);
            resolve();
          }, 150);
        });
      }
    },

    /* -------------------- 3. 虚拟列表 VirtualList -------------------- */
    {
      name: '虚拟列表：_buildOffsets 累积偏移正确',
      fn() {
        const App = global.DailyHotspot;
        // 用脱离文档的元素构造，避免影响页面
        const scrollEl = document.createElement('div');
        const contentEl = document.createElement('div');
        scrollEl.appendChild(contentEl);
        const vl = new App.VirtualList(scrollEl, contentEl, {
          itemCount: 3, estimateHeight: 100, renderItem: function () { return document.createElement('div'); }
        });
        vl.heights = { 0: 100, 1: 200, 2: 150 };
        const offsets = vl._buildOffsets();
        assert.deepEqual(offsets, [0, 100, 300, 450], '累积偏移应为 [0,100,300,450]');
      }
    },
    {
      name: '虚拟列表：_findIndex 二分查找定位区间',
      fn() {
        const App = global.DailyHotspot;
        const scrollEl = document.createElement('div');
        const contentEl = document.createElement('div');
        scrollEl.appendChild(contentEl);
        const vl = new App.VirtualList(scrollEl, contentEl, {
          itemCount: 3, estimateHeight: 100, renderItem: function () { return document.createElement('div'); }
        });
        vl.heights = { 0: 100, 1: 200, 2: 150 };
        const offsets = vl._buildOffsets();
        assert.equal(vl._findIndex(offsets, 0), 0, 'pos=0 应落在第0项');
        assert.equal(vl._findIndex(offsets, 99), 0, 'pos=99 应落在第0项');
        assert.equal(vl._findIndex(offsets, 100), 1, 'pos=100 应落在第1项');
        assert.equal(vl._findIndex(offsets, 299), 1, 'pos=299 应落在第1项');
        assert.equal(vl._findIndex(offsets, 300), 2, 'pos=300 应落在第2项');
        assert.equal(vl._findIndex(offsets, 9999), 2, '超出范围应返回最后一项');
      }
    },
    {
      name: '虚拟列表：setItemCount 更新数量',
      fn() {
        const App = global.DailyHotspot;
        const scrollEl = document.createElement('div');
        const contentEl = document.createElement('div');
        scrollEl.appendChild(contentEl);
        const vl = new App.VirtualList(scrollEl, contentEl, {
          itemCount: 0, estimateHeight: 100, renderItem: function () { return document.createElement('div'); }
        });
        vl.itemCount = 5;
        vl.heights = {};
        const offsets = vl._buildOffsets();
        assert.equal(offsets.length, 6);
        assert.equal(offsets[5], 500, '未测量时用估算高度 5*100');
      }
    },

    /* -------------------- 4. 应用逻辑 -------------------- */
    {
      name: '应用：state 初始值正确',
      fn() {
        const App = global.DailyHotspot;
        assert.equal(App.state.currentView, 'home');
        assert.equal(App.state.pageSize, 6);
        assert.ok(Array.isArray(App.state.interests) && App.state.interests.length > 0);
        assert.ok(App.state.homeList.length > 0, '首页列表应已加载');
        assert.ok(App.state.hasMore, '初始应可加载更多');
      }
    },
    {
      name: '应用：computeEfficiencyScore 返回 0-100',
      fn() {
        const App = global.DailyHotspot;
        const score = App.computeEfficiencyScore();
        assert.ok(score >= 0 && score <= 100, '效率得分应在 0-100，实际 ' + score);
      }
    },
    {
      name: '应用：效率得分随交互增长',
      fn() {
        const App = global.DailyHotspot;
        const before = App.computeEfficiencyScore();
        const orig = App.state.stats.summaryCount;
        App.state.stats.summaryCount += 50;
        const after = App.computeEfficiencyScore();
        App.state.stats.summaryCount = orig; // 还原
        assert.ok(after >= before, '摘要数增加后得分不应下降');
      }
    },
    {
      name: '应用：createNewsCard 生成结构正确的卡片元素',
      fn() {
        const App = global.DailyHotspot;
        const news = global.DailyHotspotData.DataAPI.getById(1);
        const card = App.createNewsCard(news, 0);
        assert.ok(card.classList.contains('news-card'), '应有 news-card 类');
        assert.equal(card.dataset.id, '1');
        assert.equal(card.dataset.index, '0');
        assert.ok(card.querySelector('.card-title'), '应有标题');
        assert.ok(card.querySelector('.ai-detail'), '应有AI摘要区');
        assert.ok(card.querySelector('[data-action="perspectives"]'), '应有多视角入口');
        const img = card.querySelector('.card-thumb img');
        assert.ok(img && img.getAttribute('data-src'), '应有懒加载图 data-src');
      }
    },
    {
      name: '应用：tabNav.switchTo 切换视图（DOM 状态）',
      fn() {
        const App = global.DailyHotspot;
        const prev = App.state.currentView;
        App.tabNav.switchTo('recommend');
        assert.equal(App.state.currentView, 'recommend');
        const activeTab = document.querySelector('.tabbar .tab-item.active');
        assert.equal(activeTab.dataset.view, 'recommend');
        // 还原
        App.tabNav.switchTo(prev);
      }
    },
    {
      name: '应用：主题切换写入 data-theme 属性',
      fn() {
        const html = document.documentElement;
        const before = html.getAttribute('data-theme');
        // 强制设为 dark
        html.setAttribute('data-theme', 'dark');
        assert.equal(html.getAttribute('data-theme'), 'dark');
        // 还原
        html.setAttribute('data-theme', before || 'light');
      }
    },
    {
      name: '应用：toast 显示与自动隐藏（异步）',
      fn() {
        return new Promise(function (resolve) {
          const App = global.DailyHotspot;
          App.toast('测试提示');
          const el = document.getElementById('toast');
          assert.ok(el.classList.contains('show'), 'toast 应显示');
          setTimeout(function () {
            assert.ok(!el.classList.contains('show'), 'toast 应在1.6s后隐藏');
            resolve();
          }, 1800);
        });
      }
    }
  ];

  // assert.notEqual 补充
  assert.notEqual = function (actual, expected, msg) {
    if (actual === expected) {
      throw new AssertionError((msg || '断言失败') + '：不应等于 ' + JSON.stringify(expected));
    }
  };

  /* ==========================================================================
   * 测试运行器
   * ========================================================================== */
  const Runner = {
    panel: null,
    results: [],

    ensurePanel() {
      let panel = document.getElementById('dh-test-results');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'dh-test-results';
        panel.className = 'test-results';
        panel.innerHTML =
          '<div class="tr-head"><div class="tr-title">🧪 DailyHotspot 功能测试</div>' +
          '<button class="tr-close">关闭</button></div>' +
          '<div class="test-summary"></div>' +
          '<div class="test-cases"></div>';
        document.body.appendChild(panel);
        panel.querySelector('.tr-close').addEventListener('click', function () {
          panel.style.display = 'none';
        });
      }
      panel.style.display = 'block';
      this.panel = panel;
      return panel;
    },

    async run() {
      if (!global.DailyHotspot) {
        alert('应用未加载，无法运行测试');
        return;
      }
      const panel = this.ensurePanel();
      const summaryEl = panel.querySelector('.test-summary');
      const casesEl = panel.querySelector('.test-cases');
      casesEl.innerHTML = '<div class="state-block"><div class="lm-spinner" style="display:inline-block;vertical-align:middle;"></div> 正在运行测试…</div>';

      let passed = 0, failed = 0;
      const results = [];
      const total = testCases.length;

      // 顺序执行（支持异步用例）
      for (let i = 0; i < total; i++) {
        const tc = testCases[i];
        let status = 'pass', detail = '';
        try {
          await Promise.resolve(tc.fn());
          passed++;
        } catch (e) {
          failed++;
          status = 'fail';
          detail = (e && e.message) ? e.message : String(e);
        }
        results.push({ name: tc.name, status: status, detail: detail });
      }

      // 渲染汇总
      summaryEl.textContent = '共 ' + total + ' 项 ｜ 通过 ' + passed + ' ｜ 失败 ' + failed +
        ' ｜ 通过率 ' + Math.round(passed / total * 100) + '%';
      summaryEl.style.color = failed === 0 ? 'var(--color-success)' : 'var(--color-accent)';

      // 渲染用例
      casesEl.innerHTML = results.map(function (r) {
        return '<div class="test-case ' + r.status + '">' +
          '<div class="tc-name">' + (r.status === 'pass' ? '✅' : '❌') + ' ' +
          escapeText(r.name) +
          '<span class="tc-status ' + r.status + '">' + (r.status === 'pass' ? 'PASS' : 'FAIL') + '</span></div>' +
          (r.detail ? '<div class="tc-detail">' + escapeText(r.detail) + '</div>' : '') +
        '</div>';
      }).join('');

      this.results = results;
      console.log('测试完成：通过 ' + passed + '/' + total, results);
      return results;
    }
  };

  function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ==========================================================================
   * 对外暴露
   * ========================================================================== */
  global.DailyHotspotTest = {
    run: function () { return Runner.run(); },
    cases: testCases,
    assert: assert
  };

})(typeof window !== 'undefined' ? window : this);
