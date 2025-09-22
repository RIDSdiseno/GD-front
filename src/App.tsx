// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginRids from "./host/login";
import Dashboard from "./host/Dashboard";
import Layout from "./host/Layout";


export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginRids />} />

      {/* Con layout */}
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />

        
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
