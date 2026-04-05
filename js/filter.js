const FilterManager = {
    search(tasks, query) {
        if (!query || !query.trim()) {
            return tasks;
        }

        const searchTerm = query.toLowerCase().trim();
        
        return tasks.filter(task => {
            const titleMatch = task.title.toLowerCase().includes(searchTerm);
            const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
            const tagsMatch = task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            return titleMatch || descMatch || tagsMatch;
        });
    },

    filterByCategory(tasks, categoryId) {
        if (!categoryId) {
            return tasks;
        }
        
        return tasks.filter(task => task.category === categoryId);
    },

    filterByPriority(tasks, priority) {
        if (!priority) {
            return tasks;
        }
        
        return tasks.filter(task => task.priority === priority);
    },

    filterByStatus(tasks, status) {
        if (!status) {
            return tasks;
        }
        
        if (status === 'completed') {
            return tasks.filter(task => task.completed);
        } else if (status === 'active') {
            return tasks.filter(task => !task.completed);
        }
        
        return tasks;
    },

    filterByTag(tasks, tag) {
        if (!tag) {
            return tasks;
        }
        
        return tasks.filter(task => task.tags && task.tags.includes(tag));
    },

    filter(tasks, filters) {
        let filteredTasks = [...tasks];

        if (filters.search) {
            filteredTasks = this.search(filteredTasks, filters.search);
        }

        if (filters.category) {
            filteredTasks = this.filterByCategory(filteredTasks, filters.category);
        }

        if (filters.priority) {
            filteredTasks = this.filterByPriority(filteredTasks, filters.priority);
        }

        if (filters.status) {
            filteredTasks = this.filterByStatus(filteredTasks, filters.status);
        }

        if (filters.tag) {
            filteredTasks = this.filterByTag(filteredTasks, filters.tag);
        }

        return filteredTasks;
    },

    sortByCreatedAt(tasks, ascending = true) {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    },

    sortByDueDate(tasks, ascending = true) {
        return [...tasks].sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    },

    sortByPriority(tasks, ascending = true) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        
        return [...tasks].sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 2;
            const priorityB = priorityOrder[b.priority] || 2;
            return ascending ? priorityA - priorityB : priorityB - priorityA;
        });
    },

    sortByCompleted(tasks) {
        return [...tasks].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });
    },

    sort(tasks, sortBy) {
        const [field, order] = sortBy.split('-');
        const ascending = order === 'asc';

        switch (field) {
            case 'createdAt':
                return this.sortByCreatedAt(tasks, ascending);
            case 'dueDate':
                return this.sortByDueDate(tasks, ascending);
            case 'priority':
                return this.sortByPriority(tasks, ascending);
            case 'completed':
                return this.sortByCompleted(tasks);
            default:
                return tasks;
        }
    },

    applyFiltersAndSort(tasks, filters, sortBy) {
        let result = this.filter(tasks, filters);
        
        if (sortBy) {
            result = this.sort(result, sortBy);
        }
        
        return result;
    },

    getAllTags(tasks) {
        const tagsSet = new Set();
        
        tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        tagsSet.add(tag.trim());
                    }
                });
            }
        });
        
        return Array.from(tagsSet).sort();
    },

    getTasksByDateRange(tasks, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= start && taskDate <= end;
        });
    }
};
