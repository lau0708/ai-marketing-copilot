window.AgentEngine = (function () {
  var stepsByModule = {
    discover: [
      { name: '读取筛选条件', detail: '读取目标市场、国家、产品与行业条件' },
      { name: '搜索潜在客户', detail: '在模拟线索库中按条件检索（不访问真实网页）' },
      { name: '匹配与评分', detail: '按行业、产品、目标市场调整四维评分' },
      { name: '生成来源待核验清单', detail: '整理来源 URL，不访问真实网页' },
      { name: '输出优先跟进建议', detail: '按综合评分排序并给出推荐理由' }
    ],
    connect: [
      { name: '请求开始', detail: '准备客户画像与生成参数' },
      { name: '读取客户画像', detail: '载入当前选中线索的评分与需求信号' },
      { name: '调用大模型生成邮件', detail: '请求后端模型生成个性化英文开发邮件', model: true },
      { name: '结果返回与校验', detail: '解析模型返回的主题与正文' },
      { name: '等待人工审核', detail: '草稿待人工审核，不真实发送' }
    ],
    propose: [
      { name: '请求开始', detail: '准备客户需求与服务范围参数' },
      { name: '整理客户需求', detail: '读取需求摘要、服务目标与服务范围' },
      { name: '调用大模型生成方案', detail: '请求后端模型生成出海营销方案', model: true },
      { name: '结果返回与解析', detail: '解析方案章节与交付物' },
      { name: '生成方案 Draft', detail: '生成方案草稿，预算与 KPI 待确认' }
    ],
    deliver: [
      { name: '读取已确认方案', detail: '载入已确认的服务范围与交付物' },
      { name: '创建执行任务', detail: '按方案服务范围拆解可追踪任务' },
      { name: '生成内容资产', detail: '生成短视频脚本交付样例（模拟）' },
      { name: '质量检查与审核', detail: '标注需人工审核的产品参数与宣传表述' },
      { name: '等待交付确认', detail: '任务进入执行与验收状态' }
    ],
    optimize: [
      { name: '汇总投放指标', detail: '读取模拟曝光与点击数据' },
      { name: '计算关键指标', detail: '计算各内容方向 CTR' },
      { name: '分析内容表现', detail: '识别 CTR 最高的内容方向' },
      { name: '识别问题与机会', detail: '定位开场表达与转化数据缺口' },
      { name: '生成下一轮建议', detail: '按数据表现生成下一轮实验建议' }
    ]
  };

  var runCounter = 0;

  function createRun(moduleKey) {
    runCounter += 1;
    var id = 'RUN-2026-' + String(runCounter).padStart(3, '0');
    return {
      id: id,
      moduleKey: moduleKey,
      status: 'idle',
      startedAt: null,
      finishedAt: null,
      currentStep: -1,
      error: null,
      steps: (stepsByModule[moduleKey] || []).map(function (step, index) {
        return {
          index: index,
          name: step.name,
          detail: step.detail,
          model: !!step.model,
          status: 'idle'
        };
      }),
      demo: true
    };
  }

  function fail(run, stepIndex, reason) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = reason;
    if (stepIndex >= 0 && run.steps[stepIndex]) {
      run.steps[stepIndex].status = 'failed';
    }
    return run;
  }

  function execute(run, callbacks, stepDelay) {
    var delay = stepDelay || 500;
    run.status = 'running';
    run.startedAt = new Date();
    var cb = callbacks || {};

    function next(index) {
      if (index > 0) {
        run.steps[index - 1].status = 'success';
      }
      if (index >= run.steps.length) {
        run.status = 'success';
        run.currentStep = -1;
        run.finishedAt = new Date();
        if (cb.onStep) cb.onStep(run);
        if (cb.onDone) cb.onDone(run);
        return;
      }
      run.currentStep = index;
      run.steps[index].status = 'running';
      if (cb.onStep) cb.onStep(run);
      setTimeout(function () {
        run.steps[index].status = 'success';
        next(index + 1);
      }, delay);
    }

    next(0);
    return run;
  }

  return {
    stepsByModule: stepsByModule,
    createRun: createRun,
    execute: execute,
    fail: fail
  };
})();
