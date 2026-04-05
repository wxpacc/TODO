const UI = {
    elements: {
        taskForm: document.getElementById('task-form'),
        taskTitle: document.getElementById('task-title'),
        taskDescription: document.getElementById('task-description'),
        taskCategory: document.getElementById('task-category'),
        taskPriority: document.getElementById('task-priority'),
        taskDueDate: document.getElementById('task-due-date'),
        taskRecurrence: document.getElementById('task-recurrence'),
        taskReminder: document.getElementById('task-reminder'),
        taskTags: document.getElementById('task-tags'),
        taskList: document.getElementById('task-list'),
        searchInput: document.getElementById('search-input'),
        filterCategory: document.getElementById('filter-category'),
        filterPriority: document.getElementById('filter-priority'),
        filterStatus: document.getElementById('filter-status'),
        sortBy: document.getElementById('sort-by'),
        themeToggle: document.getElementById('theme-toggle'),
        exportBtn: document.getElementById('export-btn'),
        importFile: document.getElementById('import-file'),
        useTemplateBtn: document.getElementById('use-template-btn'),
        totalTasks: document.getElementById('total-tasks'),
        completedTasks: document.getElementById('completed-tasks'),
        pendingTasks: document.getElementById('pending-tasks'),
        categoryModal: document.getElementById('category-modal'),
        categoryForm: document.getElementById('category-form'),
        categoryName: document.getElementById('category-name'),
        categoryColor: document.getElementById('category-color'),
        categoryList: document.getElementById('category-list'),
        editModal: document.getElementById('edit-modal'),
        editForm: document.getElementById('edit-form'),
        editTitle: document.getElementById('edit-title'),
        editDescription: document.getElementById('edit-description'),
        editCategory: document.getElementById('edit-category'),
        editPriority: document.getElementById('edit-priority'),
        editDueDate: document.getElementById('edit-due-date'),
        editTags: document.getElementById('edit-tags'),
        templateModal: document.getElementById('template-modal'),
        taskList: document.getElementById('task-list'),
        boardView: document.getElementById('board-view'),
        viewBtns: document.querySelectorAll('.view-btn'),
        toastContainer: document.getElementById('toast-container')
    },

    currentEditTaskId: null,
    currentView: 'list',

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        
        return this.formatDate(dateString);
    },

    getPriorityText(priority) {
        const map = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return map[priority] || '中';
    },

    getPriorityClass(priority) {
        return `priority-${priority}`;
    },

    getRecurrenceText(recurrence) {
        const map = {
            daily: '每天',
            weekly: '每周',
            monthly: '每月',
            yearly: '每年'
        };
        return map[recurrence] || '';
    },

    createTaskCard(task) {
        const category = task.category ? CategoryManager.getById(task.category) : null;
        const tags = task.tags || [];
        const subtasks = task.subtasks || [];
        const progress = TaskManager.getSubtaskProgress(task.id);

        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.dataset.taskId = task.id;
        card.draggable = true;
        card.dataset.draggable = 'true';

        card.innerHTML = `
            <div class="task-header">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn add-subtask-btn" title="添加子任务">➕</button>
                    <button class="task-action-btn edit-btn" title="编辑">✏️</button>
                    <button class="task-action-btn delete-btn" title="删除">🗑️</button>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
            ${subtasks.length > 0 ? `
                <div class="subtasks-section">
                    ${progress ? `
                        <div class="subtask-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                            </div>
                            <span class="progress-text">${progress.completed}/${progress.total}</span>
                        </div>
                    ` : ''}
                    <div class="subtasks-list">
                        ${subtasks.map(subtask => `
                            <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
                                <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                                <span class="subtask-title">${this.escapeHtml(subtask.title)}</span>
                                <button class="subtask-delete-btn" title="删除子任务">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="task-meta">
                ${category ? `
                    <span class="task-meta-item">
                        <span style="color: ${category.color}">●</span>
                        ${this.escapeHtml(category.name)}
                    </span>
                ` : ''}
                <span class="task-meta-item ${this.getPriorityClass(task.priority)}">
                    优先级: ${this.getPriorityText(task.priority)}
                </span>
                ${task.dueDate ? `
                    <span class="task-meta-item">
                        📅 ${this.formatDate(task.dueDate)}
                    </span>
                ` : ''}
                ${task.recurrence ? `
                    <span class="task-meta-item task-recurrence">
                        🔄 ${this.getRecurrenceText(task.recurrence)}
                    </span>
                ` : ''}
                <span class="task-meta-item">
                    创建于 ${this.formatRelativeDate(task.createdAt)}
                </span>
            </div>
            ${tags.length > 0 ? `
                <div class="task-tags">
                    ${tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        `;

        return card;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    renderTasks(tasks) {
        if (tasks.length === 0) {
            this.elements.taskList.innerHTML = `
                <div class="empty-state">
                    <p>暂无任务，开始添加您的第一个任务吧！</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            fragment.appendChild(this.createTaskCard(task));
        });

        this.elements.taskList.innerHTML = '';
        this.elements.taskList.appendChild(fragment);
    },

    renderBoardView(tasks) {
        const columns = {
            'todo': [],
            'in-progress': [],
            'completed': []
        };

        tasks.forEach(task => {
            const status = task.status || (task.completed ? 'completed' : 'todo');
            if (columns[status]) {
                columns[status].push(task);
            }
        });

        Object.keys(columns).forEach(status => {
            const columnContent = document.querySelector(`.board-column-content[data-status="${status}"]`);
            const taskCount = document.querySelector(`.board-column[data-status="${status}"] .task-count`);
            
            if (columnContent && taskCount) {
                taskCount.textContent = columns[status].length;
                
                columnContent.innerHTML = columns[status].map(task => this.createBoardCard(task)).join('');
            }
        });
    },

    createBoardCard(task) {
        const priorityClass = this.getPriorityClass(task.priority);
        const priorityText = this.getPriorityText(task.priority);
        
        return `
            <div class="board-card" data-task-id="${task.id}">
                <div class="board-card-title">${this.escapeHtml(task.title)}</div>
                <div class="board-card-meta">
                    <span class="board-card-priority ${task.priority}">${priorityText}</span>
                    ${task.dueDate ? `<span>📅 ${this.formatDate(task.dueDate)}</span>` : ''}
                </div>
            </div>
        `;
    },

    switchView(view) {
        this.currentView = view;
        
        this.elements.viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        if (view === 'list') {
            this.elements.taskList.style.display = 'grid';
            this.elements.boardView.style.display = 'none';
        } else {
            this.elements.taskList.style.display = 'none';
            this.elements.boardView.style.display = 'grid';
        }
    },

    updateStats(stats) {
        this.elements.totalTasks.textContent = `总计: ${stats.total} 个任务`;
        this.elements.completedTasks.textContent = `已完成: ${stats.completed} 个`;
        this.elements.pendingTasks.textContent = `进行中: ${stats.pending} 个`;
    },

    populateCategorySelects() {
        const categories = CategoryManager.getAll();
        
        const categoryOptions = categories.map(cat => 
            `<option value="${cat.id}">${this.escapeHtml(cat.name)}</option>`
        ).join('');

        const taskCategoryHtml = `<option value="">选择分类</option>${categoryOptions}`;
        const filterCategoryHtml = `<option value="">全部</option>${categoryOptions}`;

        this.elements.taskCategory.innerHTML = taskCategoryHtml;
        this.elements.filterCategory.innerHTML = filterCategoryHtml;
        this.elements.editCategory.innerHTML = taskCategoryHtml;
    },

    renderCategoryList() {
        const categories = CategoryManager.getAll();
        
        if (categories.length === 0) {
            this.elements.categoryList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无分类</p>';
            return;
        }

        this.elements.categoryList.innerHTML = categories.map(cat => `
            <div class="category-item" data-category-id="${cat.id}">
                <div class="category-info">
                    <span class="category-color" style="background-color: ${cat.color}"></span>
                    <span class="category-name">${this.escapeHtml(cat.name)}</span>
                </div>
                <button class="btn btn-danger delete-category-btn" data-category-id="${cat.id}">删除</button>
            </div>
        `).join('');
    },

    showToast(message, type = 'info') {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close">&times;</button>
        `;

        this.elements.toastContainer.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    },

    openModal(modal) {
        modal.classList.add('active');
    },

    closeModal(modal) {
        modal.classList.remove('active');
    },

    clearForm(form) {
        form.reset();
    },

    getTaskFormData() {
        const tagsValue = this.elements.taskTags.value;
        const tags = tagsValue ? tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        return {
            title: this.elements.taskTitle.value,
            description: this.elements.taskDescription.value,
            category: this.elements.taskCategory.value,
            priority: this.elements.taskPriority.value,
            dueDate: this.elements.taskDueDate.value,
            recurrence: this.elements.taskRecurrence.value,
            reminder: this.elements.taskReminder.value,
            tags
        };
    },

    getEditFormData() {
        const tagsValue = this.elements.editTags.value;
        const tags = tagsValue ? tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        return {
            title: this.elements.editTitle.value,
            description: this.elements.editDescription.value,
            category: this.elements.editCategory.value,
            priority: this.elements.editPriority.value,
            dueDate: this.elements.editDueDate.value,
            tags
        };
    },

    populateEditForm(task) {
        this.currentEditTaskId = task.id;
        this.elements.editTitle.value = task.title;
        this.elements.editDescription.value = task.description || '';
        this.elements.editCategory.value = task.category || '';
        this.elements.editPriority.value = task.priority;
        this.elements.editDueDate.value = task.dueDate || '';
        this.elements.editTags.value = task.tags ? task.tags.join(', ') : '';
    },

    renderTemplateList() {
        const templates = TemplateManager.getAll();
        const templateList = document.getElementById('template-list');
        
        if (templates.length === 0) {
            templateList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无模板</p>';
            return;
        }

        templateList.innerHTML = templates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${this.escapeHtml(template.name)}</div>
                <div class="template-description">${this.escapeHtml(template.description)}</div>
                <div class="template-tasks-count">${template.tasks.length} 个任务</div>
            </div>
        `).join('');
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.setTheme(theme);
        
        const icon = theme === 'dark' ? '☀️' : '🌙';
        this.elements.themeToggle.textContent = icon;
    },

    toggleTheme() {
        const currentTheme = Storage.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    initTheme() {
        const savedTheme = Storage.getTheme();
        this.setTheme(savedTheme);
    },

    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('数据导出成功！', 'success');
    },

    importData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const result = Storage.importData(e.target.result);
            
            if (result.success) {
                this.showToast(`成功导入 ${result.tasksCount} 个任务和 ${result.categoriesCount} 个分类！`, 'success');
                this.populateCategorySelects();
                return true;
            } else {
                this.showToast(`导入失败: ${result.error}`, 'error');
                return false;
            }
        };
        
        reader.onerror = () => {
            this.showToast('文件读取失败！', 'error');
            return false;
        };
        
        reader.readAsText(file);
    }
};
