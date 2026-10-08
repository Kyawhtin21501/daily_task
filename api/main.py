from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from api.routers import task, done

app = FastAPI()
app.include_router(task.router)
app.include_router(done.router)

# API routes take priority; serve the plain HTML/CSS/JavaScript UI at /.
app.mount("/", StaticFiles(directory=Path(__file__).resolve().parent.parent / "frontend", html=True), name="frontend")
