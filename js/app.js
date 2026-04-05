const App = {
    currentFilters: {
        search: '',
        category: '',
        priority: '',
        status: ''
    },
    currentSort: 'createdAt-desc',

    init() {
        this.initTheme();
        this.initNotifications();
        this.populateCategories();
        this.renderTasks();
        this.updateStats();
        this.bindEvents();
    },

    initNotifications() {
        NotificationManager.init().then(granted => {
            if (granted) {
                NotificationManager.startChecking(1);
            }
        });
    },

    bindDragEvents() {
        let draggedElement = null;
        let draggedTaskId = null;

        UI.elements.taskList.addEventListener('dragstart', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (!taskCard) return;

            draggedElement = taskCard;
            draggedTaskId = taskCard.dataset.taskId;
            taskCard.classList.add('dragging');
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedTaskId);
        });

        UI.elements.taskList.addEventListener('dragend', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard) {
                taskCard.classList.remove('dragging');
            }
            
            document.querySelectorAll('.task-card.drag-over').forEach(card => {
                card.classList.remove('drag-over');
            });
            
            draggedElement = null;
            draggedTaskId = null;
        });

        UI.elements.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const taskCard = e.target.closest('.task-card');
            if (taskCard && taskCard !== draggedElement) {
                taskCard.classList.add('drag-over');
            }
        });

        UI.elements.taskList.addEventListener('dragleave', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard) {
                taskCard.classList.remove('drag-over');
            }
        });

        UI.elements.taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const targetCard = e.target.closest('.task-card');
            if (!targetCard || targetCard === draggedElement) return;

            const targetTaskId = targetCard.dataset.taskId;
            
            if (draggedTaskId && targetTaskId) {
                this.reorderTasks(draggedTaskId, targetTaskId);
            }
            
            targetCard.classList.remove('drag-over');
        });
    },

    reorderTasks(draggedTaskId, targetTaskId) {
        const tasks = Storage.getTasks();
        const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
        const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedTask] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, draggedTask);
        
        Storage.setTasks(tasks);
        this.renderTasks();
        UI.showToast('任务顺序已更新！', 'success');
    },

    initTheme() {
        UI.initTheme();
    },

    populateCategories() {
        UI.populateCategorySelects();
    },

    renderTasks() {
        const tasks = TaskManager.getAll();
        const filteredTasks = FilterManager.applyFiltersAndSort(
            tasks,
            this.currentFilters,
            this.currentSort
        );
        
        if (UI.currentView === 'list') {
            UI.renderTasks(filteredTasks);
        } else {
            UI.renderBoardView(filteredTasks);
        }
    },

    updateStats() {
        const stats = TaskManager.getStats();
        UI.updateStats(stats);
    },

    bindEvents() {
        this.bindTaskFormEvents();
        this.bindFilterEvents();
        this.bindTaskListEvents();
        this.bindModalEvents();
        this.bindThemeEvents();
        this.bindImportExportEvents();
        this.bindViewToggleEvents();
        this.bindDragEvents();
    },

    bindTaskFormEvents() {
        UI.elements.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const taskData = UI.getTaskFormData();
            
            if (!taskData.title.trim()) {
                UI.showToast('请输入任务标题！', 'warning');
                return;
            }

            TaskManager.create(taskData);
            UI.clearForm(UI.elements.taskForm);
            this.renderTasks();
            this.updateStats();
            UI.showToast('任务添加成功！', 'success');
        });
    },

    bindFilterEvents() {
        const debouncedSearch = this.debounce((value) => {
            this.currentFilters.search = value;
            this.renderTasks();
        }, 300);

        UI.elements.searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        UI.elements.filterCategory.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.renderTasks();
        });

        UI.elements.filterPriority.addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.renderTasks();
        });

        UI.elements.filterStatus.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.renderTasks();
        });

        UI.elements.sortBy.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });
    },

    bindTaskListEvents() {
        UI.elements.taskList.addEventListener('click', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (!taskCard) return;

            const taskId = taskCard.dataset.taskId;

            if (e.target.classList.contains('task-checkbox')) {
                this.handleTaskToggle(taskId);
            } else if (e.target.classList.contains('edit-btn')) {
                this.handleTaskEdit(taskId);
            } else if (e.target.classList.contains('delete-btn')) {
                this.handleTaskDelete(taskId);
            } else if (e.target.classList.contains('add-subtask-btn')) {
                this.handleAddSubtask(taskId);
            } else if (e.target.classList.contains('subtask-checkbox')) {
                const subtaskItem = e.target.closest('.subtask-item');
                if (subtaskItem) {
                    const subtaskId = subtaskItem.dataset.subtaskId;
                    this.handleSubtaskToggle(taskId, subtaskId);
                }
            } else if (e.target.classList.contains('subtask-delete-btn')) {
                const subtaskItem = e.target.closest('.subtask-item');
                if (subtaskItem) {
                    const subtaskId = subtaskItem.dataset.subtaskId;
                    this.handleSubtaskDelete(taskId, subtaskId);
                }
            }
        });
    },

    handleTaskToggle(taskId) {
        const task = TaskManager.getById(taskId);
        if (!task) return;

        if (!task.completed && task.recurrence) {
            TaskManager.toggleComplete(taskId);
            const newTask = TaskManager.completeRecurringTask(taskId);
            
            if (newTask) {
                this.renderTasks();
                this.updateStats();
                UI.showToast('重复任务已完成，已创建新实例！', 'success');
            }
        } else {
            TaskManager.toggleComplete(taskId);
            this.renderTasks();
            this.updateStats();
            UI.showToast('任务状态已更新！', 'success');
        }
    },

    handleTaskEdit(taskId) {
        const task = TaskManager.getById(taskId);
        if (!task) {
            UI.showToast('任务不存在！', 'error');
            return;
        }

        UI.populateEditForm(task);
        UI.openModal(UI.elements.editModal);
    },

    handleTaskDelete(taskId) {
        if (confirm('确定要删除这个任务吗？')) {
            TaskManager.delete(taskId);
            this.renderTasks();
            this.updateStats();
            UI.showToast('任务已删除！', 'success');
        }
    },

    handleAddSubtask(taskId) {
        const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!taskCard) return;

        let inputSection = taskCard.querySelector('.add-subtask-input');
        
        if (inputSection) {
            inputSection.remove();
            return;
        }

        let subtasksSection = taskCard.querySelector('.subtasks-section');
        
        if (!subtasksSection) {
            subtasksSection = document.createElement('div');
            subtasksSection.className = 'subtasks-section';
            
            const description = taskCard.querySelector('.task-description');
            if (description) {
                description.insertAdjacentElement('afterend', subtasksSection);
            } else {
                const taskHeader = taskCard.querySelector('.task-header');
                taskHeader.insertAdjacentElement('afterend', subtasksSection);
            }
        }

        inputSection = document.createElement('div');
        inputSection.className = 'add-subtask-input';
        inputSection.innerHTML = `
            <input type="text" placeholder="输入子任务标题，按回车添加" class="subtask-input">
            <button class="btn btn-primary btn-sm">添加</button>
        `;

        subtasksSection.appendChild(inputSection);

        const input = inputSection.querySelector('.subtask-input');
        const addBtn = inputSection.querySelector('.btn');

        const addSubtask = () => {
            const title = input.value.trim();
            if (title) {
                TaskManager.addSubtask(taskId, title);
                this.renderTasks();
                UI.showToast('子任务添加成功！', 'success');
            }
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addSubtask();
            }
        });

        addBtn.addEventListener('click', addSubtask);
        input.focus();
    },

    handleSubtaskToggle(taskId, subtaskId) {
        TaskManager.toggleSubtaskComplete(taskId, subtaskId);
        this.renderTasks();
        UI.showToast('子任务状态已更新！', 'success');
    },

    handleSubtaskDelete(taskId, subtaskId) {
        if (confirm('确定要删除这个子任务吗？')) {
            TaskManager.deleteSubtask(taskId, subtaskId);
            this.renderTasks();
            UI.showToast('子任务已删除！', 'success');
        }
    },

    bindModalEvents() {
        this.bindCategoryModalEvents();
        this.bindEditModalEvents();
        this.bindTemplateModalEvents();
    },

    bindCategoryModalEvents() {
        const openCategoryModal = () => {
            UI.renderCategoryList();
            UI.openModal(UI.elements.categoryModal);
        };

        document.querySelector('[data-action="manage-categories"]')?.addEventListener('click', openCategoryModal);

        UI.elements.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const categoryData = {
                name: UI.elements.categoryName.value,
                color: UI.elements.categoryColor.value
            };

            if (!categoryData.name.trim()) {
                UI.showToast('请输入分类名称！', 'warning');
                return;
            }

            CategoryManager.create(categoryData);
            UI.clearForm(UI.elements.categoryForm);
            UI.renderCategoryList();
            this.populateCategories();
            UI.showToast('分类添加成功！', 'success');
        });

        UI.elements.categoryList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryId = e.target.dataset.categoryId;
                
                if (confirm('确定要删除这个分类吗？相关任务的分类将被清空。')) {
                    CategoryManager.delete(categoryId);
                    UI.renderCategoryList();
                    this.populateCategories();
                    this.renderTasks();
                    UI.showToast('分类已删除！', 'success');
                }
            }
        });
    },

    bindEditModalEvents() {
        UI.elements.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const taskData = UI.getEditFormData();
            
            if (!taskData.title.trim()) {
                UI.showToast('请输入任务标题！', 'warning');
                return;
            }

            TaskManager.update(UI.currentEditTaskId, taskData);
            UI.closeModal(UI.elements.editModal);
            this.renderTasks();
            UI.showToast('任务更新成功！', 'success');
        });

        UI.elements.editModal.querySelector('.modal-cancel').addEventListener('click', () => {
            UI.closeModal(UI.elements.editModal);
        });
    },

    bindTemplateModalEvents() {
        UI.elements.useTemplateBtn.addEventListener('click', () => {
            UI.renderTemplateList();
            UI.openModal(UI.elements.templateModal);
        });

        const templateList = document.getElementById('template-list');
        templateList.addEventListener('click', (e) => {
            const templateCard = e.target.closest('.template-card');
            if (!templateCard) return;

            const templateId = templateCard.dataset.templateId;
            this.handleUseTemplate(templateId);
        });
    },

    handleUseTemplate(templateId) {
        const customData = {
            category: UI.elements.taskCategory.value,
            tags: UI.elements.taskTags.value ? UI.elements.taskTags.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            dueDate: UI.elements.taskDueDate.value
        };

        const createdTasks = TemplateManager.applyTemplate(templateId, customData);
        
        if (createdTasks.length > 0) {
            UI.closeModal(UI.elements.templateModal);
            UI.clearForm(UI.elements.taskForm);
            this.renderTasks();
            this.updateStats();
            UI.showToast(`成功从模板创建了 ${createdTasks.length} 个任务！`, 'success');
        } else {
            UI.showToast('模板应用失败！', 'error');
        }
    },

    bindThemeEvents() {
        UI.elements.themeToggle.addEventListener('click', () => {
            UI.toggleTheme();
        });
    },

    bindViewToggleEvents() {
        UI.elements.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                UI.switchView(view);
                this.renderTasks();
            });
        });

        document.querySelectorAll('.board-column-content').forEach(column => {
            column.addEventListener('click', (e) => {
                const card = e.target.closest('.board-card');
                if (!card) return;

                const taskId = card.dataset.taskId;
                this.handleBoardCardClick(taskId);
            });
        });
    },

    handleBoardCardClick(taskId) {
        const task = TaskManager.getById(taskId);
        if (!task) return;

        const statuses = ['todo', 'in-progress', 'completed'];
        const currentIndex = statuses.indexOf(task.status || 'todo');
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];

        TaskManager.updateStatus(taskId, nextStatus);
        this.renderTasks();
        this.updateStats();
        
        const statusText = { 'todo': '待办', 'in-progress': '进行中', 'completed': '已完成' };
        UI.showToast(`任务已移动到：${statusText[nextStatus]}`, 'success');
    },

    bindImportExportEvents() {
        UI.elements.exportBtn.addEventListener('click', () => {
            UI.exportData();
        });

        UI.elements.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const result = Storage.importData(event.target.result);
                    
                    if (result.success) {
                        UI.showToast(`成功导入 ${result.tasksCount} 个任务和 ${result.categoriesCount} 个分类！`, 'success');
                        this.populateCategories();
                        this.renderTasks();
                        this.updateStats();
                    } else {
                        UI.showToast(`导入失败: ${result.error}`, 'error');
                    }
                };
                
                reader.readAsText(file);
            }
            
            e.target.value = '';
        });
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    showKeyboardShortcuts() {
        const shortcuts = `
快捷键列表：

Ctrl/Cmd + N : 新建任务（聚焦到任务标题输入框）
Ctrl/Cmd + F : 搜索任务
Ctrl/Cmd + / : 显示快捷键列表
Esc : 关闭弹窗

点击确定关闭此提示
        `;
        
        alert(shortcuts);
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful:', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
    App.registerServiceWorker();
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        UI.closeModal(modal);
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            UI.closeModal(modal);
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            UI.closeModal(modal);
        });
    }

    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'n':
                e.preventDefault();
                UI.elements.taskTitle.focus();
                break;
            case 'f':
                e.preventDefault();
                UI.elements.searchInput.focus();
                break;
            case '/':
                e.preventDefault();
                App.showKeyboardShortcuts();
                break;
        }
    }
});
