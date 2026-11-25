FROM python:3.11-slim

WORKDIR /app

COPY . .

ENV PYTHONUNBUFFERED=1 \
    CHAT_BRIDGE_HOST=0.0.0.0 \
    CHAT_BRIDGE_PORT=8765

EXPOSE 8765

CMD ["python", "bot/bridge.py"]
