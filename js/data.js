window.DemoData = (function () {
  var demoCase = {
    id: 'CASE-XH-001',
    companyName: '星瀚科技（虚构）',
    region: '中国深圳',
    industry: '消费电子',
    product: '无线蓝牙耳机',
    targetMarket: '美国',
    contact: '海外市场负责人（待确认姓名）',
    status: '有成熟的国内产品和销售经验，正在探索美国市场',
    challenges: ['海外品牌知名度较低', '缺乏海外社媒运营经验', '尚未建立成熟的广告投放策略'],
    needs: ['美国市场竞品分析', '海外社媒内容策划', 'TikTok / Instagram 营销', '小规模广告测试', '营销数据分析与优化'],
    demo: true
  };

  var leads = [
    {
      id: 'LEAD-001',
      company: '星瀚科技（虚构）',
      region: '中国深圳',
      industry: '消费电子',
      product: '无线蓝牙耳机',
      targetMarket: '美国',
      positioning: '无线耳机的续航、佩戴舒适度与真实使用体验',
      matchKeywords: ['earbuds', 'earbud', 'wireless', 'bluetooth', 'headphone', '耳机', '无线', '蓝牙', '音频'],
      signals: ['正在探索美国市场', '海外品牌知名度较低', '缺乏海外社媒运营经验', '尚未建立成熟广告投放策略'],
      scores: { industryFit: 92, outboundIntent: 88, capabilityGap: 85, reachability: 80 },
      recommendation: '行业与产品高度匹配，出海意向明确，且在海外社媒与广告投放能力上存在明显缺口，适合以“内容测试 + 数据复盘”切入。',
      sources: [
        { url: 'https://www.xinghan-tech.example.com', status: 'pending', checkedAt: null, result: '待人工核实 · 模拟核验', note: '演示数据，未实际访问' },
        { url: 'https://www.example-directory.org/xinghan', status: 'pending', checkedAt: null, result: '待人工核实 · 模拟核验', note: '演示数据，未实际访问' }
      ],
      demo: true
    },
    {
      id: 'LEAD-002',
      company: '蓝鲸智能（虚构）',
      region: '中国东莞',
      industry: '消费电子',
      product: '智能手表',
      targetMarket: '美国',
      positioning: '智能手表的健康监测、续航与日常穿搭体验',
      matchKeywords: ['smartwatch', 'watch', 'wearable', '手表', '智能', '可穿戴'],
      signals: ['有跨境电商经验', '正在寻找北美渠道', '社媒内容基础一般'],
      scores: { industryFit: 78, outboundIntent: 72, capabilityGap: 60, reachability: 74 },
      recommendation: '行业相关，已有一定出海基础，但营销能力缺口低于星瀚科技，适合作为第二批跟进对象。',
      sources: [
        { url: 'https://www.bluewhale-smart.example.com', status: 'pending', checkedAt: null, result: '待人工核实 · 模拟核验', note: '演示数据，未实际访问' }
      ],
      demo: true
    },
    {
      id: 'LEAD-003',
      company: '远海家居（虚构）',
      region: '中国宁波',
      industry: '家居用品',
      product: '智能收纳家居',
      targetMarket: '欧洲',
      positioning: '智能收纳产品的空间利用、便捷性与真实使用体验',
      matchKeywords: ['home', 'storage', 'organizer', 'organization', '家居', '收纳', '整理'],
      signals: ['有出口经验', '品牌预算有限', '尚未启动社媒投放'],
      scores: { industryFit: 55, outboundIntent: 65, capabilityGap: 58, reachability: 62 },
      recommendation: '行业匹配度一般，预算与投放意向需进一步确认，适合在家居品类需求明确时跟进。',
      sources: [
        { url: 'https://www.yuanhai-home.example.com', status: 'pending', checkedAt: null, result: '待人工核实 · 模拟核验', note: '演示数据，未实际访问' }
      ],
      demo: true
    },
    {
      id: 'LEAD-004',
      company: '极光运动（虚构）',
      region: '中国厦门',
      industry: '户外运动',
      product: '运动相机配件',
      targetMarket: '东南亚',
      positioning: '运动相机配件的稳定性、防护性与真实拍摄体验',
      matchKeywords: ['camera', 'action', 'sport', 'outdoor', '相机', '运动', '户外', '配件'],
      signals: ['已有海外社媒账号', '希望提升内容转化', '有独立站'],
      scores: { industryFit: 68, outboundIntent: 75, capabilityGap: 52, reachability: 78 },
      recommendation: '海外渠道基础较好，主要诉求是内容转化提升，可作为内容服务型线索跟进。',
      sources: [
        { url: 'https://www.aurora-sport.example.com', status: 'pending', checkedAt: null, result: '待人工核实 · 模拟核验', note: '演示数据，未实际访问' }
      ],
      demo: true
    }
  ];

  var outreachDraft = {
    channel: '邮件（Email）',
    subject: '关于贵司无线耳机拓展美国市场的几个建议',
    body: '您好，星瀚科技团队：\n\n了解到贵司正在探索美国市场。无线耳机品类的消费者通常会关注续航、佩戴舒适度与真实使用体验。\n\n我们建议先从竞品内容观察和小规模社媒内容测试切入，验证哪些卖点更能吸引目标受众，再决定后续投放方向。\n\n如果方便，希望约 20 分钟了解贵司当前的市场目标、推广节奏与团队分工，再判断是否有合作空间。\n\n祝好！\n出海营销顾问',
    followUp: [
      { day: 'Day 0', action: '发送首封邮件（人工审核后）' },
      { day: 'Day 3', action: '补充一条竞品内容观察' },
      { day: 'Day 7', action: '分享相关市场洞察并询问沟通意向' },
      { day: 'Day 14', action: '无回复则转入低频培育' }
    ],
    reviewStatus: '待人工审核',
    demo: true
  };

  var proposal = {
    projectName: '星瀚科技｜美国市场首轮营销验证',
    summary: '星瀚科技希望拓展美国市场，目前海外品牌知名度较低，缺少社媒运营经验和成熟广告策略。预算、目标人群与历史投放数据待访谈确认。',
    goal: '4 周内验证目标受众与高潜内容方向',
    strategy: [
      '市场研究：分析 5 个竞品账号、内容卖点与互动表现。',
      '内容策划：输出 3 个主题、6 条短视频脚本。',
      '内容测试：适配 3 条素材，制定小额测试投放建议。',
      '数据复盘：分析曝光、点击、互动及落地页转化。'
    ],
    scope: ['市场研究', '内容策划', '内容测试', '数据复盘'],
    duration: '4 周',
    deliverables: ['竞品分析表', '目标人群与卖点梳理', '内容营销策略', '6 条短视频脚本', '素材测试方案', '营销测试复盘报告'],
    acceptance: '交付物完整、数据口径明确、建议有依据；不承诺投放结果。',
    budgetNote: '预算与 KPI 需在需求访谈后共同确认，不以虚构报价或未经验证的效果承诺成交。',
    customerInput: '产品资料、品牌素材、独立站链接、历史数据、预算范围。',
    demo: true
  };

  var tasks = [
    { id: 'TASK-01', name: '竞品账号初筛', owner: '市场研究', due: '第 1 周', status: '已完成', progress: 100 },
    { id: 'TASK-02', name: '目标人群与卖点梳理', owner: '策略顾问', due: '第 1 周', status: '已完成', progress: 100 },
    { id: 'TASK-03', name: '短视频脚本撰写（6 条）', owner: '内容策划', due: '第 2 周', status: '进行中', progress: 55 },
    { id: 'TASK-04', name: '素材制作与审核', owner: '创意团队', due: '第 3 周', status: '待开始', progress: 0 },
    { id: 'TASK-05', name: '数据整理与复盘', owner: '投放分析', due: '第 4 周', status: '待开始', progress: 0 }
  ];

  var scopeCatalog = [
    {
      key: '市场研究',
      strategy: '市场研究：分析 5 个竞品账号、内容卖点与互动表现。',
      deliverables: ['竞品分析表', '目标人群与卖点梳理'],
      tasks: [
        { name: '竞品账号初筛', owner: '市场研究' },
        { name: '目标人群与卖点梳理', owner: '策略顾问' }
      ]
    },
    {
      key: '内容策划',
      strategy: '内容策划：输出 3 个主题、6 条短视频脚本。',
      deliverables: ['内容营销策略', '6 条短视频脚本'],
      tasks: [
        { name: '短视频脚本撰写（6 条）', owner: '内容策划' }
      ]
    },
    {
      key: '内容测试',
      strategy: '内容测试：适配 3 条素材，制定小额测试投放建议。',
      deliverables: ['素材测试方案', '小额测试投放建议'],
      tasks: [
        { name: '素材制作与审核', owner: '创意团队' }
      ]
    },
    {
      key: '数据复盘',
      strategy: '数据复盘：分析曝光、点击、互动及落地页转化。',
      deliverables: ['营销测试复盘报告'],
      tasks: [
        { name: '数据整理与复盘', owner: '投放分析' }
      ]
    }
  ];

  var scriptTopics = [
    { id: 'SCRIPT-01', title: '通勤场景下的无线耳机续航体验', status: '样例已生成' },
    { id: 'SCRIPT-02', title: '降噪模式下的专注办公场景', status: '草稿中' },
    { id: 'SCRIPT-03', title: '运动场景下的佩戴稳固性', status: '草稿中' },
    { id: 'SCRIPT-04', title: '音质细节的开箱体验', status: '待生成' },
    { id: 'SCRIPT-05', title: '外观设计与收纳便携性', status: '待生成' },
    { id: 'SCRIPT-06', title: '学生党通勤性价比场景', status: '待生成' }
  ];

  var deliverySample = {
    title: '短视频脚本 #01',
    theme: '通勤场景下的无线耳机续航体验',
    audience: '美国 25-40 岁、地铁/公交通勤、关注续航与便携的上班族',
    insight: '通勤时间长，用户担心耳机中途没电；用真实使用场景建立信任',
    hook: '“Your commute is long. Your earbuds should keep up.”',
    valueProp: '单次续航覆盖全天通勤（具体参数需客户核实）',
    shots: [
      '镜头 1（0-3s）：早高峰地铁，主角戴上耳机，字幕打出 Hook。',
      '镜头 2（3-8s）：特写耳机与收纳盒，展示通勤使用细节。',
      '镜头 3（8-12s）：展示续航卖点与充电场景（参数需客户确认真实规格）。',
      '镜头 4（12-15s）：CTA 引导点击了解详情。'
    ],
    cta: 'Explore the features / Learn more.',
    compliance: '产品参数、认证及功效表述须经客户核实后发布；不使用绝对化用语。',
    demo: true
  };

  var campaign = {
    rows: [
      { direction: '通勤续航', impressions: 18000, clicks: 720 },
      { direction: '音质体验', impressions: 16000, clicks: 400 },
      { direction: '外观设计', impressions: 14000, clicks: 320 }
    ],
    conversionNote: '当前缺少订单与落地页事件数据，无法计算 CPA 或销售增长。',
    demo: true
  };

  var conclusion = {
    text: '通勤续航方向 CTR 最高（4.0%），比其他主题更能吸引点击。建议保留该方向并继续验证；音质与外观方向需要调整开场表达。当前缺少落地页访问、加购与购买事件，无法判断销售贡献。',
    demo: true
  };

  var optimizationSuggestions = [
    '将更多内容资源投入通勤续航主题，其余方向作为对照继续观察。',
    '针对通勤人群制作 2 个不同开场 Hook，进行 A/B 测试。',
    '补充落地页访问、加购、购买事件埋点。',
    '联合观察 CTR、落地页转化率与 CPA，不以曝光量单独判断。',
    '达到预设样本量后，再决定是否扩大预算。'
  ];

  function ctr(clicks, impressions) {
    if (!impressions) return 0;
    return clicks / impressions * 100;
  }

  function formatCtr(value) {
    return value.toFixed(1) + '%';
  }

  function normalizeMarket(text) {
    var s = String(text || '').toLowerCase();
    var keys = [];
    if (/(united states|usa|us\b|america|north america|美国|北美)/.test(s)) keys.push('america');
    if (/(europe|european|germany|deutschland|france|united kingdom|uk\b|欧洲|德国|法国|英国)/.test(s)) keys.push('europe');
    if (/(southeast asia|sea\b|asia|东南亚|亚洲)/.test(s)) keys.push('asia');
    return keys;
  }

  function matchProduct(lead, text) {
    var t = String(text || '').toLowerCase();
    if (!t) return false;
    var keywords = lead.matchKeywords || [];
    for (var i = 0; i < keywords.length; i++) {
      if (t.indexOf(keywords[i].toLowerCase()) >= 0) return true;
    }
    return false;
  }

  function buildOutreach(lead) {
    var signals = lead.signals.slice(0, 2).join('、');
    return {
      channel: '邮件（Email）',
      contact: lead.company + ' · 海外市场负责人（待确认姓名）',
      subject: '关于贵司' + lead.product + '拓展' + lead.targetMarket + '市场的几个建议',
      body: '您好，' + lead.company + '团队：\n\n' +
        '了解到贵司正在探索' + lead.targetMarket + '市场。' + lead.positioning + '，通常是当地消费者决策时会关注的方面。\n\n' +
        '结合贵司当前情况（' + signals + '），我们建议先从竞品内容观察和小规模社媒内容测试切入，验证哪些卖点更能吸引目标受众，再决定后续投放方向。\n\n' +
        '如果方便，希望约 20 分钟了解贵司当前的市场目标、推广节奏与团队分工，再判断是否有合作空间。\n\n祝好！\n出海营销顾问',
      followUp: outreachDraft.followUp,
      reviewStatus: '待人工审核',
      demo: true
    };
  }

  function buildProposal(lead, summary, goal, scopeKeys) {
    var scope = (scopeKeys && scopeKeys.length) ? scopeKeys : ['市场研究', '内容策划', '内容测试', '数据复盘'];
    var items = [];
    for (var i = 0; i < scopeCatalog.length; i++) {
      if (scope.indexOf(scopeCatalog[i].key) >= 0) items.push(scopeCatalog[i]);
    }
    var strategy = items.map(function (item) { return item.strategy; });
    var deliverables = [];
    items.forEach(function (item) {
      item.deliverables.forEach(function (d) { deliverables.push(d); });
    });
    return {
      projectName: lead.company + '｜' + lead.targetMarket + '市场首轮营销验证',
      summary: summary,
      goal: goal,
      strategy: strategy,
      scope: scope,
      coreServices: scope,
      phases: items.map(function (item, i) { return '第 ' + (i + 1) + ' 周 · ' + item.key; }),
      duration: '4 周',
      deliverables: deliverables,
      kpis: ['曝光量', '点击率 CTR', '互动率', '落地页转化率（需补充埋点）'],
      acceptance: '交付物完整、数据口径明确、建议有依据；不承诺投放结果。',
      budgetNote: '预算与 KPI 需在需求访谈后共同确认，不以虚构报价或未经验证的效果承诺成交。',
      customerInput: '产品资料、品牌素材、独立站链接、历史数据、预算范围。',
      demo: true
    };
  }

  function buildTasks(proposal) {
    var items = [];
    for (var i = 0; i < scopeCatalog.length; i++) {
      if (proposal.scope.indexOf(scopeCatalog[i].key) >= 0) items.push(scopeCatalog[i]);
    }
    var tasks = [];
    var week = 1;
    items.forEach(function (item) {
      item.tasks.forEach(function (t) {
        tasks.push({ name: t.name, owner: t.owner, due: '第 ' + week + ' 周', status: '待开始', progress: 0 });
      });
      week += 1;
    });
    tasks.forEach(function (t, i) {
      if (i === 0) { t.status = '已完成'; t.progress = 100; }
      else if (i === 1) { t.status = '进行中'; t.progress = 55; }
      t.id = 'TASK-' + String(i + 1).padStart(2, '0');
    });
    return tasks;
  }

  function buildOptimization(rows) {
    var computed = rows.map(function (r) {
      return { direction: r.direction, impressions: r.impressions, clicks: r.clicks, ctr: ctr(r.clicks, r.impressions) };
    });
    var sorted = computed.slice().sort(function (a, b) { return b.ctr - a.ctr; });
    var best = sorted[0] || { direction: '—', ctr: 0 };
    var others = sorted.slice(1).map(function (r) { return r.direction; });

    var conclusion = '「' + best.direction + '」方向 CTR 最高（' + formatCtr(best.ctr) + '），明显高于其他主题，建议保留并加大验证。';
    if (others.length) {
      conclusion += '「' + others.join('」「') + '」方向 CTR 相对较低，需要调整开场表达。';
    }
    conclusion += '当前缺少落地页访问、加购与购买事件数据，无法计算 CPA 或销售贡献。';

    var suggestions = [
      '将更多内容资源投入「' + best.direction + '」方向，其余方向作为对照继续观察。',
      '针对「' + best.direction + '」人群制作 2 个不同开场 Hook，进行 A/B 测试。'
    ];
    if (others.length) {
      suggestions.push('对「' + others.join('」「') + '」方向重写开场前 3 秒。');
    }
    suggestions.push('补充落地页访问、加购、购买事件埋点。');
    suggestions.push('联合观察 CTR、落地页转化率与 CPA，不以曝光量单独判断；达到预设样本量后再决定扩大预算。');

    return {
      conclusion: conclusion,
      suggestions: suggestions,
      cpaNote: '当前缺少订单与转化数据，无法计算 CPA；以上结论仅基于曝光与点击。',
      computed: computed,
      best: best
    };
  }

  return {
    demoCase: demoCase,
    leads: leads,
    outreachDraft: outreachDraft,
    proposal: proposal,
    tasks: tasks,
    scopeCatalog: scopeCatalog,
    scriptTopics: scriptTopics,
    deliverySample: deliverySample,
    campaign: campaign,
    conclusion: conclusion,
    optimizationSuggestions: optimizationSuggestions,
    ctr: ctr,
    formatCtr: formatCtr,
    normalizeMarket: normalizeMarket,
    matchProduct: matchProduct,
    buildOutreach: buildOutreach,
    buildProposal: buildProposal,
    buildTasks: buildTasks,
    buildOptimization: buildOptimization
  };
})();
