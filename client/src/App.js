import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Builder from './pages/Builder';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Builder />} />
        <Route path="*" element={<Builder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
