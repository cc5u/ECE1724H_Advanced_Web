import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router";
import { Training } from './pages/Training.tsx';
import { Archives } from './pages/Archives.tsx';
import { Prediction } from './pages/Prediction.tsx';
import { PageLayout } from './layouts/PageLayout.tsx';
import { AuthProvider } from './auth/AuthContext.tsx';
import './index.css';
import WelcomePage from './pages/Welcome.tsx';
import ProtectedRoute from './auth/ProtectedRoute.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage />,
  },{
    path: "/",
    element: (
      <ProtectedRoute>
        <PageLayout />
      </ProtectedRoute>
      ),
    children: [
      { path: "training", element: <Training /> },
      { path: "prediction", element: <Prediction /> },
      { path: "archive", element: <Archives /> },]}])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
