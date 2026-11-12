import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyTelegramInitData(initData, botToken) { if (!initData || !botToken) return null;
try { const params = new URLSearchParams(initData); const hash = params.get("hash");
if (!hash) return null;

params.delete("hash");

const dataCheckString = Array.from(params.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => key + "=" + value)
  .join("\n");

const secretKey = createHmac("sha256", "WebAppData")
  .update(botToken)
  .digest();

const calculatedHash = createHmac("sha256", secretKey)
  .update(dataCheckString)
  .digest("hex");

const received = Buffer.from(hash, "hex");
const calculated = Buffer.from(calculatedHash, "hex");

if (received.length !== calculated.length) return null;
if (!timingSafeEqual(received, calculated)) return null;

const authDate = Number(params.get("auth_date"));

if (!authDate || Date.now() / 1000 - authDate > 86400) {
  return null;
}

return JSON.parse(params.get("user") || "null");} catch { return null; } }
export function createReferralGetHandler({ database, telegram, botToken }) { return async function handleReferral(req, res) { try { let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const data = JSON.parse(body || "{}");

  const user = verifyTelegramInitData(
    data.initData,
    botToken
  );

  if (!user?.id) {
    res.writeHead(401);
    res.end(JSON.stringify({
      error: "Invalid Telegram data"
    }));
    return;
  }

  await database("rpc/register_referral_user", "POST", {
    p_telegram_id: user.id,
    p_username: user.username || null,
    p_first_name: user.first_name || null,
    p_referrer_id: null,
    p_eligible_new: false
  });

  const rows = await database(
    "referral_accounts?select=balance,total_referrals,total_earned,total_withdrawn&telegram_id=eq." +
    encodeURIComponent(user.id) +
    "&limit=1"
  );

  const bot = await telegram("getMe", {});

  if (!bot.ok || !bot.result?.username) {
    throw new Error("Could not get bot username");
  }

  const account = Array.isArray(rows) ? rows[0] : null;

  res.writeHead(200, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    balance: Number(account?.balance || 0),
    totalReferrals: Number(account?.total_referrals || 0),
    totalEarned: Number(account?.total_earned || 0),
    totalWithdrawn: Number(account?.total_withdrawn || 0),
    referralLink:
      "https://t.me/" +
      bot.result.username +
      "?start=ref_" +
      user.id
  }));

} catch (error) {
  console.error("Referral error:", error);

  res.writeHead(500, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    error: "Could not load referral data"
  }));
}}; }
export function createReferralWithdrawHandler({ database, telegram, botToken, adminId }) { return async function handleReferralWithdraw(req, res) { try { let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const data = JSON.parse(body || "{}");

  const user = verifyTelegramInitData(
    data.initData,
    botToken
  );

  if (!user?.id) {
    res.writeHead(401);
    res.end(JSON.stringify({
      error: "Invalid Telegram data"
    }));
    return;
  }

  const result = await database(
    "rpc/request_referral_withdrawal",
    "POST",
    {
      p_telegram_id: user.id,
      p_username: user.username || null
    }
  );

  const account = Array.isArray(result)
    ? result[0]
    : result;

  if (!account?.success) {
    res.writeHead(400, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      error: account?.error || "withdrawal_failed",
      balance: Number(account?.balance || 0)
    }));

    return;
  }

  const notice = await telegram("sendMessage", {
    chat_id: adminId,
    text:
      "⭐ STARS DROP — заявка на виведення\n\n" +
      "Username: @" + (user.username || "не вказаний") + "\n" +
      "Telegram ID: " + user.id + "\n" +
      "Сума: 100 Stars\n" +
      "ID заявки: " + account.withdrawal_id
  });

  if (!notice.ok) {
    console.error(
      "Withdrawal notification error:",
      notice.description
    );
  }

  res.writeHead(200, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    success: true,
    withdrawalId: account.withdrawal_id,
    amount: Number(account.amount || 100),
    balance: Number(account.balance || 0)
  }));

} catch (error) {
  console.error("Referral withdrawal error:", error);

  res.writeHead(500, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    error: "Could not request withdrawal"
  }));
}}; }