(function () {
  var MODULES = ['discover', 'connect', 'propose', 'deliver', 'optimize'];
  var MODULE_NAMES = { discover: '潜客分析', connect: '客户联系', propose: '方案撰写', deliver: '执行交付', optimize: '数据复盘' };
  var DIM_LABELS = { industryFit: '行业匹配', outboundIntent: '出海意向', capabilityGap: '能力缺口', reachability: '可触达' };
  var SERVICE_POSITIONING = '为出海品牌提供目标市场竞品分析、海外社媒内容策划、TikTok/Instagram 营销与小规模广告测试';
  var PURPOSE = '预约一次约 20 分钟的沟通，介绍以内容测试与数据复盘切入的合作方式';

  var state = {
    module: 0,
    runs: { 0: null, 1: null, 2: null, 3: null, 4: null },
    form: {},
    busy: false,
    selectedLeadId: 'LEAD-001',
    sourceRows: [],
    lastGenerated: { discover: null, connect: null, propose: null, deliver: null, optimize: null },
    discoverResults: [],
    proposal: null,
    tasks: [],
    optimization: null,
    aiModeOverride: 'auto',
    apiBase: null,
    backendInfo: { available: false, configured: false, model: 'deepseek-chat' },
    genStatus: { connect: 'idle', propose: 'idle' },
    genSource: { connect: null, propose: null }
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function val(id, fallback) {
    return state.form[id] !== undefined && state.form[id] !== null ? state.form[id] : fallback;
  }

  function num(n) { return Number(n).toLocaleString('en-US'); }

  function fmtTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('zh-CN', { hour12: false });
  }

  function leadById(id) {
    for (var i = 0; i < DemoData.leads.length; i++) {
      if (DemoData.leads[i].id === id) return DemoData.leads[i];
    }
    return DemoData.leads[0];
  }

  function selectedLead() { return leadById(state.selectedLeadId); }

  function scoreBase(lead) {
    return Math.round((lead.scores.industryFit + lead.scores.outboundIntent + lead.scores.capabilityGap + lead.scores.reachability) / 4);
  }

  function selectedResult() {
    for (var i = 0; i < state.discoverResults.length; i++) {
      if (state.discoverResults[i].lead.id === state.selectedLeadId) return state.discoverResults[i];
    }
    return null;
  }

  function priority(score) {
    if (score >= 85) return 'P0 · 优先跟进';
    if (score >= 70) return 'P1 · 次优先';
    return 'P2 · 观察';
  }

  function buildDefaultSummary(lead) {
    return lead.company + '希望拓展' + lead.targetMarket + '市场，目前海外品牌知名度较低，缺少社媒运营经验和成熟广告策略。预算、目标人群与历史投放数据待访谈确认。';
  }

  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('已复制到剪贴板'); }
      catch (e) { toast('复制受限，请手动选择文本复制'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板'); }, fallback);
    } else {
      fallback();
    }
  }

  function resolvedMode() {
    if (state.aiModeOverride === 'mock') return 'mock';
    if (state.aiModeOverride === 'real') return 'real';
    if (state.backendInfo.available && state.backendInfo.configured) return 'real';
    return 'mock';
  }

  function moduleIsMock(moduleKey) {
    if (moduleKey === 'connect' || moduleKey === 'propose') {
      return resolvedMode() === 'mock';
    }
    return true;
  }

  function updateModeBadge() {
    var el = $('#aiModeBadge');
    if (!el) return;
    var mode = resolvedMode();
    var text;
    if (state.aiModeOverride === 'mock') {
      text = 'AI：模拟模式';
    } else if (state.aiModeOverride === 'real') {
      text = state.backendInfo.available ? ('AI：真实 · ' + (state.backendInfo.model || 'llm')) : 'AI：真实（后端未连接）';
    } else if (mode === 'real') {
      text = 'AI：真实 · ' + (state.backendInfo.model || 'llm');
    } else if (!state.backendInfo.available) {
      text = 'AI：模拟（后端未连接）';
    } else {
      text = 'AI：模拟（未配置 Key）';
    }
    el.textContent = text;
  }

  function apiCandidates() {
    var list = [];
    if (window.OUTBOUND_API_BASE) list.push(window.OUTBOUND_API_BASE);
    list.push(location.origin + '/api/ai');
    list.push('http://127.0.0.1:8000/api/ai');
    if (location.hostname !== 'localhost') list.push('http://localhost:8000/api/ai');
    var seen = {};
    return list.filter(function (u) { if (seen[u]) return false; seen[u] = true; return true; });
  }

  function fetchWithTimeout(url, ms, options) {
    return new Promise(function (resolve, reject) {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, ms);
      options = options || {};
      options.signal = controller.signal;
      fetch(url, options).then(function (resp) {
        clearTimeout(timer);
        resolve(resp);
      }, function (err) {
        clearTimeout(timer);
        reject(new Error(err && err.name === 'AbortError' ? '模型调用超时' : '网络请求失败'));
      });
    });
  }

  function extractDetail(text, status) {
    try {
      var j = JSON.parse(text);
      if (j && j.detail) return String(j.detail);
    } catch (e) { /* ignore */ }
    return '请求失败（' + status + '）';
  }

  function initAI() {
    var candidates = apiCandidates();
    var i = 0;
    function tryNext() {
      if (i >= candidates.length) {
        updateModeBadge();
        return;
      }
      var base = candidates[i++];
      fetchWithTimeout(base + '/mode', 3500, { method: 'GET' }).then(function (resp) {
        if (!resp.ok) { tryNext(); return; }
        resp.json().then(function (json) {
          state.apiBase = base;
          state.backendInfo = {
            available: true,
            configured: !!json.configured,
            model: json.model || 'deepseek-chat'
          };
          updateModeBadge();
          render();
        }).catch(function () { tryNext(); });
      }).catch(function () { tryNext(); });
    }
    tryNext();
  }

  function traceHTML(run) {
    var moduleKey = MODULES[state.module];
    if (!run) {
      run = {
        id: '—',
        status: 'idle',
        startedAt: null,
        finishedAt: null,
        error: null,
        steps: (AgentEngine.stepsByModule[moduleKey] || []).map(function (step, index) {
          return { index: index, name: step.name, detail: step.detail, model: !!step.model, status: 'idle' };
        })
      };
    }
    var isMock = moduleIsMock(moduleKey);
    var badgeClass = run.status === 'success' ? 'done' : run.status === 'running' ? 'running' : run.status === 'failed' ? 'failed' : '';
    var badgeText = run.status === 'success' ? '✓ 已完成' : run.status === 'running' ? '● 执行中' : run.status === 'failed' ? '✕ 失败' : '● 待启动';
    var statusLabel = run.status === 'success' ? 'Success' : run.status === 'running' ? 'Running' : run.status === 'failed' ? 'Failed' : 'Idle';
    var steps = run.steps.map(function (s) {
      var cls = s.status === 'success' ? 'finished' : s.status === 'running' ? 'current' : s.status === 'failed' ? 'failed' : '';
      var circle = s.status === 'success' ? '✓' : s.status === 'failed' ? '✕' : String(s.index + 1).padStart(2, '0');
      var small;
      if (s.status === 'success') {
        if (s.model) small = isMock ? '模拟生成完成' : '模型调用成功';
        else small = isMock ? '已完成 · 模拟' : '已完成';
      } else if (s.status === 'running') {
        if (s.model) small = isMock ? '正在本地生成…' : '正在调用模型…';
        else small = '正在处理当前任务';
      } else if (s.status === 'failed') {
        small = '执行失败';
      } else {
        small = '等待执行阶段';
      }
      return '<li class="' + cls + '"><span class="num">' + circle + '</span><div><strong>' + esc(s.name) + '</strong><small>' + small + '</small></div></li>';
    }).join('');
    var emptyText = run.status === 'failed' ? 'Run 执行失败：' + esc(run.error || '未知错误') : run.status === 'running' ? 'Agent 正在执行，请稍候…' : run.status === 'success' ? '本次 Run 已生成结果，可查看左侧业务产物。' : '提交左侧任务后，这里展示 Agent 执行步骤与状态。';
    return '<div class="cardhead"><div class="section"><b>02</b> RUN TRACE</div><span class="badge ' + badgeClass + '">' + badgeText + '</span></div>' +
      '<div class="meta">' +
      '<div><label>RUN ID</label><b>' + run.id + '</b></div>' +
      '<div><label>状态</label><b>' + statusLabel + '</b></div>' +
      '<div><label>执行时间</label><b>' + fmtTime(run.startedAt) + '</b></div>' +
      '</div>' +
      '<ol class="trace">' + steps + '</ol>' +
      '<div class="empty">' + emptyText + '</div>';
  }

  function panel(runKey, title, desc, bodyHTML, buttonLabel) {
    var run = state.runs[MODULES.indexOf(runKey)];
    var note;
    if (runKey === 'connect' || runKey === 'propose') {
      note = resolvedMode() === 'real' ? '真实调用后端模型，生成结果需人工审核' : '本地模拟生成，未调用真实模型';
    } else {
      note = '执行结果为本地模拟数据，不会真实搜索、发送或投放';
    }
    return '<div class="grid">' +
      '<section class="card">' +
      '<div class="cardhead"><div class="section"><b>01</b> TARGET BRIEF</div><span class="hint">任务输入</span></div>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p class="lead">' + esc(desc) + '</p>' +
      bodyHTML +
      '<div class="btnline">' +
      '<button type="button" class="btn" id="btn-run-' + runKey + '" onclick="App.run(\'' + runKey + '\')" ' + (state.busy ? 'disabled' : '') + '>' + (state.busy ? '执行中…' : buttonLabel) + '　↗</button>' +
      '<span class="micro">' + note + '</span>' +
      '</div>' +
      '</section>' +
      '<section class="card"><div id="runTrace">' + traceHTML(run) + '</div></section>' +
      '</div>';
  }

  function linkage(text) {
    return '<div class="linkage"><b>输入来源</b><span class="arrow">→</span>' + text + '</div>';
  }

  function getDiscoverInputs() {
    return {
      market: val('disc-market', 'North America'),
      region: val('disc-region', 'United States'),
      product: val('disc-product', 'Premium wireless earbuds with long battery life'),
      criteria: val('disc-criteria', 'Consumer electronics brands, importers and distributors planning overseas growth'),
      count: val('disc-count', '10'),
      industry: val('disc-industry', '消费电子')
    };
  }

  function computeDiscoverResults(inputs) {
    var marketKeys = DemoData.normalizeMarket((inputs.region || '') + ' ' + (inputs.market || ''));
    var results = DemoData.leads.map(function (lead) {
      var leadMarkets = DemoData.normalizeMarket(lead.targetMarket);
      var marketMatch = marketKeys.some(function (k) { return leadMarkets.indexOf(k) >= 0; });
      var industryMatch = (inputs.industry === lead.industry);
      var productMatch = DemoData.matchProduct(lead, inputs.product);
      var scores = {
        industryFit: lead.scores.industryFit,
        outboundIntent: lead.scores.outboundIntent,
        capabilityGap: lead.scores.capabilityGap,
        reachability: lead.scores.reachability
      };
      if (!industryMatch) scores.industryFit = Math.round(scores.industryFit * 0.55);
      if (!productMatch) scores.industryFit = Math.round(scores.industryFit * 0.75);
      if (!marketMatch) scores.outboundIntent = Math.round(scores.outboundIntent * 0.6);
      var total = Math.round((scores.industryFit + scores.outboundIntent + scores.capabilityGap + scores.reachability) / 4);
      return {
        lead: lead,
        scores: scores,
        total: total,
        priority: priority(total),
        industryMatch: industryMatch,
        productMatch: productMatch,
        marketMatch: marketMatch
      };
    });
    results.sort(function (a, b) { return b.total - a.total; });
    return results.filter(function (r) { return r.total >= 45; });
  }

  function leadCard(result) {
    var lead = result.lead;
    var total = result.total;
    var selected = lead.id === state.selectedLeadId;
    var signals = lead.signals.map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join('');
    var dims = Object.keys(DIM_LABELS);
    var bars = dims.map(function (d) {
      return '<div class="score-dim"><b>' + result.scores[d] + '</b>' + DIM_LABELS[d] + '<div class="bar"><i style="width:' + Math.min(result.scores[d], 100) + '%"></i></div></div>';
    }).join('');
    var matchChips = [
      ['行业', result.industryMatch],
      ['产品', result.productMatch],
      ['目标市场', result.marketMatch]
    ].map(function (m) {
      return '<span class="tag ' + (m[1] ? '' : 'wait') + '">' + m[0] + (m[1] ? '匹配' : '不匹配') + '</span>';
    }).join('');
    var sources = lead.sources.map(function (s) {
      return '<span>' + esc(s.url) + ' <span class="warn">待人工核实</span></span>';
    }).join(' · ');
    var chipClass = total >= 85 ? 'p0' : total >= 70 ? 'p1' : 'p2';
    return '<div class="lead-card' + (selected ? ' selected' : '') + '">' +
      '<div class="lead-head">' +
      '<div><div class="lead-title">' + esc(lead.company) + ' <span class="tag demo">演示数据</span></div>' +
      '<div class="lead-meta">' + esc(lead.region) + ' · ' + esc(lead.industry) + ' · ' + esc(lead.product) + ' → ' + esc(lead.targetMarket) + '</div></div>' +
      '<div class="lead-score"><b>' + total + '</b><span>综合评分</span><span class="chip ' + chipClass + '">' + result.priority + '</span></div>' +
      '</div>' +
      '<div class="lead-signals">' + signals + '</div>' +
      '<div class="lead-match">' + matchChips + '</div>' +
      '<div class="lead-scores">' + bars + '</div>' +
      '<div class="lead-reco">推荐理由：' + esc(lead.recommendation) + '</div>' +
      '<div class="lead-sources">来源证据：' + sources + '</div>' +
      '<div class="lead-actions">' +
      '<button type="button" class="btn light" onclick="App.selectLead(\'' + lead.id + '\')"' + (selected ? ' disabled' : '') + '>' + (selected ? '当前案例' : '设为当前案例') + '</button>' +
      '<button type="button" class="btn light" onclick="App.goModule(1)">进入客户联系 →</button>' +
      '</div>' +
      '</div>';
  }

  function leadListHTML() {
    if (!state.discoverResults.length) {
      return '<div class="empty">没有符合条件的线索，请调整市场、行业或产品条件。</div>';
    }
    return state.discoverResults.map(leadCard).join('');
  }

  function discoverSummaryHTML() {
    var inputs = getDiscoverInputs();
    return '<div class="lead-summary">当前筛选：目标市场 ' + esc(inputs.market || '—') + ' · 国家/地区 ' + esc(inputs.region || '—') + ' · 行业 ' + esc(inputs.industry) + ' · 产品关键词 ' + esc(inputs.product || '—') + '；显示 ' + state.discoverResults.length + ' / ' + DemoData.leads.length + ' 条模拟线索（未命中的维度会降低对应评分）。</div>';
  }

  function sourceResultInner() {
    if (!state.sourceRows.length) {
      return '<div style="width:100%;display:grid;place-items:center;text-align:center">◎<br><br><b style="color:#60718a;font:18px Georgia">等待来源</b><p style="font-size:10px">核验结果会显示在这里，并可回到 Lead 证据链。</p></div>';
    }
    var rows = state.sourceRows.map(function (row) {
      return '<div class="srow"><span class="u">' + esc(row.url) + '</span><span class="info"><span class="warn">待人工核实 · 模拟核验</span><small>' + esc(row.checkedAt || '—') + ' · ' + esc(row.note) + '</small></span></div>';
    }).join('');
    return '<div style="width:100%;text-align:left"><b style="font:16px Georgia">来源核验结果</b><div class="sourceRows">' + rows + '</div><p class="micro" style="margin-top:8px">演示说明：未访问这些网址；状态为“模拟核验 / 待人工核实”，不会伪装成真实核验成功。</p></div>';
  }

  function renderDiscover() {
    var body = linkage('手动目标简报') +
      '<div class="fields">' +
      '<div class="field"><label>目标市场</label><input id="disc-market" value="' + esc(val('disc-market', 'North America')) + '"></div>' +
      '<div class="field"><label>地区 / 国家</label><input id="disc-region" value="' + esc(val('disc-region', 'United States')) + '"></div>' +
      '<div class="field full"><label>产品条件</label><textarea id="disc-product">' + esc(val('disc-product', 'Premium wireless earbuds with long battery life')) + '</textarea></div>' +
      '<div class="field full"><label>目标客户条件</label><textarea id="disc-criteria">' + esc(val('disc-criteria', 'Consumer electronics brands, importers and distributors planning overseas growth')) + '</textarea></div>' +
      '<div class="field"><label>期望 LEAD 数</label><input id="disc-count" type="number" value="' + esc(val('disc-count', '10')) + '"></div>' +
      '<div class="field"><label>优先行业</label><select id="disc-industry">' + industryOptions() + '</select></div>' +
      '</div>';

    var html = panel('discover', '告诉 Agent 你要找什么。', '任务会读取市场、国家、产品和行业条件，并在现有模拟线索库中筛选评分；不会生成未经提供的企业信息。', body, '运行 Agent');

    html += '<section class="card wide">' +
      '<div class="cardhead"><div class="section"><b>03</b> LEAD LIST</div><span class="badge done">模拟线索</span></div>' +
      '<h2>潜客线索与评分</h2>' +
      '<p class="lead">按行业匹配、出海意向、营销能力缺口和可触达性四个维度评分；未命中的条件会下调对应维度。所有企业均为虚构演示数据。</p>' +
      discoverSummaryHTML() +
      '<div class="lead-list">' + leadListHTML() + '</div>' +
      '</section>';

    var sourceBoxClass = state.sourceRows.length ? 'sourcebox' : 'sourcebox center';
    html += '<section class="card wide">' +
      '<div class="cardhead"><div class="section"><b>04</b> SOURCE CHECK</div><span class="hint">模拟核验 · 不访问真实网页</span></div>' +
      '<h2>先确认来源，再相信结论。</h2>' +
      '<p class="lead">粘贴公开公司网页、联系页或行业目录，一行一个。系统记录来源、核验时间和核验结果；本 Demo 仅生成“待人工核实”清单。</p>' +
      '<div class="sourceGrid">' +
      '<div><div class="field"><label>来源 URL</label><textarea id="source-urls">' + esc(val('source-urls', 'https://www.xinghan-tech.example.com\nhttps://www.example-directory.org/xinghan')) + '</textarea></div>' +
      '<div class="btnline"><span class="micro">' + (state.sourceRows.length || 2) + ' 个待检验来源</span><button type="button" class="btn light" onclick="App.checkSources()">批量核验来源　→</button></div></div>' +
      '<div class="' + sourceBoxClass + '" id="sourceResult">' + sourceResultInner() + '</div>' +
      '</div>' +
      '</section>';

    return html;
  }

  function industryOptions() {
    var industries = ['消费电子', '家居用品', '户外运动'];
    var current = val('disc-industry', '消费电子');
    return industries.map(function (i) { return '<option' + (i === current ? ' selected' : '') + '>' + esc(i) + '</option>'; }).join('');
  }

  function followUpHTML() {
    return DemoData.outreachDraft.followUp.map(function (f) { return esc(f.day + ' · ' + f.action); }).join('<br>');
  }

  function genStatusInner(moduleKey) {
    var s = state.genStatus[moduleKey];
    var cls = s === 'running' ? 'wait' : s === 'success' ? '' : s === 'failed' ? 'failed' : 'demo';
    var text;
    if (s === 'running') text = '正在生成…';
    else if (s === 'success') text = state.genSource[moduleKey] === 'real' ? '已生成（真实 AI）' : '已生成（模拟）';
    else if (s === 'failed') text = '生成失败，可重试';
    else text = '未生成';
    return '<span class="tag ' + cls + '">生成状态</span> ' + text;
  }

  function refreshGenStatus(moduleKey) {
    var el = $('#gen-status-' + moduleKey);
    if (el) el.innerHTML = genStatusInner(moduleKey);
  }

  function renderConnect() {
    var lead = selectedLead();
    var res = selectedResult();
    var total = res ? res.total : scoreBase(lead);
    var outreach = DemoData.buildOutreach(lead);
    var body = linkage('Discover 输出 · ' + esc(lead.company) + '（综合评分 ' + total + '）') +
      '<div class="field"><label>客户与联系人</label><input id="conn-contact" value="' + esc(val('conn-contact', outreach.contact)) + '"></div>' +
      '<div class="field"><label>邮件主题</label><input id="conn-subject" placeholder="点击「生成邮件」后在此显示英文邮件主题" value="' + esc(val('conn-subject', '')) + '"></div>' +
      '<div class="field"><label>邮件正文 Draft</label><textarea id="conn-body" style="min-height:200px" placeholder="点击「生成邮件」后，在此显示当前客户的英文开发邮件">' + esc(val('conn-body', '')) + '</textarea></div>' +
      '<div class="field"><label>跟进节奏</label><div class="output">' + followUpHTML() + '</div></div>';

    var buttonLabel = resolvedMode() === 'real' ? '生成邮件（真实 AI）' : '生成邮件（模拟）';
    var html = panel('connect', '先建立联系，再推动对话。', '根据当前选中线索生成个性化英文开发邮件，主题与正文会引用企业、产品与需求信号。', body, buttonLabel);

    html += '<section class="card wide">' +
      '<div class="cardhead"><div class="section"><b>03</b> HUMAN REVIEW</div><span class="badge wait">待人工审核</span></div>' +
      '<p class="lead">对外发送前由销售确认联系人、事实和语气。Demo 仅支持编辑与复制草稿，不会真实发送邮件。</p>' +
      '<div class="gen-status" id="gen-status-connect">' + genStatusInner('connect') + '</div>' +
      '<div class="btnline">' +
      '<button type="button" class="btn light" onclick="App.copyEmail()">复制邮件草稿　↗</button>' +
      '<button type="button" class="btn" onclick="App.goModule(2)">进入方案撰写 →</button>' +
      '</div>' +
      '</section>';

    return html;
  }

  function proposalHTML() {
    var p = state.proposal || DemoData.proposal;
    var core = (p.coreServices && p.coreServices.length) ? p.coreServices : p.scope;
    var phases = (p.phases && p.phases.length) ? p.phases : [p.duration];
    var kpis = (p.kpis && p.kpis.length) ? p.kpis : [p.acceptance];
    return '<b>' + esc(p.projectName) + '</b><br><br>' +
      '<b>客户现状与核心问题：</b>' + esc(p.summary) + '<br><br>' +
      '<b>服务目标：</b>' + esc(p.goal) + '<br><br>' +
      '<b>核心服务内容：</b>' + esc(core.join('、')) + '<br><br>' +
      '<b>执行策略：</b><br>' + p.strategy.map(function (s, i) { return '0' + (i + 1) + ' ' + esc(s); }).join('<br>') + '<br><br>' +
      '<b>阶段安排：</b>' + esc(phases.join('；')) + '<br>' +
      '<b>交付物：</b>' + esc(p.deliverables.join('、')) + '<br>' +
      '<b>效果评估指标：</b>' + esc(kpis.join('、')) + '<br><br>' +
      '<b>验收标准：</b>' + esc(p.acceptance) + '<br><b>客户配合：</b>' + esc(p.customerInput) + '<br><b>提示：</b>' + esc(p.budgetNote);
  }

  function isScopeChecked(i, p) {
    if (state.form['prop-scope-' + i] !== undefined && state.form['prop-scope-' + i] !== null) {
      return state.form['prop-scope-' + i] === '1';
    }
    return p.scope.indexOf(DemoData.scopeCatalog[i].key) >= 0;
  }

  function scopeCheckboxesHTML(p) {
    return '<div class="scope-list">' + DemoData.scopeCatalog.map(function (item, i) {
      return '<label><input type="checkbox" id="prop-scope-' + i + '"' + (isScopeChecked(i, p) ? ' checked' : '') + '> ' + esc(item.key) + '</label>';
    }).join('') + '</div>';
  }

  function readProposeScope() {
    var p = state.proposal || DemoData.proposal;
    var selected = [];
    DemoData.scopeCatalog.forEach(function (item, i) {
      if (isScopeChecked(i, p)) selected.push(item.key);
    });
    return selected;
  }

  function renderPropose() {
    var p = state.proposal || DemoData.proposal;
    var body = linkage('Connect 输出 · ' + esc(selectedLead().company) + ' 需求已整理') +
      '<div class="field"><label>客户需求摘要</label><textarea id="prop-summary" style="min-height:72px">' + esc(val('prop-summary', p.summary)) + '</textarea></div>' +
      '<div class="field"><label>服务目标</label><input id="prop-goal" value="' + esc(val('prop-goal', p.goal)) + '"></div>' +
      '<div class="field"><label>服务范围（可调整，决定任务拆解）</label>' + scopeCheckboxesHTML(p) + '</div>' +
      '<div class="field"><label>服务方案 Draft</label><div class="output" id="prop-draft">' + (state.genStatus.propose === 'idle' ? '<div class="empty">未生成 — 点击「生成方案」后在此展示方案内容。</div>' : proposalHTML()) + '</div></div>';

    var buttonLabel = resolvedMode() === 'real' ? '生成方案（真实 AI）' : '生成方案（模拟）';
    var html = panel('propose', '把客户需求变成可验收的服务方案。', '方案基于当前选中客户与左侧输入生成；预算、KPI 和实际投放结果由客户沟通确认，不虚构承诺。', body, buttonLabel);

    html += '<section class="card wide">' +
      '<div class="cardhead"><div class="section"><b>03</b> SCOPE & ACCEPTANCE</div><span class="badge wait">待客户确认</span></div>' +
      '<div class="two"><div class="metric"><b>' + esc(p.duration) + '</b><span>建议服务周期</span></div><div class="metric"><b>' + p.scope.length + ' 项</b><span>服务范围</span></div></div>' +
      '<p class="lead" style="margin:14px 0 0">' + esc(p.budgetNote) + '</p>' +
      '<div class="gen-status" id="gen-status-propose">' + genStatusInner('propose') + '</div>' +
      '<div class="btnline">' +
      '<button type="button" class="btn light" onclick="App.copyProposal()">复制方案内容　↗</button>' +
      '<button type="button" class="btn" onclick="App.confirmTasks()">确认方案并拆解任务 →</button>' +
      '</div>' +
      '</section>';

    return html;
  }

  function taskTag(task) {
    if (task.status === '已完成') return '<span class="tag">已完成</span>';
    if (task.status === '进行中') return '<span class="tag wait">进行中</span>';
    return '<span class="tag demo">待开始</span>';
  }

  function tasksHTML(tasks) {
    return tasks.map(function (t) {
      var checked = t.progress === 100 ? ' checked' : '';
      return '<div class="task"><input type="checkbox"' + checked + ' disabled><div>' + esc(t.name) + taskTag(t) + '<small>' + esc(t.owner) + ' · ' + esc(t.due) + ' · 进度 ' + t.progress + '%</small></div></div>';
    }).join('');
  }

  function taskProgress(tasks) {
    var done = tasks.filter(function (t) { return t.status === '已完成'; }).length;
    return Math.round(done / tasks.length * 100);
  }

  function renderDeliver() {
    var p = state.proposal || DemoData.proposal;
    var tasks = state.tasks && state.tasks.length ? state.tasks : DemoData.tasks;
    var body = linkage('Propose 输出 · ' + esc(p.projectName)) +
      '<div class="field"><label>执行项目</label><input id="deliv-project" value="' + esc(val('deliv-project', p.projectName)) + '"></div>' +
      '<div class="field"><label>任务列表</label>' + tasksHTML(tasks) + '</div>' +
      '<div class="progress"><i style="width:' + taskProgress(tasks) + '%"></i></div>' +
      '<div class="micro">演示进度：' + tasks.filter(function (t) { return t.status === '已完成'; }).length + ' / ' + tasks.length + ' 项完成 · ' + taskProgress(tasks) + '%</div>';

    var html = panel('deliver', '让方案进入可追踪的执行状态。', 'Agent 按已确认的服务范围拆解任务，并为每项任务定义负责人、周期和交付物。', body, '重新拆解任务与生成样例');

    var sample = DemoData.deliverySample;
    html += '<section class="card wide">' +
      '<div class="cardhead"><div class="section"><b>03</b> DELIVERY SAMPLE</div><span class="badge done">样例已生成</span></div>' +
      '<h2>交付样例 · ' + esc(sample.title) + '</h2>' +
      '<div class="output"><b>主题：</b>' + esc(sample.theme) + '<br><b>目标人群：</b>' + esc(sample.audience) + '<br><b>内容洞察：</b>' + esc(sample.insight) + '<br><b>Hook：</b>“' + esc(sample.hook) + '”<br><b>核心卖点：</b>' + esc(sample.valueProp) + '<br><br>' + sample.shots.map(esc).join('<br>') + '<br><br><b>CTA：</b>' + esc(sample.cta) + '<br><br><span style="color:#a27a38">' + esc(sample.compliance) + '</span></div>' +
      '<div style="height:15px"></div>' +
      '<div class="field"><label>6 条脚本交付清单</label><div class="output">' + DemoData.scriptTopics.map(function (s) { return esc(s.id + ' · ' + s.title + '（' + s.status + '）'); }).join('<br>') + '</div></div>' +
      '<div class="btnline"><button type="button" class="btn" onclick="App.goModule(4)">进入数据复盘 →</button></div>' +
      '</section>';

    return html;
  }

  function getMetricRows() {
    return DemoData.campaign.rows.map(function (r, i) {
      var imp = parseInt(val('opt-imp-' + i, r.impressions), 10);
      var clk = parseInt(val('opt-clk-' + i, r.clicks), 10);
      return { direction: r.direction, impressions: isNaN(imp) ? 0 : imp, clicks: isNaN(clk) ? 0 : clk };
    });
  }

  function campaignOverall(rows) {
    var impressions = 0, clicks = 0;
    rows.forEach(function (r) { impressions += r.impressions; clicks += r.clicks; });
    return { impressions: impressions, clicks: clicks, ctr: DemoData.ctr(clicks, impressions) };
  }

  function metricRowsHTML() {
    return DemoData.campaign.rows.map(function (r, i) {
      var imp = val('opt-imp-' + i, r.impressions);
      var clk = val('opt-clk-' + i, r.clicks);
      var c = DemoData.ctr(parseInt(clk, 10) || 0, parseInt(imp, 10) || 0);
      return '<tr><td>' + esc(r.direction) + '</td><td><input class="metric-input" id="opt-imp-' + i + '" type="number" min="0" value="' + esc(imp) + '"></td><td><input class="metric-input" id="opt-clk-' + i + '" type="number" min="0" value="' + esc(clk) + '"></td><td><b>' + DemoData.formatCtr(c) + '</b></td></tr>';
    }).join('');
  }

  function conclusionHTML() {
    if (state.optimization) return '<div class="output" id="opt-conclusion">' + esc(state.optimization.conclusion) + '</div>';
    return '<div class="empty">待分析 — 点击「生成下一轮建议」运行 Agent 后展示复盘结果。</div>';
  }

  function suggestionsHTML() {
    if (!state.optimization) return '待分析 — 运行 Agent 后生成下一轮优化建议。';
    return state.optimization.suggestions.map(function (s, i) { return '0' + (i + 1) + ' · ' + esc(s); }).join('<br>');
  }

  function renderOptimize() {
    var rows = getMetricRows();
    var overall = campaignOverall(rows);
    var opt = state.optimization;
    var body = linkage('Deliver 输出 · 首轮测试数据（模拟）') +
      '<div class="two">' +
      '<div class="metric"><b id="m-imp">' + num(overall.impressions) + '</b><span>曝光量</span></div>' +
      '<div class="metric"><b id="m-clk">' + num(overall.clicks) + '</b><span>点击量</span></div>' +
      '<div class="metric"><b id="m-ctr">' + DemoData.formatCtr(overall.ctr) + '</b><span>整体 CTR</span></div>' +
      '<div class="metric"><b>—</b><span>CPA（缺少转化数据）</span></div>' +
      '</div>' +
      '<div style="height:15px"></div>' +
      '<table class="table"><thead><tr><th>内容方向</th><th>曝光量</th><th>点击量</th><th>CTR</th></tr></thead><tbody>' + metricRowsHTML() + '</tbody></table>' +
      '<div class="field" style="margin-top:16px"><label>AI 复盘结论</label>' + conclusionHTML() + '</div>';

    var html = panel('optimize', '复盘不是总结，而是决定下一轮怎么做。', '以下为模拟首轮投放数据，可编辑曝光与点击。当前没有订单与落地页事件数据，因此不推断真实获客成本。', body, '生成下一轮建议');

    html += '<section class="card wide">' +
      '<div class="cardhead"><div class="section"><b>03</b> NEXT EXPERIMENT</div>' + (opt ? '<span class="badge done">已生成</span>' : '<span class="badge wait">待分析</span>') + '</div>' +
      '<h2>下一轮优化建议</h2>' +
      '<div class="output">' + suggestionsHTML() + '</div>' +
      '<p class="micro" style="margin-top:10px">' + esc(opt ? opt.cpaNote : DemoData.campaign.conversionNote) + '</p>' +
      '</section>';

    return html;
  }

  function render() {
    var html;
    if (state.module === 0) html = renderDiscover();
    else if (state.module === 1) html = renderConnect();
    else if (state.module === 2) html = renderPropose();
    else if (state.module === 3) html = renderDeliver();
    else html = renderOptimize();
    $('#workspace').innerHTML = html;
    $$('#nav button').forEach(function (b, i) {
      b.classList.toggle('active', i === state.module);
      b.disabled = state.busy;
    });
  }

  function updateTrace(run) {
    var el = $('#runTrace');
    if (el) el.innerHTML = traceHTML(run);
  }

  function prepareInput(moduleKey) {
    if (moduleKey === 'discover') {
      var inputs = getDiscoverInputs();
      if (!inputs.market.trim() && !inputs.region.trim()) return { error: '缺少目标市场或地区，无法搜索潜客', stepIndex: 0 };
    }
    if (moduleKey === 'propose') {
      if (!readProposeScope().length) return { error: '请至少选择一项服务范围', stepIndex: 3 };
    }
    if (moduleKey === 'optimize') {
      var rows = getMetricRows();
      var hasData = rows.some(function (r) { return r.impressions > 0; });
      if (!hasData) return { error: '缺少有效的曝光数据', stepIndex: 0 };
      var bad = rows.some(function (r) { return r.clicks > r.impressions; });
      if (bad) return { error: '点击量不能大于曝光量，指标异常', stepIndex: 1 };
    }
    return {};
  }

  function proposalToCanonical(p) {
    return {
      project_name: p.projectName,
      client_overview: p.summary,
      goal: p.goal,
      core_services: p.coreServices || p.scope,
      strategy: p.strategy || [],
      phases: p.phases || [p.duration],
      deliverables: p.deliverables || [],
      kpis: p.kpis || [p.acceptance]
    };
  }

  function normalizeProposal(data, lead, scope) {
    return {
      projectName: data.project_name || (lead.company + '｜' + lead.targetMarket + '市场首轮营销验证'),
      summary: data.client_overview || '',
      goal: data.goal || '',
      coreServices: data.core_services || scope,
      strategy: data.strategy || [],
      phases: data.phases || [],
      deliverables: data.deliverables || [],
      kpis: data.kpis || [],
      scope: scope,
      duration: '4 周',
      acceptance: '交付物完整、数据口径明确、建议有依据；不承诺投放结果。',
      budgetNote: '预算与 KPI 需在需求访谈后共同确认，不以虚构报价或未经验证的效果承诺成交。',
      customerInput: '产品资料、品牌素材、独立站链接、历史数据、预算范围。',
      source: 'llm',
      demo: false
    };
  }

  function mockGenerate(moduleKey) {
    var lead = selectedLead();
    if (moduleKey === 'connect') {
      var out = DemoData.buildOutreach(lead);
      return { mode: 'mock', data: { subject: out.subject, body: out.body } };
    }
    var p = state.proposal || DemoData.proposal;
    var scope = readProposeScope();
    var built = DemoData.buildProposal(lead, val('prop-summary', p.summary), val('prop-goal', p.goal), scope);
    return { mode: 'mock', data: proposalToCanonical(built) };
  }

  function realGenerate(moduleKey) {
    if (!state.apiBase) {
      return Promise.reject('后端未连接，无法调用真实模型');
    }
    var lead = selectedLead();
    var payload;
    var url;
    if (moduleKey === 'connect') {
      var res = selectedResult();
      payload = {
        company: lead.company,
        country: lead.region,
        market: lead.targetMarket,
        business: lead.product,
        pain_points: lead.signals,
        match_score: res ? res.total : scoreBase(lead),
        priority: res ? res.priority : priority(scoreBase(lead)),
        service_positioning: SERVICE_POSITIONING,
        purpose: PURPOSE,
        extra_requirements: val('conn-extra', '')
      };
      url = state.apiBase + '/generate-email';
    } else {
      var p = state.proposal || DemoData.proposal;
      payload = {
        company: lead.company,
        country: lead.region,
        market: lead.targetMarket,
        business: lead.product,
        needs: DemoData.demoCase.needs,
        problems: lead.signals,
        goal: val('prop-goal', p.goal),
        scope: readProposeScope(),
        summary: val('prop-summary', p.summary),
        extra_requirements: val('prop-extra', '')
      };
      url = state.apiBase + '/generate-proposal';
    }
    return fetchWithTimeout(url, 60000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (t) { throw new Error(extractDetail(t, resp.status)); });
      }
      return resp.json();
    }).then(function (json) {
      if (!json || !json.content) throw new Error('后端返回内容为空');
      return { mode: json.mode || 'real', data: json.content };
    });
  }

  function generateContent(moduleKey, mode) {
    if (mode === 'mock') return Promise.resolve(mockGenerate(moduleKey));
    return realGenerate(moduleKey);
  }

  function applyGenerated(moduleKey, result) {
    var lead = selectedLead();
    if (moduleKey === 'connect') {
      state.form['conn-contact'] = lead.company + ' · 海外市场负责人（待确认姓名）';
      state.form['conn-subject'] = result.data.subject || '';
      state.form['conn-body'] = result.data.body || '';
    } else if (moduleKey === 'propose') {
      state.proposal = normalizeProposal(result.data, lead, readProposeScope());
    }
  }

  function applyResult(moduleKey) {
    if (moduleKey === 'discover') {
      state.discoverResults = computeDiscoverResults(getDiscoverInputs());
    } else if (moduleKey === 'deliver') {
      state.tasks = DemoData.buildTasks(state.proposal);
    } else if (moduleKey === 'optimize') {
      state.optimization = DemoData.buildOptimization(getMetricRows());
    }
  }

  function failRun(moduleKey, stepIndex, reason) {
    var idx = MODULES.indexOf(moduleKey);
    var newRun = AgentEngine.createRun(moduleKey);
    state.runs[idx] = newRun;
    AgentEngine.fail(newRun, stepIndex, reason);
    render();
    toast('Run 失败：' + reason);
  }

  function runGeneration(moduleKey) {
    var idx = MODULES.indexOf(moduleKey);
    var mode = resolvedMode();
    state.genStatus[moduleKey] = 'running';
    var run = AgentEngine.createRun(moduleKey);
    state.runs[idx] = run;
    state.busy = true;
    render();
    refreshGenStatus(moduleKey);

    var stepIndex = 0;

    function finishSuccess(result) {
      applyGenerated(moduleKey, result);
      state.lastGenerated[moduleKey] = new Date();
      state.genStatus[moduleKey] = 'success';
      state.genSource[moduleKey] = result.mode;
      state.busy = false;
      run.status = 'success';
      run.currentStep = -1;
      run.finishedAt = new Date();
      render();
      toast(mode === 'real' ? 'AI 生成成功' : '模拟生成完成');
    }

    function finishFail(message) {
      run.status = 'failed';
      run.error = message;
      run.finishedAt = new Date();
      state.genStatus[moduleKey] = 'failed';
      state.busy = false;
      render();
      toast('生成失败：' + message);
    }

    function advance() {
      if (stepIndex > 0) run.steps[stepIndex - 1].status = 'success';
      if (stepIndex >= run.steps.length) return;
      run.currentStep = stepIndex;
      run.steps[stepIndex].status = 'running';
      updateTrace(run);
      refreshGenStatus(moduleKey);
      var step = run.steps[stepIndex];
      if (step.model) {
        generateContent(moduleKey, mode).then(function (result) {
          run.steps[stepIndex].status = 'success';
          stepIndex += 1;
          while (stepIndex < run.steps.length) {
            run.steps[stepIndex].status = 'success';
            stepIndex += 1;
          }
          finishSuccess(result);
        }, function (err) {
          run.steps[stepIndex].status = 'failed';
          finishFail(err.message || String(err));
        });
      } else {
        setTimeout(function () {
          run.steps[stepIndex].status = 'success';
          stepIndex += 1;
          advance();
        }, 380);
      }
    }

    advance();
  }

  function run(moduleKey) {
    if (state.busy) return;
    var prep = prepareInput(moduleKey);
    if (prep.error) {
      failRun(moduleKey, prep.stepIndex, prep.error);
      return;
    }
    if (moduleKey === 'connect' || moduleKey === 'propose') {
      runGeneration(moduleKey);
      return;
    }
    var idx = MODULES.indexOf(moduleKey);
    state.busy = true;
    var newRun = AgentEngine.createRun(moduleKey);
    state.runs[idx] = newRun;
    render();
    AgentEngine.execute(newRun, {
      onStep: function (r) { updateTrace(r); },
      onDone: function (r) {
        applyResult(moduleKey);
        state.lastGenerated[moduleKey] = new Date();
        state.busy = false;
        render();
        toast(MODULE_NAMES[moduleKey] + ' Run 执行完成（模拟）');
      }
    });
  }

  function goModule(index) {
    if (state.busy) return;
    state.module = index;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function checkSources() {
    var ta = $('#source-urls');
    var urls = ta.value.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    state.sourceRows = urls.map(function (u) {
      return { url: u, checkedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }), note: '演示数据，未访问该网址' };
    });
    render();
    toast('已生成来源待核验清单（模拟核验，未访问网址）');
  }

  function copyEmail() {
    var subject = ($('#conn-subject') && $('#conn-subject').value) || '';
    var body = ($('#conn-body') && $('#conn-body').value) || '';
    copyText('主题：' + subject + '\n\n' + body);
  }

  function copyProposal() {
    var el = $('#prop-draft');
    copyText(el ? el.innerText : '');
  }

  function selectLead(id) {
    state.selectedLeadId = id;
    var lead = leadById(id);
    var out = DemoData.buildOutreach(lead);
    state.form['conn-contact'] = out.contact;
    state.form['conn-subject'] = '';
    state.form['conn-body'] = '';
    state.form['prop-summary'] = buildDefaultSummary(lead);
    state.form['prop-goal'] = '4 周内验证目标受众与高潜内容方向';
    DemoData.scopeCatalog.forEach(function (item, i) { delete state.form['prop-scope-' + i]; });
    state.proposal = DemoData.buildProposal(lead, state.form['prop-summary'], state.form['prop-goal'], null);
    state.tasks = DemoData.buildTasks(state.proposal);
    state.genStatus.connect = 'idle';
    state.genSource.connect = null;
    state.genStatus.propose = 'idle';
    state.genSource.propose = null;
    render();
    toast('已切换客户：' + lead.company + '，请重新生成邮件与方案');
  }

  function confirmTasks() {
    var scope = readProposeScope();
    if (!scope.length) {
      toast('请至少选择一项服务范围');
      return;
    }
    if (state.proposal) state.proposal.scope = scope;
    state.tasks = DemoData.buildTasks(state.proposal);
    goModule(3);
    run('deliver');
  }

  function refreshMetricRow(el) {
    var idx = el.id.split('-').pop();
    var imp = parseInt(val('opt-imp-' + idx, '0'), 10) || 0;
    var clk = parseInt(val('opt-clk-' + idx, '0'), 10) || 0;
    var row = el.closest ? el.closest('tr') : null;
    if (row) {
      var cell = row.querySelector('td:last-child b');
      if (cell) cell.textContent = DemoData.formatCtr(DemoData.ctr(clk, imp));
    }
    var overall = campaignOverall(getMetricRows());
    var mi = $('#m-imp'), mc = $('#m-clk'), mt = $('#m-ctr');
    if (mi) mi.textContent = num(overall.impressions);
    if (mc) mc.textContent = num(overall.clicks);
    if (mt) mt.textContent = DemoData.formatCtr(overall.ctr);
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && t.id && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
      if (t.type === 'checkbox') {
        state.form[t.id] = t.checked ? '1' : '';
        return;
      }
      state.form[t.id] = t.value;
      if (t.id.indexOf('opt-imp-') === 0 || t.id.indexOf('opt-clk-') === 0) refreshMetricRow(t);
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.id && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
      if (t.type === 'checkbox') {
        state.form[t.id] = t.checked ? '1' : '';
        return;
      }
      state.form[t.id] = t.value;
    }
  });

  $$('#nav button').forEach(function (b) {
    b.addEventListener('click', function () { goModule(parseInt(b.dataset.module, 10)); });
  });

  var modeSelect = $('#aiModeSelect');
  if (modeSelect) {
    modeSelect.addEventListener('change', function () {
      state.aiModeOverride = modeSelect.value;
      updateModeBadge();
      render();
    });
  }

  window.App = {
    run: run,
    goModule: goModule,
    checkSources: checkSources,
    copyEmail: copyEmail,
    copyProposal: copyProposal,
    selectLead: selectLead,
    confirmTasks: confirmTasks,
    resolvedMode: resolvedMode
  };

  state.discoverResults = computeDiscoverResults(getDiscoverInputs());
  state.proposal = DemoData.buildProposal(DemoData.leads[0], DemoData.proposal.summary, DemoData.proposal.goal, null);
  state.tasks = DemoData.buildTasks(state.proposal);

  render();
  initAI();
})();
