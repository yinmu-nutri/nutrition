    /**
     * ===== 营养计算器 — 核心计算逻辑 =====
     *
     * 公式说明：
     *   BMI          = 体重(kg) / (身高(m))²
     *   BMR (男)     = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5
     *   BMR (女)     = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161
     *   TDEE         = BMR × 活动系数
     *   碳水供能比   = 45% ~ 65%
     *   蛋白质供能比 = 10% ~ 35%
     *   脂肪供能比   = 20% ~ 35%
     *   1g 碳水 = 4 kcal，1g 蛋白质 = 4 kcal，1g 脂肪 = 9 kcal
     */

    (function() {
        // ===== DOM 引用 =====
        const ageInput     = document.getElementById('age');
        const genderSelect = document.getElementById('gender');
        const heightInput  = document.getElementById('height');
        const weightInput  = document.getElementById('weight');
        const activitySelect = document.getElementById('activity');
        const calcBtn      = document.getElementById('calcBtn');
        const resultCard   = document.getElementById('resultCard');

        const bmiValueEl   = document.getElementById('bmiValue');
        const bmiEvalEl    = document.getElementById('bmiEval');
        const bmrValueEl   = document.getElementById('bmrValue');
        const tdeeValueEl  = document.getElementById('tdeeValue');
        const weightEvalEl = document.getElementById('weightEval');
        const weightEvalSubEl = document.getElementById('weightEvalSub');

        const carbsRangeEl   = document.getElementById('carbsRange');
        const proteinRangeEl = document.getElementById('proteinRange');
        const fatRangeEl     = document.getElementById('fatRange');
        const carbsRatioEl   = document.getElementById('carbsRatio');
        const proteinRatioEl = document.getElementById('proteinRatio');
        const fatRatioEl     = document.getElementById('fatRatio');
        const adviceBoxEl    = document.getElementById('adviceBox');

        const historyList   = document.getElementById('historyList');
        const historyEmpty  = document.getElementById('historyEmpty');
        const historyCount  = document.getElementById('historyCount');
        const clearAllBtn   = document.getElementById('clearAllBtn');

        // localStorage 键名
        const STORAGE_KEY = 'nutrition_calculator_history';

        // 活动水平中文标签
        const ACTIVITY_LABELS = {
            '1.2':   '几乎不动',
            '1.375': '轻度活动',
            '1.55':  '中度活动',
            '1.725': '非常活跃'
        };

        // ===== Chart.js 饼图 =====
        let macroChartInstance = null;

        /** 初始化或更新供能比饼图 */
        function updateMacroChart() {
            const ctx = document.getElementById('macroChart');
            if (!ctx) return;

            // 使用各营养素供能比范围的中点作为代表值，且三者之和为 100%
            // 碳水 45-65% → 取 50%，蛋白质 10-35% → 取 20%，脂肪 20-35% → 取 30%
            const data = [50, 20, 30];

            if (macroChartInstance) {
                macroChartInstance.data.datasets[0].data = data;
                macroChartInstance.update('none');
                return;
            }

            macroChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['碳水化合物', '蛋白质', '脂肪'],
                    datasets: [{
                        data: data,
                        backgroundColor: ['#fdcb6e', '#6c5ce7', '#e17055'],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '55%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    size: 13,
                                    family: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
                                },
                                color: '#2d3436'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label || '';
                                    var value = context.parsed || 0;
                                    return label + ': ' + value + '%';
                                }
                            },
                            backgroundColor: 'rgba(45,52,54,0.85)',
                            titleFont: {
                                size: 13,
                                family: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
                            },
                            bodyFont: {
                                size: 13,
                                family: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
                            },
                            padding: 10,
                            cornerRadius: 8
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 800
                    }
                }
            });
        }

        // ===== 核心计算 =====
        function calculate(age, gender, height, weight, activityFactor) {
            const heightM = height / 100;
            const bmi = weight / (heightM * heightM);

            let bmiEval, weightEval, weightEvalSub;
            if (bmi < 18.5) {
                bmiEval = '偏瘦';
                weightEval = '偏瘦';
                weightEvalSub = '建议适当增加营养摄入';
            } else if (bmi < 24) {
                bmiEval = '正常';
                weightEval = '正常';
                weightEvalSub = '继续保持良好的生活习惯';
            } else if (bmi < 28) {
                bmiEval = '超重';
                weightEval = '超重';
                weightEvalSub = '建议控制饮食并增加运动';
            } else {
                bmiEval = '肥胖';
                weightEval = '肥胖';
                weightEvalSub = '建议咨询专业人士制定减重计划';
            }

            let bmr;
            if (gender === 'male') {
                bmr = 10 * weight + 6.25 * height - 5 * age + 5;
            } else {
                bmr = 10 * weight + 6.25 * height - 5 * age - 161;
            }

            const tdee = bmr * activityFactor;

            const carbsRatioLow   = 0.45;
            const carbsRatioHigh  = 0.65;
            const proteinRatioLow = 0.10;
            const proteinRatioHigh= 0.35;
            const fatRatioLow     = 0.20;
            const fatRatioHigh    = 0.35;

            const carbsGramLow    = (tdee * carbsRatioLow)   / 4;
            const carbsGramHigh   = (tdee * carbsRatioHigh)  / 4;
            const proteinGramLow  = (tdee * proteinRatioLow) / 4;
            const proteinGramHigh = (tdee * proteinRatioHigh)/ 4;
            const fatGramLow      = (tdee * fatRatioLow)     / 9;
            const fatGramHigh     = (tdee * fatRatioHigh)    / 9;

            return {
                bmi: Math.round(bmi * 10) / 10,
                bmiEval,
                weightEval,
                weightEvalSub,
                bmr: Math.round(bmr),
                tdee: Math.round(tdee),
                carbsRange:   [Math.round(carbsGramLow),   Math.round(carbsGramHigh)],
                proteinRange: [Math.round(proteinGramLow), Math.round(proteinGramHigh)],
                fatRange:     [Math.round(fatGramLow),     Math.round(fatGramHigh)],
                carbsRatio:   [carbsRatioLow * 100,   carbsRatioHigh * 100],
                proteinRatio: [proteinRatioLow * 100, proteinRatioHigh * 100],
                fatRatio:     [fatRatioLow * 100,     fatRatioHigh * 100]
            };
        }

        function getAdvice(evalText) {
            switch (evalText) {
                case '偏瘦':
                    return '你的 BMI 偏低。建议增加优质蛋白质和健康脂肪摄入（如鸡蛋、鱼肉、坚果），'
                         + '并结合力量训练增加肌肉量。少食多餐有助于提升总热量摄入。';
                case '正常':
                    return '你的 BMI 在理想范围内！建议保持均衡饮食（碳水 45-65%、蛋白质 10-35%、脂肪 20-35%），'
                         + '每周进行 150 分钟以上中等强度有氧运动，同时配合力量训练维持肌肉量。';
                case '超重':
                    return '你的 BMI 偏高。建议适当控制总热量摄入（每日减少 300-500 千卡），'
                         + '增加蔬菜和膳食纤维比例，减少精制碳水和添加糖。每周运动 4-5 次，'
                         + '结合有氧与力量训练效果更佳。';
                case '肥胖':
                    return '你的 BMI 已达到肥胖范围，建议咨询医生或注册营养师制定个性化方案。'
                         + '逐步调整饮食结构，优先选择全谷物、瘦肉蛋白和大量蔬菜，'
                         + '每天坚持 30 分钟以上中等强度运动，从低强度开始循序渐进。';
                default:
                    return '';
            }
        }

        function formatRange(low, high) {
            return low + ' ~ ' + high;
        }

        function formatPercentRange(low, high) {
            return low + '% ~ ' + high + '%';
        }

        // ===== 历史记录管理 =====

        /** 读取 localStorage 中的历史记录 */
        function loadHistory() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                return [];
            }
        }

        /** 写入 localStorage */
        function saveHistory(records) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        }

        /** 获取评价对应的 CSS 类名 */
        function evalClass(evalText) {
            switch (evalText) {
                case '偏瘦': return 'underweight';
                case '正常': return 'normal';
                case '超重': return 'overweight';
                case '肥胖': return 'obese';
                default: return '';
            }
        }

        /** 渲染历史列表 */
        function renderHistory() {
            const records = loadHistory();

            // 更新计数
            historyCount.textContent = records.length;

            if (records.length === 0) {
                historyEmpty.style.display = 'block';
                historyList.innerHTML = '';
                return;
            }

            historyEmpty.style.display = 'none';

            // 倒序显示（最新的在前）
            const html = records.slice().reverse().map(function(rec, idx) {
                // idx 在 reversed 数组中的原始索引
                const realIndex = records.length - 1 - idx;
                // 格式化时间
                const timeStr = new Date(rec.timestamp).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const evalCls = evalClass(rec.bmiEval);

                return '<li class="history-item" data-index="' + realIndex + '">'
                    + '<div class="history-item-main">'
                        + '<div class="history-item-top">'
                            + '<span class="history-item-time">' + timeStr + '</span>'
                            + '<span class="history-item-bmi">BMI ' + rec.bmi + '</span>'
                            + '<span class="history-item-eval ' + evalCls + '">' + rec.bmiEval + '</span>'
                        + '</div>'
                        + '<div class="history-item-detail">'
                            + rec.genderLabel + ' · ' + rec.age + '岁 · ' + rec.height + 'cm · ' + rec.weight + 'kg · ' + rec.activityLabel
                        + '</div>'
                    + '</div>'
                    + '<button class="btn-delete-item" data-index="' + realIndex + '" title="删除">✕</button>'
                + '</li>';
            }).join('');

            historyList.innerHTML = html;
        }

        /** 添加一条新记录到历史 */
        function addHistoryRecord(inputs, result) {
            const records = loadHistory();

            // 最多保留 50 条，超出则删除最旧的
            if (records.length >= 50) {
                records.splice(0, records.length - 49);
            }

            records.push({
                timestamp: Date.now(),
                age: inputs.age,
                gender: inputs.gender,
                genderLabel: inputs.gender === 'male' ? '男' : '女',
                height: inputs.height,
                weight: inputs.weight,
                activityLabel: inputs.activityLabel,
                bmi: result.bmi,
                bmiEval: result.bmiEval,
                bmr: result.bmr,
                tdee: result.tdee
            });

            saveHistory(records);
            renderHistory();
            renderTrendChart();
        }

        /** 删除单条记录 */
        function deleteRecord(index) {
            const records = loadHistory();
            if (index >= 0 && index < records.length) {
                records.splice(index, 1);
                saveHistory(records);
                renderHistory();
                renderTrendChart();
            }
        }

        /** 清空所有记录 */
        function clearAllRecords() {
            if (loadHistory().length === 0) return;
            saveHistory([]);
            renderHistory();
            renderTrendChart();
        }

        // ===== BMI 趋势图 =====

            /** 渲染 BMI 趋势折线图 */
            function renderTrendChart() {
                var records = loadHistory();
                var canvas = document.getElementById('trendChart');
                var empty = document.getElementById('trendEmpty');
                var countEl = document.getElementById('trendCount');
                if (!canvas) return;

                countEl.textContent = records.length + ' 条记录';

                if (records.length < 2) {
                    canvas.style.display = 'none';
                    empty.style.display = 'block';
                    return;
                }

                canvas.style.display = 'block';
                empty.style.display = 'none';

                // 按时间正序排列
                var sorted = records.slice().sort(function(a, b) { return a.timestamp - b.timestamp; });

                var labels = sorted.map(function(r) {
                    return new Date(r.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                });
                var data = sorted.map(function(r) { return r.bmi; });

                // 找出 Y 轴范围
                var minBMI = Math.min.apply(null, data);
                var maxBMI = Math.max.apply(null, data);
                var yMin = Math.max(10, Math.floor(minBMI - 2));
                var yMax = Math.min(40, Math.ceil(maxBMI + 2));

                var ctx = canvas.getContext('2d');

                // 如果已有实例则销毁
                if (window._trendChartInstance) {
                    window._trendChartInstance.destroy();
                }

                window._trendChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'BMI',
                            data: data,
                            borderColor: '#6c5ce7',
                            backgroundColor: 'rgba(108, 92, 231, 0.08)',
                            borderWidth: 2.5,
                            pointBackgroundColor: '#6c5ce7',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: true,
                            tension: 0.3,
                            spanGaps: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(45,52,54,0.85)',
                                padding: 10,
                                cornerRadius: 8,
                                callbacks: {
                                    label: function(ctx) {
                                        return 'BMI: ' + ctx.parsed.y;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                min: yMin,
                                max: yMax,
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                ticks: {
                                    stepSize: 2,
                                    font: { size: 11, family: '-apple-system, sans-serif' },
                                    color: '#636e72'
                                }
                            },
                            x: {
                                grid: { display: false },
                                ticks: {
                                    maxTicksLimit: 10,
                                    font: { size: 11, family: '-apple-system, sans-serif' },
                                    color: '#636e72'
                                }
                            }
                        },
                        // 绘制健康区间背景
                        layout: { padding: { top: 4 } }
                    },
                    plugins: [{
                        id: 'bmiZones',
                        beforeDraw: function(chart) {
                            var ctx = chart.ctx;
                            var chartArea = chart.chartArea;
                            var yScale = chart.scales.y;

                            if (!chartArea) return;

                            var zones = [
                                { min: 0, max: 18.5, color: 'rgba(253, 203, 110, 0.12)', label: '偏瘦' },
                                { min: 18.5, max: 24, color: 'rgba(0, 184, 148, 0.08)', label: '正常' },
                                { min: 24, max: 28, color: 'rgba(225, 112, 85, 0.10)', label: '超重' },
                                { min: 28, max: 45, color: 'rgba(214, 48, 49, 0.10)', label: '肥胖' }
                            ];

                            zones.forEach(function(zone) {
                                var yTop = yScale.getPixelForValue(zone.max);
                                var yBottom = yScale.getPixelForValue(zone.min);
                                var height = yBottom - yTop;

                                ctx.fillStyle = zone.color;
                                ctx.fillRect(chartArea.left, yTop, chartArea.right - chartArea.left, height);

                                // 在右侧标文字
                                ctx.fillStyle = 'rgba(99, 110, 114, 0.4)';
                                ctx.font = '10px -apple-system, sans-serif';
                                ctx.textAlign = 'right';
                                ctx.fillText(zone.label, chartArea.right - 4, yTop + 12);
                            });
                        }
                    }]
                });
            }

        function runCalculation() {
            const age = parseFloat(ageInput.value);
            const gender = genderSelect.value;
            const height = parseFloat(heightInput.value);
            const weight = parseFloat(weightInput.value);
            const activityFactor = parseFloat(activitySelect.value);

            if (!age || age < 1 || age > 120) {
                alert('请输入有效的年龄（1-120 岁）');
                return;
            }
            if (!height || height < 50 || height > 250) {
                alert('请输入有效的身高（50-250 cm）');
                return;
            }
            if (!weight || weight < 10 || weight > 300) {
                alert('请输入有效的体重（10-300 kg）');
                return;
            }

            const result = calculate(age, gender, height, weight, activityFactor);

            // 更新指标
            bmiValueEl.textContent = result.bmi;

            const evalColorMap = {
                '偏瘦': 'evaluation-underweight',
                '正常': 'evaluation-normal',
                '超重': 'evaluation-overweight',
                '肥胖': 'evaluation-obese'
            };
            const colorClass = evalColorMap[result.bmiEval] || '';
            bmiEvalEl.textContent = result.bmiEval;
            bmiEvalEl.className = 'sub ' + colorClass;

            bmrValueEl.textContent = result.bmr;
            tdeeValueEl.textContent = result.tdee;

            weightEvalEl.textContent = result.weightEval;
            weightEvalEl.className = 'value ' + colorClass;
            weightEvalSubEl.textContent = result.weightEvalSub;

            carbsRangeEl.textContent   = formatRange(result.carbsRange[0],   result.carbsRange[1])   + ' g';
            proteinRangeEl.textContent = formatRange(result.proteinRange[0], result.proteinRange[1]) + ' g';
            fatRangeEl.textContent     = formatRange(result.fatRange[0],     result.fatRange[1])     + ' g';

            carbsRatioEl.textContent   = formatPercentRange(result.carbsRatio[0],   result.carbsRatio[1]);
            proteinRatioEl.textContent = formatPercentRange(result.proteinRatio[0], result.proteinRatio[1]);
            fatRatioEl.textContent     = formatPercentRange(result.fatRatio[0],     result.fatRatio[1]);

            adviceBoxEl.innerHTML = getAdvice(result.bmiEval);

            // 显示结果卡片
            resultCard.classList.remove('visible');
            void resultCard.offsetWidth;
            resultCard.classList.add('visible');

            resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // === 保存到历史记录 ===
            addHistoryRecord({
                age: age,
                gender: gender,
                height: height,
                weight: weight,
                activityLabel: ACTIVITY_LABELS[activityFactor] || '未知'
            }, result);

            // === 更新供能比饼图 ===
            updateMacroChart();

            // === 保存到全局用户画像（供餐盘生成器联动） ===
            window.userProfile = {
                tdee: result.tdee,
                bmi: result.bmi,
                bmiEval: result.bmiEval,
                bmr: result.bmr,
                carbsRange: result.carbsRange,
                proteinRange: result.proteinRange,
                fatRange: result.fatRange,
                weight: weight,
                height: height,
                age: age,
                gender: gender
            };

            }

        calcBtn.addEventListener('click', runCalculation);

        const inputs = [ageInput, heightInput, weightInput];
        inputs.forEach(function(input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    calcBtn.click();
                }
            });
        });

        // 历史列表事件委托：删除按钮 & 点击条目回填
        historyList.addEventListener('click', function(e) {
            // 删除按钮
            if (e.target.classList.contains('btn-delete-item')) {
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                deleteRecord(index);
                return;
            }

            // 点击条目回填到输入框
            const item = e.target.closest('.history-item');
            if (item) {
                const index = parseInt(item.getAttribute('data-index'), 10);
                const records = loadHistory();
                const rec = records[index];
                if (rec) {
                    ageInput.value = rec.age;
                    genderSelect.value = rec.gender;
                    heightInput.value = rec.height;
                    weightInput.value = rec.weight;
                    // 滚动到顶部并自动计算
                    document.querySelector('.app-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(runCalculation, 350);
                }
            }
        });

        // 清空全部
        clearAllBtn.addEventListener('click', function() {
            if (loadHistory().length === 0) return;
            if (confirm('确定要清空所有历史记录吗？')) {
                clearAllRecords();
            }
        });

// ===== 一键导出营养报告 =====

        function generateReport() {
            // 获取当前计算结果
            var bmi = document.getElementById('bmiValue').textContent;
            var bmiEval = document.getElementById('bmiEval').textContent;
            var bmr = document.getElementById('bmrValue').textContent;
            var tdee = document.getElementById('tdeeValue').textContent;
            var weightEval = document.getElementById('weightEval').textContent;
            var age = document.getElementById('age').value;
            var gender = document.getElementById('gender').value === 'male' ? '男' : '女';
            var height = document.getElementById('height').value;
            var weight = document.getElementById('weight').value;
            var activityText = document.getElementById('activity').options[document.getElementById('activity').selectedIndex].text;

            var carbsRange = document.getElementById('carbsRange').textContent;
            var proteinRange = document.getElementById('proteinRange').textContent;
            var fatRange = document.getElementById('fatRange').textContent;

            var advice = document.getElementById('adviceBox').textContent;

            var report = '═══════════════════════════════════════\n';
            report += '        营养健康报告\n';
            report += '═══════════════════════════════════════\n\n';
            report += '📋 基本信息\n';
            report += '  性别：' + gender + ' | 年龄：' + age + '岁\n';
            report += '  身高：' + height + 'cm | 体重：' + weight + 'kg\n';
            report += '  活动水平：' + activityText + '\n\n';
            report += '📊 身体指标\n';
            report += '  BMI：' + bmi + '（' + bmiEval + '）\n';
            report += '  体重评价：' + weightEval + '\n';
            report += '  基础代谢率 BMR：' + bmr + ' kcal/天\n';
            report += '  每日总能耗 TDEE：' + tdee + ' kcal/天\n\n';
            report += '🥗 每日营养素建议\n';
            report += '  碳水化合物：' + carbsRange + '\n';
            report += '  蛋白质：' + proteinRange + '\n';
            report += '  脂肪：' + fatRange + '\n\n';
            report += '💡 健康建议\n';
            report += '  ' + advice + '\n\n';

            // 如果有餐盘数据，追加餐盘方案
            var plateResult = document.getElementById('plateResult');
            if (plateResult && plateResult.classList.contains('visible')) {
                report += '═══════════════════════════════════════\n';
                report += '        餐盘搭配方案\n';
                report += '═══════════════════════════════════════\n\n';
                var meals = ['早餐', '午餐', '晚餐'];
                meals.forEach(function(name) {
                    var summaryEl = document.getElementById(name + 'Summary');
                    var bodyEl = document.getElementById(name + 'Body');
                    if (summaryEl && bodyEl) {
                        report += '  🌅 ' + name + '\n';
                        report += '    ' + summaryEl.textContent + '\n';
                        var items = bodyEl.querySelectorAll('.meal-food-item');
                        items.forEach(function(item) {
                            var nameEl = item.querySelector('.food-name');
                            var nutritionEl = item.querySelector('.food-nutrition');
                            if (nameEl) {
                                report += '    · ' + nameEl.textContent;
                                if (nutritionEl) report += ' ' + nutritionEl.textContent;
                                report += '\n';
                            }
                        });
                        report += '\n';
                    }
                });
            }

            report += '═══════════════════════════════════════\n';
            report += '由 营养计算器 生成\n';
            report += new Date().toLocaleString('zh-CN') + '\n';

            return report;
        }

        document.getElementById('exportBtn').addEventListener('click', function() {
            // 先检查是否有计算结果
            var bmiVal = document.getElementById('bmiValue').textContent;
            if (bmiVal === '—') {
                alert('请先计算营养指标再导出报告');
                return;
            }

            var report = generateReport();

            // 复制到剪贴板
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(report).then(function() {
                    var btn = document.getElementById('exportBtn');
                    btn.textContent = '✅ 已复制到剪贴板！';
                    btn.classList.add('copied');
                    setTimeout(function() {
                        btn.textContent = '📋 一键导出营养报告';
                        btn.classList.remove('copied');
                    }, 2500);
                }).catch(function() {
                    fallbackCopy(report);
                });
            } else {
                fallbackCopy(report);
            }
        });

        function fallbackCopy(text) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                var btn = document.getElementById('exportBtn');
                btn.textContent = '✅ 已复制到剪贴板！';
                btn.classList.add('copied');
                setTimeout(function() {
                    btn.textContent = '📋 一键导出营养报告';
                    btn.classList.remove('copied');
                }, 2500);
            } catch (e) {
                alert('复制失败，请手动复制');
            }
            document.body.removeChild(ta);
        }

// ===== 食物热量速查表 =====

        /** 食物数据库 — 参考《中国食物成分表》 */
        var FOOD_DATA = [
            // ==================== 主食类 (30种) ====================
            { name: '米饭',   cat: '主食', catCls: 'staple', kcal: 116, carbs: 25.6, protein: 2.6, fat: 0.3 },
            { name: '馒头',   cat: '主食', catCls: 'staple', kcal: 223, carbs: 44.2, protein: 7.0, fat: 1.1 },
            { name: '面条(煮)', cat: '主食', catCls: 'staple', kcal: 110, carbs: 24.3, protein: 3.4, fat: 0.2 },
            { name: '全麦面包', cat: '主食', catCls: 'staple', kcal: 246, carbs: 41.3, protein: 8.5, fat: 3.4 },
            { name: '红薯',   cat: '主食', catCls: 'staple', kcal: 86,  carbs: 20.1, protein: 1.6, fat: 0.1 },
            { name: '玉米(鲜)', cat: '主食', catCls: 'staple', kcal: 112, carbs: 22.8, protein: 4.0, fat: 1.2 },
            { name: '燕麦片',  cat: '主食', catCls: 'staple', kcal: 367, carbs: 66.3, protein: 13.5, fat: 6.7 },
            { name: '小米粥',  cat: '主食', catCls: 'staple', kcal: 46,  carbs: 8.4,  protein: 1.4, fat: 0.7 },
            { name: '糙米',   cat: '主食', catCls: 'staple', kcal: 348, carbs: 75.0, protein: 7.5, fat: 2.2 },
            { name: '土豆',   cat: '主食', catCls: 'staple', kcal: 81,  carbs: 17.8, protein: 2.0, fat: 0.2 },
            { name: '山药',   cat: '主食', catCls: 'staple', kcal: 57,  carbs: 12.4, protein: 1.9, fat: 0.2 },
            { name: '紫薯',   cat: '主食', catCls: 'staple', kcal: 106, carbs: 24.7, protein: 1.9, fat: 0.1 },
            { name: '油条',   cat: '主食', catCls: 'staple', kcal: 386, carbs: 51.0, protein: 6.9, fat: 17.6 },
            { name: '荞麦面',  cat: '主食', catCls: 'staple', kcal: 340, carbs: 70.6, protein: 11.3, fat: 2.5 },
            { name: '杂粮馒头', cat: '主食', catCls: 'staple', kcal: 215, carbs: 42.0, protein: 6.8, fat: 2.0 },
            { name: '南瓜粥',  cat: '主食', catCls: 'staple', kcal: 38,  carbs: 7.5,  protein: 1.1, fat: 0.4 },
            { name: '黑米',   cat: '主食', catCls: 'staple', kcal: 333, carbs: 72.2, protein: 9.4, fat: 2.5 },
            { name: '薏米',   cat: '主食', catCls: 'staple', kcal: 357, carbs: 71.1, protein: 12.8, fat: 3.3 },
            { name: '藜麦',   cat: '主食', catCls: 'staple', kcal: 368, carbs: 64.2, protein: 14.1, fat: 6.1 },
            { name: '糯米',   cat: '主食', catCls: 'staple', kcal: 348, carbs: 77.5, protein: 7.3, fat: 1.0 },
            { name: '荞麦',   cat: '主食', catCls: 'staple', kcal: 324, carbs: 66.5, protein: 9.3, fat: 2.3 },
            { name: '大麦',   cat: '主食', catCls: 'staple', kcal: 327, carbs: 73.5, protein: 10.6, fat: 1.7 },
            { name: '小米',   cat: '主食', catCls: 'staple', kcal: 358, carbs: 73.5, protein: 9.0, fat: 3.1 },
            { name: '通心粉',  cat: '主食', catCls: 'staple', kcal: 350, carbs: 75.8, protein: 11.0, fat: 0.5 },
            { name: '方便面',  cat: '主食', catCls: 'staple', kcal: 472, carbs: 61.9, protein: 9.5, fat: 21.1 },
            { name: '烧饼',   cat: '主食', catCls: 'staple', kcal: 326, carbs: 61.6, protein: 8.2, fat: 4.2 },
            { name: '花卷',   cat: '主食', catCls: 'staple', kcal: 211, carbs: 42.4, protein: 6.4, fat: 1.8 },
            { name: '粉丝',   cat: '主食', catCls: 'staple', kcal: 335, carbs: 83.7, protein: 0.8, fat: 0.2 },
            { name: '年糕',   cat: '主食', catCls: 'staple', kcal: 154, carbs: 34.7, protein: 3.3, fat: 0.6 },
            { name: '粽子',   cat: '主食', catCls: 'staple', kcal: 195, carbs: 37.0, protein: 4.5, fat: 3.5 },
            // ==================== 肉类 / 蛋白质 (35种) ====================
            { name: '鸡胸肉',  cat: '肉类', catCls: 'meat', kcal: 133, carbs: 0,    protein: 31.0, fat: 1.2 },
            { name: '鸡腿肉',  cat: '肉类', catCls: 'meat', kcal: 181, carbs: 0,    protein: 20.0, fat: 11.0 },
            { name: '鸡翅',   cat: '肉类', catCls: 'meat', kcal: 194, carbs: 0,    protein: 17.4, fat: 13.6 },
            { name: '猪瘦肉',  cat: '肉类', catCls: 'meat', kcal: 143, carbs: 1.5,  protein: 20.3, fat: 6.2 },
            { name: '猪五花肉', cat: '肉类', catCls: 'meat', kcal: 395, carbs: 0,    protein: 14.0, fat: 37.5 },
            { name: '猪肝',   cat: '肉类', catCls: 'meat', kcal: 129, carbs: 2.6,  protein: 19.3, fat: 4.5 },
            { name: '牛肉(瘦)', cat: '肉类', catCls: 'meat', kcal: 125, carbs: 0,    protein: 22.3, fat: 4.2 },
            { name: '牛腩',   cat: '肉类', catCls: 'meat', kcal: 203, carbs: 0,    protein: 19.0, fat: 14.0 },
            { name: '羊肉',   cat: '肉类', catCls: 'meat', kcal: 203, carbs: 0,    protein: 19.0, fat: 14.1 },
            { name: '鸡蛋',   cat: '肉类', catCls: 'meat', kcal: 144, carbs: 1.5,  protein: 13.3, fat: 8.8 },
            { name: '鸭蛋',   cat: '肉类', catCls: 'meat', kcal: 180, carbs: 3.1,  protein: 12.6, fat: 13.0 },
            { name: '草鱼',   cat: '肉类', catCls: 'meat', kcal: 113, carbs: 0,    protein: 16.6, fat: 5.2 },
            { name: '鲤鱼',   cat: '肉类', catCls: 'meat', kcal: 109, carbs: 0.5,  protein: 17.6, fat: 4.1 },
            { name: '虾仁',   cat: '肉类', catCls: 'meat', kcal: 48,  carbs: 0,    protein: 10.4, fat: 0.2 },
            { name: '基围虾',  cat: '肉类', catCls: 'meat', kcal: 87,  carbs: 0,    protein: 18.2, fat: 1.4 },
            { name: '三文鱼',  cat: '肉类', catCls: 'meat', kcal: 139, carbs: 0,    protein: 21.3, fat: 6.3 },
            { name: '金枪鱼',  cat: '肉类', catCls: 'meat', kcal: 130, carbs: 0,    protein: 26.0, fat: 2.5 },
            { name: '鸭肉',   cat: '肉类', catCls: 'meat', kcal: 240, carbs: 0,    protein: 15.5, fat: 19.7 },
            { name: '鹅肉',   cat: '肉类', catCls: 'meat', kcal: 251, carbs: 0,    protein: 17.9, fat: 19.9 },
            { name: '羊瘦肉',  cat: '肉类', catCls: 'meat', kcal: 118, carbs: 0,    protein: 20.5, fat: 3.9 },
            { name: '牛腱子',  cat: '肉类', catCls: 'meat', kcal: 106, carbs: 0,    protein: 21.0, fat: 2.0 },
            { name: '猪蹄',   cat: '肉类', catCls: 'meat', kcal: 260, carbs: 0,    protein: 22.6, fat: 18.8 },
            { name: '鸡胗',   cat: '肉类', catCls: 'meat', kcal: 118, carbs: 1.3,  protein: 19.2, fat: 3.8 },
            { name: '鹌鹑蛋',  cat: '肉类', catCls: 'meat', kcal: 160, carbs: 0.4,  protein: 12.8, fat: 11.1 },
            { name: '带鱼',   cat: '肉类', catCls: 'meat', kcal: 127, carbs: 0,    protein: 17.7, fat: 4.9 },
            { name: '鲫鱼',   cat: '肉类', catCls: 'meat', kcal: 108, carbs: 0,    protein: 17.1, fat: 4.0 },
            { name: '鲈鱼',   cat: '肉类', catCls: 'meat', kcal: 105, carbs: 0,    protein: 18.6, fat: 3.4 },
            { name: '鳕鱼',   cat: '肉类', catCls: 'meat', kcal: 88,  carbs: 0,    protein: 20.4, fat: 0.5 },
            { name: '黄花鱼',  cat: '肉类', catCls: 'meat', kcal: 97,  carbs: 0,    protein: 17.7, fat: 2.5 },
            { name: '蛤蜊',   cat: '肉类', catCls: 'meat', kcal: 62,  carbs: 2.8,  protein: 10.0, fat: 0.8 },
            { name: '牡蛎',   cat: '肉类', catCls: 'meat', kcal: 73,  carbs: 5.0,  protein: 5.7,  fat: 2.7 },
            { name: '扇贝',   cat: '肉类', catCls: 'meat', kcal: 77,  carbs: 2.6,  protein: 14.2, fat: 0.8 },
            { name: '螃蟹',   cat: '肉类', catCls: 'meat', kcal: 95,  carbs: 2.3,  protein: 13.8, fat: 3.6 },
            { name: '腊肉',   cat: '肉类', catCls: 'meat', kcal: 498, carbs: 2.9,  protein: 13.0, fat: 48.9 },
            { name: '猪排骨',  cat: '肉类', catCls: 'meat', kcal: 264, carbs: 0,    protein: 18.3, fat: 20.4 },
            // ==================== 蔬菜类 (30种) ====================
            { name: '西兰花',  cat: '蔬菜', catCls: 'veg', kcal: 34,  carbs: 6.6,  protein: 2.8, fat: 0.4 },
            { name: '菠菜',   cat: '蔬菜', catCls: 'veg', kcal: 24,  carbs: 4.5,  protein: 2.6, fat: 0.3 },
            { name: '西红柿',  cat: '蔬菜', catCls: 'veg', kcal: 19,  carbs: 4.0,  protein: 0.9, fat: 0.2 },
            { name: '黄瓜',   cat: '蔬菜', catCls: 'veg', kcal: 15,  carbs: 2.9,  protein: 0.8, fat: 0.2 },
            { name: '胡萝卜',  cat: '蔬菜', catCls: 'veg', kcal: 37,  carbs: 8.8,  protein: 1.0, fat: 0.2 },
            { name: '大白菜',  cat: '蔬菜', catCls: 'veg', kcal: 13,  carbs: 2.2,  protein: 1.5, fat: 0.1 },
            { name: '生菜',   cat: '蔬菜', catCls: 'veg', kcal: 15,  carbs: 2.8,  protein: 1.3, fat: 0.2 },
            { name: '芹菜',   cat: '蔬菜', catCls: 'veg', kcal: 16,  carbs: 3.5,  protein: 0.7, fat: 0.1 },
            { name: '茄子',   cat: '蔬菜', catCls: 'veg', kcal: 21,  carbs: 4.3,  protein: 1.1, fat: 0.2 },
            { name: '青椒',   cat: '蔬菜', catCls: 'veg', kcal: 22,  carbs: 4.6,  protein: 1.0, fat: 0.2 },
            { name: '南瓜',   cat: '蔬菜', catCls: 'veg', kcal: 22,  carbs: 5.3,  protein: 0.7, fat: 0.1 },
            { name: '冬瓜',   cat: '蔬菜', catCls: 'veg', kcal: 11,  carbs: 2.6,  protein: 0.4, fat: 0.1 },
            { name: '豆角',   cat: '蔬菜', catCls: 'veg', kcal: 31,  carbs: 5.7,  protein: 2.2, fat: 0.3 },
            { name: '蘑菇',   cat: '蔬菜', catCls: 'veg', kcal: 20,  carbs: 4.1,  protein: 2.7, fat: 0.1 },
            { name: '香菇',   cat: '蔬菜', catCls: 'veg', kcal: 26,  carbs: 5.2,  protein: 2.2, fat: 0.3 },
            { name: '海带',   cat: '蔬菜', catCls: 'veg', kcal: 12,  carbs: 2.0,  protein: 1.2, fat: 0.1 },
            { name: '油麦菜',  cat: '蔬菜', catCls: 'veg', kcal: 15,  carbs: 2.1,  protein: 1.5, fat: 0.2 },
            { name: '芦笋',   cat: '蔬菜', catCls: 'veg', kcal: 19,  carbs: 3.9,  protein: 2.2, fat: 0.1 },
            { name: '绿豆芽',  cat: '蔬菜', catCls: 'veg', kcal: 18,  carbs: 3.6,  protein: 2.1, fat: 0.1 },
            { name: '菜花',   cat: '蔬菜', catCls: 'veg', kcal: 24,  carbs: 4.6,  protein: 2.1, fat: 0.3 },
            { name: '空心菜',  cat: '蔬菜', catCls: 'veg', kcal: 20,  carbs: 3.6,  protein: 2.2, fat: 0.2 },
            { name: '茼蒿',   cat: '蔬菜', catCls: 'veg', kcal: 21,  carbs: 3.9,  protein: 1.9, fat: 0.3 },
            { name: '韭菜',   cat: '蔬菜', catCls: 'veg', kcal: 26,  carbs: 4.6,  protein: 2.4, fat: 0.4 },
            { name: '蒜苗',   cat: '蔬菜', catCls: 'veg', kcal: 37,  carbs: 8.0,  protein: 2.1, fat: 0.4 },
            { name: '洋葱',   cat: '蔬菜', catCls: 'veg', kcal: 39,  carbs: 9.0,  protein: 1.1, fat: 0.1 },
            { name: '莲藕',   cat: '蔬菜', catCls: 'veg', kcal: 73,  carbs: 16.4, protein: 2.6, fat: 0.2 },
            { name: '竹笋',   cat: '蔬菜', catCls: 'veg', kcal: 19,  carbs: 3.6,  protein: 2.6, fat: 0.2 },
            { name: '苦瓜',   cat: '蔬菜', catCls: 'veg', kcal: 19,  carbs: 4.3,  protein: 1.0, fat: 0.1 },
            { name: '丝瓜',   cat: '蔬菜', catCls: 'veg', kcal: 20,  carbs: 4.3,  protein: 1.0, fat: 0.1 },
            { name: '秋葵',   cat: '蔬菜', catCls: 'veg', kcal: 31,  carbs: 7.0,  protein: 2.0, fat: 0.1 },
            // ==================== 水果类 (25种) ====================
            { name: '苹果',   cat: '水果', catCls: 'fruit', kcal: 52,  carbs: 13.5, protein: 0.2, fat: 0.2 },
            { name: '香蕉',   cat: '水果', catCls: 'fruit', kcal: 89,  carbs: 22.8, protein: 1.1, fat: 0.3 },
            { name: '橙子',   cat: '水果', catCls: 'fruit', kcal: 47,  carbs: 11.8, protein: 0.9, fat: 0.1 },
            { name: '葡萄',   cat: '水果', catCls: 'fruit', kcal: 69,  carbs: 18.1, protein: 0.7, fat: 0.2 },
            { name: '西瓜',   cat: '水果', catCls: 'fruit', kcal: 30,  carbs: 7.6,  protein: 0.6, fat: 0.2 },
            { name: '草莓',   cat: '水果', catCls: 'fruit', kcal: 32,  carbs: 7.7,  protein: 0.7, fat: 0.3 },
            { name: '蓝莓',   cat: '水果', catCls: 'fruit', kcal: 57,  carbs: 14.5, protein: 0.7, fat: 0.3 },
            { name: '猕猴桃',  cat: '水果', catCls: 'fruit', kcal: 61,  carbs: 14.7, protein: 1.1, fat: 0.5 },
            { name: '芒果',   cat: '水果', catCls: 'fruit', kcal: 60,  carbs: 15.0, protein: 0.8, fat: 0.4 },
            { name: '火龙果',  cat: '水果', catCls: 'fruit', kcal: 55,  carbs: 13.0, protein: 1.1, fat: 0.4 },
            { name: '柚子',   cat: '水果', catCls: 'fruit', kcal: 42,  carbs: 9.6,  protein: 0.8, fat: 0.2 },
            { name: '柠檬',   cat: '水果', catCls: 'fruit', kcal: 29,  carbs: 9.3,  protein: 1.1, fat: 0.3 },
            { name: '梨',    cat: '水果', catCls: 'fruit', kcal: 51,  carbs: 13.1, protein: 0.4, fat: 0.2 },
            { name: '樱桃',   cat: '水果', catCls: 'fruit', kcal: 46,  carbs: 10.6, protein: 1.1, fat: 0.2 },
            { name: '菠萝',   cat: '水果', catCls: 'fruit', kcal: 41,  carbs: 10.8, protein: 0.5, fat: 0.1 },
            { name: '木瓜',   cat: '水果', catCls: 'fruit', kcal: 39,  carbs: 9.2,  protein: 0.6, fat: 0.1 },
            { name: '哈密瓜',  cat: '水果', catCls: 'fruit', kcal: 34,  carbs: 8.2,  protein: 0.5, fat: 0.1 },
            { name: '荔枝',   cat: '水果', catCls: 'fruit', kcal: 66,  carbs: 16.6, protein: 0.9, fat: 0.4 },
            { name: '龙眼',   cat: '水果', catCls: 'fruit', kcal: 71,  carbs: 16.6, protein: 1.2, fat: 0.2 },
            { name: '石榴',   cat: '水果', catCls: 'fruit', kcal: 63,  carbs: 14.5, protein: 1.0, fat: 0.3 },
            { name: '百香果',  cat: '水果', catCls: 'fruit', kcal: 97,  carbs: 23.4, protein: 2.2, fat: 0.7 },
            { name: '桃子',   cat: '水果', catCls: 'fruit', kcal: 42,  carbs: 10.1, protein: 0.9, fat: 0.2 },
            { name: '杏',    cat: '水果', catCls: 'fruit', kcal: 38,  carbs: 9.1,  protein: 0.9, fat: 0.1 },
            { name: '李子',   cat: '水果', catCls: 'fruit', kcal: 36,  carbs: 8.7,  protein: 0.7, fat: 0.2 },
            { name: '椰子肉',  cat: '水果', catCls: 'fruit', kcal: 354, carbs: 31.3, protein: 3.3, fat: 33.5 },
            // ==================== 零食饮品类 (30种) ====================
            { name: '牛奶(全脂)', cat: '饮品', catCls: 'snack', kcal: 65,  carbs: 4.9,  protein: 3.2, fat: 3.6 },
            { name: '酸奶(原味)', cat: '饮品', catCls: 'snack', kcal: 72,  carbs: 9.5,  protein: 3.0, fat: 2.5 },
            { name: '豆浆',   cat: '饮品', catCls: 'snack', kcal: 31,  carbs: 2.9,  protein: 2.9, fat: 1.0 },
            { name: '可乐',   cat: '饮品', catCls: 'snack', kcal: 42,  carbs: 10.6, protein: 0,   fat: 0 },
            { name: '薯片',   cat: '零食', catCls: 'snack', kcal: 536, carbs: 53.0, protein: 5.0, fat: 34.0 },
            { name: '巧克力',  cat: '零食', catCls: 'snack', kcal: 546, carbs: 59.4, protein: 4.9, fat: 31.3 },
            { name: '蛋糕',   cat: '零食', catCls: 'snack', kcal: 347, carbs: 56.5, protein: 5.3, fat: 11.1 },
            { name: '冰淇淋',  cat: '零食', catCls: 'snack', kcal: 207, carbs: 24.0, protein: 3.5, fat: 11.0 },
            { name: '饼干',   cat: '零食', catCls: 'snack', kcal: 433, carbs: 71.7, protein: 8.1, fat: 12.8 },
            { name: '核桃',   cat: '零食', catCls: 'snack', kcal: 627, carbs: 13.7, protein: 14.9, fat: 58.8 },
            { name: '杏仁',   cat: '零食', catCls: 'snack', kcal: 578, carbs: 19.7, protein: 21.2, fat: 49.9 },
            { name: '花生(炒)', cat: '零食', catCls: 'snack', kcal: 563, carbs: 21.7, protein: 24.8, fat: 44.3 },
            { name: '豆腐',   cat: '饮品', catCls: 'snack', kcal: 81,  carbs: 4.2,  protein: 8.1, fat: 3.7 },
            { name: '全麦苏打饼干', cat: '零食', catCls: 'snack', kcal: 410, carbs: 70.0, protein: 9.0, fat: 10.0 },
            { name: '黑咖啡',  cat: '饮品', catCls: 'snack', kcal: 2,   carbs: 0,    protein: 0.2, fat: 0 },
            { name: '绿茶',   cat: '饮品', catCls: 'snack', kcal: 1,   carbs: 0,    protein: 0,   fat: 0 },
            { name: '红茶',   cat: '饮品', catCls: 'snack', kcal: 1,   carbs: 0,    protein: 0,   fat: 0 },
            { name: '乌龙茶',  cat: '饮品', catCls: 'snack', kcal: 1,   carbs: 0,    protein: 0,   fat: 0 },
            { name: '蛋白粉',  cat: '饮品', catCls: 'snack', kcal: 400, carbs: 6.0,  protein: 80.0, fat: 3.0 },
            { name: '豆腐脑',  cat: '饮品', catCls: 'snack', kcal: 15,  carbs: 1.7,  protein: 1.9, fat: 0.3 },
            { name: '脱脂牛奶', cat: '饮品', catCls: 'snack', kcal: 35,  carbs: 5.0,  protein: 3.4, fat: 0.1 },
            { name: '拿铁咖啡', cat: '饮品', catCls: 'snack', kcal: 45,  carbs: 5.0,  protein: 2.5, fat: 1.8 },
            { name: '椰子水',  cat: '饮品', catCls: 'snack', kcal: 19,  carbs: 4.2,  protein: 0.7, fat: 0.2 },
            { name: '运动饮料', cat: '饮品', catCls: 'snack', kcal: 26,  carbs: 6.4,  protein: 0,   fat: 0 },
            { name: '腰果',   cat: '零食', catCls: 'snack', kcal: 552, carbs: 26.9, protein: 17.3, fat: 43.8 },
            { name: '开心果',  cat: '零食', catCls: 'snack', kcal: 560, carbs: 27.2, protein: 20.2, fat: 45.3 },
            { name: '松子',   cat: '零食', catCls: 'snack', kcal: 673, carbs: 13.1, protein: 14.1, fat: 68.4 },
            { name: '瓜子(炒)', cat: '零食', catCls: 'snack', kcal: 582, carbs: 20.0, protein: 22.6, fat: 49.8 },
            { name: '牛肉干',  cat: '零食', catCls: 'snack', kcal: 550, carbs: 22.0, protein: 45.6, fat: 29.5 },
            { name: '海苔',   cat: '零食', catCls: 'snack', kcal: 177, carbs: 24.0, protein: 29.0, fat: 3.5 },
        ];

        
// ===== 餐盘生成器 =====
        (function() {
            // 状态
            var selections = { goal: null, meal: null, activity: null };
            var sourceMode = 'system';
            var targetMode = 'gram';

            // DOM 引用
            var optionBtns = document.querySelectorAll('#tab-plate .plate-option-btn');
            var hints = {
                goal: document.querySelector('[data-hint="goal"]'),
                activity: document.querySelector('[data-hint="activity"]')
            };
            var summaryBar = document.getElementById('plateSummary');
            var generateBtn = document.getElementById('generateBtn');
            var resultArea = document.getElementById('plateResult');
            var profileCard = document.getElementById('profileCard');
            var profileStats = document.getElementById('profileStats');
            var sourceToggle = document.getElementById('sourceToggle');
            var systemContent = document.getElementById('systemContent');
            var customContent = document.getElementById('customContent');
            var step1Panel = document.getElementById('step1Panel');
            var targetModeBar = document.getElementById('targetModeBar');
            var stepIndicator = document.querySelector('.step-indicator');

            // 热量表（仅在无用户画像时使用）
            var CALORIE_TABLE = {
                '久坐为主': { '减重': 1500, '增肌': 2200, '保持现状': 1800 },
                '偶尔运动': { '减重': 1600, '增肌': 2400, '保持现状': 2000 },
                '经常运动': { '减重': 1700, '增肌': 2600, '保持现状': 2200 }
            };

            // 宏量营养素供能比
            var MACRO_RATIOS = {
                '减重': { carbs: 0.40, protein: 0.30, fat: 0.30 },
                '增肌': { carbs: 0.45, protein: 0.30, fat: 0.25 },
                '保持现状': { carbs: 0.50, protein: 0.20, fat: 0.30 }
            };

            // 餐单替换建议
            var SWAP_TIPS = {
                '早餐': ['把包子换成全麦三明治', '加一颗水煮蛋', '把甜豆浆换成无糖豆浆'],
                '午餐': ['把白米饭换成杂粮饭', '加一份清炒时蔬', '把红烧肉换成清蒸鱼'],
                '晚餐': ['减少一半主食，增加蔬菜', '把炒菜换成凉拌菜', '用豆腐替代部分肉类']
            };

            // ===== 单位换算 =====
            function getTargetGrams(mode) {
                var c = parseFloat(document.getElementById('targetCarbs').value) || 0;
                var p = parseFloat(document.getElementById('targetProtein').value) || 0;
                var f = parseFloat(document.getElementById('targetFat').value) || 0;
                if (mode === 'gram') return { carbs: c, protein: p, fat: f };
                var weight = parseFloat(document.getElementById('weight').value) || 0;
                if (mode === 'perkg') return { carbs: Math.round(weight * c), protein: Math.round(weight * p), fat: Math.round(weight * f) };
                var tdee = (window.userProfile && window.userProfile.tdee) || 2000;
                return { carbs: Math.round(tdee * (c/100)/4), protein: Math.round(tdee * (p/100)/4), fat: Math.round(tdee * (f/100)/9) };
            }
            function gramsToPct(grams) {
                var total = grams.carbs*4 + grams.protein*4 + grams.fat*9;
                if (!total) return { carbs:0, protein:0, fat:0 };
                return { carbs: Math.round(grams.carbs*4/total*100), protein: Math.round(grams.protein*4/total*100), fat: Math.round(grams.fat*9/total*100) };
            }
            function getKcal(grams) {
                return grams.carbs*4 + grams.protein*4 + grams.fat*9;
            }

            // ===== 更新目标摘要 =====
            function updateSummary() {
                if (sourceMode === 'system') {
                    if (selections.goal && selections.activity) {
                        var kcal, ratios = MACRO_RATIOS[selections.goal];
                        if (window.userProfile) {
                            kcal = window.userProfile.tdee;
                        } else {
                            kcal = CALORIE_TABLE[selections.activity][selections.goal];
                        }
                        var c = Math.round(kcal * ratios.carbs / 4);
                        var p = Math.round(kcal * ratios.protein / 4);
                        var f = Math.round(kcal * ratios.fat / 9);
                        summaryBar.innerHTML = '推荐目标：<span class="highlight">' + kcal + ' kcal</span> | '
                            + '碳水 <span class="highlight">' + c + 'g</span> · '
                            + '蛋白质 <span class="highlight">' + p + 'g</span> · '
                            + '脂肪 <span class="highlight">' + f + 'g</span>';
                        generateBtn.disabled = false;
                    } else {
                        summaryBar.textContent = '请选择目标和活动水平';
                        generateBtn.disabled = true;
                    }
                } else {
                    var grams = getTargetGrams(targetMode);
                    if (grams.carbs || grams.protein || grams.fat) {
                        var kcal = getKcal(grams);
                        var pct = gramsToPct(grams);
                        summaryBar.innerHTML = '自定义目标：<span class="highlight">' + kcal + ' kcal</span> | '
                            + '碳水 <span class="highlight">' + grams.carbs + 'g</span> (' + pct.carbs + '%) · '
                            + '蛋白质 <span class="highlight">' + grams.protein + 'g</span> (' + pct.protein + '%) · '
                            + '脂肪 <span class="highlight">' + grams.fat + 'g</span> (' + pct.fat + '%)';
                        generateBtn.disabled = false;
                    } else {
                        summaryBar.textContent = '请输入自定义营养素目标';
                        generateBtn.disabled = true;
                    }
                }
            }

            // ===== 更新输入框单位 =====
            function updateTargetInputs(mode) {
                var units = ['carbsUnit','proteinUnit','fatUnit'].map(function(id){ return document.getElementById(id); });
                var inputs = ['targetCarbs','targetProtein','targetFat'].map(function(id){ return document.getElementById(id); });
                var label = mode === 'gram' ? '克数' : mode === 'pct' ? '百分比' : 'g/kg';
                var unit = mode === 'gram' ? 'g' : mode === 'pct' ? '%' : 'g/kg';
                units.forEach(function(el){ el.textContent = unit; });
                inputs.forEach(function(el){ el.placeholder = label; });
            }

            // ===== 来源切换 =====
            if (sourceToggle) {
                sourceToggle.addEventListener('click', function(e) {
                    var btn = e.target.closest('.source-btn');
                    if (!btn) return;
                    sourceToggle.querySelectorAll('.source-btn').forEach(function(b){ b.classList.remove('active'); });
                    btn.classList.add('active');
                    sourceMode = btn.getAttribute('data-source');
                    systemContent.style.display = sourceMode === 'system' ? 'block' : 'none';
                    customContent.style.display = sourceMode === 'custom' ? 'block' : 'none';
                    updateSummary();
                });
            }

            // ===== 自定义模式切换 =====
            if (targetModeBar) {
                targetModeBar.addEventListener('click', function(e) {
                    var btn = e.target.closest('.target-mode-btn');
                    if (!btn) return;
                    targetModeBar.querySelectorAll('.target-mode-btn').forEach(function(b){ b.classList.remove('active'); });
                    btn.classList.add('active');
                    targetMode = btn.getAttribute('data-mode');
                    updateTargetInputs(targetMode);
                    updateSummary();
                });
            }

            // ===== 自定义输入实时更新摘要 =====
            ['targetCarbs','targetProtein','targetFat'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', function() {
                        if (sourceMode === 'custom') updateSummary();
                    });
                }
            });

            // ===== 生成餐盘 =====
            if (generateBtn) {
                generateBtn.addEventListener('click', function() {
                    if (this.disabled) return;
                    selections.meal = '午餐';
                    if (stepIndicator) {
                        stepIndicator.querySelectorAll('.step-item').forEach(function(s, i) {
                            s.classList.toggle('active', i === 1);
                        });
                    }
                    generatePlate(!!window.userProfile);
                });
            }

            // ===== 更新用户画像提示卡 =====
            function updateProfileCard() {
                if (window.userProfile) {
                    var p = window.userProfile;
                    var statsHtml = ''
                        + '<span class="profile-stat">每日热量：<span class="stat-value">' + p.tdee + ' kcal</span></span>'
                        + '<span class="profile-stat">蛋白质：<span class="stat-value">' + p.proteinRange[0] + '~' + p.proteinRange[1] + 'g</span></span>'
                        + '<span class="profile-stat">碳水：<span class="stat-value">' + p.carbsRange[0] + '~' + p.carbsRange[1] + 'g</span></span>'
                        + '<span class="profile-stat">脂肪：<span class="stat-value">' + p.fatRange[0] + '~' + p.fatRange[1] + 'g</span></span>';
                    profileStats.innerHTML = statsHtml;
                    profileCard.style.display = 'block';
                } else {
                    profileCard.style.display = 'none';
                }
            }

            // ===== 选项按钮点击 =====
            optionBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var group = this.parentElement;
                    var question = group.getAttribute('data-question');
                    var value = this.getAttribute('data-value');

                    group.querySelectorAll('.plate-option-btn').forEach(function(b) {
                        b.classList.remove('selected');
                    });
                    this.classList.add('selected');

                    selections[question] = value;

                    if (hints[question]) {
                        hints[question].textContent = value;
                        hints[question].classList.add('has-value');
                    }

                    if (question === 'goal' || question === 'activity') {
                        if (sourceMode === 'system') updateSummary();
                    }

                    resultArea.classList.remove('visible');
                });
            });

            // ===== Chart.js 实例 =====
            var plateChartInstance = null;

            // ===== 生成餐盘（核心函数） =====
            function generatePlate(useProfile) {
                var goal = selections.goal;
                var meal = selections.meal;
                var activity = selections.activity;

                // 1. 计算全天总量
                var kcal, carbsG, proteinG, fatG;

                if (sourceMode === 'custom') {
                    var g = getTargetGrams(targetMode);
                    carbsG = g.carbs;
                    proteinG = g.protein;
                    fatG = g.fat;
                    kcal = getKcal(g);
                } else if (useProfile && window.userProfile) {
                    kcal = window.userProfile.tdee;
                    var ratios = MACRO_RATIOS[goal];
                    carbsG = Math.round(kcal * ratios.carbs / 4);
                    proteinG = Math.round(kcal * ratios.protein / 4);
                    fatG = Math.round(kcal * ratios.fat / 9);
                } else {
                    kcal = CALORIE_TABLE[activity][goal];
                    var ratios = MACRO_RATIOS[goal];
                    carbsG = Math.round(kcal * ratios.carbs / 4);
                    proteinG = Math.round(kcal * ratios.protein / 4);
                    fatG = Math.round(kcal * ratios.fat / 9);
                }

                // 2. 渲染环形图
                var totalG = carbsG + proteinG + fatG;
                var cpct = totalG ? Math.round(carbsG / totalG * 100) : 0;
                var ppct = totalG ? Math.round(proteinG / totalG * 100) : 0;
                var fpct = totalG ? Math.round(fatG / totalG * 100) : 0;

                var ctx = document.getElementById('plateChart');
                if (plateChartInstance) {
                    plateChartInstance.destroy();
                }
                plateChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['碳水化合物', '蛋白质', '脂肪'],
                        datasets: [{
                            data: [cpct, ppct, fpct],
                            backgroundColor: ['#E88A5A', '#7BAF7A', '#B39DDB'],
                            borderWidth: 0,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: '55%',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 14,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: { size: 13, family: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
                                    color: '#2d3436'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.label + ': ' + context.parsed + '%';
                                    }
                                },
                                backgroundColor: 'rgba(45,52,54,0.85)',
                                padding: 10,
                                cornerRadius: 8
                            }
                        },
                        animation: {
                            animateRotate: true,
                            duration: 800
                        }
                    }
                });

                // 3. 渲染全天克数详情
                var detailHtml = ''
                    + '<div class="plate-macro-item">'
                        + '<span class="macro-color-dot" style="background:#E88A5A"></span>'
                        + '<span class="macro-name">碳水化合物</span>'
                        + '<div class="macro-gram">' + carbsG + 'g</div>'
                        + '<div class="macro-pct">' + cpct + '%</div>'
                    + '</div>'
                    + '<div class="plate-macro-item">'
                        + '<span class="macro-color-dot" style="background:#7BAF7A"></span>'
                        + '<span class="macro-name">蛋白质</span>'
                        + '<div class="macro-gram">' + proteinG + 'g</div>'
                        + '<div class="macro-pct">' + ppct + '%</div>'
                    + '</div>'
                    + '<div class="plate-macro-item">'
                        + '<span class="macro-color-dot" style="background:#B39DDB"></span>'
                        + '<span class="macro-name">脂肪</span>'
                        + '<div class="macro-gram">' + fatG + 'g</div>'
                        + '<div class="macro-pct">' + fpct + '%</div>'
                    + '</div>'
                    + '<div style="width:100%;text-align:center;font-size:13px;color:#636e72;margin-top:6px;">'
                        + '每日参考热量：' + kcal + ' kcal</div>';
                document.getElementById('plateMacroDetail').innerHTML = detailHtml;

                // 4. 三餐分配（30%/40%/30%）
                var MEAL_SPLIT = { '早餐': 0.30, '午餐': 0.40, '晚餐': 0.30 };
                var mealNames = ['早餐', '午餐', '晚餐'];

                // 5. 为每餐筛选并渲染食物
                mealNames.forEach(function(name, idx) {
                    var pct = MEAL_SPLIT[name];
                    var mKcal  = Math.round(kcal * pct);
                    var mCarbs = Math.round(carbsG * pct);
                    var mProt  = Math.round(proteinG * pct);
                    var mFat   = Math.round(fatG * pct);

                    document.getElementById(name + 'Summary').textContent
                        = '≈' + mKcal + 'kcal | 碳水' + mCarbs + 'g 蛋白' + mProt + 'g 脂肪' + mFat + 'g';

                    var cardEl = document.getElementById('meal' + name);
                    cardEl.className = 'meal-card' + (name === meal ? ' highlight' : '');

                    var foods = selectMealFoods(name, goal, mCarbs, mProt, idx);

                    var bodyHtml = '';
                    foods.forEach(function(item) {
                        var f = item.food;
                        var sv = item.serving;
                        var itemKcal = Math.round(f.kcal * sv / 100);
                        var itemProt = Math.round(f.protein * sv / 100 * 10) / 10;
                        bodyHtml += '<div class="meal-food-item">'
                            + '<span class="dot ' + item.cat + '"></span>'
                            + '<span class="info">'
                                + '<span class="food-name">' + f.name + '</span>'
                                + '<span class="food-nutrition"> ' + sv + 'g | ' + itemKcal + 'kcal | 蛋白质' + itemProt + 'g</span>'
                            + '</span>'
                            + '</div>';
                    });
                    document.getElementById(name + 'Body').innerHTML = bodyHtml;
                });

                // 6. 凑合餐替换建议
                var swapContainer = document.getElementById('plateSwapContainer');
                if (meal === '都还行') {
                    swapContainer.innerHTML = '<div class="plate-swap-all-good">✅ 三餐搭配都比较均衡，保持即可！</div>';
                } else {
                    var tips = SWAP_TIPS[meal];
                    var swapHtml = '<ul class="plate-swap-list">';
                    tips.forEach(function(tip) {
                        swapHtml += '<li class="plate-swap-item">'
                            + '<span class="swap-icon">✓</span>'
                            + '<span>' + tip + '</span>'
                            + '</li>';
                    });
                    swapHtml += '</ul>';
                    swapContainer.innerHTML = swapHtml;
                }
                document.getElementById('swapSection').style.display = 'block';

                // 7. 显示结果
                resultArea.classList.remove('visible');
                void resultArea.offsetWidth;
                resultArea.classList.add('visible');

                setTimeout(function() {
                    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            }

            // ===== 食物筛选函数 =====
            function selectMealFoods(mealName, goal, targetCarbs, targetProtein, mealIndex) {
                var result = [];
                var usedNames = {};

                function getByCat(catCls) {
                    var list = [];
                    for (var i = 0; i < FOOD_DATA.length; i++) {
                        if (FOOD_DATA[i].catCls === catCls) {
                            list.push(FOOD_DATA[i]);
                        }
                    }
                    return list;
                }

                function sortByGoal(list) {
                    var sorted = list.slice();
                    if (goal === '减重') {
                        sorted.sort(function(a, b) { return a.kcal - b.kcal; });
                    } else if (goal === '增肌') {
                        sorted.sort(function(a, b) { return b.protein - a.protein; });
                    }
                    return sorted;
                }

                function pickOne(catCls, preferredKey) {
                    var candidates = sortByGoal(getByCat(catCls));
                    if (preferredKey) {
                        for (var i = 0; i < candidates.length; i++) {
                            if (candidates[i].name.indexOf(preferredKey) !== -1 && !usedNames[candidates[i].name]) {
                                usedNames[candidates[i].name] = true;
                                return candidates[i];
                            }
                        }
                    }
                    for (var i = 0; i < candidates.length; i++) {
                        if (!usedNames[candidates[i].name]) {
                            usedNames[candidates[i].name] = true;
                            return candidates[i];
                        }
                    }
                    return candidates[0];
                }

                var offset = mealIndex * 3;

                // 主食：提供约65%的碳水需求
                var carbNeed = Math.round(targetCarbs * 0.65);
                var staplePrefs = ['米饭', '馒头', '面条', '红薯', '玉米', '燕麦', '全麦'];
                var staple = pickOne('staple', staplePrefs[offset % staplePrefs.length]);
                var stapleServing = Math.round(carbNeed / (staple.carbs / 100));
                stapleServing = Math.max(80, Math.min(350, stapleServing));
                result.push({ food: staple, serving: stapleServing, cat: 'staple' });

                // 蛋白质：提供约85%的蛋白质需求
                var protNeed = Math.round(targetProtein * 0.85);
                var protPrefs = ['鸡胸肉', '鸡蛋', '牛肉', '鱼', '虾', '豆腐'];
                var protein = pickOne('meat', protPrefs[offset % protPrefs.length]);
                var protServing = Math.round(protNeed / (protein.protein / 100));
                protServing = Math.max(50, Math.min(300, protServing));
                result.push({ food: protein, serving: protServing, cat: 'meat' });

                // 蔬菜：固定180g
                var vegPrefs = ['西兰花', '菠菜', '西红柿', '黄瓜', '白菜', '生菜'];
                var veg = pickOne('veg', vegPrefs[offset % vegPrefs.length]);
                result.push({ food: veg, serving: 180, cat: 'veg' });

                // 早餐额外加一份水果
                if (mealName === '早餐') {
                    var fruitPrefs = ['苹果', '香蕉', '橙子', '蓝莓', '猕猴桃'];
                    var fruit = pickOne('fruit', fruitPrefs[offset % fruitPrefs.length]);
                    result.push({ food: fruit, serving: 150, cat: 'fruit' });
                }

                return result;
            }

            // ===== 食物收藏功能 =====
            var FAV_KEY = 'nutrition_favorites';

            function loadFavorites() {
                try {
                    var data = localStorage.getItem(FAV_KEY);
                    return data ? JSON.parse(data) : [];
                } catch (e) { return []; }
            }

            function saveFavorites(list) {
                localStorage.setItem(FAV_KEY, JSON.stringify(list));
            }

            function toggleFavorite(name) {
                var list = loadFavorites();
                var idx = list.indexOf(name);
                if (idx === -1) {
                    list.push(name);
                } else {
                    list.splice(idx, 1);
                }
                saveFavorites(list);
                updateFavCount();
                var btn = document.getElementById('favToggleBtn');
                if (btn && btn.classList.contains('active')) {
                    renderFoodTable(document.getElementById('foodSearch').value);
                } else {
                    updateFavStars();
                }
                return idx === -1;
            }

            function isFavorite(name) {
                return loadFavorites().indexOf(name) !== -1;
            }

            function updateFavCount() {
                var el = document.getElementById('favCount');
                if (el) {
                    var list = loadFavorites();
                    el.textContent = list.length + ' 个收藏';
                }
            }

            function updateFavStars() {
                var stars = document.querySelectorAll('.fav-star');
                stars.forEach(function(star) {
                    var name = star.getAttribute('data-name');
                    star.classList.toggle('active', isFavorite(name));
                });
            }

            // ===== 食物热量速查表 =====
            var currentFoodCat = 'all';

            function kcalClass(kcal) {
                if (kcal <= 50) return 'kcal-low';
                if (kcal <= 150) return 'kcal-mid';
                return 'kcal-high';
            }

            function renderFoodTable(query) {
                var tbody = document.getElementById('foodTableBody');
                var empty = document.getElementById('foodEmpty');
                var countEl = document.getElementById('foodCount');
                if (!tbody) return;

                var keyword = (query || '').trim().toLowerCase();

                var filtered = (currentFoodCat === 'all')
                    ? FOOD_DATA.slice()
                    : FOOD_DATA.filter(function(item) { return item.catCls === currentFoodCat; });

                if (keyword) {
                    filtered = filtered.filter(function(item) { return item.name.indexOf(keyword) !== -1; });
                }

                var favBtn = document.getElementById('favToggleBtn');
                var favOnly = favBtn && favBtn.classList.contains('active');
                if (favOnly) {
                    var favs = loadFavorites();
                    filtered = filtered.filter(function(item) { return favs.indexOf(item.name) !== -1; });
                }

                if (filtered.length === 0) {
                    tbody.innerHTML = '';
                    empty.style.display = 'block';
                    countEl.textContent = '0';
                    return;
                }

                empty.style.display = 'none';
                countEl.textContent = filtered.length;

                var html = '';
                for (var i = 0; i < filtered.length; i++) {
                    var item = filtered[i];
                    var fav = isFavorite(item.name);
                    html += '<tr>'
                        + '<td><button class="fav-star' + (fav ? ' active' : '') + '" data-name="' + item.name + '" title="' + (fav ? '取消收藏' : '收藏') + '">' + (fav ? '★' : '☆') + '</button></td>'
                        + '<td><span class="food-cat-tag ' + item.catCls + '">' + item.cat + '</span></td>'
                        + '<td class="food-name">' + item.name + '</td>'
                        + '<td class="' + kcalClass(item.kcal) + '">' + item.kcal + '</td>'
                        + '<td>' + item.carbs + '</td>'
                        + '<td>' + item.protein + '</td>'
                        + '<td>' + item.fat + '</td>'
                        + '</tr>';
                }
                tbody.innerHTML = html;
            }

            // 分类标签点击
            var catBar = document.getElementById('foodCatBar');
            if (catBar) {
                catBar.addEventListener('click', function(e) {
                    var btn = e.target.closest('.food-cat-btn');
                    if (!btn) return;
                    catBar.querySelectorAll('.food-cat-btn').forEach(function(b) {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    currentFoodCat = btn.getAttribute('data-cat');
                    renderFoodTable(document.getElementById('foodSearch').value);
                });
            }

            // 搜索框
            var foodSearch = document.getElementById('foodSearch');
            if (foodSearch) {
                foodSearch.addEventListener('input', function() {
                    renderFoodTable(this.value);
                });
            }

            // 收藏按钮事件委托
            var plateTab = document.getElementById('tab-plate');
            if (plateTab) {
                plateTab.addEventListener('click', function(e) {
                    var star = e.target.closest('.fav-star');
                    if (star) {
                        var name = star.getAttribute('data-name');
                        toggleFavorite(name);
                    }
                });
            }

            // 只看收藏切换
            var favToggleBtn = document.getElementById('favToggleBtn');
            if (favToggleBtn) {
                favToggleBtn.addEventListener('click', function() {
                    this.classList.toggle('active');
                    renderFoodTable(document.getElementById('foodSearch').value);
                });
            }

            // 初始化
            updateFavCount();
            renderFoodTable('');
            updateProfileCard();
        })();

        // ===== 标签页切换 =====
        var navBtns = document.querySelectorAll('.nav-btn');
        var tabs = document.querySelectorAll('.tab-content');

        navBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                // 更新按钮状态
                navBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');

                // 更新标签页
                var tabId = 'tab-' + this.getAttribute('data-tab');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                document.getElementById(tabId).classList.add('active');

                // 切换到餐盘生成器时检查用户画像
                if (tabId === 'tab-plate') {
                    var pc = document.getElementById('profileCard');
                    var ps = document.getElementById('profileStats');
                    if (window.userProfile && pc && ps) {
                        var p = window.userProfile;
                        ps.innerHTML = ''
                            + '<span class="profile-stat">每日热量：<span class="stat-value">' + p.tdee + ' kcal</span></span>'
                            + '<span class="profile-stat">蛋白质：<span class="stat-value">' + p.proteinRange[0] + '~' + p.proteinRange[1] + 'g</span></span>'
                            + '<span class="profile-stat">碳水：<span class="stat-value">' + p.carbsRange[0] + '~' + p.carbsRange[1] + 'g</span></span>'
                            + '<span class="profile-stat">脂肪：<span class="stat-value">' + p.fatRange[0] + '~' + p.fatRange[1] + 'g</span></span>';
                        pc.style.display = 'block';
                    } else {
                        if (pc) pc.style.display = 'none';
                    }
                }
            });
        });

// 页面加载后渲染历史、初始化图表、自动计算默认值
        window.addEventListener('DOMContentLoaded', function() {
            renderHistory();
            renderTrendChart();
            updateMacroChart();
        });
    })();
