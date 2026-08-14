/**
 * Elefante Letrado Script - Módulo de Diagnóstico e Monitor de Performance v1.0.1
 * Monitoramento isolado de FPS, Event-Loop Lag, Long Tasks, Mutações DOM e Desempenho.
 * v1.0.1: Adicionado suporte a document.hidden (Background Tab Throttling Awareness)
 */

(function () {
  'use strict';

  // Classe Fila Circular Fixo (Ring Buffer) para evitar consumo ilimitado de memória
  class RingBuffer {
    constructor(capacity) {
      this.capacity = capacity;
      this.buffer = new Array(capacity);
      this.head = 0;
      this.tail = 0;
      this.size = 0;
    }

    push(item) {
      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;
      if (this.size < this.capacity) {
        this.size++;
      } else {
        this.head = (this.head + 1) % this.capacity; // Descarta elemento mais antigo
      }
    }

    toArray() {
      const result = [];
      let idx = this.head;
      for (let i = 0; i < this.size; i++) {
        result.push(this.buffer[idx]);
        idx = (idx + 1) % this.capacity;
      }
      return result;
    }

    clear() {
      this.buffer = new Array(this.capacity);
      this.head = 0;
      this.tail = 0;
      this.size = 0;
    }
  }

  const PerformanceMonitorModule = {
    name: 'diagnostics-monitor',
    version: '1.0.1',
    depends: [],

    mode: 'OFF', // 'OFF', 'NORMAL', 'DEEP'
    hudVisible: false,
    startTime: 0,
    isTabHidden: false,

    // Ring Buffers isolados
    eventsBuffer: new RingBuffer(5000),
    timingsBuffer: new RingBuffer(2000),
    longTasksBuffer: new RingBuffer(1000),
    snapshotsBuffer: new RingBuffer(500),

    // Métricas de Tempo Real
    currentFps: 60,
    currentFrameTimeMs: 16.6,
    currentEventLoopLagMs: 0,
    maxEventLoopLagMs: 0,
    totalLongTasks: 0,
    totalEventsEmitted: 0,
    domMutationsPerSec: 0,
    mutationCountTemp: 0,
    lastDomNodesCount: 0,

    // References internas de Timers/Observers
    rafId: null,
    lagTimerId: null,
    snapshotIntervalId: null,
    mutationSecIntervalId: null,
    longTaskObserver: null,
    mutationObserver: null,
    originalEmit: null,
    hudElement: null,
    visibilityHandler: null,

    async init(runtime) {
      this.runtime = runtime;

      // Restaura preferências salvas no Storage
      const storage = runtime.services.storage;
      const savedMode = (storage.getDiagMode && storage.getDiagMode()) || 'OFF';
      const savedHUD  = (storage.getDiagHUD && storage.getDiagHUD()) || false;

      this.hudVisible = Boolean(savedHUD);

      // Escuta comandos de diagnóstico via EventBus
      runtime.events.handleCommand('command:diag:set-mode', (payload) => {
        this.setMode(payload?.mode || 'OFF');
      });

      runtime.events.handleCommand('command:diag:toggle-hud', (payload) => {
        this.toggleHUD(payload?.visible);
      });

      runtime.events.handleCommand('command:diag:export', () => {
        this.exportJSON();
      });

      runtime.events.handleCommand('command:diag:clear', () => {
        this.clear();
      });

      if (savedMode !== 'OFF') {
        this.enable(savedMode);
      }
    },

    async start() {
      // Se o HUD estivesse visível por configuração
      if (this.hudVisible && this.mode !== 'OFF') {
        this.createHUD();
      }
    },

    async stop() {
      this.disable();
    },

    // -------------------------------------------------------------
    // CONTROLE DE MODOS DE OPERAÇÃO
    // -------------------------------------------------------------
    setMode(newMode) {
      if (newMode === this.mode) return;
      if (newMode === 'OFF') {
        this.disable();
      } else {
        this.enable(newMode);
      }

      const storage = this.runtime.services.storage;
      if (storage.setDiagMode) storage.setDiagMode(newMode);
    },

    enable(mode = 'NORMAL') {
      this.disable(); // Reseta qualquer loop ativo anterior

      this.mode = mode;
      this.startTime = Date.now();
      this.isTabHidden = Boolean(document.hidden);
      console.log(`[📊 Diagnostics v1.0.1] Monitor ativado no modo: ${this.mode}`);

      // Observador de Visibilidade da Aba (Background Tab Throttling Awareness)
      this.visibilityHandler = () => {
        this.isTabHidden = Boolean(document.hidden);
        if (this.isTabHidden) {
          console.log('[📊 Diagnostics] Aba em segundo plano (Browser Tab Hidden) — Throttling ativado pelo navegador.');
        } else {
          console.log('[📊 Diagnostics] Aba em primeiro plano (Browser Tab Visible) — Amostragem de performance retomada.');
        }
        this.updateHUD();
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);

      // 1. Inicia Medição de FPS & Frame Time
      let lastFrameTime = performance.now();
      let frameCount = 0;
      let lastFpsCheck = performance.now();

      const loopRAF = (now) => {
        if (!document.hidden) {
          frameCount++;
          const delta = now - lastFrameTime;
          lastFrameTime = now;
          this.currentFrameTimeMs = parseFloat(delta.toFixed(1));

          if (now - lastFpsCheck >= 1000) {
            this.currentFps = Math.round((frameCount * 1000) / (now - lastFpsCheck));
            frameCount = 0;
            lastFpsCheck = now;
            this.updateHUD();
          }
        } else {
          lastFrameTime = now;
          lastFpsCheck = now;
          frameCount = 0;
        }

        if (this.mode !== 'OFF') {
          this.rafId = requestAnimationFrame(loopRAF);
        }
      };
      this.rafId = requestAnimationFrame(loopRAF);

      // 2. Inicia Medição de Event-Loop Lag via setTimeout(0) com filtro de Tab Inativa
      let expectedLagTime = performance.now();
      const checkLag = () => {
        const now = performance.now();
        
        // Se a aba estiver em primeiro plano, mede o lag real do Event Loop
        if (!document.hidden) {
          const lag = Math.max(0, now - expectedLagTime - 20); // 20ms base
          this.currentEventLoopLagMs = parseFloat(lag.toFixed(1));
          if (this.currentEventLoopLagMs > this.maxEventLoopLagMs) {
            this.maxEventLoopLagMs = this.currentEventLoopLagMs;
          }
        } else {
          // Em aba inativa, o browser intencionalmente reduz o timer para 1000ms. Não é lag do script.
          this.currentEventLoopLagMs = 0;
        }

        expectedLagTime = performance.now();
        if (this.mode !== 'OFF') {
          this.lagTimerId = setTimeout(checkLag, 20);
        }
      };
      this.lagTimerId = setTimeout(checkLag, 20);

      // 3. PerformanceObserver para Long Tasks (>50ms)
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          this.longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // Descarta se ocorreu em aba oculta por causa do throttling nativo
              if (document.hidden) continue;

              this.totalLongTasks++;
              this.longTasksBuffer.push({
                timestamp: Date.now() - this.startTime,
                durationMs: parseFloat(entry.duration.toFixed(1)),
                startTimeMs: parseFloat(entry.startTime.toFixed(1))
              });
            }
            this.updateHUD();
          });
          this.longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          console.warn('[📊 Diagnostics] PerformanceObserver longtask não suportado neste navegador.');
        }
      }

      // 4. Snapshots de Baixa Frequência (a cada 30 segundos)
      this.takeSnapshot(); // Snapshot inicial a 0s
      this.snapshotIntervalId = setInterval(() => {
        this.takeSnapshot();
      }, 30000);

      // 5. INSTRUMENTAÇÕES ESPECÍFICAS DO MODO DEEP
      if (this.mode === 'DEEP') {
        this.enableDeepFeatures();
      }

      if (this.hudVisible) {
        this.createHUD();
      }
    },

    enableDeepFeatures() {
      // A. Interceptação Dinâmica do EventBus
      if (this.runtime?.events && !this.originalEmit) {
        const eventsBus = this.runtime.events;
        this.originalEmit = eventsBus.emit.bind(eventsBus);

        eventsBus.emit = (event, payload = null) => {
          this.totalEventsEmitted++;
          this.eventsBuffer.push({
            timestamp: Date.now() - this.startTime,
            event: String(event)
          });
          this.updateHUD();
          return this.originalEmit(event, payload);
        };
      }

      // B. Observer de Mutações no DOM (Calcula mutations/segundo)
      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver((mutations) => {
          this.mutationCountTemp += mutations.length;
        });
        this.mutationObserver.observe(document.body || document.documentElement, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true
        });

        this.mutationSecIntervalId = setInterval(() => {
          this.domMutationsPerSec = this.mutationCountTemp;
          this.mutationCountTemp = 0;
          this.updateHUD();
        }, 1000);
      }
    },

    disable() {
      this.mode = 'OFF';

      if (this.visibilityHandler) {
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        this.visibilityHandler = null;
      }
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.lagTimerId) {
        clearTimeout(this.lagTimerId);
        this.lagTimerId = null;
      }
      if (this.snapshotIntervalId) {
        clearInterval(this.snapshotIntervalId);
        this.snapshotIntervalId = null;
      }
      if (this.mutationSecIntervalId) {
        clearInterval(this.mutationSecIntervalId);
        this.mutationSecIntervalId = null;
      }
      if (this.longTaskObserver) {
        this.longTaskObserver.disconnect();
        this.longTaskObserver = null;
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      // Restaura EventBus original
      if (this.originalEmit && this.runtime?.events) {
        this.runtime.events.emit = this.originalEmit;
        this.originalEmit = null;
      }

      this.removeHUD();
      console.log('[📊 Diagnostics] Monitor desativado.');
    },

    // -------------------------------------------------------------
    // MEDIÇÕES DE MARCAS DE TEMPO (CRITICAL PATH TIMINGS)
    // -------------------------------------------------------------
    mark(name) {
      if (this.mode !== 'DEEP') return;
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(name);
      }
    },

    measure(name, startMark, endMark) {
      if (this.mode !== 'DEEP') return;
      if (typeof performance !== 'undefined' && performance.measure) {
        try {
          performance.measure(name, startMark, endMark);
          const entries = performance.getEntriesByName(name, 'measure');
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.timingsBuffer.push({
              timestamp: Date.now() - this.startTime,
              name: String(name),
              durationMs: parseFloat(lastEntry.duration.toFixed(2))
            });
          }
        } catch (e) {
          // Ignora se a marca de início não existir
        }
      }
    },

    takeSnapshot() {
      if (this.mode === 'OFF') return;

      const elapsedSec = Math.round((Date.now() - this.startTime) / 1000);
      const domNodes = document.querySelectorAll('*').length;
      this.lastDomNodesCount = domNodes;

      let heapSize = null;
      if (typeof performance !== 'undefined' && performance.memory) {
        heapSize = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      }

      const isHiddenNow = Boolean(document.hidden);

      this.snapshotsBuffer.push({
        elapsedSec,
        tabState: isHiddenNow ? 'BACKGROUND_THROTTLED' : 'FOREGROUND_ACTIVE',
        fps: isHiddenNow ? 'PAUSED' : this.currentFps,
        eventLoopLagMs: isHiddenNow ? 0 : this.currentEventLoopLagMs,
        domNodes,
        heapMemoryMb: heapSize
      });

      console.log(`[📊 Snapshot ${elapsedSec}s] Estado=${isHiddenNow ? 'Aba Oculta' : 'Aba Ativa'}, FPS=${isHiddenNow ? 'PAUSED' : this.currentFps}, Nodes=${domNodes}, Lag=${isHiddenNow ? '0 (throttled)' : this.currentEventLoopLagMs + 'ms'}`);
      this.updateHUD();
    },

    clear() {
      this.eventsBuffer.clear();
      this.timingsBuffer.clear();
      this.longTasksBuffer.clear();
      this.snapshotsBuffer.clear();
      this.maxEventLoopLagMs = 0;
      this.totalLongTasks = 0;
      this.totalEventsEmitted = 0;
      this.mutationCountTemp = 0;
      this.domMutationsPerSec = 0;
      this.updateHUD();
      console.log('[📊 Diagnostics] Buffers de diagnóstico limpos.');
    },

    exportJSON() {
      const report = {
        meta: {
          channel: 'stable',
          version: this.version,
          mode: this.mode,
          timestamp: new Date().toISOString(),
          sessionDurationSec: Math.round((Date.now() - this.startTime) / 1000),
          browserInfo: {
            userAgent: navigator.userAgent,
            tabStateAtExport: document.hidden ? 'BACKGROUND' : 'FOREGROUND'
          }
        },
        summary: {
          currentFps: document.hidden ? 'PAUSED' : this.currentFps,
          currentFrameTimeMs: this.currentFrameTimeMs,
          currentEventLoopLagMs: this.currentEventLoopLagMs,
          maxEventLoopLagMs: this.maxEventLoopLagMs,
          totalLongTasks: this.totalLongTasks,
          totalEventsEmitted: this.totalEventsEmitted,
          domNodesCount: this.lastDomNodesCount,
          domMutationsPerSec: this.domMutationsPerSec
        },
        snapshots: this.snapshotsBuffer.toArray(),
        longTasks: this.longTasksBuffer.toArray(),
        timings: this.timingsBuffer.toArray(),
        eventsHistory: this.eventsBuffer.toArray()
      };

      const jsonStr = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `elefante-diagnostics-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // -------------------------------------------------------------
    // INTERFACE DE USUÁRIO HUD FLUTUANTE
    // -------------------------------------------------------------
    toggleHUD(visible) {
      this.hudVisible = typeof visible === 'boolean' ? visible : !this.hudVisible;
      const storage = this.runtime.services.storage;
      if (storage.setDiagHUD) storage.setDiagHUD(this.hudVisible);

      if (this.hudVisible && this.mode !== 'OFF') {
        this.createHUD();
      } else {
        this.removeHUD();
      }
    },

    createHUD() {
      if (document.getElementById('ea-diag-hud')) return;

      const hud = document.createElement('div');
      hud.id = 'ea-diag-hud';
      hud.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; z-index: 999999;
        background: rgba(17, 17, 27, 0.92); backdrop-filter: blur(8px);
        color: #cdd6f4; font-family: 'Consolas', 'Fira Code', monospace;
        font-size: 11px; line-height: 1.4; border: 1px solid #45475a;
        border-radius: 10px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        width: 240px; user-select: none; pointer-events: auto;
      `;

      hud.innerHTML = `
        <div id="ea-diag-hud-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:move;border-bottom:1px solid #313244;padding-bottom:4px;">
          <strong style="color:#cba6f7;">📊 DIAGNOSTICS (${this.mode})</strong>
          <button id="ea-diag-close-btn" style="background:none;border:none;color:#a6adc8;cursor:pointer;font-size:12px;">✕</button>
        </div>
        <div id="ea-diag-hud-body">
          <div>Status Aba: <span id="ea-dh-tabstate" style="color:#a6e3a1;">FOREGROUND</span></div>
          <div>Runtime: <span id="ea-dh-time" style="color:#a6e3a1;">0s</span></div>
          <div>FPS: <span id="ea-dh-fps" style="color:#a6e3a1;">60</span> (<span id="ea-dh-frame">16.6</span> ms)</div>
          <div>Event Loop Lag: <span id="ea-dh-lag" style="color:#a6e3a1;">0</span> ms (Max: <span id="ea-dh-maxlag">0</span> ms)</div>
          <div>Long Tasks: <span id="ea-dh-longtask" style="color:#f9e2af;">0</span></div>
          <div>DOM Nodes: <span id="ea-dh-nodes" style="color:#89b4fa;">0</span></div>
          ${this.mode === 'DEEP' ? `
            <div>DOM Mutations: <span id="ea-dh-mutations" style="color:#f38ba8;">0</span> /s</div>
            <div>Events Dispatched: <span id="ea-dh-events" style="color:#cba6f7;">0</span></div>
          ` : ''}
        </div>
      `;

      document.body.appendChild(hud);
      this.hudElement = hud;

      const closeBtn = document.getElementById('ea-diag-close-btn');
      if (closeBtn) closeBtn.onclick = () => this.toggleHUD(false);

      // Torna o HUD arrastável
      let isDragging = false, offsetX = 0, offsetY = 0;
      const header = document.getElementById('ea-diag-hud-header');
      if (header) {
        header.onmousedown = (e) => {
          isDragging = true;
          offsetX = e.clientX - hud.offsetLeft;
          offsetY = e.clientY - hud.offsetTop;
        };
        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          hud.style.left = (e.clientX - offsetX) + 'px';
          hud.style.top = (e.clientY - offsetY) + 'px';
          hud.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
      }

      this.updateHUD();
    },

    updateHUD() {
      if (!this.hudElement || !this.hudVisible || this.mode === 'OFF') return;

      const elapsedSec = Math.round((Date.now() - this.startTime) / 1000);
      const tabStateEl = document.getElementById('ea-dh-tabstate');
      const timeEl = document.getElementById('ea-dh-time');
      const fpsEl = document.getElementById('ea-dh-fps');
      const frameEl = document.getElementById('ea-dh-frame');
      const lagEl = document.getElementById('ea-dh-lag');
      const maxLagEl = document.getElementById('ea-dh-maxlag');
      const longtaskEl = document.getElementById('ea-dh-longtask');
      const nodesEl = document.getElementById('ea-dh-nodes');
      const mutationsEl = document.getElementById('ea-dh-mutations');
      const eventsEl = document.getElementById('ea-dh-events');

      if (tabStateEl) {
        tabStateEl.textContent = document.hidden ? 'BACKGROUND (THROTTLED)' : 'FOREGROUND';
        tabStateEl.style.color = document.hidden ? '#f9e2af' : '#a6e3a1';
      }

      if (timeEl) timeEl.textContent = `${elapsedSec}s`;
      if (fpsEl) {
        if (document.hidden) {
          fpsEl.textContent = 'PAUSED';
          fpsEl.style.color = '#f9e2af';
        } else {
          fpsEl.textContent = this.currentFps;
          fpsEl.style.color = this.currentFps < 30 ? '#f38ba8' : (this.currentFps < 50 ? '#f9e2af' : '#a6e3a1');
        }
      }
      if (frameEl) frameEl.textContent = this.currentFrameTimeMs;
      if (lagEl) {
        lagEl.textContent = this.currentEventLoopLagMs;
        lagEl.style.color = this.currentEventLoopLagMs > 50 ? '#f38ba8' : '#a6e3a1';
      }
      if (maxLagEl) maxLagEl.textContent = this.maxEventLoopLagMs;
      if (longtaskEl) longtaskEl.textContent = this.totalLongTasks;
      if (nodesEl) nodesEl.textContent = this.lastDomNodesCount.toLocaleString();
      if (mutationsEl) mutationsEl.textContent = this.domMutationsPerSec;
      if (eventsEl) eventsEl.textContent = this.totalEventsEmitted.toLocaleString();
    },

    removeHUD() {
      const hud = document.getElementById('ea-diag-hud');
      if (hud) hud.remove();
      this.hudElement = null;
    }
  };

  // Registrar módulo no Runtime se disponível
  if (window.ElefanteRuntime) {
    window.ElefanteRuntime.registerModule(PerformanceMonitorModule);
  } else {
    window.ElefanteDiagMonitorModule = PerformanceMonitorModule;
  }

})();
