"""Включает удалённый чат: мост OpenCode + публичный HTTPS-туннель.

Обычный запуск (использует уже прописанный адрес из js/config.js):
    python bot/start_remote.py

Создать новый туннель и записать его адрес в js/config.js:
    python bot/start_remote.py --new-tunnel

То же плюс отправка обновлённого адреса на GitHub:
    python bot/start_remote.py --new-tunnel --push

Остановка: Ctrl+C. Базовые вопросы отвечаются без сервера в любом режиме.
"""

import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "js" / "config.js"
BRIDGE = ROOT / "bot" / "bridge.py"
CLOUDFLARED = Path(
    os.environ.get(
        "CLOUDFLARED_BIN",
        str(Path(os.environ.get("LOCALAPPDATA", "")) / "cloudflared" / "cloudflared.exe"),
    )
)
URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def read_endpoint():
    if not CONFIG.exists():
        return None
    match = URL_RE.search(CONFIG.read_text(encoding="utf-8"))
    return match.group(0) if match else None


def write_endpoint(url):
    text = (
        "// Адрес удалённого моста. Обновляется скриптом bot/start_remote.py.\n"
        "// Если endpoint недоступен, чат показывает «Удалённый чат неактивен».\n"
        "window.CHAT_ENDPOINT = '" + url + "';\n"
    )
    CONFIG.write_text(text, encoding="utf-8")


def start_tunnel():
    if not CLOUDFLARED.exists():
        raise RuntimeError(
            f"Не найден cloudflared: {CLOUDFLARED}. "
            "Укажите путь переменной CLOUDFLARED_BIN."
        )
    proc = subprocess.Popen(
        [str(CLOUDFLARED), "tunnel", "--url", "http://127.0.0.1:8765"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    for line in proc.stdout:
        match = URL_RE.search(line)
        if match:
            return proc, match.group(0)
    proc.terminate()
    raise RuntimeError("Не удалось получить адрес туннеля cloudflared")


def push_config():
    for args in (
        ["git", "add", "js/config.js"],
        ["git", "commit", "-m", "Update remote chat endpoint"],
        ["git", "push"],
    ):
        result = subprocess.run(args, cwd=ROOT)
        if result.returncode != 0:
            print("GitHub обновить не удалось, адрес сохранён локально")


def main():
    create_new = "--new-tunnel" in sys.argv
    url = None if create_new else read_endpoint()
    tunnel = None

    if url:
        print("Используем адрес из js/config.js:", url)
    else:
        tunnel, url = start_tunnel()
        write_endpoint(url)
        print("Новый публичный адрес:", url)

    bridge = subprocess.Popen([sys.executable, str(BRIDGE)])
    print("Мост OpenCode запущен на http://127.0.0.1:8765/")
    if "--push" in sys.argv:
        push_config()
    print("Готово. Откройте сайт и включите чат.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nВыключаем удалённый чат...")
    finally:
        bridge.terminate()
        if tunnel:
            tunnel.terminate()


if __name__ == "__main__":
    main()
