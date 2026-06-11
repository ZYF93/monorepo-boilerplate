import "./models";
import "@bc/config/theme.css";

import microApp from "@micro-zoe/micro-app";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routes } from "virtual:bc-router";

console.log(import.meta.env, routes);

microApp.start();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={createBrowserRouter(routes)} />
  </StrictMode>,
);
