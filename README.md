# Outbound Studio｜AI 出海营销助手

面向出海营销服务商的 AI 获客与营销交付助手 Demo。把「潜客发现 → 来源核验 → 销售触达 → 服务方案 → 项目交付 → 数据复盘」连成一条可演示的工作流，围绕同一个模拟客户案例「星瀚科技（虚构）」，跑通从线索到下一轮优化的完整闭环。

![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688) ![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-4D6BFE) ![JavaScript](https://img.shields.io/badge/frontend-Vanilla%20JS-F7DF1E) ![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB)

## ✨ 核心亮点

- **五大业务环节串联**：潜客分析 → 客户联系 → 方案撰写 → 执行交付 → 数据复盘，前一环节输出作为下一环节输入。
- **真实 + 模拟双模式**：接入 DeepSeek 真实生成邮件与方案；未配置 Key 时自动降级为本地模拟生成，并明确标注「模拟」。
- **统一 Agent Run Trace**：每个环节都有 Run ID、执行状态与步骤，模型调用步骤与真实执行逻辑对应。
- **数据可编辑可复盘**：曝光/点击可编辑，CTR 实时重算，复盘结论基于数据生成。
- **安全隔离**：API Key 只保存在后端环境变量，不进入前端源码、浏览器请求或仓库。

## 🧩 五大业务环节

| # | 模块 | 输入 → 输出 | 生成方式 |
|---|------|-------------|----------|
| 1 | 潜客分析 | 市场/国家/产品/行业 → 线索评分与优先级 | 模拟 |
| 2 | 客户联系 | 选中线索 → 个性化英文开发邮件 | 真实 AI / 模拟 |
| 3 | 方案撰写 | 客户需求 + 服务范围 → 出海营销方案 | 真实 AI / 模拟 |
| 4 | 执行交付 | 方案服务范围 → 任务拆解 + 交付样例 | 模拟 |
| 5 | 数据复盘 | 曝光/点击 → CTR + 下一轮优化建议 | 模拟 |

## 🚀 快速开始

### 方式一：纯前端（模拟模式）

无需后端与 API Key，直接用静态服务器打开：

```bash
cd ai-marketing-copilot
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

未连接后端时，页面顶栏会显示「AI：模拟（后端未连接）」，邮件与方案走本地模拟生成。

### 方式二：后端 + 真实 DeepSeek

```bash
cd ai-marketing-copilot
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 DEEPSEEK_API_KEY

cd backend
uvicorn main:app --reload --port 8000
# 浏览器打开 http://localhost:8000（后端同时托管前端页面与 API）
```

配置完成后，页面顶栏会显示「AI：真实 · deepseek-chat」。

## 🔑 模型配置

环境变量全部从后端读取，`backend/.env` 已加入 `.gitignore`，不会被提交：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key（必填，仅后端使用） | 空 |
| `DEEPSEEK_BASE_URL` | OpenAI 兼容接口地址 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 模型名称 | `deepseek-chat` |
| `DEEPSEEK_TIMEOUT` | 请求超时（秒） | `40` |

## 🔌 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 后端健康检查 |
| GET | `/api/ai/mode` | 当前模式、模型名与 Key 配置状态 |
| POST | `/api/ai/generate-email` | 生成个性化英文开发邮件 |
| POST | `/api/ai/generate-proposal` | 生成出海营销服务方案 |

## 🏗️ 架构与项目结构

原生 HTML/CSS/JavaScript 单页前端 + Python FastAPI 轻量后端。前端通过后端代理调用模型，不直连模型供应商。

```text
ai-marketing-copilot/
├── index.html                 入口页面
├── css/styles.css             视觉样式
├── js/
│   ├── data.js                统一模拟数据服务 + 模板生成器
│   ├── agent.js               Agent Run Trace 执行引擎
│   └── app.js                 渲染、交互、模式检测与 LLM 联调
├── backend/
│   ├── main.py                FastAPI 入口（API + 静态前端托管）
│   ├── services/llm_service.py 模型调用与解析封装
│   ├── schemas/request.py     请求结构
│   ├── requirements.txt       后端依赖
│   └── .env.example           环境变量示例（不含真实密钥）
├── docs/PRD.md                产品需求文档
└── reference/index.html       视觉与交互参考原型
```

## 🔁 数据流转

五个模块共享同一个模拟案例「星瀚科技（虚构）」。切换线索会重置当前草稿与方案；生成新方案后，执行交付按最新方案的服务范围拆解任务；数据复盘基于可编辑的模拟指标实时计算 CTR。

## 🧪 两种模式与生成状态

- 顶栏「AI 模式」可切「自动 / 真实 AI / 模拟模式」。
- 自动模式：后端可用且已配置 Key 时走真实模型，否则走本地模拟生成。
- 生成状态区分：未生成 / 正在生成 / 已生成（真实 AI）/ 已生成（模拟）/ 生成失败。
- 真实模型调用失败时不会静默回退为固定模板并冒充成功，会明确提示失败并允许重试。

## 🛡️ 安全与异常处理

- API Key 只在后端 `os.getenv` 读取，不出现在前端源码与浏览器请求/响应中。
- 模型调用失败、超时、空响应、JSON 解析失败均有异常处理（无 Key 返回 503，调用错误返回 502）。
- 返回内容只作为纯文本渲染，避免 XSS 风险。

## 📦 模拟数据声明

- 「星瀚科技」及所有企业线索、评分、曝光、点击、CTR 均为虚构演示数据。
- Source Check 只生成「待人工核实 · 模拟核验」清单，不访问任何网址，不声称已核实。
- 邮件草稿只支持编辑与复制，不会真实发送；任务与交付样例为模拟，不代表真实投放结果。
- 营销数据缺少订单与转化事件，不推断 CPA 或销售增长。

## 🗺️ 产品思路

AI 负责信息归纳、线索初筛、邮件与方案草拟、任务拆解和复盘建议；人负责事实核验、对外审核、预算审批和交付验收。

## ✅ 已实现 / 🚧 未实现

**已实现**：五环节完整 Demo、真实 DeepSeek 邮件与方案生成、模拟模式、跨模块数据传递、Agent Run Trace、CTR 实时计算与复盘、复制/编辑/人工审核交互。

**未实现**：真实网页搜索与来源核验、客户关系管理、真实邮件发送、真实广告投放、转化事件埋点与用户权限审计。真实 LLM 需用户配置 API Key 后验证。

## 🤝 AI 工具使用说明

- ChatGPT：产品需求分析、PRD 编写、业务流程与模拟案例设计、文案/方案/交付样例/复盘内容起草。
- Codex：项目代码实现、调试与功能验证。

> 演示截图或录屏可插入到「核心亮点」之后，保持与最新界面一致。
