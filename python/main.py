import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel


APP_ENV = os.getenv("APP_ENV", "production")
PORT = int(os.getenv("PORT", "8000"))
SERVICE_NAME = "notify-api"
LOG_PATH = Path("/data/notifications.log")

app = FastAPI(title=SERVICE_NAME)


class NotifyRequest(BaseModel):
    message: str
    job_id: int


@app.on_event("startup")
def ensure_data_directory() -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": SERVICE_NAME}


@app.post("/notify")
def notify(payload: NotifyRequest) -> dict[str, str]:
    entry = {
        "message": payload.message,
        "job_id": payload.job_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return {"status": "logged"}


@app.get("/notifications")
def notifications() -> list[dict]:
    if not LOG_PATH.exists():
        return []

    items: list[dict] = []
    with LOG_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            items.append(json.loads(line))
    return items


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT)
