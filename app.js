(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  // Reading progress makes the long lesson feel like a guided route.
  const progress = $('#readingProgress');
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const themeToggle = $('#themeToggle');
  const savedTheme = localStorage.getItem('incertidumbre-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
  const updateThemeIcon = () => { themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☾' : '☼'; };
  updateThemeIcon();
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('incertidumbre-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeIcon();
  });

  // Both lessons live in this document; switching topics only changes visibility.
  let activeTopic = 'single';
  const answered = new Set();
  const topicDetails = {
    single: {
      number: '01',
      title: 'Estás en: una medición',
      description: 'Aprenderás a leer una sola vez, considerar la escala del instrumento y expresar el resultado con su incerteza.',
      target: '#conceptos',
    },
    repeated: {
      number: '02',
      title: 'Estás en: una medida realizada varias veces',
      description: 'Aprenderás a calcular la media x̄, medir la dispersión con σ y obtener la incerteza de la media mediante σ/√n.',
      target: '#varias',
    },
  };
  const updatePracticeScore = () => {
    const topicExercises = $$('.exercise-card').filter(card => card.dataset.topic === activeTopic);
    const topicScore = topicExercises.filter(card => card.dataset.answeredCorrect === 'true').length;
    const complete = topicExercises.every(card => answered.has(card));
    $('#scoreCount').textContent = `${topicScore} / ${topicExercises.length}`;
    if (complete) {
      $('#scoreTitle').textContent = topicScore === topicExercises.length ? '¡Excelente dominio!' : 'Buen comienzo';
      $('#scoreText').textContent = topicScore === topicExercises.length
        ? 'Ya puedes explicar este tema con seguridad.'
        : 'Repasa los pasos del tema y vuelve a intentarlo.';
    } else {
      $('#scoreTitle').textContent = 'Tu recorrido empieza aquí';
      $('#scoreText').textContent = `Responde ${topicExercises.length === 1 ? 'el ejercicio' : 'los ejercicios'} de este tema para ver tu resultado.`;
    }
  };
  const selectTopic = (topic, scrollToLesson = true) => {
    if (!topicDetails[topic]) return;
    activeTopic = topic;
    $$('.topic-section').forEach(section => {
      const visibleForTopic = section.dataset.topic === 'both' || section.dataset.topic === topic;
      section.classList.toggle('topic-hidden', !visibleForTopic);
    });
    $$('[data-topic="single"], [data-topic="repeated"]').forEach(card => {
      if (card.matches('.solved-card, .exercise-card')) {
        card.classList.toggle('topic-hidden', card.dataset.topic !== topic);
      }
    });
    $$('[data-topic-select]').forEach(button => {
      const selected = button.dataset.topicSelect === topic;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const detail = topicDetails[topic];
    $('#selectedTopic').innerHTML = `<span class="selected-topic-mark">${detail.number}</span><div><strong>${detail.title}</strong><p>${detail.description}</p></div>`;
    const practiceTitle = $('#practica .section-heading h2');
    practiceTitle.textContent = topic === 'single' ? 'Practica: una medición' : 'Practica: mediciones repetidas';
    updatePracticeScore();
    updateProgress();
    if (scrollToLesson) $(detail.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $$('[data-topic-select]').forEach(button => {
    button.addEventListener('click', () => selectTopic(button.dataset.topicSelect));
  });
  selectTopic('single', false);

  const parseMeasurements = (value) => value.split(',').map(item => Number(item.trim())).filter(item => Number.isFinite(item));
  const round = (value) => value.toFixed(2);
  const calculate = () => {
    const values = parseMeasurements($('#measurements').value);
    const error = $('#calcError');
    if (values.length < 2) {
      error.textContent = 'Escribe al menos dos valores numéricos separados por comas.';
      return;
    }
    error.textContent = '';
    const n = values.length;
    const mean = values.reduce((sum, value) => sum + value, 0) / n;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
    const standardDeviation = Math.sqrt(variance);
    const uncertainty = standardDeviation / Math.sqrt(n);
    $('#resultN').textContent = n;
    $('#resultMean').textContent = round(mean);
    $('#resultStd').textContent = round(standardDeviation);
    $('#resultUncertainty').textContent = `± ${round(uncertainty)}`;
    $('#calcReport').innerHTML = `Resultado: <strong>x̄ = (${round(mean)} ± ${round(uncertainty)}) cm</strong>`;
  };
  $('#calculateBtn').addEventListener('click', calculate);
  $('#measurements').addEventListener('keydown', event => { if (event.key === 'Enter') calculate(); });

  $$('.answer-options').forEach((options) => {
    const card = options.closest('.exercise-card');
    const feedback = $('.exercise-feedback', card);
    const correct = options.dataset.answer;
    options.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      card.dataset.answeredCorrect = String(button.dataset.option === correct);
      $$('.answer-options button', card).forEach(option => { option.disabled = true; });
      if (button.dataset.option === correct) {
        button.classList.add('correct');
        feedback.textContent = 'Correcto. Tu razonamiento va por buen camino.';
      } else {
        button.classList.add('wrong');
        const right = $(`button[data-option="${correct}"]`, card);
        right.classList.add('correct');
        feedback.textContent = 'Casi. Observa la opción marcada en verde y vuelve a la fórmula relacionada.';
      }
      answered.add(card);
      updatePracticeScore();
    });
  });
})();
