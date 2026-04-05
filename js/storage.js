const Storage = {
    KEYS: {
        TASKS: 'todo_tasks',
        CATEGORIES: 'todo_categories',
        THEME: 'todo_theme'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    getTasks() {
        return this.get(this.KEYS.TASKS) || [];
    },

    setTasks(tasks) {
        return this.set(this.KEYS.TASKS, tasks);
    },

    getCategories() {
        return this.get(this.KEYS.CATEGORIES) || this.getDefaultCategories();
    },

    setCategories(categories) {
        return this.set(this.KEYS.CATEGORIES, categories);
    },

    getTheme() {
        return this.get(this.KEYS.THEME) || 'light';
    },

    setTheme(theme) {
        return this.set(this.KEYS.THEME, theme);
    },

    getDefaultCategories() {
        const defaultCategories = [
            { id: 'work', name: '工作', color: '#3498db', createdAt: new Date().toISOString() },
            { id: 'personal', name: '个人', color: '#2ecc71', createdAt: new Date().toISOString() },
            { id: 'study', name: '学习', color: '#9b59b6', createdAt: new Date().toISOString() }
        ];
        this.setCategories(defaultCategories);
        return defaultCategories;
    },

    exportData() {
        const data = {
            tasks: this.getTasks(),
            categories: this.getCategories(),
            theme: this.getTheme(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid tasks data');
            }
            
            if (!data.categories || !Array.isArray(data.categories)) {
                throw new Error('Invalid categories data');
            }

            this.setTasks(data.tasks);
            this.setCategories(data.categories);
            
            if (data.theme) {
                this.setTheme(data.theme);
            }

            return {
                success: true,
                tasksCount: data.tasks.length,
                categoriesCount: data.categories.length
            };
        } catch (error) {
            console.error('Error importing data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};
