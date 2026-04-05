const TaskManager = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    create(taskData) {
        const tasks = Storage.getTasks();
        
        const newTask = {
            id: this.generateId(),
            title: taskData.title.trim(),
            description: taskData.description ? taskData.description.trim() : '',
            completed: false,
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            category: taskData.category || '',
            tags: taskData.tags ? taskData.tags.map(tag => tag.trim()).filter(tag => tag) : [],
            dueDate: taskData.dueDate || '',
            recurrence: taskData.recurrence || '',
            reminder: taskData.reminder || '',
            subtasks: taskData.subtasks || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        Storage.setTasks(tasks);
        
        return newTask;
    },

    getAll() {
        return Storage.getTasks();
    },

    getById(id) {
        const tasks = Storage.getTasks();
        return tasks.find(task => task.id === id);
    },

    update(id, updates) {
        const tasks = Storage.getTasks();
        const index = tasks.findIndex(task => task.id === id);
        
        if (index === -1) {
            return null;
        }

        const updatedTask = {
            ...tasks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (updates.title !== undefined) {
            updatedTask.title = updates.title.trim();
        }
        
        if (updates.description !== undefined) {
            updatedTask.description = updates.description ? updates.description.trim() : '';
        }
        
        if (updates.tags !== undefined) {
            updatedTask.tags = updates.tags.map(tag => tag.trim()).filter(tag => tag);
        }

        tasks[index] = updatedTask;
        Storage.setTasks(tasks);
        
        return updatedTask;
    },

    delete(id) {
        const tasks = Storage.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);
        
        if (filteredTasks.length === tasks.length) {
            return false;
        }

        Storage.setTasks(filteredTasks);
        return true;
    },

    toggleComplete(id) {
        const task = this.getById(id);
        if (!task) {
            return null;
        }
        
        return this.update(id, { 
            completed: !task.completed,
            status: !task.completed ? 'completed' : 'todo'
        });
    },

    updateStatus(id, status) {
        const task = this.getById(id);
        if (!task) {
            return null;
        }
        
        return this.update(id, { 
            status: status,
            completed: status === 'completed'
        });
    },

    getByStatus(status) {
        const tasks = Storage.getTasks();
        return tasks.filter(task => task.status === status);
    },

    calculateNextDueDate(recurrence, currentDate) {
        if (!recurrence || !currentDate) return null;
        
        const date = new Date(currentDate);
        
        switch(recurrence) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                return null;
        }
        
        return date.toISOString().split('T')[0];
    },

    completeRecurringTask(taskId) {
        const task = this.getById(taskId);
        if (!task || !task.recurrence) return null;

        const nextDueDate = this.calculateNextDueDate(task.recurrence, task.dueDate);
        
        if (nextDueDate) {
            const newTask = this.create({
                ...task,
                id: undefined,
                completed: false,
                status: 'todo',
                dueDate: nextDueDate,
                createdAt: undefined,
                updatedAt: undefined
            });
            
            return newTask;
        }
        
        return null;
    },

    getByCategory(categoryId) {
        const tasks = Storage.getTasks();
        return tasks.filter(task => task.category === categoryId);
    },

    getByTag(tag) {
        const tasks = Storage.getTasks();
        return tasks.filter(task => task.tags.includes(tag));
    },

    getCompleted() {
        const tasks = Storage.getTasks();
        return tasks.filter(task => task.completed);
    },

    getPending() {
        const tasks = Storage.getTasks();
        return tasks.filter(task => !task.completed);
    },

    getOverdue() {
        const tasks = Storage.getTasks();
        const now = new Date();
        
        return tasks.filter(task => {
            if (task.completed || !task.dueDate) {
                return false;
            }
            return new Date(task.dueDate) < now;
        });
    },

    getStats() {
        const tasks = Storage.getTasks();
        const completed = tasks.filter(task => task.completed).length;
        const pending = tasks.length - completed;
        
        return {
            total: tasks.length,
            completed,
            pending,
            overdue: this.getOverdue().length
        };
    },

    clearCompleted() {
        const tasks = Storage.getTasks();
        const activeTasks = tasks.filter(task => !task.completed);
        Storage.setTasks(activeTasks);
        return tasks.length - activeTasks.length;
    },

    addSubtask(taskId, subtaskTitle) {
        const task = this.getById(taskId);
        if (!task) {
            return null;
        }

        const subtask = {
            id: this.generateId(),
            title: subtaskTitle.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        const subtasks = task.subtasks || [];
        subtasks.push(subtask);

        return this.update(taskId, { subtasks });
    },

    updateSubtask(taskId, subtaskId, updates) {
        const task = this.getById(taskId);
        if (!task || !task.subtasks) {
            return null;
        }

        const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
        if (subtaskIndex === -1) {
            return null;
        }

        const subtasks = [...task.subtasks];
        subtasks[subtaskIndex] = {
            ...subtasks[subtaskIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (updates.title !== undefined) {
            subtasks[subtaskIndex].title = updates.title.trim();
        }

        return this.update(taskId, { subtasks });
    },

    deleteSubtask(taskId, subtaskId) {
        const task = this.getById(taskId);
        if (!task || !task.subtasks) {
            return false;
        }

        const subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        
        if (subtasks.length === task.subtasks.length) {
            return false;
        }

        return this.update(taskId, { subtasks });
    },

    toggleSubtaskComplete(taskId, subtaskId) {
        const task = this.getById(taskId);
        if (!task || !task.subtasks) {
            return null;
        }

        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (!subtask) {
            return null;
        }

        return this.updateSubtask(taskId, subtaskId, { completed: !subtask.completed });
    },

    getSubtaskProgress(taskId) {
        const task = this.getById(taskId);
        if (!task || !task.subtasks || task.subtasks.length === 0) {
            return null;
        }

        const total = task.subtasks.length;
        const completed = task.subtasks.filter(st => st.completed).length;

        return {
            total,
            completed,
            percentage: Math.round((completed / total) * 100)
        };
    }
};

const CategoryManager = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    create(categoryData) {
        const categories = Storage.getCategories();
        
        const newCategory = {
            id: this.generateId(),
            name: categoryData.name.trim(),
            color: categoryData.color || '#3498db',
            createdAt: new Date().toISOString()
        };

        categories.push(newCategory);
        Storage.setCategories(categories);
        
        return newCategory;
    },

    getAll() {
        return Storage.getCategories();
    },

    getById(id) {
        const categories = Storage.getCategories();
        return categories.find(category => category.id === id);
    },

    update(id, updates) {
        const categories = Storage.getCategories();
        const index = categories.findIndex(category => category.id === id);
        
        if (index === -1) {
            return null;
        }

        const updatedCategory = {
            ...categories[index],
            ...updates
        };

        if (updates.name !== undefined) {
            updatedCategory.name = updates.name.trim();
        }

        categories[index] = updatedCategory;
        Storage.setCategories(categories);
        
        return updatedCategory;
    },

    delete(id) {
        const categories = Storage.getCategories();
        const filteredCategories = categories.filter(category => category.id !== id);
        
        if (filteredCategories.length === categories.length) {
            return false;
        }

        Storage.setCategories(filteredCategories);
        
        const tasks = TaskManager.getByCategory(id);
        tasks.forEach(task => {
            TaskManager.update(task.id, { category: '' });
        });

        return true;
    }
};

const TemplateManager = {
    getDefaultTemplates() {
        return [
            {
                id: 'meeting',
                name: '会议准备',
                description: '会议前的准备工作清单',
                icon: '📋',
                tasks: [
                    { title: '确定会议时间和地点', priority: 'high' },
                    { title: '发送会议邀请', priority: 'high' },
                    { title: '准备会议议程', priority: 'medium' },
                    { title: '准备会议材料', priority: 'medium' },
                    { title: '测试设备（投影、音响等）', priority: 'low' }
                ]
            },
            {
                id: 'project',
                name: '项目启动',
                description: '新项目启动的任务清单',
                icon: '🚀',
                tasks: [
                    { title: '明确项目目标和范围', priority: 'high' },
                    { title: '组建项目团队', priority: 'high' },
                    { title: '制定项目计划', priority: 'high' },
                    { title: '分配任务和职责', priority: 'medium' },
                    { title: '设置里程碑', priority: 'medium' },
                    { title: '建立沟通机制', priority: 'low' }
                ]
            },
            {
                id: 'shopping',
                name: '购物清单',
                description: '日常购物清单模板',
                icon: '🛒',
                tasks: [
                    { title: '水果蔬菜', priority: 'medium' },
                    { title: '肉类和海鲜', priority: 'medium' },
                    { title: '日用品', priority: 'low' },
                    { title: '零食饮料', priority: 'low' }
                ]
            },
            {
                id: 'travel',
                name: '旅行准备',
                description: '出行前的准备清单',
                icon: '✈️',
                tasks: [
                    { title: '预订机票/车票', priority: 'high' },
                    { title: '预订酒店', priority: 'high' },
                    { title: '准备证件（身份证、护照等）', priority: 'high' },
                    { title: '整理行李', priority: 'medium' },
                    { title: '检查天气情况', priority: 'low' },
                    { title: '准备充电器和转换插头', priority: 'low' }
                ]
            },
            {
                id: 'weekly-review',
                name: '周回顾',
                description: '每周工作回顾清单',
                icon: '📊',
                tasks: [
                    { title: '回顾本周完成的任务', priority: 'high' },
                    { title: '整理未完成的任务', priority: 'high' },
                    { title: '规划下周工作', priority: 'high' },
                    { title: '更新项目进度', priority: 'medium' },
                    { title: '清理桌面和文件', priority: 'low' }
                ]
            },
            {
                id: 'reading',
                name: '读书计划',
                description: '阅读一本书的任务分解',
                icon: '📚',
                tasks: [
                    { title: '选择要读的书', priority: 'medium' },
                    { title: '制定阅读计划', priority: 'medium' },
                    { title: '阅读第一章', priority: 'medium' },
                    { title: '做读书笔记', priority: 'low' },
                    { title: '总结读后感', priority: 'low' }
                ]
            }
        ];
    },

    getAll() {
        const customTemplates = Storage.get('todo_templates') || [];
        return [...this.getDefaultTemplates(), ...customTemplates];
    },

    getById(id) {
        const templates = this.getAll();
        return templates.find(template => template.id === id);
    },

    createFromTask(taskId) {
        const task = TaskManager.getById(taskId);
        if (!task) {
            return null;
        }

        const template = {
            id: 'custom_' + Date.now().toString(36),
            name: task.title,
            description: '自定义模板',
            icon: '📝',
            tasks: [
                {
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    category: task.category,
                    tags: task.tags,
                    subtasks: task.subtasks || []
                }
            ],
            isCustom: true,
            createdAt: new Date().toISOString()
        };

        const customTemplates = Storage.get('todo_templates') || [];
        customTemplates.push(template);
        Storage.set('todo_templates', customTemplates);

        return template;
    },

    delete(id) {
        const customTemplates = Storage.get('todo_templates') || [];
        const filtered = customTemplates.filter(t => t.id !== id);
        
        if (filtered.length === customTemplates.length) {
            return false;
        }

        Storage.set('todo_templates', filtered);
        return true;
    },

    applyTemplate(templateId, customData = {}) {
        const template = this.getById(templateId);
        if (!template) {
            return [];
        }

        const createdTasks = [];
        
        template.tasks.forEach((taskTemplate, index) => {
            const taskData = {
                title: taskTemplate.title,
                description: taskTemplate.description || '',
                priority: taskTemplate.priority || 'medium',
                category: customData.category || taskTemplate.category || '',
                tags: customData.tags || taskTemplate.tags || [],
                dueDate: customData.dueDate || '',
                subtasks: taskTemplate.subtasks || []
            };

            const task = TaskManager.create(taskData);
            createdTasks.push(task);
        });

        return createdTasks;
    }
};
