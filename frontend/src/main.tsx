import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ShareView } from "./components/ShareView";
import "./styles/index.css";

const isSharePage = window.location.pathname === "/share";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isSharePage ? <ShareView /> : <App />}
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((err) => {
    console.warn("Service worker registration failed:", err);
  });
}
