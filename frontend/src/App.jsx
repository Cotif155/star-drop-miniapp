import { useState } from "react";
import "./App.css";
const wallets = {
  TON: "UQCJyWTilVY1vHFWpHqCBD_DnEuBEGJ4H0itRXiqBSRg9Ozd",
  USDT: "THAawvogg5GHzfGVMZoWLSWKXQGCNxLqSY",
};
const packages = [
  { stars: 100, usd: 1.95, ton: 1.46, old: 2.39 },
  { stars: 150, usd: 2.93, ton: 2.19, old: 3.69 },
  { stars: 250, usd: 4.88, ton: 3.65, old: 6.09 },
  { stars: 350, usd: 6.83, ton: 5.12, old: 8.49 },
  { stars: 500, usd: 9.75, ton: 7.31, old: 11.99 },
  { stars: 750, usd: 14.63, ton: 10.96, old: 17.99 },
  { stars: 1000, usd: 19.50, ton: 14.61, old: 23.99 },
  { stars: 1500, usd: 29.25, ton: 21.93, old: 36.49 },
  { stars: 2500, usd: 48.75, ton: 36.54, old: 60.99 },
  { stars: 5000, usd: 97.50, ton: 73.09, old: 119 },
  { stars: 10000, usd: 195, ton: 146.17, old: 239 },
  { stars: 25000, usd: 487.50, ton: 365.42, old: 609 },
  { stars: 35000, usd: 682.50, ton: 511.59, old: 849 },
];
const words = {
  UA: {
    title: "Каталог Stars",
    subtitle: "Обирай свій пакет Telegram Stars",
    buy: "Обрати пакет",
    continue: "Продовжити",
    payment: "Спосіб оплати",
    choose: "Обери спосіб оплати",
    back: "Назад",
    amount: "До оплати",
    address: "Адреса гаманця",
    copy: "Копіювати адресу",
    copied: "Скопійовано!",
    paid: "Надіслати заявку",
    demo: "Демонстраційний режим",
    note: "Це демонстрація. Реальні платежі не підключені.",
    sending: "Надсилання...",
    success: "Заявку успішно надіслано!",
    error: "Не вдалося надіслати заявку. Спробуй ще раз.",
    savings: "Економія",
    reference: "Ціна Telegram",
  },
  RU: {
    title: "Каталог Stars",
    subtitle: "Выбирай пакет Telegram Stars",
    buy: "Выбрать пакет",
    continue: "Продолжить",
    payment: "Способ оплаты",
    choose: "Выбери способ оплаты",
    back: "Назад",
    amount: "К оплате",
    address: "Адрес кошелька",
    copy: "Копировать адрес",
    copied: "Скопировано!",
    paid: "Отправить заявку",
    demo: "Демонстрационный режим",
    note: "Это демонстрация. Реальные платежи не подключены.",
    sending: "Отправка...",
    success: "Заявка успешно отправлена!",
    error: "Не удалось отправить заявку. Попробуй ещё раз.",
    savings: "Экономия",
    reference: "Цена Telegram",
  },
  EN: {
    title: "Stars Catalog",
    subtitle: "Choose your Telegram Stars package",
    buy: "Choose package",
    continue: "Continue",
    payment: "Payment method",
    choose: "Choose payment method",
    back: "Back",
    amount: "Amount to pay",
    address: "Wallet address",
    copy: "Copy address",
    copied: "Copied!",
    paid: "Send request",
    demo: "Demo mode",
    note: "This is a demo. Real payments are not connected.",
    sending: "Sending...",
    success: "Request sent successfully!",
    error: "Could not send request. Please try again.",
    savings: "Savings",
    reference: "Telegram price",
  },
};
export default function App() {
  const [language, setLanguage] = useState("UA");
  const [screen, setScreen] = useState("catalog");
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const t = words[language];
  const wallet = method ? wallets[method] : "";
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

          method,

          username: telegramUser?.username || "Не вказаний",userId: 
telegramUser?.id || "Не отриманий",
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
          <div className="package-list">
            {packages.map((item) => (
              <div className="package-card" key={item.stars}>
                <div className="package-top">
                  <div>
                    <h2>⭐ {item.stars.toLocaleString("en-US")}</h2>
                    <p>Telegram Stars</p>
                  </div>
                  <div className="price-block">
                    <strong>${money(item.usd)}</strong>
                    <span>{money(item.ton)} TON</span>
                  </div>
                </div>
                <div className="package-info">
                  <span>{t.reference}: ${money(item.old)}</span>
                  <span className="saving">
                    -{Math.round((1 - item.usd / item.old) * 100)}%
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
      )}{screen === "order" && selected && (
        <section className="content-screen">
          <button className="back-button" onClick={goBack}>
            ← {t.back}
          </button>
          <h1>⭐ {selected.stars.toLocaleString("en-US")} Stars</h1>
          <p className="muted">STARS DROP</p>
          <div className="details-card">
            <div className="detail-row">
              <span>{t.amount}</span>
              <strong>${money(selected.usd)}</strong>
            </div>
            <div className="detail-row">
              <span>TON</span>
              <strong>{money(selected.ton)} TON</strong>
            </div>
            <div className="detail-row">
              <span>{t.reference}</span>
              <strong>${money(selected.old)}</strong>
            </div>
            <div className="detail-row">
              <span>{t.savings}</span>
              <strong className="saving">
                {Math.round((1 - selected.usd / selected.old) * 100)}%
              </strong>
            </div>
          </div>
          <button
            className="primary-button large"
            onClick={() => setScreen("payment")}
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
          <p className="muted">{t.choose}</p>
          {!method ? (
            <div className="payment-options">
              <button
                className="payment-option"
                onClick={() => {
                  setMethod("TON");
                  setCopied(false);
                }}
              >
                <span className="coin-icon ton-icon">T</span>
                <span>
                  <strong>TON</strong>
                  <small>Мережа: TON</small>
                </span>
                <span>›</span>
              </button>
              <button
                className="payment-option"
                onClick={() => {
                  setMethod("USDT");
                  setCopied(false);
                }}
              >
                <span className="coin-icon usdt-icon">$</span>
                <span>
                  <strong>USDT</strong>
                  <small>Мережа: TRC20</small>
                </span>
                <span>›</span>
              </button>
            </div>
          ) : (
            <div className="details-card payment-details">
              <div className="demo-label">{t.demo}</div>
              <h2>{method}</h2>
              <div className="amount-label">{t.amount}</div>
              <div className="amount-value">
                {method === "TON"
                  ? `${money(selected.ton)} TON`
                  : `${money(selected.usd)} USDT`}
              </div>
              <div className="address-label">{t.address}</div>
              <div className="wallet-address">{wallet}</div>
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
          )}

        </section>

      )}

      <footer className="footer">STARS DROP © 2026</footer>

    </div>

  );

}
