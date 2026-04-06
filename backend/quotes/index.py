"""
Котировки: Finnhub (крипта, металлы, сырьё) + ISS Мосбиржи (индекс, акции РФ).
GET / — список котировок для бегущей строки и мини-дашборда.
Кеш 60 секунд. Moex даёт задержку ~15 мин, Finnhub — реальное время.
"""
import json
import os
import time
import urllib.request

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# Finnhub: крипта и сырьё
FINNHUB_SYMBOLS = [
    {"symbol": "OANDA:XAUUSD", "name": "XAU/USD"},
    {"symbol": "OANDA:XAGUSD", "name": "XAG/USD"},
    {"symbol": "OANDA:USOIL",  "name": "BRENT"},
    {"symbol": "OANDA:NGAS",   "name": "NG"},
    {"symbol": "BINANCE:BTCUSDT", "name": "BTC/USD"},
]

# ISS Мосбиржи: индекс + акции
MOEX_INDEX   = "IMOEX"
MOEX_STOCKS  = ["SBER", "GAZP", "NVTK", "LKOH"]

_cache: dict = {"data": None, "ts": 0}
CACHE_TTL = 60


def fmt_price(price: float) -> str:
    if price >= 10000:
        return f"{price:,.0f}".replace(",", " ")
    if price >= 100:
        return f"{price:.2f}"
    if price >= 1:
        return f"{price:.2f}"
    return f"{price:.4f}"


def fmt_change(pct: float) -> str:
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.2f}%"


def fetch_finnhub(symbol: str, api_key: str):
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={api_key}"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            d = json.loads(r.read())
        c, pc = d.get("c", 0), d.get("pc", 0)
        if not c:
            return None
        pct = ((c - pc) / pc * 100) if pc else 0
        return {"price": c, "pct": round(pct, 2), "up": pct >= 0}
    except Exception:
        return None


def fetch_moex_stocks():
    """Получить котировки акций с ISS Мосбиржи одним запросом."""
    tickers = ",".join(MOEX_STOCKS)
    url = (
        "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json"
        f"?securities={tickers}&iss.meta=off&iss.only=marketdata,securities"
        "&marketdata.columns=SECID,LAST,LASTTOPREVPRICE"
        "&securities.columns=SECID,PREVPRICE"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            d = json.loads(r.read())

        sec_rows = {row[0]: row[1] for row in d["securities"]["data"] if row[1]}
        md_data  = d["marketdata"]["data"]

        results = []
        for row in md_data:
            secid, last, pct = row[0], row[1], row[2]
            if secid not in MOEX_STOCKS:
                continue
            if last is None:
                last = sec_rows.get(secid)
            if last is None:
                continue
            pct = pct or 0
            results.append({
                "name": secid,
                "price": fmt_price(last),
                "change": fmt_change(pct),
                "up": pct >= 0,
                "raw_price": last,
                "raw_change_pct": pct,
                "source": "moex",
            })
        return results
    except Exception:
        return []


def fetch_moex_index():
    """Получить значение индекса IMOEX."""
    url = (
        "https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities.json"
        f"?securities={MOEX_INDEX}&iss.meta=off&iss.only=marketdata"
        "&marketdata.columns=SECID,CURRENTVALUE,LASTVALUE,VALTODAY"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            d = json.loads(r.read())
        rows = d["marketdata"]["data"]
        for row in rows:
            if row[0] == MOEX_INDEX:
                val = row[1] or row[2]
                if not val:
                    continue
                # Считаем изменение через предыдущее закрытие отдельным запросом
                return {"value": val}
        return None
    except Exception:
        return None


def fetch_moex_index_change():
    """Получить индекс IMOEX с изменением через history."""
    url = (
        "https://iss.moex.com/iss/engines/stock/markets/index/securities/IMOEX.json"
        "?iss.meta=off&iss.only=marketdata"
        "&marketdata.columns=CURRENTVALUE,OPEN"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            d = json.loads(r.read())
        rows = d["marketdata"]["data"]
        if rows and rows[0][0]:
            cur  = rows[0][0]
            open_ = rows[0][1] or cur
            pct  = ((cur - open_) / open_ * 100) if open_ else 0
            return {
                "name": "IMOEX",
                "price": fmt_price(cur),
                "change": fmt_change(pct),
                "up": pct >= 0,
                "raw_price": cur,
                "raw_change_pct": round(pct, 2),
                "source": "moex",
                "is_index": True,
            }
        return None
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    now = time.time()
    if _cache["data"] and now - _cache["ts"] < CACHE_TTL:
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(_cache["data"], ensure_ascii=False),
        }

    api_key = os.environ.get("FINNHUB_API_KEY", "")
    results = []

    # 1. Индекс МосБиржи — первым
    idx = fetch_moex_index_change()
    if idx:
        results.append(idx)

    # 2. Акции МосБиржи
    results.extend(fetch_moex_stocks())

    # 3. Finnhub: металлы, сырьё, крипта
    if api_key:
        for s in FINNHUB_SYMBOLS:
            q = fetch_finnhub(s["symbol"], api_key)
            if q:
                results.append({
                    "name": s["name"],
                    "price": fmt_price(q["price"]),
                    "change": fmt_change(q["pct"]),
                    "up": q["up"],
                    "raw_price": q["price"],
                    "raw_change_pct": q["pct"],
                    "source": "finnhub",
                })

    payload = {"quotes": results, "updated_at": int(now)}
    _cache["data"] = payload
    _cache["ts"] = now

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False),
    }
