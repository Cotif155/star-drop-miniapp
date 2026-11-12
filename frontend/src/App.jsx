import { useState } from "react";
import "./App.css";
const wallets = {
  USDT: "THAawvogg5GHzfGVMZoWLSWKXQGCNxLqSY",
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
    reward: "Отримуй 5 ⭐ за кожного нового друга",
    loading: "Завантаження...",
    balance: "Твій баланс",
    friends: "Запрошені друзі",
    earned: "Усього зароблено",
    withdrawn: "Усього виведено",
    invite: "Твоє реферальне посилання",
    copyLink: "Копіювати посилання",
    copiedLink: "Посилання скопійовано!",
    withdrawInfo: "Мінімальне виведення — 100 ⭐",
    withdraw: "Вивести 100 ⭐",
    withdrawSuccess: "Заявку на виведення надіслано!",
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
    reward: "Получай 5 ⭐ за каждого нового друга",
    loading: "Загрузка...",
    balance: "Твой баланс",
    friends: "Приглашённые друзья",
    earned: "Всего заработано",
    withdrawn: "Всего выведено",
    invite: "Твоя реферальная ссылка",
    copyLink: "Копировать ссылку",
    copiedLink: "Ссылка скопирована!",
    withdrawInfo: "Минимальный вывод — 100 ⭐",
    withdraw: "Вывести 100 ⭐",
    withdrawSuccess: "Заявка на вывод отправлена!",
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
    reward: "Get 5 ⭐ for every new friend",
    loading: "Loading...",
    balance: "Your balance",
    friends: "Invited friends",
    earned: "Total earned",
    withdrawn: "Total withdrawn",
    invite: "Your referral link",
    copyLink: "Copy link",
    copiedLink: "Link copied!",
    withdrawInfo: "Minimum withdrawal — 100 ⭐",
    withdraw: "Withdraw 100 ⭐",
    withdrawSuccess: "Withdrawal request sent!",
  },
};
export default function App() {
  const [language, setLanguage] = useState("UA");
  const [screen, setScreen] = useState("catalog");
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const t = words[language];
  const wallet = wallets.USDT;
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
  function goBack() {
    setCopied(false);
    if (method) {
      setMethod(null);
    } else if (screen === "payment") {
      setScreen("order");
    } else {
      setScreen("catalog");
    }
  }
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">⭐ STARS DROP</div>
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
          <section className="hero">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </section>
          <button
            className="secondary-button referral-open"
            onClick={loadReferral}
          >
            ⭐ {t.referral}
          </button>

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
        </>
      )}
      {screen === "order" && selected && (
        <section className="content-screen">
          <button className="back-button" onClick={goBack}>
            ← {t.back}
          </button>
          <h1>
            ⭐ {selected.stars.toLocaleString("en-US")} Stars
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
    {screen === "referral" && (
      <section className="content-screen referral-screen">
        <button className="back-button" onClick={() => setScreen("catalog")}>
          ← {t.back}
        </button>
        <section className="hero">
          <h1>⭐ {t.referral}</h1>
          <p>{t.reward}</p>
        </section>
        {referralLoading ? (
          <div className="details-card">
            <p>{t.loading}</p>
          </div>
        ) : referralData ? (
          <>
            <div className="details-card referral-balance">
              <div className="referral-stat-label">{t.balance}</div>
              <div className="referral-big-number">
                {referralData.balance || 0} ⭐
              </div>
            </div>
            <div className="referral-stats">
              <div className="details-card">
                <div className="referral-stat-label">{t.friends}</div>
                <div className="referral-stat-number">
                  {referralData.totalReferrals || 0}
                </div>
              </div>
              <div className="details-card">
                <div className="referral-stat-label">{t.earned}</div>
                <div className="referral-stat-number">
                  {referralData.totalEarned || 0} ⭐
                </div>
              </div>
              <div className="details-card">
                <div className="referral-stat-label">{t.withdrawn}</div>
                <div className="referral-stat-number">
                  {referralData.totalWithdrawn || 0} ⭐
                </div>
              </div>
            </div>
            <div className="details-card">
              <div className="address-label">{t.invite}</div>
              <div className="wallet-address referral-link">
                {referralData.referralLink}
              </div>
              <button className="primary-button" onClick={copyReferralLink}>
                {linkCopied ? t.copiedLink : t.copyLink}
              </button>
            </div>
            <div className="details-card">
              <p className="referral-info">{t.withdrawInfo}</p>
              <button
                className="primary-button large"
                onClick={withdrawReferral}
                disabled={
                  withdrawLoading ||
                  Number(referralData.balance || 0) < 100
                }
              >
                {withdrawLoading ? t.loading : t.withdraw}
              </button>
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
