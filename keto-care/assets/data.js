/* 酮行 · 数据与演示案例 */
window.KC_DATA = {

  screening: {
    absolute: [
      '脂肪酸氧化障碍（如 MCAD、LCAD 等）',
      '肉碱缺乏或肉碱循环障碍',
      '丙酮酸羧化酶缺乏',
      '卟啉症'
    ],
    relative: [
      '严重肝肾功能不全',
      '胰腺炎病史或活动期',
      '进食障碍',
      '妊娠 / 哺乳',
      '1 型糖尿病（需严格监督）',
      '严重血脂异常',
      '肾结石 / 高钙尿症',
      '儿童生长发育迟缓',
      '家庭支持或依从性不足'
    ]
  },

  adverse: ['便秘', '恶心', '呕吐', '腹泻', '脱水', '低血糖', '嗜睡 / 精神差', '血脂升高', '肾结石', '其他'],

  foods: [
    { name: '米饭', cat: '主食', carb: 25.9, note: '一小碗约 150g，碳水约 39g' },
    { name: '糙米饭', cat: '主食', carb: 23.0, note: '比白米饭略低，仍属高碳水' },
    { name: '面条（煮）', cat: '主食', carb: 24.0, note: '一碗约 200g，碳水约 48g' },
    { name: '馒头', cat: '主食', carb: 47.0, note: '一个约 100g，碳水约 47g' },
    { name: '白面包', cat: '主食', carb: 58.0, note: '两片约 60g，碳水约 35g' },
    { name: '燕麦片', cat: '主食', carb: 66.0, note: '干重，40g 约 26g 碳水' },
    { name: '玉米（鲜）', cat: '主食', carb: 22.8, note: '一根中等约 200g，碳水约 46g' },
    { name: '红薯', cat: '主食', carb: 20.1, note: '一个约 200g，碳水约 40g' },
    { name: '土豆', cat: '主食', carb: 17.2, note: '一个约 150g，碳水约 26g' },
    { name: '山药', cat: '主食', carb: 12.4, note: '可当蔬菜少量用' },
    { name: '小米粥', cat: '主食', carb: 8.4, note: '稀粥看似少，喝两碗也不少' },
    { name: '粉条', cat: '主食', carb: 84.0, note: '干重，极易忽略' },
    { name: '饼干', cat: '主食', carb: 71.0, note: '隐形碳水重灾区' },
    { name: '蛋糕', cat: '主食', carb: 50.0, note: '含糖和淀粉' },

    { name: '西兰花', cat: '蔬菜', carb: 4.3, note: '相对友好' },
    { name: '菠菜', cat: '蔬菜', carb: 4.5, note: '相对友好' },
    { name: '生菜', cat: '蔬菜', carb: 2.0, note: '相对友好' },
    { name: '黄瓜', cat: '蔬菜', carb: 2.9, note: '相对友好' },
    { name: '番茄', cat: '蔬菜', carb: 4.0, note: '注意番茄酱' },
    { name: '胡萝卜', cat: '蔬菜', carb: 8.8, note: '少量' },
    { name: '南瓜', cat: '蔬菜', carb: 5.3, note: '少量' },
    { name: '茄子', cat: '蔬菜', carb: 4.9, note: '吸油多，注意油量' },
    { name: '青椒', cat: '蔬菜', carb: 5.4, note: '少量' },
    { name: '蘑菇', cat: '蔬菜', carb: 4.1, note: '相对友好' },
    { name: '木耳（干）', cat: '蔬菜', carb: 65.0, note: '干重，泡发后按实际重量算' },
    { name: '海带', cat: '蔬菜', carb: 2.1, note: '相对友好' },

    { name: '苹果', cat: '水果', carb: 13.5, note: '一个约 200g，碳水约 27g' },
    { name: '香蕉', cat: '水果', carb: 22.0, note: '一根约 120g，碳水约 26g' },
    { name: '橙子', cat: '水果', carb: 11.1, note: '一个约 200g，碳水约 22g' },
    { name: '西瓜', cat: '水果', carb: 6.8, note: '容易吃多' },
    { name: '葡萄', cat: '水果', carb: 10.3, note: '一小串就可能超量' },
    { name: '草莓', cat: '水果', carb: 7.1, note: '少量' },
    { name: '蓝莓', cat: '水果', carb: 14.5, note: '少量' },
    { name: '牛油果', cat: '水果', carb: 8.5, note: '总碳水约 8.5g，纤维约 6.7g，净碳水较低' },

    { name: '鸡蛋', cat: '肉蛋豆', carb: 2.8, note: '一个约 50g，碳水约 1.4g' },
    { name: '鸡胸肉', cat: '肉蛋豆', carb: 2.5, note: '相对友好' },
    { name: '牛肉', cat: '肉蛋豆', carb: 2.0, note: '相对友好' },
    { name: '猪肉', cat: '肉蛋豆', carb: 2.4, note: '注意加工肉制品' },
    { name: '三文鱼', cat: '肉蛋豆', carb: 0.0, note: '相对友好' },
    { name: '虾', cat: '肉蛋豆', carb: 1.5, note: '相对友好' },
    { name: '豆腐', cat: '肉蛋豆', carb: 4.2, note: '北豆腐更低' },
    { name: '豆浆', cat: '肉蛋豆', carb: 1.1, note: '无糖' },

    { name: '牛奶', cat: '奶制品', carb: 5.0, note: '一杯 250ml，碳水约 12.5g' },
    { name: '酸奶', cat: '奶制品', carb: 9.0, note: '含糖酸奶更高' },
    { name: '奶酪', cat: '奶制品', carb: 3.5, note: '相对友好' },
    { name: '淡奶油', cat: '奶制品', carb: 3.0, note: '注意用量' },
    { name: '黄油', cat: '奶制品', carb: 0.9, note: '相对友好' },

    { name: '橄榄油', cat: '油脂坚果', carb: 0.0, note: '纯脂肪' },
    { name: '椰子油', cat: '油脂坚果', carb: 0.0, note: '纯脂肪' },
    { name: '花生', cat: '油脂坚果', carb: 16.0, note: '一小把约 30g，碳水约 5g' },
    { name: '杏仁', cat: '油脂坚果', carb: 22.0, note: '一小把约 30g，碳水约 6.6g' },
    { name: '核桃', cat: '油脂坚果', carb: 14.0, note: '一小把约 30g，碳水约 4.2g' },
    { name: '夏威夷果', cat: '油脂坚果', carb: 14.0, note: '相对友好，注意热量' },
    { name: '芝麻酱', cat: '油脂坚果', carb: 16.0, note: '火锅蘸料常见' },

    { name: '酱油', cat: '调味零食', carb: 10.0, note: '少量使用' },
    { name: '番茄酱', cat: '调味零食', carb: 25.0, note: '隐形碳水' },
    { name: '沙拉酱', cat: '调味零食', carb: 15.0, note: '隐形碳水' },
    { name: '蚝油', cat: '调味零食', carb: 20.0, note: '隐形碳水' },
    { name: '可乐', cat: '调味零食', carb: 10.6, note: '一罐 330ml，碳水约 35g' },
    { name: '果汁', cat: '调味零食', carb: 10.0, note: '一杯 250ml，碳水约 25g' },
    { name: '巧克力', cat: '调味零食', carb: 60.0, note: '高糖' },
    { name: '冰淇淋', cat: '调味零食', carb: 24.0, note: '高糖' },
    { name: '薯片', cat: '调味零食', carb: 50.0, note: '高碳水高脂' },
    { name: '蜂蜜', cat: '调味零食', carb: 75.0, note: '一勺约 20g，碳水约 15g' },
    { name: '白砂糖', cat: '调味零食', carb: 99.0, note: '隐形碳水' }
  ],

  demo: [
    {
      key: 'A',
      label: '案例 A · 6 岁癫痫患儿',
      patient: {
        name: '案例 A · 6 岁男童', type: 'child', age: 6, sex: 'male',
        height: 115, weight: 20, diagnosis: '难治性癫痫',
        meds: '丙戊酸 + 左乙拉西坦', caregiver: '妈妈', goal: ''
      },
      screening: { absolute: [], relative: [], notes: '医生已建议生酮，家长配合度好。' },
      plan: { energy: 1400, proteinPerKg: 1.2, ratio: '3:1', carbLimit: 20, meals: 4 },
      followups: [
        { date: '2026-11-01', weight: 20.0, ketone: 0.8, glucose: 4.6, seizures: 4, adherence: 4, adverse: ['便秘'], notes: '启动第 1 周，轻度便秘。' },
        { date: '2026-11-08', weight: 19.8, ketone: 1.2, glucose: 4.4, seizures: 3, adherence: 5, adverse: [], notes: '便秘缓解，学校午餐已自带。' },
        { date: '2026-11-15', weight: 19.9, ketone: 1.5, glucose: 4.5, seizures: 2, adherence: 5, adverse: [], notes: '发作减少，继续当前方案。' }
      ]
    },
    {
      key: 'B',
      label: '案例 B · 35 岁超重女性',
      patient: {
        name: '案例 B · 35 岁女性', type: 'adult', age: 35, sex: 'female',
        height: 165, weight: 85, diagnosis: '超重 / 肥胖，脂肪肝',
        meds: '高血压（氨氯地平）', caregiver: '', goal: '3 个月减 8%'
      },
      screening: { absolute: [], relative: [], notes: '无生酮禁忌，依从性一般，需加强随访。' },
      plan: { energy: 1500, proteinPerKg: 1.4, ratio: 'MAD', carbLimit: 25, meals: 3 },
      followups: [
        { date: '2026-11-01', weight: 85.0, ketone: 0.6, glucose: 5.6, seizures: 0, adherence: 3, adverse: ['便秘'], notes: '启动第 1 周，外食较多。' },
        { date: '2026-11-08', weight: 83.8, ketone: 1.0, glucose: 5.2, seizures: 0, adherence: 4, adverse: [], notes: '学会看酱料标签。' },
        { date: '2026-11-15', weight: 82.9, ketone: 1.2, glucose: 5.0, seizures: 0, adherence: 4, adverse: [], notes: '体重下降，精神好。' }
      ]
    }
  ]
};
