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
      codeFull: '15.01.31',
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
      title: 'Теплопункт ТС',
      specName: 'Теплоснабжение и теплотехническое оборудование',
      floorName: 'Участок',
      unitName: 'Узлы',
      unitSingular: 'узел',
      eventSeq: ['pipes', 'bypass', 'exchanger', 'pipes']
    },
    e: {
      code: 'Э',
      codeFull: '13.02.13',
      title: 'Электроучасток Э',
      specName: 'Электрооборудование и электрохозяйство',
      floorName: 'Участок',
      unitName: 'Узлы',
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
      title: 'IT-центр · Программирование',
      specName: 'Информационные системы и программирование',
      floorName: 'Сектор',
      unitName: 'Задачи',
      unitSingular: 'задачу',
      eventSeq: []
    },
    ksk: {
      code: 'КСК',
      codeFull: '09.02.01',
      title: 'Лаборатория КСК',
      specName: 'Компьютерные системы и комплексы',
      floorName: 'Лаборатория',
      unitName: 'Станции',
      unitSingular: 'станцию',
      eventSeq: []
    }
  };

  if (!SPECS[currentSpec]) { window.location.replace('../../menu.html'); throw new Error('Неизвестная специальность: ' + currentSpec); }
  window.currentSpec = currentSpec;

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

  function makeWorkshop(){
    const m = [];
    for (let y = 0; y < H; y++){
      const row = [];
      for (let x = 0; x < W; x++){
        // Верхние 2 ряда (y = 0..1) — стена цеха с экранами и лампами
        // Нижний ряд (y = 14) — защитный бортик / перила
        // Левый (x = 0) и правый (x = 22) столбцы — боковые стены
        const isWall = (y <= 1) || (y === H - 1) || (x === 0) || (x === W - 1);
        row.push(isWall ? WALL : FLOOR);
      }
      m.push(row);
    }
    return m;
  }

  function newLevel(){
    stopAuto();
    map = makeWorkshop();
    if (currentSpec === 'p') setupPMap(map);
    if (currentSpec === 'ksk') setupKskMap(map);
    seen = Array.from({ length: H }, () => new Array(W).fill(1));
    bright = Array.from({ length: H }, () => new Array(W).fill(1));

    needed = currentSpec === 'p' ? P_STATIONS.length : currentSpec === 'ksk' ? KSK_STATIONS.length : Math.min(3 + Math.floor((depth - 1) / 2), 5);
    collected = 0;
    exitOpen = false;

    // Игрок стартует в центральном проходе цеха (как на референсе)
    const start = { x: 11, y: 6 };
    player.gx = start.x; player.gy = start.y;
    player.x = start.x * TILE + TILE / 2;
    player.y = start.y * TILE + TILE / 2;
    player.dir = 1;

    // Выходная дверь на правой стене цеха рядом с серверной
    exitCell = { x: 21, y: 5 };

    // 6 рабочих станций/станков (органично и хаотично расставлены по залу, в точности по референсу)
    const stationSpots = currentSpec === 'ksk' ? KSK_STATIONS : currentSpec === 'p' ? P_STATIONS : [
      { x: 15, y: 3, type: 2, hard: false }, // Шкафы автоматики / серверная стойка (справа у стены)
      { x: 6,  y: 6, type: 0, hard: false }, // Рабочий остров слева (стол с двумя мониторами и растением)
      { x: 16, y: 6, type: 1, hard: true  }, // Рабочий остров справа (стол со схемой сети/контура)
      { x: 16, y: 9, type: 3, hard: true  }, // Рабочий остров снизу-справа (стол с экраном безопасности)
      { x: 10, y: 3, type: 4, hard: false }, // Диспетчерский стол у задней стены (под настенными мониторами)
      { x: 10, y: 9, type: 5, hard: false }  // Командный стол внизу по центру (с тремя ноутбуками)
    ];

    crystals = stationSpots.map((s, i) => ({
      x: s.x, y: s.y,
      stationType: s.type,
      done: false, cracked: false,
      hard: !!s.hard,
      seed: (i + 1) * 31.4
    }));

    // Инструменты и расходники в цеху (аптечка и смазка)
    pickups = [
      { x: 4, y: 8, type: 'oil', seed: 1.5 },
      { x: 13, y: 6, type: 'med', seed: 3.8 }
    ];

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
    if (el('ruleUnitTitle')) el('ruleUnitTitle').textContent = (currentSpec === 'p' || currentSpec === 'ksk') ? 'Рабочая станция' : 'Станок ' + specCfg.code;
    if (el('startMainTitle')) el('startMainTitle').textContent = 'ПУТЬ К СОТЕ: ' + specCfg.title;
    if (el('hudBrand')) el('hudBrand').textContent = 'ПУТЬ К СОТЕ';
    if (el('hudSub')) el('hudSub').textContent = ' · ' + specCfg.title;
    if (el('floorLabel')) el('floorLabel').textContent = '</> ' + specCfg.floorName;
    if (el('unitLabel')) el('unitLabel').textContent = '💎 ' + specCfg.unitName;
    if (el('distLabel')) el('distLabel').textContent = '📍 До СОТЫ';
    if (el('modeBadge')) el('modeBadge').textContent = 'Практика · ' + specCfg.code;
  }

  function updateHUD(){
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    if (el('hudSub')) el('hudSub').textContent = ' · ' + specCfg.title;
    if (el('floorLabel')) el('floorLabel').textContent = '</> ' + specCfg.floorName;
    if (el('unitLabel')) el('unitLabel').textContent = '💎 ' + specCfg.unitName;
    el('mineVal').textContent = Math.min(completedMines + 1, totalMines) + '/' + totalMines;
    el('distVal').textContent = leftKm() + ' км';
    el('oreVal').textContent = collected + '/' + needed;
    el('scoreVal').textContent = score;
    el('comboVal').textContent = '×' + answerStreak;
    el('fuelBar').style.width = clamp(fuel, 0, 100) + '%';
    el('hpBar').style.width = clamp(hp, 0, 100) + '%';
    el('fuelMeter').classList.toggle('low', fuel < 28);
    el('hpMeter').classList.toggle('low', hp < 28);
  }
  function leftKm(){
    return Math.max(0, Math.round(startKm * (totalMines - completedMines) / totalMines));
  }
  let toastTimer = null;
  function toast(msg){
    const t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
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
    if (currentSpec === 'p' && typeof window.startPStation === 'function'){
      if (!crystal || crystal.done || state !== 'playing') return;
      state = 'minigame';
      stopAuto();
      window.startPStation(crystal.stationType, completedMines, bonus => {
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
        toast(exitOpen ? 'Все задания выполнены! Дверь к СОТЕ открыта.' : 'Оборудование настроено · ' + collected + '/' + needed);
      }, cancelPMinigame);
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
    hb.textContent = 'Подсказка: убрать 2 неверных · −10 света';

    const fb = el('qFeedback');
    fb.className = 'qfeedback hidden';
    fb.textContent = '';
    el('qNextBtn').classList.add('hidden');
    el('qFoot').textContent = q.type === 'slider'
      ? 'Двигайте ползунок: чем ближе к регламенту, тем выше оценка.'
      : (hard ? 'Экспертный уровень: награда удвоена (+160 очков)!' : 'За верный ответ — очки и энергия смены.');

    el('qScreen').classList.remove('hidden');
    sfx.pick();
  }

  el('hintBtn').addEventListener('click', () => {
    if (state !== 'question' || hintUsed) return;
    if (fuel <= 10){
      el('qFoot').textContent = 'Мало света для подсказки.';
      return;
    }
    hintUsed = true;
    fuel = Math.max(0, fuel - 10);
    const wrong = Array.from(el('qAnswers').children).filter(b => b.dataset.ok === '0');
    shuffle(wrong).slice(0, 2).forEach(b => b.classList.add('removed'));
    el('hintBtn').disabled = true;
    el('hintBtn').textContent = 'Подсказка использована';
    el('qFoot').textContent = 'Два неверных варианта убраны. −10 света.';
    sfx.pick();
    updateHUD();
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
      const gain = hard ? 24 : 16;
      const bonus = Math.round((120 + depth * 40 + answerStreak * 25) * (hard ? 2 : 1));
      score += bonus;
      fuel = Math.min(100, fuel + gain);
      hp = Math.min(100, hp + (hard ? 5 : 3));
      collected++;
      runOre++;
      if (activeCrystal) activeCrystal.done = true;
      sfx.good();
      flash = 0.35; flashColor = hard ? '185,150,255' : '120,220,160';
      fb.className = 'qfeedback ok';
      fb.textContent = (hard ? 'Алмаз расколот! ' : 'Верно! ') + '+' + bonus + ' очков, +' + gain + ' света.';
      nextBtn.textContent = collected >= needed && completedMines === totalMines - 1 ? 'К СОТЕ' : collected >= needed ? ((currentSpec === 'p' || currentSpec === 'ksk') ? 'К двери' : 'К лестнице') : 'Дальше';
      if (collected >= needed && !exitOpen){
        exitOpen = true;
        setTimeout(() => toast(completedMines === totalMines - 1 ? 'Вход в СОТУ открыт!' : (currentSpec === 'p' || currentSpec === 'ksk') ? 'Дверь «К СОТЕ» открыта!' : 'Лестница открыта — ищите спуск!'), 400);
      }
    } else {
      btn.classList.add('wrong');
      answerStreak = 0;
      fuel = Math.max(0, fuel - 12);
      hp = Math.max(0, hp - 11);
      score = Math.max(0, score - 40);
      if (activeCrystal) activeCrystal.cracked = true;
      sfx.bad();
      shake = 1;
      flash = 0.4; flashColor = '235,90,70';
      fb.className = 'qfeedback bad';
      fb.textContent = '⚠ Неверно. −40 очков, −12 света, −11 сил. Кристалл треснул, но остался — можно попробовать снова.';
      nextBtn.textContent = 'Попробовать снова';
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
      hp = Math.min(100, hp + (hard ? 5 : 3));
      collected++;
      runOre++;
      if (activeCrystal) activeCrystal.done = true;
      sfx.good();
      flash = 0.35; flashColor = hard ? '185,150,255' : '120,220,160';
      fb.className = 'qfeedback ok';
      fb.textContent = '✓ Точность ' + accPct + '% · +' + bonus + ' очков. ' + truth;
      nextBtn.textContent = collected >= needed && completedMines === totalMines - 1 ? 'К СОТЕ' : collected >= needed ? ((currentSpec === 'p' || currentSpec === 'ksk') ? 'К двери' : 'К лестнице') : 'Дальше';
      if (collected >= needed && !exitOpen){
        exitOpen = true;
        setTimeout(() => toast(completedMines === totalMines - 1 ? 'Вход в СОТУ открыт!' : (currentSpec === 'p' || currentSpec === 'ksk') ? 'Дверь «К СОТЕ» открыта!' : 'Лестница открыта — ищите спуск!'), 400);
      }
    } else {
      answerStreak = 0;
      fuel = Math.max(0, fuel - 12);
      hp = Math.max(0, hp - 11);
      score = Math.max(0, score - 20);
      if (activeCrystal) activeCrystal.cracked = true;
      sfx.bad();
      shake = 1;
      flash = 0.4; flashColor = '235,90,70';
      fb.className = 'qfeedback bad';
      fb.textContent = '⚠ Мимо: точность ' + accPct + '%. −20 очков, −12 света, −11 сил. ' + truth;
      nextBtn.textContent = 'Попробовать снова';
    }

    if (q.fact){
      const f = document.createElement('div');
      f.className = 'qfact';
      f.textContent = '💡 ' + q.fact;
      fb.appendChild(f);
    }
    const sk = currentSkin();
    const lines = sk.lines && (ok ? sk.lines.correct : sk.lines.wrong);
    if (lines && lines.length){
      const line = document.createElement('div');
      line.className = 'qspeak';
      line.textContent = '— ' + lines[Math.floor(Math.random() * lines.length)];
      fb.appendChild(line);
    }
    updateHUD();
  }

  el('qNextBtn').addEventListener('click', () => {
    if (state !== 'question') return;
    const wasOk = lastAnswerOk;
    const crystal = activeCrystal;

    if (hp <= 0){
      el('qScreen').classList.add('hidden');
      gameOver('Смена окончена: наладчик исчерпал силы на сегодня.');
      return;
    }
    if (fuel <= 0){
      el('qScreen').classList.add('hidden');
      gameOver('Энергосеть цеха обесточена. Требуется перезапуск питания.');
      return;
    }

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
      toast(completedMines === totalMines - 1 ? 'Все задания выполнены — подойдите к зданию СОТА.' : (currentSpec === 'p' || currentSpec === 'ksk') ? 'Все задания выполнены — подойдите к двери «К СОТЕ».' : 'Переход открыт — ищите выход в следующий ' + (currentSpec === 'ts' ? 'участок' : 'цех'));
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
  function planPath(tx, ty, avoidInteractions = false){
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
        if (avoidInteractions && (nx !== tx || ny !== ty) && (
          crystals.some(cr => !cr.done && cr.x === nx && cr.y === ny) ||
          pickups.some(pk => pk.x === nx && pk.y === ny) ||
          (exitCell.x === nx && exitCell.y === ny)
        )) continue;
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
    // Если игрок уже рядом со станком и тапает по нему — сразу открываем задачу
    const nearStation = crystals.find(cr => !cr.done && cr.x === cell.x && cr.y === cell.y);
    if (nearStation && Math.abs(player.gx - cell.x) + Math.abs(player.gy - cell.y) <= 1){
      stopAuto();
      openQuestion(nearStation);
      return;
    }
    // Сначала обходим другие задания и предметы; в узком проходе можно пройти
    // через их клетки, но взаимодействие произойдёт только у выбранной цели.
    const path = planPath(cell.x, cell.y, true) || planPath(cell.x, cell.y);
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

  function pointerToWorld(e){
    const rect = canvas.getBoundingClientRect();
    return { x: camX + (e.clientX - rect.left) / zoom, y: camY + (e.clientY - rect.top) / zoom };
  }

  function stationAtPoint(point){
    const now = performance.now();
    // Значок расположен над клеткой взаимодействия, а стол занимает несколько клеток.
    // Сначала проверяем значки, чтобы мебель соседнего места не перехватила нажатие.
    const active = crystals.filter(cr => !cr.done);
    const badge = active.find(cr => {
      const dx = point.x - (cr.x * TILE + TILE / 2);
      const dy = point.y - (cr.y * TILE + TILE / 2);
      const badgeY = -38 + Math.sin(now * 0.004 + cr.seed) * 3.5;
      return Math.hypot(dx, dy - badgeY) <= 20;
    });
    if (badge) return badge;
    return active.filter(cr => {
      const dx = point.x - (cr.x * TILE + TILE / 2);
      const dy = point.y - (cr.y * TILE + TILE / 2);
      if (currentSpec === 'p'){
        const server = cr.stationType === 2;
        const equipment = server ? dx >= -32 && dx <= 34 && dy >= -64 && dy <= 16
          : dx >= -65 && dx <= 70 && dy >= -80 && dy <= 32;
        const label = Math.abs(dx) <= 82 && dy >= 33 && dy <= 65;
        return equipment || label;
      }
      return Math.abs(dx) <= 32 && dy >= -68 && dy <= 28;
    }).sort((a, b) => {
      const distance = cr => Math.hypot(point.x - (cr.x * TILE + TILE / 2), point.y - (cr.y * TILE + TILE / 2));
      return distance(a) - distance(b);
    })[0] || null;
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (state !== 'playing') return;
    const point = pointerToWorld(e);
    const station = stationAtPoint(point);
    tapTo(station ? { x: station.x, y: station.y } : { x: Math.floor(point.x / TILE), y: Math.floor(point.y / TILE) });
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

  function onEnterTile(){
    if (tapTarget){
      if (player.gx !== tapTarget.x || player.gy !== tapTarget.y) return;
      stopAuto();
    }
    const pk = pickups.find(p => p.x === player.gx && p.y === player.gy);
    if (pk){ takePickup(pk); return; }

    const c = crystals.find(cr => !cr.done && cr.x === player.gx && cr.y === player.gy);
    if (c){ openQuestion(c); return; }

    if (player.gx === exitCell.x && player.gy === exitCell.y){
      if (exitOpen){
        descend();
      } else {
        const specCfg = SPECS[currentSpec] || SPECS.kip;
        toast('Переход закрыт: нужно обслужить ещё ' + Math.max(0, needed - collected) + ' ' + (currentSpec === 'ts' ? 'станка' : 'прибора'));
        sfx.bump();
      }
    }
  }

  function takePickup(pk){
    pickups = pickups.filter(p => p !== pk);
    if (pk.type === 'oil'){
      fuel = Math.min(100, fuel + 20);
      toast('Запас питания: +20 света');
      flash = 0.25; flashColor = '255,200,120';
    } else {
      hp = Math.min(100, hp + 18);
      toast('Инструменты и аптечка: +18 сил');
      flash = 0.25; flashColor = '130,235,170';
    }
    score += 30;
    sfx.pick();
    updateHUD();
  }

  function cancelPMinigame(){
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
    depth = completedMines + 1;
    score += 300 + depth * 60;
    fuel = Math.min(100, fuel + 30);
    hp = Math.min(100, hp + 12);
    answerStreak = 0;
    sfx.descend();
    flash = 0.5; flashColor = '255,210,140';

    if (completedMines >= totalMines){ victory(); return; }

    newLevel();
    updateHUD();
    if (currentSpec === 'p' && typeof window.startPTransition === 'function'){
      state = 'minigame';
      stopAuto();
      window.startPTransition(completedMines, bonus => {
        score += bonus;
        updateHUD();
        closeFloorEvent();
      }, cancelPMinigame);
      return;
    }
    const eventId = scheduledEvents.get(completedMines);
    if (eventId && MINI_GAMES[eventId]){
      startFloorEvent(eventId);
      return;
    }
    say(currentSkin().lines.descend);
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    toast(specCfg.floorName + ' ' + (completedMines + 1) + '/' + totalMines + ' · до СОТЫ ' + leftKm() + ' км');
  }

  function victory(){
    cleanupClicker();
    state = 'dead';
    stopAuto();
    const bonus = Math.round(startKm * 15);
    score += bonus;
    if (score > best){
      best = score;
      try { localStorage.setItem('mine_best', String(best)); } catch (e) {}
    }
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    el('endTitle').textContent = 'Дошли до СОТЫ!';
    el('endText').textContent = 'Старт: ' + chosenCity.name + ' · ' + startKm + ' км позади. Награда за практику: +' + bonus + ' очков.';
    if (el('endFloorName')) el('endFloorName').textContent = specCfg.floorName;
    if (el('endStationName')) el('endStationName').textContent = specCfg.unitName;
    el('endDepth').textContent = totalMines + '/' + totalMines;
    el('endOre').textContent = runOre;
    el('endScore').textContent = score;
    el('endBest').textContent = best;
    el('sotaWrap').classList.remove('hidden');
    drawSotaBuilding();
    el('endScreen').classList.remove('hidden');
  }

  function gameOver(reason){
    cleanupClicker();
    state = 'dead';
    stopAuto();
    if (score > best){
      best = score;
      try { localStorage.setItem('mine_best', String(best)); } catch (e) {}
    }
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    el('endTitle').textContent = 'Смена окончена';
    el('endText').textContent = reason;
    if (el('endFloorName')) el('endFloorName').textContent = specCfg.floorName;
    if (el('endStationName')) el('endStationName').textContent = specCfg.unitName;
    el('endDepth').textContent = Math.min(completedMines + 1, totalMines) + '/' + totalMines;
    el('endOre').textContent = runOre;
    el('endScore').textContent = score;
    el('endBest').textContent = best;
    el('sotaWrap').classList.add('hidden');
    el('endScreen').classList.remove('hidden');
  }

  const SOTA_PHOTO_DATA = 'data:image/jpeg;base64,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';
  let sotaSprite = null, sotaLoading = false;
  function getSotaSprite(){
    if (sotaSprite) return sotaSprite;
    if (sotaLoading) return null;
    sotaLoading = true;
    const img = new Image();
    img.onload = () => {
      // Готовый pixel-art здания сохраняем без уменьшения и постеризации.
      sotaSprite = img;
      sotaLoading = false;
      drawSotaBuilding();
    };
    img.onerror = () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = SOTA_PHOTO_DATA;
    };
    img.src = window.location.pathname.includes('/specialties/')
      ? '../../assets/sota-building.png' : 'assets/sota-building.png';
    return null;
  }

  function drawSotaBuilding(){
    const cv = el('sotaCanvas');
    if (!cv) return;
    const sp = getSotaSprite();
    if (!sp) return;
    cv.width = sp.naturalWidth;
    cv.height = sp.naturalHeight;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sp, 0, 0);
  }

  let activeCityFilter = 'all';

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
  function plannedEventsFor(mines){
    const fallback = Math.max(1, mines - 1);
    return clamp(EVENT_COUNT_BY_MINES[mines] ?? fallback, 0, Math.max(0, mines - 1));
  }

  function scheduleRunEvents(mines){
    scheduledEvents.clear();
    const transitions = [];
    for (let i = 1; i < mines; i++) transitions.push(i);
    const count = plannedEventsFor(mines);
    const picked = transitions.slice(0, count);

    const kipSeq = ['calib', 'wires', 'pid', 'calib'];
    const tsSeq  = ['pipes', 'bypass', 'exchanger', 'pipes'];
    const specSeq = (currentSpec === 'ts') ? tsSeq : kipSeq;

    picked.forEach((idx, i) => {
      const eventId = specSeq[i % specSeq.length];
      scheduledEvents.set(idx, eventId);
    });
  }

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

  function closeFloorEvent(){
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
    if (state === 'minigame'){
      state = 'playing';
      try {
        if (currentSkin() && currentSkin().lines) say(currentSkin().lines.descend);
        const specCfg = SPECS[currentSpec] || SPECS.kip;
        toast(specCfg.floorName + ' ' + (completedMines + 1) + '/' + totalMines + ' · до СОТЫ ' + leftKm() + ' км');
      } catch (err){
        console.error('closeFloorEvent err:', err);
      }
    }
  }

  /* ============================================================
     Отрисовка
     ============================================================ */
  /* ============================================================
     Отрисовка цеха СОТА
     ============================================================ */
  function computeBrightness(now){
    // В цеху СОТА работает промышленное освещение: всё видно ясно и чётко
    for (let y = 0; y < H; y++){
      for (let x = 0; x < W; x++){
        seen[y][x] = 1;
        bright[y][x] = 1.0;
      }
    }
    return 10;
  }

  function drawFloor(x, y, b){
    if (currentSpec === 'ksk') return drawKskFloor(x,y);
    if (currentSpec === 'p') return drawPFloor(x, y);
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
    if (currentSpec === 'ksk') return undefined;
    if (currentSpec === 'p') return undefined;
    // Разметка зон безопасности: жёлто-чёрная полоса вокруг каждого станка
    for (const c of crystals){
      const cx = c.x * TILE, cy = c.y * TILE;
      const x0 = cx - 22, y0 = cy - 14, w = TILE + 44, h = TILE + 28;

      ctx.save();
      // Жёлто-чёрная рамка
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(x0, y0, w, h);

      // Диагональные штрихи безопасности по периметру
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(x0, y0, w, h);
      ctx.setLineDash([]);

      // Угловые маркеры безопасности
      ctx.fillStyle = '#f59e0b';
      const sz = 5;
      ctx.fillRect(x0 - 2, y0 - 2, sz, sz);
      ctx.fillRect(x0 + w - 3, y0 - 2, sz, sz);
      ctx.fillRect(x0 - 2, y0 + h - 3, sz, sz);
      ctx.fillRect(x0 + w - 3, y0 + h - 3, sz, sz);

      // Стрелки направления на полу рядом со станком
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.moveTo(x0 + w + 4, cy + 18);
      ctx.lineTo(x0 + w + 9, cy + 22);
      ctx.lineTo(x0 + w + 4, cy + 26);
      ctx.fill();

      ctx.restore();
    }
  }

  function drawWall(x, y, b){
    if (currentSpec === 'ksk') return drawKskWall(x,y);
    if (currentSpec === 'p') return drawPWall(x, y);
    const px = x * TILE, py = y * TILE;

    // Боковые стены (x = 0, x = W - 1) и нижний бортик (y = H - 1)
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(px, py, TILE, TILE);

    // Стальные панели и отбойники
    ctx.fillStyle = '#1e2633';
    ctx.fillRect(px, py, TILE, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(px, py + TILE - 2, TILE, 2);

    // Жёлто-чёрная защитная полоса на нижнем ограждении
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
    // Задняя стена цеха (y = 0..1, высота 88px)
    const wallH = 2 * TILE;

    // Фоновые стальные панели
    ctx.fillStyle = '#0f141d';
    ctx.fillRect(0, 0, VW, wallH);

    // Вертикальные швы панелей
    ctx.fillStyle = '#171f2c';
    for (let x = 0; x < VW; x += TILE * 2){
      ctx.fillRect(x, 0, 2, wallH);
      // Заклёпки
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x - 1, 8, 4, 3);
      ctx.fillRect(x - 1, 32, 4, 3);
      ctx.fillRect(x - 1, 60, 4, 3);
      ctx.fillStyle = '#171f2c';
    }

    // Верхняя несущая балка с трубами
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, VW, 18);
    ctx.fillStyle = '#222c3d';
    ctx.fillRect(0, 16, VW, 2);

    // Труба теплоносителя (красная) с фланцами
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 5, VW, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 6, VW, 1.5);
    for (let x = 60; x < VW; x += 110){
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, 3, 5, 9);
    }

    // Тонкий кабель-канал (серебристый)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 12, VW, 2);

    // 1. ВЫВЕСКА СОТА (слева)
    const signX = 40, signY = 20, signW = 230, signH = 58;
    ctx.save();
    // Фоновая пластина с золотым свечением
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.roundRect(signX, signY, signW, signH, 8);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Эмблема СОТА (шестиугольник)
    const hx = signX + 28, hy = signY + signH / 2;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++){
      const angle = (i * 60) * Math.PI / 180;
      const ppx = hx + 15 * Math.cos(angle);
      const ppy = hy + 15 * Math.sin(angle);
      if (i === 0) ctx.moveTo(ppx, ppy); else ctx.lineTo(ppx, ppy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.fill();

    // Текст вывески
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('COTA', signX + 54, signY + 18);

    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(currentSpec === 'ts' ? 'ТЕПЛОПУНКТ ТС' : 'ЦЕХ КИП', signX + 54, signY + 34);

    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(currentSpec === 'ts' ? 'Теплоснабжение СОТА' : 'Автоматика и метрология', signX + 54, signY + 48);
    ctx.restore();

    // 2. СТЕНДЫ И ТЕЛЕМЕТРИЯ СПЕЦИАЛЬНОСТИ (по центру)
    if (currentSpec === 'ts'){
      // ТЕПЛОСНАБЖЕНИЕ (ТС): Стенд образцов трубопроводов + Пьезометрический график
      const boardX = 285, boardY = 18, boardW = 185, boardH = 62;
      ctx.save();
      ctx.fillStyle = '#0a0e17';
      ctx.beginPath(); ctx.roundRect(boardX, boardY, boardW, boardH, 6); ctx.fill();
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.2; ctx.stroke();

      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fdba74';
      ctx.fillText('ОБРАЗЦЫ ТРУБОПРОВОДОВ И АРМАТУРЫ', boardX + 6, boardY + 11);

      // Образец 1: Труба ППУ-ПЭ в разрезе
      ctx.fillStyle = '#1e293b'; ctx.fillRect(boardX + 10, boardY + 18, 44, 38);
      // Стальная труба
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(boardX + 32, boardY + 36, 12, 0, Math.PI * 2); ctx.fill();
      // ППУ изоляция (жёлтая пена)
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(boardX + 32, boardY + 36, 9, 0, Math.PI * 2); ctx.fill();
      // Внутренний теплоноситель
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(boardX + 32, boardY + 36, 5, 0, Math.PI * 2); ctx.fill();
      // Сигнальные провода ОДК
      ctx.fillStyle = '#b45309'; ctx.fillRect(boardX + 27, boardY + 28, 2, 2); ctx.fillRect(boardX + 35, boardY + 28, 2, 2);
      ctx.font = '7.5px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('ППУ+ОДК', boardX + 13, boardY + 54);

      // Образец 2: Шаровой кран в разрезе
      ctx.fillStyle = '#1e293b'; ctx.fillRect(boardX + 64, boardY + 18, 48, 38);
      ctx.fillStyle = '#d97706'; ctx.fillRect(boardX + 68, boardY + 31, 40, 10); // латунный корпус
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(boardX + 88, boardY + 36, 6, 0, Math.PI * 2); ctx.fill(); // шар
      ctx.fillStyle = '#dc2626'; ctx.fillRect(boardX + 86, boardY + 21, 16, 4); // красная ручка
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(boardX + 84, boardY + 34, 8, 4); // проходной канал
      ctx.font = '7.5px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('Кран шаровой', boardX + 66, boardY + 54);

      // Образец 3: Задвижка клиновая
      ctx.fillStyle = '#1e293b'; ctx.fillRect(boardX + 122, boardY + 18, 52, 38);
      ctx.fillStyle = '#475569'; ctx.fillRect(boardX + 128, boardY + 32, 40, 8); // чугунный корпус
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(boardX + 145, boardY + 22, 6, 12); // шток
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(boardX + 148, boardY + 20, 5.5, 0, Math.PI * 2); ctx.stroke(); // маховик
      ctx.font = '7.5px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('Задвижка ДУ50', boardX + 124, boardY + 54);
      ctx.restore();

      // Экран 2: Пьезометрический график теплосети
      const scr2X = 480, scr2Y = 18, scr2W = 160, scr2H = 62;
      ctx.save();
      ctx.fillStyle = '#040914';
      ctx.beginPath(); ctx.roundRect(scr2X, scr2Y, scr2W, scr2H, 6); ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2; ctx.stroke();

      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('ПЬЕЗОМЕТРИЧЕСКИЙ ГРАФИК', scr2X + 6, scr2Y + 11);

      // Оси графика
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scr2X + 16, scr2Y + 16); ctx.lineTo(scr2X + 16, scr2Y + 54);
      ctx.lineTo(scr2X + scr2W - 8, scr2Y + 54); ctx.stroke();

      // Линия статического напора (пунктир)
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(scr2X + 16, scr2Y + 24); ctx.lineTo(scr2X + scr2W - 8, scr2Y + 24); ctx.stroke();
      ctx.setLineDash([]);

      // Линия подачи (красная ниспадающая)
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(scr2X + 16, scr2Y + 28); ctx.lineTo(scr2X + scr2W - 12, scr2Y + 40); ctx.stroke();

      // Линия обратки (синяя восходящая)
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(scr2X + 16, scr2Y + 50); ctx.lineTo(scr2X + scr2W - 12, scr2Y + 46); ctx.stroke();

      ctx.font = '7.5px monospace';
      ctx.fillStyle = '#ef4444'; ctx.fillText('H1: 65м', scr2X + 20, scr2Y + 26);
      ctx.fillStyle = '#38bdf8'; ctx.fillText('H2: 20м', scr2X + 20, scr2Y + 48);
      ctx.restore();
    } else {
      // КИПиА: Стенд датчиков в разрезе + Стенд схемы автоматики и ПЛК
      const boardX = 285, boardY = 18, boardW = 185, boardH = 62;
      ctx.save();
      ctx.fillStyle = '#0a0e17';
      ctx.beginPath(); ctx.roundRect(boardX, boardY, boardW, boardH, 6); ctx.fill();
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.2; ctx.stroke();

      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('ОБРАЗЦЫ ДАТЧИКОВ И ИЗМЕРИТЕЛЕЙ КИП', boardX + 6, boardY + 11);

      // Датчик 1: Манометр с трубкой Бурдона в разрезе
      ctx.fillStyle = '#1e293b'; ctx.fillRect(boardX + 10, boardY + 18, 48, 38);
      ctx.fillStyle = '#d97706'; ctx.fillRect(boardX + 31, boardY + 44, 6, 8); // латунный штуцер
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(boardX + 34, boardY + 34, 11, 0, Math.PI * 2); ctx.stroke(); // корпус
      // Трубка Бурдона (C-образная дуга)
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(boardX + 34, boardY + 34, 7.5, Math.PI * 0.4, Math.PI * 1.8); ctx.stroke();
      // Красная стрелка
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(boardX + 34, boardY + 34); ctx.lineTo(boardX + 39, boardY + 29); ctx.stroke();
      ctx.font = '7.5px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('Манометр КИП', boardX + 12, boardY + 54);

      // Датчик 2: Термопара ТХА в разрезе
      ctx.fillStyle = '#1e293b'; ctx.fillRect(boardX + 66, boardY + 18, 50, 38);
      ctx.fillStyle = '#64748b'; ctx.fillRect(boardX + 70, boardY + 34, 34, 3); // стальной чехол
      // Спай термопары на конце
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(boardX + 104, boardY + 35.5, 3, 0, Math.PI * 2); ctx.fill();
      // Клеммная головка
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(boardX + 68, boardY + 26, 12, 18, 2); ctx.fill();
      ctx.font = '7.5px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('Термопара ТХА', boardX + 68, boardY + 54);

      // Датчик 3: Аналоговый преобразователь 4-20 мА
      ctx.fillStyle = '#1e293b'; ctx.fillRect(boardX + 124, boardY + 18, 50, 38);
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(boardX + 130, boardY + 22, 38, 20, 3); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.font = 'bold 7px monospace'; ctx.fillText('4-20 mA', boardX + 133, boardY + 32);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(boardX + 133, boardY + 36, 32, 2.5);
      ctx.font = '7.5px sans-serif'; ctx.fillStyle = '#e2e8f0'; ctx.fillText('Токовая петля', boardX + 126, boardY + 54);
      ctx.restore();

      // Экран 2: Осциллограмма токового сигнала + Ladder Logic
      const scr2X = 480, scr2Y = 18, scr2W = 160, scr2H = 62;
      ctx.save();
      ctx.fillStyle = '#040914';
      ctx.beginPath(); ctx.roundRect(scr2X, scr2Y, scr2W, scr2H, 6); ctx.fill();
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.2; ctx.stroke();

      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('АСУ ТП · СИГНАЛ 4-20 мА', scr2X + 6, scr2Y + 11);

      // Сетка экрана
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'; ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = scr2X + 12; x < scr2X + scr2W; x += 16){ ctx.moveTo(x, scr2Y + 14); ctx.lineTo(x, scr2Y + scr2H - 4); }
      for (let y = scr2Y + 18; y < scr2Y + scr2H; y += 12){ ctx.moveTo(scr2X + 4, y); ctx.lineTo(scr2X + scr2W - 4, y); }
      ctx.stroke();

      // Живая осциллограмма
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < scr2W - 12; i++){
        const wx = scr2X + 6 + i;
        const wy = scr2Y + scr2H / 2 + 6 + Math.sin(i * 0.12 + now * 0.008) * 12;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      ctx.font = '7.5px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('I = 12.04 мА · В ДОПУСКЕ', scr2X + 8, scr2Y + 56);
      ctx.restore();
    }

    // 3. СТЕКЛЯННАЯ ЩИТОВАЯ / КОТЕЛЬНАЯ (справа)
    const glassX = 650, glassY = 16, glassW = 210, glassH = 68;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(glassX, glassY, glassW, glassH);
    const glassGlow = ctx.createLinearGradient(glassX, glassY, glassX + glassW, glassY + glassH);
    glassGlow.addColorStop(0, currentSpec === 'ts' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)');
    glassGlow.addColorStop(1, currentSpec === 'ts' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(147, 51, 234, 0.18)');
    ctx.fillStyle = glassGlow;
    ctx.fillRect(glassX, glassY, glassW, glassH);

    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.strokeRect(glassX, glassY, glassW, glassH);
    ctx.beginPath();
    ctx.moveTo(glassX + glassW / 2, glassY); ctx.lineTo(glassX + glassW / 2, glassY + glassH);
    ctx.stroke();

    // Силуэты оборудования за стеклом
    ctx.fillStyle = '#090d16';
    ctx.fillRect(glassX + 16, glassY + 14, 34, 52);
    ctx.fillRect(glassX + 62, glassY + 14, 34, 52);
    ctx.fillRect(glassX + 118, glassY + 14, 34, 52);
    ctx.fillRect(glassX + 164, glassY + 14, 34, 52);

    // Мигающие светодиоды в шкафах
    const leds = [
      { x: glassX + 24, y: glassY + 24, c: '#22c55e' },
      { x: glassX + 24, y: glassY + 34, c: '#3b82f6' },
      { x: glassX + 70, y: glassY + 24, c: '#a855f7' },
      { x: glassX + 70, y: glassY + 34, c: '#22c55e' },
      { x: glassX + 126, y: glassY + 24, c: '#3b82f6' },
      { x: glassX + 172, y: glassY + 24, c: '#22c55e' }
    ];
    leds.forEach((ld, i) => {
      const on = Math.sin(now * 0.008 + i * 1.7) > -0.2;
      ctx.fillStyle = on ? ld.c : '#1e293b';
      ctx.fillRect(ld.x, ld.y, 3, 3);
    });

    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillStyle = currentSpec === 'ts' ? '#f87171' : '#a78bfa';
    ctx.fillText(currentSpec === 'ts' ? '🔥 КОТЕЛЬНАЯ И ИТП' : '⚡ ЩИТОВАЯ АСУ ТП 0.4 кВ', glassX + 20, glassY + 12);
    ctx.restore();

    // 4. ПОДВЕСНЫЕ ПРОМЫШЛЕННЫЕ ЛАМПЫ (светят вниз)
    const lampX = [180, 370, 560, 755];
    lampX.forEach(lx => {
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 26); ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(lx - 11, 26); ctx.lineTo(lx + 11, 26);
      ctx.lineTo(lx + 14, 32); ctx.lineTo(lx - 14, 32);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(lx, 33, 4, 0, Math.PI * 2); ctx.fill();

      // Мягкий световой конус на пол
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cone = ctx.createRadialGradient(lx, 34, 4, lx, 140, 160);
      cone.addColorStop(0, 'rgba(255, 220, 140, 0.18)');
      cone.addColorStop(0.45, 'rgba(255, 200, 100, 0.06)');
      cone.addColorStop(1, 'rgba(255, 180, 60, 0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lx - 12, 33); ctx.lineTo(lx - 95, 230); ctx.lineTo(lx + 95, 230); ctx.lineTo(lx + 12, 33);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  }

  /* ============================================================
     Интерьер и обстановка цеха: растения, зона отдыха, доска
     ============================================================ */
  function drawRoomProps(now){
    if (currentSpec === 'ksk') return drawKskProps(now);
    if (currentSpec === 'p') return drawPProps(now);
    // Растения в больших белых кадках (как на референсе)
    const plants = [
      { x: 1 * TILE + 20, y: 3 * TILE + 10 },
      { x: 8 * TILE + 20, y: 2 * TILE + 36 },
      { x: 1 * TILE + 20, y: 9 * TILE + 10 },
      { x: 20 * TILE + 22, y: 12 * TILE + 10 }
    ];

    plants.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      // Тень кадки
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      // Белая цилиндрическая кадка
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.roundRect(-8, 0, 16, 12, 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
      // Зелёные листья монстеры / пальмы
      ctx.fillStyle = '#16a34a';
      for (let i = 0; i < 5; i++){
        const angle = -Math.PI * 0.8 + (i * Math.PI * 0.4);
        const lx = Math.cos(angle) * 14;
        const ly = -6 + Math.sin(angle) * 14;
        ctx.beginPath(); ctx.ellipse(lx, ly, 6, 3, angle, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(0, -6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Уголок отдыха на левой стене (диванчик и журнальный столик с ноутбуком)
    const sofaX = 2 * TILE - 10, sofaY = 5 * TILE;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(sofaX + 22, sofaY + 28, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Корпус дивана (тёмно-серый велюр)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.roundRect(sofaX, sofaY, 44, 26, 6); ctx.fill();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2; ctx.stroke();
    // Подушки дивана
    ctx.fillStyle = '#334155';
    ctx.fillRect(sofaX + 4, sofaY + 4, 16, 14);
    ctx.fillRect(sofaX + 24, sofaY + 4, 16, 14);
    // Жёлтый пуф рядом
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(sofaX + 56, sofaY + 16, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.arc(sofaX + 56, sofaY + 16, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Маркерная доска на ножках (слева внизу)
    const wbX = 3 * TILE - 14, wbY = 12 * TILE + 4;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(wbX + 22, wbY + 24, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Металлические ножки
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wbX + 6, wbY + 24); ctx.lineTo(wbX + 6, wbY + 6);
    ctx.moveTo(wbX + 38, wbY + 24); ctx.lineTo(wbX + 38, wbY + 6);
    ctx.stroke();
    // Белая доска
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.roundRect(wbX, wbY - 14, 44, 22, 2); ctx.fill();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2; ctx.stroke();
    // Схемы и жёлтые стикеры на доске
    ctx.fillStyle = '#facc15'; ctx.fillRect(wbX + 6, wbY - 10, 6, 6);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(wbX + 16, wbY - 10, 6, 6);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(wbX + 26, wbY - 6); ctx.lineTo(wbX + 38, wbY - 6); ctx.stroke();
    ctx.restore();
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
    ctx.beginPath(); ctx.ellipse(0, 16, 26, 9, 0, 0, Math.PI * 2); ctx.fill();

    // 2. Свечение активной зоны под станцией
    if (!done){
      const glowColor = hard ? '192, 132, 252' : (currentSpec === 'ts' ? '245, 158, 11' : '56, 189, 248');
      const g = ctx.createRadialGradient(0, 8, 4, 0, 8, 36);
      g.addColorStop(0, 'rgba(' + glowColor + ',' + (0.32 * pulse) + ')');
      g.addColorStop(1, 'rgba(' + glowColor + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 8, 36, 0, Math.PI * 2); ctx.fill();
    }

    // 3. Отрисовка специализированного оборудования
    if (window.STATION_RENDERERS && window.STATION_RENDERERS[currentSpec]){
      window.STATION_RENDERERS[currentSpec](stType, done, hard, now, c.seed);
    } else if (window.STATION_RENDERERS && window.STATION_RENDERERS['kip']){
      window.STATION_RENDERERS['kip'](stType, done, hard, now, c.seed);
    }

    // 4. ЗНАЧОК «?» С ПУЛЬСИРУЮЩИМ ОРЕОЛОМ (КАК НА РЕФЕРЕНСЕ!)
    if (!done){
      const badgeY = -38 + Math.sin(now * 0.004 + c.seed) * 3.5;
      const badgeColor = hard ? '#c084fc' : '#f59e0b';

      // Ореол
      const bg = ctx.createRadialGradient(0, badgeY, 2, 0, badgeY, 18);
      bg.addColorStop(0, hard ? 'rgba(192, 132, 252, 0.5)' : 'rgba(245, 158, 11, 0.5)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(0, badgeY, 18, 0, Math.PI * 2); ctx.fill();

      // Кружок бейджа
      ctx.fillStyle = '#0f141d';
      ctx.beginPath(); ctx.arc(0, badgeY, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Символ «?»
      ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = badgeColor;
      ctx.fillText('?', 0, badgeY);

      // Парящий неоновый кристалл
      const gemX = 20, gemY = badgeY + Math.sin(now * 0.005 + c.seed) * 3;
      ctx.fillStyle = hard ? '#c084fc' : (currentSpec === 'ts' ? '#f59e0b' : '#38bdf8');
      ctx.beginPath();
      ctx.moveTo(gemX, gemY - 7);
      ctx.lineTo(gemX + 5, gemY);
      ctx.lineTo(gemX, gemY + 7);
      ctx.lineTo(gemX - 5, gemY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gemX - 1, gemY - 3, 2, 6);
    } else {
      // Станок обслужен
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#10b981';
      ctx.fillText('✔ ОБСЛУЖЕНО', 0, -28);
    }

    ctx.restore();
  }

  function drawCrystal(c, now){
    drawStation(c, now);
  }

  function drawPickup(pk, now){
    const px = pk.x * TILE + TILE / 2;
    const py = pk.y * TILE + TILE / 2;
    const bob = Math.sin(now * 0.003 + pk.seed) * 2;

    ctx.save();
    ctx.translate(px, py + bob);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
    glow.addColorStop(0, pk.type === 'oil' ? 'rgba(255,190,90,.35)' : 'rgba(120,235,160,.32)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 10;
    if (pk.type === 'oil'){
      ctx.shadowColor = 'rgba(255,190,90,.75)';
      ctx.fillStyle = '#e2a53c';
      ctx.beginPath();
      ctx.roundRect(-7, -7, 14, 16, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff1cd';
      ctx.fillRect(-3, -11, 6, 5);
      ctx.fillStyle = 'rgba(60,35,10,.45)';
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillRect(-4, 3, 8, 2);
    } else {
      ctx.shadowColor = 'rgba(120,235,160,.75)';
      ctx.fillStyle = '#eaf6ee';
      ctx.beginPath();
      ctx.roundRect(-9, -7, 18, 15, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#4fbf7a';
      ctx.fillRect(-1.8, -4, 3.6, 9);
      ctx.fillRect(-4.5, -1.2, 9, 3.6);
    }
    ctx.restore();
  }

  // На последнем уровне цель маршрута — сама СОТА вместо переходной двери.
  function drawSotaDestination(now){
    const sprite = getSotaSprite();
    if (!sprite) return;
    const x = exitCell.x * TILE + TILE / 2;
    const y = exitCell.y * TILE + TILE / 2;
    const width = 112;
    const height = width * sprite.naturalHeight / sprite.naturalWidth;
    // Вход здания совпадает с прежней клеткой выхода; картинка помещается в карту.
    const left = Math.min(x - width / 2, VW - width - 5);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();ctx.ellipse(left + width / 2, y + 12, width / 2, 10, 0, 0, Math.PI * 2);ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, left, y + 10 - height, width, height);
    ctx.fillStyle = exitOpen ? '#8af2ce' : '#ffd180';
    ctx.fillRect(x - 12, y + 10, 24, 3);
    ctx.fillStyle = '#101c2bea';ctx.fillRect(left, y + 19, width, 19);
    ctx.textAlign = 'center';ctx.textBaseline = 'middle';ctx.font = 'bold 10px monospace';
    ctx.fillStyle = exitOpen ? '#8af2ce' : '#ffd180';
    ctx.fillText(exitOpen ? 'ВОЙТИ В СОТУ' : 'СОТА · ' + collected + '/' + needed, left + width / 2, y + 29);
    ctx.restore();
  }

  function drawExit(now){
    if (completedMines === totalMines - 1) {
      if (getSotaSprite()) return drawSotaDestination(now);
    }
    if (currentSpec === 'ksk') return drawKskExit(now);
    if (currentSpec === 'p') return drawPExit(now);
    // Выходная дверь на правой стене (x = 21, y = 7)
    const px = exitCell.x * TILE, py = exitCell.y * TILE;
    ctx.save();

    // Жёлто-чёрная предупреждающая рамка вокруг двери
    ctx.fillStyle = '#0f141d';
    ctx.fillRect(px - 2, py - 6, TILE + 4, TILE + 12);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(px - 2, py - 6, TILE + 4, TILE + 12);

    // Сама дверь
    ctx.fillStyle = exitOpen ? '#052e16' : '#1e293b';
    ctx.fillRect(px + 4, py, TILE - 8, TILE);

    // Табличка ВЫХОД сверху
    ctx.fillStyle = exitOpen ? '#10b981' : '#f59e0b';
    ctx.fillRect(px + 2, py - 14, TILE - 4, 8);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ВЫХОД', px + TILE / 2, py - 10);

    // Большие стрелки >> на створках двери
    const pulse = 0.7 + Math.sin(now * 0.008) * 0.3;
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = exitOpen ? '#4ade80' : '#f59e0b';
    ctx.fillText('>>', px + TILE / 2, py + TILE / 2);

    // Если открыто — световой луч из двери
    if (exitOpen){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createLinearGradient(px, py, px - 50, py);
      beam.addColorStop(0, 'rgba(74, 222, 128, ' + (0.45 * pulse) + ')');
      beam.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(px - 50, py - 10, 50, TILE + 20);
      ctx.restore();
    }

    ctx.restore();
  }

  /* ============================================================
     Специалисты Академии СОТА (персонаж)
     ============================================================ */
  const SKINS = [
    {
      id: 'tech', name: 'Наладчик СОТА',
      desc: 'Студент Академии в фирменном спецодежде и защитной каске. Проходит производственную практику в цеху.',
      lines: {
        correct: ['Параметр в норме!', 'Станок настроен без сбоев.', 'Точно по ГОСТу!'],
        wrong: ['Показания расходятся с эталоном.', 'Ошибка калибровки. Проверь схему.', 'Внимание: аварийный порог.'],
        descend: 'Переходим на следующий технологический участок!'
      },
      suit: '#1d4ed8', suit2: '#1e3a8a', suitDark: '#172554',
      helmet: '#facc15', helmetDark: '#ca8a04', skin: '#fcd34d',
      accent: '#f97316'
    },
    {
      id: 'master_kip', name: 'Мастер КИПиА',
      desc: 'Специалист по контрольно-измерительным приборам и автоматике. Точность измерений и калибровка — его стихия.',
      lines: {
        correct: ['Сигнал 4–20 мА стабилен!', 'Калибровка датчика подтверждена.', 'АСУ ТП в штатном режиме.'],
        wrong: ['Рассинхронизация контура.', 'Погрешность выше допуска!', 'Проверь сопротивление изоляции.'],
        descend: 'Участок автоматизации сдан. Идём дальше!'
      },
      suit: '#0284c7', suit2: '#0369a1', suitDark: '#075985',
      helmet: '#f8fafc', helmetDark: '#cbd5e1', skin: '#fcd34d',
      accent: '#38bdf8'
    },
    {
      id: 'master_ts', name: 'Мастер Теплосетей',
      desc: 'Специалист по котельному оборудованию и гидравлике. Держит температурный график и давление под строгим контролем.',
      lines: {
        correct: ['Давление в контуре оптимально!', 'Теплообменник работает на 100%.', 'Циркуляция в норме.'],
        wrong: ['Опасность гидроудара!', 'Воздушная пробка в системе.', 'Сбрось избыток через клапан.'],
        descend: 'Тепловой пункт опрессован. Переход!'
      },
      suit: '#c2410c', suit2: '#9a3412', suitDark: '#7c2d12',
      helmet: '#ea580c', helmetDark: '#c2410c', skin: '#fcd34d',
      accent: '#fb923c'
    }
  ];
  const SKIN_IMAGES = {};
  let skinIndex = 0;
  try {
    skinIndex = Number(localStorage.getItem('sota_skin')) || 0;
  } catch (e) { skinIndex = 0; }
  if (!(skinIndex >= 0 && skinIndex < SKINS.length)) skinIndex = 0;
  const currentSkin = () => SKINS[skinIndex];

  function skImageReady(sk){ return null; }

  // Отрисовка 2.5D персонажа-наладчика (в точности по референсу СОТА)
  function drawSkinBody(g, sk, now){
    const bob = Math.sin(now * 0.008) * 1.1;
    g.save();
    g.translate(0, bob);

    // Ноги и тяжёлые рабочие ботинки
    const legW = 6, legTop = 4, legH = 9;
    g.fillStyle = sk.suit2;
    g.fillRect(-legW - 1, legTop, legW, legH);
    g.fillRect(1, legTop, legW, legH);
    // Ботинки со стальным носком
    g.fillStyle = '#0f172a';
    g.beginPath(); g.roundRect(-legW - 2, legTop + legH - 1, legW + 2, 4.5, 2); g.fill();
    g.beginPath(); g.roundRect(0, legTop + legH - 1, legW + 2, 4.5, 2); g.fill();

    // Тело / рабочий комбинезон
    const bw = 20, bh = 17, bodyTop = -10;
    const bodyG = g.createLinearGradient(0, bodyTop, 0, bodyTop + bh);
    bodyG.addColorStop(0, sk.suit);
    bodyG.addColorStop(1, sk.suit2);
    g.fillStyle = bodyG;
    g.beginPath();
    g.roundRect(-bw / 2, bodyTop, bw, bh, 5);
    g.fill();

    // Светоотражающие полосы на куртке (оранжево-серебристые по ГОСТу)
    g.fillStyle = sk.accent || '#f97316';
    g.fillRect(-bw / 2, bodyTop + 6, bw, 2);
    g.fillStyle = '#f1f5f9';
    g.fillRect(-bw / 2, bodyTop + 8, bw, 1.2);

    // Рукава и руки
    g.fillStyle = sk.suitDark;
    g.beginPath(); g.roundRect(-bw / 2 - 3, bodyTop + 2, 4.5, 11, 2); g.fill();
    g.beginPath(); g.roundRect(bw / 2 - 1.5, bodyTop + 2, 4.5, 11, 2); g.fill();
    // Перчатки
    g.fillStyle = '#334155';
    g.beginPath(); g.arc(-bw / 2 - 0.7, bodyTop + 13, 2.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(bw / 2 + 0.7, bodyTop + 13, 2.5, 0, Math.PI * 2); g.fill();

    // Монтажный пояс с пряжкой и инструментальным карманом
    g.fillStyle = '#1e293b';
    g.fillRect(-bw / 2 + 1, bodyTop + bh - 4.5, bw - 2, 4);
    g.fillStyle = '#fbbf24';
    g.fillRect(-2.5, bodyTop + bh - 5, 5, 5);

    // Шея и голова
    g.fillStyle = sk.skin;
    g.beginPath();
    g.arc(0, -15, 7.5, 0, Math.PI * 2);
    g.fill();

    // Лицо: глаза и дружелюбная улыбка
    g.fillStyle = '#1e293b';
    g.fillRect(-3.8, -16.5, 2, 2.2);
    g.fillRect(1.8, -16.5, 2, 2.2);
    // Блики в глазах
    g.fillStyle = '#ffffff';
    g.fillRect(-3.2, -16.5, 0.9, 0.9);
    g.fillRect(2.4, -16.5, 0.9, 0.9);
    // Нос и румянец
    g.fillStyle = 'rgba(239, 68, 68, 0.25)';
    g.beginPath(); g.arc(-4.5, -13, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(4.5, -13, 2, 0, Math.PI * 2); g.fill();

    // Защитная строительная каска (ярко-жёлтая с козырьком, как на референсе)
    g.fillStyle = sk.helmet;
    g.beginPath();
    g.arc(0, -17, 8.8, Math.PI, 0, false);
    g.fill();
    // Козырёк каски
    g.fillStyle = sk.helmetDark;
    g.beginPath();
    g.roundRect(-9.8, -18.2, 19.6, 3.5, 1.8);
    g.fill();
    // Верхнее ребро жёсткости каски
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    g.beginPath();
    g.roundRect(-1.5, -23.5, 3, 6, 1);
    g.fill();

    // Цифровой планшет наладчика в руке (вместо кирки!)
    g.save();
    g.translate(bw / 2 + 3, bodyTop + 7);
    g.fillStyle = '#0f172a';
    g.beginPath(); g.roundRect(0, 0, 7, 10, 1.5); g.fill();
    g.fillStyle = '#38bdf8';
    g.fillRect(1, 1, 5, 7);
    g.restore();

    g.restore();
  }

  function drawMiner(now){
    const sk = currentSkin();
    ctx.save();
    ctx.translate(player.x, player.y - 2);

    // тень
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 14, sk.photo ? 15 : 12, 4.8, 0, 0, Math.PI * 2);
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
    g.beginPath();
    g.roundRect(0, 0, 56, 64, 10);
    g.fill();

    g.save();
    g.translate(28, 48);
    g.scale(1.1, 1.1);
    g.fillStyle = 'rgba(0,0,0,.32)';
    g.beginPath();
    g.ellipse(0, 13, 12, 4.5, 0, 0, Math.PI * 2);
    g.fill();
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
    SKINS.forEach((sk, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'skinbtn' + (i === skinIndex ? ' sel' : '');
      b.title = sk.name + ' — бесплатно';

      const cv = document.createElement('canvas');
      cv.width = Math.round(56 * dpr);
      cv.height = Math.round(64 * dpr);
      cv.style.width = '56px';
      cv.style.height = '64px';
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSkinPortrait(g, sk);

      const label = document.createElement('span');
      label.textContent = sk.name;

      b.appendChild(cv);
      b.appendChild(label);
      b.addEventListener('click', () => {
        skinIndex = i;
        try { localStorage.setItem('mine_skin', String(i)); } catch (e) {}
        buildSkins();
        sfx.pick();
      });
      row.appendChild(b);
    });
    renderSkinDesc();
  }

  function drawParticles(dt, now){
    // пылинки в луче
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

    ctx.fillStyle = '#f4e7d0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(speech.text, x + w / 2, y + h / 2 + 0.5, w - pad * 2);
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

    // 2.1. Интерьер: растения в кадках, диванчик, маркерная доска
    drawRoomProps(now);

    // 3. Задняя стена цеха (y = 0..1) с вывеской СОТА, экранами телеметрии, щитовой и лампами
    drawBackWall(now);

    // 4. Боковые стены и нижнее ограждение
    for (let y = 0; y < H; y++){
      drawWall(0, y, 1);
      drawWall(W - 1, y, 1);
    }
    for (let x = 0; x < W; x++){
      drawWall(x, H - 1, 1);
    }

    // 5. Выходная дверь на правой стене
    drawExit(now);

    // 6. Расходники / бонусы в цеху
    for (const pk of pickups) drawPickup(pk, now);

    // 7. Станки и оборудование со значками «?»
    for (const c of crystals) drawStation(c, now);

    // 8. Мастер (персонаж)
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
      ctx.fillStyle = c.cracked ? '#b08a5e' : (c.hard ? '#c79bff' : '#6ee0f5');
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

  /* ============================================================
     Главный цикл
     ============================================================ */
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
      fuel = Math.max(0, fuel - dt * 1.05);
      if (fuel <= 0){ updateHUD(); gameOver('Энергосеть цеха обесточена. Требуется перезапуск питания.'); }
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
    if (state === 'minigame' && currentSpec === 'p') return;
    const isArrow = e.code.startsWith('Arrow') || e.code === 'Space';
    if (isArrow) e.preventDefault();

    if (state === 'minigame'){
      if (currentSpec === 'p') return;
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

    const dir = KEYMAP[e.code];
    if (!dir) return;

    if (state === 'title'){
      if (e.code === 'Space' || e.code === 'Enter') openCitySelect();
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

  el('startBtn').addEventListener('click', openCitySelect);
  el('againBtn').addEventListener('click', openCitySelect);
  el('backBtn').addEventListener('click', () => {
    el('cityScreen').classList.add('hidden');
    el('startScreen').classList.remove('hidden');
    state = 'title';
    buildSkins();
  });
  el('skinsBtn').addEventListener('click', () => {
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
