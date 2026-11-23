import json
import os
import re

import httpx

BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
TIMEOUT = float(os.getenv("DEEPSEEK_TIMEOUT", "40"))


def is_configured() -> bool:
    return bool(API_KEY and API_KEY.strip())


def mode() -> str:
    return "real" if is_configured() else "mock"


def _build_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT, connect=10.0))


async def chat(messages, temperature=0.7, max_tokens=1200) -> str:
    url = f"{BASE_URL}/chat/completions"
    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        async with _build_client() as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise RuntimeError("模型调用超时，请稍后重试") from exc
    except httpx.HTTPError as exc:
        raise RuntimeError(f"模型接口请求失败：{exc}") from exc

    if response.status_code != 200:
        detail = response.text[:400]
        raise RuntimeError(f"模型接口返回 {response.status_code}：{detail}")

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise RuntimeError("模型返回内容为空或格式异常") from exc

    if not content or not str(content).strip():
        raise RuntimeError("模型返回内容为空")

    return str(content).strip()


def _extract_json(text: str) -> dict:
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.S)
    if fenced:
        cleaned = fenced.group(1).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


async def generate_email(payload: dict) -> dict:
    user_lines = [
        "公司名称：" + str(payload.get("company", "")),
        "所在国家/地区：" + str(payload.get("country", "")),
        "目标市场：" + str(payload.get("market", "")),
        "主营业务/产品：" + str(payload.get("business", "")),
        "客户痛点/信号：" + "、".join(payload.get("pain_points", []) or []),
        "匹配评分：" + str(payload.get("match_score", "")),
        "优先级：" + str(payload.get("priority", "")),
        "我方服务定位：" + str(payload.get("service_positioning", "")),
        "本次联系目的：" + str(payload.get("purpose", "")),
    ]
    if payload.get("extra_requirements"):
        user_lines.append("补充要求：" + str(payload.get("extra_requirements", "")))

    system = (
        "You are a senior B2B outbound marketing specialist writing a first-touch cold email in English. "
        "Personalize strictly from the provided facts. Do NOT invent facts, partnerships, certifications, revenue, "
        "or performance data. If a fact is unknown, use neutral and non-assumptive phrasing. "
        "Keep it concise (90-160 words), professional, and natural for overseas B2B communication. "
        "The email must contain a Subject, a Greeting, a short Body, and one clear Call to Action. "
        "Use plain text and separate paragraphs with \\n. "
        'Return ONLY a JSON object with exactly these keys: {"subject": "...", "body": "..."}'
    )

    content = await chat(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": "\n".join(user_lines)},
        ],
        temperature=0.7,
        max_tokens=900,
    )

    try:
        data = _extract_json(content)
    except (json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError("模型返回内容无法解析，请重试") from exc

    subject = str(data.get("subject", "")).strip()
    body = str(data.get("body", "")).strip()
    if not subject or not body:
        raise RuntimeError("模型返回内容缺少 subject 或 body")

    return {"subject": subject, "body": body}


async def generate_proposal(payload: dict) -> dict:
    user_lines = [
        "公司名称：" + str(payload.get("company", "")),
        "所在国家/地区：" + str(payload.get("country", "")),
        "目标市场：" + str(payload.get("market", "")),
        "主营业务/产品：" + str(payload.get("business", "")),
        "客户需求：" + "、".join(payload.get("needs", []) or []),
        "客户面临的问题：" + "、".join(payload.get("problems", []) or []),
        "预期营销目标：" + str(payload.get("goal", "")),
        "我方服务范围：" + "、".join(payload.get("scope", []) or []),
    ]
    if payload.get("summary"):
        user_lines.append("客户需求摘要/补充要求：" + str(payload.get("summary", "")))
    if payload.get("extra_requirements"):
        user_lines.append("额外要求：" + str(payload.get("extra_requirements", "")))

    system = (
        "You are an overseas marketing consultant. Write a short marketing service proposal in Chinese. "
        "Base everything only on the provided facts. Do NOT fabricate completed results, ROI, guarantees, budgets, "
        "or certifications. Mark anything that needs client confirmation as 待客户确认. "
        "Keep it concise for a demo; each list item should be one short line. "
        'Return ONLY a JSON object with exactly these keys: '
        '{"project_name": "...", "client_overview": "...", "goal": "...", '
        '"core_services": ["..."], "strategy": ["..."], "phases": ["..."], '
        '"deliverables": ["..."], "kpis": ["..."]}'
    )

    content = await chat(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": "\n".join(user_lines)},
        ],
        temperature=0.6,
        max_tokens=1200,
    )

    try:
        data = _extract_json(content)
    except (json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError("模型返回内容无法解析，请重试") from exc

    def as_list(value):
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    result = {
        "project_name": str(data.get("project_name", "")).strip(),
        "client_overview": str(data.get("client_overview", "")).strip(),
        "goal": str(data.get("goal", "")).strip(),
        "core_services": as_list(data.get("core_services")),
        "strategy": as_list(data.get("strategy")),
        "phases": as_list(data.get("phases")),
        "deliverables": as_list(data.get("deliverables")),
        "kpis": as_list(data.get("kpis")),
    }

    if not result["goal"] and not result["client_overview"] and not result["strategy"]:
        raise RuntimeError("模型返回的方案内容为空")

    return result
