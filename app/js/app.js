/**
 * AI热点效率站 - 应用逻辑层
 * =====================================================================
 * 架构概览（单页应用，无框架）：
 *   - State：集中管理应用状态（当前 Tab、分页、收藏、历史等）
 *   - Storage：基于 localStorage 的持久化封装（收藏/历史/主题/上次 Tab）
 *   - Router：Tab 路由切换 + 视图懒渲染
 *   - Views：5 个视图各自的渲染与交互
 *       · HomeView     热点流（懒加载、下拉刷新、上拉分页）
 *       · PainView     大佬圆桌
 *       · ToolsView    工具推荐（分类筛选 + 收藏）
 *       · AssistantView AI 对话（关键词匹配 + 打字效果）
 *       · ProfileView  个人中心（统计/收藏/历史/主题）
 *   - Utils：防抖、节流、转义、格式化等纯函数
 *   - 共享组件：Toast、Modal、图片懒加载（IntersectionObserver）
 *
 * 依赖：window.APP_DATA（来自 data.js）
 * ===================================================================== */
(function (global) {
  'use strict';

  const DATA = global.APP_DATA;
  if (!DATA) {
    console.error('[AI热点效率站] 缺少数据文件 data.js');
    return;
  }
  const { NEWS_LIST, TOOL_LIST, PERSPECTIVES, AI_QA_RULES, AI_FALLBACK, CONFIG } = DATA;
  const SK = CONFIG.storageKeys;

  /* =========================================================
   * 一、工具函数（纯函数）
   * ========================================================= */

  /** 简易选择器 */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /** HTML 转义，防注入 */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 防抖：延后执行，期间重复触发则重置计时 */
  function debounce(fn, wait = 300) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** 节流：固定频率执行，适合滚动/触摸高频事件 */
  function throttle(fn, wait = 200) {
    let last = 0;
    let timer = null;
    return function (...args) {
      const now = Date.now();
      const remain = wait - (now - last);
      if (remain <= 0) {
        clearTimeout(timer);
        timer = null;
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, args);
        }, remain);
      }
    };
  }

  /** 热度值格式化：1.2w */
  function formatHeat(n) {
    return n >= 10000 ? (n / 10000).toFixed(1) + 'w' : String(n);
  }

  /** 渲染星级（满 5 星） */
  function renderStars(score) {
    const full = Math.floor(score);
    const half = score - full >= 0.5;
    return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  }

  /* =========================================================
   * 二、Storage 持久化层
   * ========================================================= */
  const Storage = {
    get(key, def) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : def;
      } catch (e) {
        return def;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {
        console.warn('[Storage] 写入失败', key);
      }
    },
    /** 收藏：返回数组 */
    getFavorites() {
      return this.get(SK.favorites, []);
    },
    toggleFavorite(item) {
      const list = this.getFavorites();
      const idx = list.findIndex(x => x.id === item.id);
      if (idx > -1) {
        list.splice(idx, 1);
        this.set(SK.favorites, list);
        return false; // 已取消
      }
      list.unshift({ id: item.id, type: item.type, title: item.title, sub: item.sub, icon: item.icon, ts: Date.now() });
      this.set(SK.favorites, list);
      return true; // 已收藏
    },
    isFavorited(id) {
      return this.getFavorites().some(x => x.id === id);
    },
    removeFavorite(id) {
      const list = this.getFavorites().filter(x => x.id !== id);
      this.set(SK.favorites, list);
    },
    /** 阅读历史：最多保留 50 条，去重置顶 */
    addHistory(item) {
      let list = this.get(SK.history, []);
      list = list.filter(x => x.id !== item.id);
      list.unshift({ id: item.id, type: item.type, title: item.title, sub: item.sub, icon: item.icon, ts: Date.now() });
      if (list.length > 50) list = list.slice(0, 50);
      this.set(SK.history, list);
    },
    getHistory() {
      return this.get(SK.history, []);
    },
    removeHistory(id) {
      const list = this.getHistory().filter(x => x.id !== id);
      this.set(SK.history, list);
    },
    getTheme() {
      return this.get(SK.theme, 'light');
    },
    setTheme(theme) {
      this.set(SK.theme, theme);
    },
    getLastTab() {
      return this.get(SK.lastTab, 'home');
    },
    setLastTab(tab) {
      this.set(SK.lastTab, tab);
    }
  };

  /* =========================================================
   * 三、共享组件
   * ========================================================= */

  /** 轻提示 Toast */
  const Toast = {
    el: null,
    timer: null,
    show(msg) {
      if (!this.el) this.el = $('#toast');
      this.el.textContent = msg;
      this.el.classList.add('is-show');
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.el.classList.remove('is-show'), 1800);
    }
  };

  /** 图片懒加载器（IntersectionObserver + 兜底） */
  const LazyLoader = {
    io: null,
    init() {
      if (!('IntersectionObserver' in global)) return;
      this.io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.onload = () => img.classList.add('is-loaded');
              img.onerror = () => { img.style.display = 'none'; };
            }
            this.io.unobserve(img);
          }
        });
      }, { rootMargin: '200px 0px', threshold: 0.01 });
    },
    observe(imgs) {
      if (!this.io) {
        // 兜底：直接加载
        imgs.forEach(img => {
          const src = img.getAttribute('data-src');
          if (src) { img.src = src; img.classList.add('is-loaded'); }
        });
        return;
      }
      imgs.forEach(img => this.io.observe(img));
    }
  };

  /** 详情弹层 Modal */
  const Modal = {
    el: null, body: null, onClose: null,
    init() {
      this.el = $('#detailModal');
      this.body = $('#modalBody');
      $('#modalClose').addEventListener('click', () => this.close());
      $('#modalMask').addEventListener('click', () => this.close());
      // ESC 关闭
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.el.classList.contains('is-open')) this.close();
      });
    },
    open(html, onClose) {
      this.body.innerHTML = html;
      this.onClose = onClose || null;
      this.el.classList.add('is-open');
      this.el.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    },
    close() {
      this.el.classList.remove('is-open');
      this.el.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (typeof this.onClose === 'function') this.onClose();
    }
  };

  /* =========================================================
   * 四、State 全局状态
   * ========================================================= */
  const State = {
    currentTab: 'home',
    // 首页分页
    newsPage: 0,
    newsPageSize: CONFIG.pageSize,
    newsRendered: 0,
    newsLoading: false,
    // 工具筛选
    toolFilter: 'all',
    // 个人中心二级 tab
    profileTab: 'fav',
    // 已渲染标记（视图懒初始化）
    inited: { home: false, pain: false, tools: false, assistant: false, profile: false }
  };

  /* =========================================================
   * 五、主题控制器
   * ========================================================= */
  const Theme = {
    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const sw = $('#themeSwitch');
      if (sw) sw.checked = (theme === 'dark');
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e1018' : '#6366f1');
    },
    toggle() {
      const next = Storage.getTheme() === 'dark' ? 'light' : 'dark';
      Storage.setTheme(next);
      this.apply(next);
      Toast.show(next === 'dark' ? '已切换深色模式' : '已切换浅色模式');
    },
    init() {
      this.apply(Storage.getTheme());
      // 头部主题按钮
      $('#themeToggle').addEventListener('click', () => this.toggle());
      // 个人中心开关
      $('#themeSwitch').addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        Storage.setTheme(theme);
        this.apply(theme);
      });
    }
  };

  /* =========================================================
   * 六、路由（Tab 切换）
   * ========================================================= */
  const Router = {
    init() {
      $$('.tabbar__item').forEach(btn => {
        btn.addEventListener('click', () => this.go(btn.dataset.tab));
      });
      // 恢复上次 Tab
      this.go(Storage.getLastTab(), true);
    },
    go(tab, isInit = false) {
      if (!isInit && tab === State.currentTab) return;
      State.currentTab = tab;
      Storage.setLastTab(tab);

      // 切换视图显隐
      $$('.view').forEach(v => {
        const match = v.dataset.tab === tab;
        v.classList.toggle('view--hidden', !match);
      });
      // 更新底部高亮
      $$('.tabbar__item').forEach(btn => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle('tabbar__item--active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      // 视图懒初始化
      this.ensureInited(tab);
      // 滚动复位
      const view = $(`#view-${tab}`);
      if (view) view.scrollTop = 0;

      // 各 Tab 特殊处理
      if (tab === 'assistant') {
        AssistantView.focusInput();
      } else if (tab === 'profile') {
        ProfileView.refresh();
      }
    },
    ensureInited(tab) {
      if (State.inited[tab]) return;
      State.inited[tab] = true;
      switch (tab) {
        case 'home': HomeView.init(); break;
        case 'pain': PainView.init(); break;
        case 'tools': ToolsView.init(); break;
        case 'assistant': AssistantView.init(); break;
        case 'profile': ProfileView.init(); break;
      }
    }
  };

  /* =========================================================
   * 七、首页热点流视图
   * ========================================================= */
  const HomeView = {
    listEl: null, loadMoreEl: null, pullEl: null, countEl: null,
    // 下拉刷新状态
    pullStartY: 0, pulling: false, pullDistance: 0,
    PULL_THRESHOLD: 70,

    init() {
      this.listEl = $('#newsList');
      this.loadMoreEl = $('#loadMore');
      this.pullEl = $('#pullIndicator');
      this.countEl = $('#newsCount');
      this.countEl.textContent = `共 ${NEWS_LIST.length} 条`;

      this.renderNext();
      this.bindInfiniteScroll();
      this.bindPullRefresh();
      this.bindSearch();
    },

    /** 渲染下一页新闻 */
    renderNext() {
      if (State.newsLoading) return;
      const start = State.newsRendered;
      const end = Math.min(start + State.newsPageSize, NEWS_LIST.length);
      if (start >= NEWS_LIST.length) {
        this.showLoadEnd();
        return;
      }
      State.newsLoading = true;
      this.loadMoreEl.classList.add('is-loading');

      // 模拟网络延迟
      setTimeout(() => {
        const frag = document.createDocumentFragment();
        const lazyImgs = [];
        for (let i = start; i < end; i++) {
          const card = this.createCard(NEWS_LIST[i], i);
          frag.appendChild(card);
          const img = card.querySelector('img[data-src]');
          if (img) lazyImgs.push(img);
        }
        this.listEl.appendChild(frag);
        LazyLoader.observe(lazyImgs);

        State.newsRendered = end;
        State.newsLoading = false;
        this.loadMoreEl.classList.remove('is-loading');

        if (State.newsRendered >= NEWS_LIST.length) {
          this.showLoadEnd();
        }
      }, 400);
    },

    showLoadEnd() {
      this.loadMoreEl.classList.remove('is-loading');
      this.loadMoreEl.classList.add('is-end');
    },

    /** 创建单条新闻卡片 */
    createCard(item, index) {
      const el = document.createElement('article');
      el.className = 'news-card';
      el.setAttribute('role', 'listitem');
      el.style.animationDelay = `${(index % State.newsPageSize) * 0.06}s`;
      const isHot = item.heat >= CONFIG.hotThreshold;
      const tagsHtml = item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      el.innerHTML = `
        <div class="news-card__cover">
          <img data-src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" loading="lazy" />
          ${isHot ? `<span class="news-card__heat">🔥 ${formatHeat(item.heat)}</span>` : `<span class="news-card__heat" style="background:rgba(99,102,241,.92)">📊 ${formatHeat(item.heat)}</span>`}
        </div>
        <div class="news-card__body">
          <h3 class="news-card__title">${escapeHtml(item.title)}</h3>
          <p class="news-card__summary">${escapeHtml(item.summary)}</p>
          <div class="news-card__meta">
            <span class="news-card__source">${escapeHtml(item.source)}</span>
            <span class="news-card__time">${escapeHtml(item.time)}</span>
          </div>
          <div class="news-card__tags">${tagsHtml}</div>
        </div>`;
      // 点击查看详情
      el.addEventListener('click', () => this.openDetail(item));
      return el;
    },

    /** 打开新闻详情 */
    openDetail(item) {
      Storage.addHistory({
        id: item.id, type: 'news',
        title: item.title, sub: item.source, icon: '📰'
      });
      const isFav = Storage.isFavorited(item.id);
      const tagsHtml = item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      Modal.open(`
        <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'" />
        <h2>${escapeHtml(item.title)}</h2>
        <p class="modal__source">${escapeHtml(item.source)} · ${escapeHtml(item.time)}</p>
        <div class="meta-grid">
          <div>热度 <b>${formatHeat(item.heat)}</b></div>
          <div>分类 <b>${escapeHtml(item.category)}</b></div>
        </div>
        <div class="modal__tags">${tagsHtml}</div>
        <p class="modal__text">${escapeHtml(item.summary)}</p>
        <p class="modal__text">${escapeHtml(item.summary)} 据${escapeHtml(item.source)}了解，该动态进一步反映了 2026 年 AI 办公智能体赛道的激烈竞争与快速演进，企业用户应关注工具与真实工作流的融合程度。</p>
        <button class="modal__action" id="modalFavBtn">${isFav ? '★ 已收藏，点击取消' : '☆ 收藏这条热点'}</button>
      `, () => ProfileView.refresh());
      $('#modalFavBtn').addEventListener('click', () => {
        const added = Storage.toggleFavorite({
          id: item.id, type: 'news',
          title: item.title, sub: item.source, icon: '📰'
        });
        Toast.show(added ? '已加入收藏' : '已取消收藏');
        $('#modalFavBtn').textContent = added ? '★ 已收藏，点击取消' : '☆ 收藏这条热点';
      });
    },

    /** 上拉加载（IntersectionObserver 监听 loadMore） */
    bindInfiniteScroll() {
      if (!('IntersectionObserver' in global)) {
        // 兜底：滚动监听
        const view = $('#view-home');
        view.addEventListener('scroll', throttle(() => {
          if (view.scrollHeight - view.scrollTop - view.clientHeight < 100) this.renderNext();
        }, 200));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) this.renderNext();
      }, { root: $('#view-home'), rootMargin: '100px' });
      io.observe(this.loadMoreEl);
    },

    /** 下拉刷新（触摸事件） */
    bindPullRefresh() {
      const view = $('#view-home');
      let startY = 0;

      view.addEventListener('touchstart', (e) => {
        // 仅在顶部触发
        if (view.scrollTop <= 0) {
          startY = e.touches[0].clientY;
          this.pulling = true;
        } else {
          this.pulling = false;
        }
      }, { passive: true });

      view.addEventListener('touchmove', throttle((e) => {
        if (!this.pulling) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 0 && diff < 120) {
          this.pullDistance = diff;
          this.pullEl.classList.add('is-active');
          this.pullEl.querySelector('.pull-text').textContent =
            diff > this.PULL_THRESHOLD ? '松开刷新' : '下拉刷新';
        }
      }, 16), { passive: true });

      view.addEventListener('touchend', () => {
        if (!this.pulling) return;
        this.pulling = false;
        if (this.pullDistance > this.PULL_THRESHOLD) {
          this.doRefresh();
        }
        this.pullEl.classList.remove('is-active');
        this.pullDistance = 0;
      });
    },

    /** 执行刷新：重置列表并重渲染 */
    doRefresh() {
      Toast.show('正在刷新…');
      this.listEl.innerHTML = '';
      State.newsRendered = 0;
      State.newsLoading = false;
      this.loadMoreEl.classList.remove('is-end', 'is-loading');
      // 轻微打乱顺序模拟「刷新有新内容」
      setTimeout(() => {
        this.renderNext();
        Toast.show('已是最新内容');
      }, 600);
    },

    /** 搜索（简易：跳转匹配项高亮提示） */
    bindSearch() {
      $('#searchBtn').addEventListener('click', () => {
        const kw = prompt('搜索热点关键词（如 腾讯 / 飞书 / Agent）');
        if (!kw) return;
        const matched = NEWS_LIST.filter(n =>
          (n.title + n.summary + n.tags.join('')).toLowerCase().includes(kw.toLowerCase()));
        if (matched.length === 0) {
          Toast.show(`未找到「${kw}」相关热点`);
          return;
        }
        // 滚动并高亮第一条匹配
        Toast.show(`找到 ${matched.length} 条「${kw}」相关`);
        const firstId = matched[0].id;
        const card = this.listEl.querySelector(`[data-id="${firstId}"]`);
        // 简单实现：重新渲染匹配项
        this.listEl.innerHTML = '';
        State.newsRendered = 0;
        State.newsLoading = false;
        this.loadMoreEl.classList.remove('is-end', 'is-loading');
        // 临时把匹配项排前面
        const reordered = [...matched, ...NEWS_LIST.filter(n => !matched.includes(n))];
        const frag = document.createDocumentFragment();
        const lazyImgs = [];
        reordered.slice(0, State.newsPageSize).forEach((item, i) => {
          const cardEl = this.createCard(item, i);
          cardEl.dataset.id = item.id;
          if (matched.includes(item)) cardEl.style.boxShadow = '0 0 0 4rpx var(--brand)';
          frag.appendChild(cardEl);
          const img = cardEl.querySelector('img[data-src]');
          if (img) lazyImgs.push(img);
        });
        this.listEl.appendChild(frag);
        LazyLoader.observe(lazyImgs);
        State.newsRendered = State.newsPageSize;
      });
    }
  };

  /* =========================================================
   * 八、痛点圆桌视图
   * ========================================================= */
  const PainView = {
    init() {
      const wrap = $('#perspectiveList');
      wrap.innerHTML = '';
      const frag = document.createDocumentFragment();
      PERSPECTIVES.forEach((p, i) => {
        const el = document.createElement('article');
        el.className = 'perspective-card';
        el.setAttribute('role', 'listitem');
        el.style.animationDelay = `${i * 0.08}s`;
        el.innerHTML = `
          <div class="perspective-card__top">
            <div class="perspective-card__avatar" style="background:${p.color}">${p.avatar}</div>
            <div>
              <p class="perspective-card__name">${escapeHtml(p.name)}</p>
              <p class="perspective-card__role">${escapeHtml(p.role)}</p>
            </div>
          </div>
          <div class="perspective-card__viewpoint">“${escapeHtml(p.viewpoint)}”</div>
          <p class="perspective-card__detail">${escapeHtml(p.detail)}</p>
          <div class="perspective-card__tags">
            ${p.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>`;
        // 点击查看完整视角
        el.addEventListener('click', () => {
          Storage.addHistory({ id: p.id, type: 'pain', title: `${p.name}：${p.viewpoint}`, sub: p.role, icon: p.avatar });
          Modal.open(`
            <div style="display:flex;align-items:center;gap:20rpx;margin-bottom:24rpx">
              <div class="perspective-card__avatar" style="background:${p.color};width:96rpx;height:96rpx;font-size:48rpx">${p.avatar}</div>
              <div>
                <h2 style="margin:0">${escapeHtml(p.name)}</h2>
                <p class="modal__source" style="margin:0">${escapeHtml(p.role)}</p>
              </div>
            </div>
            <div class="perspective-card__viewpoint">“${escapeHtml(p.viewpoint)}”</div>
            <p class="modal__text">${escapeHtml(p.detail)}</p>
            <div class="modal__tags">${p.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
            <button class="modal__action" id="modalFavBtn">${Storage.isFavorited(p.id) ? '★ 已收藏，点击取消' : '☆ 收藏此视角'}</button>
          `, () => ProfileView.refresh());
          $('#modalFavBtn').addEventListener('click', () => {
            const added = Storage.toggleFavorite({ id: p.id, type: 'pain', title: `${p.name}：${p.viewpoint}`, sub: p.role, icon: p.avatar });
            Toast.show(added ? '已加入收藏' : '已取消收藏');
            $('#modalFavBtn').textContent = added ? '★ 已收藏，点击取消' : '☆ 收藏此视角';
          });
        });
        frag.appendChild(el);
      });
      wrap.appendChild(frag);
    }
  };

  /* =========================================================
   * 九、工具推荐视图
   * ========================================================= */
  const ToolsView = {
    init() {
      // 构建分类筛选
      const categories = ['all', ...new Set(TOOL_LIST.map(t => t.category))];
      const filterEl = $('#toolFilter');
      filterEl.innerHTML = categories.map(c => {
        const label = c === 'all' ? '全部' : c;
        const active = c === State.toolFilter ? ' filter-chip--active' : '';
        return `<button class="filter-chip${active}" data-cat="${escapeHtml(c)}">${escapeHtml(label)}</button>`;
      }).join('');
      filterEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        State.toolFilter = btn.dataset.cat;
        $$('.filter-chip', filterEl).forEach(b => b.classList.toggle('filter-chip--active', b === btn));
        this.render();
      });
      this.render();
    },

    render() {
      const wrap = $('#toolList');
      const list = State.toolFilter === 'all'
        ? TOOL_LIST
        : TOOL_LIST.filter(t => t.category === State.toolFilter);
      wrap.innerHTML = '';
      const frag = document.createDocumentFragment();
      list.forEach((t, i) => {
        const isFav = Storage.isFavorited(t.id);
        const el = document.createElement('article');
        el.className = 'tool-card';
        el.setAttribute('role', 'listitem');
        el.style.animationDelay = `${i * 0.06}s`;
        el.innerHTML = `
          <div class="tool-card__head">
            <div class="tool-card__icon">${t.icon}</div>
            <div class="tool-card__info">
              <p class="tool-card__name">${escapeHtml(t.name)} <span class="tool-card__highlight">${escapeHtml(t.highlight)}</span></p>
              <p class="tool-card__vendor">${escapeHtml(t.vendor)} · ${escapeHtml(t.category)}</p>
            </div>
          </div>
          <p class="tool-card__desc">${escapeHtml(t.desc)}</p>
          <div class="tool-card__meta">
            <div class="tool-card__rating">
              <span class="tool-card__stars">${renderStars(t.rating)}</span>
              <span class="tool-card__score">${t.rating.toFixed(1)}</span>
            </div>
            <span class="tool-card__price">${escapeHtml(t.price)}</span>
          </div>
          <div class="tool-card__scenarios">
            ${t.scenarios.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}
          </div>
          <div class="tool-card__footer">
            <button class="tool-card__btn tool-card__btn--ghost" data-act="detail">查看详情</button>
            <button class="tool-card__btn tool-card__btn--fav ${isFav ? 'is-faved' : ''}" data-act="fav">
              ${isFav ? '★ 已收藏' : '☆ 收藏'}
            </button>
          </div>`;
        el.querySelector('[data-act="detail"]').addEventListener('click', () => this.openDetail(t));
        el.querySelector('[data-act="fav"]').addEventListener('click', (e) => {
          const added = Storage.toggleFavorite({ id: t.id, type: 'tool', title: t.name, sub: t.vendor, icon: t.icon });
          const btn = e.currentTarget;
          btn.classList.toggle('is-faved', added);
          btn.textContent = added ? '★ 已收藏' : '☆ 收藏';
          Toast.show(added ? '已加入收藏' : '已取消收藏');
          ProfileView.refresh();
        });
        frag.appendChild(el);
      });
      wrap.appendChild(frag);
    },

    openDetail(t) {
      Storage.addHistory({ id: t.id, type: 'tool', title: t.name, sub: t.vendor, icon: t.icon });
      const isFav = Storage.isFavorited(t.id);
      Modal.open(`
        <div style="display:flex;align-items:center;gap:20rpx;margin-bottom:20rpx">
          <div class="tool-card__icon" style="width:96rpx;height:96rpx;font-size:48rpx">${t.icon}</div>
          <div>
            <h2 style="margin:0">${escapeHtml(t.name)}</h2>
            <p class="modal__source" style="margin:0">${escapeHtml(t.vendor)} · ${escapeHtml(t.category)}</p>
          </div>
        </div>
        <div class="meta-grid">
          <div>评分 <b>${t.rating.toFixed(1)} / 5.0</b></div>
          <div>价格 <b>${escapeHtml(t.price)}</b></div>
          <div>亮点 <b>${escapeHtml(t.highlight)}</b></div>
        </div>
        <p class="modal__text">${escapeHtml(t.desc)}</p>
        <div class="modal__tags">${t.scenarios.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
        <button class="modal__action" id="modalFavBtn">${isFav ? '★ 已收藏，点击取消' : '☆ 收藏此工具'}</button>
      `, () => { this.render(); ProfileView.refresh(); });
      $('#modalFavBtn').addEventListener('click', () => {
        const added = Storage.toggleFavorite({ id: t.id, type: 'tool', title: t.name, sub: t.vendor, icon: t.icon });
        Toast.show(added ? '已加入收藏' : '已取消收藏');
        $('#modalFavBtn').textContent = added ? '★ 已收藏，点击取消' : '☆ 收藏此工具';
      });
    }
  };

  /* =========================================================
   * 十、AI 助手对话视图
   * ========================================================= */
  const AssistantView = {
    msgEl: null, inputEl: null, quickEl: null,
    isReplying: false,

    init() {
      this.msgEl = $('#chatMessages');
      this.inputEl = $('#chatInput');
      this.quickEl = $('#chatQuick');
      $('#chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.send();
      });
      // 欢迎语
      this.addMessage('ai', [
        '你好！我是「AI热点效率站」的办公助手 🤖',
        '我可以帮你解读 2026 年 AI 办公热点、对比腾讯/字节/阿里等智能体产品、推荐提效工具。',
        '试试问我：「AI 办公工具怎么选？」'
      ]);
      this.renderQuick(AI_FALLBACK.followups);
    },

    focusInput() {
      // 延迟聚焦，避免 iOS 键盘弹出导致布局错乱
      setTimeout(() => this.inputEl && this.inputEl.focus(), 300);
    },

    /** 发送用户消息 */
    send(text) {
      const content = (text || this.inputEl.value).trim();
      if (!content || this.isReplying) return;
      this.addMessage('me', [content]);
      this.inputEl.value = '';
      this.reply(content);
    },

    /** 关键词匹配并回复 */
    reply(content) {
      this.isReplying = true;
      const sendBtn = $('#chatSend');
      sendBtn.disabled = true;
      // 匹配规则
      const lower = content.toLowerCase();
      let matched = null;
      for (const rule of AI_QA_RULES) {
        if (rule.keywords.some(k => lower.includes(k.toLowerCase()))) {
          matched = rule;
          break;
        }
      }
      const answer = matched || AI_FALLBACK;
      // 模拟思考延迟
      setTimeout(() => {
        this.typeReply(answer.reply, () => {
          this.renderQuick(answer.followups);
          this.isReplying = false;
          sendBtn.disabled = false;
        });
      }, 500);
    },

    /** 打字效果逐段输出 */
    typeReply(lines, onDone) {
      let lineIdx = 0;
      const bubble = this.addMessage('ai', [], true); // 先建空气泡 + 光标

      const typeNext = () => {
        if (lineIdx >= lines.length) {
          // 移除光标
          const cursor = bubble.querySelector('.typing-cursor');
          if (cursor) cursor.remove();
          this.scrollBottom();
          onDone && onDone();
          return;
        }
        const line = lines[lineIdx];
        const p = document.createElement('p');
        bubble.appendChild(p);
        // 打字：逐字追加
        let charIdx = 0;
        const typeChar = () => {
          if (charIdx < line.length) {
            p.textContent = line.slice(0, charIdx + 1);
            charIdx++;
            // 保持光标在末尾
            this.scrollBottom();
            setTimeout(typeChar, 18);
          } else {
            lineIdx++;
            setTimeout(typeNext, 120);
          }
        };
        typeChar();
      };
      typeNext();
    },

    /** 添加一条消息，返回气泡元素 */
    addMessage(role, lines, withCursor) {
      const el = document.createElement('div');
      el.className = `msg msg--${role}`;
      const avatar = role === 'ai' ? '🤖' : '🙂';
      const linesHtml = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
      el.innerHTML = `
        <div class="msg__avatar">${avatar}</div>
        <div class="msg__bubble">${linesHtml}${withCursor ? '<span class="typing-cursor"></span>' : ''}</div>`;
      this.msgEl.appendChild(el);
      this.scrollBottom();
      return el.querySelector('.msg__bubble');
    },

    /** 渲染快捷问题 */
    renderQuick(items) {
      this.quickEl.innerHTML = items.map(q =>
        `<button class="chat-quick__item">${escapeHtml(q)}</button>`).join('');
      $$('.chat-quick__item', this.quickEl).forEach(btn => {
        btn.addEventListener('click', () => this.send(btn.textContent));
      });
    },

    scrollBottom() {
      const win = $('#chatWindow');
      win.scrollTop = win.scrollHeight;
    }
  };

  /* =========================================================
   * 十一、个人中心视图
   * ========================================================= */
  const ProfileView = {
    init() {
      // 二级 tab 切换
      $('#profileTabs').addEventListener('click', (e) => {
        const btn = e.target.closest('.profile-tab');
        if (!btn) return;
        State.profileTab = btn.dataset.ptab;
        $$('.profile-tab').forEach(b => b.classList.toggle('profile-tab--active', b === btn));
        this.renderList();
      });
      this.refresh();
    },

    /** 刷新统计与列表 */
    refresh() {
      if (!State.inited.profile) return;
      const favs = Storage.getFavorites();
      const his = Storage.getHistory();
      $('#statFav').textContent = favs.length;
      $('#statHis').textContent = his.length;
      $('#statNews').textContent = NEWS_LIST.length;
      this.renderList();
    },

    renderList() {
      const wrap = $('#profileList');
      const items = State.profileTab === 'fav' ? Storage.getFavorites() : Storage.getHistory();
      if (items.length === 0) {
        const txt = State.profileTab === 'fav' ? '还没有收藏，去首页/工具页收藏吧' : '还没有阅读历史';
        wrap.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__text">${txt}</div></div>`;
        return;
      }
      wrap.innerHTML = items.map(item => `
        <div class="profile-item" data-id="${escapeHtml(item.id)}">
          <div class="profile-item__icon">${item.icon || '📄'}</div>
          <div class="profile-item__main">
            <p class="profile-item__title">${escapeHtml(item.title)}</p>
            <p class="profile-item__sub">${escapeHtml(item.sub || '')} · ${this.fmtTime(item.ts)}</p>
          </div>
          <button class="profile-item__del" data-id="${escapeHtml(item.id)}" aria-label="删除">×</button>
        </div>`).join('');
      // 删除按钮
      $$('.profile-item__del', wrap).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          if (State.profileTab === 'fav') Storage.removeFavorite(id);
          else Storage.removeHistory(id);
          this.refresh();
          Toast.show('已删除');
        });
      });
      // 点击项：打开对应详情
      $$('.profile-item', wrap).forEach(el => {
        el.addEventListener('click', () => {
          const id = el.dataset.id;
          const news = NEWS_LIST.find(n => n.id === id);
          const tool = TOOL_LIST.find(t => t.id === id);
          if (news) HomeView.openDetail(news);
          else if (tool) ToolsView.openDetail(tool);
          else Toast.show('该内容暂不支持查看');
        });
      });
    },

    fmtTime(ts) {
      if (!ts) return '';
      const diff = Date.now() - ts;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
      return Math.floor(diff / 86400000) + ' 天前';
    }
  };

  /* =========================================================
   * 十二、应用启动
   * ========================================================= */
  function boot() {
    LazyLoader.init();
    Modal.init();
    Theme.init();
    Router.init();

    // 控制台彩蛋
    console.log('%c AI热点效率站 ', 'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:14px;padding:4px 10px;border-radius:4px', '已启动 ✅');
  }

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---- 暴露调试接口（可选） ---- */
  global.AIEffApp = { Router, Storage, Theme, State };
})(window);
