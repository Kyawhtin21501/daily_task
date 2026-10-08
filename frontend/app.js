// Expected task shape: { id: number | string, title: string, done: boolean }.
// All requests use the existing API routes on the same server.
const taskList = document.querySelector("#task-list");
const addForm = document.querySelector("#add-form");
const newTitle = document.querySelector("#new-title");
const searchInput = document.querySelector("#search");
const errorBox = document.querySelector("#error");
const statusBox = document.querySelector("#status");
const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editTitle = document.querySelector("#edit-title");
const editError = document.querySelector("#edit-error");
let tasks = [];
let filter = "all";
let loaded = false;
let busy = false;
let editingId = null;

async function request(path, method = "GET", body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const options = {
      method,
      signal: controller.signal,
      headers: { Accept: "application/json" },
    };
    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(path, options);
    if (!response.ok)
      throw new Error(
        `APIの処理に失敗しました（HTTP ${response.status}）。再度お試しください。`,
      );
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("通信がタイムアウトしました。再度お試しください。");
    if (error instanceof TypeError)
      throw new Error(
        "サーバーに接続できません。接続を確認して再読み込みしてください。",
      );
    if (error instanceof SyntaxError)
      throw new Error("APIから正しいJSONが返されませんでした。");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function showError(error, target = errorBox) {
  target.textContent = error.message;
  target.hidden = false;
}

function setBusy(value) {
  busy = value;
  document.querySelector("#task-area").setAttribute("aria-busy", String(value));
  document.querySelector("#refresh").disabled = value;
  document.querySelector("#add-button").disabled = value || !loaded;
  taskList.querySelectorAll("button, input").forEach((element) => {
    element.disabled = value;
  });
  editForm.querySelectorAll("button, input").forEach((element) => {
    element.disabled = value;
  });
}

function render() {
  const doneCount = tasks.filter((task) => task.done).length;
  document.querySelector("#total-count").textContent = loaded
    ? tasks.length
    : "—";
  document.querySelector("#pending-count").textContent = loaded
    ? tasks.length - doneCount
    : "—";
  document.querySelector("#done-count").textContent = loaded ? doneCount : "—";
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleTasks = tasks.filter(
    (task) =>
      (filter === "all" || (filter === "done" ? task.done : !task.done)) &&
      task.title.toLocaleLowerCase().includes(query),
  );
  taskList.replaceChildren();
  visibleTasks.forEach((task) => {
    const row = document.createElement("li");
    row.className = `task-row${task.done ? " is-done" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute(
      "aria-label",
      `${task.title}を${task.done ? "未完了" : "完了"}にする`,
    );
    checkbox.addEventListener("change", () => {
      checkbox.checked = task.done;
      mutate(
        `${taskPath(task.id)}/done`,
        task.done ? "DELETE" : "PUT",
        undefined,
        "タスクの状態を更新しました。",
      );
    });
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const actions = document.createElement("div");
    actions.className = "task-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "text-button";
    edit.textContent = "編集";
    edit.setAttribute("aria-label", `${task.title}を編集`);
    edit.addEventListener("click", () => {
      editingId = task.id;
      editTitle.value = task.title;
      editError.hidden = true;
      editDialog.showModal();
      editTitle.focus();
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button delete-button";
    remove.textContent = "削除";
    remove.setAttribute("aria-label", `${task.title}を削除`);
    remove.addEventListener("click", () => {
      if (window.confirm(`「${task.title}」を削除しますか？`)) {
        mutate(
          taskPath(task.id),
          "DELETE",
          undefined,
          "タスクを削除しました。",
        );
      }
    });
    actions.append(edit, remove);
    row.append(checkbox, title, actions);
    taskList.append(row);
  });
  document.querySelector("#empty-state").hidden = visibleTasks.length > 0;
  document.querySelector("#empty-title").textContent = !loaded
    ? "タスクを取得できませんでした"
    : tasks.length
      ? "該当するタスクはありません"
      : "最初のタスクを追加しましょう";
  document.querySelector("#empty-description").textContent = !loaded
    ? "APIの状態を確認して、再読み込みしてください。"
    : tasks.length
      ? "検索条件や表示するタスクを変更してください。"
      : "やることをひとつ書き出すところから始めましょう。";
  document.querySelector("#result-count").textContent = loaded
    ? `${visibleTasks.length} / ${tasks.length} 件を表示`
    : "未取得";
  setBusy(busy);
}

function taskPath(id) {
  return `/tasks/${encodeURIComponent(id)}`;
}

async function fetchTasks() {
  const data = await request("/tasks");
  if (!Array.isArray(data))
    throw new Error(
      "タスク一覧APIが未実装、または応答形式が未対応です。タスクの配列が必要です。",
    );
  const valid = data.every(
    (task) =>
      task &&
      ["number", "string"].includes(typeof task.id) &&
      typeof task.title === "string" &&
      typeof task.done === "boolean",
  );
  if (!valid)
    throw new Error(
      "APIのタスク形式が未対応です。id・title・doneを確認してください。",
    );
  tasks = data;
  loaded = true;
}

async function refresh() {
  if (busy) return;
  errorBox.hidden = true;
  statusBox.textContent = "";
  setBusy(true);
  try {
    await fetchTasks();
    statusBox.textContent = "最新のタスクを取得しました。";
  } catch (error) {
    showError(error);
    if (loaded) statusBox.textContent = "前回取得した一覧を表示しています。";
  } finally {
    setBusy(false);
    render();
  }
}

async function mutate(path, method, body, message, onSuccess) {
  if (busy) return;
  errorBox.hidden = true;
  editError.hidden = true;
  statusBox.textContent = "";
  setBusy(true);
  try {
    await request(path, method, body);
  } catch (error) {
    showError(error, editDialog.open ? editError : errorBox);
    setBusy(false);
    return;
  }
  if (onSuccess) onSuccess();
  try {
    await fetchTasks();
    statusBox.textContent = message;
  } catch (error) {
    showError(
      new Error(
        `更新リクエストは受け付けられましたが、一覧の再取得に失敗しました。再読み込みで確認してください。 ${error.message}`,
      ),
    );
  } finally {
    setBusy(false);
    render();
  }
}

function validTitle(input) {
  input.setCustomValidity(
    input.value.trim() ? "" : "タスク名を入力してください。",
  );
  return input.reportValidity();
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!loaded || !validTitle(newTitle)) return;
  mutate(
    "/tasks",
    "POST",
    { title: newTitle.value.trim() },
    "タスクを追加しました。",
    () => {
      newTitle.value = "";
      newTitle.focus();
    },
  );
});
editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validTitle(editTitle)) return;
  mutate(
    taskPath(editingId),
    "PUT",
    { title: editTitle.value.trim() },
    "タスクを保存しました。",
    () => editDialog.close(),
  );
});
[newTitle, editTitle].forEach((input) =>
  input.addEventListener("input", () => input.setCustomValidity("")),
);
document
  .querySelector("#cancel-edit")
  .addEventListener("click", () => editDialog.close());
editDialog.addEventListener("cancel", (event) => {
  if (busy) event.preventDefault();
});
document.querySelector("#refresh").addEventListener("click", refresh);
searchInput.addEventListener("input", render);
document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    render();
  });
});
refresh();
