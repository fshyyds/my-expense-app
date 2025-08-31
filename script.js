// 记账应用
class ExpenseApp {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.expenses = [];
        this.currentTab = 'add';
        this.currentPeriod = 'day';
        this.categories = {
            food: { name: '餐饮', icon: '🍜' },
            transport: { name: '交通', icon: '🚗' },
            shopping: { name: '购物', icon: '🛒' },
            entertainment: { name: '娱乐', icon: '🎬' },
            health: { name: '医疗', icon: '🏥' },
            education: { name: '教育', icon: '📚' },
            housing: { name: '住房', icon: '🏠' },
            other: { name: '其他', icon: '📝' }
        };
        this.init();
        this.initPWA();
    }

    init() {
        // 获取DOM元素
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 记账表单元素
        this.amountInput = document.getElementById('amountInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.noteInput = document.getElementById('noteInput');
        this.dateInput = document.getElementById('dateInput');
        this.addExpenseBtn = document.getElementById('addExpenseBtn');
        
        // 统计页面元素
        this.periodBtns = document.querySelectorAll('.period-btn');
        this.totalExpense = document.getElementById('totalExpense');
        this.expenseCount = document.getElementById('expenseCount');
        this.avgExpense = document.getElementById('avgExpense');
        this.categoryStats = document.getElementById('categoryStats');
        
        // 历史页面元素
        this.historyMonth = document.getElementById('historyMonth');
        this.filterBtn = document.getElementById('filterBtn');
        this.expenseList = document.getElementById('expenseList');
        this.emptyState = document.getElementById('emptyState');
        
        // 设置页面元素
        this.totalRecords = document.getElementById('totalRecords');
        this.firstRecord = document.getElementById('firstRecord');
        this.dataSize = document.getElementById('dataSize');
        this.exportJsonBtn = document.getElementById('exportJsonBtn');
        this.exportTxtBtn = document.getElementById('exportTxtBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.clearDataBtn = document.getElementById('clearDataBtn');
        
        // 用户管理元素
        this.userName = document.getElementById('userName');
        this.switchUserBtn = document.getElementById('switchUserBtn');
        this.userModal = document.getElementById('userModal');
        this.userList = document.getElementById('userList');
        this.newUserName = document.getElementById('newUserName');
        this.createUserBtn = document.getElementById('createUserBtn');
        this.cancelUserBtn = document.getElementById('cancelUserBtn');

        // 设置默认日期为今天
        this.dateInput.value = new Date().toISOString().split('T')[0];
        this.historyMonth.value = new Date().toISOString().slice(0, 7);

        // 事件监听
        this.setupEventListeners();

        // 初始渲染
        this.render();
    }

    setupEventListeners() {
        // 标签页切换
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 添加消费记录
        this.addExpenseBtn.addEventListener('click', () => this.addExpense());
        this.amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });

        // 统计周期切换
        this.periodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchPeriod(e.target.dataset.period);
            });
        });

        // 历史筛选
        this.filterBtn.addEventListener('click', () => this.filterHistory());
        this.historyMonth.addEventListener('change', () => this.filterHistory());

        // 设置页面事件
        this.exportJsonBtn.addEventListener('click', () => this.exportJsonData());
        this.exportTxtBtn.addEventListener('click', () => this.exportTextData());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importData(e));
        this.clearDataBtn.addEventListener('click', () => this.clearAllData());

        // 用户管理事件
        this.switchUserBtn.addEventListener('click', () => this.showUserModal());
        this.createUserBtn.addEventListener('click', () => this.createUser());
        this.cancelUserBtn.addEventListener('click', () => this.hideUserModal());
        this.newUserName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createUser();
        });
        
        // 点击模态框外部关闭
        this.userModal.addEventListener('click', (e) => {
            if (e.target === this.userModal) {
                this.hideUserModal();
            }
        });
        
        // 初始化用户系统
        this.initUserSystem();
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新标签按钮状态
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 显示对应内容
        this.tabContents.forEach(content => {
            if (content.id === tabName + 'Tab') {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        // 渲染对应页面内容
        if (tabName === 'stats') {
            this.renderStats();
        } else if (tabName === 'history') {
            this.renderHistory();
        } else if (tabName === 'settings') {
            this.renderSettings();
        }
    }

    switchPeriod(period) {
        this.currentPeriod = period;
        
        // 更新周期按钮状态
        this.periodBtns.forEach(btn => {
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderStats();
    }

    addExpense() {
        // 检查是否已选择用户
        if (!this.currentUser) {
            this.showMessage('请先选择用户', 'error');
            this.showUserModal();
            return;
        }

        const amount = parseFloat(this.amountInput.value);
        const category = this.categorySelect.value;
        const note = this.noteInput.value.trim();
        const date = this.dateInput.value;

        // 验证输入
        if (!amount || amount <= 0) {
            this.showMessage('请输入有效金额', 'error');
            return;
        }

        if (!date) {
            this.showMessage('请选择日期', 'error');
            return;
        }

        // 创建消费记录
        const expense = {
            id: Date.now(),
            amount: amount,
            category: category,
            note: note,
            date: date,
            timestamp: new Date(date).getTime(),
            createdAt: new Date().toISOString()
        };

        this.expenses.push(expense);
        this.saveExpenses();

        // 清空表单
        this.amountInput.value = '';
        this.noteInput.value = '';
        this.dateInput.value = new Date().toISOString().split('T')[0];

        // 成功提示
        this.showMessage('记录成功！', 'success');
        
        // 如果当前在统计或历史页面，重新渲染
        if (this.currentTab === 'stats') {
            this.renderStats();
        } else if (this.currentTab === 'history') {
            this.renderHistory();
        }
    }

    deleteExpense(id) {
        if (confirm('确定要删除这条记录吗？')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.renderHistory();
            this.showMessage('记录已删除', 'success');
        }
    }

    saveExpenses() {
        if (this.currentUser) {
            localStorage.setItem(`expenses_${this.currentUser.id}`, JSON.stringify(this.expenses));
        }
    }

    loadExpenses() {
        if (this.currentUser) {
            this.expenses = JSON.parse(localStorage.getItem(`expenses_${this.currentUser.id}`)) || [];
        } else {
            this.expenses = [];
        }
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    getFilteredExpenses(period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                startDate = new Date(now.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 * 60 * 1000);
                startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return this.expenses;
        }

        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= now;
        });
    }

    renderStats() {
        const filteredExpenses = this.getFilteredExpenses(this.currentPeriod);
        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const expenseCount = filteredExpenses.length;
        const avgAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;

        // 更新统计数据
        this.totalExpense.textContent = `¥${totalAmount.toFixed(2)}`;
        this.expenseCount.textContent = expenseCount;
        this.avgExpense.textContent = `¥${avgAmount.toFixed(2)}`;

        // 按分类统计
        this.renderCategoryStats(filteredExpenses);
    }

    renderCategoryStats(expenses) {
        const categoryTotals = {};
        
        // 计算每个分类的总额
        expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });

        // 按金额排序
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        // 渲染分类统计
        this.categoryStats.innerHTML = '';
        
        if (sortedCategories.length === 0) {
            this.categoryStats.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无数据</div>';
            return;
        }

        sortedCategories.forEach(([category, amount]) => {
            const categoryInfo = this.categories[category];
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <div class="category-info">
                    <span class="category-icon">${categoryInfo.icon}</span>
                    <span class="category-name">${categoryInfo.name}</span>
                </div>
                <span class="category-amount">¥${amount.toFixed(2)}</span>
            `;
            this.categoryStats.appendChild(categoryItem);
        });
    }

    renderHistory() {
        const selectedMonth = this.historyMonth.value;
        let filteredExpenses = this.expenses;

        // 按月份筛选
        if (selectedMonth) {
            filteredExpenses = this.expenses.filter(expense => {
                return expense.date.startsWith(selectedMonth);
            });
        }

        // 按日期倒序排列
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 清空列表
        this.expenseList.innerHTML = '';

        if (filteredExpenses.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');

        filteredExpenses.forEach(expense => {
            const categoryInfo = this.categories[expense.category];
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';
            
            const date = new Date(expense.date);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            const time = new Date(expense.createdAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            expenseItem.innerHTML = `
                <div class="expense-info">
                    <div class="expense-category">${categoryInfo.icon}</div>
                    <div class="expense-details">
                        <h4>${expense.note || categoryInfo.name}</h4>
                        <div class="expense-meta">${categoryInfo.name} • ${formattedDate} ${time}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="expense-amount">-¥${expense.amount.toFixed(2)}</div>
                    <button onclick="app.deleteExpense(${expense.id})" 
                            style="background:none;border:none;color:#999;font-size:12px;cursor:pointer;margin-top:2px;">
                        删除
                    </button>
                </div>
            `;
            
            this.expenseList.appendChild(expenseItem);
        });
    }

    filterHistory() {
        this.renderHistory();
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
        `;

        document.body.appendChild(messageDiv);

        // 3秒后自动消失
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    renderSettings() {
        // 更新数据统计
        const totalRecords = this.expenses.length;
        let firstRecordDate = '无';
        let dataSize = 0;

        if (totalRecords > 0) {
            // 按时间排序找到最早的记录
            const sortedExpenses = [...this.expenses].sort((a, b) => 
                new Date(a.date) - new Date(b.date));
            firstRecordDate = new Date(sortedExpenses[0].date).toLocaleDateString('zh-CN');
            
            // 计算数据大小
            const dataString = JSON.stringify(this.expenses);
            dataSize = Math.round(dataString.length / 1024 * 100) / 100;
        }

        this.totalRecords.textContent = totalRecords;
        this.firstRecord.textContent = firstRecordDate;
        this.dataSize.textContent = `${dataSize} KB`;
    }

    exportJsonData() {
        if (!this.currentUser) {
            this.showMessage('请先选择用户', 'error');
            return;
        }

        if (this.expenses.length === 0) {
            this.showMessage('暂无数据可导出', 'error');
            return;
        }

        try {
            const exportData = {
                version: '1.1.0',
                exportTime: new Date().toISOString(),
                totalRecords: this.expenses.length,
                user: {
                    name: this.currentUser.name,
                    id: this.currentUser.id
                },
                expenses: this.expenses
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.currentUser.name}-备份-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showMessage(`成功导出 ${this.expenses.length} 条记录 (JSON格式)`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('导出失败，请重试', 'error');
        }
    }

    exportTextData() {
        if (!this.currentUser) {
            this.showMessage('请先选择用户', 'error');
            return;
        }

        if (this.expenses.length === 0) {
            this.showMessage('暂无数据可导出', 'error');
            return;
        }

        try {
            // 按日期排序
            const sortedExpenses = [...this.expenses].sort((a, b) => 
                new Date(b.date) - new Date(a.date));

            // 计算总金额
            const totalAmount = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);

            // 生成文本内容
            let textContent = `📊 ${this.currentUser.name}的消费账单\n`;
            textContent += `═══════════════════════\n`;
            textContent += `用户名称：${this.currentUser.name}\n`;
            textContent += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
            textContent += `记录总数：${this.expenses.length} 笔\n`;
            textContent += `消费总额：¥${totalAmount.toFixed(2)}\n`;
            textContent += `平均消费：¥${(totalAmount / this.expenses.length).toFixed(2)}\n\n`;

            // 按月份分组统计
            const monthlyStats = {};
            sortedExpenses.forEach(expense => {
                const month = expense.date.slice(0, 7);
                if (!monthlyStats[month]) {
                    monthlyStats[month] = { total: 0, count: 0 };
                }
                monthlyStats[month].total += expense.amount;
                monthlyStats[month].count += 1;
            });

            textContent += `📅 月度统计\n`;
            textContent += `─────────────────────\n`;
            Object.entries(monthlyStats)
                .sort(([a], [b]) => b.localeCompare(a))
                .forEach(([month, stats]) => {
                    textContent += `${month}：¥${stats.total.toFixed(2)} (${stats.count}笔)\n`;
                });

            textContent += `\n📝 详细记录\n`;
            textContent += `─────────────────────\n`;

            sortedExpenses.forEach((expense, index) => {
                const categoryInfo = this.categories[expense.category];
                const date = new Date(expense.date).toLocaleDateString('zh-CN');
                
                textContent += `${index + 1}. ${date}\n`;
                textContent += `   ${categoryInfo.icon} ${categoryInfo.name}  ¥${expense.amount.toFixed(2)}\n`;
                if (expense.note) {
                    textContent += `   备注：${expense.note}\n`;
                }
                textContent += `\n`;
            });

            textContent += `═══════════════════════\n`;
            textContent += `💰 记账本 - 让消费更清晰\n`;

            // 创建并下载文件
            const dataBlob = new Blob([textContent], { type: 'text/plain; charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.currentUser.name}-消费账单-${new Date().toISOString().split('T')[0]}.txt`;
            link.click();

            this.showMessage(`成功导出 ${this.expenses.length} 条记录 (文本格式)`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('导出失败，请重试', 'error');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            this.showMessage('请选择JSON格式的文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!data.expenses || !Array.isArray(data.expenses)) {
                    throw new Error('数据格式不正确');
                }

                // 显示导入信息
                let importMsg = `即将导入 ${data.expenses.length} 条记录`;
                if (data.user && data.user.name) {
                    importMsg += `\n来源用户：${data.user.name}`;
                }
                if (!this.currentUser) {
                    importMsg += `\n\n请先选择一个用户，或创建新用户`;
                    this.showMessage('请先选择用户', 'error');
                    this.showUserModal();
                    return;
                }
                
                importMsg += `\n目标用户：${this.currentUser.name}`;
                importMsg += `\n\n选择"确定"覆盖现有数据\n选择"取消"追加到现有数据`;

                // 询问用户是否覆盖现有数据
                const shouldReplace = confirm(importMsg);

                if (shouldReplace) {
                    this.expenses = data.expenses;
                } else {
                    // 追加数据，避免ID冲突
                    const maxId = Math.max(0, ...this.expenses.map(e => e.id));
                    const newExpenses = data.expenses.map((expense, index) => ({
                        ...expense,
                        id: maxId + index + 1
                    }));
                    this.expenses.push(...newExpenses);
                }

                this.saveExpenses();
                this.renderSettings();
                this.showMessage(`成功导入 ${data.expenses.length} 条记录`, 'success');
                
                // 重新渲染当前页面
                if (this.currentTab === 'stats') {
                    this.renderStats();
                } else if (this.currentTab === 'history') {
                    this.renderHistory();
                }
                
            } catch (error) {
                console.error('Import error:', error);
                this.showMessage('导入失败，文件格式可能不正确', 'error');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // 清空文件选择
    }

    clearAllData() {
        if (!this.currentUser) {
            this.showMessage('请先选择用户', 'error');
            return;
        }

        if (this.expenses.length === 0) {
            this.showMessage('暂无数据', 'error');
            return;
        }

        if (confirm(`确定要清空所有 ${this.expenses.length} 条记录吗？\n\n此操作无法撤销！建议先导出备份。`)) {
            this.expenses = [];
            this.saveExpenses();
            this.renderSettings();
            this.showMessage('所有数据已清空', 'success');
            
            // 重新渲染其他页面
            if (this.currentTab === 'stats') {
                this.renderStats();
            } else if (this.currentTab === 'history') {
                this.renderHistory();
            }
        }
    }

    render() {
        // 初始渲染当前标签页
        if (this.currentTab === 'stats') {
            this.renderStats();
        } else if (this.currentTab === 'history') {
            this.renderHistory();
        } else if (this.currentTab === 'settings') {
            this.renderSettings();
        }
    }

    // 用户管理系统
    initUserSystem() {
        // 检查是否有当前用户
        const lastUserId = localStorage.getItem('lastUserId');
        if (lastUserId) {
            const user = this.users.find(u => u.id === lastUserId);
            if (user) {
                this.switchToUser(user);
                return;
            }
        }
        
        // 如果没有用户或用户已被删除，显示用户选择
        if (this.users.length === 0) {
            // 如果没有任何用户，自动显示用户创建界面
            setTimeout(() => this.showUserModal(), 500);
        } else {
            // 如果有用户但没有选择，显示用户选择界面
            setTimeout(() => this.showUserModal(), 500);
        }
    }

    showUserModal() {
        this.renderUserList();
        this.userModal.classList.add('show');
        this.newUserName.value = '';
    }

    hideUserModal() {
        this.userModal.classList.remove('show');
    }

    renderUserList() {
        this.userList.innerHTML = '';
        
        if (this.users.length === 0) {
            this.userList.innerHTML = '<div class="empty-users">暂无用户，请创建一个新用户</div>';
            return;
        }

        this.users.forEach(user => {
            const userExpenses = JSON.parse(localStorage.getItem(`expenses_${user.id}`)) || [];
            const totalAmount = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            
            const userItem = document.createElement('div');
            userItem.className = `user-item ${user.id === (this.currentUser?.id || '') ? 'active' : ''}`;
            userItem.innerHTML = `
                <div class="user-info-item">
                    <div class="user-name">${user.name}</div>
                    <div class="user-stats">${userExpenses.length}条记录 • ¥${totalAmount.toFixed(2)}</div>
                </div>
                <button class="delete-user-btn" onclick="app.deleteUser('${user.id}')" title="删除用户">×</button>
            `;
            
            userItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-user-btn')) {
                    this.switchToUser(user);
                    this.hideUserModal();
                }
            });
            
            this.userList.appendChild(userItem);
        });
    }

    createUser() {
        const name = this.newUserName.value.trim();
        if (!name) {
            this.showMessage('请输入用户名', 'error');
            return;
        }

        if (name.length > 10) {
            this.showMessage('用户名不能超过10个字符', 'error');
            return;
        }

        // 检查用户名是否已存在
        if (this.users.some(u => u.name === name)) {
            this.showMessage('用户名已存在', 'error');
            return;
        }

        const user = {
            id: 'user_' + Date.now(),
            name: name,
            createdAt: new Date().toISOString()
        };

        this.users.push(user);
        this.saveUsers();
        this.switchToUser(user);
        this.hideUserModal();
        this.showMessage(`用户"${name}"创建成功`, 'success');
    }

    switchToUser(user) {
        this.currentUser = user;
        localStorage.setItem('lastUserId', user.id);
        this.userName.textContent = user.name;
        this.loadExpenses();
        
        // 重新渲染所有页面
        this.render();
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const userExpenses = JSON.parse(localStorage.getItem(`expenses_${userId}`)) || [];
        
        const confirmMsg = userExpenses.length > 0 
            ? `确定要删除用户"${user.name}"吗？\n\n这将同时删除该用户的${userExpenses.length}条消费记录，此操作不可恢复！`
            : `确定要删除用户"${user.name}"吗？`;

        if (!confirm(confirmMsg)) return;

        // 删除用户数据
        localStorage.removeItem(`expenses_${userId}`);
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();

        // 如果删除的是当前用户
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = null;
            this.expenses = [];
            this.userName.textContent = '请选择用户';
            localStorage.removeItem('lastUserId');
        }

        this.renderUserList();
        this.showMessage(`用户"${user.name}"已删除`, 'success');
        
        // 如果没有用户了，延迟显示创建界面
        if (this.users.length === 0) {
            setTimeout(() => {
                this.showMessage('请创建一个新用户开始记账', 'info');
            }, 1500);
        }
    }

    // PWA 相关功能
    initPWA() {
        // 注册 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }

        // PWA 安装提示
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA 已安装');
            this.hideInstallPrompt();
        });
    }

    showInstallPrompt() {
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt';
        installPrompt.innerHTML = `
            <span>📱 添加到主屏幕，像APP一样使用</span>
            <div>
                <button onclick="app.installApp()">安装</button>
                <button class="close" onclick="app.hideInstallPrompt()">×</button>
            </div>
        `;
        installPrompt.id = 'installPrompt';
        document.body.appendChild(installPrompt);
        
        setTimeout(() => {
            installPrompt.classList.add('show');
        }, 1000);
    }

    installApp() {
        const installPrompt = document.getElementById('installPrompt');
        if (!installPrompt) return;

        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('用户同意安装PWA');
                } else {
                    console.log('用户拒绝安装PWA');
                }
                window.deferredPrompt = null;
                this.hideInstallPrompt();
            });
        }
    }

    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.remove();
        }
    }
}

// 初始化应用
const app = new ExpenseApp();

// 防止页面缩放 (iOS Safari)
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// PWA 状态检测
window.addEventListener('online', () => {
    console.log('网络已连接');
});

window.addEventListener('offline', () => {
    console.log('离线模式');
});