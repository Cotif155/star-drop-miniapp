import { randomBytes, randomUUID } from "node:crypto";
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

function getQueryId() {
  return randomBytes(6).readUIntBE(0, 6).toString();
}

export function createTonTestHandlers({
  database,
  telegram,
  botToken,
  adminId,
  supabaseUrl,
  supabaseKey
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

      if (!apiKey || !receiverAddress || !supabaseUrl || !supabaseKey) {
        return sendJson(res, 500, {
          error: "TON test service is not configured"
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
          "TON Center wallet lookup failed: " +
          walletResponse.status
        );
      }

      const walletData = await walletResponse.json();

      const jettonWallet =
        walletData.jetton_wallets?.[0]?.address;

      if (!jettonWallet || !getTonAddress(jettonWallet)) {
        return sendJson(res, 400, {
          error: "USDT-гаманець не знайдено для підключеної адреси"
        });
      }

      const queryId = getQueryId();
      const intentId = randomUUID();
      const createdAt = new Date();
      const expiresAt = new Date(
        createdAt.getTime() + 10 * 60 * 1000
      );

      await database("ton_test_payments", "POST", {
        id: intentId,
        telegram_user_id: String(user.id),
        wallet_address: walletAddress,
        stars,
        amount_usdt: price,
        status: "pending",
        query_id: queryId,
        expires_at: expiresAt.toISOString(),
        sender_jetton_wallet: getTonAddress(jettonWallet)
      });

      return sendJson(res, 200, {
        success: true,
        intentId,
        queryId,
        senderJettonWallet: Address.parse(jettonWallet).toString(),
        receiverAddress: Address.parse(receiverAddress).toString(),
        amountUsdt: price,
        stars,
        expiresAt: expiresAt.toISOString()
      });

    } catch (error) {
      console.error("TON test create error:", error.message);

      return sendJson(res, 500, {
        error: "Не вдалося створити тестовий платіж"
      });
    }
  }

  async function verify(req, res) {
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

      const intentId = String(data.intentId || "");

      if (!/^[0-9a-f-]{36}$/i.test(intentId)) {
        return sendJson(res, 400, {
          error: "Неправильний ID платежу"
        });
      }

      const rows = await database(
        "ton_test_payments?select=*&id=eq." +
        encodeURIComponent(intentId) +
        "&telegram_user_id=eq." +
        encodeURIComponent(String(user.id)) +
        "&limit=1"
      );

      const payment = rows?.[0];

      if (!payment) {
        return sendJson(res, 404, {
          error: "Тестовий платіж не знайдено"
        });
      }

      if (payment.status === "verified") {
        return sendJson(res, 200, {
          success: true,
          status: "verified",
          message: "Переказ уже підтверджено"
        });
      }

      if (payment.status !== "pending") {
        return sendJson(res, 400, {
          error: "Платіж не очікує перевірки"
        });
      }

      if (Date.now() > new Date(payment.expires_at).getTime()) {
        await database(
          "ton_test_payments?id=eq." +
          encodeURIComponent(intentId) +
          "&status=eq.pending",
          "PATCH",
          { status: "expired" }
        );

        return sendJson(res, 400, {
          error: "Час тестового платежу минув"
        });
      }

      const startUtime = Math.floor(
        new Date(payment.created_at).getTime() / 1000
      );

      const transfersUrl = new URL(
        TONCENTER_API + "/jetton/transfers"
      );

      transfersUrl.searchParams.set(
        "owner_address",
        receiverAddress
      );
      transfersUrl.searchParams.set(
        "jetton_master",
        TON_USDT_MASTER
      );
      transfersUrl.searchParams.set("direction", "in");
      transfersUrl.searchParams.set(
        "start_utime",
        String(startUtime)
      );
      transfersUrl.searchParams.set("limit", "100");
      transfersUrl.searchParams.set("sort", "desc");

      const transfersResponse = await fetch(transfersUrl, {
        headers: {
          "X-API-Key": apiKey
        }
      });

      if (!transfersResponse.ok) {
        throw new Error(
          "TON Center transfers lookup failed: " +
          transfersResponse.status
        );
      }

      const transfersData = await transfersResponse.json();
      const transfers = transfersData.jetton_transfers || [];

      const expectedAmount = String(
        Math.round(Number(payment.amount_usdt) * 1000000)
      );

      const expectedQueryId = String(payment.query_id);

      const transfer = transfers.find((item) => {
        const sourceWallet = getTonAddress(
          item.source_wallet || ""
        );

        const destination = getTonAddress(
          item.destination || ""
        );

        const master = getTonAddress(
          item.jetton_master || ""
        );

        return (
          String(item.query_id) === expectedQueryId &&
          String(item.amount) === expectedAmount &&
          sourceWallet === payment.sender_jetton_wallet &&
          destination === receiverAddress &&
          master === getTonAddress(TON_USDT_MASTER) &&
          item.transaction_aborted === false &&
          Boolean(item.transaction_hash)
        );
      });

      if (!transfer) {
        return sendJson(res, 200, {
          success: false,
          status: "pending",
          message: "Переказ поки не знайдено в блокчейні"
        });
      }

      const updateResponse = await fetch(
        supabaseUrl +
        "/rest/v1/ton_test_payments?id=eq." +
        encodeURIComponent(intentId) +
        "&status=eq.pending",
        {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: "Bearer " + supabaseKey,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            status: "verified",
            tx_hash: transfer.transaction_hash,
            verified_at: new Date().toISOString()
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          "Supabase verification update failed: " +
          updateResponse.status
        );
      }

      const updatedRows = await updateResponse.json();

      if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
        const currentRows = await database(
          "ton_test_payments?select=status&id=eq." +
          encodeURIComponent(intentId) +
          "&telegram_user_id=eq." +
          encodeURIComponent(String(user.id)) +
          "&limit=1"
        );
        const currentStatus = currentRows?.[0]?.status;

        if (currentStatus === "verified") {
          return sendJson(res, 200, {
            success: true,
            status: "verified",
            message: "Переказ уже підтверджено"
          });
        }

        if (currentStatus === "expired") {
          return sendJson(res, 400, {
            error: "Час тестового платежу минув"
          });
        }

        return sendJson(res, 409, {
          error: "Статус тестового платежу змінився. Повтори перевірку."
        });
      }

      if (adminId) {
        const message =
          "🧪 <b>ТЕСТОВИЙ USDT ПЕРЕКАЗ ПІДТВЕРДЖЕНО</b>\n\n" +
          "⭐ <b>Пакет:</b> " + payment.stars + " Stars\n" +
          "💰 <b>Сума:</b> " + payment.amount_usdt + " USDT\n" +
          "🆔 <b>Telegram ID:</b> <code>" +
          user.id + "</code>\n" +
          "👛 <b>Гаманець:</b> <code>" +
          payment.wallet_address + "</code>\n" +
          "🔗 <b>Транзакція:</b> <code>" +
          transfer.transaction_hash + "</code>\n\n" +
          "Це тестовий переказ. Stars не видаються.";

        try {
          await telegram("sendMessage", {
            chat_id: adminId,
            text: message,
            parse_mode: "HTML"
          });
        } catch (notifyError) {
          console.error(
            "TON test admin notification error:",
            notifyError.message
          );
        }
      }

      return sendJson(res, 200, {
        success: true,
        status: "verified",
        transactionHash: transfer.transaction_hash,
        message: "Тестовий переказ підтверджено"
      });

    } catch (error) {
      console.error("TON test verify error:", error.message);

      return sendJson(res, 500, {
        error: "Не вдалося перевірити тестовий переказ"
      });
    }
  }

  return { create, verify };
}
