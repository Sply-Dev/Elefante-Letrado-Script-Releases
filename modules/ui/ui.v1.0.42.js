/**
 * Elefante Letrado Script - Módulo UI v1.0.42
 * Gerenciador de interface visual, renderizador de painel flutuante e formulários.
 */

(function () {
  'use strict';

  const UIModule = {
    name: 'ui',
    version: '1.0.42',
    depends: [],

    async init(runtime) {
      this.runtime = runtime;
      this.icons = window.ElefanteUIIcons || {};
      this.styles = window.ElefanteUIStyles || {};

      // 1. Escuta EVENTOS DE DOMÍNIO para atualizar a interface sem acoplamento
      runtime.events.on('quiz:opened', () => {
        this.setStatus('🧠 Resolvendo Quiz...', '#cba6f7');
      });

      runtime.events.on('quiz:closed', () => {
        this.resetStatus();
      });

      runtime.events.on('quiz:solved', (payload) => {
        this.appendResult(`\n[Quiz Resolvido]: ${payload?.answer || 'OK'}`);
      });

      runtime.events.on('reader:started', () => {
        this.updateAutoButton(true);
        this.setStatus('Navegando...', '#89b4fa');
      });

      runtime.events.on('reader:stopped', () => {
        this.updateAutoButton(false);
        this.resetStatus();
      });

      // Se o módulo Settings ou Runtime for resetado
      runtime.events.on('config:reset', () => {
        this.renderSetupScreen();
      });
    },

    async start() {
      // Injeta fontes e folhas de estilo CSS
      if (this.styles.inject) this.styles.inject();

      // Cria o painel flutuante arrastável no DOM
      this.createPanelShell();

      // Decide qual tela inicial exibir com base nas configurações do storage
      const storage = this.runtime.services.storage;
      const apiKey = storage.getApiKey();
      const noAI = storage.getNoAI();
      const bookTitle = storage.getBookTitle();

      if (noAI || (apiKey && bookTitle)) {
        this.renderMainScreen();
      } else {
        this.renderSetupScreen();
      }
    },

    async stop() {
      const panel = document.getElementById('ea-panel');
      if (panel) panel.remove();
    },

    // -------------------------------------------------------------
    // API DO PAINEL REUTILIZÁVEL (COMPONENT API)
    // -------------------------------------------------------------
    createPanelShell() {
      let panel = document.getElementById('ea-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'ea-panel';

        panel.innerHTML = `
          <div id="ea-drag-header">
            <strong style="color:#af74f0;font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;animation:eaTitleGlow 4s ease-in-out infinite;letter-spacing:-0.2px;">Elefante Letrado Script</strong>
            <div style="display: flex; align-items: center; gap: 12px;">
              <button id="ea-min-btn" class="ea-btn-icone" style="width: 24px; height: 24px; border: none; border-radius: 6px; background: #313244; color: #cdd6f4; cursor: pointer; font-size: 14px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; text-align: center;"><span id="ea-min-icon">−</span></button>
            </div>
          </div>
          <div id="ea-panel-content" class="ea-panel-content"></div>
        `;

        document.body.appendChild(panel);

        // Sistema Profissional de Drag & Drop com Física de Inércia (Lerp 0.35), Micro Elevação 2px e Sombra Expansiva
        let isDragging = false, offsetX = 0, offsetY = 0;
        let targetLeft = 0, targetTop = 0;
        let currentLeft = 0, currentTop = 0;
        let animFrameId = null;

        const header = document.getElementById("ea-drag-header");

        const updateDragPosition = () => {
          if (!isDragging && Math.abs(targetLeft - currentLeft) < 0.1 && Math.abs(targetTop - currentTop) < 0.1) {
            currentLeft = targetLeft;
            currentTop = targetTop;
            panel.style.left = currentLeft + "px";
            panel.style.top = currentTop + "px";
            animFrameId = null;
            return;
          }

          // Interpolação suave (lerp 0.35) para deslizar com peso fluido
          currentLeft += (targetLeft - currentLeft) * 0.35;
          currentTop  += (targetTop - currentTop) * 0.35;

          panel.style.left = currentLeft.toFixed(2) + "px";
          panel.style.top  = currentTop.toFixed(2) + "px";

          animFrameId = requestAnimationFrame(updateDragPosition);
        };

        if (header) {
          header.addEventListener('mousedown', e => {
            if (e.target.tagName === "BUTTON" || e.target.closest("button")) return;
            isDragging = true;
            panel.classList.add('ea-dragging');

            currentLeft = panel.offsetLeft;
            currentTop  = panel.offsetTop;
            targetLeft  = currentLeft;
            targetTop   = currentTop;

            offsetX = e.clientX - currentLeft;
            offsetY = e.clientY - currentTop;

            if (!animFrameId) {
              animFrameId = requestAnimationFrame(updateDragPosition);
            }
          });
        }

        document.addEventListener('mousemove', e => {
          if (!isDragging) return;
          let newLeft = e.clientX - offsetX;
          let newTop  = e.clientY - offsetY;
          const maxLeft = window.innerWidth - panel.offsetWidth;
          const maxTop  = window.innerHeight - panel.offsetHeight;

          if (newLeft < 0) newLeft = 0;
          if (newLeft > maxLeft) newLeft = maxLeft;
          if (newTop < 0) newTop = 0;
          if (newTop > maxTop) newTop = maxTop;

          targetLeft = newLeft;
          targetTop  = newTop;

          panel.style.right = "auto";
          panel.style.bottom = "auto";

          if (!animFrameId) {
            animFrameId = requestAnimationFrame(updateDragPosition);
          }
        });

        document.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            panel.classList.remove('ea-dragging');
          }
        });
      }

      // Lógica de Minimização (Animação exclusiva do ícone interno)
      const minBtn = document.getElementById("ea-min-btn");
      const minIcon = document.getElementById("ea-min-icon");
      const contentArea = document.getElementById("ea-panel-content");

      if (minBtn && contentArea) {
        minBtn.onmousedown = (e) => {
          e.stopPropagation();
        };

        minBtn.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          const isMinimized = contentArea.classList.contains('ea-minimizing');
          if (!isMinimized) {
            contentArea.style.maxHeight = contentArea.scrollHeight + 'px';
            void contentArea.offsetHeight;
            contentArea.classList.remove('ea-maximizing');
            contentArea.classList.add('ea-minimizing');
            if (panel) panel.classList.add('ea-panel-collapsed');
            if (minIcon) {
              minIcon.textContent = "+";
              minIcon.style.transform = "rotate(180deg)";
            }
          } else {
            if (panel) panel.classList.remove('ea-panel-collapsed');
            contentArea.classList.remove('ea-minimizing');
            contentArea.classList.add('ea-maximizing');
            contentArea.style.maxHeight = (contentArea.scrollHeight + 60) + 'px';
            if (minIcon) {
              minIcon.textContent = "−";
              minIcon.style.transform = "rotate(0deg)";
            }
            setTimeout(() => {
              if (!contentArea.classList.contains('ea-minimizing')) {
                contentArea.style.maxHeight = 'none';
              }
            }, 450);
          }
        };
      }

      return panel;
    },

    renderContent(html) {
      const contentArea = document.getElementById('ea-panel-content');
      if (contentArea) {
        contentArea.innerHTML = `<div class="ea-fade-in">${html}</div>`;
      }
    },

    getDefaultStatus() {
      const storage = this.runtime?.services?.storage;
      if (!storage) return { text: '🛈 Modo com IA ativa', color: '#a6e3a1' };
      const apiKey = storage.getApiKey();
      const noAI = storage.getNoAI();
      const hasAI = Boolean(apiKey) && !noAI;

      return {
        text: hasAI ? '🛈 Modo com IA ativa' : 'ⓘ Modo de apenas leitura',
        color: hasAI ? '#a6e3a1' : '#f9e2af'
      };
    },

    setStatus(text, color = '#a6e3a1') {
      const statusEl = document.getElementById('ea-status');
      if (statusEl) {
        statusEl.textContent = text;
        statusEl.style.color = color;
      }
    },

    resetStatus() {
      const def = this.getDefaultStatus();
      this.setStatus(def.text, def.color);
    },

    updateAutoButton(active) {
      const autoBtn = document.getElementById('ea-auto-btn');
      if (autoBtn) {
        const storage = this.runtime.services.storage;
        const hasKey = Boolean(storage.getApiKey());
        if (active) {
          autoBtn.textContent = '⏹ Parar';
          autoBtn.style.background = '#f38ba8';
        } else {
          autoBtn.textContent = hasKey ? '▶ Iniciar' : '▶ Iniciar Auto-Página';
          autoBtn.style.background = '#89b4fa';
        }
      }
    },

    appendResult(text) {
      const resultEl = document.getElementById('ea-result');
      if (resultEl) {
        resultEl.textContent += text;
        resultEl.style.display = 'block';
      }
    },

    // -------------------------------------------------------------
    // RENDERIZAÇÃO DAS TELAS DA INTERFACE
    // -------------------------------------------------------------
    renderSetupScreen() {
      const i = this.icons;
      this.renderContent(`
        <b style="color:#cba6f7;font-family: 'Manrope', sans-serif;font-weight: 700;font-size:16px;display:flex;align-items:center;gap:8px;">${i.svgChave} Chave da API</b>
        <p style="font-family: 'Inter', sans-serif;font-weight:400;margin:14px 0 8px;font-size:14px;color:#a6adc8;">Cole sua API Key do OpenRouter:</p>
        <div style="position: relative; width: 100%; box-sizing: border-box; margin: 0 0 6px 0; transform: translateY(-7px);">
          <input id="ea-inp" type="password" placeholder="sk-or-..." style="
            width:100%; box-sizing:border-box; padding:11px 42px 11px 12px;
            border:2px solid #6c5fc7; border-radius:8px; background:#11111b;
            color:#cdd6f4; font-family:'Inter', sans-serif; font-weight:500; letter-spacing:0.8px; font-size:14px; outline:none;
            display:block; text-align:left; margin:0;
          ">
          <button id="ea-toggle-eye" class="ea-eye-btn" style="
            position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
            background: none; border: none; color: #6c7086; cursor: pointer;
            padding: 4px; display: flex; align-items: center; justify-content: center;
          " title="Mostrar/Ocultar chave">${i.svgOlhoFechado}</button>
        </div>
        <div id="ea-err" class="ea-error-box" style="width:100%;color:#f38ba8;font-size:12px;line-height:1.2;transform:translateY(-15px);opacity:0.90;"></div>
        <button id="ea-ok" class="ea-btn-animado" style="
          width:100%;padding:11px;border:none;border-radius:10px; font-family: 'Manrope', sans-serif;
          font-weight:700; background:#a6e3a1;color:#1e1e2e; font-size:14px;cursor:pointer; margin-top: -12px;
        ">Continuar</button>
        <button id="ea-noai" class="ea-btn-animado" style="
          width:100%;padding:11px;border:none;border-radius:10px; font-weight:600;
          background:#313244;color:#cdd6f4; font-size:14px;cursor:pointer;
        ">Não quero usar IA</button>
      `);

      const inputChave = document.getElementById('ea-inp');
      const err = document.getElementById('ea-err');
      const botaoOlho = document.getElementById('ea-toggle-eye');
      const storage = this.runtime.services.storage;

      if (inputChave) inputChave.addEventListener('input', () => err?.classList.remove('show'));

      if (botaoOlho) {
        botaoOlho.onclick = () => {
          if (inputChave.type === 'password') {
            inputChave.type = 'text';
            botaoOlho.innerHTML = i.svgOlhoAberto;
            botaoOlho.style.color = '#cba6f7';
          } else {
            inputChave.type = 'password';
            botaoOlho.innerHTML = i.svgOlhoFechado;
            botaoOlho.style.color = '#6c7086';
          }
        };
      }

      const okBtn = document.getElementById('ea-ok');
      if (okBtn) {
        okBtn.onclick = () => {
          const key = inputChave.value.trim();
          if (!key) {
            if (err) {
              err.textContent = 'Insira uma API Key.';
              err.classList.add('show');
            }
            return;
          }
          storage.setApiKey(key);
          storage.setNoAI(false);
          this.renderMainScreen();
        };
      }

      const noAiBtn = document.getElementById('ea-noai');
      if (noAiBtn) {
        noAiBtn.onclick = () => {
          storage.setNoAI(true);
          this.renderMainScreen();
        };
      }
    },

    renderMainScreen() {
      const i = this.icons;
      const storage = this.runtime.services.storage;

      const domTitle = document.querySelector('span.book-title')?.title?.trim() ||
                       document.querySelector('span.book-title')?.textContent?.trim();
      if (domTitle) {
        storage.setBookTitle(domTitle);
      }

      const bookTitle = storage.getBookTitle() || domTitle || 'Modo leitura';
      const apiKey = storage.getApiKey();
      const defaultStatus = this.getDefaultStatus();

      const readerModule = typeof this.runtime?.getModule === 'function'
        ? this.runtime.getModule('reader')
        : this.runtime?.modules?.get('reader');

      const isRunning = Boolean(readerModule && readerModule.active);

      const buttonText = isRunning
        ? '⏹ Parar'
        : (apiKey ? '▶ Iniciar' : '▶ Iniciar Auto-Página');

      const buttonBg = isRunning ? '#f38ba8' : '#89b4fa';
      const statusText = isRunning ? 'Navegando...' : defaultStatus.text;
      const statusColor = isRunning ? '#89b4fa' : defaultStatus.color;

      this.renderContent(`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <b style="color:#cba6f7;font-family: 'Plus Jakarta Sans', sans-serif;font-size:15px;letter-spacing: 0.3px;font-weight:600;display:flex;align-items:center;gap:8px;">${i.svgLivro} ${bookTitle}</b>
          <button id="ea-config-btn" class="ea-btn-icone ea-config-btn" title="Configurações" style="background:#313244;border:none;border-radius:8px;color:#cdd6f4;cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;">${i.svgConfig}</button>
        </div>
        <div id="ea-status" style="font-size:14px;color:${statusColor};font-family:'Nunito Sans', sans-serif;font-weight:500;letter-spacing:0.2px;">${statusText}</div>

        <button id="ea-auto-btn" class="ea-btn-animado" style="
          width:100%;padding:9px 11px;border:none; font-family: 'Manrope', sans-serif;
          font-weight:700; border-radius:10px;background:${buttonBg};
          font-size:14px;cursor:pointer;color:#1e1e2e; margin-top:2px; margin-bottom:0px;
        ">${buttonText}</button>

        <div id="ea-result" style="display:none;max-height:300px;overflow:auto;font-size:12px;white-space:pre-wrap;color:#a6adc8;"></div>

        <button id="ea-reset-btn" class="ea-btn-animado" style="
          width:100%;padding:10px;border:none; font-weight:600; font-family: 'Inter', sans-serif;
          border-radius:10px;background:#45475a; font-size:13px;cursor:pointer;color:#cdd6f4; margin-top:-2px;
        ">⚙ Reconfigurar</button>
      `);

      const autoBtn = document.getElementById('ea-auto-btn');
      const configBtn = document.getElementById('ea-config-btn');
      const resetBtn = document.getElementById('ea-reset-btn');

      if (autoBtn) {
        autoBtn.onclick = () => {
          const currentReader = typeof this.runtime?.getModule === 'function'
            ? this.runtime.getModule('reader')
            : this.runtime?.modules?.get('reader');

          const activeNow = Boolean(currentReader && currentReader.active);

          if (activeNow) {
            this.runtime.events.sendCommand('command:reader:stop');
          } else {
            this.runtime.events.sendCommand('command:reader:start');
          }
        };
      }

      if (configBtn) {
        configBtn.onclick = () => {
          this.renderConfigScreen();
        };
      }

      if (resetBtn) {
        resetBtn.onclick = () => {
          storage.resetAll();
          this.runtime.events.sendCommand('command:reader:stop');
          this.renderSetupScreen();
        };
      }
    },

    renderConfigScreen() {
      const i = this.icons;
      const storage = this.runtime.services.storage;
      const modeloSalvo = storage.getSelectedModel() || 'cohere/north-mini-code:free';
      const minSalvo = storage.getAutoMinMin();
      const maxSalvo = storage.getAutoMaxMin();

      const options = [
        { value: 'cohere/north-mini-code:free', label: 'Cohere: North Mini Code (free)' },
        { value: 'openai/gpt-oss-120b:free', label: 'OpenAI: gpt-oss-120b (free)' },
        { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Meta: Llama 3.3 70B Instruct (free)' },
        { value: '__custom__', label: 'Outro (digitar manualmente)' }
      ];

      const isCustom = !options.some(opt => opt.value === modeloSalvo);
      let selectedValue = isCustom ? '__custom__' : modeloSalvo;
      let selectedLabel = isCustom ? 'Outro (digitar manualmente)' : (options.find(opt => opt.value === modeloSalvo)?.label || options[0].label);

      this.renderContent(`
        <div style="display:flex;flex-direction:column;align-items:center;">
          <b style="color:#cba6f7;font-family:'Manrope', sans-serif;font-weight:700;letter-spacing:0.2px;font-size:16px;display:flex;align-items:center;gap:8px;">${i.svgConfig} Configurações</b>
          
          <p style="font-family: 'Inter', sans-serif;font-weight: 600;letter-spacing:0.2px;transform:translateY(9px);margin:14px 0 6px;font-size:15px;color:#a6adc8;width:100%;text-align:left;">Modelo de IA:</p>
          
          <!-- Dropdown Customizado UNIFICADO -->
          <div id="ea-select-container" class="ea-select-container">
            <div id="ea-select-trigger" class="ea-select-trigger">
              <span id="ea-select-label">${selectedLabel}</span>
              <span class="ea-select-arrow">▲</span>
            </div>
            <div id="ea-select-dropdown" class="ea-select-dropdown">
              ${options.map(opt => `
                <div class="ea-select-option ${opt.value === selectedValue ? 'selected' : ''}" data-value="${opt.value}">
                  ${opt.label}
                </div>
              `).join('')}
            </div>
          </div>

          <input id="ea-custom-model-input" type="text" placeholder="provider/nome-do-modelo:free" value="${isCustom ? modeloSalvo : ''}" style="width:100%;box-sizing:border-box;padding:9px 10px;border:2px solid #45475a;border-radius:8px;background:#11111b;color:#89b4fa;font-family:Inter,sans-serif;font-size:12px;margin-bottom:6px;display:${isCustom ? 'block' : 'none'};text-align:left;transform:translateY(-2px);">

          <div style="font-size:11px;color:#6c7086;margin-bottom:4px;width:100%;text-align:left;">
            Mais modelos em: <a href="https://openrouter.ai/models" target="_blank" style="color:#89b4fa;text-decoration:none;">openrouter.ai/models</a>
          </div>

          <div style="width:100%;border-top:1px solid #313244;margin:14px 0;"></div>

          <p style="margin:0 0 8px;font-size:15px;color:#a6adc8;width:100%;text-align:left;font-family: 'Inter', sans-serif;font-weight: 600;letter-spacing:0.3px;transform:translateY(9px);">Intervalo de auto-página (minutos):</p>
          <div style="display:flex;align-items:center;gap:10px;width:100%;margin-bottom:4px;">
            <input id="ea-min-input" type="text" inputmode="decimal" value="${minSalvo}" style="flex:1 1 0;min-width:0;height:48px;padding:0 12px;border:2px solid #45475a;border-radius:8px;background:#11111b;color:#cdd6f4;font-family:Inter,sans-serif;font-size:15px;font-weight:500;line-height:48px;text-align:center;box-sizing:border-box;outline:none;">
            <span style="color:#a6adc8;font-weight:600;font-family:'Manrope',sans-serif;flex-shrink:0;">a</span>
            <input id="ea-max-input" type="text" inputmode="decimal" value="${maxSalvo}" style="flex:1 1 0;min-width:0;height:48px;padding:0 12px;border:2px solid #45475a;border-radius:8px;background:#11111b;color:#cdd6f4;font-family:Inter,sans-serif;font-size:15px;font-weight:500;line-height:48px;text-align:center;box-sizing:border-box;outline:none;">
          </div>
          <div id="ea-interval-err" style="color:#f38ba8;font-size:12px;min-height:0;margin-bottom:2px;width:100%;transform:translateY(-7px);opacity:0.90;"></div>

          <button id="ea-model-save" class="ea-btn-animado" style="width:100%;padding:11px;border:none;border-radius:10px;background:#a6e3a1;color:#1e1e2e;font-weight:700;font-size:14px;cursor:pointer;margin-top:6px;margin-bottom:12px;">💾 Salvar</button>
          <button id="ea-model-back" class="ea-btn-animado" style="width:100%;padding:10px;border:none;border-radius:10px;background:#45475a;color:#cdd6f4;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">${i.svgVoltar} Voltar</button>
        </div>
      `);

      const container = document.getElementById('ea-select-container');
      const trigger = document.getElementById('ea-select-trigger');
      const label = document.getElementById('ea-select-label');
      const customInput = document.getElementById('ea-custom-model-input');
      const saveBtn = document.getElementById('ea-model-save');
      const backBtn = document.getElementById('ea-model-back');

      // Lógica do Dropdown Animado
      if (trigger && container) {
        trigger.onclick = (e) => {
          e.stopPropagation();
          container.classList.toggle('open');
        };

        document.addEventListener('click', (e) => {
          if (container && !container.contains(e.target)) {
            container.classList.remove('open');
          }
        });

        const optionEls = container.querySelectorAll('.ea-select-option');
        optionEls.forEach(opt => {
          opt.onclick = (e) => {
            e.stopPropagation();
            const val = opt.getAttribute('data-value');
            selectedValue = val;

            optionEls.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');

            label.textContent = opt.textContent.trim();
            container.classList.remove('open');

            if (val === '__custom__') {
              if (customInput) customInput.style.display = 'block';
            } else {
              if (customInput) customInput.style.display = 'none';
            }
          };
        });
      }

      if (saveBtn) {
        saveBtn.onclick = () => {
          let modeloFinal = selectedValue;
          if (modeloFinal === '__custom__') {
            modeloFinal = customInput?.value.trim();
            if (!modeloFinal) {
              const errEl = document.getElementById('ea-interval-err');
              if (errEl) errEl.textContent = 'Digite o nome do modelo customizado.';
              return;
            }
          }

          const minVal = parseFloat(document.getElementById('ea-min-input')?.value.replace(',', '.') || '0');
          const maxVal = parseFloat(document.getElementById('ea-max-input')?.value.replace(',', '.') || '0');

          if (isNaN(minVal) || isNaN(maxVal) || minVal < 0.5 || maxVal > 60 || minVal >= maxVal) {
            const errEl = document.getElementById('ea-interval-err');
            if (errEl) errEl.textContent = 'Insira intervalos válidos (mín 0.5, máx 60).';
            return;
          }

          storage.setSelectedModel(modeloFinal);
          storage.setAutoMinMin(minVal);
          storage.setAutoMaxMin(maxVal);

          this.renderMainScreen();
        };
      }

      if (backBtn) backBtn.onclick = () => this.renderMainScreen();
    }
  };

  // Registrar módulo no Runtime se disponível
  if (window.ElefanteRuntime) {
    window.ElefanteRuntime.registerModule(UIModule);
  } else {
    window.ElefanteUIModule = UIModule;
  }

})();
