import { createServer } from "node:http";
try {
  process.loadEnvFile(".env");
} catch {}
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = String(process.env.ADMIN_ID || "");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const PORT = process.env.PORT || 3001;
const packages = [
  100, 150, 250, 350, 500, 750, 1000,
  1500, 2500, 5000, 10000, 25000, 35000
];
const prices = {
  100: 1.95,
  150: 2.93,
  250: 4.88,
  350: 6.83,
  500: 9.75,
  750: 14.63,
  1000: 19.50,
  1500: 29.25,
  2500: 48.75,
  5000: 97.50,
  10000: 195.00,
  25000: 487.50,
  35000: 682.50
};
const sessions = new Map();
async function telegram(method, data) {
  const response = await fetch(
    "https://api.telegram.org/bot" + BOT_TOKEN + "/" + method,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );
  return await response.json();
}
async function database(path, method, body) {
  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + path,
    {
      method: method || "GET",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: body ? JSON.stringify(body) : undefined
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Supabase " + response.status + ": " + errorText);
  }
  const result = await response.text();
  return result ? JSON.parse(result) : null;
}
async function saveUser(user, reactivate) {
  const data = {
    telegram_id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    updated_at: new Date().toISOString()
  };
  if (reactivate) {
    data.is_blocked = false;
  }
  await database(
    "broadcast_users?on_conflict=telegram_id",
    "POST",
    data
  );
}
async function getUsers() {
  let users = [];
  let offset = 0;
  while (true) {
    const batch = await database(
      "broadcast_users?select=telegram_id&is_blocked=eq.false&limit=1000&offset=" + offset
    );
    users = users.concat(batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return users;
}
async function markBlocked(userId) {
  await database(
    "broadcast_users?telegram_id=eq." + userId,
    "PATCH",
    { is_blocked: true }
  );
}
async function handleMessage(message) {
  if (message.chat.type !== "private") return;
  const user = message.from;
  const chatId = message.chat.id;
  const text = message.text || "";
  await saveUser(user, text === "/start");
  if (String(user.id) === ADMIN_ID && text === "/broadcast") {
    sessions.set(user.id, { step: "waiting" });
    await telegram("sendMessage", {
      chat_id: chatId,
      text: "📢 Надішли текст або фото для розсилки."
    });
    return;
  }
  if (String(user.id) === ADMIN_ID) {
    const session = sessions.get(user.id);
    if (session && session.step === "waiting") {
      if (text.startsWith("/")) return;
      sessions.set(user.id, {
        step: "confirm",
        message_id: message.message_id,
        chat_id: chatId
      });
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "Надіслати це повідомлення всім?",
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Надіслати", callback_data: "broadcast_yes" },
            { text: "❌ Скасувати", callback_data: "broadcast_no" }
          ]]
        }
      });
      return;
    }
  }
  if (text === "/stop") {
    await database(
      "broadcast_users?telegram_id=eq." + user.id,
      "PATCH",
      { is_blocked: true }
    );
    await telegram("sendMessage", {
      chat_id: chatId,
      text: "Розсилку вимкнено."
    });
    return;
  }
  if (text === "/start") {
    await telegram("sendMessage", {
      chat_id: chatId,
      text: "⭐ Вітаємо у STARS DROP!"
    });
  }
}
async function handleCallback(callback) {
  const userId = String(callback.from.id);
  const chatId = callback.message.chat.id;
  if (userId !== ADMIN_ID) {
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Немає доступу"
    });
    return;
  }
  const session = sessions.get(callback.from.id);
  if (callback.data === "broadcast_no") {
    sessions.delete(callback.from.id);
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Скасовано"
    });
    await telegram("editMessageText", {
      chat_id: chatId,
      message_id: callback.message.message_id,
      text: "❌ Розсилку скасовано."
    });
    return;
  }
  if (callback.data !== "broadcast_yes" || !session) {
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Немає активної розсилки"
    });
    return;
  }
  await telegram("answerCallbackQuery", {
    callback_query_id: callback.id,
    text: "Розпочинаю розсилку"
  });
  await telegram("editMessageText", {
    chat_id: chatId,
    message_id: callback.message.message_id,
    text: "⏳ Розсилка виконується..."
  });
  sessions.delete(callback.from.id);
  let users = [];
  try {
    users = await getUsers();
  } catch (error) {
    await telegram("sendMessage", {
      chat_id: chatId,
      text: "Помилка отримання списку користувачів."
    });
    return;
  }
  let sent = 0;
  let failed = 0;
  for (const user of users) {
    const result = await telegram("copyMessage", {
      chat_id: user.telegram_id,
      from_chat_id: session.chat_id,
      message_id: session.message_id
    });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      if (result.error_code === 403) {
        await markBlocked(user.telegram_id);
      }
    }
    await new Promise(function(resolve) {
      setTimeout(resolve, 50);
    });
  }
  await telegram("sendMessage", {
    chat_id: chatId,
    text:
      "✅ Розсилку завершено!\n\n" +
      "📨 Успішно: " + sent + "\n" +
      "⚠️ Не вдалося: " + failed
  });
}
async function handleOrder(req, res) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  try {
    const order = JSON.parse(body);
    const stars = Number(order.stars);
    if (!packages.includes(stars)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid package" }));
      return;
    }
    const username = String(order.username || "Не вказаний");
    const userId = String(order.userId || "Не отриманий");
    const message =
      "⭐ STARS DROP — НОВЕ ЗАМОВЛЕННЯ\n\n" +
      "👤 Username: @" + username + "\n" +
      "🆔 Telegram ID: " + userId + "\n" +
      "⭐ Пакет: " + stars + " Stars\n" +
      "💰 Сума: " + prices[stars].toFixed(2) + " USDT\n" +
      "💳 Оплата: USDT (TON)\n\n" +

      "🕒 Очікує перевірки оплати";

    const result = await telegram("sendMessage", {

      chat_id: ADMIN_ID,

      text: message

    });

    if (!result.ok) {

      res.writeHead(502);

      res.end(JSON.stringify({ error: "Telegram error" }));

      return;

    }

    res.writeHead(200);

    res.end(JSON.stringify({ success: true }));

  } catch (error) {

    res.writeHead(400);

    res.end(JSON.stringify({ error: "Invalid request" }));

  }

}

const server = createServer(async function(req, res) {

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Bot-Api-Secret-Token");

  if (req.method === "OPTIONS") {

    res.writeHead(204);

    res.end();

    return;

  }

  if (req.method === "GET" && req.url === "/") {

    res.writeHead(200);

    res.end(JSON.stringify({ status: "ok" }));

    return;

  }

  if (req.method === "POST" && req.url === "/api/order") {

    await handleOrder(req, res);

    return;

  }
  if (req.method === "POST" && req.url === "/telegram-webhook") {
    if (
      !WEBHOOK_SECRET ||
      req.headers["x-telegram-bot-api-secret-token"] !== WEBHOOK_SECRET
    ) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const update = JSON.parse(body);
      if (update.message) {
        await handleMessage(update.message);
      }
      if (update.callback_query) {
        await handleCallback(update.callback_query);
      }
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.log("Webhook error:", error.message);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    }
    return;
  }
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});
server.listen(PORT, "0.0.0.0", function() {
  console.log("STARS DROP backend працює на порті " + PORT);
  if (
    BOT_TOKEN &&
    WEBHOOK_SECRET &&
    process.env.RENDER_EXTERNAL_URL
  ) {
    telegram("setWebhook", {
      url: process.env.RENDER_EXTERNAL_URL + "/telegram-webhook",
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"]
    }).then(function(result) {
      console.log("Webhook:", result.ok ? "налаштовано" : "помилка");
    });
  } else {
    console.log("Не вистачає налаштувань для webhook.");
  }
});