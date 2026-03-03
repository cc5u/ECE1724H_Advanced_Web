import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router";
import { Training } from './pages/Training.tsx';
import { Archives } from './pages/Archives.tsx';
import { Prediction } from './pages/Prediction.tsx';
import { PageLayout } from './layouts/PageLayout.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <PageLayout />,
    children: [
  { index: true, Component: Training },
      { path: "prediction", Component: Prediction },
      { path: "archive", Component: Archives },]}])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
