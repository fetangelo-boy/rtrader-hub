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
CACHE_TTL = 120


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


def fetch_moex_index_change():
    """
    Получить индекс IMOEX.
    CURRENTVALUE — текущее значение (торги идут).
    PREVPRICE — значение закрытия предыдущей сессии (всегда есть).
    Если торги закрыты — показываем закрытие дня с пометкой.
    """
    url = (
        "https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities.json"
        "?securities=IMOEX&iss.meta=off"
        "&iss.only=marketdata,securities"
        "&marketdata.columns=SECID,CURRENTVALUE,OPEN,LASTVALUE"
        "&securities.columns=SECID,PREVPRICE,LASTVALUE"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            d = json.loads(r.read())

        # Парсим по именам колонок — ISS может вернуть не все
        md_cols = d["marketdata"]["columns"]
        md_rows = d["marketdata"]["data"]
        sc_cols = d["securities"]["columns"]
        sc_rows = d["securities"]["data"]

        def get_val(cols, row, name):
            return row[cols.index(name)] if name in cols else None

        md_row = next((r for r in md_rows if r[0] == "IMOEX"), None)
        sc_row = next((r for r in sc_rows if r[0] == "IMOEX"), None)
        if not md_row:
            return None

        cur     = get_val(md_cols, md_row, "CURRENTVALUE")
        open_   = get_val(md_cols, md_row, "OPEN")
        last_md = get_val(md_cols, md_row, "LASTVALUE")
        prev    = get_val(sc_cols, sc_row, "PREVPRICE") if sc_row else None
        last_sc = get_val(sc_cols, sc_row, "LASTVALUE") if sc_row else None

        val = cur or last_md or last_sc or prev
        if not val:
            return None

        trading = bool(cur)

        # Изменение: текущее vs открытие или предыдущее закрытие
        base = open_ or prev or last_md
        pct  = ((val - base) / base * 100) if base and base != val else 0

        return {
            "name": "IMOEX",
            "price": fmt_price(val),
            "change": fmt_change(pct),
            "up": pct >= 0,
            "raw_price": val,
            "raw_change_pct": round(pct, 2),
            "source": "moex",
            "is_index": True,
            "trading": trading,
        }
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    now = time.time()
    if _cache["data"] and now - _cache["ts"] < CACHE_TTL:
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=115"},
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
        "headers": {**CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=115"},
        "body": json.dumps(payload, ensure_ascii=False),
    }