/**
 * Elefante Letrado Script - UI Styles & Animations v1.0.3
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
          transition: background-color .2s ease, color .2s ease, filter .2s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .ea-btn-icone:hover {
          background-color: transparent !important;
          color: #cba6f7 !important;
          filter: drop-shadow(0 0 5px rgba(203,166,247,.35));
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

        /* Base do Painel e Cabeçalho (Transição ultra aveludada de 0.45s) */
        #ea-panel {
          position: fixed; top: 20px; right: 20px; z-index: 999999;
          background: #1e1e2e; color: #cdd6f4; font-family: monospace;
          border: 1px solid #313244; border-radius: 16px; padding: 20px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6); width: 380px;
          max-width: calc(100vw - 40px); display: flex; flex-direction: column;
          transition: background 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      padding 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      border-radius 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        #ea-drag-header {
          cursor: move; user-select: none; background: #11111b;
          margin: -20px -20px 0 -20px; padding: 16px 20px 24px 20px;
          border-radius: 16px 16px 0 0; display: flex; justify-content: space-between;
          align-items: center; position: relative; z-index: 1;
          transition: background 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      padding 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      margin 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      border-radius 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Estrutura do painel e animação de minimização (Com efeito de dissolução e opacidade) */
        .ea-panel-content {
          overflow: hidden;
          transition: max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
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
          transform: translateY(-8px) scale(0.97) !important;
          pointer-events: none !important;
        }

        .ea-maximizing {
          max-height: 600px;
          opacity: 1;
          filter: blur(0px);
          transform: translateY(0) scale(1);
        }

        /* Ajustes finos para o painel em estado minimizado / compacto (Transição sem trancos) */
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
        }
      `;
      document.head.appendChild(estiloAnimacoes);
    }
  };

})();
