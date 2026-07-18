
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { ErrorFallback } from "./app/components/ErrorFallback.tsx";
  import "./styles/index.css";

  const root = document.getElementById("root");
  if (!root) throw new Error("Root element #root not found in HTML");

  createRoot(root).render(
    <ErrorFallback>
      <App />
    </ErrorFallback>
  );
  