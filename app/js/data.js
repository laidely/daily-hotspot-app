/**
 * AI热点效率站 - Mock 数据层
 * --------------------------------------------------
 * 本文件集中管理应用所需的本地数据，包含：
 *   1. 热点新闻流（12 条，覆盖腾讯/字节/阿里/百度/360 等 2026.08 AI 办公热点）
 *   2. 效率工具推荐（7 款，含评分、适用场景）
 *   3. 大佬圆桌视角（马斯克 / 雷军 / 张一鸣 / 王兴）
 *   4. AI 助手问答知识库（关键词匹配 + 通用兜底）
 *   5. 应用配置常量
 *
 * 说明：图片采用 picsum.photos 占位（带 seed 保证稳定），
 *      配合 CSS 渐变兜底，离线也能优雅降级。
 * 挂载到全局 window.APP_DATA，供 app.js 消费。
 */
(function (global) {
  'use strict';

  /* =========================================================
   * 1. 热点新闻流数据（≥10 条）
   * 字段：id / title / source / summary / heat(热度值) /
   *       tags / cover(封面) / time / category
   * ========================================================= */
  const NEWS_LIST = [
    {
      id: 'n01',
      title: '腾讯 WorkBuddy 月访问量达 2097 万，稳居 AI 办公智能体榜首',
      source: '36氪',
      summary: '数据显示腾讯 WorkBuddy 凭借微信生态与企业微信打通，月访问量突破 2097 万，超越飞书与钉钉，成为国内 AI 办公智能体赛道流量第一。',
      heat: 9821,
      tags: ['腾讯', 'WorkBuddy', '市场第一'],
      cover: 'https://picsum.photos/seed/workbuddy/600/360',
      time: '2 小时前',
      category: 'market'
    },
    {
      id: 'n02',
      title: '字节飞书正式并入豆包，统一 AI 办公入口',
      source: '晚点 LatePost',
      summary: '字节跳动宣布将飞书团队并入豆包业务线，整合文档、会议、即时通讯与 AI 能力，终结内部产品赛马，统一以「豆包办公」对外。',
      heat: 8744,
      tags: ['字节', '飞书', '豆包', '整合'],
      cover: 'https://picsum.photos/seed/feishu/600/360',
      time: '3 小时前',
      category: 'product'
    },
    {
      id: 'n03',
      title: '阿里千问办公整合三款产品，打造企业智能体平台',
      source: '钛媒体',
      summary: '阿里将通义千问、钉钉 AI、瓴羊智能三款产品整合为「千问办公」，提供从协同到决策的企业级 Agent 平台，瞄准中大型企业市场。',
      heat: 7650,
      tags: ['阿里', '千问办公', '企业智能体'],
      cover: 'https://picsum.photos/seed/qwen/600/360',
      time: '4 小时前',
      category: 'product'
    },
    {
      id: 'n04',
      title: '百度发布 Agent 矩阵，覆盖搜索、办公、营销全场景',
      source: '极客公园',
      summary: '百度推出文心智能体平台 Agent 矩阵，开放低代码搭建，企业可 10 分钟内创建专属决策型 Agent，已接入搜索流量分发。',
      heat: 6890,
      tags: ['百度', 'Agent矩阵', '低代码'],
      cover: 'https://picsum.photos/seed/baidu/600/360',
      time: '6 小时前',
      category: 'product'
    },
    {
      id: 'n05',
      title: '360 纳米 Work 上线，主打中小企业 AI 落地「工兵」能力',
      source: '虎嗅',
      summary: '360 推出面向中小企业的纳米 Work，主打「开箱即用」的 AI 工兵能力，覆盖合同、报表、客服等高频场景，月费低至 99 元。',
      heat: 6120,
      tags: ['360', '纳米Work', '中小企业'],
      cover: 'https://picsum.photos/seed/360work/600/360',
      time: '8 小时前',
      category: 'market'
    },
    {
      id: 'n06',
      title: '全球 AI Agent 市场预计达 187 亿美元，同比暴增 215%',
      source: 'IDC 报告',
      summary: 'IDC 最新报告预测 2026 年全球 AI Agent 市场规模将达 187 亿美元，同比增长 215%，标志着 AI Agent 进入规模化落地之年。',
      heat: 9540,
      tags: ['行业报告', '市场规模', '215%'],
      cover: 'https://picsum.photos/seed/market/600/360',
      time: '10 小时前',
      category: 'industry'
    },
    {
      id: 'n07',
      title: 'AI Agent 从「执行型」向「决策型」进化，决策可追溯成关键',
      source: '量子位',
      summary: '行业专家指出，新一代 Agent 不再仅执行指令，而是参与业务决策；决策链路可追溯、可审计成为企业落地的核心诉求。',
      heat: 7230,
      tags: ['决策型Agent', '可追溯', '趋势'],
      cover: 'https://picsum.photos/seed/agent/600/360',
      time: '12 小时前',
      category: 'trend'
    },
    {
      id: 'n08',
      title: 'OpenAI 发布 GPT-6，多模态推理与长程任务能力大幅跃升',
      source: 'The Verge',
      summary: 'OpenAI 发布 GPT-6，在多模态推理、长程任务规划与工具调用稳定性上显著提升，企业 API 调用成本下降 30%。',
      heat: 8990,
      tags: ['OpenAI', 'GPT-6', '多模态'],
      cover: 'https://picsum.photos/seed/gpt6/600/360',
      time: '1 天前',
      category: 'tech'
    },
    {
      id: 'n09',
      title: 'Anthropic Claude 企业版支持百万级 Token 上下文',
      source: 'TechCrunch',
      summary: 'Anthropic 推出 Claude 企业版，支持 100 万 Token 上下文，可直接消化企业知识库与代码仓库，主打合规与安全。',
      heat: 6780,
      tags: ['Anthropic', 'Claude', '长上下文'],
      cover: 'https://picsum.photos/seed/claude/600/360',
      time: '1 天前',
      category: 'tech'
    },
    {
      id: 'n10',
      title: '谷歌 Gemini Workspace 全面接入 Agent 能力',
      source: 'Google Blog',
      summary: '谷歌将 Gemini Agent 能力全面植入 Workspace，文档、表格、邮件均可一键调用智能体完成跨应用任务编排。',
      heat: 6450,
      tags: ['谷歌', 'Gemini', 'Workspace'],
      cover: 'https://picsum.photos/seed/gemini/600/360',
      time: '1 天前',
      category: 'product'
    },
    {
      id: 'n11',
      title: 'AI 编程工具 Cursor 估值突破百亿美元，开发者市场持续火热',
      source: '信息早知道',
      summary: 'AI 代码编辑器 Cursor 完成新一轮融资，估值突破 100 亿美元，月活开发者超 200 万，引领「AI 原生开发」浪潮。',
      heat: 7980,
      tags: ['Cursor', 'AI编程', '估值'],
      cover: 'https://picsum.photos/seed/cursor/600/360',
      time: '2 天前',
      category: 'tech'
    },
    {
      id: 'n12',
      title: '国产 AI 芯片算力突破，大模型训练成本下降 40%',
      source: '财新网',
      summary: '多家国产芯片厂商发布新一代 AI 推理芯片，单卡算力提升 2.3 倍，带动大模型训练与推理成本整体下降约 40%。',
      heat: 5980,
      tags: ['国产芯片', '降本', '算力'],
      cover: 'https://picsum.photos/seed/chip/600/360',
      time: '2 天前',
      category: 'industry'
    }
  ];

  /* =========================================================
   * 2. 效率工具推荐数据（≥5 款）
   * 字段：id / name / icon / desc / rating / scenarios /
   *       category / price / vendor / highlight
   * ========================================================= */
  const TOOL_LIST = [
    {
      id: 't01',
      name: '腾讯 WorkBuddy',
      icon: '🤝',
      desc: '依托微信与企业微信生态的企业协作智能体，覆盖任务跟进、会议纪要、审批自动化。',
      rating: 4.8,
      scenarios: ['企业协同', '会议纪要', '审批流'],
      category: '协作办公',
      price: '企业版按席位计费',
      vendor: '腾讯',
      highlight: '生态打通第一'
    },
    {
      id: 't02',
      name: '豆包办公（飞书）',
      icon: '🚀',
      desc: '字节系一体化 AI 办公，整合文档、表格、多维表格与豆包大模型，擅长内容创作与项目协同。',
      rating: 4.7,
      scenarios: ['内容创作', '项目协同', '多维表格'],
      category: '协作办公',
      price: '免费版 + 付费版',
      vendor: '字节跳动',
      highlight: '创作体验最佳'
    },
    {
      id: 't03',
      name: '阿里千问办公',
      icon: '🧠',
      desc: '企业级智能体平台，支持低代码搭建决策型 Agent，打通钉钉组织架构与业务数据。',
      rating: 4.6,
      scenarios: ['智能体搭建', '数据分析', '中大型企业'],
      category: '智能体平台',
      price: '按用量计费',
      vendor: '阿里巴巴',
      highlight: '企业智能体首选'
    },
    {
      id: 't04',
      name: '360 纳米 Work',
      icon: '🛡️',
      desc: '面向中小企业的开箱即用 AI 工兵，覆盖合同、报表、客服高频场景，低门槛快速落地。',
      rating: 4.4,
      scenarios: ['中小企业', '合同处理', '智能客服'],
      category: '中小企业',
      price: '月费 99 元起',
      vendor: '360',
      highlight: '中小企业工兵'
    },
    {
      id: 't05',
      name: 'Cursor',
      icon: '💻',
      desc: 'AI 原生代码编辑器，支持全仓库上下文理解、智能补全与多文件重构，开发者效率倍增器。',
      rating: 4.9,
      scenarios: ['AI 编程', '代码重构', '技术提效'],
      category: '研发提效',
      price: '$20/月起',
      vendor: 'Anysphere',
      highlight: '开发者最爱'
    },
    {
      id: 't06',
      name: '通义灵码',
      icon: '⚡',
      desc: '阿里出品的 AI 编程助手，IDE 插件形态，支持 200+ 语言，国产合规友好。',
      rating: 4.5,
      scenarios: ['代码补全', '单元测试', '国产合规'],
      category: '研发提效',
      price: '个人免费',
      vendor: '阿里巴巴',
      highlight: '国产编程助手'
    },
    {
      id: 't07',
      name: 'Notion AI',
      icon: '📝',
      desc: '知识管理与协作平台内置 AI，擅长文档总结、写作润色与数据库智能问答。',
      rating: 4.6,
      scenarios: ['知识管理', '文档总结', '团队 Wiki'],
      category: '知识管理',
      price: '$10/人/月起',
      vendor: 'Notion',
      highlight: '知识库智能问答'
    }
  ];

  /* =========================================================
   * 3. 大佬圆桌视角数据（4 位）
   * 字段：id / name / role / avatar(emoji 头像) / color(主题色) /
   *       viewpoint(核心观点) / detail(展开洞察) / tags
   * ========================================================= */
  const PERSPECTIVES = [
    {
      id: 'p01',
      name: '马斯克',
      role: 'xAI / Tesla 创始人',
      avatar: '🔥',
      color: '#ff6b35',
      viewpoint: 'AI 必须嵌入真实工作流，而非又一个孤岛工具',
      detail: '装一堆 AI 工具还加班，本质是工具没有进入工作流。真正的 Agent 应像「数字员工」自主完成端到端任务，执行型只是开始，决策型才是未来，且每一步决策都必须可追溯。',
      tags: ['工作流嵌入', '决策型Agent', '可追溯']
    },
    {
      id: 'p02',
      name: '雷军',
      role: '小米集团创始人',
      avatar: '⚡',
      color: '#ff6900',
      viewpoint: '中小企业缺的不是 AI，而是能落地的「工兵」',
      detail: '大厂在卷智能体平台，但 90% 的中小企业连第一个 AI 场景都没跑通。市场需要开箱即用、低门槛、敢承诺效果的 AI 工兵，降本增效才是中小企业的真刚需。',
      tags: ['中小企业', 'AI工兵', '降本增效']
    },
    {
      id: 'p03',
      name: '张一鸣',
      role: '字节跳动创始人',
      avatar: '🎯',
      color: '#3b82f6',
      viewpoint: '信息过载的解法是智能分发与无感嵌入',
      detail: '每天 AI 热点爆炸，用户不是缺信息而是缺有效信息。工具要做减法，把 AI 能力无感嵌入既有协作流，用推荐算法把对的热点、对的工具推给对的人，减少决策摩擦。',
      tags: ['信息过载', '智能分发', '无感嵌入']
    },
    {
      id: 'p04',
      name: '王兴',
      role: '美团创始人',
      avatar: '💡',
      color: '#22c55e',
      viewpoint: 'AI 决策可追溯，是企业落地的信任底线',
      detail: '企业用 AI 做决策，最怕「黑盒」。决策链路必须可解释、可审计、可回滚，这是 AI 进入核心业务的门票。大厂产品赛马内耗、整合混乱，反而给了专注做可追溯架构的团队机会。',
      tags: ['决策可追溯', '可审计', '信任底线']
    }
  ];

  /* =========================================================
   * 4. AI 助手问答知识库
   * 采用「关键词命中规则 + 通用兜底」的本地匹配策略。
   * 每条规则：keywords(任一命中) / reply(回复内容，支持多段) /
   *           followups(推荐追问)
   * ========================================================= */
  const AI_QA_RULES = [
    {
      keywords: ['腾讯', 'workbuddy', '企业微信'],
      reply: [
        '腾讯 WorkBuddy 是当前 AI 办公智能体赛道流量第一（月访问 2097 万）。',
        '它的核心优势在于打通微信生态与企业微信，任务跟进、会议纪要、审批自动化可在一个入口完成。',
        '适合：注重社交协同与移动办公的企业团队。'
      ],
      followups: ['和飞书比怎么选？', '中小企业适合吗？']
    },
    {
      keywords: ['字节', '飞书', '豆包'],
      reply: [
        '字节已将飞书并入豆包，统一为「豆包办公」入口，终结内部赛马。',
        '整合后文档、多维表格、会议与豆包大模型深度协同，内容创作与项目协同体验领先。',
        '适合：内容密集型团队与注重创作体验的组织。'
      ],
      followups: ['豆包办公收费吗？', '和钉钉比如何？']
    },
    {
      keywords: ['阿里', '千问', '钉钉', '瓴羊'],
      reply: [
        '阿里将通义千问、钉钉 AI、瓴羊智能整合为「千问办公」，定位企业级智能体平台。',
        '亮点是低代码搭建决策型 Agent，并打通组织架构与业务数据。',
        '适合：中大型企业、需要自定义智能体与数据驱动的团队。'
      ],
      followups: ['怎么搭建智能体？', '费用贵吗？']
    },
    {
      keywords: ['360', '纳米', '中小企业', '工兵'],
      reply: [
        '360 纳米 Work 主打中小企业「开箱即用」的 AI 工兵能力。',
        '覆盖合同、报表、客服等高频场景，月费 99 元起，低门槛快速落地。',
        '适合：预算有限、缺技术人手的中小企业。'
      ],
      followups: ['99元能做什么？', '和钉钉免费版比？']
    },
    {
      keywords: ['百度', 'agent矩阵', '文心'],
      reply: [
        '百度推出文心智能体平台 Agent 矩阵，开放低代码搭建。',
        '企业可 10 分钟内创建专属决策型 Agent，并接入百度搜索流量分发。',
        '适合：有获客需求、希望借助搜索流量的企业。'
      ],
      followups: ['怎么接入搜索流量？', '需要技术能力吗？']
    },
    {
      keywords: ['市场规模', '187亿', '215%', '行业', '报告'],
      reply: [
        'IDC 预测 2026 年全球 AI Agent 市场达 187 亿美元，同比 +215%。',
        '这意味着 AI Agent 进入规模化落地之年，从执行型走向决策型。',
        '机会点：决策可追溯、垂直行业落地、中小企业工兵。'
      ],
      followups: ['哪些行业机会大？', '决策型Agent是什么？']
    },
    {
      keywords: ['决策型', '执行型', '可追溯', '可审计'],
      reply: [
        '执行型 Agent 只跑指令，决策型 Agent 参与业务判断并给出建议。',
        '决策型的关键在于：链路可解释、过程可审计、结果可回滚，这是企业信任的底线。',
        '落地建议：先在高容错场景验证可追溯架构，再迁移到核心业务。'
      ],
      followups: ['怎么实现可追溯？', '哪些场景适合？']
    },
    {
      keywords: ['信息过载', '热点', '选择困难', '推荐'],
      reply: [
        '应对信息过载的核心是「智能分发 + 无感嵌入」。',
        '1）用推荐算法把对的热点推给对的人；2）把 AI 能力嵌入既有工作流而非新增工具。',
        '本应用的「热点流 + 工具推荐 + 大佬视角」正是为降低你的决策摩擦而设计。'
      ],
      followups: ['怎么选工具？', '热点怎么看更高效？']
    },
    {
      keywords: ['编程', 'cursor', '代码', '通义灵码'],
      reply: [
        'AI 编程提效首推 Cursor（开发者最爱，全仓库上下文，$20/月起）。',
        '国产合规场景可用通义灵码（IDE 插件，个人免费，支持 200+ 语言）。',
        '建议：日常补全用免费工具，复杂重构用 Cursor。'
      ],
      followups: ['通义灵码免费吗？', 'Cursor 值得付费吗？']
    },
    {
      keywords: ['痛点', '加班', '内耗', '赛马'],
      reply: [
        '当前 AI 办公四大痛点：',
        '① 工具难嵌入真实工作流——装了多个仍加班；',
        '② 大厂赛马内耗、整合混乱——用户无所适从；',
        '③ 中小企业缺 AI 落地工兵；',
        '④ Agent 决策不可追溯，企业不敢用。',
        '破局关键：无感嵌入 + 开箱即用 + 可追溯。'
      ],
      followups: ['中小企业怎么破局？', '决策可追溯怎么做？']
    }
  ];

  // 通用兜底回复
  const AI_FALLBACK = {
    reply: [
      '这是一个很好的问题。我目前掌握 2026.08 AI 办公领域的热点与工具信息。',
      '你可以问我：腾讯/字节/阿里/百度/360 的 AI 办公产品对比、AI Agent 市场趋势、中小企业如何选型、编程工具推荐等。',
      '也可以点击下方推荐问题快速了解。'
    ],
    followups: ['AI 办公工具怎么选？', 'AI Agent 市场多大？', '中小企业适合哪款？', '当前有哪些痛点？']
  };

  /* =========================================================
   * 5. 应用配置常量
   * ========================================================= */
  const CONFIG = {
    appName: 'AI热点效率站',
    // 热点流每页加载条数（模拟分页）
    pageSize: 6,
    // 热度值阈值（高于视为「热」）
    hotThreshold: 7000,
    // 本地存储键名
    storageKeys: {
      favorites: 'aieff_favorites',
      history: 'aieff_history',
      theme: 'aieff_theme',
      lastTab: 'aieff_lasttab'
    }
  };

  /* =========================================================
   * 暴露到全局
   * ========================================================= */
  global.APP_DATA = {
    NEWS_LIST: NEWS_LIST,
    TOOL_LIST: TOOL_LIST,
    PERSPECTIVES: PERSPECTIVES,
    AI_QA_RULES: AI_QA_RULES,
    AI_FALLBACK: AI_FALLBACK,
    CONFIG: CONFIG
  };
})(window);
