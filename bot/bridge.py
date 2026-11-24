"""Локальный мост: сайт -> текущая сессия OpenCode -> чат на сайте.

Запуск:
    python bot/bridge.py

Откройте http://127.0.0.1:8765/ - сайт и чат работают вместе.
Вопросы вне темы команды отсекаются и к агенту не уходят.
"""

import json
import mimetypes
import os
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

SITE_DIR = Path(__file__).resolve().parent.parent
OPENCODE = os.environ.get(
    "OPENCODE_BIN", r"C:\Users\daryo\AppData\Roaming\npm\opencode.cmd"
)
SESSION_ID = os.environ.get("OPENCODE_SESSION_ID", "ses_df62a830fffemPd1qJVlBBk7j2")
PORT = int(os.environ.get("CHAT_BRIDGE_PORT", "8765"))

# Слова, по которым определяем, что вопрос действительно про команду.
TOPIC_WORDS = (
    "команд", "участник", "капитан", "роль",
    "ильнур", "андрей", "маша", "мария", "никита", "кирилл", "322",
    "волга", "хакатон", "пгути", "сайт", "страниц", "html", "css", "js",
    "javascript", "видео", "визитк", "демо", "срок", "дедлайн",
    "ноябр", "декабр", "readme", "ии", "искусственн",
    "портфолио", "репозиторий", "github", "gitverse",
    "партикл", "чат", "бот", "архитектур", "технологи", "стек",
    "фронтенд", "бэкенд", "устройств", "как это работает",
)
TOPIC_RE = re.compile(
    r"(?<!\w)(" + "|".join(re.escape(word) for word in TOPIC_WORDS) + r")"
)

REFUSAL = (
    "Я отвечаю только на вопросы о команде 322: состав, роли, сайт, "
    "хакатон и сроки. Спросите, например: «Кто отвечает за HTML?»"
)

# Те же базовые ответы, что и на сайте: отдаются мгновенно, без агента.
BASIC_ANSWERS = (
    (("кто в команде", "состав команды", "участники команды"),
     "В команде 322 пять человек: капитан Ильнур Рахматуллин, Кирилл "
     "Колесников (программист и агентный разработчик), Андрей Иванов "
     "(монтаж), Мария Федорова (режиссёр), Никита Роменский (проверка "
     "целостности и аудит сайта). Все учимся в КНИТУ на направлении ИСТ, "
     "профиль DevOps."),
    (("книт", "ист", "devops", "где учимся", "где вы учитесь", "учитесь", "вуз"),
     "Вся команда 322 учится в КНИТУ (Казанский национальный исследовательский "
     "технологический университет) на направлении ИСТ, профиль DevOps."),
    (("ильнур",),
     "Ильнур Рахматуллин - капитан команды 322. Учится в КНИТУ на направлении "
     "ИСТ, профиль DevOps. Координирует участников, распределяет задачи и "
     "сдаёт материалы."),
    (("андрей",),
     "Андрей Иванов учится в КНИТУ на направлении ИСТ, профиль DevOps. "
     "Отвечает за монтаж: склеивает видео и собирает финальную демонстрацию."),
    (("маша", "мария"),
     "Мария Федорова - режиссёр команды 322. Учится в КНИТУ на направлении "
     "ИСТ, профиль DevOps. Пишет сценарий, ставит кадр и готовит визитку."),
    (("никита",),
     "Никита Роменский учится в КНИТУ на направлении ИСТ, профиль DevOps. "
     "Отвечает за проверку целостности и аудит сайта."),
    (("кирилл", "портфолио кирилла"),
     "Кирилл Колесников - программист и агентный разработчик команды 322. "
     "Учится в КНИТУ на направлении ИСТ, профиль DevOps. Портфолио: "
     "https://realistiks.github.io/portfolio/"),
    (("html", "разметк", "код сайта"),
     "Код сайта и мост к ИИ-агенту пишет Кирилл Колесников. Капитан Ильнур "
     "координирует работу и проверяет сроки."),
    (("срок", "дедлайн", "когда сдача"),
     "Регистрация: 18-27 ноября 2026. Отборочный этап: 23-27 ноября, приём "
     "работ до 27 ноября 23:59 МСК. Итоги публикуют до 1 декабря, финал "
     "пройдёт 9-11 декабря в Самаре."),
    (("как используется ии", "ии и ответственность", "какой ии"),
     "ИИ применялся для идей, заготовок HTML и CSS, текстов, кода анимаций "
     "и чата. Инструменты и проверка участниками раскрыты в README по п. 9.2."),
    (("капитан",),
     "Капитан команды 322 - Ильнур Рахматуллин. Он распределяет задачи, "
     "следит за сроками и сдаёт полный комплект материалов."),
    (("репозиторий", "github", "gitverse", "где код"),
     "Основной репозиторий команды в GitVerse: "
     "https://gitverse.ru/daryofarder/volga-top-322. "
     "GitHub используется только как публичное зеркало сайта."),
    (("что за чат", "как работает чат", "чат с агентом"),
     "Базовые вопросы чат отвечает сразу без сервера. Остальные уходят через "
     "мост в сессию OpenCode. Если связь выключена, чат пишет: "
     "«Удалённый чат неактивен»."),
    (("сколько баллов", "критерии", "оценка", "жюри"),
     "Финальное решение оценивается по 40 баллам: презентация, техническая "
     "реализация, оригинальность, архитектура и интерфейс - по 10 баллов за критерий."),
    (("приз", "номинац"),
     "Призовой фонд - 300 000 рублей: три приза по 100 000 рублей в "
     "номинациях «Искусственный интеллект», «Архитектура ПО» и "
     "«Фронтенд и UX-дизайн»."),
    (("хакатон", "волга", "пгути"),
     "«Волга.ТОП» - всероссийский хакатон для студентов ТОП ИТ в ПГУТИ. "
     "Команда 322 участвует в нём с сайтом-портфолио."),
)

INSTRUCTION = (
    "Вопрос посетителя сайта команды 322 по теме команды. "
    "Ответь по-русски кратко, не более трёх предложений, только по существу. "
    "Не используй инструменты, не меняй файлы, не пиши код. "
    "Если сведений нет, скажи, что ответ уточнит капитан.\n\nВопрос: "
)


def call_api(method, path, data=None, params=None, timeout=90):
    cmd = [OPENCODE, "api", method, path]
    if params:
        for key, value in params.items():
            cmd += ["--param", f"{key}={value}"]
    if data is not None:
        cmd += ["--data", json.dumps(data, ensure_ascii=False)]
    result = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", timeout=timeout
    )
    if result.returncode != 0:
        raise RuntimeError(
            (result.stderr or result.stdout or "opencode api error").strip()
        )
    out = result.stdout.strip()
    if not out:
        return None
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return out


def latest_assistant_id():
    data = call_api(
        "get",
        f"/api/session/{SESSION_ID}/message",
        params={"order": "desc", "limit": "10"},
        timeout=30,
    )
    if not isinstance(data, dict):
        return None
    for msg in data.get("data", []):
        if msg.get("type") == "assistant":
            return msg.get("id")
    return None


def ask_agent(question):
    before = latest_assistant_id()
    call_api(
        "post",
        f"/api/session/{SESSION_ID}/prompt",
        {"text": INSTRUCTION + question},
        timeout=30,
    )
    call_api("post", f"/api/experimental/session/{SESSION_ID}/wait", timeout=180)
    data = call_api(
        "get",
        f"/api/session/{SESSION_ID}/message",
        params={"order": "desc", "limit": "12"},
        timeout=30,
    )
    if isinstance(data, dict):
        for msg in data.get("data", []):
            if msg.get("type") == "assistant" and msg.get("id") != before:
                parts = []
                for part in msg.get("content", []):
                    if part.get("type") == "text" and part.get("text"):
                        parts.append(part["text"])
                answer = "\n".join(parts).strip()
                if answer:
                    return answer
    return "Не удалось получить ответ агента. Попробуйте ещё раз."


def is_relevant(question):
    return bool(TOPIC_RE.search(question.lower()))


def basic_answer(question):
    lowered = question.lower()
    for keys, answer in BASIC_ANSWERS:
        if any(key in lowered for key in keys):
            return answer
    return None


def opencode_available():
    """Проверяем, что сессия OpenCode доступна, до запроса к агенту."""
    try:
        data = call_api("get", f"/api/session/{SESSION_ID}", timeout=5)
        return isinstance(data, dict) and bool(data)
    except Exception:  # noqa: BLE001 - любой сбой считаем неактивным чатом
        return False


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")

    def _json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._json(
                {
                    "ok": True,
                    "session": SESSION_ID,
                    "active": opencode_available(),
                }
            )
            return
        rel = path.lstrip("/") or "index.html"
        target = (SITE_DIR / rel).resolve()
        if SITE_DIR not in target.parents and target != SITE_DIR:
            self.send_error(403)
            return
        if not target.is_file():
            self.send_error(404)
            return
        mime, _ = mimetypes.guess_type(str(target))
        if target.suffix == ".js":
            mime = "text/javascript; charset=utf-8"
        elif target.suffix == ".css":
            mime = "text/css; charset=utf-8"
        elif target.suffix == ".svg":
            mime = "image/svg+xml"
        elif target.suffix == ".html":
            mime = "text/html; charset=utf-8"
        body = target.read_bytes()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/ask":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self._json({"answer": "Некорректный запрос."}, 400)
            return
        question = str(payload.get("question", "")).strip()[:600]
        if not question:
            self._json({"answer": "Напишите вопрос."}, 400)
            return
        answer = basic_answer(question)
        if answer:
            self._json({"answer": answer, "relevant": True, "basic": True})
            return
        if not is_relevant(question):
            self._json({"answer": REFUSAL, "relevant": False})
            return
        if not opencode_available():
            self._json(
                {"answer": "Удалённый чат неактивен", "relevant": True, "active": False}
            )
            return
        try:
            answer = ask_agent(question)
            self._json({"answer": answer, "relevant": True, "active": True})
        except Exception:  # noqa: BLE001 - любой сбой агента считаем неактивным чатом
            self._json(
                {"answer": "Удалённый чат неактивен", "relevant": True, "active": False}
            )


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Сайт и чат: http://127.0.0.1:{PORT}/")
    print(f"Сессия OpenCode: {SESSION_ID}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nМост остановлен.")
    finally:
        server.server_close()
