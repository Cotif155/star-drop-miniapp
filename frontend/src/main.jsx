import React, { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import "./index.css"
import App from "./App.jsx"

const app = React.createElement(
  StrictMode,
  null,
  React.createElement(
    TonConnectUIProvider,
    { manifestUrl: "https://" + "stars-drop-shop.vercel.app" + "/tonconnect-manifest.json" },
    React.createElement(App)
  )
)

createRoot(document.getElementById("root")).render(app)
