import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import UploadPage from "./components/Upload";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/start" element={<UploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
