import { useEffect, useState } from "react";
import "./App.css";
const wallets = {
  USDT: "UQCJyWTilVY1vHFWpHqCBD_DnEuBEGJ4H0itRXiqBSRg9Ozd",
};
const packages = [
  { stars: 100, usd: 1.95, old: 2.39 },
  { stars: 150, usd: 2.93, old: 3.69 },
  { stars: 250, usd: 4.88, old: 6.09 },
  { stars: 350, usd: 6.83, old: 8.49 },
  { stars: 500, usd: 9.75, old: 11.99 },
  { stars: 750, usd: 14.63, old: 17.99 },
  { stars: 1000, usd: 19.50, old: 23.99 },
  { stars: 1500, usd: 29.25, old: 36.49 },
  { stars: 2500, usd: 48.75, old: 60.99 },
  { stars: 5000, usd: 97.50, old: 119 },
  { stars: 10000, usd: 195, old: 239 },
  { stars: 25000, usd: 487.50, old: 609 },
  { stars: 35000, usd: 682.50, old: 849 },
];
const premiumPlans = [
  { months: 3, usd: 15 },
  { months: 6, usd: 20 },
  { months: 12, usd: 34 },
];

const words = {
  UA: {
    title: "Каталог Stars",
    subtitle: "Обирай свій пакет Telegram Stars",
    buy: "Обрати пакет",
    continue: "Продовжити",
    payment: "Оплата USDT",
    choose: "Оплата тільки в USDT у мережі TON",
    back: "Назад",
    amount: "До оплати",
    address: "Адреса гаманця",
    copy: "Копіювати адресу",
    copied: "Скопійовано!",
    paid: "Підтвердити оплату",
    demo: "Переказ USDT у мережі TON",
    note: "Скопіюйте адресу гаманця, надішліть USDT у мережі TON, поверніться в додаток і підтвердіть оплату.",
    sending: "Надсилання...",
    success: "Заявку успішно надіслано!",
    error: "Не вдалося надіслати заявку. Спробуй ще раз.",
    savings: "Економія",
    reference: "Ціна Telegram",
    referral: "Реферальна програма",
    premium: "Telegram Premium",
    premiumTitle: "Обери підписку Telegram Premium",
    premiumSubtitle: "Підписка для твого Telegram-акаунта",
    months3: "3 місяці",
    months6: "6 місяців",
    months12: "12 місяців",
    telegramRequired: "Відкрий STARS DROP через Telegram, щоб отримати твій Telegram ID.",
    reward: "Отримуй 5 ⭐ за кожного нового друга",
    loading: "Завантаження...",
    balance: "Твій баланс",
    friends: "Запрошені друзі",
    earned: "Усього зароблено",
    withdrawn: "Усього виведено",
    invite: "Твоє реферальне посилання",
    copyLink: "Скопіювати",
    shareLink: "Надіслати",
    copiedLink: "Посилання скопійовано!",
    withdrawInfo: "Мінімальне виведення — 100 ⭐",
    withdraw: "Вивести 100 ⭐",
    withdrawSuccess: "Заявку на виведення надіслано!",
    howTitle: "💡 Як це працює?",
    how1: "1. Поділіться своїм реферальним посиланням із друзями.",
    how2: "2. Друзі переходять за вашим посиланням і реєструються в STARS DROP.",
    how3: "3. За кожного нового запрошеного друга ви отримуєте 5 ⭐.",
    how4: "4. Коли назбираєте 100 ⭐, зможете подати заявку на виведення.",
    dailyCard: "Забрати 5 зірок",
    dailyTitle: "Щоденна нагорода",
    dailySubtitle: "Отримуй 5 безкоштовних ⭐ кожні 24 години",
    dailyBalance: "Твій баланс нагород",
    dailyClaim: "Забрати",
    dailyClaimed: "5 ⭐ зараховано на твій баланс!",
    dailyWait: "Наступна нагорода через",
    dailyAvailable: "Нагорода вже доступна!",
    dailyWithdrawInfo: "Виведення доступне тільки при балансі рівно 1000 ⭐",
    dailyWithdraw: "Вивести 1000 ⭐",
    dailyWithdrawSuccess: "Заявку на виведення 1000 ⭐ надіслано!",
    dailyWithdrawError: "Не вдалося подати заявку на виведення.",
    dailyLoading: "Завантаження нагороди...",
    dailyHours: "год",
    dailyMinutes: "хв",
    dailySeconds: "сек",
  },
  RU: {
    title: "Каталог Stars",
    subtitle: "Выбирай пакет Telegram Stars",
    buy: "Выбрать пакет",
    continue: "Продолжить",
    payment: "Оплата USDT",
    choose: "Оплата только в USDT в сети TON",
    back: "Назад",
    amount: "К оплате",
    address: "Адрес кошелька",
    copy: "Копировать адрес",
    copied: "Скопировано!",
    paid: "Подтвердить оплату",
    demo: "Перевод USDT в сети TON",
    note: "Скопируйте адрес кошелька, отправьте USDT в сети TON, вернитесь в приложение и подтвердите оплату.",
    sending: "Отправка...",
    success: "Заявка успешно отправлена!",
    error: "Не удалось отправить заявку. Попробуй ещё раз.",
    savings: "Экономия",
    reference: "Цена Telegram",
    referral: "Реферальная программа",
    premium: "Telegram Premium",
    premiumTitle: "Выбери подписку Telegram Premium",
    premiumSubtitle: "Подписка для твоего Telegram-аккаунта",
    months3: "3 месяца",
    months6: "6 месяцев",
    months12: "12 месяцев",
    telegramRequired: "Открой STARS DROP через Telegram, чтобы получить свой Telegram ID.",
    reward: "Получай 5 ⭐ за каждого нового друга",
    loading: "Загрузка...",
    balance: "Твой баланс",
    friends: "Приглашённые друзья",
    earned: "Всего заработано",
    withdrawn: "Всего выведено",
    invite: "Твоя реферальная ссылка",
    copyLink: "Копировать",
    shareLink: "Отправить",
    copiedLink: "Ссылка скопирована!",
    withdrawInfo: "Минимальный вывод — 100 ⭐",
    withdraw: "Вывести 100 ⭐",
    withdrawSuccess: "Заявка на вывод отправлена!",
    howTitle: "💡 Как это работает?",
    how1: "1. Поделитесь своей реферальной ссылкой с друзьями.",
    how2: "2. Друзья переходят по вашей ссылке и регистрируются в STARS DROP.",
    how3: "3. За каждого нового приглашённого друга вы получаете 5 ⭐.",
    how4: "4. Когда накопите 100 ⭐, сможете подать заявку на вывод.",
    dailyCard: "Забрать 5 звёзд",
    dailyTitle: "Ежедневная награда",
    dailySubtitle: "Получай 5 бесплатных ⭐ каждые 24 часа",
    dailyBalance: "Твой баланс наград",
    dailyClaim: "Забрать",
    dailyClaimed: "5 ⭐ зачислено на твой баланс!",
    dailyWait: "Следующая награда через",
    dailyAvailable: "Награда уже доступна!",
    dailyWithdrawInfo: "Вывод доступен только при балансе ровно 1000 ⭐",
    dailyWithdraw: "Вывести 1000 ⭐",
    dailyWithdrawSuccess: "Заявка на вывод 1000 ⭐ отправлена!",
    dailyWithdrawError: "Не удалось подать заявку на вывод.",
    dailyLoading: "Загрузка награды...",
    dailyHours: "ч",
    dailyMinutes: "мин",
    dailySeconds: "сек",
  },
  EN: {
    title: "Stars Catalog",
    subtitle: "Choose your Telegram Stars package",
    buy: "Choose package",
    continue: "Continue",
    payment: "USDT Payment",
    choose: "Payment only in USDT on TON network",
    back: "Back",
    amount: "Amount to pay",
    address: "Wallet address",
    copy: "Copy address",
    copied: "Copied!",
    paid: "Confirm payment",
    demo: "USDT transfer on TON network",
    note: "Copy the wallet address, send USDT on the TON network, return to the app, and confirm the payment.",
    sending: "Sending...",
    success: "Request sent successfully!",
    error: "Could not send request. Please try again.",
    savings: "Savings",
    reference: "Telegram price",
    referral: "Referral program",
    premium: "Telegram Premium",
    premiumTitle: "Choose your Telegram Premium plan",
    premiumSubtitle: "Subscription for your Telegram account",
    months3: "3 months",
    months6: "6 months",
    months12: "12 months",
    telegramRequired: "Open STARS DROP through Telegram to receive your Telegram ID.",
    reward: "Get 5 ⭐ for every new friend",
    loading: "Loading...",
    balance: "Your balance",
    friends: "Invited friends",
    earned: "Total earned",
    withdrawn: "Total withdrawn",
    invite: "Your referral link",
    copyLink: "Copy",
    shareLink: "Share",
    copiedLink: "Link copied!",
    withdrawInfo: "Minimum withdrawal — 100 ⭐",
    withdraw: "Withdraw 100 ⭐",
    withdrawSuccess: "Withdrawal request sent!",
    howTitle: "💡 How does it work?",
    how1: "1. Share your referral link with friends.",
    how2: "2. Friends follow your link and register in STARS DROP.",
    how3: "3. You receive 5 ⭐ for every new friend you invite.",
    how4: "4. Once you collect 100 ⭐, you can submit a withdrawal request.",
    dailyCard: "Claim 5 Stars",
    dailyTitle: "Daily reward",
    dailySubtitle: "Get 5 free ⭐ every 24 hours",
    dailyBalance: "Your reward balance",
    dailyClaim: "Claim",
    dailyClaimed: "5 ⭐ added to your balance!",
    dailyWait: "Next reward available in",
    dailyAvailable: "Your reward is available!",
    dailyWithdrawInfo: "Withdrawal is available only when your balance is exactly 1000 ⭐",
    dailyWithdraw: "Withdraw 1000 ⭐",
    dailyWithdrawSuccess: "Your 1000 ⭐ withdrawal request has been sent!",
    dailyWithdrawError: "Could not submit the withdrawal request.",
    dailyLoading: "Loading reward...",
    dailyHours: "h",
    dailyMinutes: "m",
    dailySeconds: "s",
  },
};
export default function App() {
  const [language, setLanguage] = useState("UA");
  const [screen, setScreen] = useState("catalog");
  const [selected, setSelected] = useState(null);
  const [selectedPremium, setSelectedPremium] = useState(null);
  const [method, setMethod] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyClaimLoading, setDailyClaimLoading] = useState(false);
  const [dailyWithdrawLoading, setDailyWithdrawLoading] = useState(false);
  const [dailyNow, setDailyNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setDailyNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const t = words[language];
  const wallet = wallets.USDT;
  const dailyRemaining = dailyData?.next_claim_at
    ? Math.max(0, new Date(dailyData.next_claim_at).getTime() - dailyNow)
    : 0;
  const dailyCountdown = [
    Math.floor(dailyRemaining / 3600000),
    Math.floor((dailyRemaining % 3600000) / 60000),
    Math.floor((dailyRemaining % 60000) / 1000)
  ].map((value) => String(value).padStart(2, "0")).join(":");
  const dailyCanClaim = Boolean(dailyData?.can_claim) || (
    dailyData?.next_claim_at &&
    dailyRemaining <= 0
  );
  const money = (value) => Number(value).toFixed(2);
  async function copyWallet() {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
    } catch {
      alert(wallet);

    }

  }

  async function sendOrder() {

   if (sending || !selected || !method) return;

    setSending(true);

    try {

      const telegramUser =

        window.Telegram?.WebApp?.initDataUnsafe?.user;

      const response = await fetch("/api/order", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          stars: selected.stars,

          method: "USDT_TON",
          username: telegramUser?.username || "Не вказаний",
          userId: telegramUser?.id || "Не отриманий",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }
      alert(t.success);
    } catch (error) {
      console.error("Order error:", error);
      alert(t.error);
    } finally {
      setSending(false);
    }
  }
  async function sendPremiumOrder() {
    if (sending || !selectedPremium) return;

    const telegramUser =
      window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (!telegramUser?.id) {
      alert(t.telegramRequired);
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "premium",
          months: selectedPremium.months,
          method: "USDT_TON",
          username: telegramUser.username || "Не вказаний",
          userId: telegramUser.id
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }

      alert(t.success);
    } catch (error) {
      console.error("Premium order error:", error);
      alert(t.error);
    } finally {
      setSending(false);
    }
  }

  async function loadReferral() {
    setScreen("referral");
    setReferralLoading(true);
    try {
      const response = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: window.Telegram?.WebApp?.initData || ""
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Referral request failed");
      }
      setReferralData(result);
      setLinkCopied(false);
    } catch (error) {
      console.error("Referral error:", error);
      setReferralData(null);
      alert(t.error);
    } finally {
      setReferralLoading(false);
    }
  }

  async function copyReferralLink() {
    if (!referralData?.referralLink) return;
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setLinkCopied(true);
    } catch {
      alert(referralData.referralLink);
    }
  }


  function shareReferralLink() {
    if (!referralData?.referralLink) return;

    const message = language === "UA"
      ? "⭐ STARS DROP\nОтримуй Telegram Stars швидко та вигідно!\n🎁 Запрошуй друзів і отримуй 5 ⭐ за кожного."
      : language === "RU"
      ? "⭐ STARS DROP\nПолучай Telegram Stars быстро и выгодно!\n🎁 Приглашай друзей и получай 5 ⭐ за каждого."
      : "⭐ STARS DROP\nGet Telegram Stars quickly and at a great price!\n🎁 Invite friends and get 5 ⭐ for each one.";

    const shareUrl = "https://t.me/share/url?url=" +
      encodeURIComponent(referralData.referralLink) +
      "&text=" + encodeURIComponent(message);

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
  }


  async function withdrawReferral() {
    if (withdrawLoading) return;
    if (Number(referralData?.balance || 0) < 100) return;
    setWithdrawLoading(true);
    try {
      const response = await fetch("/api/referral/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: window.Telegram?.WebApp?.initData || ""
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Withdrawal failed");
      }
      alert(t.withdrawSuccess);
      await loadReferral();
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert(t.error);
    } finally {
      setWithdrawLoading(false);
    }
  }
  async function loadDailyStars() {
    setScreen("daily-stars");
    setDailyLoading(true);
    try {
      const response = await fetch("/api/daily-stars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: window.Telegram?.WebApp?.initData || ""
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Daily reward request failed");
      setDailyData(result);
    } catch (error) {
      console.error("Daily stars status error:", error);
      setDailyData(null);
      alert(t.error);
    } finally {
      setDailyLoading(false);
    }
  }

  async function claimDailyStars() {
    if (dailyClaimLoading || !dailyCanClaim) return;
    setDailyClaimLoading(true);
    try {
      const response = await fetch("/api/daily-stars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: window.Telegram?.WebApp?.initData || ""
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        await loadDailyStars();
        throw new Error(result.error || "Daily claim failed");
      }
      setDailyData(result);
      alert(t.dailyClaimed);
    } catch (error) {
      console.error("Daily stars claim error:", error);
      if (error.message !== "cooldown") alert(t.error);
    } finally {
      setDailyClaimLoading(false);
    }
  }

  async function withdrawDailyStars() {
    if (dailyWithdrawLoading || Number(dailyData?.balance) !== 1000) return;
    setDailyWithdrawLoading(true);
    try {
      const response = await fetch("/api/daily-stars/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: window.Telegram?.WebApp?.initData || ""
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Daily withdrawal failed");
      }
      setDailyData((previous) => ({
        ...previous,
        balance: 0,
        can_claim: false
      }));
      alert(t.dailyWithdrawSuccess);
      await loadDailyStars();
    } catch (error) {
      console.error("Daily stars withdrawal error:", error);
      alert(t.dailyWithdrawError);
    } finally {
      setDailyWithdrawLoading(false);
    }
  }

  function goBack() {
    setCopied(false);
    if (method) {
      setMethod(null);
    } else if (screen === "payment") {
      setScreen("order");
    } else if (screen === "order") {
      setScreen("stars");
    } else {
      setScreen("catalog");
    }
  }
  return (
    <div className={`app ${
      screen === "referral" ? "referral-mode" :
      screen === "daily-stars" ? "daily-stars-mode" :
      screen === "catalog" || screen === "stars" ? "catalog-mode" :
      screen === "order" || screen === "premium" ? "order-mode" :
      screen === "payment" || screen === "premium-payment" ? "payment-mode" : ""
    }`}>
      <header className="topbar">
        <div className="brand"><span className="brand-star">⭐</span> STARS DROP</div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="UA">UA</option>
          <option value="RU">RU</option>
          <option value="EN">EN</option>
        </select>
      </header>
      {screen === "catalog" && (
        <>
          <section className="hero home-hero">
            <h1><span className="home-hero-star">⭐</span> STARS DROP</h1>
            <p>{t.subtitle}</p>
          </section>
          <div className="home-menu-grid">
            <button className="home-menu-card stars-menu-card" onClick={() => setScreen("stars")}>
              <span className="home-menu-icon">⭐</span>
              <strong>Telegram Stars</strong>
              <small>{t.subtitle}</small>
            </button>
            <button className="home-menu-card premium-menu-card" onClick={() => setScreen("premium")}>
              <span className="home-menu-icon">💎</span>
              <strong>{t.premium}</strong>
              <small>{t.premiumSubtitle}</small>
            </button>
            <button className="home-menu-card referral-menu-card" onClick={loadReferral}>
              <span className="home-menu-icon">🎁</span>
              <strong>{t.referral}</strong>
              <small>{t.reward}</small>
            </button>
            <button className="home-menu-card daily-stars-menu-card" onClick={loadDailyStars}>
              <span className="home-menu-icon">⭐</span>
              <strong>{t.dailyCard}</strong>
              <small>{t.dailySubtitle}</small>
            </button>
          </div>
        </>
      )}

      {screen === "stars" && (
        <section className="stars-catalog-screen">
          <button className="back-button" onClick={() => setScreen("catalog")}>
            ← {t.back}
          </button>
          <section className="hero">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </section>
          <div className="package-list">
            {packages.map((item) => (
              <div className="package-card" key={item.stars}>
                <div className="package-top">
                  <div>
                    <h2>
                      <span className="star-animate">⭐</span>{" "}
                      {item.stars.toLocaleString("en-US")}
                    </h2>
                    <p>Telegram Stars</p>
                  </div>
                  <div className="price-block">
                    <strong>${money(item.usd)}</strong>
                  </div>
                </div>
                <div className="package-info">
                  <span>
                    {t.reference}: ${money(item.old)}
                  </span>
                  <span className="saving">
                    -{Math.round(
                      (1 - item.usd / item.old) * 100
                    )}%
                  </span>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    setSelected(item);
                    setScreen("order");
                    setMethod(null);
                    setCopied(false);
                  }}
                >
                  {t.buy}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {screen === "order" && selected && (
        <section className="content-screen">
          <button className="back-button" onClick={goBack}>
            ← {t.back}
          </button>
          <h1 className="order-title">
            <span className="order-title-star">⭐</span>
            {selected.stars.toLocaleString("en-US")} Stars
          </h1>
          <p className="muted">STARS DROP</p>
          <div className="details-card">
            <div className="detail-row">
              <span>{t.amount}</span>
              <strong>${money(selected.usd)} USDT</strong>
            </div>
            <div className="detail-row">
              <span>{t.reference}</span>
              <strong>${money(selected.old)}</strong>

            </div>

            <div className="detail-row">

              <span>{t.savings}</span>

              <strong className="saving">

                {Math.round(

                  (1 - selected.usd / selected.old) * 100

                )}%

              </strong>

            </div>

          </div>

          <button

            className="primary-button large continue-button"

            onClick={() => {

              setMethod("USDT");

              setScreen("payment");

            }}

          >

            {t.continue}

          </button>

        </section>
        )}
      {screen === "payment" && (
        <section className="content-screen">
          <button className="back-button" onClick={goBack}>
            ← {t.back}
          </button>
          <h1>{t.payment}</h1>
          <div className="details-card payment-details">
            <div className="demo-label">{t.demo}</div>
            <h2>USDT</h2>
            <div className="amount-label">{t.amount}</div>
            <div className="amount-value">
              {money(selected.usd)} USDT
            </div>
            <div className="network-notice">
              <span>✓</span> {t.choose}
            </div>
            <div className="address-label">{t.address}</div>
            <div className="wallet-address">
              {wallet}
            </div>
            <button
              className="secondary-button"
              onClick={copyWallet}
            >
              {copied ? t.copied : t.copy}
            </button>
            <button
              className="primary-button large"
              onClick={sendOrder}
              disabled={sending}
            >
              {sending ? t.sending : t.paid}
            </button>
            <p className="demo-note">{t.note}</p>
          </div>
        </section>
      )}

    {screen === "premium" && (
      <section className="content-screen premium-screen">
        <button className="back-button" onClick={() => setScreen("catalog")}>
          ← {t.back}
        </button>
        <h1>💎 {t.premiumTitle}</h1>
        <p className="premium-subtitle">{t.premiumSubtitle}</p>
        <div className="premium-plans">
          {premiumPlans.map((plan) => (
            <button
              className="premium-plan-button"
              key={plan.months}
              onClick={() => {
                setSelectedPremium(plan);
                setCopied(false);
                setScreen("premium-payment");
              }}
            >
              <strong>
                {plan.months === 3 ? t.months3 : plan.months === 6 ? t.months6 : t.months12}
              </strong>
              <span>${money(plan.usd)} USDT</span>
            </button>
          ))}
        </div>
      </section>
    )}

    {screen === "premium-payment" && selectedPremium && (
      <section className="content-screen">
        <button className="back-button" onClick={() => setScreen("premium")}>
          ← {t.back}
        </button>
        <h1>{t.payment}</h1>
        <div className="details-card payment-details">
          <div className="demo-label">{t.demo}</div>
          <h2>💎 Telegram Premium</h2>
          <div className="amount-label">
            {selectedPremium.months === 3 ? t.months3 : selectedPremium.months === 6 ? t.months6 : t.months12}
          </div>
          <div className="amount-value">
            {money(selectedPremium.usd)} USDT
          </div>
          <div className="network-notice">
            <span>✓</span> {t.choose}
          </div>
          <div className="address-label">{t.address}</div>
          <div className="wallet-address">{wallet}</div>
          <button className="secondary-button" onClick={copyWallet}>
            {copied ? t.copied : t.copy}
          </button>
          <button
            className="primary-button large"
            onClick={sendPremiumOrder}
            disabled={sending}
          >
            {sending ? t.sending : t.paid}
          </button>
          <p className="demo-note">{t.note}</p>
        </div>
      </section>
    )}

    {screen === "daily-stars" && (
      <section className="content-screen daily-stars-screen">
        <button className="back-button" onClick={() => setScreen("catalog")}>
          ← {t.back}
        </button>
        <section className="hero daily-stars-hero">
          <h1><span className="daily-stars-hero-star">⭐</span> {t.dailyTitle}</h1>
          <p>{t.dailySubtitle}</p>
        </section>

        {dailyLoading ? (
          <div className="details-card">
            <p>{t.dailyLoading}</p>
          </div>
        ) : dailyData ? (
          <>
            <div className="details-card daily-stars-balance-card">
              <div className="address-label">{t.dailyBalance}</div>
              <div className="daily-stars-balance">
                {dailyData.balance || 0} <span>⭐</span>
              </div>
            </div>

            <div className="details-card daily-stars-claim-card">
              <div className="daily-stars-big-icon">⭐</div>
              <h2>+5 Stars</h2>
              <p>{dailyCanClaim ? t.dailyAvailable : t.dailyWait}</p>
              {!dailyCanClaim && (
                <div className="daily-stars-countdown">{dailyCountdown}</div>
              )}
              <button
                className="primary-button large daily-stars-claim-button"
                onClick={claimDailyStars}
                disabled={!dailyCanClaim || dailyClaimLoading}
              >
                {dailyClaimLoading ? t.loading : t.dailyClaim}
              </button>
            </div>

            <div className="details-card daily-stars-withdraw-card">
              <p>{t.dailyWithdrawInfo}</p>
              <button
                className="primary-button large daily-stars-withdraw-button"
                onClick={withdrawDailyStars}
                disabled={dailyWithdrawLoading || Number(dailyData.balance) !== 1000}
              >
                {dailyWithdrawLoading ? t.loading : t.dailyWithdraw}
              </button>
            </div>
          </>
        ) : (
          <div className="details-card">
            <p>{t.error}</p>
            <button className="primary-button" onClick={loadDailyStars}>
              {language === "RU" ? "Попробовать снова" : language === "EN" ? "Try again" : "Спробувати ще раз"}
            </button>
          </div>
        )}
      </section>
    )}

    {screen === "referral" && (
      <section className="content-screen referral-screen">
        <button className="back-button" onClick={() => setScreen("catalog")}>
          ← {t.back}
        </button>
        <section className="hero referral-hero">
          <h1><span className="referral-heading-star">⭐</span> {t.referral}</h1>
          <p className="referral-reward">
            {t.reward.split("⭐")[0]}<span className="referral-moving-star">⭐</span>{t.reward.split("⭐")[1]}
          </p>
        </section>
        {referralLoading ? (
          <div className="details-card">
            <p>{t.loading}</p>
          </div>
        ) : referralData ? (
          <>
            <div className="referral-stats">
              <div className="details-card referral-stat-card">
                <div className="referral-stat-label">{t.balance}</div>
                <div className="referral-stat-number">
                  {referralData.balance || 0} <span className="referral-star">⭐</span>
                </div>
              </div>
              <div className="details-card referral-stat-card">
                <div className="referral-stat-label">{t.friends}</div>
                <div className="referral-stat-number">
                  {referralData.totalReferrals || 0}
                </div>
              </div>
              <div className="details-card referral-stat-card">
                <div className="referral-stat-label">{t.earned}</div>
                <div className="referral-stat-number">
                  {referralData.totalEarned || 0} <span className="referral-star">⭐</span>
                </div>
              </div>
              <div className="details-card referral-stat-card">
                <div className="referral-stat-label">{t.withdrawn}</div>
                <div className="referral-stat-number">
                  {referralData.totalWithdrawn || 0} <span className="referral-star">⭐</span>
                </div>
              </div>
            </div>
            <div className="details-card">
              <div className="address-label">{t.invite}</div>
              <div className="wallet-address referral-link">
                {referralData.referralLink}
              </div>
              <div className="referral-actions">
                <button className="primary-button referral-copy-button" onClick={copyReferralLink}>
                  {linkCopied ? t.copiedLink : t.copyLink}
                </button>
                <button className="primary-button referral-share-button" onClick={shareReferralLink}>
                  {t.shareLink}
                </button>
              </div>
            </div>
            <div className="details-card">
              <p className="referral-info">
                {t.withdrawInfo.split("⭐")[0]}<span className="referral-info-star">⭐</span>{t.withdrawInfo.split("⭐")[1]}
              </p>
              <button
                className="primary-button large referral-withdraw-button"
                onClick={withdrawReferral}
                disabled={
                  withdrawLoading ||
                  Number(referralData.balance || 0) < 100
                }
              >
                {withdrawLoading ? t.loading : (
                  <>
                    {t.withdraw.split("⭐")[0]}<span className="referral-button-star">⭐</span>{t.withdraw.split("⭐")[1]}
                  </>
                )}
              </button>
            </div>
            <div className="referral-how-card">
              <h3>{t.howTitle}</h3>
              <p>{t.how1}</p>
              <p>{t.how2}</p>
              <p>{t.how3}</p>
              <p>{t.how4}</p>
            </div>
          </>
        ) : (
          <div className="details-card">
            <p>{t.error}</p>
            <button className="primary-button" onClick={loadReferral}>
              Спробувати ще раз
            </button>
          </div>
        )}
      </section>
    )}
      <footer className="footer">
        STARS DROP © 2026
      </footer>
    </div>
  );
}
