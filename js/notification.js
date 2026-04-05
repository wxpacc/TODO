const NotificationManager = {
    permission: null,

    async init() {
        if (!('Notification' in window)) {
            console.log('此浏览器不支持通知功能');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
    },

    show(title, options = {}) {
        if (this.permission !== 'granted') {
            console.log('通知权限未授予');
            return null;
        }

        const notification = new Notification(title, {
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📝</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📝</text></svg>',
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.onClick) {
                options.onClick();
            }
        };

        return notification;
    },

    checkUpcomingTasks() {
        const tasks = TaskManager.getAll();
        const now = new Date();
        const notifications = [];

        tasks.forEach(task => {
            if (task.completed || !task.dueDate || !task.reminder) return;

            const dueDate = new Date(task.dueDate);
            const reminderMinutes = parseInt(task.reminder);
            const reminderTime = new Date(dueDate.getTime() - reminderMinutes * 60000);

            const timeDiff = reminderTime.getTime() - now.getTime();
            
            if (timeDiff <= 0 && timeDiff > -60000) {
                notifications.push({
                    task,
                    type: 'reminder',
                    title: '任务提醒',
                    body: `"${task.title}" 即将到期！`,
                    onClick: () => {
                        if (UI.currentEditTaskId !== task.id) {
                            UI.populateEditForm(task);
                            UI.openModal(UI.elements.editModal);
                        }
                    }
                });
            }
        });

        notifications.forEach(({ title, body, onClick }) => {
            this.show(title, { body, onClick });
        });

        return notifications.length;
    },

    startChecking(intervalMinutes = 1) {
        this.checkUpcomingTasks();
        
        setInterval(() => {
            this.checkUpcomingTasks();
        }, intervalMinutes * 60000);
    },

    scheduleNotification(taskId, datetime, title, body) {
        const now = new Date();
        const notificationTime = new Date(datetime);
        const timeDiff = notificationTime.getTime() - now.getTime();

        if (timeDiff <= 0) return null;

        return setTimeout(() => {
            this.show(title, { body });
        }, timeDiff);
    }
};
