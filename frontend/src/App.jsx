import { useState } from 'react'
import LeadForm from './components/LeadForm.jsx'
import { SUPPORT_PHONE, SUPPORT_TEL } from './config.js'

const BEANS = ['var(--r1)', 'var(--r2)', 'var(--r3)', 'var(--r4)', 'var(--r5)', 'var(--r6)', 'var(--r7)']

const PRODUCTS = [
  { name: 'Эфиопия Иргачеффе', notes: 'Цветочный, бергамот, светлая обжарка', meta: '250 г', price: '32 BYN', roast: 'var(--r2)', order: 'Эфиопия Иргачеффе, 250 г' },
  { name: 'Колумбия Уила', notes: 'Карамель, красное яблоко', meta: '250 г', price: '29 BYN', roast: 'var(--r4)', order: 'Колумбия Уила, 250 г' },
  { name: 'Бразилия Серрадо', notes: 'Орех, шоколад, под эспрессо', meta: '250 г', price: '26 BYN', roast: 'var(--r6)', order: 'Бразилия Серрадо, 250 г' },
  { name: 'Дрип-пакеты, ассорти', notes: 'Заварить можно в чашке, без кофеварки', meta: '10 штук', price: '18 BYN', roast: 'var(--r3)', order: 'Дрип-пакеты, ассорти, 10 штук' },
]

export default function App() {
  // Данные, которые карточка товара передаёт в форму
  const [prefill, setPrefill] = useState(null)

  function choose(interest, product) {
    setPrefill({ interest, comment: `Интересует: ${product}`, stamp: Date.now() })
    document.getElementById('order').scrollIntoView()
  }

  return (
    <>
      <header>
        <div className="wrap">
          <a className="logo" href="#top">Зерно</a>
          <a className="btn sm" href="#order">Оставить заявку</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <h1>Кофе, обжаренный маленькими партиями</h1>
            <p>Три сорта зерна, дрип-пакеты и подписка: две пачки в месяц и бесплатная доставка.</p>
            <a className="btn" href="#order">Заказать кофе</a>
            <div className="roast" aria-hidden="true">
              {BEANS.map((c) => <span key={c} className="bean" style={{ '--c': c }} />)}
            </div>
            <div className="roast-label" aria-hidden="true"><span>Светлая обжарка</span><span>Тёмная обжарка</span></div>
          </div>
        </section>

        <section className="products" id="products">
          <div className="wrap">
            <h2>Что обжариваем</h2>

            {PRODUCTS.map((p) => (
              <div key={p.name} className="item">
                <span className="bean" style={{ '--c': p.roast }} aria-hidden="true" />
                <div>
                  <h3>{p.name}</h3>
                  <p className="notes">{p.notes}</p>
                </div>
                <span className="meta">{p.meta}</span>
                <span className="price">{p.price}</span>
                <button className="btn ghost sm buy" type="button" onClick={() => choose('one_time', p.order)}>Заказать</button>
              </div>
            ))}

            <div className="sub">
              <div>
                <h3>Подписка</h3>
                <p>Две пачки по 250 г раз в месяц. Доставка бесплатно.</p>
              </div>
              <div className="right">
                <span className="price">54 BYN <small>/ мес</small></span>
                <button className="btn buy" type="button" onClick={() => choose('subscription', 'Подписка, 2 пачки по 250 г в месяц')}>Оформить подписку</button>
              </div>
            </div>
          </div>
        </section>

        <section className="order" id="order">
          <div className="wrap">
            <div>
              <h2>Оставьте заявку</h2>
              <p className="lead">Укажите телефон — менеджер перезвонит, уточнит детали и оформит заказ.</p>
              <p className="call">Удобнее позвонить? <a href={SUPPORT_TEL}>{SUPPORT_PHONE}</a></p>
            </div>
            <div>
              <LeadForm prefill={prefill} />
            </div>
          </div>
        </section>
      </main>

      <footer><div className="wrap">Зерно — обжарка кофе. Цены указаны в белорусских рублях.</div></footer>
    </>
  )
}
