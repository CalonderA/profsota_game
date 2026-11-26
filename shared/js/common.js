/* ============================================================
   СОТА — Общее игровое ядро симулятора «Шахта Знаний»
   ============================================================ */
'use strict';

// Глобальные реестры мини-игр и отрисовщиков для модулей специальностей
window.MINI_GAMES = window.MINI_GAMES || {};
window.registerMinigame = function(id, cfg){ window.MINI_GAMES[id] = cfg; };
window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.registerStationRenderer = function(spec, fn){ window.STATION_RENDERERS[spec] = fn; };


  /* ============================================================
     Константы и холст
     ============================================================ */
  const W = 23, H = 15, TILE = 44;
  const VW = W * TILE, VH = H * TILE;
  const WALL = 1, FLOOR = 0;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  window.ctx = ctx;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Размер холста подгоняется под контейнер: камера показывает доступную
  // часть карты, а тайлы никогда не становятся меньше ~35 CSS-пикселей.
  let cssW = 0, cssH = 0;
  let zoom = 1, camX = 0, camY = 0;
  const MIN_TILE_PX = 35;

  function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, Math.round(rect.width));
    cssH = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 250));

  /* ============================================================
     Вопросы специальности (КИПиА и ТС)
     ============================================================ */
  let QUESTIONS = [
    { spec:'kip', q:'На автоматической линии замигал сигнал ошибки. Каким прибором мастер КИПиА проверит напряжение, ток и целостность цепи?', a:['Мультиметром (тестером)','Лазерным дальномером','Барометром-анероидом','Штангенциркулем'], c:0, fact:'Мультиметр — базовый прибор наладчика для поиска обрывов и замера параметров.' },
    { spec:'kip', q:'В заводской печи плавят металл при температуре +800 °C. Какой датчик использует наладчик для замера такой жары?', a:['Термопару (спай двух металлов)','Обычный ртутный термометр','Лазерный сканер штрихкодов','Спиртовой градусник'], c:0, fact:'Термопара преобразует нагрев в термо-ЭДС (милливольты) для экстремальных температур.' },
    { spec:'kip', q:'Стрелка манометра на щите управления показывает давление. В какой цвет на шкале окрашивают аварийно опасную зону?', a:['Красный','Зелёный','Синий','Белый'], c:0, fact:'Красный сектор предупреждает оператора о риске аварии оборудования.' },
    { spec:'kip', q:'Какой стандартный токовый сигнал чаще всего используют промышленные аналоговые датчики автоматики?', a:['4–20 мА','100–200 А','1–2 мкА','220 В'], c:0, fact:'Стандарт 4–20 мА позволяет сразу обнаружить обрыв кабеля при токе ниже 4 мА.' },
    { spec:'kip', q:'Электромагнитное устройство в шкафу управления, замыкающее силовые контакты по слабому сигналу контроллера:', a:['Реле (контактор)','Трансформаторный болт','Плавкий предохранитель','Амперметр'], c:0, fact:'Реле безопасным напряжением 24 В коммутирует мощные двигатели 380 В.' },
    { spec:'kip', q:'Зачем металлические шкафы автоматики и корпуса станков соединяют с контуром заземления?', a:['Для защиты людей от удара током при пробое изоляции','Чтобы корпус красивее блестел','Чтобы ускорить передачу данных','Для охлаждения микросхем'], c:0, fact:'Заземление отводит опасный ток в землю, мгновенно отключая автомат защиты.' },
    { spec:'kip', hard:true, q:'Почему в промышленных токовых петлях 4–20 мА «живой ноль» принят равным именно 4 мА, а не 0 мА?', a:['Чтобы отличать нулевое значение параметра от физического обрыва кабеля','Потому что контроллеры не считывают ноль','Для экономии заводской электроэнергии','Это историческая случайность'], c:0, fact:'При токе менее 3.6 мА контроллер АСУ ТП немедленно регистрирует обрыв линии.' },
    { spec:'kip', hard:true, q:'Какое сопротивление имеет стандартный платиновый термопреобразователь Pt100 при 0 °C?', a:['Ровно 100 Ом','Ровно 0 Ом','1000 Ом','47 кОм'], c:0, fact:'Обозначение Pt100 означает Platinum 100 Ом при 0 °C по ГОСТ 6651.' },
    { spec:'kip', hard:true, q:'Протокол HART передаёт цифровые данные поверх токовой петли 4–20 мА за счёт:', a:['Частотной модуляции (FSK) слабым высокочастотным сигналом без влияния на постоянный ток 4–20 мА','Резкого отключения питания каждые 5 миллисекунд','Инфракрасного светодиода на корпусе','Прерывания потока воздуха'], c:0, fact:'HART накладывает синусоиды 1200 и 2200 Гц амплитудой 0.5 мА прямо на аналоговый ток.' },
    { spec:'kip', hard:true, q:'В ПИД-регуляторе интегральная составляющая (И-компонента) предназначена для:', a:['Полного устранения статической ошибки рассогласования','Гашения резких скачков давления','Отключения питания при перегрузке','Снижения шума электродвигателя'], c:0, fact:'Интегральная часть накапливает ошибку во времени и сводит её строго к нулю.' },
    { spec:'kip', hard:true, q:'Что означает класс точности образцового манометра 0.4 на лабораторном стенде СОТА?', a:['Максимальная приведённая погрешность прибора не превышает ±0.4% от диапазона шкалы','Прибор измеряет давление только до 0.4 бар','Прибор изготовлен 4 месяца назад','Время реакции стрелки составляет 0.4 с'], c:0, fact:'Чем меньше цифра класса точности, тем точнее прибор. Образцовые манометры имеют класс 0.4 и 0.25.' },
    { spec:'kip', hard:true, q:'Какой чувствительный элемент выпрямляется под внутренним давлением в классическом манометре?', a:['Полая трубка Бурдона овального сечения','Биметаллическая пластина','Пьезокристалл кварца','Ртутный шарик'], c:0, fact:'Давление внутри трубки Бурдона стремится округлить её сечение, вызывая разгибание.' },
    { spec:'kip', type:'slider', min:4, max:20, step:1, answer:12, unit:'мА', q:'Какой ток (в мА) выдаёт исправный датчик 4–20 мА при измеряемом давлении 50% шкалы?', fact:'Диапазон равен 16 мА (от 4 до 20). 50% = 4 мА + 8 мА = ровно 12 мА.' },
    { spec:'kip', type:'slider', min:5, max:48, step:1, answer:24, unit:'В', q:'Какое напряжение постоянного тока (DC) стандартно питает датчики и контроллеры в шкафах автоматики?', fact:'24 В постоянного тока — общепринятый стандарт промышленной автоматики.' },

    { spec:'ts', q:'Стрелка манометра на тепловом узле подскочила выше нормы. Какое устройство автоматически спасёт трубу от разрыва?', a:['Предохранительный сбросной клапан','Обычный водосчётчик','Инфракрасный термометр','Электросчётчик'], c:0, fact:'Предохранительный клапан сбрасывает избыток теплоносителя, защищая котлы и трубы.' },
    { spec:'ts', q:'Что чаще всего циркулирует под давлением в трубах центрального отопления в качестве теплоносителя?', a:['Специально подготовленная и умягчённая горячая вода','Сырая сыпучая нефть','Сжатый сухой воздух','Подсолнечное масло'], c:0, fact:'Воду очищают и умягчают, чтобы в котлах и радиаторах не образовывалась накипь.' },
    { spec:'ts', q:'Каким прибором инженер-теплотехник бесконтактно сканирует фасад здания для поиска утечек тепла?', a:['Тепловизором (инфракрасной камерой)','Лазерным уровнем','Оптическим биноклем','Толщиномером'], c:0, fact:'Тепловизор визуализирует инфракрасное излучение: места утечек тепла светятся жёлтым и красным.' },
    { spec:'ts', q:'Какое оборудование непрерывно создаёт циркуляцию горячей воды по замкнутому контуру отопления здания?', a:['Циркуляционный насос','Компрессор кондиционера','Воздушный вентилятор','Пожарный гидрант'], c:0, fact:'Циркуляционные насосы преодолевают сопротивление труб, подавая тепло на все этажи.' },
    { spec:'ts', q:'В каких единицах чаще всего градуируется шкала манометров в тепловых пунктах и котельных?', a:['Бар или Мегапаскали (МПа)','Ватты или Киловатты','Литры в секунду','Градусы Кельвина'], c:0, fact:'1 бар ≈ 1 атмосфера (0.1 МПа). В городских теплосетях рабочее давление обычно 4–10 бар.' },
    { spec:'ts', q:'Зачем наружные трубопроводы теплотрассы укутывают толстым слоем минеральной ваты и оцинкованным металлом?', a:['Чтобы снизить потери тепла в окружающий холодный воздух','Для защиты от птиц и кошек','Чтобы трубы не вибрировали от ветра','Исключительно для красоты'], c:0, fact:'Теплоизоляция сохраняет до 95% тепла на пути теплоносителя от источника к потребителям.' },
    { spec:'ts', q:'В начале отопительного сезона верх радиатора остаётся холодным, а снизу едва тёплый. Что необходимо сделать?', a:['Стравить скопившийся воздух через кран Маевского','Ударить по батарее молотком','Перекрыть весь стояк','Покрасить батарею в чёрный цвет'], c:0, fact:'Воздушная пробка блокирует циркуляцию; сброс воздуха через кран мгновенно возвращает прогрев.' },
    { spec:'ts', q:'Аппарат в тепловом пункте, где сетевая вода от ТЭЦ нагревает воду для домашнего крана, не смешиваясь с ней:', a:['Пластинчатый теплообменник','Электрический чайник','Гидравлический пресс','Фильтр грубой очистки'], c:0, fact:'Через гофрированные стальные пластины тепло переходит из греющего контура в нагреваемый.' },
    { spec:'ts', hard:true, q:'Опасное гидродинамическое явление, когда при падении давления вода вскипает, а схлопывающиеся пузырьки разрушают крыльчатку насоса:', a:['Кавитация','Конвекция','Диффузия','Сублимация'], c:0, fact:'Кавитация издаёт треск перемалывания гравия и способна быстро разрушить рабочее колесо насоса.' },
    { spec:'ts', hard:true, q:'Резкий скачок давления в трубопроводе при мгновенной остановке потока (быстром закрытии задвижки):', a:['Гидравлический удар (формула Жуковского)','Тепловое расширение','Эффект Доплера','Электростатический разряд'], c:0, fact:'Волна гидравлического удара распространяется со скоростью звука в воде (~1200 м/с). Задвижки закрывают плавно!' },
    { spec:'ts', hard:true, q:'Зачем в толще пенополиуретановой (ППУ) изоляции труб проложены медные проводники (система ОДК)?', a:['Для дистанционного обнаружения намокания изоляции и точной локализации свища импульсным рефлектометром','Для подогрева труб электрическим током','Для заземления стальной трубы','Для радиосвязи с диспетчером'], c:0, fact:'Система ОДК позволяет с поверхности найти место повреждения трубы с точностью до 1 метра.' },
    { spec:'ts', hard:true, q:'В чём главное преимущество независимой схемы подключения отопления через теплообменник?', a:['Гидравлическая изолированность здания: скачки давления в магистрали ТЭЦ не передаются в батареи квартир','Вода в батареях нагревается выше пара','Отсутствие необходимости в насосах','Снижение расхода воды в 10 раз'], c:0, fact:'При независимой схеме контур дома автономен и защищен от аварий на городской теплотрассе.' },
    { spec:'ts', hard:true, q:'Графическое изображение напоров в подающем и обратном трубопроводах вдоль всей протяжённости теплотрассы:', a:['Пьезометрический график','Эпюра изгибающих моментов','Диаграмма Венна','Спектрограмма теплоносителя'], c:0, fact:'По пьезометру теплотехники контролируют давление, предотвращая вскипание и разрывы труб.' },
    { spec:'ts', hard:true, q:'Почему в закрытых системах теплоснабжения обязательно устанавливают мембранный расширительный бак?', a:['Вода несжимаема: при нагреве её расширение создало бы разрушительный скачок давления','Чтобы в трубах всегда был воздух','Для запаса питьевой воды','Для циркуляции без насоса'], c:0, fact:'Мембранный бак компенсирует тепловое расширение воды, удерживая стабильное давление.' },
    { spec:'ts', type:'slider', min:70, max:160, step:5, answer:150, unit:'°C', q:'Какая температура горячей сетевой воды (в °C) подаётся в магистраль в сильный мороз по графику «150/70»?', fact:'Под давлением 8–10 бар вода не закипает даже при 150 °C, перенося тепло в город.' },
    { spec:'ts', type:'slider', min:15, max:28, step:1, answer:20, unit:'°C', q:'Какая комфортная нормативная температура воздуха (в °C) должна поддерживаться в жилых комнатах зимой по ГОСТ?', fact:'Нормативная температура в жилых комнатах составляет от +20 °C до +22 °C.' }
  ];

  /* ---- вопросы из questions.json (файл можно править без сборки) ---- */
  let questionsSource = 'builtin';
  async function loadQuestions(){
    if (window.CURRENT_SPEC === 'p' && window.P_QUESTIONS) QUESTIONS = window.P_QUESTIONS;
    if (window.CURRENT_SPEC === 'ksk' && window.KSK_QUESTIONS) QUESTIONS = window.KSK_QUESTIONS;
    try {
      let res = null;
      const candidates = (currentSpec === 'p' || currentSpec === 'ksk') ? ['../../questions.json', '../../data/questions.json'] : ['/data/questions.json', '../../data/questions.json', 'data/questions.json', '/questions.json', 'questions.json'];
      for (const p of candidates) {
        try {
          const r = await fetch(p, { cache: 'no-store' });
          if (r.ok) { res = r; break; }
        } catch (_) {}
      }
      if (!res) throw new Error('questions.json не найден ни по одному из путей');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('пустой или некорректный файл');
      const valid = data.filter(q => q && typeof q.q === 'string' &&
        (q.type === 'slider' ? typeof q.answer === 'number' : Array.isArray(q.a) && q.a.length >= 2));
      if (!valid.length) throw new Error('нет валидных вопросов');
      QUESTIONS = valid;
      questionsSource = 'json';
    } catch (e) {
      console.warn('[Шахта Знаний] questions.json не загружен — используется встроенный набор.', e);
      questionsSource = 'builtin';
    }
    decks.easy = [];
    decks.hard = [];
    updateQuestionsBadge();
  }

  function updateQuestionsBadge(){
    const b = el('qSource');
    if (!b) return;
    const n = QUESTIONS.length;
    b.textContent = n + ' ' + plural(n, 'вопрос', 'вопроса', 'вопросов') + ' · ' +
      (questionsSource === 'json' ? 'questions.json' : 'встроенный набор');
    b.classList.toggle('warn', questionsSource !== 'json');
  }

  /* ============================================================
     Города Смоленской области (расстояние до СОТЫ в Смоленске, км)
     ============================================================ */
  const CITIES = [
    { name: 'Печерск', km: 8 },
    { name: 'Смоленск (ТЭЦ-2)', km: 10, major: true, tag: 'ТЭЦ и энергокластер' },
    { name: 'Кардымово', km: 31 },
    { name: 'Красный', km: 48 },
    { name: 'Монастырщина', km: 49 },
    { name: 'Починок', km: 52 },
    { name: 'Духовщина', km: 56 },
    { name: 'Ярцево', km: 60, major: true, tag: 'Литейно-трубный завод ТМК' },
    { name: 'Глинка', km: 62 },
    { name: 'Рудня', km: 68 },
    { name: 'Стодолище', km: 70 },
    { name: 'Хиславичи', km: 73 },
    { name: 'Демидов', km: 74 },
    { name: 'Ельня', km: 81 },
    { name: 'Верхнеднепровский', km: 85, major: true, tag: 'Дорогобужская ТЭЦ и ПАО «Дорогобуж»' },
    { name: 'Дорогобуж', km: 88, major: true, tag: 'Химический кластер' },
    { name: 'Сафоново', km: 98, major: true, tag: 'Электромаш (СЭЗ) и Гидрометприбор' },
    { name: 'Озёрный', km: 105, major: true, tag: 'Смоленская ГРЭС' },
    { name: 'Велиж', km: 112 },
    { name: 'Рославль', km: 116, major: true, tag: 'Вагоноремонтный завод (РВРЗ)' },
    { name: 'Шумячи', km: 138 },
    { name: 'Ершичи', km: 142 },
    { name: 'Холм-Жирковский', km: 145 },
    { name: 'Десногорск', km: 145, major: true, tag: 'Смоленская АЭС (САЭС)' },
    { name: 'Угра', km: 148 },
    { name: 'Вязьма', km: 168, major: true, tag: 'Машиностроение (ВМЗ)' },
    { name: 'Тёмкино', km: 205 },
    { name: 'Новодугино', km: 208 },
    { name: 'Сычёвка', km: 230 },
    { name: 'Гагарин', km: 238, major: true, tag: 'Деревообработка и приборостроение' }
  ];

  // одна шахта ≈ 45 км пути, но не больше 5 шахт даже из самого далёкого города
  function minesFor(km){
    return clamp(Math.ceil(km / 45), 2, 5);
  }
  function plural(n, one, few, many){
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  /* ============================================================
     Специальности СОТА
     ============================================================ */
  const urlParams = new URLSearchParams(window.location.search);
  let currentSpec = (window.CURRENT_SPEC || urlParams.get('spec') || 'kip').toLowerCase();

  const SPECS = {
    kip: {
      code: 'КИП',
      codeFull: '15.01.37',
      title: 'Цех КИП',
      specName: 'Мастер контрольно-измерительных приборов и автоматики',
      floorName: 'Цех',
      unitName: 'Приборы',
      unitSingular: 'прибор',
      eventSeq: ['calib', 'wires', 'pid', 'calib']
    },
    ts: {
      code: 'ТС',
      codeFull: '13.02.02',
      title: 'Лаборатория ТС',
      specName: 'Теплоснабжение и теплотехническое оборудование',
      floorName: 'Цех',
      unitName: 'Задания',
      unitSingular: 'узел',
      eventSeq: ['pipes', 'bypass', 'exchanger', 'pipes']
    },
    e: {
      code: 'Э',
      codeFull: '13.02.13',
      title: 'Электроучасток Э',
      specName: 'Электрооборудование и электрохозяйство',
      floorName: 'Цех',
      unitName: 'Задания',
      unitSingular: 'узел',
      eventSeq: []
    },
    reu: {
      code: 'РЭУ',
      codeFull: '11.02.16',
      title: 'Лаборатория РЭУ',
      specName: 'Электронные приборы и устройства',
      floorName: 'Лаборатория',
      unitName: 'Модули',
      unitSingular: 'модуль',
      eventSeq: []
    },
    p: {
      code: 'П',
      codeFull: '09.02.07',
      title: 'IT-отдел П',
      specName: 'Информационные системы и программирование',
      floorName: 'Сектор',
      unitName: 'Задачи',
      unitSingular: 'задачу',
      eventSeq: []
    },
    ksk: {
      code: 'КСК',
      codeFull: '09.02.01',
      title: 'Серверная КСК',
      specName: 'Компьютерные системы и комплексы',
      floorName: 'Сектор',
      unitName: 'Стойки',
      unitSingular: 'стойку',
      eventSeq: []
    }
  };

  if (!SPECS[currentSpec]) {
    try { window.location.replace('../../menu.html'); } catch(_) {}
    currentSpec = 'kip';
  }
  window.currentSpec = currentSpec;
  const directPractice = currentSpec === 'p' || currentSpec === 'ksk' || currentSpec === 'kip' || currentSpec === 'ts';

  /* ============================================================
     Состояние игры
     ============================================================ */
  const LIGHT = 5.3;                 // радиус фонаря в тайлах
  let state = 'title';               // title | playing | question | minigame | dead
  let map = [], seen = [], bright = [];
  let depth = 1, score = 0, answerStreak = 0;
  let chosenCity = null, startKm = 0, totalMines = 3, completedMines = 0, runOre = 0;
  let fuel = 100, hp = 100;
  let needed = 3, collected = 0;
  let crystals = [], exitCell = { x: 1, y: 1 }, exitOpen = false;
  let player = { gx: 1, gy: 1, x: 0, y: 0, dir: 1 };
  const decks = { easy: [], hard: [] };
  let activeQuestion = null, activeCrystal = null, lastAnswerOk = false, answerLock = false;
  const EXIT_QUESTION_PENALTY = 75;
  const EVENT_COUNT_BY_MINES = { 2: 1, 3: 2, 4: 3, 5: 4 };
  // Список доступных событий между этажами: КИП и ТС
  const AVAILABLE_EVENTS = ['calib', 'wires', 'pid', 'pipes', 'bypass', 'exchanger'];
  let scheduledEvents = new Map();
  let particles = [], lastTime = performance.now();
  let shake = 0, flash = 0, flashColor = '255,120,90';
  let autoPath = [], autoNext = 0, tapTarget = null;
  let pickups = [], hintUsed = false;
  let speech = null;
  let best = 0;
  try { best = Number(localStorage.getItem('mine_best')) || 0; } catch (e) { best = 0; }

  /* ============================================================
     Утилиты
     ============================================================ */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function hash(x, y){
    let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  /* -------- звук -------- */
  let actx = null;
  function audio(){
    if (!actx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    return actx;
  }
  function tone(freq, dur, type, vol){
    const a = audio();
    if (!a) return;
    if (a.state === 'suspended') a.resume();
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.7), a.currentTime + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.09 : vol, a.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
  }
  const sfx = {
    step(){ tone(rnd(90, 130), 0.06, 'triangle', 0.03); },
    bump(){ tone(70, 0.09, 'square', 0.045); },
    good(){ tone(660, 0.16, 'sine', 0.09); setTimeout(() => tone(990, 0.22, 'sine', 0.07), 90); },
    combo(){ tone(520, 0.12, 'sine', 0.09); setTimeout(() => tone(780, 0.16, 'sine', 0.08), 80); setTimeout(() => tone(1040, 0.2, 'sine', 0.07), 160); },
    bad(){ tone(180, 0.28, 'sawtooth', 0.07); setTimeout(() => tone(110, 0.3, 'sawtooth', 0.06), 110); },
    descend(){ tone(320, 0.2, 'sine', 0.08); setTimeout(() => tone(220, 0.3, 'sine', 0.07), 120); setTimeout(() => tone(150, 0.4, 'sine', 0.06), 260); },
    pick(){ tone(880, 0.09, 'square', 0.05); }
  };

  /* ============================================================
     Генерация уровня
     ============================================================ */
  function floodRegions(m){
    const labels = Array.from({ length: H }, () => new Array(W).fill(-1));
    let best = null, id = 0;
    for (let y = 0; y < H; y++){
      for (let x = 0; x < W; x++){
        if (m[y][x] === WALL || labels[y][x] !== -1) continue;
        const cells = [];
        const q = [[x, y]];
        labels[y][x] = id;
        for (let i = 0; i < q.length; i++){
          const [cx, cy] = q[i];
          cells.push([cx, cy]);
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (m[ny][nx] === WALL || labels[ny][nx] !== -1) continue;
            labels[ny][nx] = id;
            q.push([nx, ny]);
          }
        }
        if (!best || cells.length > best.cells.length) best = { id, cells };
        id++;
      }
    }
    return best;
  }

  /* ============================================================
     Конфигурация рабочих станций по специальностям (5 станций)
     ============================================================ */
  const WORKSTATION_DEFS = {
    kip: [
      {
        x: 4, y: 4, type: 0,
        title: 'Контрольно-измерительные приборы',
        icon: '⏱',
        actionType: 'question',
        filterKeyword: 'прибор|мультиметр|манометр|измерени',
        hard: false
      },
      {
        x: 11, y: 4, type: 1,
        title: 'Диагностика и наладка оборудования',
        icon: '〰',
        actionType: 'question',
        filterKeyword: 'наладить|сигнал|осциллограф|ошибк|калибров',
        hard: false
      },
      {
        x: 18, y: 4, type: 2,
        title: 'Исполнительные механизмы и приводы',
        icon: '⚙',
        actionType: 'minigame',
        minigameId: 'pid',
        hard: true
      },
      {
        x: 4, y: 10, type: 3,
        title: 'Датчики и измерительные системы',
        icon: '🛜',
        actionType: 'minigame',
        minigameId: 'calib',
        hard: false
      },
      {
        x: 18, y: 10, type: 4,
        title: 'Электрические схемы и щитное оборудование',
        icon: '⚡',
        actionType: 'minigame',
        minigameId: 'wires',
        hard: false
      }
    ],
    ts: [
      {
        x: 4, y: 4, type: 0,
        title: 'Контрольно-измерительные приборы (КИП)',
        icon: '⏱',
        actionType: 'question',
        filterKeyword: 'манометр|термометр|давление|расход',
        hard: false
      },
      {
        x: 11, y: 4, type: 1,
        title: 'Теплогенерирующее и насосное оборудование',
        icon: '⚙',
        actionType: 'minigame',
        minigameId: 'bypass',
        hard: false
      },
      {
        x: 18, y: 4, type: 2,
        title: 'Котельные установки и системы теплоснабжения',
        icon: '🔥',
        actionType: 'question',
        filterKeyword: 'котел|горелк|пар|тэг|тэц|теплоснабжени',
        hard: true
      },
      {
        x: 4, y: 10, type: 3,
        title: 'Трубопроводы и арматура (монтаж и наладка)',
        icon: '🔧',
        actionType: 'minigame',
        minigameId: 'pipes',
        hard: false
      },
      {
        x: 18, y: 10, type: 4,
        title: 'Теплообменное оборудование и теплотехника',
        icon: '♨',
        actionType: 'minigame',
        minigameId: 'exchanger',
        hard: true
      }
    ]
  };

  function getStationDefs(){
    return WORKSTATION_DEFS[currentSpec] || [
      { x: 4, y: 4, type: 0, title: 'Узел 1: Диагностика', icon: '⏱', actionType: 'question', hard: false },
      { x: 11, y: 4, type: 1, title: 'Узел 2: Наладка', icon: '⚙', actionType: 'question', hard: false },
      { x: 18, y: 4, type: 2, title: 'Узел 3: Контроль', icon: '〰', actionType: 'question', hard: true },
      { x: 4, y: 10, type: 3, title: 'Узел 4: Системы', icon: '🛜', actionType: 'question', hard: false },
      { x: 18, y: 10, type: 4, title: 'Узел 5: Автоматика', icon: '⚡', actionType: 'question', hard: false }
    ];
  }

  function makeWorkshop(){
    const m = [];
    for (let y = 0; y < H; y++){
      const row = [];
      for (let x = 0; x < W; x++){
        // Верхние 2 ряда (y = 0..1) — стена цеха
        // Нижний ряд (y = 14) — защитный бортик
        // Левый (x = 0) и правый (x = 22) столбцы — боковые стены
        const isWall = (y <= 1) || (y === H - 1) || (x === 0) || (x === W - 1);
        row.push(isWall ? WALL : FLOOR);
      }
      m.push(row);
    }
    // Центральный стол с чертежами (x = 10..12, y = 8) — физическое препятствие для реалистичной навигации
    m[8][10] = WALL;
    m[8][11] = WALL;
    m[8][12] = WALL;
    return m;
  }

  function newLevel(){
    stopAuto();
    map = makeWorkshop();
    if (currentSpec === 'p' && typeof setupPMap === 'function') setupPMap(map);
    if (currentSpec === 'ksk' && typeof setupKskMap === 'function') setupKskMap(map);
    seen = Array.from({ length: H }, () => new Array(W).fill(1));
    bright = Array.from({ length: H }, () => new Array(W).fill(1));

    needed = 5;
    collected = 0;
    exitOpen = false;

    // Игрок стартует в центральном проходе цеха (перед чертёжным столом)
    const start = { x: 11, y: 6 };
    player.gx = start.x; player.gy = start.y;
    player.x = start.x * TILE + TILE / 2;
    player.y = start.y * TILE + TILE / 2;
    player.dir = 1;

    // Выходная золотая дверь на правой стене
    exitCell = { x: 21, y: 6 };

    // 5 специализированных рабочих мест (в точности по референсам)
    let defs = getStationDefs();
    if (currentSpec === 'ksk' && typeof KSK_STATIONS !== 'undefined') {
      defs = KSK_STATIONS.map((s, i) => ({
        x: s.x, y: s.y, type: s.type,
        title: s.title || KSK_NAMES[s.type],
        icon: s.icon || '💻',
        actionType: s.actionType || 'question',
        minigameId: s.minigameId || null,
        hard: !!s.hard
      }));
    } else if (currentSpec === 'p' && typeof P_STATIONS !== 'undefined') {
      defs = P_STATIONS.map((s, i) => ({
        x: s.x, y: s.y, type: s.type,
        title: s.title || (typeof P_NAMES !== 'undefined' ? P_NAMES[s.type] : ('Узел ' + (s.type + 1))),
        icon: s.icon || '⚡',
        actionType: s.actionType || 'question',
        minigameId: s.minigameId || null,
        hard: !!s.hard
      }));
    }
    crystals = defs.map((s, i) => ({
      id: i,
      x: s.x, y: s.y,
      stationType: s.type,
      title: s.title,
      icon: s.icon,
      actionType: s.actionType,
      minigameId: s.minigameId || null,
      filterKeyword: s.filterKeyword || null,
      done: false, cracked: false,
      hard: !!s.hard,
      seed: (i + 1) * 31.4
    }));

    if (currentSpec === 'p' || currentSpec === 'ksk') needed = crystals.length;
    pickups = [];
    particles = [];
    updateHUD();
  }

  /* ============================================================
     HUD и интерфейс специальности
     ============================================================ */
  const el = id => document.getElementById(id);
  function initSpecUI(){
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    if (el('specBadge')){
      el('specBadge').textContent = specCfg.code;
      el('specBadge').className = 'spec-banner-code ' + currentSpec;
    }
    if (el('specTitle')) el('specTitle').textContent = specCfg.title;
    if (el('specSub')) el('specSub').textContent = 'Специальность ' + specCfg.codeFull;
    if (el('ruleUnitTitle')) el('ruleUnitTitle').textContent = 'Станции цеха';
    if (el('startMainTitle')) el('startMainTitle').textContent = 'ПУТЬ К СОТЕ: ' + specCfg.title;
    if (el('hudBrand')) el('hudBrand').textContent = 'ПУТЬ К СОТЕ';
    if (el('hudSub')) el('hudSub').textContent = ' · ' + specCfg.title;
    if (el('floorLabel')) el('floorLabel').textContent = '</> ' + (specCfg.floorName || 'Цех');
    if (el('unitLabel')) el('unitLabel').textContent = '💎 Задания';
    if (el('modeBadge')) el('modeBadge').textContent = 'Практика · ' + specCfg.code;

    // Скрываем свет, силы и дистанцию
    ['fuelMeter', 'hpMeter', 'distVal'].forEach(id => {
      const node = el(id);
      if (node && node.parentElement) node.parentElement.style.display = 'none';
    });
  }

  function updateHUD(){
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    if (el('hudSub')) el('hudSub').textContent = ' · ' + specCfg.title;
    if (el('floorLabel')) el('floorLabel').textContent = '</> ' + (specCfg.floorName || 'Цех');
    if (el('unitLabel')) el('unitLabel').textContent = '💎 Задания';
    if (el('mineVal')) el('mineVal').textContent = (completedMines + 1) + '/' + totalMines;
    if (el('oreVal')) el('oreVal').textContent = collected + '/' + needed;
    if (el('scoreVal')) el('scoreVal').textContent = score;
    if (el('comboVal')) el('comboVal').textContent = '×' + answerStreak;

    // СВЕТ: возвращаем полноценную полоску света в HUD
    if (el('fuelBar')) el('fuelBar').style.width = clamp(fuel, 0, 100) + '%';
    if (el('fuelMeter')) {
      el('fuelMeter').classList.toggle('low', fuel < 28);
      if (el('fuelMeter').parentElement) el('fuelMeter').parentElement.style.display = '';
    }

    // Силы и км скрыты
    ['hpMeter', 'distVal'].forEach(id => {
      const node = el(id);
      if (node && node.parentElement) node.parentElement.style.display = 'none';
    });
  }
  function leftKm(){ return 0; }
  let toastTimer = null;
  function toast(msg){
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ============================================================
     Вопросы
     ============================================================ */
  function nextQuestion(hard){
    const key = hard ? 'hard' : 'easy';
    if (!decks[key].length){
      // Строгая фильтрация вопросов ТОЛЬКО по текущей специальности
      let matching = QUESTIONS.map((q, i) => i).filter(i => {
        const q = QUESTIONS[i];
        const matchSpec = (q.spec === currentSpec);
        return matchSpec && (!!q.hard === !!hard);
      });
      // Если для этой сложности вопросов больше нет, берём любой вопрос этой же специальности
      if (!matching.length){
        matching = QUESTIONS.map((q, i) => i).filter(i => QUESTIONS[i].spec === currentSpec);
      }
      // Если совсем ничего (вдруг новая специальность), то все доступные
      if (!matching.length){
        matching = QUESTIONS.map((q, i) => i);
      }
      decks[key] = shuffle(matching);
    }
    return QUESTIONS[decks[key].pop()];
  }

  function openQuestion(crystal){
    const assemblePC = currentSpec === 'ksk' && crystal?.stationType === 0;
    const servicePC = currentSpec === 'ksk' && crystal?.stationType === 3;
    const diagnosePC = currentSpec === 'ksk' && crystal?.stationType === 1;
    const networkPC = currentSpec === 'ksk' && crystal?.stationType === 4;
    if (assemblePC || servicePC || diagnosePC || networkPC || (currentSpec === 'p' && typeof window.startPStation === 'function')){
      if (!crystal || crystal.done || state !== 'playing') return;
      state = 'minigame';
      stopAuto();
      const completeStation = bonus => {
        if (crystal.done) return;
        crystal.done = true;
        collected++;
        runOre++;
        answerStreak++;
        score += bonus;
        fuel = Math.min(100, fuel + 16);
        hp = Math.min(100, hp + 3);
        if (collected >= needed) exitOpen = true;
        state = 'playing';
        sfx.good();
        updateHUD();
        toast(exitOpen ? 'Все задания выполнены! СОТА ждёт вас.' : 'Оборудование настроено · ' + collected + '/' + needed);
      };
      if (assemblePC) window.openKskAssembly(completeStation, cancelStationMinigame);
      else if (servicePC) window.openKskService(completeStation, cancelStationMinigame);
      else if (diagnosePC) window.openKskDiagnosis(completeStation, cancelStationMinigame);
      else if (networkPC) window.openKskNetwork(completeStation, cancelStationMinigame);
      else window.startPStation(crystal.stationType, completedMines, completeStation, cancelStationMinigame);
      return;
    }
    if (currentSpec === 'ksk' && (!crystal || crystal.done)) return;
    const hard = !!(crystal && crystal.hard);
    const q = currentSpec === 'ksk' ? nextKskQuestion(crystal) : nextQuestion(hard);
    activeQuestion = q;
    activeCrystal = crystal;
    state = 'question';
    answerLock = false;
    hintUsed = false;
    lastAnswerOk = false;
    el('qCloseBtn').classList.remove('hidden');
    el('qExitConfirm').classList.add('hidden');

    el('qTag').textContent = hard
      ? 'ЭКСПЕРТНЫЙ СТАНОК · СЛОЖНЫЙ ВОПРОС'
      : (q.type === 'tf' ? 'ТЕХРЕГЛАМЕНТ · ВЕРНО ИЛИ НЕТ' : 'ТЕХНИЧЕСКИЙ ВОПРОС СТАНКА');
    el('qTag').parentElement.classList.toggle('hard', hard);

    // индикатор прогресса по оборудованию цеха
    const prog = el('qProg');
    prog.innerHTML = '';
    for (let i = 0; i < needed; i++){
      const d = document.createElement('span');
      if (i < collected) d.className = 'on';
      else if (i === collected) d.className = 'now';
      prog.appendChild(d);
    }

    el('qText').textContent = q.q;

    const box = el('qAnswers');
    box.innerHTML = '';
    box.className = q.type === 'tf' ? 'tf' : (q.type === 'slider' ? 'sliderq' : '');

    if (q.type === 'slider'){
      const wrap = document.createElement('div');
      wrap.className = 'sliderWrap';

      const val = document.createElement('div');
      val.className = 'sliderVal';
      const num = document.createElement('b');
      const unit = document.createElement('span');
      unit.textContent = q.unit;
      val.appendChild(num);
      val.appendChild(unit);

      const input = document.createElement('input');
      input.type = 'range';
      input.id = 'sliderInput';
      input.min = q.min;
      input.max = q.max;
      input.step = q.step || 1;
      input.value = Math.round((q.min + q.max) / 2);
      num.textContent = input.value;

      const scale = document.createElement('div');
      scale.className = 'sliderScale';
      const lo = document.createElement('span'); lo.textContent = q.min + ' ' + q.unit;
      const hi = document.createElement('span'); hi.textContent = q.max + ' ' + q.unit;
      scale.appendChild(lo); scale.appendChild(hi);

      input.addEventListener('input', () => { num.textContent = input.value; });

      wrap.appendChild(val);
      wrap.appendChild(input);
      wrap.appendChild(scale);
      box.appendChild(wrap);

      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'btn qnext';
      submit.id = 'sliderSubmit';
      submit.textContent = 'Зафиксировать параметр';
      submit.addEventListener('click', submitSlider);
      box.appendChild(submit);
    } else {
      const opts = shuffle(q.a.map((text, i) => ({ text, ok: i === q.c })));
      opts.forEach(o => {
        const b = document.createElement('button');
        b.className = 'ans';
        b.type = 'button';
        b.textContent = o.text;
        b.dataset.ok = o.ok ? '1' : '0';
        b.addEventListener('click', () => answer(b, o.ok));
        box.appendChild(b);
      });
    }

    const hb = el('hintBtn');
    hb.hidden = q.type === 'tf' || q.type === 'slider';
    hb.disabled = false;
    hb.textContent = 'Подсказка: убрать 2 неверных';

    const fb = el('qFeedback');
    fb.className = 'qfeedback hidden';
    fb.textContent = '';
    el('qNextBtn').classList.add('hidden');
    el('qFoot').textContent = q.type === 'slider'
      ? 'Двигайте ползунок: чем ближе к регламенту, тем выше оценка.'
      : (hard ? 'Экспертный уровень: награда удвоена (+160 очков)!' : 'За верный ответ — очки и доступ к СОТЕ.');

    el('qScreen').classList.remove('hidden');
    sfx.pick();
  }

  el('hintBtn').addEventListener('click', () => {
    if (state !== 'question' || hintUsed) return;
    if (fuel <= 10){
      el('qFoot').textContent = 'Мало света для подсказки (требуется 10).';
      return;
    }
    hintUsed = true;
    fuel = Math.max(0, fuel - 10);
    updateHUD();
    const wrong = Array.from(el('qAnswers').children).filter(b => b.dataset.ok === '0');
    shuffle(wrong).slice(0, 2).forEach(b => b.classList.add('removed'));
    el('hintBtn').disabled = true;
    el('hintBtn').textContent = 'Подсказка использована';
    el('qFoot').textContent = 'Два неверных варианта исключены. −10 света.';
    sfx.pick();
  });

  function addMark(btn, sym){
    if (!sym || btn.querySelector('.mark')) return;
    const m = document.createElement('span');
    m.className = 'mark ' + (sym === '✓' ? 'ok' : 'bad');
    m.textContent = sym;
    btn.insertBefore(m, btn.firstChild);
  }

  function answer(btn, ok){
    if (answerLock) return;
    answerLock = true;
    lastAnswerOk = ok;
    el('qCloseBtn').classList.add('hidden');
    el('qExitConfirm').classList.add('hidden');
    const hard = !!(activeCrystal && activeCrystal.hard);
    el('hintBtn').disabled = true;

    const buttons = Array.from(el('qAnswers').children);
    buttons.forEach(b => {
      b.disabled = true;
      const isRight = b.dataset.ok === '1';
      if (isRight) b.classList.add('correct');
      addMark(b, isRight ? '✓' : (b === btn ? '✕' : ''));
    });

    const fb = el('qFeedback');
    const nextBtn = el('qNextBtn');
    fb.classList.remove('hidden');
    nextBtn.classList.remove('hidden');

    if (ok){
      btn.classList.add('correct');
      answerStreak++;
      const bonus = Math.round((120 + depth * 40 + answerStreak * 25) * (hard ? 2 : 1));
      score += bonus;
      fuel = Math.min(100, fuel + (hard ? 20 : 15));
      collected++;
      runOre++;
      if (activeCrystal) activeCrystal.done = true;
      sfx.good();
      flash = 0.35; flashColor = hard ? '185,150,255' : '120,220,160';
      fb.className = 'qfeedback ok';
      fb.textContent = (hard ? 'Экспертное задание выполнено! ' : 'Верно! ') + '+' + bonus + ' очков.';
      nextBtn.textContent = collected >= needed ? 'К СОТЕ' : 'Дальше';
      if (collected >= needed && !exitOpen){
        exitOpen = true;
        setTimeout(() => toast('Все 5 заданий выполнены! Можно войти в СОТУ!'), 400);
      }
    } else {
      btn.classList.add('wrong');
      answerStreak = 0;
      score = Math.max(0, score - 40);
      fuel = Math.max(0, fuel - 12);
      if (activeCrystal) activeCrystal.cracked = true;
      sfx.bad();
      shake = 1;
      flash = 0.4; flashColor = '235,90,70';
      fb.className = 'qfeedback bad';
      fb.textContent = '⚠ Неверно. −40 очков, −12 света. Попробуйте снова.';
      nextBtn.textContent = 'Попробовать снова';
      if (fuel <= 0){
        el('qScreen').classList.add('hidden');
        gameOver('Энергосеть цеха обесточена. Требуется перезапуск питания.');
        return;
      }
    }

    if (activeQuestion && activeQuestion.fact){
      const f = document.createElement('div');
      f.className = 'qfact';
      f.textContent = '💡 ' + activeQuestion.fact;
      fb.appendChild(f);
    }

    const sk = currentSkin();
    const lines = sk.lines && (ok ? sk.lines.correct : sk.lines.wrong);
    if (lines && lines.length){
      const q = document.createElement('div');
      q.className = 'qspeak';
      q.textContent = '— ' + lines[Math.floor(Math.random() * lines.length)];
      fb.appendChild(q);
    }
    updateHUD();
  }

  function submitSlider(){
    if (answerLock) return;
    const q = activeQuestion;
    if (!q || q.type !== 'slider') return;
    const input = el('sliderInput');
    if (!input) return;

    answerLock = true;
    el('qCloseBtn').classList.add('hidden');
    el('qExitConfirm').classList.add('hidden');
    const guess = Number(input.value);
    const span = Math.max(1, q.max - q.min);
    const err = Math.abs(guess - q.answer) / span;
    const acc = clamp(1 - err, 0, 1);
    const ok = acc >= 0.5;
    const hard = !!(activeCrystal && activeCrystal.hard);
    lastAnswerOk = ok;

    input.disabled = true;
    const submit = el('sliderSubmit');
    if (submit) submit.disabled = true;
    el('hintBtn').disabled = true;

    const fb = el('qFeedback');
    const nextBtn = el('qNextBtn');
    fb.classList.remove('hidden');
    nextBtn.classList.remove('hidden');

    const accPct = Math.round(acc * 100);
    const truth = 'Верный ответ: ' + q.answer + ' ' + q.unit + '.';

    if (ok){
      answerStreak++;
      const base = 120 + depth * 40 + answerStreak * 25;
      const bonus = Math.round(base * (0.3 + 0.7 * acc) * (hard ? 2 : 1));
      score += bonus;
      fuel = Math.min(100, fuel + (hard ? 24 : 16));
      collected++;
      runOre++;
      if (activeCrystal) activeCrystal.done = true;
      sfx.good();
      flash = 0.35; flashColor = hard ? '185,150,255' : '120,220,160';
      fb.className = 'qfeedback ok';
      fb.textContent = '✓ Точность ' + accPct + '% · +' + bonus + ' очков. ' + truth;
      nextBtn.textContent = collected >= needed ? 'К СОТЕ' : 'Дальше';
      if (collected >= needed && !exitOpen){
        exitOpen = true;
        setTimeout(() => toast('Все 5 заданий выполнены! Можно войти в СОТУ!'), 400);
      }
    } else {
      answerStreak = 0;
      score = Math.max(0, score - 20);
      fuel = Math.max(0, fuel - 12);
      if (activeCrystal) activeCrystal.cracked = true;
      sfx.bad();
      shake = 1;
      flash = 0.4; flashColor = '235,90,70';
      fb.className = 'qfeedback bad';
      fb.textContent = '⚠ Мимо: точность ' + accPct + '%. −20 очков, −12 света. ' + truth;
      nextBtn.textContent = 'Попробовать снова';
      if (fuel <= 0){
        el('qScreen').classList.add('hidden');
        gameOver('Энергосеть цеха обесточена. Требуется перезапуск питания.');
        return;
      }
    }
  }

  el('qNextBtn').addEventListener('click', () => {
    if (state !== 'question') return;
    const wasOk = lastAnswerOk;
    const crystal = activeCrystal;

    if (!wasOk && crystal && !crystal.done){
      answerLock = false;
      openQuestion(crystal);
      return;
    }

    el('qScreen').classList.add('hidden');
    answerLock = false;
    activeQuestion = null;
    activeCrystal = null;
    state = 'playing';
    if (collected >= needed){
      const sCfg = SPECS[currentSpec] || SPECS.kip;
      toast('Переход открыт — ищите выход в следующий ' + (currentSpec === 'ts' ? 'участок' : 'цех'));
    }
  });

  el('qCloseBtn').addEventListener('click', () => {
    if (state !== 'question' || answerLock) return;
    el('qExitConfirm').classList.remove('hidden');
    sfx.pick();
  });
  el('qExitCancel').addEventListener('click', () => {
    el('qExitConfirm').classList.add('hidden');
    sfx.pick();
  });
  el('qExitConfirmBtn').addEventListener('click', () => {
    if (state !== 'question' || answerLock) return;
    score = Math.max(0, score - EXIT_QUESTION_PENALTY);
    updateHUD();
    el('qExitConfirm').classList.add('hidden');
    el('qScreen').classList.add('hidden');
    answerLock = false;
    activeQuestion = null;
    activeCrystal = null;
    state = 'playing';
    sfx.bad();
    toast('Выход из вопроса: −' + EXIT_QUESTION_PENALTY + ' очков');
  });

  /* ============================================================
     Ходьба и события
     ============================================================ */
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Маршрут по проходимым клеткам (BFS), без стартовой клетки
  function planPath(tx, ty){
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    if (map[ty][tx] !== FLOOR) return null;
    if (tx === player.gx && ty === player.gy) return [];

    const prev = Array.from({ length: H }, () => new Array(W).fill(null));
    const visited = Array.from({ length: H }, () => new Array(W).fill(false));
    const queue = [[player.gx, player.gy]];
    visited[player.gy][player.gx] = true;

    for (let i = 0; i < queue.length; i++){
      const [x, y] = queue[i];
      if (x === tx && y === ty) break;
      for (const [dx, dy] of DIRS){
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (map[ny][nx] !== FLOOR || visited[ny][nx]) continue;
        visited[ny][nx] = true;
        prev[ny][nx] = [x, y];
        queue.push([nx, ny]);
      }
    }
    if (!visited[ty][tx]) return null;

    const path = [];
    let cx = tx, cy = ty;
    while (cx !== player.gx || cy !== player.gy){
      path.push({ x: cx, y: cy });
      const p = prev[cy][cx];
      if (!p) return null;
      cx = p[0]; cy = p[1];
    }
    return path.reverse();
  }

  function stopAuto(){
    autoPath = [];
    tapTarget = null;
  }

  function tapTo(cell){
    if (state !== 'playing') return;
    stopAuto();
    if (cell.x < 0 || cell.y < 0 || cell.x >= W || cell.y >= H) return;
    // A tap on furniture leads to the closest reachable floor beside it.
    if (map[cell.y][cell.x] !== FLOOR) {
      const queue = [{x:player.gx, y:player.gy}];
      const visited = new Set([player.gx + ',' + player.gy]);
      let closest = queue[0], distance = Infinity;
      for (const point of queue) {
        const d = Math.hypot(point.x - cell.x, point.y - cell.y);
        if (d < distance) { closest = point; distance = d; }
        for (const [dx, dy] of DIRS) {
          const x = point.x + dx, y = point.y + dy, key = x + ',' + y;
          if (map[y]?.[x] !== FLOOR || visited.has(key)) continue;
          visited.add(key);queue.push({x, y});
        }
      }
      cell = closest;
    }
    // Если игрок уже рядом со станком и тапает по нему — сразу открываем задачу
    const nearStation = crystals.find(cr => !cr.done && cr.x === cell.x && cr.y === cell.y);
    if (nearStation && player.gx === cell.x && player.gy === cell.y){
      openQuestion(nearStation);
      return;
    }
    const path = planPath(cell.x, cell.y);
    if (!path || path.length === 0){
      if (path === null){
        if (map[cell.y] && map[cell.y][cell.x] === WALL) sfx.bump();
        return;
      }
      // тап по своей клетке — повторная попытка на станке
      const here = crystals.find(cr => !cr.done && cr.x === player.gx && cr.y === player.gy);
      if (here) openQuestion(here);
      return;
    }
    autoPath = path;
    tapTarget = { x: cell.x, y: cell.y };
    autoNext = performance.now() + 40;
  }

  function pointerToCell(e){
    const rect = canvas.getBoundingClientRect();
    const wx = camX + (e.clientX - rect.left) / zoom;
    const wy = camY + (e.clientY - rect.top) / zoom;
    // The building extends above and beside its entrance tile.
    const ex = exitCell.x * TILE + TILE / 2, ey = exitCell.y * TILE + TILE / 2;
    if (Math.abs(wx - ex) <= 62 && wy >= ey - 75 && wy <= ey + 20) return {...exitCell};
    return { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
  }

  canvas.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    if (state !== 'playing') return;
    tapTo(pointerToCell(e));
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  function tryMove(dx, dy){
    if (state !== 'playing') return;
    if (dx !== 0) player.dir = dx > 0 ? 1 : -1;

    const nx = player.gx + dx, ny = player.gy + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H){ sfx.bump(); return; }
    if (map[ny][nx] === WALL){
      sfx.bump();
      shake = Math.max(shake, 0.25);
      return;
    }
    player.gx = nx; player.gy = ny;
    sfx.step();
    onEnterTile();
  }

  function interactStation(c){
    if (!c || c.done) return;
    activeCrystal = c;
    if (c.actionType === 'minigame' && c.minigameId && window.MINI_GAMES && window.MINI_GAMES[c.minigameId]){
      startFloorEvent(c.minigameId);
    } else {
      openQuestion(c);
    }
  }

  function onEnterTile(){
    const pk = pickups.find(p => p.x === player.gx && p.y === player.gy);
    if (pk){ takePickup(pk); return; }

    const c = crystals.find(cr => !cr.done && cr.x === player.gx && cr.y === player.gy);
    if (c && (!tapTarget || (c.x === tapTarget.x && c.y === tapTarget.y))){ interactStation(c); return; }

    if (player.gx === exitCell.x && player.gy === exitCell.y){
      if (exitOpen){
        descend();
      } else {
        toast('Чтобы войти в СОТУ, нужно выполнить ещё ' + Math.max(0, needed - collected) + ' заданий!');
        sfx.bump();
      }
    }
  }

  function takePickup(pk){
    pickups = pickups.filter(p => p !== pk);
    score += 50;
    answerStreak++;
    toast('Инструменты найдены: +50 очков!');
    flash = 0.25; flashColor = '255,200,120';
    updateHUD();
  }

  function cancelStationMinigame(){
    fuel = Math.max(0, fuel - 15);
    answerStreak = 0;
    state = 'playing';
    stopAuto();
    updateHUD();
    if (fuel <= 0){ gameOver('Свет закончился после выхода из мини-игры.'); return; }
    toast('Вы вышли из мини-игры: −15 света. Задание не засчитано.');
  }

  function descend(){
    completedMines++;
    score += 500;
    answerStreak = 0;
    sfx.descend();
    flash = 0.5; flashColor = '255,210,140';
    // 1 цех на постоянку: переход в дверь К СОТЕ ведет сразу к экрану СОТЫ
    victory();
  }

  function victory(){
    try {
      for (const k in window.MINI_GAMES){
        if (window.MINI_GAMES[k] && typeof window.MINI_GAMES[k].cleanup === 'function') window.MINI_GAMES[k].cleanup();
      }
    } catch(_) {}
    state = 'dead';
    stopAuto();
    const bonus = 500;
    score += bonus;
    if (score > best){
      best = score;
      try { localStorage.setItem('mine_best', String(best)); } catch (e) {}
    }
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    el('endTitle').textContent = 'Поздравляем! Вы дошли до СОТЫ!';
    el('endText').textContent = 'Все 5 практических заданий лаборатории успешно выполнены! Награда за отличную смену: +' + bonus + ' очков.';
    if (el('endFloorName')) el('endFloorName').textContent = specCfg.floorName || 'Лаборатория';
    if (el('endStationName')) el('endStationName').textContent = specCfg.unitName || 'Станции';
    el('endDepth').textContent = '1/1';
    el('endOre').textContent = runOre;
    el('endScore').textContent = score;
    el('endBest').textContent = best;
    if (el('sotaWrap')) el('sotaWrap').classList.remove('hidden');
    drawSotaBuilding();
    el('endScreen').classList.remove('hidden');
  }

  function gameOver(reason){
    try {
      for (const k in window.MINI_GAMES){
        if (window.MINI_GAMES[k] && typeof window.MINI_GAMES[k].cleanup === 'function') window.MINI_GAMES[k].cleanup();
      }
    } catch(_) {}
    state = 'dead';
    stopAuto();
    if (score > best){
      best = score;
      try { localStorage.setItem('mine_best', String(best)); } catch (e) {}
    }
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    el('endTitle').textContent = 'Смена окончена';
    el('endText').textContent = reason || 'Смена завершена.';
    if (el('endFloorName')) el('endFloorName').textContent = specCfg.floorName || 'Лаборатория';
    if (el('endStationName')) el('endStationName').textContent = specCfg.unitName || 'Станции';
    el('endDepth').textContent = '1/1';
    el('endOre').textContent = runOre;
    el('endScore').textContent = score;
    el('endBest').textContent = best;
    if (el('sotaWrap')) el('sotaWrap').classList.add('hidden');
    el('endScreen').classList.remove('hidden');
  }

  let sotaSprite = null, sotaLoading = false;
  function getSotaSprite(){
    if (sotaSprite) return sotaSprite;
    if (sotaLoading) return null;
    sotaLoading = true;
    const img = new Image();
    img.onload = () => {
      const up = document.createElement('canvas');
      up.width = img.naturalWidth || 640;
      up.height = img.naturalHeight || 427;
      const cg = up.getContext('2d');
      cg.imageSmoothingEnabled = false;
      cg.drawImage(img, 0, 0, up.width, up.height);
      sotaSprite = up;
      sotaLoading = false;
      const endSc = el('endScreen');
      if (endSc && !endSc.classList.contains('hidden')) drawSotaBuilding();
    };
    img.onerror = () => {
      if (!img.dataset.fb1) {
        img.dataset.fb1 = '1';
        img.src = '/assets/sota-building.png';
        return;
      }
      if (!img.dataset.fb2) {
        img.dataset.fb2 = '1';
        img.src = 'assets/sota-building.png';
        return;
      }
      sotaLoading = false;
    };
    img.src = window.location.pathname.includes('/specialties/') ? '../../assets/sota-building.png' : 'assets/sota-building.png';
    return null;
  }

  function drawSotaBuilding(){
    const cv = el('sotaCanvas');
    if (!cv) return;
    const sp = getSotaSprite();
    if (!sp){ setTimeout(drawSotaBuilding, 100); return; }
    cv.width = sp.width;
    cv.height = sp.height;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sp, 0, 0);
  }let activeCityFilter = 'all';

  function initCityFiltersOnce(){
    const row = document.querySelector('.city-filter-row');
    if (!row || row.dataset.inited) return;
    row.dataset.inited = '1';
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('.city-filter-btn');
      if (!btn) return;
      document.querySelectorAll('.city-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCityFilter = btn.getAttribute('data-filter') || 'all';
      buildCities(activeCityFilter);
    });
  }

  function buildCities(filter = activeCityFilter){
    initCityFiltersOnce();
    const grid = el('cityGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    const f1 = specCfg.floorName.toLowerCase();
    const f2 = f1 === 'цех' ? 'цеха' : 'участка';
    const f5 = f1 === 'цех' ? 'цехов' : 'участков';

    const filtered = CITIES.filter(c => {
      if (filter === 'major') return !!c.major;
      if (filter === 'far') return minesFor(c.km) >= 4;
      return true;
    });

    filtered.forEach(c => {
      const mines = minesFor(c.km);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'citybtn' + (c.major ? ' major' : '');
      const nm = document.createElement('b');
      nm.textContent = c.name;
      const info = document.createElement('small');
      let details = c.km + ' км · <em>' + mines + ' ' + plural(mines, f1, f2, f5) + '</em>';
      if (c.tag) details += '<br><span style="color:#38bdf8;font-size:10px">' + c.tag + '</span>';
      info.innerHTML = details;
      b.appendChild(nm);
      b.appendChild(info);
      b.addEventListener('click', () => startGame(c));
      grid.appendChild(b);
    });
  }

  /* ============================================================
     События между уровнями (Калибровка КИПиА и Сборка теплотрассы ТС)
     ============================================================ */

  /* ============================================================
     События между уровнями (Модульный диспетчер мини-игр)
     ============================================================ */
  function startFloorEvent(eventId){
    state = 'minigame';
    stopAuto();
    const g = window.MINI_GAMES[eventId];
    const gName = g ? g.name : 'производственное задание';
    toast('Начинается ' + gName + '!');
    if (g && typeof g.start === 'function'){
      g.start();
    } else {
      console.warn('Мини-игра не найдена:', eventId);
      closeFloorEvent();
    }
  }

  function closeFloorEvent(won){
    const isSuccess = (won !== false);
    for (const key in window.MINI_GAMES){
      if (window.MINI_GAMES[key] && typeof window.MINI_GAMES[key].cleanup === 'function'){
        try { window.MINI_GAMES[key].cleanup(); } catch(e){ console.error(e); }
      }
    }
    const screenIds = ['calibScreen', 'clickerScreen', 'pipeScreen', 'wiresScreen', 'pidScreen', 'bypassScreen', 'exchangerScreen'];
    screenIds.forEach(id => {
      const elNode = el(id);
      if (elNode) elNode.classList.add('hidden');
      const bNode = el(id.replace('Screen', 'Banner'));
      if (bNode) bNode.classList.add('hidden');
    });

    if (activeCrystal && !activeCrystal.done){
      if (isSuccess){
        activeCrystal.done = true;
        collected++;
        runOre++;
        updateHUD();
        if (collected >= needed && !exitOpen){
          exitOpen = true;
          setTimeout(() => toast('Все 5 заданий выполнены! Можно войти в СОТУ!'), 300);
        }
      } else {
        toast('Задание не выполнено. Попробуйте снова!');
      }
    }

    if (state === 'minigame'){
      state = 'playing';
      try {
        if (currentSkin() && currentSkin().lines){
          if (isSuccess){
            say(currentSkin().lines.correct ? currentSkin().lines.correct[0] : 'Задание выполнено!');
          } else {
            say('Нужно перепроверить и настроить заново!');
          }
        }
        const specCfg = SPECS[currentSpec] || SPECS.kip;
        toast((specCfg.floorName || 'Лаборатория') + ' 1/1 · Выполнено ' + collected + '/' + needed);
      } catch(_) {}
    }
  }

  function startGame(city){
    for (const k in window.MINI_GAMES){
      if (window.MINI_GAMES[k] && window.MINI_GAMES[k].cleanup) window.MINI_GAMES[k].cleanup();
    }
    chosenCity = city || null;
    startKm = city ? city.km : 0;
    completedMines = 0;
    runOre = 0;
    totalMines = 1; // 1 цех на постоянку
    depth = 1;
    score = 0; answerStreak = 0;
    fuel = 100; // Свет на 100%
    hp = 100;
    decks.easy = []; decks.hard = [];
    shake = 0; flash = 0; speech = null;
    newLevel();
    ['endScreen', 'qScreen', 'clickerScreen', 'pipeScreen', 'startScreen', 'cityScreen'].forEach(id => {
      const n = el(id);
      if (n) n.classList.add('hidden');
    });
    state = 'playing';
    updateHUD();
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    toast('Добро пожаловать в ' + specCfg.title + '! Обслужите 5 рабочих станций.');
  }

  function openCitySelect(){
    // Прямой вход в практику без выбора городов (сохраняя возможность возврата)
    startGame(null);
  }

  /* ============================================================
     Отрисовка цеха СОТА
     ============================================================ */
  function computeBrightness(now){
    // Полное яркое освещение современного цеха СОТА
    for (let y = 0; y < H; y++){
      for (let x = 0; x < W; x++){
        bright[y][x] = 1.0;
        seen[y][x] = 1;
      }
    }
  }

  function drawFloor(x, y, b){
    if (currentSpec === 'ksk') return drawKskFloor(x,y);
    if (currentSpec === 'p') return drawPFloor(x,y);
    const px = x * TILE, py = y * TILE;
    const isDark = (x + y) % 2 === 0;

    // Плитка цеха / промышленный настил
    ctx.fillStyle = isDark ? '#141822' : '#181e2a';
    ctx.fillRect(px, py, TILE, TILE);

    // Технологические швы плитки
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(px, py + TILE - 1, TILE, 1);
    ctx.fillRect(px + TILE - 1, py, 1, TILE);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(px, py, TILE, 1);
    ctx.fillRect(px, py, 1, TILE);

    // Вентиляционные решётки в полу в нескольких точках цеха
    const isGrate = (x === 7 && y === 5) || (x === 15 && y === 5) || (x === 9 && y === 11) || (x === 18 && y === 11);
    if (isGrate){
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 6, py + 6, TILE - 12, TILE - 12);
      ctx.beginPath();
      for (let i = 10; i < TILE - 6; i += 5){
        ctx.moveTo(px + i, py + 6); ctx.lineTo(px + i, py + TILE - 6);
        ctx.moveTo(px + 6, py + i); ctx.lineTo(px + TILE - 6, py + i);
      }
      ctx.stroke();
    }
  }

  function drawHazardZones(){
    if (currentSpec === 'p' || currentSpec === 'ksk') return;
    // Разметка зон безопасности: жёлто-чёрная полоса вокруг каждого станка и чертежного стола
    for (const c of crystals){
      const cx = c.x * TILE, cy = c.y * TILE;
      const x0 = cx - 22, y0 = cy - 14, w = TILE + 44, h = TILE + 28;

      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(x0, y0, w, h);

      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x0, y0, w, h);
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      const sz = 4;
      ctx.fillRect(x0 - 1, y0 - 1, sz, sz);
      ctx.fillRect(x0 + w - 3, y0 - 1, sz, sz);
      ctx.fillRect(x0 - 1, y0 + h - 3, sz, sz);
      ctx.fillRect(x0 + w - 3, y0 + h - 3, sz, sz);
      ctx.restore();
    }
  }

  function drawWall(x, y, b){
    if (currentSpec === 'ksk') return drawKskWall(x,y);
    if (currentSpec === 'p') return drawPWall(x,y);
    const px = x * TILE, py = y * TILE;
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(px, py, TILE, TILE);

    ctx.fillStyle = '#1e2633';
    ctx.fillRect(px, py, TILE, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(px, py + TILE - 2, TILE, 2);

    if (y === H - 1){
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px, py, TILE, 4);
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < TILE; i += 8){
        ctx.fillRect(px + i, py, 4, 4);
      }
    }
  }

  function drawBackWall(now){
    if (currentSpec === 'ksk') return drawKskBackWall(now);
    if (currentSpec === 'p') return drawPBackWall(now);
    const wallH = 114;
    // 1. Основа задней кирпично-панельной стены (темный индустриальный антрацит)
    ctx.fillStyle = '#0f141d';
    ctx.fillRect(0, 0, VW, wallH);

    // Вертикальные швы модульных панелей (каждые 64px) и стальные заклепки
    ctx.fillStyle = '#17202e';
    for (let x = 0; x < VW; x += 64){
      ctx.fillRect(x, 0, 2, wallH);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x - 1, 20, 4, 3);
      ctx.fillRect(x - 1, 52, 4, 3);
      ctx.fillRect(x - 1, 84, 4, 3);
      ctx.fillRect(x - 1, 104, 4, 3);
      ctx.fillStyle = '#17202e';
    }

    // Нижний стальной плинтус / отбойник на границе стены и пола (y = 110..114)
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 110, VW, 4);
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 110, VW, 1);
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 114, VW, 2);

    // ============================================================
    // ВЕРХНЯЯ АРХИТЕКТУРНАЯ СТАЛЬНАЯ БАЛКА (y = 8..62)
    // Содержит:
    // 1) Вентиляционную решетку слева ([ ≡≡≡ ])
    // 2) Настенную вывеску СОТА с неоновой подсветкой по центру
    // 3) Электронное табло статуса справа (ONLINE 24/7)
    // В точности как на референсе media_1795538078759_63b9902f.png!
    // ============================================================
    const beamY = 8, beamH = 54;
    ctx.save();

    // Несущий канал балки
    ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, beamY, VW, beamH);
    ctx.fillStyle = '#161d2a'; ctx.fillRect(0, beamY + 2, VW, beamH - 4);

    // Верхний фиолетовый неоновый световой рельс вдоль всей балки (#a855f7 / #c084fc)
    ctx.fillStyle = 'rgba(168, 85, 247, 0.35)'; ctx.fillRect(0, beamY - 1, VW, 5);
    ctx.fillStyle = '#a855f7'; ctx.fillRect(0, beamY, VW, 2.5);
    ctx.fillStyle = '#e9d5ff'; ctx.fillRect(0, beamY + 0.5, VW, 1);

    // Нижний кант балки
    ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, beamY + beamH - 2, VW, 2);
    ctx.fillStyle = '#334155'; ctx.fillRect(0, beamY + beamH - 3, VW, 1);

    // 1) ВЕНТИЛЯЦИОННАЯ РЕШЕТКА СЛЕВА ([ ≡≡≡ ])
    const vGrdX = 180, vGrdY = 16, vGrdW = 84, vGrdH = 38;
    // Наружный металлический фланец с винтами
    ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.roundRect(vGrdX, vGrdY, vGrdW, vGrdH, 3); ctx.fill();
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1.2; ctx.stroke();
    // 4 угловых крепежных винта
    ctx.fillStyle = '#9ca3af';
    [[vGrdX + 4, vGrdY + 4], [vGrdX + vGrdW - 6, vGrdY + 4], [vGrdX + 4, vGrdY + vGrdH - 6], [vGrdX + vGrdW - 6, vGrdY + vGrdH - 6]].forEach(([bx, by]) => {
      ctx.fillRect(bx, by, 2.5, 2.5);
    });
    // Темная вентиляционная ниша
    ctx.fillStyle = '#030712'; ctx.fillRect(vGrdX + 8, vGrdY + 6, vGrdW - 16, vGrdH - 12);
    // Горизонтальные жалюзи
    for (let ly = vGrdY + 9; ly < vGrdY + vGrdH - 8; ly += 4.5){
      ctx.fillStyle = '#1f2937'; ctx.fillRect(vGrdX + 9, ly, vGrdW - 18, 2);
      ctx.fillStyle = '#4b5563'; ctx.fillRect(vGrdX + 9, ly, vGrdW - 18, 0.8);
    }

    // 2) ЦЕНТРАЛЬНАЯ ВЫВЕСКА ЛАБОРАТОРИИ, ВМОНТИРОВАННАЯ В СТЕНУ
    const isTS = (currentSpec === 'ts');
    const signW = 440, signH = 46;
    const signX = (VW - signW) / 2, signY = 12;

    // Боковые стальные крепежные пластины с болтами к балке
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(signX - 12, signY + 8, 14, signH - 16);
    ctx.fillRect(signX + signW - 2, signY + 8, 14, signH - 16);
    ctx.fillStyle = '#64748b';
    // Болты крепления
    [signY + 12, signY + 22, signY + 32].forEach(by => {
      ctx.fillRect(signX - 9, by, 3, 3);
      ctx.fillRect(signX + signW + 6, by, 3, 3);
    });

    // Корпус вывески (скошенный металлический профиль)
    ctx.fillStyle = '#070a10';
    ctx.beginPath(); ctx.roundRect(signX, signY, signW, signH, 4); ctx.fill();
    ctx.strokeStyle = '#273349'; ctx.lineWidth = 2; ctx.stroke();

    // Верхняя фиолетово-неоновая планка вывески (как на референсе)
    ctx.fillStyle = '#a855f7'; ctx.fillRect(signX + 6, signY + 2, signW - 12, 2.5);
    ctx.fillStyle = '#f3e8ff'; ctx.fillRect(signX + 16, signY + 2.5, signW - 32, 1);

    // Заголовок вывески: СОТА • ЛАБОРАТОРИЯ КИП / ТС
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px "Segoe UI", "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#f8fafc';
    const mainTitle = isTS ? 'СОТА  •  ЛАБОРАТОРИЯ ТС' : 'СОТА  •  ЛАБОРАТОРИЯ КИП';
    ctx.fillText(mainTitle, signX + signW / 2, signY + 18);

    // Разделительная полоса
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(signX + 24, signY + 29, signW - 48, 1);

    // Подзаголовок квалификации (светящийся бирюзовый/циан как на референсе)
    ctx.font = 'bold 9.5px "Segoe UI", monospace';
    ctx.fillStyle = '#38bdf8';
    const subTitle = isTS ? '13.02.02  /  ТЕПЛОСНАБЖЕНИЕ И ТЕПЛОТЕХНИКА' : '15.01.37  /  СЛЕСАРЬ-НАЛАДЧИК КИП И АСУ';
    ctx.fillText(subTitle, signX + signW / 2, signY + 38);

    // 3) ЭЛЕКТРОННОЕ ТАБЛО СТАТУСА СПРАВА (SERVER ROOM / ONLINE 24/7)
    const stX = 776, stY = 16, stW = 120, stH = 38;
    ctx.fillStyle = '#090e17'; ctx.beginPath(); ctx.roundRect(stX, stY, stW, stH, 3); ctx.fill();
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 10px "Segoe UI", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(isTS ? 'ТЕПЛОСЕТЬ' : 'АСУ ТП', stX + 8, stY + 14);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isTS ? '13.02.02' : '15.01.37', stX + 76, stY + 14);

    // Мигающий зеленый светодиод и надпись В СЕТИ • 24 / 7
    const ledOn = Math.sin(now * 0.005) > -0.2;
    ctx.fillStyle = ledOn ? '#22c55e' : '#14532d';
    ctx.beginPath(); ctx.arc(stX + 12, stY + 27, 3, 0, Math.PI * 2); ctx.fill();
    if (ledOn){
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.beginPath(); ctx.arc(stX + 12, stY + 27, 5.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(isTS ? 'В РАБОТЕ · 24 / 7' : 'В СЕТИ · 24 / 7', stX + 22, stY + 28);

    ctx.restore();
  }

  function drawWallDecor(now){
    if (currentSpec === 'p' || currentSpec === 'ksk') return;
    ctx.save();
    if (currentSpec === 'kip'){
      // ============================================================
      // КИП: НАСТЕННЫЙ ДЕКОР
      // 1. Слева: Большая функциональная P&ID схема контура автоматизации и график ПИД на доске
      // 2. Центр-лево: Перфорированная панель с инструментами (мультиметры, щупы, отвертки VDE)
      // 3. Центр-право: Полка технической документации (ПУЭ-7, ГОСТ, схемы АСУ ТП)
      // 4. Справа: Плакат электробезопасности 220В и промышленные аналоговые часы
      // ============================================================

      // --- 1. ДОСКА СХЕМ АВТОМАТИЗАЦИИ (x = 88..270, y = 64..112) ---
      const bX = 88, bY = 64, bW = 182, bH = 46;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bX + 2, bY + 2, bW, bH);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(bX, bY, bW, bH);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(bX, bY, bW, bH);
      ctx.fillStyle = '#09131d'; ctx.fillRect(bX + 4, bY + 4, bW - 8, bH - 8);

      // Схема функционального контура: [Датчик PT-101] -> [ПИД-регулятор] -> [Клапан]
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
      // Кружок датчика PT-101
      ctx.beginPath(); ctx.arc(bX + 22, bY + 16, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e0f2fe'; ctx.font = '6px monospace'; ctx.textAlign = 'center'; ctx.fillText('PT', bX + 22, bY + 18);
      // Линия связи
      ctx.beginPath(); ctx.moveTo(bX + 29, bY + 16); ctx.lineTo(bX + 46, bY + 16); ctx.stroke();
      // Блок ПИД
      ctx.strokeRect(bX + 46, bY + 9, 26, 14);
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 6px monospace'; ctx.fillText('PID', bX + 59, bY + 18);
      // Линия к приводу
      ctx.beginPath(); ctx.moveTo(bX + 72, bY + 16); ctx.lineTo(bX + 88, bY + 16); ctx.stroke();
      // Символ клапана |><|
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(bX + 88, bY + 11); ctx.lineTo(bX + 98, bY + 21); ctx.lineTo(bX + 98, bY + 11); ctx.lineTo(bX + 88, bY + 21);
      ctx.closePath(); ctx.fill();

      // График переходной характеристики регулятора (затухающая синусоида с уставкой SP)
      const gX = bX + 112, gY = bY + 8, gW = 60, gH = 26;
      ctx.fillStyle = '#030b14'; ctx.fillRect(gX, gY, gW, gH);
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.8; ctx.strokeRect(gX, gY, gW, gH);
      // Зеленая линия уставки SP = 1.0
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(gX, gY + 13); ctx.lineTo(gX + gW, gY + 13); ctx.stroke();
      ctx.setLineDash([]);
      // Желтая кривая настройки ПИД (затухание колебаний)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x < gW; x++){
        const decay = Math.exp(-x * 0.07);
        const wy = gY + 13 + Math.sin(x * 0.35 + now * 0.003) * 10 * decay;
        if (x === 0) ctx.moveTo(gX + x, wy);
        else ctx.lineTo(gX + x, wy);
      }
      ctx.stroke();

      // Текстовая подпись на доске мелом
      ctx.fillStyle = '#94a3b8'; ctx.font = '5.5px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('КОНТУР 01: P = 6.00 бар (норма)', bX + 8, bY + 36);

      // --- 2. ИНСТРУМЕНТАЛЬНАЯ ПЕРФОПАНЕЛЬ (x = 300..424, y = 64..112) ---
      const pX = 300, pY = 64, pW = 124, pH = 46;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(pX + 2, pY + 2, pW, pH);
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 3); ctx.fill();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2; ctx.stroke();
      // Перфорация (точки)
      ctx.fillStyle = '#1e293b';
      for (let px = pX + 8; px < pX + pW - 6; px += 8){
        for (let py = pY + 6; py < pY + pH - 4; py += 7){
          ctx.fillRect(px, py, 1.5, 1.5);
        }
      }
      // Набор диэлектрических отверток VDE (красно-желтые ручки)
      [0, 1, 2, 3].forEach(i => {
        const ox = pX + 12 + i * 8;
        ctx.fillStyle = '#ef4444'; ctx.fillRect(ox, pY + 8, 3.5, 12 + i * 2);
        ctx.fillStyle = '#eab308'; ctx.fillRect(ox, pY + 20 + i * 2, 3.5, 6);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(ox + 1, pY + 26 + i * 2, 1.5, 8);
      });
      // Пассатижи и стриппер для зачистки проводов
      ctx.fillStyle = '#0284c7'; ctx.fillRect(pX + 48, pY + 8, 7, 24);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(pX + 49.5, pY + 32, 4, 6);
      // Цифровой мультиметр Fluke на крючке
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(pX + 66, pY + 8, 20, 32, 3); ctx.fill();
      ctx.fillStyle = '#020617'; ctx.fillRect(pX + 69, pY + 11, 14, 10);
      ctx.fillStyle = '#22c55e'; ctx.font = '6px monospace'; ctx.textAlign = 'center'; ctx.fillText('12.0', pX + 76, pY + 19);
      // Круговой селектор мультиметра
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(pX + 76, pY + 28, 4, 0, Math.PI * 2); ctx.fill();
      // Красный и черный измерительные щупы
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pX + 72, pY + 38); ctx.lineTo(pX + 68, pY + 45); ctx.stroke();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pX + 80, pY + 38); ctx.lineTo(pX + 84, pY + 45); ctx.stroke();
      // Осциллографический щуп с коаксиальным разъемом BNC
      ctx.fillStyle = '#475569'; ctx.fillRect(pX + 96, pY + 10, 16, 12);
      ctx.fillStyle = '#38bdf8'; ctx.font = '5px sans-serif'; ctx.fillText('BNC-01', pX + 104, pY + 18);

      // --- 3. ПОЛКА ТЕХНИЧЕСКОЙ ДОКУМЕНТАЦИИ (x = 640..776, y = 64..112) ---
      const sX = 640, sY = 64, sW = 136, sH = 46;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(sX, sY + 38, sW, 4);
      ctx.fillStyle = '#475569'; ctx.fillRect(sX, sY + 38, sW, 1);
      // Треугольные кронштейны
      [[sX + 12, sY + 38], [sX + sW - 16, sY + 38]].forEach(([kx, ky]) => {
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx, ky + 9); ctx.lineTo(kx + 8, ky); ctx.stroke();
      });
      // Папки-регистраторы с техническими регламентами
      const binders = [
        { title: 'ПУЭ 7', col: '#ef4444' },
        { title: 'ГОСТ', col: '#3b82f6' },
        { title: 'ПТЭЭП', col: '#10b981' },
        { title: 'КИПиА', col: '#f59e0b' },
        { title: 'СХЕМЫ', col: '#8b5cf6' },
        { title: 'РЕГЛ.', col: '#06b6d4' }
      ];
      binders.forEach((b, idx) => {
        const bx = sX + 8 + idx * 16;
        ctx.fillStyle = b.col;
        ctx.beginPath(); ctx.roundRect(bx, sY + 12, 13, 26, 1.5); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 2, sY + 16, 9, 6);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(bx + 5, sY + 30, 3, 3);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 4.5px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(b.title.slice(0, 4), bx + 6.5, sY + 21);
      });
      // Рулон сложенных синих чертежей на полке справа
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.ellipse(sX + sW - 20, sY + 28, 6, 8, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 0.8; ctx.stroke();

      // --- 4. ПЛАКАТ БЕЗОПАСНОСТИ 220В И ЧАСЫ (x = 796..960, y = 64..112) ---
      const wX = 796, wY = 64;
      // Плакат "⚡ 220В / ОПАСНО"
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.roundRect(wX + 8, wY + 6, 68, 36, 2); ctx.fill();
      ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.2; ctx.stroke();
      // Знак молнии в треугольнике
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(wX + 22, wY + 12); ctx.lineTo(wX + 14, wY + 28); ctx.lineTo(wX + 30, wY + 28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fef08a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚡', wX + 22, wY + 26);
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('220 ВОЛЬТ', wX + 34, wY + 18);
      ctx.font = '5px sans-serif'; ctx.fillText('РАБОТА В СИЗ!', wX + 34, wY + 28);
      ctx.fillText('ГОСТ 12.1.009', wX + 34, wY + 36);

      // Промышленные аналоговые круглые часы на стене справа
      const clkX = wX + 116, clkY = wY + 24;
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(clkX, clkY, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5; ctx.stroke();
      // Деления циферблата
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 12; i++){
        const ang = i * Math.PI / 6;
        ctx.fillRect(clkX + Math.cos(ang) * 12.5 - 0.75, clkY + Math.sin(ang) * 12.5 - 0.75, 1.5, 1.5);
      }
      // Стрелки часов (анимированные секундная и минутная)
      const secAng = (now * 0.001) % (Math.PI * 2);
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(clkX, clkY); ctx.lineTo(clkX + 7, clkY - 4); ctx.stroke(); // часовая
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(clkX, clkY); ctx.lineTo(clkX - 2, clkY - 10); ctx.stroke(); // минутная
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(clkX, clkY); ctx.lineTo(clkX + Math.cos(secAng) * 12, clkY + Math.sin(secAng) * 12); ctx.stroke();

    } else if (currentSpec === 'ts'){
      // ============================================================
      // ТС: НАСТЕННЫЙ ДЕКОР
      // 1. Слева: Принципиальная схема котельной и теплосети Т1/Т2 (КВ-ГМ, насосы, теплообменники)
      // 2. Вверху: Двойная магистраль Т1 (95°C) и Т2 (70°C) с манометрами
      // 3. Центр-лево: Слесарный инструментальный щит (тяжелые трубные ключи Stillson, маска)
      // 4. Центр-право: Настенный микропроцессорный тепловычислитель ТСК с дисплеем
      // 5. Справа: Плакат безопасности котельной и пожарный пост с гидрантом
      // ============================================================

      // --- 1. ПРИНЦИПИАЛЬНАЯ СХЕМА ТЕПЛОСЕТИ (x = 88..270, y = 64..112) ---
      const bX = 88, bY = 64, bW = 182, bH = 46;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bX + 2, bY + 2, bW, bH);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(bX, bY, bW, bH);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(bX, bY, bW, bH);
      ctx.fillStyle = '#0c131d'; ctx.fillRect(bX + 4, bY + 4, bW - 8, bH - 8);

      // Символ котла [ КОТЕЛ КВ-ГМ ]
      ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.roundRect(bX + 10, bY + 10, 38, 22, 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('КОТЕЛ', bX + 29, bY + 19);
      ctx.font = '5px monospace'; ctx.fillText('КВ-ГМ', bX + 29, bY + 27);

      // Красная линия подачи Т1 (95°C)
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bX + 48, bY + 16); ctx.lineTo(bX + 104, bY + 16); ctx.stroke();

      // Циркуляционный сетевой насос (круг со стрелкой)
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(bX + 74, bY + 16, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 7px sans-serif'; ctx.fillText('▶', bX + 75, bY + 18.5);

      // Теплообменник пластинчатый [ Т/О ]
      ctx.fillStyle = '#334155'; ctx.fillRect(bX + 104, bY + 10, 24, 26);
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.8;
      for (let px = bX + 108; px < bX + 126; px += 4){
        ctx.beginPath(); ctx.moveTo(px, bY + 10); ctx.lineTo(px, bY + 36); ctx.stroke();
      }

      // Синяя линия обратки Т2 (70°C)
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bX + 104, bY + 30); ctx.lineTo(bX + 48, bY + 30); ctx.stroke();

      // Легенда схемы
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 5.5px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Т1: 95°C (6.0 бар)', bX + 132, bY + 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Т2: 70°C (4.2 бар)', bX + 132, bY + 28);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('ΔT = 25°C · НОРМА', bX + 132, bY + 38);

      // --- 2. СЛЕСАРНЫЙ ЩИТ ТРУБОПРОВОДЧИКА (x = 300..424, y = 64..112) ---
      const pX = 300, pY = 64, pW = 124, pH = 46;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(pX + 2, pY + 2, pW, pH);
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 3); ctx.fill();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2; ctx.stroke();
      // Стальная сетка
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.8;
      for (let x = pX + 6; x < pX + pW; x += 8){ ctx.beginPath(); ctx.moveTo(x, pY); ctx.lineTo(x, pY + pH); ctx.stroke(); }
      // 3 тяжелых трубных ключа Stillson с красными рукоятками
      [0, 1, 2].forEach(i => {
        const kx = pX + 14 + i * 14;
        ctx.fillStyle = '#dc2626'; ctx.fillRect(kx, pY + 8, 4.5, 18 + i * 4);
        ctx.fillStyle = '#475569'; ctx.fillRect(kx - 3, pY + 8, 10.5, 6);
        ctx.fillStyle = '#1e293b'; ctx.fillRect(kx - 1, pY + 14, 6.5, 2);
      });
      // Маска сварщика
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(pX + 62, pY + 10, 18, 24, 4); ctx.fill();
      ctx.fillStyle = '#0284c7'; ctx.fillRect(pX + 66, pY + 15, 10, 5);
      // Строительный уровень (желтый с глазком)
      ctx.fillStyle = '#eab308'; ctx.fillRect(pX + 88, pY + 12, 28, 6);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(pX + 100, pY + 13.5, 4, 3);
      // Разводной ключ и рулетка
      ctx.fillStyle = '#64748b'; ctx.fillRect(pX + 90, pY + 24, 18, 4);
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(pX + 114, pY + 28, 5, 0, Math.PI * 2); ctx.fill();

      // --- 3. НАСТЕННЫЙ ТЕПЛОВЫЧИСЛИТЕЛЬ ТСК-7 (x = 640..776, y = 64..112) ---
      const tX = 640, tY = 64, tW = 136, tH = 46;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(tX + 2, tY + 2, tW, tH);
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(tX, tY, tW, tH, 3); ctx.fill();
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.stroke();
      // Зеленый матричный LCD экран тепловычислителя
      ctx.fillStyle = '#022c22'; ctx.fillRect(tX + 10, tY + 8, 86, 20);
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 0.8; ctx.strokeRect(tX + 10, tY + 8, 86, 20);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 7.5px monospace'; ctx.textAlign = 'left';
      ctx.fillText('Q = 1.08 Гкал/ч', tX + 14, tY + 17);
      ctx.fillText('G = 42.5 т/ч', tX + 14, tY + 25);
      // Мигающий индикатор импульса
      const pGlow = Math.sin(now * 0.008) > 0;
      ctx.fillStyle = pGlow ? '#22c55e' : '#14532d'; ctx.beginPath(); ctx.arc(tX + 88, tY + 13, 2.5, 0, Math.PI * 2); ctx.fill();
      // Кнопки управления теплосчетчиком
      ['#38bdf8', '#f59e0b', '#94a3b8'].forEach((btnCol, i) => {
        ctx.fillStyle = btnCol; ctx.beginPath(); ctx.arc(tX + 108 + i * 8, tY + 16, 2.8, 0, Math.PI * 2); ctx.fill();
      });
      // Подпись прибора
      ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 6px sans-serif';
      ctx.fillText('ТЕПЛОВЫЧИСЛИТЕЛЬ ТСК-7 · УЗ-РАСХОДОМЕР', tX + 10, tY + 38);

      // --- 4. ПЛАКАТ БЕЗОПАСНОСТИ КОТЕЛЬНОЙ И ОГНЕТУШИТЕЛЬ (x = 796..960, y = 64..112) ---
      const wX = 796, wY = 64;
      // Плакат "⚠ ОСТОРОЖНО: ГОРЯЧАЯ ВОДА И ПАР"
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.roundRect(wX + 8, wY + 6, 76, 36, 2); ctx.fill();
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#c2410c'; ctx.font = 'bold 6.5px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('⚠ ВНИМАНИЕ!', wX + 14, wY + 16);
      ctx.font = '5px sans-serif'; ctx.fillStyle = '#0f172a';
      ctx.fillText('ТЕМПЕРАТУРА Т1 = 95°C', wX + 14, wY + 25);
      ctx.fillText('ДАВЛЕНИЕ ДО 1.6 МПа', wX + 14, wY + 33);

      // Пожарный шкаф ШПК (красный ящик с рукавом)
      const fX = wX + 96, fY = wY + 6;
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.roundRect(fX, fY, 32, 36, 2); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(fX + 5, fY + 5, 22, 26);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ПК', fX + 16, fY + 18);
      ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(fX + 16, fY + 25, 4.5, 0, Math.PI * 2); ctx.stroke();

      // Манометры на подвесной трубе Т1 / Т2 (х = 260 и х = 600)
      [260, 600].forEach((mx, idx) => {
        const pVal = (idx === 0) ? '6.0' : '4.2';
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, 46); ctx.lineTo(mx, 60); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, 62, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(mx, 62); ctx.lineTo(mx + 4, mx === 260 ? 58 : 64); ctx.stroke();
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 4.5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(pVal, mx, 68);
      });
    }
    ctx.restore();
  }

  function drawRoomProps(now){
    if (currentSpec === 'ksk') return drawKskProps(now);
    if (currentSpec === 'p') return drawPProps(now);
    // ============================================================
    // 1. БОЛЬШОЕ ОКНО СЛЕВА И РЕАЛИСТИЧНЫЙ СОЛНЕЧНЫЙ СВЕТ НА ПОЛУ
    // ============================================================
    const winX = 2, winY = 46, winW = 68, winH = 460;
    ctx.save();
    const skyG = ctx.createLinearGradient(winX, winY, winX + winW, winY + winH);
    skyG.addColorStop(0, '#fde68a');
    skyG.addColorStop(0.3, '#7dd3fc');
    skyG.addColorStop(1, '#064e3b');
    ctx.fillStyle = skyG;
    ctx.fillRect(winX, winY, winW, winH);

    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3.5;
    ctx.strokeRect(winX, winY, winW, winH);
    ctx.fillStyle = '#1e293b';
    for (let py = winY + 65; py < winY + winH; py += 65){
      ctx.fillRect(winX, py, winW, 3.5);
    }
    ctx.fillRect(winX + winW/2, winY, 3.5, winH);

    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 9; i++){
      const vx = winX + 6 + (i * 7) % 36;
      const vy = winY + 4 + i * 9;
      ctx.beginPath(); ctx.arc(vx, vy, 7, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#22c55e';
    for (let i = 0; i < 7; i++){
      const vx = winX + 10 + (i * 6) % 30;
      const vy = winY + 8 + i * 8;
      ctx.beginPath(); ctx.arc(vx, vy, 4.5, 0, Math.PI*2); ctx.fill();
    }

    // РЕАЛИСТИЧНАЯ ПРОЕКЦИЯ СВЕТА И ТЕНЕЙ ОТ РАМЫ НА ПОЛ
    ctx.globalCompositeOperation = 'lighter';
    const sunbeam = ctx.createLinearGradient(winX + winW, winY + 40, winX + 440, winY + 500);
    sunbeam.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
    sunbeam.addColorStop(0.4, 'rgba(251, 191, 36, 0.12)');
    sunbeam.addColorStop(0.85, 'rgba(251, 191, 36, 0.03)');
    sunbeam.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = sunbeam;
    ctx.beginPath();
    ctx.moveTo(winX + winW, winY + 20);
    ctx.lineTo(winX + winW, winY + 360);
    ctx.lineTo(winX + 460, winY + 520);
    ctx.lineTo(winX + 160, winY + 520);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
    for (let i = 0; i < 5; i++){
      const y0 = winY + 50 + i * 65;
      ctx.beginPath();
      ctx.moveTo(winX + winW, y0);
      ctx.lineTo(winX + winW, y0 + 42);
      ctx.lineTo(winX + winW + 280, y0 + 175);
      ctx.lineTo(winX + winW + 280, y0 + 140);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 5; i++){
      const y0 = winY + 92 + i * 65;
      ctx.beginPath();
      ctx.moveTo(winX + winW, y0);
      ctx.lineTo(winX + winW, y0 + 5);
      ctx.lineTo(winX + winW + 280, y0 + 145);
      ctx.lineTo(winX + winW + 280, y0 + 140);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let i = 0; i < 14; i++){
      const seed = i * 137.5;
      const px = winX + winW + 30 + ((seed * 11 + now * 0.012) % 240);
      const py = winY + 60 + ((seed * 19 + Math.sin(now * 0.001 + i) * 15) % 360);
      ctx.beginPath();
      ctx.arc(px, py, 1.2 + Math.sin(now * 0.003 + i) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ============================================================
    // 2. ВЕРХНИЕ ИНДУСТРИАЛЬНЫЕ СВЕТИЛЬНИКИ И КАБЕЛЬНЫЙ ЛОТОК
    // ============================================================
    ctx.save();
    ctx.fillStyle = '#334155'; ctx.fillRect(72, 38, 920, 6);
    ctx.fillStyle = '#64748b'; ctx.fillRect(72, 40, 920, 2);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(72, 41); ctx.lineTo(992, 41); ctx.stroke();
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(72, 43); ctx.lineTo(992, 43); ctx.stroke();

    [260, 530, 800].forEach(lx => {
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(lx, 44); ctx.lineTo(lx, 66); ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.moveTo(lx - 12, 74); ctx.lineTo(lx + 12, 74); ctx.lineTo(lx + 5, 66); ctx.lineTo(lx - 5, 66); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(lx, 75, 4, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(lx, 75, lx, 320);
      lg.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
      lg.addColorStop(0.6, 'rgba(254, 240, 138, 0.04)');
      lg.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(lx - 12, 75);
      ctx.lineTo(lx + 12, 75);
      ctx.lineTo(lx + 80, 320);
      ctx.lineTo(lx - 80, 320);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // ============================================================
    // 3. НАПОЛЬНЫЙ СПЕЦИАЛИЗИРОВАННЫЙ ДЕКОР
    // ============================================================
    if (currentSpec === 'kip'){
      // МОБИЛЬНАЯ ПРИБОРНАЯ ТЕЛЕЖКА С ОСЦИЛЛОГРАФОМ (x = 2.5 * TILE, y = 10 * TILE)
      const oscX = 2.5 * TILE, oscY = 10 * TILE;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(oscX + 16, oscY + 22, 22, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.fillRect(oscX, oscY + 6, 32, 14);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(oscX + 4, oscY + 20, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(oscX + 28, oscY + 20, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(oscX + 2, oscY - 14, 28, 20, 2); ctx.fill();
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#022c22'; ctx.fillRect(oscX + 5, oscY - 11, 16, 14);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < 16; x++){
        const sy = oscY - 4 + Math.sin(now * 0.01 + x * 0.6) * 4;
        if (x === 0) ctx.moveTo(oscX + 5 + x, sy);
        else ctx.lineTo(oscX + 5 + x, sy);
      }
      ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(oscX + 24, oscY - 7, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(oscX + 24, oscY + 1, 2, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // ОГНЕТУШИТЕЛЬ ОУ-3 НА СТЕНЕ (x = 19.5 * TILE, y = 4.5 * TILE)
      const feX = 19.5 * TILE, feY = 4.5 * TILE;
      ctx.save();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.roundRect(feX, feY, 8, 22, 3); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(feX + 2, feY - 4, 4, 4);
      ctx.fillStyle = '#334155'; ctx.fillRect(feX + 5, feY - 2, 6, 2);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(feX + 2, feY + 8, 4, 6);
      ctx.restore();

      // СТЕЛЛАЖ С ПАПКАМИ И КОРОБКАМИ МЕЖДУ ВЕРХНИМИ СТОЛАМИ
      const shX = 7.1 * TILE, shY = 2.6 * TILE;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(shX + 2, shY + 50, 34, 6);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(shX, shY, 34, 52);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(shX, shY, 34, 52);
      [shY + 16, shY + 34].forEach(sy => { ctx.fillStyle = '#334155'; ctx.fillRect(shX + 2, sy, 30, 2.5); });
      ['#ef4444', '#3b82f6', '#eab308', '#22c55e'].forEach((col, i) => {
        ctx.fillStyle = col; ctx.fillRect(shX + 4 + i * 6, shY + 4, 4.5, 11);
      });
      ctx.fillStyle = '#64748b'; ctx.fillRect(shX + 5, shY + 21, 10, 11);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(shX + 18, shY + 22, 11, 10);
      ctx.fillStyle = '#475569'; ctx.fillRect(shX + 4, shY + 39, 26, 9);
      ctx.restore();

      // ДИВАНЧИК В ЛЕВОМ НИЖНЕМ УГЛУ
      const sfX = 1.6 * TILE, sfY = 12.6 * TILE;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(sfX - 2, sfY + 4, 68, 22, 5); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(sfX, sfY - 12, 64, 18, 4); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(sfX + 4, sfY, 56, 16, 3); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(sfX + 31, sfY + 1, 2, 14);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(sfX - 4, sfY - 4, 8, 20); ctx.fillRect(sfX + 60, sfY - 4, 8, 20);
      ctx.restore();

      // ПРИБОРНАЯ ТУМБОЧКА СПРАВА ВНИЗУ
      const cabX = 20.5 * TILE, cabY = 12.2 * TILE;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(cabX, cabY + 22, 24, 5);
      ctx.fillStyle = '#334155'; ctx.fillRect(cabX, cabY, 24, 22);
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.strokeRect(cabX, cabY, 24, 22);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(cabX + 4, cabY - 12, 16, 12);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(cabX + 6, cabY - 10, 12, 7);
      ctx.restore();

    } else if (currentSpec === 'ts'){
      // ДЫМОХОД / ГАЗОХОД КОТЛА ВДОЛЬ ПРАВОЙ СТЕНЫ
      ctx.save();
      const ductX = 21 * TILE - 8;
      ctx.fillStyle = '#475569'; ctx.fillRect(ductX, 46, 26, 140);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.strokeRect(ductX, 46, 26, 140);
      ctx.fillStyle = '#94a3b8';
      for (let ry = 55; ry < 180; ry += 20){
        ctx.fillRect(ductX, ry, 26, 2.5);
      }
      ctx.restore();

      // БИМЕТАЛЛИЧЕСКИЙ РАДИАТОР ОТОПЛЕНИЯ (x = 2.5 * TILE, y = 10 * TILE)
      ctx.save();
      const radX = 2.5 * TILE, radY = 10 * TILE;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(radX + 22, radY + 20, 26, 6, 0, 0, Math.PI*2); ctx.fill();
      for (let s = 0; s < 7; s++){
        const sx = radX + s * 6;
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(sx, radY - 6, 4.5, 24, 1.5); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.8; ctx.stroke();
      }
      ctx.fillStyle = '#ef4444'; ctx.fillRect(radX - 4, radY - 4, 4, 6);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(radX - 4, radY + 14, 4, 3);
      ctx.restore();

      // КРАСНЫЙ ГИДРОАККУМУЛЯТОР (x = 18.5 * TILE, y = 9.5 * TILE)
      ctx.save();
      const expX = 18.5 * TILE, expY = 9.5 * TILE;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(expX + 10, expY + 24, 14, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.roundRect(expX, expY - 10, 20, 32, 6); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(expX + 2, expY + 22, 3, 5);
      ctx.fillRect(expX + 15, expY + 22, 3, 5);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(expX + 8, expY - 14, 4, 4);
      ctx.restore();

      // СЛИВНЫЕ КАНАЛИЗАЦИОННЫЕ ТРАПЫ НА ПОЛУ
      [7 * TILE, 15 * TILE].forEach(tx => {
        ctx.save();
        ctx.fillStyle = '#0f172a'; ctx.fillRect(tx, 6 * TILE, 24, 24);
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.strokeRect(tx, 6 * TILE, 24, 24);
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2;
        for (let gx = tx + 4; gx < tx + 24; gx += 4){
          ctx.beginPath(); ctx.moveTo(gx, 6 * TILE + 2); ctx.lineTo(gx, 6 * TILE + 22); ctx.stroke();
        }
        ctx.restore();
      });

      // ОРАНЖЕВЫЙ РАДИАТОР ПОД ОКНОМ СЛЕВА
      ctx.save();
      const wrX = 1.65 * TILE, wrY = 5.4 * TILE;
      for (let i = 0; i < 6; i++){
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.roundRect(wrX, wrY + i * 5.5, 11, 4, 1); ctx.fill();
        ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 0.7; ctx.stroke();
      }
      ctx.restore();

      // СТЕЛЛАЖ С ЗАПЧАСТЯМИ МЕЖДУ ВЕРХНИМИ СТОЛАМИ
      const shX = 7.1 * TILE, shY = 2.6 * TILE;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(shX + 2, shY + 50, 34, 6);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(shX, shY, 34, 52);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(shX, shY, 34, 52);
      [shY + 16, shY + 34].forEach(sy => { ctx.fillStyle = '#334155'; ctx.fillRect(shX + 2, sy, 30, 2.5); });
      ctx.fillStyle = '#64748b'; ctx.fillRect(shX + 5, shY + 5, 10, 10);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(shX + 18, shY + 6, 11, 9);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(shX + 6, shY + 21, 22, 10);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(shX + 5, shY + 38, 12, 10);
      ctx.restore();

      // ТОЛСТАЯ МАГИСТРАЛЬ С КРАСНЫМ ВЕНТИЛЕМ В ПРАВОМ НИЖНЕМ УГЛУ
      ctx.save();
      const cpX = 19.8 * TILE, cpY = 12.8 * TILE;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cpX, cpY + 6, 70, 14);
      ctx.fillRect(cpX + 52, cpY - 26, 14, 46);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cpX, cpY + 9, 70, 4);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(cpX + 30, cpY + 2, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
    }
// ============================================================
    // 4. ЦЕНТРАЛЬНЫЙ ЧЕРТЕЖНЫЙ СТОЛ С ПЛАНОМ ЦЕХА, КАСКАМИ И ТАБУРЕТАМИ (x = 11, y = 8)
    // ============================================================
    const cx = 11 * TILE + TILE / 2;
    const cy = 8 * TILE + TILE / 2;
    const tblW = 106, tblH = 38;

    ctx.save();
    // Желто-черная разметка безопасности на полу под столом
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
    ctx.strokeRect(cx - tblW/2 - 8, cy - tblH/2 - 4, tblW + 16, tblH + 24);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.strokeRect(cx - tblW/2 - 8, cy - tblH/2 - 4, tblW + 16, tblH + 24);
    ctx.setLineDash([]);

    // Тень стола
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 18, tblW/2 + 6, 12, 0, 0, Math.PI * 2); ctx.fill();

    // Ножки стола
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - tblW/2 + 6, cy - 4, 5, 20);
    ctx.fillRect(cx + tblW/2 - 11, cy - 4, 5, 20);

    // Столешница
    ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(cx - tblW/2, cy - tblH/2, tblW, tblH, 4); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.stroke();

    // Развернутый синий чертеж цеха с белыми линиями схем
    ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(cx - 30, cy - tblH/2 + 4, 60, 26, 2); ctx.fill();
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 0.8;
    ctx.strokeRect(cx - 26, cy - tblH/2 + 7, 52, 20);
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 2); ctx.lineTo(cx + 10, cy - 2); ctx.lineTo(cx + 10, cy + 6);
    ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx - 6, cy + 6);
    ctx.stroke();

    // Желтая защитная каска на чертеже слева
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(cx - 36, cy + 2, 7, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#b45309'; ctx.fillRect(cx - 43, cy + 2, 14, 2.5);

    // Подставка с карандашами и линейками справа
    ctx.fillStyle = '#0f172a'; ctx.fillRect(cx + 34, cy - 10, 8, 12);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(cx + 35, cy - 16, 2, 8);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(cx + 38, cy - 18, 2, 10);

    // Два круглых табурета перед столом
    [-24, 24].forEach(sx => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(cx + sx, cy + 28, 9, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(cx + sx - 1.5, cy + 14, 3, 14);
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.ellipse(cx + sx, cy + 14, 8, 4.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.restore();

    // ============================================================
    // 5. ЗЕЛЕНЫЕ РАСТЕНИЯ В КАДКАХ
    // ============================================================
    const plants = [
      { x: 3 * TILE, y: 7 * TILE },
      { x: 19 * TILE + 20, y: 8 * TILE }
    ];
    plants.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.roundRect(-8, 0, 16, 12, 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#16a34a';
      for (let i = 0; i < 5; i++){
        const angle = -Math.PI * 0.8 + (i * Math.PI * 0.4);
        const lx = Math.cos(angle) * 14;
        const ly = -6 + Math.sin(angle) * 14;
        ctx.beginPath(); ctx.ellipse(lx, ly, 6, 3, angle, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }

    /* ============================================================
     ВСТРОЕННАЯ 2.5D ОТРИСОВКА СТАНКОВ И ОБОРУДОВАНИЯ КИП И ТС
     Гарантирует 100% отрисовку столов независимо от скриптов!
     ============================================================ */
  function drawKIPStationInternal(type, done, hard, now, seed){
    if (type === 0){
      // 0. КОНТРОЛЬНО-ИЗМЕРИТЕЛЬНЫЕ ПРИБОРЫ (слева вверху)
      // Настенная приборная панель над столом
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-42, -40, 84, 26);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2; ctx.strokeRect(-42, -40, 84, 26);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-36, -30); ctx.lineTo(-20, -30); ctx.lineTo(-15, -34); ctx.lineTo(-4, -34);
      ctx.moveTo(-20, -30); ctx.lineTo(-20, -23); ctx.lineTo(-6, -23);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(16, -29, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, -29); ctx.lineTo(19, -32); ctx.stroke();

      // Стол лабораторный антистатический
      const deskW = 84, dropH = 16;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-deskW/2, 4, deskW, dropH);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-deskW/2, 4, 5, dropH); ctx.fillRect(deskW/2 - 5, 4, 5, dropH);
      // Столешница
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(-deskW/2, -8, deskW, 15, 3); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(-deskW/2, 5, deskW, 2);

      // Двухканальный осциллограф с зеленой осциллограммой
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-38, -26, 30, 20);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(-38, -26, 30, 20);
      ctx.fillStyle = '#021814'; ctx.fillRect(-36, -24, 26, 16);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 24; i++){
        const wx = -35 + i;
        const wy = -16 + Math.sin(i * 0.45 + now * 0.008 + seed) * 5;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Блок питания и цифровой мультиметр
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-4, -25, 22, 18);
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.strokeRect(-4, -25, 22, 18);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(20, -22, 16, 14);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(22, -20, 12, 5);
      // Провода измерительных щупов
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(24, -8); ctx.quadraticCurveTo(12, 8, 2, 0); ctx.stroke();
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(29, -8); ctx.quadraticCurveTo(20, 10, 8, 1); ctx.stroke();
    }
    else if (type === 1){
      // 1. ДИАГНОСТИКА И НАЛАДКА ОБОРУДОВАНИЯ (по центру вверху)
      // Настенный перфорированный инструментальный щит
      ctx.fillStyle = '#1e2633'; ctx.fillRect(-42, -42, 84, 28);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(-42, -42, 84, 28);
      // Инструменты на подвесах
      ctx.fillStyle = '#cbd5e1';
      [-32, -24, -16, 16, 24, 32].forEach((ix, idx) => {
        ctx.fillRect(ix, -38, 2.5, 14);
        ctx.fillStyle = idx % 2 === 0 ? '#ea580c' : '#38bdf8';
        ctx.fillRect(ix - 1, -40, 4.5, 4);
        ctx.fillStyle = '#cbd5e1';
      });

      // Стол
      const deskW = 84, dropH = 16;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-deskW/2, 4, deskW, dropH);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-deskW/2, 4, 5, dropH); ctx.fillRect(deskW/2 - 5, 4, 5, dropH);
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(-deskW/2, -8, deskW, 15, 3); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(-deskW/2, 5, deskW, 2);

      // Большой монитор диагностики с синей волной телеметрии
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-26, -30, 34, 22);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2; ctx.strokeRect(-26, -30, 34, 22);
      ctx.fillStyle = '#061325'; ctx.fillRect(-24, -28, 30, 18);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 28; i++){
        const wx = -23 + i;
        const wy = -19 + Math.sin(i * 0.38 + now * 0.007) * 5;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Калибратор сигналов справа на подставке
      ctx.fillStyle = '#0f172a'; ctx.fillRect(12, -24, 24, 16);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(14, -22, 10, 5);
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(30, -16, 2.5, 0, Math.PI*2); ctx.fill();
    }
    else if (type === 2){
      // 2. ИСПОЛНИТЕЛЬНЫЕ МЕХАНИЗМЫ И ПРИВОДЫ (справа вверху)
      // Стеклянная камера гидравлических испытаний приводов
      const boxW = 90, boxH = 50;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(-boxW/2, -boxH/2 - 6, boxW, boxH);
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#38bdf8');
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-boxW/2, -boxH/2 - 6, boxW, boxH);
      // Блики на стеклянном колпаке
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(-boxW/2 + 5, -boxH/2 - 2); ctx.lineTo(-boxW/2 + 24, -boxH/2 - 2);
      ctx.lineTo(-boxW/2 + 8, boxH/2 - 10); ctx.lineTo(-boxW/2 + 3, boxH/2 - 10);
      ctx.fill();

      // Трубы внутри камеры (желтые и серые)
      ctx.fillStyle = '#eab308'; ctx.fillRect(-38, -8, 76, 7);
      ctx.fillStyle = '#ca8a04'; ctx.fillRect(-38, -6, 76, 2.5);
      // Фланцы
      ctx.fillStyle = '#64748b';
      [-32, -12, 12, 30].forEach(fx => ctx.fillRect(fx, -12, 4.5, 14));

      // Электропривод с красным маховиком по центру
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(-9, -28, 18, 20, 2); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -28, 7, 0, Math.PI*2); ctx.fill();
      // Манометр
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(24, -19, 5.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(24, -19); ctx.lineTo(26, -22); ctx.stroke();
    }
    else if (type === 3){
      // 3. ДАТЧИКИ И ИЗМЕРИТЕЛЬНЫЕ СИСТЕМЫ (слева внизу)
      // Трубный стенд поверки датчиков давления и расхода
      const standW = 88, standH = 30;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-standW/2, 4, standW, 16);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-standW/2, 4, 5, 16); ctx.fillRect(standW/2 - 5, 4, 5, 16);
      ctx.fillStyle = '#334155'; ctx.fillRect(-standW/2, -2, standW, 9);

      // Нержавеющие трубы стенда с U-образным отводом
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-38, -15, 76, 6);
      ctx.fillRect(-38, -4, 76, 5);
      ctx.fillRect(-38, -15, 6, 14);
      ctx.fillRect(32, -15, 6, 14);

      // Промышленные датчики давления (синие «бочонки» типа Метран / Rosemount)
      [-22, 4, 24].forEach((sx, idx) => {
        ctx.fillStyle = '#64748b'; ctx.fillRect(sx + 3, -19, 2.5, 7);
        ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(sx - 3, -30, 14, 13, 2); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.fillStyle = '#042f2e'; ctx.beginPath(); ctx.arc(sx + 4, -23, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#34d399'; ctx.fillRect(sx + 2, -24.5, 4, 2);
      });

      // Цифровой терминал стенда
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-11, -24, 18, 14);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(-11, -24, 18, 14);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-9, -20, 14, 2.5);
    }
    else {
      // 4. ЭЛЕКТРИЧЕСКИЕ СХЕМЫ И ЩИТНОЕ ОБОРУДОВАНИЕ (справа внизу)
      // Открытый шкаф автоматики
      const cabW = 68, cabH = 50;
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(-cabW/2, -cabH/2 - 6, cabW, cabH, 3); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#f59e0b');
      ctx.lineWidth = 1.5; ctx.stroke();

      // DIN-рейки внутри шкафа
      ctx.fillStyle = '#475569';
      ctx.fillRect(-cabW/2 + 6, -24, cabW - 12, 3);
      ctx.fillRect(-cabW/2 + 6, -11, cabW - 12, 3);
      ctx.fillRect(-cabW/2 + 6, 2, cabW - 12, 3);

      // Клеммники и модули ПЛК
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-24, -27, 14, 9);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-8, -27, 9, 9);
      ctx.fillStyle = '#64748b'; ctx.fillRect(3, -27, 18, 9);
      // Светодиоды модулей
      const blink = Math.sin(now * 0.008 + seed) > 0;
      ctx.fillStyle = blink ? '#22c55e' : '#0f172a'; ctx.fillRect(-22, -26, 2.5, 2.5);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-17, -26, 2.5, 2.5);

      // Ноутбук инженера на столике рядом со шкафом
      ctx.fillStyle = '#334155'; ctx.fillRect(22, -4, 24, 20);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(24, -15, 20, 12);
      ctx.fillStyle = '#041d38'; ctx.fillRect(25, -14, 18, 10);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(27, -10); ctx.lineTo(39, -10); ctx.stroke();
    }
  }

  function drawTSStationInternal(type, done, hard, now, seed){
    if (type === 0){
      // 0. КОНТРОЛЬНО-ИЗМЕРИТЕЛЬНЫЕ ПРИБОРЫ (слева вверху)
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-40, -38, 80, 24);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(-40, -38, 80, 24);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-34, -30); ctx.lineTo(-12, -30); ctx.lineTo(6, -24); ctx.lineTo(32, -24); ctx.stroke();
      ctx.strokeStyle = '#0284c7';
      ctx.beginPath(); ctx.moveTo(-34, -22); ctx.lineTo(-10, -22); ctx.lineTo(8, -28); ctx.lineTo(32, -28); ctx.stroke();

      // Стол с манометрами
      const deskW = 80, dropH = 15;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-deskW/2, 4, deskW, dropH);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-deskW/2, 4, 5, dropH); ctx.fillRect(deskW/2 - 5, 4, 5, dropH);
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(-deskW/2, -8, deskW, 15, 3); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(-deskW/2, 5, deskW, 2);

      // Манометры на стойках
      [-24, -4, 16].forEach(mx => {
        ctx.fillStyle = '#64748b'; ctx.fillRect(mx + 3, -17, 2.5, 9);
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(mx + 4, -21, 6.5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(mx + 4, -21); ctx.lineTo(mx + 7, -24); ctx.stroke();
      });
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(26, -19, 11, 15);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(27, -17, 9, 5);
    }
    else if (type === 1){
      // 1. ТЕПЛОГЕНЕРИРУЮЩЕЕ И НАСОСНОЕ ОБОРУДОВАНИЕ (по центру вверху)
      const w = 86, h = 34;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-w/2, 6, w, 13);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.strokeRect(-w/2, 6, w, 13);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-w/2 + 4, -24, w - 8, 6);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-w/2 + 4, -3, w - 8, 6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-24, -24, 6, 27);
      ctx.fillRect(18, -24, 6, 27);

      // Насос 1 (красный)
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.roundRect(-36, -17, 18, 17, 3); ctx.fill();
      ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(-27, -8, 7, 0, Math.PI*2); ctx.fill();
      // Насос 2 (синий)
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(6, -17, 18, 17, 3); ctx.fill();
      ctx.fillStyle = '#0369a1'; ctx.beginPath(); ctx.arc(15, -8, 7, 0, Math.PI*2); ctx.fill();

      // Манометры на нагнетании
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(-27, -28, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, -28, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 0.9; ctx.stroke();
    }
    else if (type === 2){
      // 2. КОТЕЛЬНЫЕ УСТАНОВКИ И СИСТЕМЫ ТЕПЛОСНАБЖЕНИЯ (справа вверху)
      const boilW = 90, boilH = 48;
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.roundRect(-boilW/2, -boilH/2 - 6, boilW, boilH, 6); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#f97316');
      ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.fillRect(-boilW/2 + 4, -boilH/2 - 2, boilW - 8, 5);
      // Дымовая труба
      ctx.fillStyle = '#334155'; ctx.fillRect(22, -boilH/2 - 26, 15, 22);
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.strokeRect(22, -boilH/2 - 26, 15, 22);
      // Окно топки с пламенем
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(-15, -8, 13, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(-15, -7, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(-15, -6, 5, 0, Math.PI*2); ctx.fill();
    }
    else if (type === 3){
      // 3. ТРУБОПРОВОДЫ И АРМАТУРА (слева внизу)
      const standW = 88;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-standW/2, 4, standW, 16);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-standW/2, 4, 5, 16); ctx.fillRect(standW/2 - 5, 4, 5, 16);
      ctx.fillStyle = '#334155'; ctx.fillRect(-standW/2, -2, standW, 9);
      // Труба и арматура
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-38, -16, 76, 7);
      ctx.fillStyle = '#64748b'; ctx.fillRect(-38, -14, 76, 2.5);
      [-26, 20].forEach(vx => {
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(vx + 3, -24, 7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#334155'; ctx.fillRect(vx + 1.5, -17, 3, 6);
      });
      // Грязевик
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.roundRect(-5, -23, 14, 20, 3); ctx.fill();
    }
    else {
      // 4. ТЕПЛООБМЕННОЕ ОБОРУДОВАНИЕ (справа внизу)
      // Пластинчатый теплообменник
      const exW = 34, exH = 46;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-36, -exH/2 - 4, exW, exH);
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#f59e0b');
      ctx.lineWidth = 1.4; ctx.strokeRect(-36, -exH/2 - 4, exW, exH);
      ctx.fillStyle = '#38bdf8';
      for (let py = -exH/2 + 2; py < exH/2 - 6; py += 4){
        ctx.fillRect(-34, py, exW - 4, 1.8);
      }
      // Красный мембранный бак
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.roundRect(8, -26, 22, 36, 6); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(17, -30, 4, 5);
    }
  }

  function drawStation(c, now){
    const px = c.x * TILE + TILE / 2;
    const py = c.y * TILE + TILE / 2;
    const done = !!c.done;
    const hard = !!c.hard && !done;
    const pulse = 0.85 + Math.sin(now * 0.005 + c.seed) * 0.2;
    const stType = c.stationType ?? 0;

    ctx.save();
    ctx.translate(px, py);

    // 1. Мягкая тень под основанием станции
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.ellipse(0, 16, 34, 10, 0, 0, Math.PI * 2); ctx.fill();

    // 2. Свечение активной зоны под станцией
    if (!done){
      const glowColor = hard ? '192, 132, 252' : (currentSpec === 'ts' ? '245, 158, 11' : '56, 189, 248');
      const g = ctx.createRadialGradient(0, 8, 4, 0, 8, 42);
      g.addColorStop(0, 'rgba(' + glowColor + ',' + (0.35 * pulse) + ')');
      g.addColorStop(1, 'rgba(' + glowColor + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 8, 42, 0, Math.PI * 2); ctx.fill();
    }

    // 3. Отрисовка специализированного оборудования (гарантированная)
    if (window.STATION_RENDERERS && window.STATION_RENDERERS[currentSpec]){
      window.STATION_RENDERERS[currentSpec](stType, done, hard, now, c.seed);
    } else if (currentSpec === 'ts'){
      drawTSStationInternal(stType, done, hard, now, c.seed);
    } else {
      drawKIPStationInternal(stType, done, hard, now, c.seed);
    }

    // 4. ПУЛЬСИРУЮЩИЙ ЗНАЧОК СВЕРХУ: [ ! ] ЕСЛИ НЕ ВЫПОЛНЕНО, [ ✓ ] ЕСЛИ СДАНО
    const badgeY = -42 + Math.sin(now * 0.004 + c.seed) * 3;
    ctx.save();
    if (!done){
      // Золотистый ореол
      const bg = ctx.createRadialGradient(0, badgeY, 2, 0, badgeY, 18);
      bg.addColorStop(0, hard ? 'rgba(192, 132, 252, 0.55)' : 'rgba(245, 158, 11, 0.55)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(0, badgeY, 18, 0, Math.PI * 2); ctx.fill();

      // Кружок бейджа
      ctx.fillStyle = '#0f141d';
      ctx.beginPath(); ctx.arc(0, badgeY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : '#f59e0b';
      ctx.lineWidth = 1.8; ctx.stroke();

      // Значок восклицания
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = hard ? '#e9d5ff' : '#fbbf24';
      ctx.fillText('!', 0, badgeY);
    } else {
      // Зеленая галочка выполненного станка
      ctx.fillStyle = '#064e3b';
      ctx.beginPath(); ctx.arc(0, badgeY, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('✓', 0, badgeY);
    }
    ctx.restore();

    // Shared KSK-style nameplate for every laboratory.
    const titleText = c.title || ('Станция ' + (stType + 1));
    ctx.save();
    ctx.font = 'bold 10px monospace';
    const plateW = Math.max(170, Math.min(250, ctx.measureText(titleText).width + 20));
    const lines = [];
    let line = '';
    for (const word of titleText.split(/\s+/)) {
      const next = line ? line + ' ' + word : word;
      if (line && ctx.measureText(next).width > plateW - 16) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    const plateY = 32, plateH = 21 + Math.max(0, lines.length - 1) * 13;
    ctx.fillStyle = '#0b1b2be8';
    ctx.fillRect(-plateW / 2, plateY, plateW, plateH);
    ctx.fillStyle = done ? '#58c7aa' : '#c2a458';
    ctx.fillRect(-plateW / 2, plateY, plateW, 1);
    ctx.fillStyle = done ? '#81e4c7' : '#e3dfcc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    lines.forEach((text, index) => ctx.fillText(text, 0, plateY + 14 + index * 13, plateW - 16));
    ctx.restore();

    ctx.restore();
  }

  function drawExit(now){
    const x = exitCell.x * TILE + TILE / 2;
    const y = exitCell.y * TILE + TILE / 2;
    const sprite = getSotaSprite();
    const width = 124;
    const height = sprite ? width * sprite.height / sprite.width : 94;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 5, x, y, 76);
    glow.addColorStop(0, exitOpen ? '#70dbad40' : '#e5b95a20');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 76, y - 76, 152, 152);
    ctx.fillStyle = '#070b1480';
    ctx.beginPath();ctx.ellipse(x, y + 19, 63, 12, 0, 0, Math.PI * 2);ctx.fill();
    if (sprite) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, x - width / 2, y + 19 - height, width, height);
    }
    ctx.fillStyle = '#0b1b2be8';
    ctx.fillRect(x - 63, y + 24, 126, 32);
    ctx.fillStyle = exitOpen ? '#58c7aa' : '#c2a458';
    ctx.fillRect(x - 63, y + 24, 126, 1);
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = exitOpen ? '#81e4c7' : '#e3dfcc';
    ctx.fillText('СОТА', x, y + 37);
    ctx.font = '9px monospace';
    ctx.fillText(exitOpen ? 'Можно войти' : collected + ' / ' + needed, x, y + 49);
    ctx.restore();
  }

  const SKINS_BY_SPEC = {
    kip: [
      {
        id: 'kip_tech', name: 'Наладчик КИПиА',
        desc: 'Специалист по автоматике и контрольно-измерительным приборам цеха. Настраивает датчики и промышленные контроллеры.',
        lines: {
          correct: ['Сигнал 4–20 мА в норме!', 'Станок откалиброван без сбоев.', 'Точно по техрегламенту!'],
          wrong: ['Погрешность выше допуска!', 'Проверь сопротивление изоляции.', 'Сбой сигнала.'],
          descend: 'Все приборы цеха проверены! Идём к СОТЕ!'
        },
        suit: '#0284c7', suit2: '#0369a1', suitDark: '#075985',
        helmet: '#facc15', helmetDark: '#ca8a04', skin: '#fcd34d', accent: '#38bdf8',
        headgear: 'helmet', outfit: 'workwear', prop: 'multimeter'
      },
      {
        id: 'kip_metrolog', name: 'Метролог-поверитель',
        desc: 'Инженер лаборатории поверки. Сверяет эталоны измерений и классы точности заводских датчиков.',
        lines: {
          correct: ['Класс точности подтверждён!', 'Эталон сверен.', 'Погрешность 0.05% — идеально!'],
          wrong: ['Выход за пределы шкалы.', 'Требуется нуль-калибровка.', 'Показания расходятся.'],
          descend: 'Лабораторные испытания завершены!'
        },
        suit: '#f1f5f9', suit2: '#cbd5e1', suitDark: '#94a3b8',
        helmet: '#334155', helmetDark: '#1e293b', skin: '#fcd34d', accent: '#0284c7',
        headgear: 'hair', hairColor: '#475569', glasses: true, outfit: 'labcoat', prop: 'tablet'
      },
      {
        id: 'kip_asu', name: 'Инженер АСУ ТП',
        desc: 'Специалист по промышленным сетям Modbus/Profibus и программируемым логическим контроллерам.',
        lines: {
          correct: ['Контроллер в режиме RUN!', 'Пакеты данных без потерь.', 'SCADA регистрирует норму.'],
          wrong: ['Потеря связи с узлом.', 'Таймаут опроса датчика.', 'Проверь конфигурацию ПЛК.'],
          descend: 'Сегмент автоматики сдан в эксплуатацию!'
        },
        suit: '#1e293b', suit2: '#0f172a', suitDark: '#020617',
        helmet: '#38bdf8', helmetDark: '#0284c7', skin: '#fcd34d', accent: '#f59e0b',
        headgear: 'helmet', glasses: true, outfit: 'vest', prop: 'laptop'
      }
    ],
    ts: [
      {
        id: 'ts_master', name: 'Мастер теплосетей',
        desc: 'Специалист по тепловым пунктам и трубопроводам. Держит гидравлический режим и давление под контролем.',
        lines: {
          correct: ['Давление в контуре оптимально!', 'Циркуляция теплоносителя в норме.', 'Опрессовка пройдена!'],
          wrong: ['Опасность гидроудара!', 'Воздушная пробка в системе.', 'Сбрось избыток через клапан.'],
          descend: 'Тепловой узел сдан! Переходим дальше!'
        },
        suit: '#c2410c', suit2: '#9a3412', suitDark: '#7c2d12',
        helmet: '#ea580c', helmetDark: '#c2410c', skin: '#fcd34d', accent: '#fb923c',
        headgear: 'helmet', outfit: 'workwear', prop: 'tablet'
      },
      {
        id: 'ts_engineer', name: 'Инженер-теплотехник',
        desc: 'Специалист по пластинчатым теплообменникам и тепловым балансам зданий.',
        lines: {
          correct: ['КПД теплообменника 98%!', 'Температурный график 150/70 соблюдён.', 'Теплосъём стабилен.'],
          wrong: ['Недогрев вторичного контура!', 'Перепад давлений выше нормы.', 'Проверь балансировочный клапан.'],
          descend: 'Контур сбалансирован. Идём дальше!'
        },
        suit: '#0284c7', suit2: '#0369a1', suitDark: '#075985',
        helmet: '#f8fafc', helmetDark: '#cbd5e1', skin: '#fcd34d', accent: '#ea580c',
        headgear: 'helmet', outfit: 'workwear', prop: 'tablet'
      },
      {
        id: 'ts_boiler', name: 'Оператор котельной',
        desc: 'Специалист котельного оборудования, горелочных устройств и систем водоподготовки.',
        lines: {
          correct: ['Факел горелки стабилен!', 'Паровой котёл в рабочем режиме.', 'ХВО подготовлена отлично.'],
          wrong: ['Внимание: тяга снижена!', 'Превышение давления пара.', 'Сработала автоматика безопасности.'],
          descend: 'Котельный зал проверен!'
        },
        suit: '#334155', suit2: '#1e293b', suitDark: '#0f172a',
        helmet: '#dc2626', helmetDark: '#991b1b', skin: '#fcd34d', accent: '#f59e0b',
        headgear: 'helmet', outfit: 'workwear', prop: 'tablet'
      }
    ],
    p: [
      {
        id: 'p_front', name: 'Frontend-разработчик',
        desc: 'Создатель современных интерфейсов и веб-приложений СОТА. Быстрый рендеринг и чистый CSS.',
        lines: {
          correct: ['Интерфейс отрисован без задержек!', 'Компоненты синхронизированы.', 'Zero errors в консоли!'],
          wrong: ['Uncaught TypeError!', 'Layout shift обнаружен.', 'Проверь зависимости.'],
          descend: 'Спринт завершён! Релизим фичу!'
        },
        suit: '#4338ca', suit2: '#3730a3', suitDark: '#312e81',
        helmet: '#a855f7', helmetDark: '#7e22ce', skin: '#fcd34d', accent: '#38bdf8',
        headgear: 'headphones', hairColor: '#1e293b', glasses: true, outfit: 'hoodie', prop: 'laptop'
      },
      {
        id: 'p_back', name: 'Backend-архитектор',
        desc: 'Проектировщик баз данных, высоконагруженных API и серверной логики.',
        lines: {
          correct: ['Запрос выполнен за 2 мс!', 'Транзакция ACID зафиксирована.', 'Микросервисы онлайн.'],
          wrong: ['Deadlock в базе данных!', 'HTTP 500 Internal Error.', 'Проверь индексы.'],
          descend: 'Бэкенд масштабирован! Идём дальше!'
        },
        suit: '#1e293b', suit2: '#0f172a', suitDark: '#020617',
        helmet: '#10b981', helmetDark: '#059669', skin: '#fcd34d', accent: '#38bdf8',
        headgear: 'beanie', hairColor: '#334155', glasses: true, outfit: 'hoodie', prop: 'coffee'
      },
      {
        id: 'p_devops', name: 'DevOps-инженер',
        desc: 'Мастер CI/CD пайплайнов, Kubernetes кластеров и облачной инфраструктуры.',
        lines: {
          correct: ['Пайплайн зелёный!', 'Кластер развернут штатно.', 'Docker образ собран.'],
          wrong: ['Build failed: ошибка линтера.', 'Pod CrashLoopBackOff.', 'Проверь переменные окружения.'],
          descend: 'Деплой в прод успешен!'
        },
        suit: '#047857', suit2: '#065f46', suitDark: '#064e3b',
        helmet: '#f59e0b', helmetDark: '#d97706', skin: '#fcd34d', accent: '#10b981',
        headgear: 'cap', hairColor: '#78350f', glasses: false, outfit: 'hoodie', prop: 'laptop'
      }
    ],
    ksk: [
      {
        id: 'ksk_builder', name: 'Сборщик ПК',
        desc: 'Специалист по архитектуре компьютеров, установке процессоров, видеокарт и охлаждения.',
        lines: {
          correct: ['Термопаста нанесена идеально!', 'POST-код 00 — запуск успешен.', 'Кабель-менеджмент на высоте!'],
          wrong: ['Не до конца защёлкнут слот RAM!', 'Перекос сокета CPU.', 'Короткое замыкание.'],
          descend: 'Рабочая станция собрана и протестирована!'
        },
        suit: '#1d4ed8', suit2: '#1e3a8a', suitDark: '#172554',
        helmet: '#f97316', helmetDark: '#ea580c', skin: '#fcd34d', accent: '#38bdf8',
        headgear: 'cap', hairColor: '#1e293b', glasses: true, outfit: 'vest', prop: 'multimeter'
      },
      {
        id: 'ksk_sysadmin', name: 'Системный администратор',
        desc: 'Управляет серверными стойками, доменами и безопасностью корпоративной сети.',
        lines: {
          correct: ['RAID-массив синхронизирован!', 'Бэкап создан успешно.', 'Сервер в аптайме 99.99%.'],
          wrong: ['Отказ накопителя!', 'Перегрузка процессора 100%.', 'Сбой прав доступа.'],
          descend: 'Серверный сектор защищён!'
        },
        suit: '#1e293b', suit2: '#0f172a', suitDark: '#020617',
        helmet: '#38bdf8', helmetDark: '#0284c7', skin: '#fcd34d', accent: '#fbbf24',
        headgear: 'hair', hairColor: '#0f172a', glasses: true, outfit: 'vest', prop: 'laptop'
      },
      {
        id: 'ksk_net', name: 'Сетевой инженер',
        desc: 'Настраивает маршрутизаторы, коммутаторы, VLAN и обжимает витую пару.',
        lines: {
          correct: ['Линк 10 Гбит/с поднят!', 'Пинг 1 мс без потерь.', 'Таблица маршрутизации в норме.'],
          wrong: ['Затухание сигнала в кабеле!', 'Петля коммутации (STP).', 'Неверный шлюз.'],
          descend: 'Сетевая магистраль проложена!'
        },
        suit: '#0369a1', suit2: '#075985', suitDark: '#0c4a6e',
        helmet: '#38bdf8', helmetDark: '#0284c7', skin: '#fcd34d', accent: '#38bdf8',
        headgear: 'hair', hairColor: '#713f12', glasses: false, outfit: 'vest', prop: 'tablet'
      }
    ],
    e: [
      {
        id: 'e_electrician', name: 'Электромонтажник',
        desc: 'Специалист по силовым сетям, трансформаторам и распределительным щитам.',
        lines: {
          correct: ['Напряжение 380 В в норме!', 'Шина заземлена надежно.', 'Автомат подобран по току.'],
          wrong: ['Опасность межфазного замыкания!', 'Перегрев кабельной линии.', 'Проверь УЗО.'],
          descend: 'Подстанция в строю!'
        },
        suit: '#1e3a8a', suit2: '#172554', suitDark: '#0f172a',
        helmet: '#facc15', helmetDark: '#ca8a04', skin: '#fcd34d', accent: '#ef4444'
      },
      {
        id: 'e_relay', name: 'Инженер-релейщик',
        desc: 'Специалист релейной защиты и противоаварийной автоматики подстанций.',
        lines: {
          correct: ['Уставка защиты рассчитана верно!', 'МТЗ сработала селективно.', 'Трансформатор тока проверен.'],
          wrong: ['Ложное срабатывание защиты!', 'Нарушена селективность.', 'Обрыв цепей напряжения.'],
          descend: 'Схема релейной защиты протестирована!'
        },
        suit: '#f8fafc', suit2: '#e2e8f0', suitDark: '#94a3b8',
        helmet: '#f8fafc', helmetDark: '#cbd5e1', skin: '#fcd34d', accent: '#3b82f6'
      },
      {
        id: 'e_chief', name: 'Главный энергетик',
        desc: 'Руководит энергосистемой предприятия, энергоаудитом и графиками нагрузок.',
        lines: {
          correct: ['Коэффициент мощности cos φ = 0.98!', 'Энергопотребление в лимите.', 'График нагрузок оптимален.'],
          wrong: ['Штраф за реактивную мощность!', 'Пиковая перегрузка ввода.', 'Проверь конденсаторную установку.'],
          descend: 'Энергохозяйство принято!'
        },
        suit: '#0f172a', suit2: '#020617', suitDark: '#000000',
        helmet: '#f8fafc', helmetDark: '#cbd5e1', skin: '#fcd34d', accent: '#f59e0b'
      }
    ],
    reu: [
      {
        id: 'reu_tech', name: 'Электромонтер РЭУ',
        desc: 'Мастер ремонта и эксплуатации промышленного электрооборудования цехов.',
        lines: {
          correct: ['Изоляция обмоток 500 МОм!', 'Подшипники смазаны, вибрация в норме.', 'Пуск двигателя плавный.'],
          wrong: ['Пробой изоляции на корпус!', 'Перекос фаз выше нормы.', 'Проверь тепловое реле.'],
          descend: 'Оборудование цеха допущено к работе!'
        },
        suit: '#1d4ed8', suit2: '#1e3a8a', suitDark: '#172554',
        helmet: '#f97316', helmetDark: '#ea580c', skin: '#fcd34d', accent: '#facc15'
      },
      {
        id: 'reu_service', name: 'Техник обслуживания',
        desc: 'Диагностирует электронные блоки, частотные преобразователи и приводы станков.',
        lines: {
          correct: ['Частотник настроен штатно!', 'Тормозной резистор в норме.', 'Плавная регулировка скорости.'],
          wrong: ['Ошибка перегрузки по току!', 'Перегрев силового модуля IGBT.', 'Проверь экранирование кабеля.'],
          descend: 'Электронный блок протестирован!'
        },
        suit: '#0284c7', suit2: '#0369a1', suitDark: '#075985',
        helmet: '#facc15', helmetDark: '#ca8a04', skin: '#fcd34d', accent: '#38bdf8'
      },
      {
        id: 'reu_master', name: 'Мастер участка',
        desc: 'Организует планово-предупредительный ремонт и безопасную эксплуатацию установок.',
        lines: {
          correct: ['Наряд-допуск закрыт без замечаний!', 'Акт технической готовности подписан.', 'Безопасность 100%.'],
          wrong: ['Нарушение техники безопасности!', 'Не установлены защитные заземления.', 'Отсутствует блокировка.'],
          descend: 'Участок аттестован!'
        },
        suit: '#334155', suit2: '#1e293b', suitDark: '#0f172a',
        helmet: '#f8fafc', helmetDark: '#cbd5e1', skin: '#fcd34d', accent: '#f59e0b'
      }
    ]
  };

  const currentSkinList = () => SKINS_BY_SPEC[currentSpec] || SKINS_BY_SPEC.kip;
  let skinIndex = 0;
  try {
    skinIndex = Number(localStorage.getItem('sota_skin_' + currentSpec)) || 0;
  } catch (e) { skinIndex = 0; }
  const currentSkin = () => {
    const list = currentSkinList();
    if (!(skinIndex >= 0 && skinIndex < list.length)) skinIndex = 0;
    return list[skinIndex];
  };

  function skImageReady(sk){ return null; }

  function drawSkinBody(g, sk, now){
    const bob = Math.sin(now * 0.008) * 1.1;
    const outfit = sk.outfit || 'workwear';
    const headgear = sk.headgear || 'helmet';
    const prop = sk.prop || 'tablet';

    g.save();
    g.translate(0, bob);

    // Ноги (джинсы/брюки для IT, спецовка для цеха)
    const legW = 6, legTop = 4, legH = 9;
    g.fillStyle = outfit === 'hoodie' ? '#1e293b' : (outfit === 'labcoat' ? '#334155' : sk.suit2);
    g.fillRect(-legW - 1, legTop, legW, legH);
    g.fillRect(1, legTop, legW, legH);
    g.fillStyle = outfit === 'hoodie' ? '#e2e8f0' : '#0f172a'; // кроссовки для худи, ботинки для цеха
    g.beginPath(); g.roundRect(-legW - 2, legTop + legH - 1, legW + 2, 4.5, 2); g.fill();
    g.beginPath(); g.roundRect(0, legTop + legH - 1, legW + 2, 4.5, 2); g.fill();

    // Торс
    const bw = 20, bh = 17, bodyTop = -10;
    const bodyG = g.createLinearGradient(0, bodyTop, 0, bodyTop + bh);
    bodyG.addColorStop(0, sk.suit);
    bodyG.addColorStop(1, sk.suit2);
    g.fillStyle = bodyG;
    g.beginPath(); g.roundRect(-bw / 2, bodyTop, bw, bh, 5); g.fill();

    if (outfit === 'workwear'){
      // Светоотражающие полосы + ремень с пряжкой
      g.fillStyle = sk.accent || '#f97316';
      g.fillRect(-bw / 2, bodyTop + 6, bw, 2);
      g.fillStyle = '#f1f5f9';
      g.fillRect(-bw / 2, bodyTop + 8, bw, 1.2);
      g.fillStyle = '#1e293b';
      g.fillRect(-bw / 2 + 1, bodyTop + bh - 4.5, bw - 2, 4);
      g.fillStyle = '#fbbf24';
      g.fillRect(-2.5, bodyTop + bh - 5, 5, 5);
    } else if (outfit === 'hoodie'){
      // Капюшон / завязки худи и карман-кенгуру
      g.fillStyle = sk.suitDark;
      g.beginPath(); g.roundRect(-6, bodyTop + 9, 12, 6, 2); g.fill();
      g.fillStyle = '#e2e8f0';
      g.fillRect(-2.8, bodyTop + 1, 1.2, 6);
      g.fillRect(1.6, bodyTop + 1, 1.2, 6);
      g.fillStyle = sk.accent || '#38bdf8';
      g.fillRect(-4, bodyTop + 5, 8, 2);
    } else if (outfit === 'labcoat'){
      // Белый халат с лацканами и синим бейджиком
      g.fillStyle = '#0284c7';
      g.fillRect(-2.5, bodyTop + 1, 5, 4);
      g.fillStyle = '#cbd5e1';
      g.fillRect(-0.5, bodyTop + 5, 1, bh - 6);
      g.fillStyle = '#38bdf8';
      g.fillRect(3, bodyTop + 4, 4, 3);
    } else if (outfit === 'vest'){
      // Жилетка с карманами поверх футболки
      g.fillStyle = '#f8fafc';
      g.fillRect(-3.5, bodyTop + 1, 7, 5);
      g.fillStyle = sk.suitDark;
      g.fillRect(-bw / 2 + 2, bodyTop + 8, 5, 5);
      g.fillRect(bw / 2 - 7, bodyTop + 8, 5, 5);
      g.fillStyle = sk.accent || '#38bdf8';
      g.fillRect(-bw / 2, bodyTop + bh - 2, bw, 1.5);
    }

    // Руки
    g.fillStyle = sk.suitDark;
    g.beginPath(); g.roundRect(-bw / 2 - 3, bodyTop + 2, 4.5, 11, 2); g.fill();
    g.beginPath(); g.roundRect(bw / 2 - 1.5, bodyTop + 2, 4.5, 11, 2); g.fill();
    g.fillStyle = (outfit === 'hoodie' || outfit === 'labcoat') ? sk.skin : '#334155';
    g.beginPath(); g.arc(-bw / 2 - 0.7, bodyTop + 13, 2.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(bw / 2 + 0.7, bodyTop + 13, 2.5, 0, Math.PI * 2); g.fill();

    // Голова и лицо
    g.fillStyle = sk.skin;
    g.beginPath(); g.arc(0, -15, 7.5, 0, Math.PI * 2); g.fill();

    // Глаза
    g.fillStyle = '#1e293b';
    g.fillRect(-3.8, -16.5, 2, 2.2);
    g.fillRect(1.8, -16.5, 2, 2.2);
    g.fillStyle = '#ffffff';
    g.fillRect(-3.2, -16.5, 0.9, 0.9);
    g.fillRect(2.4, -16.5, 0.9, 0.9);
    g.fillStyle = 'rgba(239, 68, 68, 0.25)';
    g.beginPath(); g.arc(-4.5, -13, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(4.5, -13, 2, 0, Math.PI * 2); g.fill();

    // Очки (для разработчиков, сисадминов, метрологов)
    if (sk.glasses){
      g.strokeStyle = '#0f172a';
      g.lineWidth = 1.2;
      g.strokeRect(-5.4, -17.8, 4.6, 3.8);
      g.strokeRect(0.8, -17.8, 4.6, 3.8);
      g.beginPath(); g.moveTo(-0.8, -16.2); g.lineTo(0.8, -16.2); g.stroke();
    }

    // Головной убор / причёска
    const hairCol = sk.hairColor || '#334155';
    if (headgear === 'helmet'){
      g.fillStyle = sk.helmet;
      g.beginPath(); g.arc(0, -17, 8.8, Math.PI, 0, false); g.fill();
      g.fillStyle = sk.helmetDark;
      g.beginPath(); g.roundRect(-9.8, -18.2, 19.6, 3.5, 1.8); g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.55)';
      g.beginPath(); g.roundRect(-1.5, -23.5, 3, 6, 1); g.fill();
    } else if (headgear === 'hair'){
      // Аккуратная причёска без каски
      g.fillStyle = hairCol;
      g.beginPath(); g.arc(0, -17.5, 8.2, Math.PI * 0.95, Math.PI * 0.05, false); g.fill();
      g.beginPath(); g.roundRect(-7.5, -23.5, 15, 5.5, 3); g.fill();
    } else if (headgear === 'headphones'){
      // Волосы + большие накладные наушники
      g.fillStyle = hairCol;
      g.beginPath(); g.arc(0, -17.5, 8, Math.PI * 0.95, Math.PI * 0.05, false); g.fill();
      g.strokeStyle = sk.helmet || '#a855f7';
      g.lineWidth = 2.4;
      g.beginPath(); g.arc(0, -17, 9.2, Math.PI * 1.05, -0.05, false); g.stroke();
      g.fillStyle = '#0f172a';
      g.beginPath(); g.roundRect(-10.5, -18.5, 3.5, 7, 1.5); g.fill();
      g.beginPath(); g.roundRect(7, -18.5, 3.5, 7, 1.5); g.fill();
      g.fillStyle = sk.helmet || '#a855f7';
      g.fillRect(-10, -17, 1.5, 4);
      g.fillRect(8.5, -17, 1.5, 4);
    } else if (headgear === 'cap'){
      // Стильная бейсболка с козырьком
      g.fillStyle = hairCol;
      g.fillRect(-7.5, -18.5, 15, 2.5);
      g.fillStyle = sk.helmet || '#f97316';
      g.beginPath(); g.arc(0, -17.5, 8.4, Math.PI, 0, false); g.fill();
      g.fillStyle = sk.helmetDark || '#ea580c';
      g.beginPath(); g.roundRect(-2, -18.5, 13, 3, 1.5); g.fill();
    } else if (headgear === 'beanie'){
      // Вязаная шапка-бини
      g.fillStyle = sk.helmet || '#10b981';
      g.beginPath(); g.arc(0, -17.5, 8.6, Math.PI, 0, false); g.fill();
      g.fillStyle = sk.helmetDark || '#059669';
      g.beginPath(); g.roundRect(-8.8, -19.2, 17.6, 3.6, 1.8); g.fill();
    }

    // Предмет в правой руке
    g.save();
    g.translate(bw / 2 + 3, bodyTop + 7);
    if (prop === 'laptop'){
      // Ноутбук с синим светящимся экраном
      g.fillStyle = '#0f172a';
      g.beginPath(); g.roundRect(-1, -1, 10, 8, 1.2); g.fill();
      g.fillStyle = '#38bdf8';
      g.fillRect(0.5, 0.5, 7, 4.5);
      g.fillStyle = '#64748b';
      g.fillRect(-1.5, 6.5, 11, 2);
    } else if (prop === 'coffee'){
      // Белая кружка с горячим кофе
      g.fillStyle = '#f8fafc';
      g.beginPath(); g.roundRect(0, 1, 6, 7, 1); g.fill();
      g.strokeStyle = '#cbd5e1'; g.lineWidth = 1;
      g.strokeRect(5.5, 2.5, 2, 3.5);
      g.fillStyle = '#78350f';
      g.fillRect(1, 1, 4, 1.5);
    } else if (prop === 'multimeter'){
      // Жёлтый мультиметр
      g.fillStyle = '#f59e0b';
      g.beginPath(); g.roundRect(0, 0, 6.5, 9.5, 1.5); g.fill();
      g.fillStyle = '#0f172a';
      g.fillRect(1, 1.2, 4.5, 3);
      g.fillStyle = '#1e293b';
      g.beginPath(); g.arc(3.2, 6.5, 1.6, 0, Math.PI * 2); g.fill();
    } else {
      // Рабочий планшет
      g.fillStyle = '#0f172a';
      g.beginPath(); g.roundRect(0, 0, 7, 10, 1.5); g.fill();
      g.fillStyle = '#38bdf8';
      g.fillRect(1, 1, 5, 7);
    }
    g.restore();

    g.restore();
  }

  function drawMiner(now){
    const sk = currentSkin();
    ctx.save();
    ctx.translate(player.x, player.y - 2);

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.scale(player.dir, 1);
    drawSkinBody(ctx, sk, now);
    ctx.restore();
  }

  function drawSkinPortrait(g, sk){
    g.clearRect(0, 0, 56, 64);
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, 'rgba(255,255,255,.07)');
    grd.addColorStop(1, 'rgba(255,255,255,.015)');
    g.fillStyle = grd;
    g.beginPath(); g.roundRect(0, 0, 56, 64, 10); g.fill();

    g.save();
    g.translate(28, 48);
    g.scale(1.1, 1.1);
    g.fillStyle = 'rgba(0,0,0,.32)';
    g.beginPath(); g.ellipse(0, 13, 12, 4.5, 0, 0, Math.PI * 2); g.fill();
    drawSkinBody(g, sk, 0);
    g.restore();
  }

  function renderSkinDesc(){
    const box = el('skinDesc');
    if (!box) return;
    const sk = currentSkin();
    box.innerHTML = '';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = sk.name;
    const bio = document.createElement('span');
    bio.className = 'bio';
    bio.textContent = sk.desc;
    const line = document.createElement('span');
    line.className = 'say';
    const arr = sk.lines.correct;
    line.textContent = '— ' + arr[Math.floor(Math.random() * arr.length)];
    box.appendChild(who);
    box.appendChild(bio);
    box.appendChild(line);
  }

  function buildSkins(){
    const row = el('skinRow');
    if (!row) return;
    row.innerHTML = '';
    const list = currentSkinList();
    list.forEach((sk, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'skinbtn' + (i === skinIndex ? ' sel' : '');
      b.title = sk.name;

      const cv = document.createElement('canvas');
      cv.width = Math.round(56 * dpr);
      cv.height = Math.round(64 * dpr);
      cv.style.width = '56px';
      cv.style.height = '64px';
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSkinPortrait(g, sk);
      b.appendChild(cv);

      const nameLbl = document.createElement('span');
      nameLbl.className = 'skin-btn-name';
      nameLbl.textContent = sk.name;
      b.appendChild(nameLbl);

      b.addEventListener('click', () => {
        skinIndex = i;
        try { localStorage.setItem('sota_skin_' + currentSpec, i); } catch (_) {}
        buildSkins();
        renderSkinDesc();
      });
      row.appendChild(b);
    });
    renderSkinDesc();
  }

  function drawParticles(dt, now){
    if (state === 'playing' && Math.random() < 0.5){
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 60;
      particles.push({
        x: player.x + Math.cos(a) * r,
        y: player.y + Math.sin(a) * r,
        vx: rnd(-4, 4), vy: rnd(-8, -2),
        life: 1, size: rnd(0.8, 2)
      });
    }
    for (let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.5;
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles){
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTarget(now){
    if (!tapTarget || state !== 'playing') return;
    const cx = tapTarget.x * TILE + TILE / 2;
    const cy = tapTarget.y * TILE + TILE / 2;
    const p = 0.5 + Math.sin(now * 0.006) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.45 + p * 0.4;
    ctx.strokeStyle = '#ffd08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 9 + p * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffd08a';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function say(text){
    if (!text) return;
    speech = { text, until: performance.now() + 2800 };
  }

  function drawSpeech(now){
    if (!speech) return;
    if (now > speech.until){ speech = null; return; }

    const sx = (player.x - camX) * zoom;
    const sy = (player.y - camY) * zoom - 42 * zoom;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '600 12px "Trebuchet MS", system-ui, sans-serif';
    const pad = 9;
    const tw = Math.min(cssW - 44, ctx.measureText(speech.text).width);
    const w = tw + pad * 2;
    const h = 26;
    const x = clamp(sx - w / 2, 8, Math.max(8, cssW - w - 8));
    const y = clamp(sy - h - 6, 8, Math.max(8, cssH - h - 8));
    const fade = Math.min(1, (speech.until - now) / 400);

    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(12,10,8,.93)';
    ctx.strokeStyle = 'rgba(242,164,65,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    const tx = clamp(sx, x + 12, x + w - 12);
    ctx.beginPath();
    ctx.moveTo(tx - 5, y + h - 0.5);
    ctx.lineTo(tx, y + h + 6);
    ctx.lineTo(tx + 5, y + h - 0.5);
    ctx.closePath();
    ctx.fill();

    // Реплика мастера в облачке диалога
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(speech.text, x + w / 2, y + h / 2);

    ctx.restore();
  }

  function draw(now){
    // Полный обзор цеха без скролла
    const fit = Math.min(cssW / VW, cssH / VH);
    zoom = (cssW < 760 || cssH < 450) ? Math.max(fit, MIN_TILE_PX / TILE) : fit;
    const viewW = cssW / zoom, viewH = cssH / zoom;
    const tCamX = (VW - viewW) / 2;
    const tCamY = (VH - viewH) / 2;
    camX = (cssW < 760 || cssH < 450) ? clamp(player.x - viewW / 2, 0, Math.max(0, VW - viewW)) : tCamX;
    camY = (cssW < 760 || cssH < 450) ? (viewH < VH ? clamp(player.y - viewH / 2, 0, VH - viewH) : tCamY) : tCamY;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, cssW, cssH);

    let sx = 0, sy = 0;
    if (shake > 0){
      const s = shake * 4;
      sx = (Math.random() - 0.5) * s;
      sy = (Math.random() - 0.5) * s;
    }
    ctx.setTransform(
      dpr * zoom, 0, 0, dpr * zoom,
      (-camX + sx) * dpr * zoom,
      (-camY + sy) * dpr * zoom
    );

    computeBrightness(now);

    // 1. Плиточный пол цеха (y = 2..13, x = 1..21)
    for (let y = 2; y < H - 1; y++){
      for (let x = 1; x < W - 1; x++){
        drawFloor(x, y, 1);
      }
    }

    // 2. Жёлто-чёрная разметка зон безопасности вокруг каждого станка
    drawHazardZones();

    // 3. Задняя стена цеха (y = 0..114) с фирменной настенной балкой, вывеской СОТА, вентиляцией и статусом
    drawBackWall(now);

    // 3.1. Специализированный настенный декор КИП и ТС (P&ID схемы, перфопанели, полки регламентов, тепловычислители, манометры)
    drawWallDecor(now);

    // 3.2. Интерьер: растения в кадках, чертежный стол, солнце из окна, напольные приборы
    drawRoomProps(now);

    // 4. Боковые стены и нижнее ограждение
    for (let y = 0; y < H; y++){
      drawWall(0, y, 1);
      drawWall(W - 1, y, 1);
    }
    for (let x = 0; x < W; x++){
      drawWall(x, H - 1, 1);
    }

    // 5. Выходная золотая дверь на правой стене: К СОТЕ >>
    drawExit(now);

    // 6. Расходники / бонусы в цеху
    for (const pk of pickups) drawPickup(pk, now);

    // 7. Станки и оборудование с бейджами названий и значками [ ! ] / [ ✓ ]
    for (const c of crystals) drawStation(c, now);

    // 8. Мастер (персонаж в спецодежде выбранной специальности)
    drawMiner(now);

    // 9. Частицы
    drawParticles(1 / 60, now);

    // 10. Маркер тапа
    drawTarget(now);

    // Экранный оверлей (в экранных координатах)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Мягкая виньетка по краям окна
    const vg = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.45,
                                        cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cssW, cssH);

    if (flash > 0){
      ctx.fillStyle = 'rgba(' + flashColor + ',' + (flash * 0.35) + ')';
      ctx.fillRect(0, 0, cssW, cssH);
    }

    drawSpeech(now);
    drawMinimap(now);
  }

  function drawMinimap(now){
    if (state === 'title') return;
    const cell = cssW < 470 ? 3 : 4;
    const mw = W * cell, mh = H * cell;
    const x0 = cssW - mw - 14;
    const y0 = 14;

    ctx.save();
    ctx.fillStyle = 'rgba(8,7,6,.68)';
    ctx.strokeStyle = 'rgba(242,164,65,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x0 - 5, y0 - 5, mw + 10, mh + 10, 7);
    ctx.fill();
    ctx.stroke();

    for (let y = 0; y < H; y++){
      for (let x = 0; x < W; x++){
        const known = seen[y][x];
        if (!known && map[y][x] === WALL) continue;
        const bx = x0 + x * cell, by = y0 + y * cell;
        if (map[y][x] === WALL) ctx.fillStyle = 'rgba(74,62,49,.6)';
        else ctx.fillStyle = known ? 'rgba(158,132,100,.62)' : 'rgba(38,32,25,.55)';
        ctx.fillRect(bx, by, cell, cell);
      }
    }

    for (const c of crystals){
      if (c.done || !seen[c.y][c.x]) continue;
      ctx.fillStyle = c.cracked ? '#b08a5e' : (c.hard ? '#c79bff' : '#f59e0b');
      ctx.fillRect(x0 + c.x * cell - 0.5, y0 + c.y * cell - 0.5, cell + 1, cell + 1);
    }
    if (seen[exitCell.y][exitCell.x]){
      ctx.fillStyle = exitOpen ? '#ffd05a' : 'rgba(190,150,85,.55)';
      ctx.fillRect(x0 + exitCell.x * cell - 1, y0 + exitCell.y * cell - 1, cell + 2, cell + 2);
    }

    const blink = 0.55 + Math.sin(now * 0.008) * 0.45;
    ctx.globalAlpha = 0.55 + blink * 0.45;
    ctx.fillStyle = '#fff2cb';
    ctx.fillRect(x0 + player.gx * cell - 1, y0 + player.gy * cell - 1, cell + 2, cell + 2);
    ctx.restore();
  }

  function loop(now){
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (canvas.clientWidth !== cssW || canvas.clientHeight !== cssH) resizeCanvas();

    // автопроход по маршруту, выбранному тапом
    if (state === 'playing' && autoPath.length && now >= autoNext){
      const nxt = autoPath.shift();
      autoNext = now + 105;
      tryMove(nxt.x - player.gx, nxt.y - player.gy);
      if (state !== 'playing' || player.gx !== nxt.x || player.gy !== nxt.y){
        stopAuto();
      } else if (!autoPath.length){
        tapTarget = null;
      }
    }

    // движение игрока к целевой клетке
    const tx = player.gx * TILE + TILE / 2;
    const ty = player.gy * TILE + TILE / 2;
    const k = Math.min(1, dt * 16);
    player.x += (tx - player.x) * k;
    player.y += (ty - player.y) * k;

    if (state === 'playing'){
      fuel = Math.max(0, fuel - dt * 0.75); // Мягкий естественный расход света за смену
      if (fuel <= 0){
        updateHUD();
        gameOver('Энергосеть цеха обесточена. Требуется перезапуск питания.');
      }
      updateHUD();
    }

    shake = Math.max(0, shake - dt * 3);
    flash = Math.max(0, flash - dt * 1.6);

    draw(now);
    requestAnimationFrame(loop);
  }

  /* ============================================================
     Ввод
     ============================================================ */
  const KEYMAP = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
    Numpad8: [0, -1], Numpad2: [0, 1], Numpad4: [-1, 0], Numpad6: [1, 0]
  };

  let moveCooldown = 0;
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    const isArrow = e.code.startsWith('Arrow') || e.code === 'Space';
    if (isArrow) e.preventDefault();

    if (state === 'minigame'){
      if (e.code === 'Space' || e.code === 'Enter'){
        e.preventDefault();
        const calibBanner = el('calibBanner');
        const pipeBanner = el('pipeBanner');
        if (calibGame && calibGame.active && calibBanner && !calibBanner.classList.contains('hidden')){
          beginCalibActive();
        } else if (calibBanner && !calibBanner.classList.contains('hidden')){
          closeFloorEvent();
        } else if (typeof pipeGame !== 'undefined'){
          if (pipeGame.phase === 'intro') beginPipesActive();
          else if (pipeGame.phase === 'done') closeFloorEvent();
        }
      }
      return;
    }

    if (e.code === 'KeyE'){
      if (state === 'playing'){
        const nearby = crystals.find(cr => !cr.done && Math.abs(cr.x - player.gx) <= 1 && Math.abs(cr.y - player.gy) <= 1);
        if (nearby){
          interactStation(nearby);
          return;
        }
        if (player.gx === exitCell.x && player.gy === exitCell.y && exitOpen){
          descend();
          return;
        }
      }
    }

    const dir = KEYMAP[e.code];
    if (!dir) return;

    if (state === 'title'){
      if (e.code === 'Space' || e.code === 'Enter') startGame(null);
      return;
    }
    if (state !== 'playing') return;
    if (performance.now() - moveCooldown < 90) return;
    moveCooldown = performance.now();
    stopAuto();
    tryMove(dir[0], dir[1]);
  });

  document.querySelectorAll('.dpad button').forEach(btn => {
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const handler = e => {
      e.preventDefault();
      if (state !== 'playing') return;
      if (performance.now() - moveCooldown < 90) return;
      moveCooldown = performance.now();
      stopAuto();
      const d = dirs[btn.dataset.dir];
      tryMove(d[0], d[1]);
    };
    btn.addEventListener('pointerdown', handler);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  el('startBtn')?.addEventListener('click', () => startGame(null));
  el('againBtn')?.addEventListener('click', () => startGame(null));
  el('backBtn')?.addEventListener('click', () => {
    el('cityScreen')?.classList.add('hidden');
    el('startScreen').classList.remove('hidden');
    state = 'title';
    buildSkins();
  });
  el('skinsBtn')?.addEventListener('click', () => {
    el('endScreen').classList.add('hidden');
    el('startScreen').classList.remove('hidden');
    state = 'title';
    buildSkins();
  });

  buildSkins();

  /* ============================================================
     Старт
     ============================================================ */
  decks.easy = []; decks.hard = [];
  depth = 1;
  initSpecUI();
  loadQuestions();
  resizeCanvas();
  newLevel();
  updateHUD();
  requestAnimationFrame(loop);


// Экспорт утилит в window для модулей специальностей
window.el = el;
window.toast = toast;
window.audio = audio;
window.clamp = clamp;
window.closeFloorEvent = closeFloorEvent;
window.updateHUD = updateHUD;
window.getCtx = function(){ return ctx; };
window.getTile = function(){ return TILE; };
Object.defineProperty(window, 'score', { get: () => score, set: (v) => { score = v; } });
Object.defineProperty(window, 'fuel', { get: () => fuel, set: (v) => { fuel = v; } });
Object.defineProperty(window, 'hp', { get: () => hp, set: (v) => { hp = v; } });
Object.defineProperty(window, 'state', { get: () => state, set: (v) => { state = v; } });
Object.defineProperty(window, 'ctx', { get: () => ctx });
Object.defineProperty(window, 'TILE', { get: () => TILE });
