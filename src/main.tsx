import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Экспорт экранов в Figma (только в режиме разработки)
if (import.meta.env.DEV) import('./dev/figmaExport');
