import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./view/pages/HomePage";

function App() {
  return (
    <BrowserRouter basename="/lk_time_series">
      <Routes>
        <Route path="/:datasetKey?" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
