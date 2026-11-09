import { createServer } from "node:http";
try {
  process.loadEnvFile(".env");
} catch {}
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const allowedPackages = [
  100, 150, 250, 350, 500, 750, 1000,
  1500, 2500, 5000, 10000, 25000, 35000
];
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: "ok" }));
  }
  if (req.method !== "POST" || req.url !== "/api/order") {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "Not found" }));
  }
  if (!BOT_TOKEN || !ADMIN_ID) {
    res.writeHead(500);
    return res.end(JSON.stringify({ error: "Bot settings are missing" }));
  }
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 10000) {
        throw new Error("Request too large");
      }
    }
    const order = JSON.parse(body);
    const stars = Number(order.stars);
    if (!allowedPackages.includes(stars)) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "Invalid package" }));
    }
    const username = String(order.username || "Не вказаний")
      .replace(/^@/, "")
      .slice(0, 100);
    const userId = String(order.userId || "Не отриманий").slice(0, 30);
    const prices = {
      100: 1.95, 150: 2.93, 250: 4.88, 350: 6.83,
      500: 9.75, 750: 14.63, 1000: 19.50,
      1500: 29.25, 2500: 48.75, 5000: 97.50,
      10000: 195.00, 25000: 487.50, 35000: 682.50
    };

    const price = prices[stars];
    const method = "USDT (TON)";
    const message = [
      "⭐ STARS DROP — НОВЕ ЗАМОВЛЕННЯ",
      "",
      "👤 Username: @" + username,
      "🆔 Telegram ID: " + userId,
      "⭐ Пакет: " + stars + " Stars",
      "💰 Сума: " + price.toFixed(2) + " USDT",
      "💳 Спосіб оплати: " + method,
      "",
      "🕒 Статус: Очікує перевірки оплати"
    ].join("\n");
    const telegramResponse = await fetch(
      "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: message
        })
      }
    );
    const result = await telegramResponse.json();
    if (!result.ok) {
      console.error("Telegram error:", result);
      res.writeHead(502);
      return res.end(JSON.stringify({
        error: "Telegram message failed"
      }));
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Order error:", error);
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Invalid request" }));
  }
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`STARS DROP backend працює на порті ${PORT}`);
});
