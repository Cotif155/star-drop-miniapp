import { randomBytes } from "node:crypto";
import { Address } from "@ton/core";
import { verifyTelegramInitData } from "./referrals.js";

const TON_USDT_MASTER =
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

const TONCENTER_API = "https://toncenter.com/api/v3";

const PACKAGES = {
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

async function readJson(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;

    if (body.length > 32768) {
      throw new Error("Request too large");
    }
  }

  return JSON.parse(body || "{}");
}

function sendJson(res, status, data) {
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function getTonAddress(value) {
  try {
    return Address.parse(value).toRawString();
  } catch {
    return null;
  }
}

export function createTonTestHandlers({
  database,
  telegram,
  botToken,
  adminId
}) {
  const apiKey = process.env.TONCENTER_API_KEY;

  const receiverAddress = getTonAddress(
    process.env.TON_TEST_RECEIVER_ADDRESS || ""
  );

  async function create(req, res) {
    try {
      const data = await readJson(req);

      const user = verifyTelegramInitData(
        String(data.initData || ""),
        botToken
      );

      if (!user?.id) {
        return sendJson(res, 401, {
          error: "Недійсні дані Telegram"
        });
      }

      if (!apiKey || !receiverAddress) {
        return sendJson(res, 500, {
          error: "USDT payment service is not configured"
        });
      }

      const stars = Number(data.stars);
      const price = PACKAGES[stars];

      if (!price) {
        return sendJson(res, 400, {
          error: "Неправильний пакет Stars"
        });
      }

      const walletAddress = getTonAddress(
        String(data.walletAddress || "")
      );

      if (!walletAddress) {
        return sendJson(res, 400, {
          error: "Неправильна адреса TON-гаманця"
        });
      }

      const walletUrl = new URL(
        TONCENTER_API + "/jetton/wallets"
      );

      walletUrl.searchParams.set("owner_address", walletAddress);
      walletUrl.searchParams.set("jetton_address", TON_USDT_MASTER);
      walletUrl.searchParams.set("limit", "1");

      const walletResponse = await fetch(walletUrl, {
        headers: {
          "X-API-Key": apiKey
        }
      });

      if (!walletResponse.ok) {
        throw new Error(
          "TON Center wallet lookup failed: " + walletResponse.status
        );
      }

      const walletData = await walletResponse.json();
      const jettonWallet = walletData.jetton_wallets?.[0]?.address;

      if (!jettonWallet || !getTonAddress(jettonWallet)) {
        return sendJson(res, 400, {
          error: "USDT-гаманець не знайдено для підключеної адреси"
        });
      }

      const queryId = randomBytes(6).readUIntBE(0, 6).toString();

      return sendJson(res, 200, {
        success: true,
        queryId,
        senderJettonWallet: Address.parse(jettonWallet).toString(),
        receiverAddress: Address.parse(receiverAddress).toString(),
        amountUsdt: price,
        stars
      });
    } catch (error) {
      console.error("TON payment create error:", error.message);

      return sendJson(res, 500, {
        error: "Не вдалося підготувати USDT-переказ"
      });
    }
  }

  async function notify(req, res) {
    try {
      const data = await readJson(req);

      const user = verifyTelegramInitData(
        String(data.initData || ""),
        botToken
      );

      if (!user?.id) {
        return sendJson(res, 401, {
          error: "Недійсні дані Telegram"
        });
      }

      const stars = Number(data.stars);
      const price = PACKAGES[stars];

      if (!price) {
        return sendJson(res, 400, {
          error: "Неправильний пакет Stars"
        });
      }

      const walletAddress = getTonAddress(
        String(data.walletAddress || "")
      );

      if (!walletAddress) {
        return sendJson(res, 400, {
          error: "Неправильна адреса TON-гаманця"
        });
      }

      const username = String(user.username || "").trim();

      const escapeHtml = (value) =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const message =
        "🔔 <b>ПОКУПЕЦЬ ПОВІДОМИВ ПРО ОПЛАТУ</b>\n\n" +
        "📦 <b>Товар:</b> " + stars + " Telegram Stars\n" +
        "💰 <b>Сума:</b> " + price.toFixed(2) + " USDT\n" +
        "🌐 <b>Мережа:</b> TON\n" +
        "👤 <b>Покупець:</b> @" + escapeHtml(username || "Не вказаний") + "\n" +
        "🆔 <b>Telegram ID:</b> <code>" + escapeHtml(user.id) + "</code>\n" +
        "👛 <b>Гаманець:</b> <code>" + escapeHtml(walletAddress) + "</code>\n\n" +
        "Статус: очікує ручної перевірки надходження USDT та видачі Stars.";

      if (!adminId) {
        throw new Error("ADMIN_ID is not configured");
      }

      const telegramResult = await telegram("sendMessage", {
        chat_id: adminId,
        text: message,
        parse_mode: "HTML"
      });

      if (!telegramResult || !telegramResult.ok) {
        throw new Error("Admin Telegram notification failed");
      }

      return sendJson(res, 200, {
        success: true,
        message: "Повідомлення адміністратору надіслано"
      });
    } catch (error) {
      console.error("TON payment notification error:", error.message);

      return sendJson(res, 500, {
        error: "Не вдалося надіслати повідомлення про оплату"
      });
    }
  }

  return { create, notify };
}
