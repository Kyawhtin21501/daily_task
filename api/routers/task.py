from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class TaskCreate(BaseModel):
    title: str = Field(min_length=1)


# 練習用の保存先。サーバーを再起動すると空になります。
tasks = []


@router.get("/tasks", status_code=200)
async def list_tasks():
    # UIにタスク一覧を返す
    return tasks


@router.post("/tasks", status_code=201)
async def create_task(task: TaskCreate):
    # UIから送信されたJSONの title を受け取る
    new_task = {
        "id": len(tasks) + 1,
        "title": task.title,
        "done": False,
    }
    print(f"新しいタスクを作成: {new_task}")
    tasks.append(new_task)

    # 作成したタスクをUIに返す
    return new_task


@router.put("/tasks/{task_id}", status_code=200)
async def update_task(task_id: int, task: TaskCreate):
    existing_task = next((t for t in tasks if t["id"] == task_id), None)
    if existing_task:
        existing_task["title"] = task.title
        return existing_task
    else:
        return {"message": f"Task with id {task_id} not found."}


@router.delete("/tasks/{task_id}", status_code=200)
async def delete_task(task_id: int):
    deleted_task = next((task for task in tasks if task["id"] == task_id), None)
    if deleted_task:
        tasks.remove(deleted_task)
        return {"message": f"Task with id {task_id} has been deleted."}
    else:
        return {"message": f"Task with id {task_id} not found."}    
