class TodoApp {
  constructor() {
    this.todos = [];
    this.currentFilter = "all";
    this.currentSearch = "";
    this.editingId = null;

    this.initializeElements();
    this.loadTodos();
    this.bindEvents();
    this.initializeSortable();
    this.render();
  }

  initializeElements() {
    this.todoForm = document.getElementById("todoForm");
    this.todoInput = document.getElementById("todoInput");
    this.todoError = document.getElementById("todoError");
    this.filterSelect = document.getElementById("filterSelect");
    this.searchInput = document.getElementById("searchInput");
    this.todoList = document.getElementById("todoList");
    this.emptyState = document.getElementById("emptyState");
    this.progressBar = document.getElementById("progressBar");

    this.totalCount = document.getElementById("totalCount");
    this.pendingCount = document.getElementById("pendingCount");
    this.completedCount = document.getElementById("completedCount");
    this.toastContainer = document.getElementById("toastContainer");
  }

  bindEvents() {
    this.todoForm.addEventListener("submit", (e) => this.handleAddTodo(e));
    this.filterSelect.addEventListener("change", (e) =>
      this.handleFilterChange(e)
    );
    this.searchInput.addEventListener("input", (e) =>
      this.handleSearchChange(e)
    );
    window.addEventListener("beforeunload", () => this.saveTodos());
  }

  initializeSortable() {
    new Sortable(this.todoList, {
      animation: 300,
      ghostClass: "sortable-ghost",
      onEnd: (evt) => {
        const movedItem = this.todos.splice(evt.oldIndex, 1)[0];
        this.todos.splice(evt.newIndex, 0, movedItem);
        this.saveTodos();
        this.render();

        // Highlight animasi
        const listItems = this.todoList.querySelectorAll("li");
        if (listItems[evt.newIndex]) {
          listItems[evt.newIndex].classList.add("todo-moved");
          setTimeout(
            () => listItems[evt.newIndex].classList.remove("todo-moved"),
            1000
          );
        }

        this.showToast("🔄 Todo berhasil dipindahkan!", "secondary");
      },
    });
  }

  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  loadTodos() {
    const stored = localStorage.getItem("enhancedTodos");
    if (stored) this.todos = JSON.parse(stored);
  }

  saveTodos() {
    localStorage.setItem("enhancedTodos", JSON.stringify(this.todos));
  }

  validateTodo(text, excludeId = null) {
    if (!text.trim()) return "❌ Todo tidak boleh kosong!";
    const duplikat = this.todos.some(
      (todo) =>
        todo.id !== excludeId &&
        todo.text.toLowerCase() === text.toLowerCase().trim()
    );
    if (duplikat) return "🔄 Todo dengan judul ini sudah ada!";
    return null;
  }

  showError(message) {
    this.todoError.textContent = message;
    this.todoError.style.display = "block";
  }

  hideError() {
    this.todoError.style.display = "none";
  }

  showToast(message, type = "primary") {
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  handleAddTodo(e) {
    e.preventDefault();
    const text = this.todoInput.value.trim();
    const error = this.validateTodo(text);
    if (error) {
      this.showError(error);
      return;
    }
    this.todos.unshift({
      id: this.generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    this.todoInput.value = "";
    this.hideError();
    this.saveTodos();
    this.render();
    this.showToast("🎉 Todo baru ditambahkan!", "success");
  }

  handleFilterChange(e) {
    this.currentFilter = e.target.value;
    this.render();
  }

  handleSearchChange(e) {
    this.currentSearch = e.target.value.toLowerCase();
    this.render();
  }

  toggleTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.render();
      this.showToast(
        todo.completed
          ? "✅ Todo selesai!"
          : "↩️ Todo dikembalikan ke pending.",
        todo.completed ? "success" : "warning"
      );
    }
  }

  deleteTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    this.todos = this.todos.filter((t) => t.id !== id);
    this.saveTodos();
    this.render();
    this.showToast(`🗑️ Todo "${todo.text}" dihapus!`, "danger");
  }

  startEdit(id) {
    this.editingId = id;
    this.render();
  }

  saveEdit(id, newText) {
    const error = this.validateTodo(newText, id);
    if (error) {
      this.showError(error);
      return;
    }
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.text = newText.trim();
      this.editingId = null;
      this.hideError();
      this.saveTodos();
      this.render();
      this.showToast("✏️ Todo berhasil diupdate!", "info");
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.render();
  }

  getFilteredTodos() {
    let filtered = [...this.todos];

    // Terapkan filter status
    if (this.currentFilter === "completed") {
      filtered = filtered.filter((t) => t.completed === true);
    } else if (this.currentFilter === "pending") {
      filtered = filtered.filter((t) => t.completed === false);
    }

    // Terapkan pencarian
    if (this.currentSearch && this.currentSearch.trim() !== "") {
      filtered = filtered.filter((t) =>
        t.text.toLowerCase().includes(this.currentSearch)
      );
    }

    console.log(
      "Filter:",
      this.currentFilter,
      "Search:",
      this.currentSearch,
      "Hasil:",
      filtered
    );
    return filtered;
  }

  updateStats() {
    const total = this.todos.length;
    const completed = this.todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    this.totalCount.textContent = total;
    this.pendingCount.textContent = pending;
    this.completedCount.textContent = completed;
    this.progressBar.style.width = `${progress}%`;
  }

  createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = `list-group-item d-flex align-items-center ${
      todo.completed ? "list-group-item-success" : ""
    }`;
    li.setAttribute("data-id", todo.id);

    if (this.editingId === todo.id) {
      li.innerHTML = `
        <div class="flex-fill">
          <input type="text" class="form-control" value="${todo.text}" id="editInput-${todo.id}" />
        </div>
        <button class="btn btn-success btn-sm ms-2" onclick="app.saveEdit('${todo.id}', document.getElementById('editInput-${todo.id}').value)">Simpan</button>
        <button class="btn btn-secondary btn-sm ms-2" onclick="app.cancelEdit()">Batal</button>
      `;
    } else {
      li.innerHTML = `
        <span class="drag-handle me-3"><i class="bi bi-grip-vertical"></i></span>
        <input type="checkbox" class="form-check-input me-2" ${
          todo.completed ? "checked" : ""
        } onchange="app.toggleTodo('${todo.id}')"/>
        <span class="flex-fill ${
          todo.completed ? "text-decoration-line-through" : ""
        }">${todo.text}</span>
        <button class="btn btn-success btn-sm ms-2" onclick="app.toggleTodo('${
          todo.id
        }')">
          <i class="bi ${
            todo.completed ? "bi-arrow-counterclockwise" : "bi-check2-circle"
          }"></i> 
          ${todo.completed ? "Batalkan" : "Selesai"}
        </button>
        <button class="btn btn-warning btn-sm ms-2" onclick="app.startEdit('${
          todo.id
        }')">Edit</button>
        <button class="btn btn-danger btn-sm ms-2" onclick="app.deleteTodo('${
          todo.id
        }')">Hapus</button>
      `;
    }
    return li;
  }

  render() {
    const filteredTodos = this.getFilteredTodos();
    this.todoList.innerHTML = "";

    if (filteredTodos.length === 0) {
      this.todoList.style.display = "none";
      this.emptyState.style.display = "block";
      this.emptyState.innerHTML =
        this.todos.length > 0
          ? `<i class="bi bi-search-heart display-1 text-muted mb-3"></i><h4>Tidak ada hasil</h4>`
          : `<i class="bi bi-magic display-1 text-muted mb-3"></i><h4>Belum ada todo!</h4>`;
    } else {
      this.emptyState.style.display = "none";
      this.todoList.style.display = "block";
      filteredTodos.forEach((todo) =>
        this.todoList.appendChild(this.createTodoElement(todo))
      );
    }

    this.updateStats();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new TodoApp();
});
