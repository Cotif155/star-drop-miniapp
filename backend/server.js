import { createServer } from "node:http";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import {
  createReferralGetHandler,
  createReferralWithdrawHandler,
  verifyTelegramInitData
} from "./referrals.js";
import { createDailyStarsHandlers } from "./daily-stars.js";
import { createTonTestHandlers } from "./ton-test.js";
try {
  process.loadEnvFile(".env");
} catch {}
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = String(process.env.ADMIN_ID || "");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const XROCKET_API_TOKEN = process.env.XROCKET_API_TOKEN;
const XROCKET_WEBHOOK_SECRET = process.env.XROCKET_WEBHOOK_SECRET;
const XROCKET_API_BASE = "https://" + "pay.api." + "xrocket.exchange";
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
    "https:" + "/" + "/" + "api.telegram.org/bot" + BOT_TOKEN + "/" + method,
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
  const refMatch = text.match(/^\/start(?:@\w+)?\s+ref_(\d+)$/);
if (refMatch) {
  const existing = await database(
    "referral_accounts?select=telegram_id&telegram_id=eq." +
    encodeURIComponent(user.id) +
    "&limit=1"
  );
  const isNew = Array.isArray(existing) && existing.length === 0;
  await database("rpc/register_referral_user", "POST", {
    p_telegram_id: user.id,
    p_username: user.username || null,
    p_first_name: user.first_name || null,
    p_referrer_id: refMatch[1],
    p_eligible_new: isNew
  });
}
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
    if (body.length > 20000) {
      res.writeHead(413);
      res.end(JSON.stringify({ error: "Request too large" }));
      return;
    }
  }

  try {
    const order = JSON.parse(body);

    if (!XROCKET_API_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Payment server is not configured");
    }

    const user = verifyTelegramInitData(
      String(order.initData || ""),
      BOT_TOKEN
    );

    if (!user || !user.id) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Telegram verification failed" }));
      return;
    }

    const userId = String(user.id);
    const username = user.username || "Не вказаний";

    let orderType;
    let stars = null;
    let months = null;
    let amount;
    let description;

    if (order.type === "premium") {
      const premiumPrices = { 3: 15, 6: 20, 12: 34 };
      months = Number(order.months);

      if (!premiumPrices[months]) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid Premium order" }));
        return;
      }

      orderType = "premium";
      amount = premiumPrices[months];
      description = "STARS DROP — Telegram Premium " + months + " months";
    } else {
      stars = Number(order.stars);

      if (!packages.includes(stars)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid Stars package" }));
        return;
      }

      orderType = "stars";
      amount = prices[stars];
      description = "STARS DROP — " + stars + " Telegram Stars";
    }

    const clientInvoiceId = "starsdrop_" + randomUUID();

    const invoiceResponse = await fetch(
      XROCKET_API_BASE + "/api/v1/invoices",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + XROCKET_API_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceAmount: amount.toFixed(2),
          priceCurrency: "USDT",
          payCurrencies: ["USDT"],
          clientInvoiceId,
          description,
          expiresIn: 1800000,
          callback: {
            callbackUrl: "https://stars-drop-backend.onrender.com/xrocket-webhook",
            payload: { clientInvoiceId }
          },
          data: {
            orderType,
            telegramUserId: userId,
            username,
            stars,
            months
          }
        })
      }
    );

    const invoiceText = await invoiceResponse.text();
    let invoice;

    try {
      invoice = JSON.parse(invoiceText);
    } catch {
      throw new Error("Invalid xRocket invoice response");
    }

    if (!invoiceResponse.ok || !invoice.id) {
      throw new Error("xRocket invoice error: " + invoiceText);
    }

    const addressResponse = await fetch(
      XROCKET_API_BASE +
        "/api/v1/invoices/payments/address?invoiceId=" +
        encodeURIComponent(invoice.id),
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + XROCKET_API_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ payNetwork: "TRX" })
      }
    );

    const addressText = await addressResponse.text();
    let paymentAddress;

    try {
      paymentAddress = JSON.parse(addressText);
    } catch {
      throw new Error("Invalid xRocket payment address response");
    }

    if (
      !addressResponse.ok ||
      !paymentAddress.address ||
      paymentAddress.payCurrency !== "USDT" ||
      paymentAddress.payNetwork !== "TRX"
    ) {
      throw new Error("xRocket address error: " + addressText);
    }

    const paymentUrl =
      invoice.links?.telegramBotLink ||
      invoice.links?.telegramMiniAppLink ||
      invoice.links?.webLink;

    if (!paymentUrl) {
      throw new Error("xRocket did not return a payment link");
    }

    await database("xrocket_orders", "POST", {
      client_invoice_id: clientInvoiceId,
      xrocket_invoice_id: String(invoice.id),
      telegram_user_id: userId,
      username,
      order_type: orderType,
      stars,
      premium_months: months,
      amount,
      currency: "USDT",
      status: "pending",
      payment_url: paymentUrl,
      payment_address: paymentAddress.address
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      paymentUrl,
      paymentAddress: paymentAddress.address,
      payCurrency: "USDT",
      payNetwork: "TRX",
      expiresAt: paymentAddress.expiresAt
    }));

  } catch (error) {
    console.error("Order error:", error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Could not create payment invoice" }));
  }
}

const handleReferral = createReferralGetHandler({
  database,
  telegram,
  botToken: BOT_TOKEN
});

const handleReferralWithdraw = createReferralWithdrawHandler({
  database,
  telegram,
  botToken: BOT_TOKEN,
  adminId: ADMIN_ID
});
const dailyStars = createDailyStarsHandlers({
  database,
  telegram,
  botToken: BOT_TOKEN,
  adminId: ADMIN_ID
});

const tonTest = createTonTestHandlers({
  database,
  telegram,
  botToken: BOT_TOKEN,
  adminId: ADMIN_ID,
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY
});


async function handleXrocketWebhook(req, res) {
  try {
    const signature = req.headers["signature"];
    const version = req.headers["signature-version"];
    const timestamp = req.headers["signature-timestamp"];

    if (
      !XROCKET_WEBHOOK_SECRET ||
      !signature ||
      version !== "v1" ||
      !timestamp ||
      !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() - Number(timestamp)) > 300000
    ) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Invalid webhook signature headers" }));
      return;
    }

    const chunks = [];
    let size = 0;

    for await (const chunk of req) {
      size += chunk.length;

      if (size > 100000) {
        res.writeHead(413);
        res.end(JSON.stringify({ error: "Webhook too large" }));
        return;
      }

      chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks);
    const expected = createHmac("sha256", XROCKET_WEBHOOK_SECRET)
      .update(timestamp + "." + rawBody.toString("utf8"))
      .digest("hex");

    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Invalid signature" }));
      return;
    }

    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Invalid signature" }));
      return;
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (!event.id || !event.data) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid webhook event" }));
      return;
    }

    const eventType = event.data.event || "";
    const invoice = event.data.invoice || {};
    const payment = event.data.payment || {};

    const rpcResponse = await fetch(
      SUPABASE_URL + "/rest/v1/rpc/process_xrocket_payment",
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          p_event_id: String(event.id),
          p_invoice_id: invoice.id ? String(invoice.id) : null,
          p_client_invoice_id: invoice.clientInvoiceId || null,
          p_event_type: eventType,
          p_payload: event
        })
      }
    );

    const rpcText = await rpcResponse.text();

    if (!rpcResponse.ok) {
      throw new Error("Supabase payment processing failed: " + rpcText);
    }

    const orders = rpcText ? JSON.parse(rpcText) : [];
    const order = Array.isArray(orders) ? orders[0] : null;

    if (order) {
      const escapeHtml = (value) =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const product = order.order_type === "premium"
        ? "Telegram Premium — " + order.premium_months + " місяців"
        : order.stars + " Telegram Stars";

      const paidAmount = payment.payAmount || order.amount;
      const paidCurrency = payment.payCurrency || order.currency;

      const message =
        "✅ <b>Оплата підтверджена!</b>\n\n" +
        "📦 <b>Товар:</b> " + escapeHtml(product) + "\n" +
        "💰 <b>Сума:</b> " + escapeHtml(paidAmount) + " " +
        escapeHtml(paidCurrency) + "\n" +
        "👤 <b>Покупець:</b> @" + escapeHtml(order.username || "Не вказаний") + "\n" +
        "🆔 <b>Telegram ID:</b> <code>" + escapeHtml(order.telegram_user_id) + "</code>\n" +
        "🧾 <b>Замовлення:</b> <code>" + escapeHtml(order.client_invoice_id) + "</code>\n\n" +
        "Статус: очікує ручної видачі товару.";

      const telegramResult = await telegram("sendMessage", {
        chat_id: ADMIN_ID,
        text: message,
        parse_mode: "HTML"
      });

      if (!telegramResult || !telegramResult.ok) {
        throw new Error("Admin Telegram notification failed");
      }

      const filter = order.xrocket_invoice_id
        ? "xrocket_invoice_id=eq." + encodeURIComponent(order.xrocket_invoice_id)
        : "client_invoice_id=eq." + encodeURIComponent(order.client_invoice_id);

      await database(
        "xrocket_orders?" + filter + "&admin_notified_at=is.null",
        "PATCH",
        { admin_notified_at: new Date().toISOString() }
      );
    }

    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));

  } catch (error) {
    console.error("xRocket webhook error:", error.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Webhook processing failed" }));
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

  if (req.method === "POST" && req.url === "/xrocket-webhook") {
    await handleXrocketWebhook(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/order") {

    await handleOrder(req, res);

    return;

  }

  if (req.method === "POST" && req.url === "/api/ton-test/create") {
    await tonTest.create(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/ton-test/verify") {
    await tonTest.verify(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/referral") {
    await handleReferral(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/referral/withdraw") {
    await handleReferralWithdraw(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/daily-stars") {
    await dailyStars.status(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/daily-stars/claim") {
    await dailyStars.claim(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/daily-stars/withdraw") {
    await dailyStars.withdraw(req, res);
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

  if (req.method === "GET" && req.url.startsWith("/ref/")) {
    const referrerId = req.url.split("/")[2];

    if (!/^\d+$/.test(referrerId || "")) {
      res.writeHead(400);
      res.end("Invalid referral link");
      return;
    }

    try {
      const bot = await telegram("getMe", {});
      if (!bot.ok || !bot.result?.username) {
        throw new Error("Could not get bot username");
      }

      const deepLink = "https://t.me/" + bot.result.username +
        "?start=ref_" + referrerId;
      const imageUrl =
        "https://stars-drop-shop.vercel.app/stars-drop-referral-preview.jpg";

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      });

      res.end(`<!doctype html>
<html><head>
<meta charset="utf-8">
<meta property="og:type" content="website">
<meta property="og:title" content="⭐ STARS DROP">
<meta property="og:description" content="Отримуй Telegram Stars швидко та вигідно! 🎁 Запрошуй друзів і отримуй 5 ⭐ за кожного.">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">

<title>STARS DROP</title>
</head><body>
<a href="${deepLink}">Відкрити STARS DROP</a>
<script>window.location.replace(${JSON.stringify(deepLink)});</script>
</body></html>`);
    } catch (error) {
      console.error("Referral preview error:", error);
      res.writeHead(500);
      res.end("Could not open referral link");
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
