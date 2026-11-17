import { verifyTelegramInitData } from "./referrals.js";

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || "{}");
}

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

async function getUser(req, botToken) {
  const data = await readBody(req);
  const user = verifyTelegramInitData(data.initData, botToken);
  return user?.id ? user : null;
}

function firstRow(result) {
  return Array.isArray(result) ? result[0] : result;
}

export function createDailyStarsHandlers({
  database,
  telegram,
  botToken,
  adminId
}) {
  async function status(req, res) {
    try {
      const user = await getUser(req, botToken);

      if (!user) {
        return send(res, 401, { error: "Invalid Telegram data" });
      }

      const result = await database("rpc/get_daily_star_account", "POST", {
        p_telegram_id: user.id,
        p_username: user.username || null
      });

      return send(res, 200, firstRow(result));
    } catch (error) {
      console.error("Daily stars status error:", error);
      return send(res, 500, { error: "Could not load daily stars" });
    }
  }

  async function claim(req, res) {
    try {
      const user = await getUser(req, botToken);

      if (!user) {
        return send(res, 401, { error: "Invalid Telegram data" });
      }

      const result = firstRow(await database(
        "rpc/claim_daily_stars",
        "POST",
        {
          p_telegram_id: user.id,
          p_username: user.username || null
        }
      ));

      if (!result?.success) {
        return send(res, 400, result || { error: "claim_failed" });
      }

      return send(res, 200, result);
    } catch (error) {
      console.error("Daily stars claim error:", error);
      return send(res, 500, { error: "Could not claim daily stars" });
    }
  }

  async function withdraw(req, res) {
    try {
      const user = await getUser(req, botToken);

      if (!user) {
        return send(res, 401, { error: "Invalid Telegram data" });
      }

      const result = firstRow(await database(
        "rpc/request_daily_stars_withdrawal",
        "POST",
        {
          p_telegram_id: user.id,
          p_username: user.username || null
        }
      ));

      if (!result?.success) {
        return send(res, 400, result || { error: "withdrawal_failed" });
      }

      const notice = await telegram("sendMessage", {
        chat_id: adminId,
        text:
          "⭐ STARS DROP — щоденна нагорода: заявка на виведення\n\n" +
          "Username: @" + (user.username || "не вказаний") + "\n" +
          "Telegram ID: " + user.id + "\n" +
          "Сума: 1000 Stars\n" +
          "ID заявки: " + result.withdrawal_id
      });

      if (!notice.ok) {
        console.error("Daily stars notification error:", notice.description);
      }

      return send(res, 200, result);
    } catch (error) {
      console.error("Daily stars withdrawal error:", error);
      return send(res, 500, { error: "Could not request withdrawal" });
    }
  }

  return { status, claim, withdraw };
}
