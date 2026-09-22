import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {IconContext} from '@phosphor-icons/react';
import App from './App.tsx';
import './index.css';

// Ícones Phosphor no peso duotone em toda a interface; 18px é o tamanho padrão do design.
const ICONES = {color: 'currentColor', size: 18, weight: 'duotone', mirrored: false} as const;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={ICONES}>
      <App />
    </IconContext.Provider>
  </StrictMode>,
);
