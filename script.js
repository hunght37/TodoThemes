document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const taskPriority = document.getElementById('taskPriority');
    const taskDeadline = document.getElementById('taskDeadline');
    const taskCategory = document.getElementById('taskCategory');
    const addTaskButton = document.getElementById('addTask');
    const tasksList = document.getElementById('tasksList');
    const themeToggle = document.getElementById('themeToggle');
    const sortCriteria = document.getElementById('sortCriteria');
    const templatesModal = document.getElementById('templatesModal');
    const templateBtn = document.getElementById('templateBtn');
    const closeTemplates = document.getElementById('closeTemplates');
    const editTaskModal = document.getElementById('editTaskModal');
    const categoryList = document.getElementById('categoryList');
    const filtersList = document.getElementById('filtersList');

    // Statistics Elements
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    const activeTasksElement = document.getElementById('activeTasks');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentCategory = 'all';
    let currentTag = null;
    let editingTaskId = null;
    let templates = JSON.parse(localStorage.getItem('templates')) || [
        { text: 'Daily Standup Meeting', category: 'work', priority: 'medium' },
        { text: 'Weekly Report', category: 'work', priority: 'high' },
        { text: 'Grocery Shopping', category: 'shopping', priority: 'low' }
    ];

    // Theme Management
    const toggleTheme = () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    themeToggle.addEventListener('click', toggleTheme);

    // Update Statistics
    const updateStatistics = () => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        totalTasksElement.textContent = totalTasks;
        completedTasksElement.textContent = completedTasks;
        activeTasksElement.textContent = activeTasks;
        progressBar.style.width = `${completionPercentage}%`;
        progressText.textContent = `${completionPercentage}% Complete`;
    };

    // Save tasks to localStorage
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStatistics();
    };

    // Filter tasks
    const filterTasks = () => {
        let filteredTasks = [...tasks];

        // Áp dụng bộ lọc theo danh mục nếu được chọn
        if (currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
        }

        // Áp dụng bộ lọc theo trạng thái
        if (currentFilter !== 'all') {
            switch (currentFilter) {
                case 'active':
                    filteredTasks = filteredTasks.filter(task => !task.completed);
                    break;
                case 'completed':
                    filteredTasks = filteredTasks.filter(task => task.completed);
                    break;
                case 'high':
                case 'medium':
                case 'low':
                    filteredTasks = filteredTasks.filter(task => task.priority === currentFilter);
                    break;
            }
        }

        // Áp dụng bộ lọc theo tag nếu có
        if (currentTag) {
            filteredTasks = tasks.filter(task => task.tags && task.tags.includes(currentTag));
        }

        return filteredTasks;
    };

    // Sort tasks
    const sortTasks = (tasksToSort) => {
        return tasksToSort.sort((a, b) => {
            switch (sortCriteria.value) {
                case 'priority':
                    const priorityOrder = { high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'deadline':
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'alphabetical':
                    return a.text.localeCompare(b.text);
                default: // dateAdded
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
            }
        });
    };

    // Create Task Element
    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.completed) li.classList.add('task-completed');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;

        const content = document.createElement('div');
        content.className = 'task-content';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;

        const taskDetails = document.createElement('span');
        taskDetails.className = 'task-details';
        
        const prioritySpan = document.createElement('span');
        prioritySpan.className = `task-priority priority-${task.priority}`;
        prioritySpan.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        const deadlineSpan = document.createElement('span');
        deadlineSpan.textContent = task.deadline ? `Due: ${new Date(task.deadline).toLocaleDateString()}` : '';

        const categorySpan = document.createElement('span');
        categorySpan.textContent = `Category: ${task.category}`;

        // Hiển thị tags nếu có
        const tagsSpan = document.createElement('span');
        if (task.tags && task.tags.length > 0) {
            tagsSpan.className = 'task-tags';
            task.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = `#${tag}`;
                tagElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentTag = tag;
                    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
                    tagElement.classList.add('active');
                    renderTasks();
                });
                tagsSpan.appendChild(tagElement);
            });
        }

        taskDetails.appendChild(prioritySpan);
        if (task.deadline) {
            taskDetails.appendChild(document.createTextNode(' | '));
            taskDetails.appendChild(deadlineSpan);
        }
        taskDetails.appendChild(document.createTextNode(' | '));
        taskDetails.appendChild(categorySpan);
        if (task.tags && task.tags.length > 0) {
            taskDetails.appendChild(document.createTextNode(' | '));
            taskDetails.appendChild(tagsSpan);
        }

        content.appendChild(taskText);
        content.appendChild(taskDetails);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';

        // Event Listeners
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            li.classList.toggle('task-completed');
            saveTasks();
        });

        editButton.addEventListener('click', () => {
            editingTaskId = task.id;
            document.getElementById('editTaskInput').value = task.text;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskDeadline').value = task.deadline || '';
            document.getElementById('editTaskCategory').value = task.category;
            editTaskModal.style.display = 'block';
        });

        deleteButton.addEventListener('click', () => {
            li.remove();
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(actions);

        return li;
    };

    // Render tasks
    const renderTasks = () => {
        tasksList.innerHTML = '';
        const filteredTasks = filterTasks();
        const sortedTasks = sortTasks(filteredTasks);
        
        // Hiển thị thông tin về bộ lọc hiện tại
        const filterInfo = document.createElement('div');
        filterInfo.className = 'filter-info';
        if (currentTag) {
            filterInfo.textContent = `Showing tasks with tag: #${currentTag}`;
            const clearFilter = document.createElement('button');
            clearFilter.textContent = 'Clear Filter';
            clearFilter.className = 'clear-filter';
            clearFilter.addEventListener('click', () => {
                currentTag = null;
                document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
                renderTasks();
            });
            filterInfo.appendChild(clearFilter);
            tasksList.appendChild(filterInfo);
        }

        sortedTasks.forEach(task => {
            tasksList.appendChild(createTaskElement(task));
        });

        // Hiển thị thông báo nếu không có task nào
        if (sortedTasks.length === 0) {
            const noTasks = document.createElement('li');
            noTasks.className = 'no-tasks';
            noTasks.textContent = 'No tasks found';
            tasksList.appendChild(noTasks);
        }
    };

    // Add new task
    const addTask = () => {
        const text = taskInput.value.trim();
        if (text) {
            const task = {
                id: Date.now(),
                text,
                completed: false,
                priority: taskPriority.value,
                deadline: taskDeadline.value,
                category: taskCategory.value,
                dateAdded: new Date().toISOString(),
                tags: [] // Thêm mảng tags rỗng cho task mới
            };
            tasks.push(task);
            renderTasks();
            saveTasks();
            taskInput.value = '';
            taskDeadline.value = '';
        }
    };

    // Event Listeners
    addTaskButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    sortCriteria.addEventListener('change', renderTasks);

    categoryList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            currentCategory = e.target.dataset.category;
            currentTag = null; // Reset tag filter when changing category
            document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderTasks();
        }
    });

    filtersList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            currentFilter = e.target.dataset.filter;
            document.querySelectorAll('#filtersList li').forEach(li => li.classList.remove('active'));
            e.target.classList.add('active');
            renderTasks();
        }
    });

    // Templates
    templateBtn.addEventListener('click', () => {
        templatesModal.style.display = 'block';
    });

    closeTemplates.addEventListener('click', () => {
        templatesModal.style.display = 'none';
    });

    // Edit Task
    document.getElementById('saveTaskEdit').addEventListener('click', () => {
        const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                text: document.getElementById('editTaskInput').value,
                priority: document.getElementById('editTaskPriority').value,
                deadline: document.getElementById('editTaskDeadline').value,
                category: document.getElementById('editTaskCategory').value
            };
            saveTasks();
            renderTasks();
            editTaskModal.style.display = 'none';
        }
    });

    document.getElementById('cancelTaskEdit').addEventListener('click', () => {
        editTaskModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === templatesModal) templatesModal.style.display = 'none';
        if (e.target === editTaskModal) editTaskModal.style.display = 'none';
    });

    // Initial render
    renderTasks();
    updateStatistics();
});
