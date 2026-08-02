/**
 * ============================================================================
 *  DailyHotspot 每日热点智能聚合器 —— 核心逻辑 (app.js)
 * ============================================================================
 *  职责：渲染、交互、性能优化
 *  团队角色：
 *    - 前端开发者：H5 页面交互实现（Tab 切换、卡片、弹窗、搜索）
 *    - 移动端架构师：响应式适配与性能优化（虚拟列表、懒加载、防抖节流、下拉刷新）
 *    - IT 项目经理：状态管理与视图编排
 *
 *  性能优化清单（移动端架构师）：
 *    1. 虚拟列表 VirtualList —— 仅渲染可视区域卡片
 *    2. 图片懒加载 LazyLoader —— IntersectionObserver 按需加载
 *    3. 防抖 debounce —— 搜索输入
 *    4. 节流 throttle + rAF —— 滚动与下拉
 *    5. 事件委托 —— 列表点击
 *    6. 离屏 DOM 复用 —— 虚拟列表复用节点
 * ============================================================================
 */
(function (global) {
  'use strict';

  /* ==========================================================================
   * 一、工具函数库 utils（前端开发者 / 移动端架构师共建）
   * ========================================================================== */
  const utils = {
    /** 防抖：延迟 delay 后执行，期间再次触发则重置计时 */
    debounce(fn, delay) {
      let timer = null;
      const debounced = function () {
        const ctx = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
      };
      debounced.cancel = function () { clearTimeout(timer); };
      return debounced;
    },

    /** 节流：每 delay ms 最多执行一次 */
    throttle(fn, delay) {
      let last = 0, timer = null;
      return function () {
        const ctx = this, args = arguments, now = Date.now();
        const remain = delay - (now - last);
        if (remain <= 0) {
          clearTimeout(timer); timer = null;
          last = now; fn.apply(ctx, args);
        } else if (!timer) {
          timer = setTimeout(function () {
            last = Date.now(); timer = null; fn.apply(ctx, args);
          }, remain);
        }
      };
    },

    /** HTML 转义，防止 XSS（数据虽为 mock，仍保持工程习惯） */
    escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /** 格式化热度数值：9860 -> 9.9k */
    formatHot(n) {
      n = +n || 0;
      if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return String(n);
    },

    /** 时间友好显示：截取 HH:MM */
    formatTime(t) {
      if (!t) return '';
      const m = /(\d{2}:\d{2})$/.exec(t);
      return m ? m[1] : t;
    },

    /** localStorage 封装（不可用时自动降级到内存存储，保证健壮性） */
    storage: (function () {
      const memory = Object.create(null);
      let lsAvailable = false;
      // 探测 localStorage 是否可用（隐私模式 / file:// opaque origin 下可能抛错）
      try {
        const testKey = '__dh_ls_test__';
        global.localStorage.setItem(testKey, '1');
        global.localStorage.removeItem(testKey);
        lsAvailable = true;
      } catch (e) {
        lsAvailable = false;
      }
      return {
        get(key, def) {
          try {
            if (lsAvailable) {
              const v = global.localStorage.getItem(key);
              return v === null ? def : JSON.parse(v);
            }
          } catch (e) { /* 降级到内存 */ }
          return (key in memory) ? JSON.parse(memory[key]) : def;
        },
        set(key, val) {
          const str = JSON.stringify(val);
          try {
            if (lsAvailable) { global.localStorage.setItem(key, str); return; }
          } catch (e) { /* 降级到内存 */ }
          memory[key] = str;
        }
      };
    })(),

    /** 根据 categoryId 获取分类对象 */
    getCategory(id) {
      const list = global.DailyHotspotData.CATEGORIES;
      for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return list[0];
    },

    /** 生成热点卡片缩略图（SVG data URI，离线可用） */
    thumbDataUri(news) {
      const colorMap = {
        'ai-app': '#7c5cff',
        'office-automation': '#0bb6a6',
        'efficiency-tools': '#f5a623',
        'developer-trends': '#ff6b6b'
      };
      const c = colorMap[news.category] || '#5b6cff';
      const title = utils.escapeHtml((news.title || '').slice(0, 16));
      const svg =
        "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'>" +
        "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
        "<stop offset='0' stop-color='" + c + "' stop-opacity='0.9'/>" +
        "<stop offset='1' stop-color='#5b6cff' stop-opacity='0.75'/>" +
        "</linearGradient></defs>" +
        "<rect width='400' height='200' fill='url(#g)'/>" +
        "<text x='22' y='70' fill='#fff' font-size='34' font-weight='bold' font-family='sans-serif'>#" + news.id + "</text>" +
        "<text x='22' y='150' fill='#fff' font-size='18' font-family='sans-serif'>" + title + "</text>" +
        "</svg>";
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
  };

  /* ==========================================================================
   * 二、全局状态 state（IT 项目经理：状态管理）
   * ========================================================================== */
  const D = global.DailyHotspotData;
  const baseStats = D.USER_PROFILE.stats;

  const state = {
    currentView: 'home',
    currentCategory: 'all',     // 首页当前分类筛选
    selectedCategory: 'all',    // 分类页当前分类
    searchKeyword: '',
    homeMode: 'feed',           // 'feed' 分页虚拟列表 | 'search' 搜索结果

    // 首页分页
    page: 1,
    pageSize: 6,
    hasMore: true,
    loading: false,
    homeList: [],

    // 用户兴趣（可编辑，影响推荐）
    interests: D.USER_PROFILE.interests.slice(),

    // 效率统计（随交互实时增长）
    stats: {
      readCount: baseStats.readCount,
      summaryCount: baseStats.summaryCount,
      favoriteCount: baseStats.favoriteCount,
      perspectiveView: baseStats.perspectiveView
    },
    readIds: new Set()          // 已"深度阅读"的热点 id 集合
  };

  /* ==========================================================================
   * 三、DOM 引用（集中获取，避免重复查询）
   * ========================================================================== */
  const dom = {};
  function cacheDom() {
    [
      'app', 'appMain', 'searchBox', 'searchInput', 'searchClear', 'themeToggle',
      'categoryBar', 'newsList', 'loadMore', 'pullRefresh',
      'categoryGrid', 'categoryNewsList',
      'recBannerDesc', 'interestTags', 'recList',
      'metricsGrid', 'barChart', 'donut', 'donutLegend',
      'profileCard', 'profileStats', 'scoreVal', 'scoreFill',
      'tabbar', 'modalMask', 'sheetTitle', 'sheetSub', 'sheetBody', 'toast',
      'test-panel'
    ].forEach(function (id) {
      dom[toCamel(id)] = document.getElementById(id);
    });
    // 视图容器
    dom.views = {};
    document.querySelectorAll('.view-container').forEach(function (v) {
      dom.views[v.dataset.view] = v;
    });
    dom.homeInner = dom.views.home.querySelector('.view-inner');
  }
  function toCamel(s) {
    return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }

  /* ==========================================================================
   * 四、主题管理 theme
   * ========================================================================== */
  const theme = {
    init() {
      const saved = utils.storage.get('dh-theme', null);
      const prefersDark = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;
      this.apply(saved || (prefersDark ? 'dark' : 'light'));
    },
    apply(name) {
      document.documentElement.setAttribute('data-theme', name);
      dom.themeToggle.textContent = name === 'dark' ? '☀️' : '🌙';
      utils.storage.set('dh-theme', name);
    },
    toggle() {
      const cur = document.documentElement.getAttribute('data-theme');
      this.apply(cur === 'dark' ? 'light' : 'dark');
      toast('已切换至' + (cur === 'dark' ? '浅色' : '深色') + '主题');
    }
  };

  /* ==========================================================================
   * 五、Toast 轻提示
   * ========================================================================== */
  let toastTimer = null;
  function toast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      dom.toast.classList.remove('show');
    }, 1600);
  }

  /* ==========================================================================
   * 六、图片懒加载 LazyLoader（移动端架构师：性能优化）
   *    使用 IntersectionObserver 监听 img[data-src]，进入视口才加载
   * ========================================================================== */
  const lazyLoader = {
    io: null,
    init() {
      if (!('IntersectionObserver' in global)) {
        // 降级：直接加载全部
        this.loadAll = true;
        return;
      }
      this.io = new IntersectionObserver(this._onIntersect.bind(this), {
        rootMargin: '200px 0px',   // 提前 200px 预加载
        threshold: 0.01
      });
    },
    observe(img) {
      if (!img) return;
      if (this.loadAll) { this._load(img); return; }
      this.io.observe(img);
    },
    _onIntersect(entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          lazyLoader._load(entry.target);
          lazyLoader.io.unobserve(entry.target);
        }
      });
    },
    _load(img) {
      const src = img.getAttribute('data-src');
      if (!src) return;
      img.onload = function () { img.classList.add('loaded'); };
      img.onerror = function () { img.classList.add('loaded'); };
      // 微延迟，强化"懒加载"视觉演示
      setTimeout(function () { img.setAttribute('src', src); }, 80);
    }
  };

  /* ==========================================================================
   * 七、热点卡片渲染 createNewsCard（前端开发者）
   * ========================================================================== */
  function createNewsCard(news, index) {
    const cat = utils.getCategory(news.category);
    const card = document.createElement('div');
    card.className = 'news-card fade-in-up';
    card.dataset.id = news.id;
    if (typeof index === 'number') card.dataset.index = index;

    card.innerHTML =
      '<div class="card-head">' +
        '<span class="news-tag" data-cat="' + news.category + '">' + cat.icon + ' ' + cat.name + '</span>' +
        '<span class="hot-rank">🔥 ' + utils.formatHot(news.hot) + '</span>' +
      '</div>' +
      '<div class="card-title">' + utils.escapeHtml(news.title) + '</div>' +
      '<div class="card-summary">' + utils.escapeHtml(news.summary) + '</div>' +
      '<div class="card-thumb">' +
        '<img alt="' + utils.escapeHtml(news.title) + '" />' +
      '</div>' +
      // AI 深度摘要（展开区）
      '<div class="ai-detail"><div class="ai-detail-inner">' +
        '<div class="ai-label">🤖 AI 深度摘要</div>' +
        '<div class="ai-text">' + utils.escapeHtml(news.aiSummary) + '</div>' +
      '</div></div>' +
      // 多视角解读入口
      '<div class="perspectives-trigger" data-action="perspectives">' +
        '<span>👁️ ' + D.CELEBRITIES.length + '位大咖怎么看？</span>' +
        '<span class="avatars">' +
          D.CELEBRITIES.map(function (c) { return '<span>' + c.avatar + '</span>'; }).join('') +
        '</span>' +
      '</div>' +
      '<div class="card-foot">' +
        '<span class="meta">📰 ' + utils.escapeHtml(news.source) + '</span>' +
        '<span class="meta">⏱ ' + utils.formatTime(news.publishTime) + '</span>' +
        '<button class="ai-btn" data-action="toggle-ai">🤖 AI摘要</button>' +
      '</div>';

    // 懒加载缩略图
    const img = card.querySelector('.card-thumb img');
    img.setAttribute('data-src', utils.thumbDataUri(news));
    lazyLoader.observe(img);

    return card;
  }

  /* ==========================================================================
   * 八、虚拟列表 VirtualList（移动端架构师：性能优化核心）
   *    原理：仅渲染可视区域 + 缓冲区的卡片，用 translateY 定位，
   *          动态测量真实高度并缓存，支持变高卡片（如展开摘要）。
   * ========================================================================== */
  class VirtualList {
    /**
     * @param {HTMLElement} scrollEl 滚动容器
     * @param {HTMLElement} contentEl 列表内容容器
     * @param {Object} options { itemCount, estimateHeight, bufferSize, renderItem }
     */
    constructor(scrollEl, contentEl, options) {
      this.scrollEl = scrollEl;
      this.contentEl = contentEl;
      this.itemCount = options.itemCount || 0;
      this.estimateHeight = options.estimateHeight || 200;
      this.bufferSize = options.bufferSize || 4;
      this.renderItem = options.renderItem;
      this.heights = {};        // index -> 实测高度
      this.rendered = {};       // index -> 已渲染元素
      this._raf = null;
      this._disabled = false;   // 禁用标志：简单列表模式下暂停虚拟渲染
      this._onScroll = this._onScroll.bind(this);
      this.scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
      // 强制单列布局，避免 grid 干扰绝对定位
      this.contentEl.style.display = 'block';
      this.contentEl.style.position = 'relative';
    }

    /** 禁用虚拟渲染（切换到简单列表模式前调用） */
    disable() {
      this._disabled = true;
      this._clearRendered();
      this.contentEl.style.height = '';
    }

    /** 启用虚拟渲染（回到分页模式时调用） */
    enable() {
      this._disabled = false;
      this.render();
    }

    _heightOf(i) { return this.heights[i] || this.estimateHeight; }

    /** 构建累积偏移数组 offsets[i] = 第 i 项顶部位置 */
    _buildOffsets() {
      const offsets = new Array(this.itemCount + 1);
      offsets[0] = 0;
      for (let i = 0; i < this.itemCount; i++) {
        offsets[i + 1] = offsets[i] + this._heightOf(i);
      }
      return offsets;
    }

    /** 二分查找 pos 落在哪一项区间 [offsets[i], offsets[i+1]) */
    _findIndex(offsets, pos) {
      if (pos <= 0) return 0;
      let lo = 0, hi = this.itemCount;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (offsets[mid + 1] <= pos) lo = mid + 1;
        else hi = mid;
      }
      return Math.min(lo, Math.max(0, this.itemCount - 1));
    }

    _onScroll() {
      if (this._raf || this._disabled) return;
      this._raf = requestAnimationFrame(function () {
        this._raf = null;
        this.render();
      }.bind(this));
    }

    /** 主渲染：计算可视区间并增删 DOM */
    render() {
      if (this._disabled) return;
      if (this.itemCount === 0) {
        this.contentEl.style.height = '0px';
        this._clearRendered();
        return;
      }
      const offsets = this._buildOffsets();
      const totalHeight = offsets[this.itemCount];
      this.contentEl.style.height = totalHeight + 'px';

      // 计算 contentEl 在滚动坐标系中的顶部位置
      const sRect = this.scrollEl.getBoundingClientRect();
      const cRect = this.contentEl.getBoundingClientRect();
      const contentTop = cRect.top - sRect.top + this.scrollEl.scrollTop;
      const viewH = this.scrollEl.clientHeight;
      const startPos = this.scrollEl.scrollTop - contentTop;
      const endPos = startPos + viewH;

      let start = this._findIndex(offsets, Math.max(0, startPos)) - this.bufferSize;
      let end = this._findIndex(offsets, endPos) + this.bufferSize + 1;
      start = Math.max(0, start);
      end = Math.min(this.itemCount, end);

      // 移除区间外的元素
      Object.keys(this.rendered).forEach(function (k) {
        const i = +k;
        if (i < start || i >= end) {
          const el = this.rendered[i];
          if (el && el.parentNode) el.parentNode.removeChild(el);
          delete this.rendered[i];
        }
      }.bind(this));

      // 创建/更新区间内元素
      for (let i = start; i < end; i++) {
        let el = this.rendered[i];
        if (!el) {
          el = this.renderItem(i);
          el.style.position = 'absolute';
          el.style.left = '0';
          el.style.right = '0';
          el.style.top = '0';
          el.style.willChange = 'transform';
          this.contentEl.appendChild(el);
          this.rendered[i] = el;
        }
        el.style.transform = 'translateY(' + offsets[i] + 'px)';
      }

      // 测量真实高度，若变化则修正布局
      let changed = false;
      for (let i = start; i < end; i++) {
        const el = this.rendered[i];
        if (el) {
          const h = el.offsetHeight;
          if (h && (!this.heights[i] || Math.abs(this.heights[i] - h) > 1)) {
            this.heights[i] = h;
            changed = true;
          }
        }
      }
      if (changed) {
        const newOffsets = this._buildOffsets();
        this.contentEl.style.height = newOffsets[this.itemCount] + 'px';
        for (let i = start; i < end; i++) {
          const el = this.rendered[i];
          if (el) el.style.transform = 'translateY(' + newOffsets[i] + 'px)';
        }
      }
    }

    _clearRendered() {
      Object.keys(this.rendered).forEach(function (k) {
        const el = this.rendered[k];
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }.bind(this));
      this.rendered = {};
    }

    /** 追加项数（保留已测高度） */
    setItemCount(n) {
      this.itemCount = n;
      this.render();
    }

    /** 重置（下拉刷新用：清空高度缓存与已渲染节点） */
    reset() {
      this.heights = {};
      this._clearRendered();
      this.render();
    }

    /** 重新测量某项（展开/收起后调用） */
    measure(index) {
      const el = this.rendered[index];
      if (el) {
        this.heights[index] = el.offsetHeight;
        this.render();
      }
    }

    scrollToTop() {
      this.scrollEl.scrollTop = 0;
      this.render();
    }
  }

  /* ==========================================================================
   * 九、首页视图 homeView（热点信息流 + 分页 + 虚拟列表 + 下拉刷新）
   * ========================================================================== */
  const homeView = {
    vlist: null,

    init() {
      this.renderCategoryBar();
      // 分类条事件仅绑定一次（避免重渲染导致监听器重复累积）
      dom.categoryBar.addEventListener('click', this._onCategoryClick.bind(this));
      // 首次加载第 1 页
      const r = D.DataAPI.getHotNewsByPage(1, state.pageSize);
      state.homeList = r.list;
      state.page = 1;
      state.hasMore = r.hasMore;
      state.loading = false;

      // 创建虚拟列表
      this.vlist = new VirtualList(dom.views.home, dom.newsList, {
        itemCount: state.homeList.length,
        estimateHeight: 230,
        bufferSize: 3,
        renderItem: function (i) {
          return createNewsCard(state.homeList[i], i);
        }
      });
      this.vlist.render();

      // 上拉加载（节流）
      dom.views.home.addEventListener('scroll', utils.throttle(this._onScroll.bind(this), 200), { passive: true });

      // 事件委托：卡片内点击
      dom.newsList.addEventListener('click', this._onClick.bind(this));
    },

    renderCategoryBar() {
      // 仅更新 innerHTML，不重复绑定事件
      dom.categoryBar.innerHTML = D.CATEGORIES.map(function (c) {
        return '<button class="category-chip' + (c.id === state.currentCategory ? ' active' : '') +
          '" data-cat="' + c.id + '"><span class="chip-icon">' + c.icon + '</span>' + c.name + '</button>';
      }).join('');
    },

    _onCategoryClick(e) {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;
      state.currentCategory = chip.dataset.cat;
      this.renderCategoryBar();
      this.applyCategoryFilter();
    },

    /** 分类筛选：在首页切换为筛选模式（全量渲染筛选结果） */
    applyCategoryFilter() {
      // 仅当无筛选且无搜索关键词时才回到分页虚拟列表
      state.homeMode = (state.currentCategory === 'all' && !state.searchKeyword) ? 'feed' : 'filter';
      if (state.homeMode === 'feed') {
        // 清除简单模式残留的静态卡片，恢复虚拟列表
        dom.newsList.innerHTML = '';
        dom.loadMore.style.display = state.hasMore ? 'none' : 'block';
        if (!state.hasMore) dom.loadMore.innerHTML = '已经到底啦 ~';
        this.vlist.enable();
      } else {
        this._renderSimpleList();
      }
    },

    _renderSimpleList() {
      // 暂停虚拟列表渲染，避免滚动时注入虚拟卡片
      this.vlist.disable();
      dom.loadMore.style.display = 'none';

      let items;
      if (state.searchKeyword) {
        items = D.DataAPI.search(state.searchKeyword);
      } else {
        items = D.DataAPI.filterByCategory(state.currentCategory);
      }
      dom.newsList.innerHTML = items.length
        ? items.map(function (n, i) { return createNewsCard(n).outerHTML; }).join('')
        : emptyState('未找到相关热点', '🔍');
      // innerHTML 重建后重新挂载懒加载
      dom.newsList.querySelectorAll('img[data-src]').forEach(function (img) { lazyLoader.observe(img); });
    },

    _onClick(e) {
      const card = e.target.closest('.news-card');
      if (!card) return;
      const id = +card.dataset.id;

      if (e.target.closest('[data-action="toggle-ai"]')) {
        // 展开/收起 AI 摘要
        card.classList.toggle('expanded');
        state.stats.summaryCount += card.classList.contains('expanded') ? 1 : 0;
        if (card.classList.contains('expanded')) state.readIds.add(id);
        // 虚拟列表模式下重新测量该项高度
        if (state.homeMode === 'feed' && this.vlist) {
          const idx = +card.dataset.index;
          if (!isNaN(idx)) this.vlist.measure(idx);
        }
        return;
      }

      if (e.target.closest('[data-action="perspectives"]')) {
        state.stats.perspectiveView += 1;
        const news = D.DataAPI.getById(id);
        if (news) perspectivesModal.open(news);
        return;
      }

      // 点击卡片其它区域：默认展开摘要
      if (!e.target.closest('.ai-detail') && !card.classList.contains('expanded')) {
        card.classList.add('expanded');
        state.stats.summaryCount += 1;
        state.readIds.add(id);
        if (state.homeMode === 'feed' && this.vlist) {
          const idx = +card.dataset.index;
          if (!isNaN(idx)) this.vlist.measure(idx);
        }
      }
    },

    _onScroll() {
      if (state.homeMode !== 'feed') return;
      const el = dom.views.home;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        this.loadMore();
      }
    },

    /** 上拉加载更多 */
    loadMore() {
      if (state.loading || !state.hasMore) return;
      state.loading = true;
      dom.loadMore.style.display = 'block';
      // 模拟网络延迟
      setTimeout(function () {
        state.page += 1;
        const r = D.DataAPI.getHotNewsByPage(state.page, state.pageSize);
        state.homeList = state.homeList.concat(r.list);
        state.hasMore = r.hasMore;
        state.loading = false;
        dom.loadMore.style.display = state.hasMore ? 'none' : 'block';
        if (!state.hasMore) dom.loadMore.innerHTML = '已经到底啦 ~';
        homeView.vlist.setItemCount(state.homeList.length);
      }, 600);
    },

    /** 下拉刷新 */
    refresh() {
      state.page = 1;
      const r = D.DataAPI.getHotNewsByPage(1, state.pageSize);
      state.homeList = r.list;
      state.hasMore = r.hasMore;
      dom.loadMore.innerHTML = '<span class="lm-spinner"></span> 正在加载更多...';
      dom.loadMore.style.display = state.hasMore ? 'none' : 'block';
      this.vlist.reset();
      this.vlist.scrollToTop();
      toast('已刷新今日热点');
    },

    /** 进入首页视图时回调 */
    onActivate() {
      if (this.vlist) this.vlist.render();
    }
  };

  /* ==========================================================================
   * 十、分类视图 categoryView
   * ========================================================================== */
  const categoryView = {
    init() {
      this.renderGrid();
      this.renderList();
    },
    renderGrid() {
      const all = D.DataAPI.getAllHotNews();
      dom.categoryGrid.innerHTML = '<div class="metrics-grid">' + D.CATEGORIES.map(function (c) {
        if (c.id === 'all') return '';
        const count = all.filter(function (n) { return n.category === c.id; }).length;
        return '<div class="metric-tile" data-cat="' + c.id + '" style="cursor:pointer;">' +
          '<div class="mt-icon">' + c.icon + '</div>' +
          '<div class="mt-val">' + count + '</div>' +
          '<div class="mt-label">' + c.name + '</div>' +
        '</div>';
      }).join('') + '</div>';
      dom.categoryGrid.querySelector('.metrics-grid').addEventListener('click', function (e) {
        const tile = e.target.closest('.metric-tile');
        if (!tile) return;
        state.selectedCategory = tile.dataset.cat;
        categoryView.renderList();
        dom.categoryNewsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    renderList() {
      const items = D.DataAPI.filterByCategory(state.selectedCategory);
      const cat = utils.getCategory(state.selectedCategory);
      dom.categoryNewsList.innerHTML = items.length
        ? items.map(function (n) { return createNewsCard(n).outerHTML; }).join('')
        : emptyState('该分类暂无热点', '🗂️');
      dom.categoryNewsList.querySelectorAll('img[data-src]').forEach(function (img) { lazyLoader.observe(img); });
      dom.categoryNewsList.onclick = this._onClick.bind(this);
      // 提示当前分类
      if (!dom._catTip) {
        dom._catTip = document.createElement('div');
        dom._catTip.style.cssText = 'font-size:12px;color:var(--text-tertiary);margin-bottom:8px;';
        dom.categoryNewsList.parentNode.insertBefore(dom._catTip, dom.categoryNewsList);
      }
      dom._catTip.textContent = state.selectedCategory === 'all'
        ? '当前：全部分类'
        : '当前分类：' + cat.icon + ' ' + cat.name + '（共 ' + items.length + ' 条）';
    },
    _onClick(e) {
      const card = e.target.closest('.news-card');
      if (!card) return;
      const id = +card.dataset.id;
      if (e.target.closest('[data-action="toggle-ai"]')) {
        card.classList.toggle('expanded');
        if (card.classList.contains('expanded')) { state.stats.summaryCount += 1; state.readIds.add(id); }
        return;
      }
      if (e.target.closest('[data-action="perspectives"]')) {
        state.stats.perspectiveView += 1;
        const news = D.DataAPI.getById(id);
        if (news) perspectivesModal.open(news);
        return;
      }
      if (!card.classList.contains('expanded')) {
        card.classList.add('expanded');
        state.stats.summaryCount += 1;
        state.readIds.add(id);
      }
    },
    onActivate() {}
  };

  /* ==========================================================================
   * 十一、推荐视图 recommendView（个性化推荐 + 效率仪表盘）
   * ========================================================================== */
  const recommendView = {
    init() {
      this.renderInterests();
      this.renderList();
      this.renderDashboard();
    },
    renderInterests() {
      dom.interestTags.innerHTML = D.INTEREST_TAGS.map(function (tag) {
        const selected = state.interests.indexOf(tag) >= 0;
        return '<button class="interest-tag' + (selected ? ' selected' : '') + '" data-tag="' +
          utils.escapeHtml(tag) + '">' + utils.escapeHtml(tag) + '</button>';
      }).join('');
      dom.interestTags.onclick = function (e) {
        const btn = e.target.closest('.interest-tag');
        if (!btn) return;
        const tag = btn.dataset.tag;
        const idx = state.interests.indexOf(tag);
        if (idx >= 0) {
          if (state.interests.length <= 1) { toast('至少保留 1 个兴趣标签'); return; }
          state.interests.splice(idx, 1);
        } else {
          state.interests.push(tag);
        }
        utils.storage.set('dh-interests', state.interests);
        recommendView.renderInterests();
        recommendView.renderList();
        toast('兴趣已更新，推荐已重排');
      };
    },
    renderList() {
      const items = D.DataAPI.recommend(state.interests);
      dom.recBannerDesc.textContent = '基于 ' + state.interests.length + ' 个兴趣标签，已为你智能排序 ' + items.length + ' 条热点';
      dom.recList.innerHTML = items.map(function (n) { return createNewsCard(n).outerHTML; }).join('');
      dom.recList.querySelectorAll('img[data-src]').forEach(function (img) { lazyLoader.observe(img); });
      dom.recList.onclick = this._onClick.bind(this);
    },
    _onClick(e) {
      const card = e.target.closest('.news-card');
      if (!card) return;
      const id = +card.dataset.id;
      if (e.target.closest('[data-action="toggle-ai"]')) {
        card.classList.toggle('expanded');
        if (card.classList.contains('expanded')) { state.stats.summaryCount += 1; state.readIds.add(id); }
        return;
      }
      if (e.target.closest('[data-action="perspectives"]')) {
        state.stats.perspectiveView += 1;
        const news = D.DataAPI.getById(id);
        if (news) perspectivesModal.open(news);
        return;
      }
      if (!card.classList.contains('expanded')) {
        card.classList.add('expanded');
        state.stats.summaryCount += 1;
        state.readIds.add(id);
      }
    },
    renderDashboard() {
      const s = state.stats;
      const score = computeEfficiencyScore();

      // 关键指标
      dom.metricsGrid.innerHTML =
        metricTile('📚', s.readCount + state.readIds.size, '累计阅读') +
        metricTile('🤖', s.summaryCount, 'AI摘要生成') +
        metricTile('👁️', s.perspectiveView, '多视角查看') +
        metricTile('⭐', score, '效率得分');

      // 柱状图
      const daily = D.EFFICIENCY_STATS.dailyRead;
      const max = Math.max.apply(null, daily);
      dom.barChart.innerHTML = daily.map(function (v, i) {
        const h = Math.round((v / max) * 100);
        return '<div class="bar-col"><div class="bar" style="height:0"></div><div class="bar-label">D' + (i + 1) + '</div></div>';
      }).join('');
      // 动画展开
      requestAnimationFrame(function () {
        const bars = dom.barChart.querySelectorAll('.bar');
        bars.forEach(function (b, i) {
          setTimeout(function () { b.style.height = Math.round((daily[i] / max) * 100) + '%'; }, i * 60);
        });
      });

      // 环形图（conic-gradient 动态生成）
      const pref = D.EFFICIENCY_STATS.categoryPreference;
      const colorMap = { 'AI应用': '#7c5cff', '开发者趋势': '#ff6b6b', '效率工具': '#f5a623', '办公自动化': '#0bb6a6' };
      let cum = 0;
      const segs = pref.map(function (p) {
        const seg = colorMap[p.name] + ' ' + cum + '% ' + (cum + p.value) + '%';
        cum += p.value;
        return seg;
      }).join(', ');
      dom.donut.style.background = 'conic-gradient(' + segs + ')';
      dom.donut.setAttribute('data-score', score + '分');
      dom.donutLegend.innerHTML = pref.map(function (p) {
        return '<div class="legend-item"><span class="legend-dot" style="background:' + colorMap[p.name] + '"></span>' +
          p.name + '<span class="legend-val">' + p.value + '%</span></div>';
      }).join('');
    },
    onActivate() {
      this.renderDashboard(); // 重新计算实时指标
    }
  };

  function metricTile(icon, val, label) {
    return '<div class="metric-tile"><div class="mt-icon">' + icon + '</div>' +
      '<div class="mt-val">' + val + '</div><div class="mt-label">' + label + '</div></div>';
  }

  /** 计算效率得分（0-100）：综合阅读、摘要、多视角、分类均衡 */
  function computeEfficiencyScore() {
    const s = state.stats;
    const readScore = Math.min(40, (s.readCount + state.readIds.size) / 200 * 40);
    const summaryScore = Math.min(30, s.summaryCount / 60 * 30);
    const perspScore = Math.min(20, s.perspectiveView / 60 * 20);
    const balanceScore = 10; // 均衡分（固定鼓励）
    return Math.round(readScore + summaryScore + perspScore + balanceScore);
  }

  /* ==========================================================================
   * 十二、我的视图 mineView
   * ========================================================================== */
  const mineView = {
    init() {
      this.render();
      // 菜单事件委托
      document.querySelector('.menu-list').addEventListener('click', this._onMenu.bind(this));
    },
    render() {
      const u = D.USER_PROFILE;
      const s = state.stats;
      dom.profileCard.innerHTML =
        '<div class="pc-avatar-lg">' + u.avatar + '</div>' +
        '<div class="pc-info"><div class="pc-name">' + u.nickname + '</div>' +
        '<div class="pc-level">' + u.level + '</div></div>';
      dom.profileStats.innerHTML =
        psTile(s.readCount + state.readIds.size, '阅读') +
        psTile(s.summaryCount, '摘要') +
        psTile(s.perspectiveView, '多视角') +
        psTile(s.favoriteCount, '收藏');
      const score = computeEfficiencyScore();
      dom.scoreVal.textContent = score;
      requestAnimationFrame(function () { dom.scoreFill.style.width = score + '%'; });
    },
    _onMenu(e) {
      const item = e.target.closest('.menu-item');
      if (!item) return;
      const action = item.dataset.action;
      switch (action) {
        case 'theme': theme.toggle(); break;
        case 'interests': tabNav.switchTo('recommend'); toast('请在推荐页管理兴趣标签'); break;
        case 'refresh': tabNav.switchTo('home'); homeView.refresh(); break;
        case 'test': global.DailyHotspotTest && global.DailyHotspotTest.run(); break;
        case 'about':
          toast('DailyHotspot v1.0 · 每日热点智能聚合器');
          break;
      }
    },
    onActivate() { this.render(); }
  };
  function psTile(val, label) {
    return '<div class="profile-stat"><div class="ps-val">' + val + '</div><div class="ps-label">' + label + '</div></div>';
  }

  /* ==========================================================================
   * 十三、多视角解读弹窗 perspectivesModal（前端开发者）
   * ========================================================================== */
  const perspectivesModal = {
    open(news) {
      dom.sheetTitle.textContent = '多视角解读';
      dom.sheetSub.textContent = news.title;
      dom.sheetBody.innerHTML = D.CELEBRITIES.map(function (c) {
        const text = news.perspectives[c.id] || '暂无观点';
        return '<div class="perspective-card" style="border-left-color:' + c.color + '">' +
          '<div class="pc-avatar" style="color:' + c.color + '">' + c.avatar + '</div>' +
          '<div class="pc-body">' +
            '<div class="pc-head"><span class="pc-name">' + c.name + '</span><span class="pc-title">' + c.title + '</span></div>' +
            '<div class="pc-style">' + c.style + '</div>' +
            '<div class="pc-text">' + utils.escapeHtml(text) + '</div>' +
          '</div></div>';
      }).join('');
      dom.modalMask.classList.add('show');
    },
    close() { dom.modalMask.classList.remove('show'); },
    init() {
      dom.modalMask.addEventListener('click', function (e) {
        if (e.target === dom.modalMask) perspectivesModal.close();
      });
    }
  };

  /* ==========================================================================
   * 十四、下拉刷新 pullRefresh（移动端架构师：原生触感）
   * ========================================================================== */
  const pullRefresh = {
    startY: 0,
    pulling: false,
    distance: 0,
    threshold: 70,
    init() {
      const el = dom.views.home;
      const pr = dom.pullRefresh;
      el.addEventListener('touchstart', this._onStart.bind(this), { passive: true });
      el.addEventListener('touchmove', this._onMove.bind(this), { passive: false });
      el.addEventListener('touchend', this._onEnd.bind(this), { passive: true });
    },
    _onStart(e) {
      if (dom.views.home.scrollTop > 0 || state.homeMode !== 'feed') return;
      this.startY = e.touches[0].clientY;
      this.pulling = true;
      this.distance = 0;
    },
    _onMove(e) {
      if (!this.pulling) return;
      const dy = e.touches[0].clientY - this.startY;
      if (dy <= 0) { this.distance = 0; return; }
      // 阻尼
      this.distance = Math.min(dy * 0.5, 100);
      if (this.distance > 0) e.preventDefault();
      dom.homeInner.style.transition = 'none';
      dom.homeInner.style.transform = 'translateY(' + this.distance + 'px)';
      prUpdate(this.distance, this.threshold);
    },
    _onEnd() {
      if (!this.pulling) return;
      this.pulling = false;
      dom.homeInner.style.transition = 'transform 0.3s ' + 'cubic-bezier(0.22,0.61,0.36,1)';
      if (this.distance >= this.threshold) {
        dom.homeInner.style.transform = 'translateY(0)';
        homeView.refresh();
      } else {
        dom.homeInner.style.transform = 'translateY(0)';
      }
      dom.pullRefresh.style.height = '0';
      this.distance = 0;
    }
  };
  function prUpdate(distance, threshold) {
    const pr = dom.pullRefresh;
    pr.style.height = distance + 'px';
    pr.querySelector('.pr-icon').style.transform = distance >= threshold ? 'rotate(180deg)' : 'rotate(0deg)';
    pr.querySelector('.pr-text').textContent = distance >= threshold ? '松开刷新' : '下拉刷新';
  }

  /* ==========================================================================
   * 十五、搜索 search（前端开发者：防抖 300ms）
   * ========================================================================== */
  const search = {
    init() {
      const onInput = utils.debounce(function () {
        const kw = dom.searchInput.value.trim();
        state.searchKeyword = kw;
        dom.searchBox.classList.toggle('has-text', !!kw);
        if (kw) {
          // 切到首页并进入搜索模式
          if (state.currentView !== 'home') tabNav.switchTo('home');
          state.homeMode = 'search';
          homeView._renderSimpleList();
        } else if (state.homeMode === 'search') {
          // 清空搜索，恢复 feed 模式
          state.homeMode = 'feed';
          homeView.applyCategoryFilter();
        }
      }, 300);
      dom.searchInput.addEventListener('input', onInput);
      dom.searchClear.addEventListener('click', function () {
        dom.searchInput.value = '';
        onInput();
        dom.searchInput.focus();
      });
    }
  };

  /* ==========================================================================
   * 十六、Tab 导航 tabNav
   * ========================================================================== */
  const tabNav = {
    init() {
      dom.tabbar.addEventListener('click', function (e) {
        const item = e.target.closest('.tab-item');
        if (item) tabNav.switchTo(item.dataset.view);
      });
    },
    switchTo(view) {
      if (state.currentView === view) return;
      state.currentView = view;
      // 更新视图显隐
      Object.keys(dom.views).forEach(function (k) {
        dom.views[k].classList.toggle('active', k === view);
      });
      // 更新 tab 高亮
      dom.tabbar.querySelectorAll('.tab-item').forEach(function (t) {
        t.classList.toggle('active', t.dataset.view === view);
      });
      // 触发各视图激活回调
      const map = { home: homeView, category: categoryView, recommend: recommendView, mine: mineView };
      if (map[view] && map[view].onActivate) map[view].onActivate();
    }
  };

  /* ==========================================================================
   * 十七、空状态组件
   * ========================================================================== */
  function emptyState(text, icon) {
    return '<div class="state-block" style="grid-column:1/-1;"><div class="sb-icon">' +
      (icon || '📭') + '</div><div class="sb-text">' + utils.escapeHtml(text) + '</div></div>';
  }

  /* ==========================================================================
   * 十八、应用初始化入口
   * ========================================================================== */
  function init() {
    cacheDom();
    theme.init();
    lazyLoader.init();
    // 恢复兴趣标签
    const savedInterests = utils.storage.get('dh-interests', null);
    if (Array.isArray(savedInterests) && savedInterests.length) state.interests = savedInterests;

    homeView.init();
    categoryView.init();
    recommendView.init();
    mineView.init();
    perspectivesModal.init();
    pullRefresh.init();
    search.init();
    tabNav.init();

    // 浮动测试入口
    if (dom.testPanel) {
      dom.testPanel.addEventListener('click', function () {
        global.DailyHotspotTest && global.DailyHotspotTest.run();
      });
    }

    // 主题按钮
    dom.themeToggle.addEventListener('click', function () { theme.toggle(); });

    console.log('%c DailyHotspot 已启动 ✅', 'color:#5b6cff;font-weight:bold;');
  }

  /* ==========================================================================
   * 十九、对外暴露（供 test.js 与外部调试使用）
   * ========================================================================== */
  global.DailyHotspot = {
    version: '1.0.0',
    state: state,
    utils: utils,
    VirtualList: VirtualList,
    lazyLoader: lazyLoader,
    homeView: homeView,
    categoryView: categoryView,
    recommendView: recommendView,
    mineView: mineView,
    perspectivesModal: perspectivesModal,
    tabNav: tabNav,
    computeEfficiencyScore: computeEfficiencyScore,
    createNewsCard: createNewsCard,
    toast: toast
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(typeof window !== 'undefined' ? window : this);
