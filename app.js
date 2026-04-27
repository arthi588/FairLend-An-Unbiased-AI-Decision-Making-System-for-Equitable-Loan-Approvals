document.addEventListener('DOMContentLoaded', () => {
    const btnApply = document.getElementById('btn-apply');
    const btnDashboard = document.getElementById('btn-dashboard');
    const viewApply = document.getElementById('view-apply');
    const viewDashboard = document.getElementById('view-dashboard');

    // Navigation
    function switchView(activeBtn, activeView) {
        btnApply.classList.remove('active');
        btnDashboard.classList.remove('active');
        activeBtn.classList.add('active');

        viewApply.classList.remove('active');
        viewDashboard.classList.remove('active');
        activeView.classList.add('active');
    }

    btnApply.addEventListener('click', () => switchView(btnApply, viewApply));
    btnDashboard.addEventListener('click', () => switchView(btnDashboard, viewDashboard));

    // Alternative Data Toggle
    const altDataToggle = document.getElementById('alt-data-toggle');
    const traditionalCredit = document.getElementById('traditional-credit');
    const alternativeCredit = document.getElementById('alternative-credit');
    const creditInput = document.getElementById('credit');
    const rentInput = document.getElementById('rent-history');
    const utilInput = document.getElementById('utility-history');

    altDataToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            traditionalCredit.classList.add('hidden');
            alternativeCredit.classList.remove('hidden');
            creditInput.removeAttribute('required');
            rentInput.setAttribute('required', 'true');
            utilInput.setAttribute('required', 'true');
        } else {
            traditionalCredit.classList.remove('hidden');
            alternativeCredit.classList.add('hidden');
            creditInput.setAttribute('required', 'true');
            rentInput.removeAttribute('required');
            utilInput.removeAttribute('required');
        }
    });

    // Form logic
    const form = document.getElementById('loan-form');
    const resultPanel = document.getElementById('result-panel');
    const processing = document.getElementById('processing');
    const resultContent = document.getElementById('result-content');
    const btnNewApp = document.getElementById('btn-new-app');
    const btnAppeal = document.getElementById('btn-appeal');
    
    let xaiChartInstance = null;
    let currentAppId = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        form.classList.add('hidden');
        resultPanel.classList.remove('hidden');
        processing.classList.remove('hidden');
        resultContent.classList.add('hidden');

        const income = parseFloat(document.getElementById('income').value);
        const amount = parseFloat(document.getElementById('amount').value);
        const dti = parseFloat(document.getElementById('dti').value);
        
        let credit = 0;
        let isAltData = altDataToggle.checked;

        if (isAltData) {
            const rent = parseInt(rentInput.value);
            const util = parseInt(utilInput.value);
            // Derive a proxy credit score for demo purposes (e.g. 24 months = good)
            credit = 500 + (rent * 5) + (util * 3);
            if (credit > 850) credit = 850;
        } else {
            credit = parseInt(creditInput.value);
        }

        setTimeout(() => {
            processing.classList.add('hidden');
            resultContent.classList.remove('hidden');
            generateDecision(income, amount, credit, dti, isAltData);
        }, 2000);
    });

    btnNewApp.addEventListener('click', () => {
        form.reset();
        resultPanel.classList.add('hidden');
        form.classList.remove('hidden');
        
        // Reset alt data view
        altDataToggle.checked = false;
        altDataToggle.dispatchEvent(new Event('change'));
    });

    btnAppeal.addEventListener('click', () => {
        btnAppeal.textContent = "Appeal Submitted!";
        btnAppeal.style.background = "rgba(245, 158, 11, 0.2)";
        btnAppeal.style.color = "#fbbf24";
        btnAppeal.style.borderColor = "#fbbf24";
        btnAppeal.disabled = true;
        
        // Update history
        const entry = mockHistory.find(h => h.id === currentAppId);
        if(entry) {
            entry.status = 'Appealed';
            renderTable();
            updateDashboardStats();
        }
    });

    function generateDecision(income, amount, credit, dti, isAltData) {
        const decisionTitle = document.getElementById('decision-title');
        const xaiText = document.getElementById('xai-text');
        const xaiBars = document.getElementById('xai-bars');
        const fairnessScore = document.getElementById('fairness-score');

        let approved = false;
        let reasons = [];
        let chartData = [];
        
        if (credit >= 700 && dti <= 35) {
            approved = true;
            reasons.push({ label: isAltData ? 'Consistent Payment History' : 'Credit Score', impact: 85, type: 'positive' });
            reasons.push({ label: 'DTI Ratio', impact: 70, type: 'positive' });
            chartData = [85, 70, Math.min(100, (income/amount)*40), 90, 80]; // Mock metrics for chart
        } else if (credit < 600 || dti > 45) {
            approved = false;
            if (credit < 600) reasons.push({ label: isAltData ? 'Insufficient Payment History' : 'Low Credit Score', impact: 90, type: 'negative' });
            if (dti > 45) reasons.push({ label: 'High DTI Ratio', impact: 80, type: 'negative' });
            chartData = [30, 20, Math.min(100, (income/amount)*40), 40, 50];
        } else {
            if (income > amount * 1.5) {
                approved = true;
                reasons.push({ label: 'Income Capacity', impact: 65, type: 'positive' });
                reasons.push({ label: isAltData ? 'Payment History' : 'Credit Score', impact: 40, type: 'negative' });
                chartData = [50, 60, 85, 70, 65];
            } else {
                approved = false;
                reasons.push({ label: 'Debt/Income Capacity', impact: 75, type: 'negative' });
                chartData = [40, 30, 40, 50, 60];
            }
        }

        decisionTitle.textContent = approved ? 'Loan Approved' : 'Loan Rejected';
        decisionTitle.className = approved ? 'approved' : 'rejected';
        
        let explanation = `The AI model analyzed objective financial features. Demographic data were actively excluded. `;
        if(isAltData) {
            explanation += `Using alternative data, the model recognized your bill payment consistency instead of a traditional credit score. `;
        }
        explanation += `Primary drivers: ${reasons.map(r => r.label).join(', ')}.`;
        
        xaiText.textContent = explanation;
        
        const fairnessVal = (98 + Math.random() * 1.5).toFixed(1);
        fairnessScore.textContent = `${fairnessVal}%`;

        // Render Chart.js
        renderChart(chartData);

        // Show/Hide Appeal Button
        if(!approved) {
            btnAppeal.classList.remove('hidden');
            btnAppeal.textContent = "Request Human Review";
            btnAppeal.removeAttribute('style');
            btnAppeal.disabled = false;
        } else {
            btnAppeal.classList.add('hidden');
        }

        // Render XAI Bars
        xaiBars.innerHTML = reasons.map(r => `
            <div class="xai-item">
                <div class="xai-label">
                    <span>${r.label}</span>
                    <span style="color: ${r.type === 'positive' ? 'var(--success)' : 'var(--danger)'}">
                        ${r.type === 'positive' ? '+' : '-'}${r.impact}% Impact
                    </span>
                </div>
                <div class="xai-bar-bg">
                    <div class="xai-bar-fill ${r.type}" style="width: 0%"></div>
                </div>
            </div>
        `).join('');

        setTimeout(() => {
            const fills = xaiBars.querySelectorAll('.xai-bar-fill');
            fills.forEach((fill, idx) => {
                fill.style.width = `${reasons[idx].impact}%`;
            });
        }, 50);
        
        currentAppId = addDashboardEntry(approved, fairnessVal, reasons[0].label);
    }

    function renderChart(dataValues) {
        const ctx = document.getElementById('xai-chart').getContext('2d');
        if(xaiChartInstance) xaiChartInstance.destroy();
        
        xaiChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Payment Reliability', 'Debt-to-Income', 'Income Capacity', 'Repayment History', 'Credit Utilization'],
                datasets: [{
                    label: 'Application Profile',
                    data: dataValues,
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(139, 92, 246, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#94a3b8', font: { family: 'Inter' } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Dashboard Data
    const mockHistory = [
        { id: 'APP-9021', outcome: true, fairness: 99.1, factor: 'Credit Score', status: 'Auto' },
        { id: 'APP-9020', outcome: false, fairness: 98.7, factor: 'DTI Ratio', status: 'Auto' },
        { id: 'APP-9019', outcome: false, fairness: 97.5, factor: 'Income Capacity', status: 'Appealed' },
        { id: 'APP-9018', outcome: false, fairness: 98.2, factor: 'Low Credit Score', status: 'Appealed' }
    ];

    const tbody = document.getElementById('dashboard-table-body');
    const dashAppeals = document.getElementById('dash-appeals');
    
    function renderTable() {
        tbody.innerHTML = mockHistory.map(row => `
            <tr>
                <td><strong>${row.id}</strong></td>
                <td><span class="badge ${row.outcome ? 'approved' : 'rejected'}">${row.outcome ? 'Approved' : 'Rejected'}</span></td>
                <td>${row.fairness}%</td>
                <td>
                    <div class="factor-bar">
                        <span>${row.factor}</span>
                        <div class="bar"><div class="fill" style="width: ${Math.random() * 40 + 40}%"></div></div>
                    </div>
                </td>
                <td><span class="badge ${row.status === 'Appealed' ? 'appeal' : ''}">${row.status}</span></td>
            </tr>
        `).join('');
    }

    function updateDashboardStats() {
        const appeals = mockHistory.filter(h => h.status === 'Appealed').length;
        dashAppeals.textContent = appeals;
    }

    function addDashboardEntry(outcome, fairness, factor) {
        const newId = 'APP-' + (parseInt(mockHistory[0].id.split('-')[1]) + 1);
        mockHistory.unshift({ id: newId, outcome, fairness, factor, status: 'Auto' });
        if (mockHistory.length > 6) mockHistory.pop();
        renderTable();
        return newId;
    }

    renderTable();
    updateDashboardStats();
});
