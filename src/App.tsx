import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Home from "./pages/Home";
import PWA from "./pages/PWA";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/~" element={<PWA />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
