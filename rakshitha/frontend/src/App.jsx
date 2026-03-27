import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import UploadPage from "./components/Upload";
import FlashSummary from "./components/FlashSummary";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/start" element={<UploadPage />} />
        <Route path="/flash-summary" element={<FlashSummary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;