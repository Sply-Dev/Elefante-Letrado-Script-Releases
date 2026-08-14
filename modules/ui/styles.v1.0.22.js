/**
 * Elefante Letrado Script - UI Styles & Animations v1.0.22
 */

(function () {
  'use strict';

  window.ElefanteUIStyles = {
    inject() {
      if (document.getElementById('ea-ui-styles')) return;

      const fontes = document.createElement('link');
      fontes.rel = 'stylesheet';
      fontes.href = `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap`;
      document.head.appendChild(fontes);

      const estiloAnimacoes = document.createElement('style');
      estiloAnimacoes.id = 'ea-ui-styles';
      estiloAnimacoes.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap');
        
        .ea-eye-btn {
          transition: color .2s ease, filter .2s ease !important;
        }

        .ea-eye-btn:hover {
          color: #cba6f7 !important;
          filter: drop-shadow(0 0 5px rgba(203,166,247,.35));
        }

        .ea-eye-btn svg {
          transition: transform .25s cubic-bezier(.22,1,.36,1), opacity .18s ease;
        }

        .ea-eye-btn:hover svg {
          transform: scale(1.12);
        }

        .ea-eye-btn:active svg {
          transform: scale(.92);
        }

        .ea-eye-btn.trocando svg {
          transform: scale(0.45) rotate(-25deg);
          opacity: 0;
        }

        .ea-eye-btn.voltando svg {
          animation: eaEyeReturn .35s cubic-bezier(.22,1,.36,1);
        }

        @keyframes eaEyeReturn {
          0% { transform: scale(.45) rotate(25deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(-5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .ea-btn-animado {
          transition: background-color 0.2s ease, transform 0.1s ease, filter 0.2s ease !important;
        }

        .ea-btn-animado:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .ea-btn-animado:active {
          transform: translateY(1px) scale(0.98);
        }

        .ea-btn-icone {
          transition: background-color .2s ease, color .2s ease, filter .2s ease !important;
        }

        .ea-btn-icone:hover {
          background-color: transparent !important;
          color: #cba6f7 !important;
          filter: drop-shadow(0 0 5px rgba(203,166,247,.35));
        }

        /* Animação exclusiva para o símbolo interno do botão de minimizar (sem girar a caixa) */
        #ea-min-icon {
          display: inline-block;
          transform-origin: center center;
          will-change: transform;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .ea-config-btn svg {
          transform: translateY(-1px);
          transition: transform .3s cubic-bezier(.22,1,.36,1) !important;
        }

        .ea-config-btn:hover svg {
          transform: translateY(-1px) rotate(60deg) !important;
        }

        .ea-config-btn:active svg {
          transform: translateY(-1px) rotate(90deg) scale(.94) !important;
        }

        @keyframes eaFadeKeyframe {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes eaFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes eaTitleGlow {
          0%,100% { text-shadow: 0 0 4px rgba(183,148,246,0.30), 0 0 10px rgba(183,148,246,0.16); }
          50% { text-shadow: 0 0 5px rgba(183,148,246,0.40), 0 0 14px rgba(183,148,246,0.22); }
        }

        .ea-error-box {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(-6px);
          transition: max-height 0.22s cubic-bezier(.22,1,.36,1), opacity 0.18s ease, transform 0.22s cubic-bezier(.22,1,.36,1), margin 0.22s ease;
          margin-top: 0;
        }

        .ea-error-box.show {
          max-height: 30px;
          opacity: 1;
          transform: translateY(-11px);
          margin-top: 4px;
        }

        /* Animação suave de troca de tela (aplicada ao contêiner interno) */
        .ea-fade-in {
          animation: eaFadeKeyframe 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        /* Dropdown customizado animado */
        .ea-select-container {
          position: relative;
          width: 100%;
          margin-top: 14px;
          margin-bottom: 8px;
          user-select: none;
          z-index: 20;
        }

        .ea-select-container.open {
          z-index: 999 !important;
        }

        .ea-select-trigger {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 14px;
          border: 1px solid #313244;
          border-radius: 10px;
          background: #11111b;
          color: #cdd6f4;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: none !important;
          transition: border-color 0.25s ease, background 0.25s ease;
        }

        .ea-select-trigger:hover {
          border-color: #45475a;
        }

        .ea-select-arrow {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #89b4fa;
          font-size: 11px;
        }

        .ea-select-container.open .ea-select-arrow {
          transform: rotate(180deg);
        }

        .ea-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: #11111b;
          border: 1px solid #313244;
          border-radius: 10px;
          box-shadow: none !important;
          z-index: 1000;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(-8px) scale(0.97);
          transform-origin: top center;
          pointer-events: none;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ea-select-container.open .ea-select-dropdown {
          max-height: 220px;
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .ea-select-option {
          padding: 10px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #cdd6f4;
          cursor: pointer;
          background: transparent;
          transition: background 0.2s ease, color 0.2s ease, padding-left 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Hover para opções NÃO selecionadas */
        .ea-select-option:not(.selected):hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #cba6f7;
          padding-left: 18px;
        }

        /* Opção selecionada */
        .ea-select-option.selected {
          background: transparent;
          color: #cba6f7;
          font-weight: 600;
        }

        /* Hover na opção selecionada */
        .ea-select-option.selected:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #cba6f7;
          padding-left: 14px !important;
        }

        /* Base do Painel com transição suave em padding e background para morphing 100% fluido */
        #ea-panel {
          position: fixed; top: 20px; right: 20px; z-index: 999999;
          background: #1e1e2e; color: #cdd6f4; font-family: monospace;
          border: 1px solid #313244; border-radius: 16px; padding: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35); width: 380px;
          max-width: calc(100vw - 40px); display: flex; flex-direction: column;
          transform: translateY(0);
          will-change: left, top, padding, background, border-radius, box-shadow, transform;
          transition: padding 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      border-radius 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        /* Modo Arraste: Sombra MAIOR e expansiva ao segurar + micro elevação de 2px para cima */
        #ea-panel.ea-dragging {
          transform: translateY(-2px) !important;
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.42) !important;
          transition: box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          cursor: grabbing !important;
        }

        #ea-panel.ea-dragging #ea-drag-header {
          cursor: grabbing !important;
        }

        /* Header com transição suave de margens e padding para não dar salto instantâneo */
        #ea-drag-header {
          cursor: move; user-select: none; background: #11111b;
          margin: -20px -20px 0 -20px; padding: 16px 20px 24px 20px;
          border-radius: 16px 16px 0 0; display: flex; justify-content: space-between;
          align-items: center; position: relative; z-index: 1;
          will-change: margin, padding, background, border-radius;
          transition: margin 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      padding 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      border-radius 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Título com aceleração GPU */
        #ea-drag-header strong {
          display: inline-block;
          transform-origin: left center;
          will-change: transform;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      letter-spacing 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Estrutura do painel com transição suave de margem/padding para zerar o pulo horizontal */
        .ea-panel-content {
          overflow: visible;
          will-change: max-height, margin, padding, opacity, transform;
          transition: max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      margin 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      padding 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      filter 0.38s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column; gap: 10px;
          background: #1e1e2e; margin: -12px -20px -20px -20px;
          padding: 24px 20px 20px 20px; border-radius: 18px 18px 12px 12px;
          position: relative; z-index: 2; box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.3);
          transform-origin: top center;
        }

        .ea-minimizing {
          max-height: 0 !important;
          opacity: 0 !important;
          filter: blur(2px);
          transform: translateY(-8px) !important;
          pointer-events: none !important;
          overflow: hidden !important;
        }

        .ea-maximizing {
          max-height: 600px;
          opacity: 1;
          filter: blur(0px);
          transform: translateY(0);
        }

        /* Ajustes finos para o painel em estado minimizado */
        #ea-panel.ea-panel-collapsed {
          background: #11111b;
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
        }

        #ea-panel.ea-panel-collapsed #ea-drag-header {
          background: transparent;
          margin: 0;
          padding: 14px 20px;
          border-radius: 16px;
        }

        #ea-panel.ea-panel-collapsed .ea-panel-content {
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          max-height: 0 !important;
          opacity: 0 !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(estiloAnimacoes);
    }
  };

})();
