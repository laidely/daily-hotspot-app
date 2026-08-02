/**
 * ============================================================================
 *  DailyHotspot 每日热点智能聚合器 —— 模拟数据层 (data.js)
 * ============================================================================
 *  职责：为纯前端 H5 应用提供全部模拟数据，无需后端即可运行。
 *  数据维度：
 *    1. 分类配置 CATEGORIES
 *    2. 热点信息流 HOT_NEWS（含 AI 摘要 + 多视角解读）
 *    3. 名人画像 CELEBRITIES（马斯克/雷军/张一鸣/王兴）
 *    4. 用户画像 USER_PROFILE（兴趣标签、阅读统计）
 *    5. 效率仪表盘初始数据 EFFICIENCY_STATS
 *    6. 推荐兴趣标签 INTEREST_TAGS
 *
 *  团队角色对应：
 *    - Python 全栈工程师：负责后端 API 与数据处理（此处以纯前端 mock 替代）
 *    - IT 项目经理：负责需求管理与数据结构设计
 * ============================================================================
 */

(function (global) {
  'use strict';

  /* ==========================================================================
   * 1. 分类配置
   * 对应需求：支持分类筛选（AI应用 / 办公自动化 / 效率工具 / 开发者趋势）
   * ========================================================================== */
  const CATEGORIES = [
    { id: 'all', name: '全部', icon: '🏷️', color: '#5b8def' },
    { id: 'ai-app', name: 'AI应用', icon: '🤖', color: '#7c5cff' },
    { id: 'office-automation', name: '办公自动化', icon: '💼', color: '#0bb6a6' },
    { id: 'efficiency-tools', name: '效率工具', icon: '⚡', color: '#f5a623' },
    { id: 'developer-trends', name: '开发者趋势', icon: '👨‍💻', color: '#ff6b6b' }
  ];

  /* ==========================================================================
   * 2. 名人画像
   * 对应需求：模拟马斯克/雷军/张一鸣/王兴四位名人的观点
   * ========================================================================== */
  const CELEBRITIES = [
    {
      id: 'musk',
      name: '马斯克',
      title: '特斯拉 / xAI 创始人',
      avatar: '🧔‍♂️',
      color: '#e74c3c',
      style: '第一性原理 · 极限工程视角'
    },
    {
      id: 'leijun',
      name: '雷军',
      title: '小米集团 创始人',
      avatar: '👨‍💼',
      color: '#ff6900',
      style: '产品经理 · 性价比与生态视角'
    },
    {
      id: 'zhangyiming',
      name: '张一鸣',
      title: '字节跳动 创始人',
      avatar: '🧑‍💼',
      color: '#00d4aa',
      style: '算法驱动 · 信息分发视角'
    },
    {
      id: 'wangxing',
      name: '王兴',
      title: '美团 创始人',
      avatar: '👨‍🔧',
      color: '#ffc400',
      style: '商业落地 · 本地生活视角'
    }
  ];

  /* ==========================================================================
   * 3. 热点信息流核心数据
   * 基于 2026 年 8 月 2 日热点分析，每条包含：
   *   - 基础信息 (id/title/category/source/publishTime/hot)
   *   - 摘要 summary（列表展示）
   *   - AI 深度摘要 aiSummary（点击展开）
   *   - 多视角解读 perspectives（按名人 id 索引）
   *   - 标签 tags（用于搜索与推荐）
   *   - 图片占位符（SVG data-uri，用于懒加载演示）
   * ========================================================================== */
  const HOT_NEWS = [
    {
      id: 1,
      title: '桌面AI Agent时代爆发，WorkBuddy月访问量突破2000万',
      category: 'ai-app',
      summary: '桌面端AI Agent迎来爆发式增长，WorkBuddy以月活2000万登顶，标志着AI从"对话工具"走向"主动操作"。',
      aiSummary: 'WorkBuddy 月访问量突破2000万，标志着桌面AI Agent从尝鲜期进入主流采用期。其核心突破在于：1) 跨应用上下文记忆，可串联浏览器、文档、日历；2) 主动任务编排，从"被动问答"升级为"主动执行"；3) 本地化隐私计算，敏感数据不出端。这意味着PC正在成为AI Agent的最大载体，传统SaaS按席位收费模式将受到"按任务计费"冲击。',
      source: 'AI前线',
      publishTime: '2026-08-02 09:30',
      hot: 9860,
      tags: ['AI Agent', 'WorkBuddy', '桌面端', '办公'],
      perspectives: {
        musk: 'Agent就该接管屏幕。2000万只是起点，当它能自主调试代码、预订机票时，才是真正的AGI前夜。',
        leijun: '桌面Agent是下一波入口级机会，小米澎湃OS的"超级小爱"也在做同样的事，关键是端云协同。',
        zhangyiming: '信息分发的终局不是给你看内容，而是替你完成动作。Agent让推荐从"内容推荐"升级为"行为推荐"。',
        wangxing: '能不能帮商家自动接单、自动核销才是真本事，办公场景之外，本地生活的Agent化空间更大。'
      }
    },
    {
      id: 2,
      title: 'Kimi发布MoonAgent智能体开发框架，可视化拖拽编排',
      category: 'developer-trends',
      summary: 'Kimi推出MoonAgent框架，支持可视化拖拽编排智能体，大幅降低Agent开发门槛。',
      aiSummary: 'MoonAgent 的核心价值在于"低代码化智能体开发"：通过可视化节点编排，开发者无需手写复杂的状态机即可定义工具调用、记忆与多Agent协作流程。框架内置了200+工具连接器、向量记忆池和评估闭环。这会让Agent开发从"算法工程师专属"下放到"产品经理可上手"，加速企业级Agent应用落地，但也带来治理与安全的新挑战。',
      source: 'Kimi官方',
      publishTime: '2026-08-02 10:15',
      hot: 8720,
      tags: ['Kimi', 'MoonAgent', '智能体', '低代码', '开发框架'],
      perspectives: {
        musk: '可视化编排是把双刃剑，易用性上去了，但黑盒风险也在增加，必须有可解释的执行轨迹。',
        leijun: '降低开发门槛就是降低成本，小米生态链企业可以更快做出差异化Agent应用。',
        zhangyiming: 'Agent编排框架会成为新的"操作系统"，谁掌握编排标准，谁就掌握下一代分发入口。',
        wangxing: '能快速接入美团开放平台的工具，本地生活自动化会再提速。'
      }
    },
    {
      id: 3,
      title: 'DeepSeek模型升级，Agent能力暴涨6倍（DeepSWE 7.3→54.4）',
      category: 'ai-app',
      summary: 'DeepSeek发布模型升级，在DeepSWE基准上Agent能力从7.3飙升至54.4，提升6倍。',
      aiSummary: 'DeepSeek在DeepSWE（软件工程智能体基准）上从7.3跃升至54.4，6倍提升意味着AI已能独立完成接近中级工程师水平的真实代码任务：跨文件重构、Bug定位、测试生成。这背后是长上下文(>1M token)、强化学习驱动的工具调用与"思考-行动"循环优化。对开发者而言，"AI写代码"正变为"AI交付功能"，人类角色转向需求定义与代码审查。',
      source: 'DeepSeek',
      publishTime: '2026-08-02 11:00',
      hot: 9540,
      tags: ['DeepSeek', 'DeepSWE', '代码Agent', '模型升级'],
      perspectives: {
        musk: '6倍提升说明Scaling Law在Agent维度依然有效，我们离能自主迭代自己的AI更近一步。',
        leijun: '国产模型进步神速，对国内开发者生态是巨大利好，小米将持续接入。',
        zhangyiming: '代码生成能力决定了Agent能不能自我进化，这是最关键的飞轮。',
        wangxing: '工程师效率提升6倍，意味着同样的人力能服务10倍用户，互联网的"人效天花板"被打破。'
      }
    },
    {
      id: 4,
      title: 'WPS灵犀/WPS Comate亮相ChinaJoy，办公从"生成"走向"维护"',
      category: 'office-automation',
      summary: '金山办公在ChinaJoy展示WPS灵犀与Comate，标志着办公AI从内容生成迈向文档全生命周期维护。',
      aiSummary: 'WPS灵犀与Comate的亮相释放出明确信号：办公AI的战场正从"生成一份新文档"转向"维护文档全生命周期"——自动续写、版本治理、合规检查、知识沉淀。这反映了企业真实痛点：文档存量远大于增量，AI的价值在于盘活存量知识。金山凭借文档格式标准和亿级用户基础，在企业办公Agent赛道具备先发优势。',
      source: 'ChinaJoy现场',
      publishTime: '2026-08-02 14:20',
      hot: 6310,
      tags: ['WPS', '金山办公', 'ChinaJoy', '文档维护', '办公'],
      perspectives: {
        musk: '文档维护是无聊但高价值的活，正是AI该干的事，比写PPT实在。',
        leijun: '金山是国内办公的基石，AI加持下生产力工具会焕发第二春，小米文档已接入。',
        zhangyiming: '企业知识库是金矿，谁能把存量文档变成可问答、可调用的Agent记忆，谁就赢。',
        wangxing: '美团有海量商户文档，办公AI维护能力可以直接赋能本地生活运营。'
      }
    },
    {
      id: 5,
      title: '谷歌AlphaEvolve正式GA，进化式代码优化即服务',
      category: 'developer-trends',
      summary: '谷歌AlphaEvolve正式GA（普遍可用），将进化算法用于代码优化，提供"代码优化即服务"。',
      aiSummary: 'AlphaEvolve GA标志着"进化式代码优化即服务"商业化落地：通过遗传算法+LLM对已有代码持续变异、评估、筛选，自动发现更优实现，已在谷歌内部优化了调度算法与硬件设计。这意味着代码不再是一次性产物，而是持续进化的生命体。对云厂商是新的订阅收入，对企业则是降本利器，但也对代码可测试性提出更高要求。',
      source: 'Google Cloud',
      publishTime: '2026-08-02 15:45',
      hot: 5890,
      tags: ['Google', 'AlphaEvolve', '进化算法', '代码优化', '云服务'],
      perspectives: {
        musk: '让代码自己进化，这本质上是在给软件装上基因，我看好。',
        leijun: '云原生+AI优化的组合拳，国内厂商要尽快跟上，避免被代差拉开。',
        zhangyiming: '持续优化能力决定了推荐系统的上限，进化式优化对算法团队是降维打击。',
        wangxing: '能自动优化配送调度算法，对美团即时物流价值巨大。'
      }
    },
    {
      id: 6,
      title: '84%开发者使用AI工具但效率仅提升10%',
      category: 'efficiency-tools',
      summary: '最新调研显示84%开发者已使用AI工具，但实际效率提升中位数仅10%，AI价值度量成新焦点。',
      aiSummary: '84%渗透率 vs 10%效率提升的反差，暴露了AI工具"用得多但用得浅"的问题：大多数开发者停留在补全代码片段，未深入Agent化工作流。根因有三：1) 工具分散，缺乏统一编排；2) 缺乏度量，不知道哪里真正提速；3) 技能断层，不会写高质量Prompt与Agent。这催生了"AI效率仪表盘"这一新品类——正是本应用(DailyHotspot)要解决的核心痛点：让AI价值可度量。',
      source: 'Stack Overflow调研',
      publishTime: '2026-08-02 08:00',
      hot: 7680,
      tags: ['开发者效率', 'AI工具', '效率度量', '调研'],
      perspectives: {
        musk: '10%说明工具还不够好，真正的AI应该让效率提升10倍，而不是10%。',
        leijun: '效率度量是关键，没有数据就没有改进，这也是小米做AI效率看板的原因。',
        zhangyiming: '问题在于工具没有打通，孤立工具的效率增益会被切换成本吃掉。',
        wangxing: '关键是把AI嵌进真实业务流程，而不是单独工具，流程再造才能质变。'
      }
    },
    {
      id: 7,
      title: 'Agentic Workflow取代单纯RAG成为企业新范式',
      category: 'developer-trends',
      summary: '行业共识形成：Agentic Workflow正取代单纯RAG，成为企业AI落地的新主流范式。',
      aiSummary: '单纯RAG（检索增强生成）正让位于Agentic Workflow（智能体工作流）。差异在于：RAG是"检索-回答"的单轮模式；Agentic Workflow是"规划-检索-行动-反思"的多轮闭环，能调用工具、迭代修正。企业价值在于把AI从"问答助手"升级为"数字员工"，可端到端完成报销审批、客户跟进等流程。这也意味着MLOps要演进为AgentOps，重点转向可观测性、护栏与回滚。',
      source: 'InfoQ',
      publishTime: '2026-08-02 12:30',
      hot: 6120,
      tags: ['Agentic Workflow', 'RAG', '企业AI', 'AgentOps'],
      perspectives: {
        musk: 'Workflow是Agent的脚手架，最终会被能自我进化的Agent取代，但现阶段不可少。',
        leijun: '企业落地需要这种可编排、可治理的范式，比裸调模型靠谱得多。',
        zhangyiming: 'Workflow让AI从内容生产进入业务流程，分发逻辑也要从"内容"转向"任务"。',
        wangxing: '能跑通一个完整的商户入驻流程，就是真金白银的降本。'
      }
    },
    {
      id: 8,
      title: '浙江实施AI OPC团体标准，"一人公司"获术语定义',
      category: 'ai-app',
      summary: '浙江率先实施AI OPC团体标准，首次为"一人公司"(One-Person Company)给出标准术语定义。',
      aiSummary: '浙江AI OPC团体标准的实施具有里程碑意义：首次从行业标准层面定义"一人公司"——由AI Agent承担绝大多数运营职能、单人即可运转的公司形态。这意味着：1) 监管开始正视AI对组织形态的重塑；2) 注册、税务、责任认定将出现新规则；3) 创业门槛大幅下降，"超级个体"时代加速到来。对个人是机遇，对传统岗位是冲击。',
      source: '浙江省经信厅',
      publishTime: '2026-08-02 16:00',
      hot: 5340,
      tags: ['AI标准', '一人公司', 'OPC', '政策', '浙江'],
      perspectives: {
        musk: '一人公司只是开始，最终会是一人帝国，AI让组织的最小单元无限缩小。',
        leijun: '政策先行非常关键，浙江的举措会催生大量AI创业者，小米愿做基础设施。',
        zhangyiming: '超级个体的涌现会重构内容与商品的分发逻辑，平台要为新供给做准备。',
        wangxing: '一个人就能开店运营，本地生活的商户数量会爆炸式增长。'
      }
    },
    {
      id: 9,
      title: 'Sam Altman：OpenAI竞争延伸至芯片、能源与Agent',
      category: 'ai-app',
      summary: 'Sam Altman表示OpenAI的竞争已延伸至芯片、能源与Agent三大领域，AI竞赛进入全栈时代。',
      aiSummary: 'Sam Altman的表态揭示了AI竞争的全栈化趋势：从模型层延伸到芯片(自研算力)、能源(核电协议)与Agent(应用层)。逻辑是：算力是瓶颈、能源是算力的瓶颈、Agent是价值的出口。这意味着未来AI巨头比拼的是"模型+算力+能源+应用"的综合国力，纯模型公司生存空间被压缩。对中小玩家，找准单一环节做深仍是机会。',
      source: 'OpenAI',
      publishTime: '2026-08-02 17:30',
      hot: 7990,
      tags: ['OpenAI', 'Sam Altman', '芯片', '能源', 'Agent'],
      perspectives: {
        musk: '能源才是真正的瓶颈，我早就在说这个，核电是唯一出路。',
        leijun: '全栈竞争意味着投入门槛极高，国内需要国家队+企业协同。',
        zhangyiming: '模型层会被商品化，真正的差异化在Agent应用和能源效率。',
        wangxing: '算力成本决定AI服务能不能普惠到中小商户，能源是关键变量。'
      }
    },
    {
      id: 10,
      title: '多Agent编码成最大趋势，团队化AI协作落地',
      category: 'developer-trends',
      summary: '多Agent编码成为2026最大趋势，"规划Agent+编码Agent+测试Agent"团队化协作模式落地。',
      aiSummary: '多Agent编码(Multi-Agent Coding)成为年度最大趋势：单个编码Agent受限于上下文与角色单一，多Agent则模拟真实研发团队——规划Agent拆解需求、编码Agent实现、测试Agent验证、审查Agent把关。优势在于：上下文隔离避免污染、角色专精提升质量、并行加速交付。落地挑战是Agent间通信协议与冲突仲裁，这也是Anthropic、Cursor等竞相布局的方向。',
      source: 'GitHub趋势',
      publishTime: '2026-08-02 18:45',
      hot: 6870,
      tags: ['多Agent', '编码', '团队协作', 'Multi-Agent'],
      perspectives: {
        musk: '多个Agent协作迟早会涌现出自我意识式的协作，要小心失控。',
        leijun: '团队化AI让小团队拥有大公司的研发能力，对创业者是巨大利好。',
        zhangyiming: 'Agent之间的协作协议会成为新的"通信标准"，谁定标准谁占先机。',
        wangxing: '能自动完成需求到上线的全流程，研发组织形态会被重塑。'
      }
    }
  ];

  /* ==========================================================================
   * 4. 扩展热点（用于演示上拉加载更多 / 虚拟列表）
   * 由 Python 全栈工程师模拟"分页接口"返回的后续数据
   * ========================================================================== */
  const HOT_NEWS_EXTRA = [
    {
      id: 11,
      title: 'Cursor推出Agent Teams模式，单仓库支持并行多Agent',
      category: 'developer-trends',
      summary: 'Cursor发布Agent Teams模式，支持在单一仓库中并行调度多个编码Agent协同开发。',
      aiSummary: 'Cursor Agent Teams模式允许在单仓库下并行运行多个Agent，分别负责不同模块，由协调器统一合并。核心创新是"语义化文件锁"避免冲突，以及"差异优先合并"降低冲突率。这把多Agent编码从概念推向工程可用，但要求团队建立Agent工作量度量与计费模型。',
      source: 'Cursor',
      publishTime: '2026-08-02 19:10',
      hot: 4920,
      tags: ['Cursor', 'Agent Teams', '多Agent', '编码'],
      perspectives: {
        musk: '并行Agent是正确的方向，但要解决协调成本，否则1+1<2。',
        leijun: 'IDE是开发者入口，谁能把多Agent做顺，谁就掌控开发工作流。',
        zhangyiming: '并行能力决定了交付速度，是研发效率的下一个十倍点。',
        wangxing: '快速迭代能力对互联网公司是核心战斗力。'
      }
    },
    {
      id: 12,
      title: 'Notion AI上线"工作流Agent"，文档即自动化入口',
      category: 'office-automation',
      summary: 'Notion AI推出工作流Agent，将文档中的待办、表格直接转化为可执行自动化流程。',
      aiSummary: 'Notion工作流Agent的突破在于"文档即流程"：识别文档中的任务、表格、决策点，自动生成可执行Agent流程，实现"写下来即跑起来"。这降低了自动化门槛，但要求文档具备结构化语义。对办公协同赛道是降维打击，传统BPM工具面临重构。',
      source: 'Notion',
      publishTime: '2026-08-02 19:50',
      hot: 4310,
      tags: ['Notion', '工作流', '办公自动化', '文档'],
      perspectives: {
        musk: '文档直接变流程，省去了中间翻译层，思路很对。',
        leijun: '协同文档+自动化是天然组合，国内飞书、腾讯文档都在跟进。',
        zhangyiming: '把非结构化信息结构化，是AI最该干的脏活累活。',
        wangxing: '能自动跑商户工单流程，运营效率会显著提升。'
      }
    },
    {
      id: 13,
      title: 'LangChain发布LangGraph v2，多Agent状态图编排更稳',
      category: 'developer-trends',
      summary: 'LangChain发布LangGraph v2，引入确定性状态图，提升多Agent编排稳定性与可调试性。',
      aiSummary: 'LangGraph v2核心是把多Agent编排从隐式消息传递升级为显式状态图：节点=Agent/工具，边=状态转移，支持断点、回滚、时间旅行调试。这解决了多Agent"难以复现、难以调试"的工程痛点，让生产环境部署更可控，是企业级Agent平台的必备能力。',
      source: 'LangChain',
      publishTime: '2026-08-02 20:20',
      hot: 3980,
      tags: ['LangChain', 'LangGraph', '多Agent', '状态图'],
      perspectives: {
        musk: '可调试性是多Agent走向生产的生死线，方向正确。',
        leijun: '开源生态的成熟度决定了国内企业能不能低成本落地。',
        zhangyiming: '状态可回放意味着可以做A/B与归因，对推荐系统也有启发。',
        wangxing: '能回滚的Agent才敢用在真实业务上。'
      }
    },
    {
      id: 14,
      title: '效率工具评测：横向对比8款AI编程助手的真实提速',
      category: 'efficiency-tools',
      summary: '一份覆盖8款主流AI编程助手的横向评测出炉，实测显示提速差异可达3倍。',
      aiSummary: '该评测在统一任务集(120个真实issue)上对比8款AI编程助手，发现：头部工具在补全场景提速约35%，在Agent化任务(跨文件重构)提速可达3倍；但模型能力之外，IDE集成度、上下文管理与工具链打通对提速影响巨大。结论是：工具选择应按"任务类型"而非"品牌"决策，且需配套度量体系。',
      source: 'ThoughtWorks',
      publishTime: '2026-08-02 20:55',
      hot: 3650,
      tags: ['AI编程', '效率工具', '评测', '对比'],
      perspectives: {
        musk: '3倍差异说明工具质量参差，市场会快速出清。',
        leijun: '实测数据最有说服力，小米内部也建立了类似评测基准。',
        zhangyiming: '度量是改进的前提，没有基准就没有进步。',
        wangxing: '按任务选工具，而不是迷信单一品牌，很务实。'
      }
    },
    {
      id: 15,
      title: 'Anthropic推出Agent可观测性平台，主打"行为审计"',
      category: 'efficiency-tools',
      summary: 'Anthropic上线Agent可观测性平台，主打Agent行为审计与回溯，填补治理空白。',
      aiSummary: 'Anthropic可观测性平台聚焦Agent"黑盒"问题：记录每次工具调用、决策依据与中间状态，支持行为回放与合规审计。这回应了监管对AI可解释的要求，也是企业把Agent用于金融、医疗等高风险场景的前提。可观测性正成为Agent平台的标配能力。',
      source: 'Anthropic',
      publishTime: '2026-08-02 21:30',
      hot: 3320,
      tags: ['Anthropic', '可观测性', '审计', '治理'],
      perspectives: {
        musk: '审计是必要的，但不能成为创新枷锁，要平衡。',
        leijun: '合规是大规模商用的前提，可观测性平台价值很大。',
        zhangyiming: '行为可回放也是训练数据的来源，能反哺模型。',
        wangxing: '金融、医疗场景的Agent必须有审计能力，否则不敢用。'
      }
    },
    {
      id: 16,
      title: '国产AI芯片"芯擎X2"量产，单卡推理性能逼近国际旗舰',
      category: 'ai-app',
      summary: '国产AI芯片芯擎X2量产，单卡推理性能逼近国际旗舰，算力国产化再进一步。',
      aiSummary: '芯擎X2量产意味着国产推理芯片在性价比上具备竞争力，单卡性能达到国际旗舰的90%，功耗低15%。对国内AI应用层是利好：降低推理成本、缓解供应链风险，也利于"一人公司"等低成本形态。但训练芯片与生态软件栈仍有差距，需持续投入。',
      source: '芯擎科技',
      publishTime: '2026-08-02 22:00',
      hot: 4560,
      tags: ['AI芯片', '国产算力', '芯擎', '推理'],
      perspectives: {
        musk: '国产追赶速度惊人，但训练芯片才是真正的护城河。',
        leijun: '算力国产化对小米终端AI部署是关键保障。',
        zhangyiming: '推理成本下降直接利好应用层，更多Agent能跑起来。',
        wangxing: '算力普惠到中小商户，本地生活AI化会加速。'
      }
    },
    {
      id: 17,
      title: '飞书推出"AI会议纪要Agent"，会后自动生成待办并派发',
      category: 'office-automation',
      summary: '飞书上线AI会议纪要Agent，会议结束自动生成纪要、提取待办并派发给责任人。',
      aiSummary: '飞书AI会议纪要Agent实现了"开会即执行"：实时转写、自动提炼决策与待办、按发言人归因，并直接在飞书任务中派发，闭环到完成。这把会议从"信息交换"升级为"执行触发"，对中大型企业效率提升显著。难点在于待办质量与责任人识别准确率，需要组织数据治理配合。',
      source: '飞书',
      publishTime: '2026-08-02 22:35',
      hot: 4120,
      tags: ['飞书', '会议纪要', '办公自动化', '待办'],
      perspectives: {
        musk: '会议本就该自动结案，早就该这么做了。',
        leijun: '协同工具的AI化是必然，飞书这条路线很扎实。',
        zhangyiming: '会议是信息密度最高的场景，AI提取价值最大。',
        wangxing: '会后的待办能自动跑到一线执行，运营闭环就完整了。'
      }
    },
    {
      id: 18,
      title: 'MCP协议生态突破5000+工具，成Agent互联互通事实标准',
      category: 'developer-trends',
      summary: 'MCP(Model Context Protocol)工具生态突破5000，正成为Agent互联互通的事实标准。',
      aiSummary: 'MCP协议生态突破5000+工具，标志着Agent"工具调用层"走向标准化：任何Agent都能通过统一协议接入任意工具，避免重复适配。这降低了Agent开发成本、提升了可移植性，类似USB之于硬件。标准化也带来生态集中风险，需要开放治理。MCP正成为Agent时代的"HTTP"。',
      source: 'Anthropic',
      publishTime: '2026-08-02 23:00',
      hot: 3870,
      tags: ['MCP', '协议', '工具生态', '标准'],
      perspectives: {
        musk: '统一协议是好事，但要警惕被单一公司把控。',
        leijun: '标准先行生态才能繁荣，小米会积极兼容。',
        zhangyiming: '协议即入口，掌握协议定义权就是掌握分发权。',
        wangxing: '工具能即插即用，本地生活自动化会爆发。'
      }
    },
    {
      id: 19,
      title: 'AI效率仪表盘赛道升温，多家厂商推出"AI ROI"度量产品',
      category: 'efficiency-tools',
      summary: '"AI ROI度量"赛道升温，多家厂商推出可视化仪表盘，量化AI投入产出。',
      aiSummary: 'AI ROI度量赛道升温，核心解决"AI到底省了多少成本"的量化难题：通过采集工具调用、任务完成、时间消耗等数据，可视化呈现AI带来的效率增益与成本节省。这与本应用(DailyHotspot)的效率仪表盘理念一致——让AI价值可度量。难点在于基线定义与归因，但市场已被点燃，企业采购决策将更依赖数据。',
      source: 'Gartner',
      publishTime: '2026-08-02 23:30',
      hot: 3490,
      tags: ['AI ROI', '效率仪表盘', '度量', '可视化'],
      perspectives: {
        musk: '能度量的才能管理，AI ROI是必须的。',
        leijun: '可视化让管理者敢投AI，对整个行业是利好。',
        zhangyiming: '度量数据本身也是资产，能反哺模型与策略。',
        wangxing: 'ROI数据让AI采购从"信仰"变"决策"，企业更敢用。'
      }
    },
    {
      id: 20,
      title: 'xAI开源Grok Agent SDK，主打"实时数据+开源"双引擎',
      category: 'developer-trends',
      summary: 'xAI开源Grok Agent SDK，结合实时X平台数据与开源策略，主打Agent实时性。',
      aiSummary: 'xAI开源Grok Agent SDK的差异化在于"实时数据"：直连X平台信息流，让Agent基于最新事件决策，这对新闻、舆情、交易类Agent价值巨大。开源策略意在快速建生态，挑战OpenAI闭源护城河。但实时数据也带来合规与隐私挑战，需配套治理。',
      source: 'xAI',
      publishTime: '2026-08-02 23:55',
      hot: 4280,
      tags: ['xAI', 'Grok', '开源', '实时数据', 'SDK'],
      perspectives: {
        musk: '实时数据是Grok的护城河，开源是为了让更多人用上。',
        leijun: '开源+实时数据组合很有吸引力，国内可借鉴。',
        zhangyiming: '实时数据对内容分发是核武器，时效即流量。',
        wangxing: '实时舆情能帮商家快速响应，价值很大。'
      }
    }
  ];

  /* ==========================================================================
   * 5. 用户画像与兴趣标签
   * 对应需求：基于用户兴趣标签的热点推荐
   * ========================================================================== */
  const INTEREST_TAGS = [
    'AI Agent', '代码生成', '办公自动化', '效率度量', '多Agent',
    '开源', '国产算力', '开发者工具', '企业AI', '实时数据'
  ];

  const USER_PROFILE = {
    nickname: '热点探索者',
    avatar: '🦊',
    level: 'Lv.5 AI前沿观察员',
    // 用户已选兴趣标签，用于个性化推荐
    interests: ['AI Agent', '代码生成', '多Agent', '开发者工具'],
    joinDate: '2026-07-01',
    stats: {
      readCount: 128,        // 累计阅读热点数
      summaryCount: 36,      // 累计生成AI摘要数
      favoriteCount: 12,     // 收藏数
      perspectiveView: 48    // 多视角解读查看数
    }
  };

  /* ==========================================================================
   * 6. 效率仪表盘初始数据
   * 对应需求：可视化展示用户的信息消费效率
   * ========================================================================== */
  const EFFICIENCY_STATS = {
    // 最近7天每日阅读热点数（用于柱状图）
    dailyRead: [8, 12, 6, 15, 10, 18, 14],
    // 分类偏好占比（用于环形图）
    categoryPreference: [
      { name: 'AI应用', value: 38 },
      { name: '开发者趋势', value: 32 },
      { name: '效率工具', value: 18 },
      { name: '办公自动化', value: 12 }
    ],
    // 关键指标
    metrics: {
      totalRead: 128,
      totalSummary: 36,
      avgReadTime: 3.2,     // 平均阅读时长(分钟)
      efficiencyScore: 78    // 效率得分(0-100)
    }
  };

  /* ==========================================================================
   * 7. 数据访问 API（模拟后端接口，由 Python 全栈工程师风格封装）
   *    设计原则：所有返回热点数据的方法均返回深拷贝，保证源数据不可变，
   *              避免外部修改污染内部状态（良好的 API 契约）。
   * ========================================================================== */

  /** 深拷贝工具（热点数据为纯数据结构，JSON 克隆安全可靠） */
  function deepClone(obj) {
    return obj == null ? null : JSON.parse(JSON.stringify(obj));
  }
  /** 批量深拷贝 */
  function deepCloneList(list) {
    return list.map(function (item) { return deepClone(item); });
  }

  const DataAPI = {
    /** 获取分类列表 */
    getCategories: function () { return deepCloneList(CATEGORIES); },

    /** 获取名人列表 */
    getCelebrities: function () { return deepCloneList(CELEBRITIES); },

    /**
     * 分页获取热点列表（模拟分页接口）
     * @param {number} page 页码，从1开始
     * @param {number} pageSize 每页条数
     * @returns {{list: Array, hasMore: boolean, page: number, total: number}}
     */
    getHotNewsByPage: function (page, pageSize) {
      page = Math.max(1, page | 0);
      pageSize = Math.max(1, pageSize | 0);
      const all = HOT_NEWS.concat(HOT_NEWS_EXTRA);
      const start = (page - 1) * pageSize;
      const list = all.slice(start, start + pageSize);
      return {
        list: deepCloneList(list),
        page: page,
        pageSize: pageSize,
        total: all.length,
        hasMore: start + pageSize < all.length
      };
    },

    /**
     * 获取全部热点（不分页，用于筛选/搜索/推荐）
     */
    getAllHotNews: function () { return deepCloneList(HOT_NEWS.concat(HOT_NEWS_EXTRA)); },

    /**
     * 按分类筛选热点
     * @param {string} categoryId 分类id，'all' 表示全部
     */
    filterByCategory: function (categoryId) {
      const all = HOT_NEWS.concat(HOT_NEWS_EXTRA);
      if (!categoryId || categoryId === 'all') return deepCloneList(all);
      return deepCloneList(all.filter(function (n) { return n.category === categoryId; }));
    },

    /**
     * 关键词搜索热点（在标题、摘要、标签中匹配）
     * @param {string} keyword 关键词，空白字符串视为无关键词返回空数组
     */
    search: function (keyword) {
      // 以 trim 后的结果判断是否为空，避免纯空白字符串匹配全部
      const kw = (keyword || '').trim().toLowerCase();
      if (!kw) return [];
      const all = HOT_NEWS.concat(HOT_NEWS_EXTRA);
      const matched = all.filter(function (n) {
        const inTitle = n.title.toLowerCase().indexOf(kw) >= 0;
        const inSummary = n.summary.toLowerCase().indexOf(kw) >= 0;
        const inTags = (n.tags || []).some(function (t) {
          return t.toLowerCase().indexOf(kw) >= 0;
        });
        return inTitle || inSummary || inTags;
      });
      return deepCloneList(matched);
    },

    /**
     * 个性化推荐：基于用户兴趣标签打分排序
     * @param {Array} interests 用户兴趣标签数组
     */
    recommend: function (interests) {
      const all = HOT_NEWS.concat(HOT_NEWS_EXTRA);
      const tags = interests || USER_PROFILE.interests;
      const scored = all.map(function (n) {
        let score = n.hot / 1000; // 基础分=热度
        (n.tags || []).forEach(function (t) {
          if (tags.indexOf(t) >= 0) score += 5; // 命中兴趣加分
        });
        return { news: n, score: score };
      });
      scored.sort(function (a, b) { return b.score - a.score; });
      return deepCloneList(scored.map(function (s) { return s.news; }));
    },

    /** 根据 id 获取热点详情（返回深拷贝） */
    getById: function (id) {
      const all = HOT_NEWS.concat(HOT_NEWS_EXTRA);
      const found = all.find(function (n) { return n.id === id; });
      return found ? deepClone(found) : null;
    },

    /** 获取用户画像 */
    getUserProfile: function () { return deepClone(USER_PROFILE); },

    /** 获取效率统计 */
    getEfficiencyStats: function () { return deepClone(EFFICIENCY_STATS); },

    /** 获取兴趣标签候选 */
    getInterestTags: function () { return INTEREST_TAGS.slice(); }
  };

  /* ==========================================================================
   * 8. 导出（挂载到全局 window.DailyHotspotData）
   * ========================================================================== */
  global.DailyHotspotData = {
    CATEGORIES: CATEGORIES,
    CELEBRITIES: CELEBRITIES,
    HOT_NEWS: HOT_NEWS,
    HOT_NEWS_EXTRA: HOT_NEWS_EXTRA,
    USER_PROFILE: USER_PROFILE,
    EFFICIENCY_STATS: EFFICIENCY_STATS,
    INTEREST_TAGS: INTEREST_TAGS,
    DataAPI: DataAPI
  };

})(typeof window !== 'undefined' ? window : this);
