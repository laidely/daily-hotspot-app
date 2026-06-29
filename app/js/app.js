/**
 * ============================================================
 * AI热点速递 - 应用逻辑模块
 * ============================================================
 * 功能模块：
 * 1. 路由管理（SPA页面切换）
 * 2. 首页：分类筛选、新闻列表渲染
 * 3. 趋势页：热度排行、趋势分析、分类可视化
 * 4. 搜索页：关键词搜索、历史记录、热门推荐
 * 5. 收藏页：localStorage持久化存储
 * 6. 虚拟滚动：性能优化
 * 7. Toast消息提示
 * 8. 新闻详情弹窗
 * ============================================================
 */

(function () {
  'use strict';

  /* ==================== 常量定义 ==================== */
  const STORAGE_KEYS = {
    FAVORITES: 'ai_hot_favorites',     // 收藏列表
    SEARCH_HISTORY: 'ai_hot_history'    // 搜索历史
  };

  const VIRTUAL_SCROLL = {
    ITEM_ESTIMATED_HEIGHT: 180,  // 估算每条卡片高度（px）
    BUFFER_SIZE: 3               // 上下缓冲区数量
  };

  /* ==================== 应用状态 ==================== */
  const AppState = {
    currentPage: 'home',           // 当前页面
    currentCategory: 'all',        // 当前分类筛选
    favorites: new Set(),           // 收藏的新闻ID集合
    searchHistory: [],              // 搜索历史
    expandedCards: new Set(),      // 已展开的新闻ID集合
    searchDebounceTimer: null       // 搜索防抖计时器
  };

  /* ==================== DOM缓存 ==================== */
  const DOM = {};

  /**
   * 缓存所有需要操作的DOM元素
   */
  function cacheDOMElements() {
    // 页面容器
    DOM.pages = {
      home: document.getElementById('page-home'),
      trend: document.getElementById('page-trend'),
      search: document.getElementById('page-search'),
      fav: document.getElementById('page-fav')
    };

    // 导航
    DOM.bottomNav = document.getElementById('bottomNav');
    DOM.navItems = DOM.bottomNav.querySelectorAll('.nav-item');

    // 首页
    DOM.categoryScroll = document.getElementById('categoryScroll');
    DOM.newsList = document.getElementById('newsList');

    // 趋势页
    DOM.hotRankList = document.getElementById('hotRankList');
    DOM.trendSection = document.getElementById('trendSection');
    DOM.categoryChart = document.getElementById('categoryChart');

    // 搜索页
    DOM.searchInput = document.getElementById('searchInput');
    DOM.searchClear = document.getElementById('searchClear');
    DOM.searchResults = document.getElementById('searchResults');
    DOM.searchResultInfo = document.getElementById('searchResultInfo');
    DOM.searchHistorySection = document.getElementById('searchHistorySection');
    DOM.searchHistoryList = document.getElementById('searchHistoryList');
    DOM.hotKeywords = document.getElementById('hotKeywords');
    DOM.searchSuggestions = document.getElementById('searchSuggestions');

    // 收藏页
    DOM.favList = document.getElementById('favList');
    DOM.favCount = document.getElementById('favCount');
    DOM.favEmpty = document.getElementById('favEmpty');
    DOM.goBrowse = document.getElementById('goBrowse');

    // 弹窗
    DOM.newsModal = document.getElementById('newsModal');
    DOM.modalSheet = document.getElementById('modalSheet');
    DOM.modalTitle = document.getElementById('modalTitle');
    DOM.modalSummary = document.getElementById('modalSummary');
    DOM.modalDetail = document.getElementById('modalDetail');
    DOM.modalMeta = document.getElementById('modalMeta');

    // Toast
    DOM.toastContainer = document.getElementById('toastContainer');

    // 头部按钮
    DOM.themeToggle = document.getElementById('themeToggle');
  }

  /* ==================== 本地存储工具 ==================== */
  const Storage = {
    /**
     * 读取本地存储
     * @param {string} key 存储键名
     * @param {*} defaultValue 默认值
     * @returns {*} 解析后的数据或默认值
     */
    get(key, defaultValue) {
      try {
        const data = localStorage.getItem(key);
        return data !== null ? JSON.parse(data) : defaultValue;
      } catch (e) {
        console.warn('Storage read error:', e);
        return defaultValue;
      }
    },

    /**
     * 写入本地存储
     * @param {string} key 存储键名
     * @param {*} value 存储值
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Storage write error:', e);
      }
    },

    /**
     * 从存储中初始化收藏和搜索历史
     */
    init() {
      // 初始化收藏集合
      const favIds = this.get(STORAGE_KEYS.FAVORITES, []);
      AppState.favorites = new Set(favIds);

      // 初始化搜索历史（最多保留20条）
      const history = this.get(STORAGE_KEYS.SEARCH_HISTORY, []);
      AppState.searchHistory = history.slice(0, 20);
    }
  };

  /* ==================== Toast消息 ==================== */
  const Toast = {
    /**
     * 显示Toast消息
     * @param {string} message 消息内容
     * @param {number} duration 显示时长(ms)，默认2300ms
     */
    show(message, duration = 2300) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      DOM.toastContainer.appendChild(toast);

      // 自动移除
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, duration);
    }
  };

  /* ==================== 路由管理 ==================== */
  const Router = {
    /**
     * 切换页面
     * @param {string} pageName 页面名称（home/trend/search/fav）
     */
    switchTo(pageName) {
      if (!DOM.pages[pageName]) return;

      // 更新状态
      AppState.currentPage = pageName;

      // 切换页面显示
      Object.keys(DOM.pages).forEach(key => {
        DOM.pages[key].classList.toggle('active', key === pageName);
      });

      // 更新导航高亮
      DOM.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
      });

      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 页面进入时的特殊处理
      if (pageName === 'fav') {
        Favorites.render();
      }
      if (pageName === 'search') {
        // 延迟聚焦搜索框
        setTimeout(() => DOM.searchInput.focus(), 300);
      }
      if (pageName === 'trend') {
        Trend.animateCharts();
      }
    }
  };

  /* ==================== 分类筛选模块 ==================== */
  const CategoryFilter = {
    /**
     * 渲染分类标签
     */
    render() {
      const fragment = document.createDocumentFragment();
      CATEGORIES.forEach(cat => {
        const tag = document.createElement('div');
        tag.className = 'category-tag' + (cat.id === AppState.currentCategory ? ' active' : '');
        tag.textContent = cat.name;
        tag.dataset.category = cat.id;
        tag.addEventListener('click', () => this.select(cat.id));
        fragment.appendChild(tag);
      });
      DOM.categoryScroll.appendChild(fragment);
    },

    /**
     * 选择分类
     * @param {string} categoryId 分类ID
     */
    select(categoryId) {
      AppState.currentCategory = categoryId;

      // 更新标签高亮
      DOM.categoryScroll.querySelectorAll('.category-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.category === categoryId);
      });

      // 重新渲染新闻列表
      Home.renderNewsList();
    }
  };

  /* ==================== 首页模块 ==================== */
  const Home = {
    /**
     * 获取当前筛选后的新闻列表
     * @returns {Array} 筛选后的新闻数据
     */
    getFilteredNews() {
      if (AppState.currentCategory === 'all') {
        return [...NEWS_DATA];
      }
      return NEWS_DATA.filter(item => item.category === AppState.currentCategory);
    },

    /**
     * 渲染新闻列表
     */
    renderNewsList() {
      const newsList = this.getFilteredNews();
      DOM.newsList.innerHTML = '';

      if (newsList.length === 0) {
        DOM.newsList.innerHTML = `
          <div class="empty-state">
            <div class="icon">&#128240;</div>
            <div class="title">暂无相关新闻</div>
            <div class="desc">试试查看其他分类</div>
          </div>
        `;
        return;
      }

      const fragment = document.createDocumentFragment();
      newsList.forEach((news, index) => {
        fragment.appendChild(this.createNewsCard(news, index));
      });
      DOM.newsList.appendChild(fragment);
    },

    /**
     * 创建单条新闻卡片DOM
     * @param {Object} news 新闻数据
     * @param {number} index 索引（用于排名）
     * @returns {HTMLElement} 卡片元素
     */
    createNewsCard(news, index) {
      const isExpanded = AppState.expandedCards.has(news.id);
      const isFavorited = AppState.favorites.has(news.id);

      const card = document.createElement('div');
      card.className = 'news-card' + (isExpanded ? ' expanded' : '');
      card.dataset.id = news.id;

      // 排名样式类
      const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';

      card.innerHTML = `
        <div class="news-card-header">
          <div class="news-card-rank ${rankClass}">${index + 1}</div>
          <div class="news-card-body">
            <div class="news-card-title">${this.escapeHtml(news.title)}</div>
            <div class="news-card-summary">${this.escapeHtml(news.summary)}</div>
          </div>
        </div>
        <div class="news-card-tags">
          <span class="tag category-tag-small">${this.escapeHtml(news.category)}</span>
          ${news.tags.slice(0, 2).map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="news-card-footer">
          <div class="news-card-meta">
            <span class="news-card-meta-item">
              <span class="icon">&#128197;</span>
              ${news.date.slice(5)}
            </span>
            <span class="news-card-meta-item">
              <span class="icon">&#128293;</span>
              <span class="hot-value">${this.formatHot(news.hot)}</span>
            </span>
            <span class="news-card-meta-item">
              <span class="icon">&#127760;</span>
              ${this.escapeHtml(news.source)}
            </span>
          </div>
          <div class="news-card-actions">
            <button class="action-btn fav-btn ${isFavorited ? 'favorited' : ''}"
                    data-id="${news.id}" aria-label="收藏"
                    title="${isFavorited ? '取消收藏' : '收藏'}">
              ${isFavorited ? '&#9733;' : '&#9734;'}
            </button>
          </div>
        </div>
        <div class="expand-hint">
          <span>${isExpanded ? '收起详情' : '展开详情'}</span>
          <span class="expand-arrow">&#9660;</span>
        </div>
        <div class="news-card-detail">
          <div class="news-card-detail-content">
            <div class="detail-text">${this.escapeHtml(news.detail)}</div>
            <div class="detail-source">
              <span class="icon">&#127760;</span>
              来源：${this.escapeHtml(news.source)} · ${news.date}
            </div>
          </div>
        </div>
      `;

      // 绑定展开/收起事件
      card.addEventListener('click', (e) => {
        // 如果点击的是收藏按钮，不触发展开
        if (e.target.closest('.fav-btn')) return;

        this.toggleExpand(news.id, card);
      });

      // 绑定收藏按钮事件
      const favBtn = card.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Favorites.toggle(news.id);
      });

      return card;
    },

    /**
     * 展开/收起新闻详情
     * @param {number} newsId 新闻ID
     * @param {HTMLElement} card 卡片元素
     */
    toggleExpand(newsId, card) {
      if (AppState.expandedCards.has(newsId)) {
        AppState.expandedCards.delete(newsId);
        card.classList.remove('expanded');
      } else {
        AppState.expandedCards.add(newsId);
        card.classList.add('expanded');
      }

      // 更新展开提示文本
      const hint = card.querySelector('.expand-hint span:first-child');
      const isExpanded = AppState.expandedCards.has(newsId);
      hint.textContent = isExpanded ? '收起详情' : '展开详情';
    },

    /**
     * 格式化热度数字
     * @param {number} hot 热度值
     * @returns {string} 格式化后的字符串
     */
    formatHot(hot) {
      if (hot >= 10000) {
        return (hot / 10000).toFixed(1) + '万';
      }
      return hot.toString();
    },

    /**
     * 转义HTML特殊字符，防止XSS
     * @param {string} str 原始字符串
     * @returns {string} 转义后的安全字符串
     */
    escapeHtml(str) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
  };

  /* ==================== 趋势页模块 ==================== */
  const Trend = {
    /**
     * 初始化趋势页
     */
    init() {
      this.renderHotRank();
      this.renderTrends();
      this.renderCategoryChart();
    },

    /**
     * 渲染热度排行列表
     */
    renderHotRank() {
      // 取热度前5的新闻
      const topNews = [...NEWS_DATA]
        .sort((a, b) => b.hot - a.hot)
        .slice(0, 5);

      const maxHot = topNews[0].hot;
      const fragment = document.createDocumentFragment();

      topNews.forEach(news => {
        const percentage = Math.round((news.hot / maxHot) * 100);
        const item = document.createElement('div');
        item.className = 'hot-rank-item';
        item.innerHTML = `
          <div class="hot-rank-number"></div>
          <div class="hot-rank-info">
            <div class="hot-rank-title">${Home.escapeHtml(news.title)}</div>
            <div class="hot-rank-category">${Home.escapeHtml(news.category)} · ${news.date.slice(5)}</div>
          </div>
          <div class="hot-rank-bar-wrap">
            <div class="hot-rank-bar">
              <div class="hot-rank-bar-inner" data-width="${percentage}"></div>
            </div>
            <div class="hot-rank-value">${Home.formatHot(news.hot)}</div>
          </div>
        `;

        // 点击跳转到新闻详情
        item.addEventListener('click', () => {
          Modal.open(news);
        });

        fragment.appendChild(item);
      });

      DOM.hotRankList.appendChild(fragment);
    },

    /**
     * 渲染趋势分析卡片
     */
    renderTrends() {
      const fragment = document.createDocumentFragment();
      TREND_REPORT.trends.forEach(trend => {
        const card = document.createElement('div');
        card.className = 'trend-card';
        const directionIcon = trend.direction === 'up' ? '&#128311;' : '&#128310;';
        card.innerHTML = `
          <div class="trend-card-header">
            <div class="trend-card-title">${Home.escapeHtml(trend.title)}</div>
            <div class="flex-row">
              <span class="trend-card-direction">${directionIcon}</span>
              <span class="trend-card-impact ${trend.impact}">${trend.impact === '高' ? '高影响' : '中影响'}</span>
            </div>
          </div>
          <div class="trend-card-desc">${Home.escapeHtml(trend.description)}</div>
        `;
        fragment.appendChild(card);
      });
      DOM.trendSection.appendChild(fragment);
    },

    /**
     * 渲染热门分类可视化图表
     */
    renderCategoryChart() {
      const maxValue = Math.max(...TREND_REPORT.hotCategories.map(c => c.value));
      const fragment = document.createDocumentFragment();

      TREND_REPORT.hotCategories.forEach(cat => {
        const percentage = Math.round((cat.value / maxValue) * 100);
        const item = document.createElement('div');
        item.className = 'chart-item';
        item.innerHTML = `
          <div class="chart-item-label">${cat.name}</div>
          <div class="chart-item-bar-wrap">
            <div class="chart-item-bar" data-width="${percentage}">
              <span class="chart-item-value">${cat.value}</span>
            </div>
          </div>
        `;
        fragment.appendChild(item);
      });

      DOM.categoryChart.appendChild(fragment);
    },

    /**
     * 页面可见时触发动画
     */
    animateCharts() {
      // 热度排行条形图动画
      setTimeout(() => {
        DOM.hotRankList.querySelectorAll('.hot-rank-bar-inner').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }, 200);

      // 分类热度条形图动画
      setTimeout(() => {
        DOM.categoryChart.querySelectorAll('.chart-item-bar').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }, 400);
    }
  };

  /* ==================== 搜索模块 ==================== */
  const Search = {
    /**
     * 初始化搜索页
     */
    init() {
      this.renderHotKeywords();
      this.renderHistory();
      this.bindEvents();
    },

    /**
     * 绑定搜索事件
     */
    bindEvents() {
      // 输入框事件（防抖搜索）
      DOM.searchInput.addEventListener('input', () => {
        const query = DOM.searchInput.value.trim();
        DOM.searchClear.classList.toggle('visible', query.length > 0);

        // 防抖处理
        clearTimeout(AppState.searchDebounceTimer);
        AppState.searchDebounceTimer = setTimeout(() => {
          if (query.length > 0) {
            this.execute(query);
          } else {
            this.clearResults();
          }
        }, 300);
      });

      // 清除按钮
      DOM.searchClear.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.searchClear.classList.remove('visible');
        this.clearResults();
        DOM.searchInput.focus();
      });

      // 清空搜索历史
      document.getElementById('clearHistory').addEventListener('click', () => {
        AppState.searchHistory = [];
        Storage.set(STORAGE_KEYS.SEARCH_HISTORY, []);
        this.renderHistory();
        Toast.show('搜索历史已清空');
      });

      // 键盘回车搜索
      DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = DOM.searchInput.value.trim();
          if (query) {
            this.execute(query);
            DOM.searchInput.blur();
          }
        }
      });
    },

    /**
     * 执行搜索
     * @param {string} query 搜索关键词
     */
    execute(query) {
      // 添加到搜索历史
      this.addToHistory(query);

      // 执行模糊搜索（标题、摘要、标签、分类）
      const lowerQuery = query.toLowerCase();
      const results = NEWS_DATA.filter(news => {
        return news.title.toLowerCase().includes(lowerQuery) ||
          news.summary.toLowerCase().includes(lowerQuery) ||
          news.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
          news.category.toLowerCase().includes(lowerQuery) ||
          news.source.toLowerCase().includes(lowerQuery);
      });

      // 隐藏搜索建议和历史
      DOM.searchHistorySection.classList.add('hidden');
      DOM.searchSuggestions.classList.add('hidden');

      // 显示搜索结果
      DOM.searchResults.classList.remove('hidden');
      DOM.searchResultInfo.classList.remove('hidden');
      DOM.searchResultInfo.textContent = `找到 ${results.length} 条相关结果`;

      // 渲染搜索结果
      DOM.searchResults.innerHTML = '';
      if (results.length === 0) {
        DOM.searchResults.innerHTML = `
          <div class="empty-state">
            <div class="icon">&#128270;</div>
            <div class="title">未找到相关结果</div>
            <div class="desc">换个关键词试试</div>
          </div>
        `;
        return;
      }

      const fragment = document.createDocumentFragment();
      results.forEach((news, index) => {
        fragment.appendChild(Home.createNewsCard(news, index));
      });
      DOM.searchResults.appendChild(fragment);
    },

    /**
     * 清除搜索结果，恢复搜索建议
     */
    clearResults() {
      DOM.searchResults.classList.add('hidden');
      DOM.searchResultInfo.classList.add('hidden');
      DOM.searchHistorySection.classList.remove('hidden');
      DOM.searchSuggestions.classList.remove('hidden');
    },

    /**
     * 添加搜索关键词到历史
     * @param {string} query 搜索关键词
     */
    addToHistory(query) {
      // 移除重复项
      const idx = AppState.searchHistory.indexOf(query);
      if (idx !== -1) {
        AppState.searchHistory.splice(idx, 1);
      }
      // 添加到开头
      AppState.searchHistory.unshift(query);
      // 最多保留20条
      AppState.searchHistory = AppState.searchHistory.slice(0, 20);
      // 持久化
      Storage.set(STORAGE_KEYS.SEARCH_HISTORY, AppState.searchHistory);
      // 重新渲染
      this.renderHistory();
    },

    /**
     * 渲染搜索历史
     */
    renderHistory() {
      DOM.searchHistoryList.innerHTML = '';
      if (AppState.searchHistory.length === 0) {
        DOM.searchHistorySection.classList.add('hidden');
        return;
      }

      DOM.searchHistorySection.classList.remove('hidden');
      const fragment = document.createDocumentFragment();
      AppState.searchHistory.forEach(query => {
        const item = document.createElement('span');
        item.className = 'search-history-item';
        item.textContent = query;
        item.addEventListener('click', () => {
          DOM.searchInput.value = query;
          DOM.searchClear.classList.add('visible');
          this.execute(query);
        });
        fragment.appendChild(item);
      });
      DOM.searchHistoryList.appendChild(fragment);
    },

    /**
     * 渲染热门搜索推荐
     */
    renderHotKeywords() {
      // 从标签中提取热门关键词
      const tagCount = {};
      NEWS_DATA.forEach(news => {
        news.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });

      // 按出现频次排序取前8
      const hotTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const fragment = document.createDocumentFragment();
      hotTags.forEach(([tag, count], index) => {
        const keyword = document.createElement('span');
        keyword.className = 'hot-keyword';
        keyword.innerHTML = `<span class="num">${index + 1}</span>${Home.escapeHtml(tag)}`;
        keyword.addEventListener('click', () => {
          DOM.searchInput.value = tag;
          DOM.searchClear.classList.add('visible');
          this.execute(tag);
        });
        fragment.appendChild(keyword);
      });
      DOM.hotKeywords.appendChild(fragment);
    }
  };

  /* ==================== 收藏模块 ==================== */
  const Favorites = {
    /**
     * 切换收藏状态
     * @param {number} newsId 新闻ID
     */
    toggle(newsId) {
      if (AppState.favorites.has(newsId)) {
        AppState.favorites.delete(newsId);
        Toast.show('已取消收藏');
      } else {
        AppState.favorites.add(newsId);
        Toast.show('已收藏');
      }

      // 持久化
      Storage.set(STORAGE_KEYS.FAVORITES, [...AppState.favorites]);

      // 更新所有页面上该新闻的收藏按钮状态
      this.updateAllButtons(newsId);

      // 更新收藏计数
      this.updateCount();
    },

    /**
     * 更新页面上所有对应新闻ID的收藏按钮
     * @param {number} newsId 新闻ID
     */
    updateAllButtons(newsId) {
      document.querySelectorAll(`.fav-btn[data-id="${newsId}"]`).forEach(btn => {
        const isFav = AppState.favorites.has(newsId);
        btn.classList.toggle('favorited', isFav);
        btn.innerHTML = isFav ? '&#9733;' : '&#9734;';
        btn.title = isFav ? '取消收藏' : '收藏';
      });
    },

    /**
     * 更新收藏计数
     */
    updateCount() {
      DOM.favCount.textContent = AppState.favorites.size;
    },

    /**
     * 渲染收藏列表
     */
    render() {
      this.updateCount();

      const favNews = NEWS_DATA.filter(news => AppState.favorites.has(news.id));

      if (favNews.length === 0) {
        DOM.favList.innerHTML = '';
        DOM.favList.classList.add('hidden');
        DOM.favEmpty.classList.remove('hidden');
        return;
      }

      DOM.favEmpty.classList.add('hidden');
      DOM.favList.classList.remove('hidden');
      DOM.favList.innerHTML = '';

      const fragment = document.createDocumentFragment();
      favNews.forEach((news, index) => {
        fragment.appendChild(Home.createNewsCard(news, index));
      });
      DOM.favList.appendChild(fragment);
    }
  };

  /* ==================== 新闻详情弹窗 ==================== */
  const Modal = {
    /**
     * 打开新闻详情弹窗
     * @param {Object} news 新闻数据
     */
    open(news) {
      DOM.modalTitle.textContent = news.title;
      DOM.modalSummary.textContent = news.summary;
      DOM.modalDetail.textContent = news.detail;

      // 渲染元信息
      DOM.modalMeta.innerHTML = `
        <span class="meta-item">&#128197; ${news.date}</span>
        <span class="meta-item">&#127760; ${Home.escapeHtml(news.source)}</span>
        <span class="meta-item">&#128293; 热度 ${Home.formatHot(news.hot)}</span>
        <span class="meta-item">&#128204; ${Home.escapeHtml(news.category)}</span>
      `;

      DOM.newsModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    },

    /**
     * 关闭弹窗
     */
    close() {
      DOM.newsModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  /* ==================== 虚拟滚动模块 ==================== */
  const VirtualScroll = {
    /**
     * 初始化虚拟滚动
     * 适用于长列表场景的性能优化
     * 在当前数据量（15条）下，主要作为架构预留
     * 当数据量超过50条时将显著提升渲染性能
     */
    init() {
      // 使用IntersectionObserver实现懒加载可见区域检测
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const card = entry.target;
                card.classList.add('visible');
                this.observer.unobserve(card);
              }
            });
          },
          {
            root: null,
            rootMargin: '100px 0px',
            threshold: 0.1
          }
        );
      }
    },

    /**
     * 观察卡片元素，实现懒加载
     * @param {HTMLElement} element 待观察的元素
     */
    observe(element) {
      if (this.observer) {
        this.observer.observe(element);
      }
    },

    /**
     * 批量观察多个元素
     * @param {NodeList|Array} elements 元素集合
     */
    observeAll(elements) {
      if (this.observer) {
        elements.forEach(el => this.observe(el));
      }
    }
  };

  /* ==================== 事件绑定 ==================== */
  function bindGlobalEvents() {
    // 底部导航切换
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        Router.switchTo(item.dataset.page);
      });
    });

    // 弹窗关闭
    DOM.newsModal.addEventListener('click', (e) => {
      if (e.target === DOM.newsModal) {
        Modal.close();
      }
    });

    // 弹窗下滑关闭
    let touchStartY = 0;
    DOM.modalSheet.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    DOM.modalSheet.addEventListener('touchmove', (e) => {
      const scrollTop = DOM.modalSheet.scrollTop;
      // 仅在滚动到顶部时才允许下滑关闭
      if (scrollTop <= 0) {
        const deltaY = e.touches[0].clientY - touchStartY;
        if (deltaY > 80) {
          Modal.close();
        }
      }
    }, { passive: true });

    // 收藏页"去逛逛"按钮
    DOM.goBrowse.addEventListener('click', () => {
      Router.switchTo('home');
    });
  }

  /* ==================== 应用初始化 ==================== */
  function init() {
    // 1. 缓存DOM元素
    cacheDOMElements();

    // 2. 初始化本地存储
    Storage.init();

    // 3. 初始化虚拟滚动
    VirtualScroll.init();

    // 4. 渲染首页
    CategoryFilter.render();
    Home.renderNewsList();

    // 5. 初始化趋势页数据（首次不显示，但提前准备）
    Trend.init();

    // 6. 初始化搜索页
    Search.init();

    // 7. 初始化收藏页计数
    Favorites.updateCount();

    // 8. 绑定全局事件
    bindGlobalEvents();

    // 9. 对列表中的卡片应用虚拟滚动观察
    VirtualScroll.observeAll(DOM.newsList.querySelectorAll('.news-card'));

    console.log('[AI热点速递] 应用初始化完成');
  }

  /* ==================== 启动应用 ==================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
