/* 酮行 · 生酮患者管理台 */
(function () {
  var DATA = window.KC_DATA;
  var KEY = 'keto-care-v1';
  var state = { patients: [], activeId: null };
  var currentTab = 'patient';
  var currentReport = 'doctor';
  var foodCat = 'all';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function todayStr() {
    var d = new Date();
    var off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { }
  }
  function active() {
    return state.patients.filter(function (p) { return p.id === state.activeId; })[0] || null;
  }
  function fmtDate(s) {
    if (!s) return '—';
    var parts = s.split('-');
    if (parts.length !== 3) return s;
    return parts[0] + ' 年 ' + Number(parts[1]) + ' 月 ' + Number(parts[2]) + ' 日';
  }
  function bmiText(p) {
    var h = Number(p.height), w = Number(p.weight);
    if (!h || !w) return '—';
    var bmi = w / Math.pow(h / 100, 2);
    return round1(bmi) + ' kg/m²';
  }

  /* ================= 患者 ================= */
  function blankPatient(type) {
    return {
      id: uid(), name: '', type: type || 'child', age: '', sex: 'male',
      height: '', weight: '', diagnosis: '', meds: '', caregiver: '', goal: '',
      screening: { absolute: [], relative: [], notes: '', reviewed: false },
      plan: null, followups: [], createdAt: Date.now()
    };
  }

  function createPatient() {
    var p = blankPatient('child');
    state.patients.push(p);
    state.activeId = p.id;
    save();
    renderAll();
    switchTab('patient');
    toast('已新建患者');
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function buildDemo(key) {
    var demo = null;
    DATA.demo.forEach(function (d) { if (d.key === key) demo = d; });
    if (!demo) return null;
    var p = clone(demo.patient);
    p.id = uid();
    p.isDemo = key;
    p.createdAt = Date.now();
    p.screening = clone(demo.screening);
    p.screening.reviewed = true;
    p.followups = clone(demo.followups).map(function (f) { f.id = uid(); return f; });
    p.followups.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var pw = proteinWeightFor(p);
    p.plan = {
      energy: demo.plan.energy,
      proteinPerKg: demo.plan.proteinPerKg,
      ratio: demo.plan.ratio,
      carbLimit: demo.plan.carbLimit,
      meals: demo.plan.meals,
      macros: computeMacros({
        energy: demo.plan.energy,
        proteinPerKg: demo.plan.proteinPerKg,
        weight: p.weight,
        proteinWeight: pw.weight,
        ratio: demo.plan.ratio,
        carbLimit: demo.plan.carbLimit
      }),
      proteinWeight: pw.weight,
      adjustedProtein: pw.adjusted,
      createdAt: Date.now()
    };
    return p;
  }

  function loadDemo(key) {
    var demo = null;
    DATA.demo.forEach(function (d) { if (d.key === key) demo = d; });
    var p = buildDemo(key);
    if (!p) return;
    state.patients = state.patients.filter(function (x) { return x.isDemo !== key; });
    state.patients.push(p);
    state.activeId = p.id;
    save();
    renderAll();
    switchTab('patient');
    toast('已载入 ' + demo.label);
  }

  function renderPatientSelect() {
    var sel = $('#patient-select');
    sel.innerHTML = '';
    if (!state.patients.length) {
      var o = document.createElement('option');
      o.textContent = '暂无患者';
      sel.appendChild(o);
      return;
    }
    state.patients.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name || '未命名患者';
      if (p.id === state.activeId) o.selected = true;
      sel.appendChild(o);
    });
  }

  function fillPatientForm() {
    var p = active();
    if (!p) return;
    $('#p-name').value = p.name || '';
    $('#p-type').value = p.type || 'child';
    $('#p-age').value = p.age || '';
    $('#p-sex').value = p.sex || 'male';
    $('#p-height').value = p.height || '';
    $('#p-weight').value = p.weight || '';
    $('#p-diagnosis').value = p.diagnosis || '';
    $('#p-meds').value = p.meds || '';
    $('#p-caregiver').value = p.caregiver || '';
    $('#p-goal').value = p.goal || '';
    toggleTypeFields(p.type);
  }

  function toggleTypeFields(type) {
    $('#wrap-caregiver').style.display = type === 'child' ? 'flex' : 'none';
    $('#wrap-goal').style.display = type === 'adult' ? 'flex' : 'none';
    $('#wrap-seizures').style.display = type === 'child' ? 'flex' : 'none';
  }

  function savePatientForm() {
    var p = active();
    if (!p) return;
    var name = $('#p-name').value.trim();
    var weight = parseFloat($('#p-weight').value);
    var height = parseFloat($('#p-height').value);
    if (!name) { toast('请填写姓名 / 编号'); return; }
    if (!(weight > 0) || !(height > 0)) { toast('请填写有效的身高和体重'); return; }
    var oldWeight = Number(p.weight), oldType = p.type;
    p.name = name;
    p.type = $('#p-type').value;
    p.age = parseInt($('#p-age').value, 10) || '';
    p.sex = $('#p-sex').value;
    p.height = height;
    p.weight = weight;
    p.diagnosis = $('#p-diagnosis').value.trim();
    p.meds = $('#p-meds').value.trim();
    p.caregiver = $('#p-caregiver').value.trim();
    p.goal = $('#p-goal').value.trim();
    if (p.plan && (oldWeight !== p.weight || oldType !== p.type)) {
      p.plan = null;
      toast('患者信息已更新，请重新生成方案');
    }
    save();
    renderAll();
    toast('患者已保存');
  }

  /* ================= 筛查 ================= */
  function renderScreening() {
    var p = active();
    if (!p) return;
    var absBox = $('#abs-list'), relBox = $('#rel-list');
    absBox.innerHTML = ''; relBox.innerHTML = '';
    DATA.screening.absolute.forEach(function (text, i) { absBox.appendChild(screenItem('absolute', text, i, p)); });
    DATA.screening.relative.forEach(function (text, i) { relBox.appendChild(screenItem('relative', text, i, p)); });
    $('#screen-notes').value = p.screening.notes || '';
    renderScreeningResult();
  }

  function screenItem(kind, text, i, p) {
    var label = document.createElement('label');
    label.className = 'check-item';
    label.innerHTML = '<input type="checkbox" id="' + kind + '-' + i + '"' + (p.screening[kind].indexOf(text) >= 0 ? ' checked' : '') + '><span>' + esc(text) + '</span>';
    var input = label.querySelector('input');
    input.addEventListener('change', function () {
      var arr = p.screening[kind];
      var idx = arr.indexOf(text);
      if (input.checked && idx < 0) arr.push(text);
      if (!input.checked && idx >= 0) arr.splice(idx, 1);
      p.screening.reviewed = true;
      save();
      renderScreeningResult();
      updateBadges();
    });
    return label;
  }

  function screeningResult() {
    var p = active();
    if (!p) return { level: 'gray', title: '尚未建档', text: '先填写患者信息。' };
    if (!p.screening.reviewed) {
      return { level: 'gray', title: '尚未完成筛查', text: '请逐项核对绝对 / 相对禁忌，然后点“确认筛查结论”。' };
    }
    var abs = p.screening.absolute || [];
    var rel = p.screening.relative || [];
    if (abs.length) {
      return { level: 'red', title: '不建议启动生酮', text: '已勾选 ' + abs.length + ' 项绝对禁忌：' + abs.join('；') + '。需先由专科医生评估。' };
    }
    if (rel.length) {
      return { level: 'amber', title: '需进一步评估与监测', text: '已勾选 ' + rel.length + ' 项相对禁忌：' + rel.join('；') + '。方案需个体化，并加强监测。' };
    }
    return { level: 'green', title: '筛查通过', text: '未勾选绝对 / 相对禁忌。仍需医生确认，并按计划监测。' };
  }

  function renderScreeningResult() {
    var r = screeningResult();
    var el = $('#screen-result');
    el.className = 'result-card ' + r.level;
    el.innerHTML = '<h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p>';
    var btn = $('#btn-generate');
    if (btn) btn.disabled = !active() || !active().screening.reviewed || active().screening.absolute.length > 0;
    var hint = $('#plan-hint');
    if (hint && active() && !active().screening.reviewed) hint.textContent = '请先完成筛查并确认结论。';
    else if (hint && active() && active().screening.absolute.length) hint.textContent = '存在绝对禁忌，需先专科评估。';
  }

  /* ================= 方案 ================= */
  function proteinWeightFor(p) {
    var w = Number(p.weight), h = Number(p.height);
    if (p.type === 'adult' && w > 0 && h > 0) {
      var bmi = w / Math.pow(h / 100, 2);
      if (bmi >= 30) {
        var ibw = 22 * Math.pow(h / 100, 2);
        var abw = ibw + 0.25 * (w - ibw);
        return { weight: round1(abw), adjusted: true, bmi: round1(bmi) };
      }
    }
    return { weight: w, adjusted: false };
  }

  function defaultPlan(p) {
    var est = estimateEnergyFor(p);
    return {
      energy: est.energy || '',
      proteinPerKg: p.type === 'child' ? 1.2 : 1.4,
      ratio: p.type === 'child' ? '3:1' : 'MAD',
      carbLimit: p.type === 'child' ? 20 : 25,
      meals: p.type === 'child' ? 4 : 3
    };
  }

  function estimateEnergyFor(p) {
    if (!p || !(Number(p.weight) > 0)) return { energy: '', note: '请先填写体重' };
    if (p.type === 'child') {
      var age = Number(p.age) || 6;
      var factor = age <= 3 ? 90 : age <= 6 ? 80 : age <= 10 ? 70 : age <= 14 ? 60 : 50;
      var e = Math.round(Number(p.weight) * factor * 0.9 / 50) * 50;
      return { energy: e, note: '按 ' + factor + ' kcal/kg 的 90% 估算，参考值' };
    }
    var w = Number(p.weight), h = Number(p.height), a = Number(p.age) || 35;
    if (!(h > 0)) return { energy: '', note: '请先填写身高' };
    var bmr = p.sex === 'female'
      ? 10 * w + 6.25 * h - 5 * a - 161
      : 10 * w + 6.25 * h - 5 * a + 5;
    var e2 = Math.round((bmr * 1.2 - 500) / 50) * 50;
    if (e2 < 1000) e2 = 1000;
    return { energy: e2, note: 'Mifflin-St Jeor × 1.2 - 500 kcal，参考值' };
  }

  function renderPlanForm() {
    var p = active();
    if (!p) return;
    var plan = p.plan || defaultPlan(p);
    $('#pl-energy').value = plan.energy || '';
    $('#pl-protein').value = plan.proteinPerKg || '';
    $('#pl-ratio').value = plan.ratio || '3:1';
    $('#pl-carb').value = plan.carbLimit || '';
    $('#pl-meals').value = plan.meals || 3;
    toggleCarbInput();
    var btn = $('#btn-generate');
    btn.disabled = !p.screening.reviewed || !!(p.screening.absolute && p.screening.absolute.length);
    $('#plan-hint').textContent = !p.screening.reviewed
      ? '请先完成筛查并确认结论。'
      : (btn.disabled ? '存在绝对禁忌，需先专科评估。' : '');
  }

  function toggleCarbInput() {
    var ratio = $('#pl-ratio').value;
    var carb = $('#pl-carb');
    carb.disabled = ratio !== 'MAD';
    carb.style.opacity = ratio === 'MAD' ? '1' : '.45';
  }

  function computeMacros(o) {
    var W = Number(o.proteinWeight || o.weight);
    var P = Number(o.proteinPerKg) * W;
    if (!(P > 0)) return { error: '蛋白质需大于 0' };
    var F, C, r;
    if (o.ratio === 'MAD') {
      C = Number(o.carbLimit) || 20;
      F = (Number(o.energy) - 4 * P - 4 * C) / 9;
      r = F / (P + C);
    } else {
      r = o.ratio === '4:1' ? 4 : 3;
      var PC = Number(o.energy) / (4 + 9 * r);
      C = PC - P;
      F = r * PC;
    }
    if (C < -0.05) return { error: '按当前能量 / 蛋白 / 比例，碳水为负；请降低蛋白、提高能量，或改用 MAD。' };
    if (F < 0) return { error: '按当前能量 / 蛋白 / 碳水，脂肪为负；请调整能量或碳水上限。' };
    if (C < 0) C = 0;
    var kcal = 4 * P + 4 * C + 9 * F;
    return { protein: round1(P), carb: round1(C), fat: round1(F), kcal: Math.round(kcal), actualRatio: round1(r) };
  }

  function generatePlan() {
    var p = active();
    if (!p) return;
    if (!p.screening.reviewed) { toast('请先完成筛查并确认结论'); return; }
    if (p.screening.absolute.length) { toast('存在绝对禁忌，需先专科评估'); return; }
    var energy = parseFloat($('#pl-energy').value);
    var protein = parseFloat($('#pl-protein').value);
    var ratio = $('#pl-ratio').value;
    var carbLimit = parseFloat($('#pl-carb').value);
    var meals = parseInt($('#pl-meals').value, 10);
    if (!(energy > 0)) { toast('请填写目标能量'); return; }
    if (!(protein > 0)) { toast('请填写蛋白质 g/kg'); return; }
    if (!(Number(p.weight) > 0)) { toast('请先在患者信息里填写体重'); return; }
    var pw = proteinWeightFor(p);
    var macros = computeMacros({ energy: energy, proteinPerKg: protein, weight: p.weight, proteinWeight: pw.weight, ratio: ratio, carbLimit: carbLimit });
    if (macros.error) { toast(macros.error); $('#plan-hint').textContent = macros.error; return; }
    p.plan = {
      energy: energy, proteinPerKg: protein, ratio: ratio,
      carbLimit: carbLimit, meals: meals, macros: macros,
      proteinWeight: pw.weight, adjustedProtein: pw.adjusted,
      createdAt: Date.now()
    };
    save();
    renderPlanOutput();
    updateBadges();
    toast('方案已生成');
  }

  function renderPlanOutput() {
    var p = active();
    var box = $('#plan-output');
    if (!p || !p.plan) {
      box.innerHTML = '<div class="card soft"><p class="hint">还没有生成方案。填写目标能量和蛋白质，点“生成方案”。</p></div>';
      return;
    }
    var m = p.plan.macros;
    var pw = p.plan.proteinWeight || p.weight;
    var pwText = p.plan.adjustedProtein ? '（调整体重）' : '';
    var ratioText = p.plan.ratio === 'MAD'
      ? 'MAD：碳水上限 ' + p.plan.carbLimit + ' g，脂肪补足能量（实际脂肪:(蛋白+碳水) 约 ' + m.actualRatio + ':1）'
      : '经典生酮：脂肪:(蛋白+碳水) = ' + p.plan.ratio + '（实际约 ' + m.actualRatio + ':1）';
    var meals = p.plan.meals === 4
      ? [['早餐', .25], ['午餐', .30], ['晚餐', .30], ['加餐', .15]]
      : [['早餐', .30], ['午餐', .35], ['晚餐', .35]];
    var rows = meals.map(function (x) {
      var name = x[0], pct = x[1];
      return '<tr><td>' + name + '（' + Math.round(pct * 100) + '%）</td>' +
        '<td>' + round1(m.fat * pct) + ' g</td>' +
        '<td>' + round1(m.protein * pct) + ' g</td>' +
        '<td>' + round1(m.carb * pct) + ' g</td>' +
        '<td>' + Math.round(m.kcal * pct) + ' kcal</td></tr>';
    }).join('');
    box.innerHTML =
      '<div class="card"><h2>每日方案</h2>' +
      '<div class="macro-grid">' +
      '<div class="macro fat"><div class="label">脂肪</div><div class="value">' + m.fat + '</div><div class="unit">g / 天</div></div>' +
      '<div class="macro"><div class="label">蛋白质</div><div class="value">' + m.protein + '</div><div class="unit">g / 天</div></div>' +
      '<div class="macro"><div class="label">碳水</div><div class="value">' + m.carb + '</div><div class="unit">g / 天</div></div>' +
      '<div class="macro"><div class="label">总能量</div><div class="value">' + m.kcal + '</div><div class="unit">kcal / 天</div></div>' +
      '</div>' +
      '<p class="table-note">' + esc(ratioText) + '；蛋白质 ' + p.plan.proteinPerKg + ' g/kg × ' + pw + ' kg' + pwText + '。</p>' +
      '<div class="table-wrap" style="margin-top:14px;"><table class="data"><thead><tr><th>餐次</th><th>脂肪</th><th>蛋白质</th><th>碳水</th><th>能量</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="plan-note"><b>油怎么算：</b>总脂肪包含食材本身的脂肪；烹调油 / 添加脂肪需从总脂肪中扣除，具体按食谱核算。生酮比例按克数计算，不是热量比。</div>' +
      '</div>';
  }

  /* ================= 食物参考 ================= */
  function renderFoodTable() {
    var box = $('#food-table');
    if (!box) return;
    var q = ($('#food-search').value || '').trim().toLowerCase();
    var list = DATA.foods.filter(function (f) {
      var matchCat = foodCat === 'all' || f.cat === foodCat;
      var matchQ = !q || f.name.indexOf(q) >= 0 || f.cat.indexOf(q) >= 0;
      return matchCat && matchQ;
    });
    if (!list.length) {
      box.innerHTML = '<p class="hint">没有匹配的食物，换个关键词试试。</p>';
      return;
    }
    var rows = list.map(function (f) {
      var cls = f.carb > 20 ? 'high' : f.carb > 5 ? 'mid' : 'low';
      var label = f.carb > 20 ? '高' : f.carb > 5 ? '中' : '低';
      return '<tr><td>' + esc(f.name) + '</td><td>' + esc(f.cat) + '</td>' +
        '<td><span class="carb-pill carb-' + cls + '">' + f.carb.toFixed(1) + ' g</span></td>' +
        '<td>' + esc(f.note) + '</td></tr>';
    }).join('');
    box.innerHTML = '<table class="data"><thead><tr><th>食物</th><th>类别</th><th>碳水 / 100g</th><th>提示</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ================= 随访 ================= */
  function renderAdverseList() {
    var box = $('#adverse-list');
    if (!box) return;
    box.innerHTML = '';
    DATA.adverse.forEach(function (a) {
      var label = document.createElement('label');
      label.className = 'check-item';
      label.innerHTML = '<input type="checkbox" data-adverse="' + esc(a) + '"><span>' + esc(a) + '</span>';
      box.appendChild(label);
    });
  }

  function renderFollowupForm() {
    var p = active();
    if (!p) return;
    $('#f-date').value = todayStr();
    $('#f-weight').value = p.weight || '';
    $('#f-ketone').value = '';
    $('#f-glucose').value = '';
    $('#f-seizures').value = p.type === 'child' ? '0' : '0';
    $('#f-adherence').value = '4';
    $('#f-notes').value = '';
    $$('#adverse-list input').forEach(function (i) { i.checked = false; });
    $('#wrap-seizures').style.display = p.type === 'child' ? 'flex' : 'none';
  }

  function addFollowup() {
    var p = active();
    if (!p) return;
    var date = $('#f-date').value;
    var weight = parseFloat($('#f-weight').value);
    if (!date) { toast('请选择日期'); return; }
    if (!(weight > 0)) { toast('请填写体重'); return; }
    var adverse = $$('#adverse-list input:checked').map(function (i) { return i.getAttribute('data-adverse'); });
    var entry = {
      id: uid(),
      date: date,
      weight: weight,
      ketone: parseFloat($('#f-ketone').value) || 0,
      glucose: parseFloat($('#f-glucose').value) || 0,
      seizures: p.type === 'child' ? (parseInt($('#f-seizures').value, 10) || 0) : 0,
      adherence: parseInt($('#f-adherence').value, 10) || 3,
      adverse: adverse,
      notes: $('#f-notes').value.trim()
    };
    p.followups.push(entry);
    p.followups.sort(function (a, b) { return a.date.localeCompare(b.date); });
    save();
    renderFollowup();
    toast('已添加随访记录');
  }

  function followupStatus(p) {
    if (!p || !p.followups.length) {
      return { level: 'gray', title: '暂无随访记录', text: '添加第一条记录后，这里会自动给出红黄绿灯提示。' };
    }
    var list = p.followups.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var base = list[0], last = list[list.length - 1];
    var level = 'green';
    var reasons = [];
    function mark(lv, txt) {
      if (lv === 'red') level = 'red';
      else if (lv === 'amber' && level !== 'red') level = 'amber';
      if (txt) reasons.push(txt);
    }
    if (last.ketone > 0) {
      if (last.ketone < 0.3) mark('red', '血酮 ' + last.ketone + ' mmol/L，偏低');
      else if (last.ketone < 0.5) mark('amber', '血酮 ' + last.ketone + ' mmol/L，未达营养性酮症');
      else if (last.ketone < 1.0) mark('amber', '血酮 ' + last.ketone + ' mmol/L，偏低');
    }
    if (p.type === 'child' && Number(base.seizures) > 0) {
      if (last.seizures > base.seizures * 1.5) mark('red', '发作次数较基线明显增加');
      else if (last.seizures > base.seizures) mark('amber', '发作次数较基线增加');
    }
    if (p.type === 'child') {
      var loss = (Number(base.weight) - Number(last.weight)) / Number(base.weight);
      if (loss > 0.05) mark('red', '体重较基线下降超过 5%');
      else if (loss > 0.02) mark('amber', '体重较基线下降超过 2%');
    } else {
      var days = (new Date(last.date) - new Date(base.date)) / 86400000;
      var weeks = days / 7;
      if (weeks > 0) {
        var perWeek = (Number(base.weight) - Number(last.weight)) / weeks;
        if (perWeek > 2.5) mark('red', '每周减重超过 2.5 kg');
        else if (perWeek > 1.5) mark('amber', '每周减重超过 1.5 kg');
      }
    }
    if (last.adherence <= 1) mark('red', '依从性很差');
    else if (last.adherence <= 2) mark('amber', '依从性偏低');
    var severe = ['脱水', '低血糖', '嗜睡 / 精神差', '呕吐'];
    if (last.adverse && last.adverse.length) {
      var hasSevere = last.adverse.some(function (a) { return severe.indexOf(a) >= 0; });
      if (hasSevere) mark('red', '出现需要警惕的不良反应：' + last.adverse.join('、'));
      else mark('amber', '有不良反应：' + last.adverse.join('、'));
    }
    var title = level === 'red' ? '红色提示：需要尽快联系 / 就医'
      : level === 'amber' ? '黄色提示：需要加强随访'
        : '绿色：目前稳定';
    var text = reasons.length ? reasons.join('；') + '。' : '最近一次记录：' + fmtDate(last.date) + '，体重 ' + last.weight + ' kg，血酮 ' + last.ketone + ' mmol/L。';
    return { level: level, title: title, text: text + '（提示为管理辅助，不构成诊断）' };
  }

  function renderFollowup() {
    var p = active();
    if (!p) return;
    renderFollowupForm();
    var st = followupStatus(p);
    var box = $('#follow-status');
    box.className = 'result-card ' + st.level;
    box.innerHTML = '<h3>' + esc(st.title) + '</h3><p>' + esc(st.text) + '</p>';
    renderChart();
    renderFollowTable();
    var badge = $('#follow-badge');
    if (!p.followups.length) {
      badge.className = 'badge gray'; badge.textContent = '未记录';
    } else {
      badge.className = 'badge ' + st.level;
      badge.textContent = p.followups.length + ' 次记录';
    }
  }

  function renderChart() {
    var p = active();
    var box = $('#chart');
    if (!p || !p.followups.length) {
      box.innerHTML = '<div class="chart-empty">还没有记录，添加后这里会出现趋势图。</div>';
      return;
    }
    var metric = $('#chart-metric').value;
    var meta = {
      weight: { label: '体重', unit: 'kg', color: '#1F6F78' },
      ketone: { label: '血酮', unit: 'mmol/L', color: '#B9914F' },
      seizures: { label: '发作次数', unit: '次/周', color: '#B45A4A' },
      adherence: { label: '依从性', unit: '1–5', color: '#4E8B6A' }
    }[metric];
    var list = p.followups.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var pts = list.filter(function (e) { return e[metric] !== '' && e[metric] != null && !isNaN(e[metric]); });
    if (pts.length < 2) {
      box.innerHTML = '<div class="chart-empty">至少需要 2 条记录才能画趋势。</div>';
      return;
    }
    var W = 800, H = 260, L = 48, R = 20, T = 22, B = 42;
    var vals = pts.map(function (e) { return Number(e[metric]); });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }
    if (min > 0) min = 0;
    var span = max - min || 1;
    var x = function (i) { return L + (i / (pts.length - 1)) * (W - L - R); };
    var y = function (v) { return T + (1 - (v - min) / span) * (H - T - B); };
    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var gy = T + (g / 4) * (H - T - B);
      var gv = max - (g / 4) * span;
      grid += '<line x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '" stroke="#E5E9E7" stroke-width="1"/>';
      grid += '<text x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#5E6B6F">' + round1(gv) + '</text>';
    }
    var poly = pts.map(function (e, i) { return x(i) + ',' + y(Number(e[metric])); }).join(' ');
    var dots = pts.map(function (e, i) {
      return '<circle cx="' + x(i) + '" cy="' + y(Number(e[metric])) + '" r="4.5" fill="#fff" stroke="' + meta.color + '" stroke-width="2"><title>' + esc(e.date + ' · ' + e[metric] + ' ' + meta.unit) + '</title></circle>';
    }).join('');
    var labels = '';
    pts.forEach(function (e, i) {
      if (pts.length <= 6 || i === 0 || i === pts.length - 1 || i === Math.floor(pts.length / 2)) {
        labels += '<text x="' + x(i) + '" y="' + (H - 14) + '" text-anchor="middle" font-size="10" fill="#5E6B6F">' + esc(e.date.slice(5)) + '</text>';
      }
    });
    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + meta.label + '趋势">' +
      '<text x="' + L + '" y="14" font-size="11" fill="#5E6B6F">' + meta.label + '（' + meta.unit + '）</text>' +
      grid +
      '<polyline points="' + poly + '" fill="none" stroke="' + meta.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + labels + '</svg>';
  }

  function renderFollowTable() {
    var p = active();
    var box = $('#follow-table');
    if (!p || !p.followups.length) {
      box.innerHTML = '<p class="hint">还没有记录。</p>';
      return;
    }
    var isChild = p.type === 'child';
    var list = p.followups.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var head = '<tr><th>日期</th><th>体重</th><th>血酮</th><th>血糖</th>' + (isChild ? '<th>发作</th>' : '') + '<th>依从性</th><th>不良反应</th><th>备注</th><th></th></tr>';
    var rows = list.map(function (e) {
      return '<tr><td>' + esc(e.date) + '</td><td>' + e.weight + ' kg</td><td>' + e.ketone + '</td><td>' + e.glucose + '</td>' +
        (isChild ? '<td>' + e.seizures + '</td>' : '') +
        '<td>' + e.adherence + ' / 5</td><td>' + esc((e.adverse || []).join('、') || '—') + '</td><td>' + esc(e.notes || '—') + '</td>' +
        '<td><button class="btn ghost small" data-del="' + e.id + '">删除</button></td></tr>';
    }).join('');
    box.innerHTML = '<div class="table-wrap"><table class="data"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
    $$('#follow-table [data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-del');
        if (!confirm('删除这条随访记录？')) return;
        p.followups = p.followups.filter(function (e) { return e.id !== id; });
        save();
        renderFollowup();
        toast('已删除');
      });
    });
  }

  /* ================= 报告 ================= */
  function renderReport(mode) {
    currentReport = mode || currentReport;
    var p = active();
    var box = $('#report-preview');
    if (!p || !p.name) {
      box.innerHTML = '<div class="report-sheet"><div class="report-empty">先填写并保存患者信息，再生成报告。</div></div>';
      return;
    }
    var isChild = p.type === 'child';
    var st = followupStatus(p);
    var r = screeningResult();
    var plan = p.plan;
    var html = '';
    if (currentReport === 'doctor') {
      var m = plan ? plan.macros : null;
      var followRows = p.followups.length
        ? p.followups.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).map(function (e) {
          return '<tr><td>' + esc(e.date) + '</td><td>' + e.weight + '</td><td>' + e.ketone + '</td><td>' + e.glucose + '</td>' +
            (isChild ? '<td>' + e.seizures + '</td>' : '<td>—</td>') +
            '<td>' + e.adherence + '</td><td>' + esc((e.adverse || []).join('、') || '—') + '</td><td>' + esc(e.notes || '—') + '</td></tr>';
        }).join('')
        : '<tr><td colspan="8">暂无随访记录</td></tr>';
      html =
        '<div class="report-head"><div class="brandline"><span class="r-brand">酮行 · 生酮患者管理台</span><span class="r-meta">' + esc(fmtDate(todayStr())) + '</span></div>' +
        '<h1>生酮营养管理报告</h1><div class="r-meta">医生版 · 数据与方案摘要</div></div>' +
        section('一、患者信息',
          '<div class="report-grid">' +
          kv('姓名 / 编号', p.name) + kv('类型', isChild ? '儿童癫痫' : '成人超重 / 肥胖') +
          kv('年龄 / 性别', (p.age || '—') + ' 岁 · ' + (p.sex === 'female' ? '女' : '男')) + kv('身高 / 体重', (p.height || '—') + ' cm · ' + (p.weight || '—') + ' kg') +
          kv('BMI', bmiText(p)) + kv('诊断', p.diagnosis || '—') +
          kv('用药 / 合并症', p.meds || '—') + kv(isChild ? '主要照护者' : '减重目标', isChild ? (p.caregiver || '—') : (p.goal || '—')) +
          '</div>') +
        section('二、筛查结论',
          '<div class="report-alert" style="border-left-color:' + (r.level === 'red' ? '#B45A4A' : r.level === 'amber' ? '#C08A3E' : '#4E8B6A') + ';background:' + (r.level === 'red' ? '#F9EDEA' : r.level === 'amber' ? '#FBF3E5' : '#EDF6F0') + ';">' +
          '<strong>' + esc(r.title) + '</strong><br>' + esc(r.text) + (p.screening.notes ? '<br>备注：' + esc(p.screening.notes) : '') + '</div>') +
        section('三、营养方案',
          plan ? (
            '<div class="report-highlight">' +
            '<div class="item"><div class="k">总能量</div><div class="v">' + m.kcal + '</div><div class="k">kcal / 天</div></div>' +
            '<div class="item"><div class="k">脂肪</div><div class="v">' + m.fat + '</div><div class="k">g / 天</div></div>' +
            '<div class="item"><div class="k">蛋白质</div><div class="v">' + m.protein + '</div><div class="k">g / 天</div></div>' +
            '<div class="item"><div class="k">碳水</div><div class="v">' + m.carb + '</div><div class="k">g / 天</div></div>' +
            '</div>' +
            '<p class="table-note">比例：' + esc(plan.ratio) + '；蛋白质 ' + plan.proteinPerKg + ' g/kg × ' + (plan.proteinWeight || p.weight) + ' kg' + (plan.adjustedProtein ? '（调整体重）' : '') + '；' + plan.meals + ' 餐 / 天。总脂肪含食材脂肪，烹调油需按食谱扣除。</p>'
          ) : '<p class="hint">尚未生成方案。</p>') +
        section('四、随访记录',
          '<div class="table-wrap"><table class="data"><thead><tr><th>日期</th><th>体重 kg</th><th>血酮</th><th>血糖</th><th>发作</th><th>依从性</th><th>不良反应</th><th>备注</th></tr></thead><tbody>' + followRows + '</tbody></table></div>' +
          '<div class="report-alert" style="margin-top:12px;border-left-color:' + (st.level === 'red' ? '#B45A4A' : st.level === 'amber' ? '#C08A3E' : '#4E8B6A') + ';background:' + (st.level === 'red' ? '#F9EDEA' : st.level === 'amber' ? '#FBF3E5' : '#EDF6F0') + ';">' +
          '<strong>' + esc(st.title) + '</strong><br>' + esc(st.text) + '</div>') +
        '<div class="report-footer">本报告为营养管理辅助，不构成诊断或处方；具体比例、能量和监测频率需医生 / 临床营养师确认。生成日期：' + esc(fmtDate(todayStr())) + '。</div>';
    } else {
      var pm = plan ? plan.macros : null;
      var who = isChild ? '孩子' : '你';
      html =
        '<div class="report-head"><div class="brandline"><span class="r-brand">酮行 · 生酮患者管理台</span><span class="r-meta">' + esc(fmtDate(todayStr())) + '</span></div>' +
        '<h1>' + (isChild ? '生酮饮食家长版报告' : '生酮饮食患者版报告') + '</h1><div class="r-meta">' + esc(p.name) + ' · ' + (isChild ? '家长使用' : '患者使用') + '</div></div>' +
        section('一、' + who + '的方案',
          pm ? '<div class="report-highlight">' +
            '<div class="item"><div class="k">总能量</div><div class="v">' + pm.kcal + '</div><div class="k">kcal / 天</div></div>' +
            '<div class="item"><div class="k">脂肪</div><div class="v">' + pm.fat + '</div><div class="k">g / 天</div></div>' +
            '<div class="item"><div class="k">蛋白质</div><div class="v">' + pm.protein + '</div><div class="k">g / 天</div></div>' +
            '<div class="item"><div class="k">碳水</div><div class="v">' + pm.carb + '</div><div class="k">g / 天</div></div>' +
            '</div><p class="table-note">分成 ' + plan.meals + ' 餐；具体食物称重和油量按营养师给的食谱执行。</p>'
            : '<p class="hint">方案待生成。</p>') +
        section('二、每天怎么吃',
          '<ul class="report-list">' +
          '<li>按方案称重，不凭感觉；油是方案的一部分，不能少也不能多。</li>' +
          '<li>防隐形碳水：酱料、零食、含糖饮料、糖浆类药物。</li>' +
          '<li>' + (isChild ? '学校 / 外食提前准备便当，先问清楚食材。' : '外食先看配料和酱料，必要时自带。') + '</li>' +
          '<li>不自行加餐、不自行改比例。</li></ul>') +
        section('三、在家怎么监测',
          '<ul class="report-list">' +
          '<li>血酮 / 血糖：按医嘱的时间和频率。</li>' +
          '<li>体重 / 身高：每周固定时间、同一台秤。</li>' +
          '<li>生酮日记：吃了什么、发作几次、排便、精神。</li>' +
          '<li>复诊：通常 1 个月、3 个月，按医生安排。</li></ul>') +
        section('四、出现这些情况，马上联系',
          '<div class="report-alert"><ul class="report-list" style="margin:0;">' +
          '<li>低血糖表现：出冷汗、心慌、手抖、面色苍白、嗜睡；小婴儿可能只是嗜睡、吃奶差、烦躁。</li>' +
          '<li>持续呕吐、腹泻、发热、吃不下。</li>' +
          '<li>发作明显增多，或持续时间变长。</li>' +
          '<li>精神差、叫不醒、反应异常；体重下降过快。</li></ul></div>') +
        section('五、下次复诊',
          '<p class="hint">' + (p.followups.length ? '最近一次记录：' + esc(fmtDate(p.followups[p.followups.length - 1].date)) + '；按医生安排复诊，带上生酮日记和正在吃的药。' : '按医生安排复诊，带上生酮日记和正在吃的药。') + '</p>') +
        '<div class="report-footer">本报告为营养教育与管理辅助，不构成诊断或处方；具体方案需医生 / 临床营养师确认。</div>';
    }
    box.innerHTML = '<div class="report-sheet">' + html + '</div>';
  }

  function section(title, body) {
    return '<div class="report-section"><h2>' + esc(title) + '</h2>' + body + '</div>';
  }
  function kv(k, v) {
    return '<div class="report-kv"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>';
  }

  /* ================= 状态 / 导航 ================= */
  function updateBadges() {
    var p = active();
    var pb = $('#patient-badge');
    if (!p || !p.name) { pb.className = 'badge gray'; pb.textContent = '未建档'; }
    else { pb.className = 'badge green'; pb.textContent = '已建档'; }

    var sr = screeningResult();
    var sb = $('#screen-badge');
    sb.className = 'badge ' + sr.level;
    sb.textContent = sr.level === 'red' ? '有禁忌' : sr.level === 'amber' ? '需评估' : sr.level === 'green' ? '通过' : '未筛查';

    var plb = $('#plan-badge');
    if (p && p.plan) { plb.className = 'badge green'; plb.textContent = '已生成'; }
    else { plb.className = 'badge gray'; plb.textContent = '未生成'; }

    var fb = $('#follow-badge');
    if (p && p.followups.length) {
      var st = followupStatus(p);
      fb.className = 'badge ' + st.level;
      fb.textContent = p.followups.length + ' 次记录';
    } else { fb.className = 'badge gray'; fb.textContent = '未记录'; }

    $$('.step').forEach(function (btn) {
      var tab = btn.getAttribute('data-tab');
      var done = false;
      if (tab === 'patient') done = !!(p && p.name);
      if (tab === 'screening') done = !!(p && p.screening.reviewed);
      if (tab === 'plan') done = !!(p && p.plan);
      if (tab === 'followup') done = !!(p && p.followups.length);
      btn.classList.toggle('done', done);
    });
  }

  function switchTab(name) {
    currentTab = name;
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.id === 'tab-' + name); });
    $$('.step').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); });
    if (name === 'plan') renderPlanOutput();
    if (name === 'food') renderFoodTable();
    if (name === 'followup') { renderFollowup(); renderChart(); }
    if (name === 'report') renderReport(currentReport);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    renderPatientSelect();
    fillPatientForm();
    renderScreening();
    renderPlanForm();
    renderPlanOutput();
    renderFollowup();
    updateBadges();
    if (currentTab === 'report') renderReport(currentReport);
  }

  /* ================= 初始化 ================= */
  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.patients) && parsed.patients.length) state = parsed;
      }
    } catch (e) { }
    if (!state.patients.length) {
      var demo = buildDemo('A');
      if (demo) {
        state.patients.push(demo);
        state.activeId = demo.id;
      } else {
        var p = blankPatient('child');
        state.patients.push(p);
        state.activeId = p.id;
      }
    }
    if (!state.patients.some(function (p) { return p.id === state.activeId; })) {
      state.activeId = state.patients[0].id;
    }
  }

  function bind() {
    $$('.step').forEach(function (b) {
      b.addEventListener('click', function () {
        switchTab(b.getAttribute('data-tab'));
      });
    });
    $('#patient-select').addEventListener('change', function (e) {
      state.activeId = e.target.value;
      save();
      renderAll();
    });
    $('#btn-new').addEventListener('click', createPatient);
    $('#btn-demo-a').addEventListener('click', function () { loadDemo('A'); });
    $('#btn-demo-b').addEventListener('click', function () { loadDemo('B'); });
    $('#btn-load-a').addEventListener('click', function () { loadDemo('A'); });
    $('#btn-load-b').addEventListener('click', function () { loadDemo('B'); });
    $('#btn-save-patient').addEventListener('click', savePatientForm);
    $('#btn-clear-patient').addEventListener('click', function () {
      var p = active();
      if (!p) return;
      fillPatientForm();
      toast('表单已恢复为已保存内容');
    });
    $('#p-type').addEventListener('change', function (e) { toggleTypeFields(e.target.value); });
    $('#screen-notes').addEventListener('input', function (e) {
      var p = active(); if (!p) return;
      p.screening.notes = e.target.value;
      p.screening.reviewed = true;
      save(); updateBadges();
    });
    $('#btn-confirm-screen').addEventListener('click', function () {
      var p = active(); if (!p) return;
      p.screening.reviewed = true;
      save(); renderScreeningResult(); updateBadges();
      toast('筛查结论已确认');
    });
    $('#btn-estimate').addEventListener('click', function () {
      var p = active(); if (!p) return;
      var est = estimateEnergyFor(p);
      if (!est.energy) { toast(est.note); return; }
      $('#pl-energy').value = est.energy;
      toast(est.note);
    });
    $('#pl-ratio').addEventListener('change', toggleCarbInput);
    $('#btn-generate').addEventListener('click', generatePlan);
    $('#food-search').addEventListener('input', renderFoodTable);
    $$('.food-cat').forEach(function (b) {
      b.addEventListener('click', function () {
        foodCat = b.getAttribute('data-food-cat');
        $$('.food-cat').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderFoodTable();
      });
    });
    $('#btn-add-follow').addEventListener('click', addFollowup);
    $('#chart-metric').addEventListener('change', renderChart);
    $$('[data-report]').forEach(function (b) {
      b.addEventListener('click', function () { renderReport(b.getAttribute('data-report')); });
    });
    $('#btn-print').addEventListener('click', function () {
      switchTab('report');
      renderReport(currentReport);
      setTimeout(function () { window.print(); }, 150);
    });
    renderAdverseList();
  }

  loadState();
  bind();
  renderAll();
  switchTab('patient');
})();
