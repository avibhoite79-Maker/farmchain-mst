import { Route, Routes } from "react-router-dom";
import Header from "./components/Header.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Batches from "./pages/Batches.jsx";
import Scan from "./pages/Scan.jsx";
import Trace from "./pages/Trace.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/trace" element={<Trace />} />
          <Route path="/trace/:id" element={<Trace />} />
        </Routes>
      </main>
    </div>
  );
}
