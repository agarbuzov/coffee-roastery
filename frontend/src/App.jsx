import { useState } from 'react'
import LeadForm from './components/LeadForm.jsx'
import { SUPPORT_PHONE, SUPPORT_TEL } from './config.js'

const ADDRESS = 'Минск, ул. Короля, 9'
const HOURS = [['пн–пт', '8:00–20:00'], ['сб–вс', '10:00–18:00']]

const PRODUCTS = [
  { name: 'Эфиопия Иргачеффе', notes: 'Цветочный, бергамот, светлая обжарка', meta: '250 г', price: '32 BYN', roast: 'var(--r2)', order: 'Эфиопия Иргачеффе, 250 г' },
  { name: 'Колумбия Уила', notes: 'Карамель, красное яблоко', meta: '250 г', price: '29 BYN', roast: 'var(--r4)', order: 'Колумбия Уила, 250 г' },
  { name: 'Бразилия Серрадо', notes: 'Орех, шоколад, под эспрессо', meta: '250 г', price: '26 BYN', roast: 'var(--r6)', order: 'Бразилия Серрадо, 250 г' },
  { name: 'Дрип-пакеты, ассорти', notes: '', meta: '10 штук', price: '18 BYN', roast: 'var(--r3)', order: 'Дрип-пакеты, ассорти, 10 штук' },
]

const WEEK = [
  ['Пн'], ['Вт'], ['Ср'],
  ['Чт', 'жарим', 'roast'],
  ['Пт', 'везём', 'ship'],
  ['Сб'], ['Вс'],
]

const FACTS = [
  ['2019', 'с этого года обжариваем сами'],
  ['5 кг', 'размер одной партии'],
  ['1–3 дня', 'от обжарки до вашей кухни'],
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
          <a className="logo" href="#top">Кварта</a>
          <nav aria-label="Разделы">
            <a href="#products">Кофе</a>
            <a href="#delivery">Доставка</a>
            <a href="#order">Контакты</a>
          </nav>
          <a className="btn sm" href="#order">Оставить заявку</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <h1>Жарим в четверг, привозим в пятницу</h1>
            <p className="sub-text">Небольшая обжарка в Минске. Кофе приезжает к вам на 1–3 день после обжарки, пока он пахнет так, как задумано.</p>
            <div className="actions">
              <a className="btn" href="#order">Заказать кофе</a>
              <a className="btn ghost" href="#products">Что жарим</a>
            </div>
            <div className="week" aria-hidden="true">
              {WEEK.map(([day, label, kind]) => (
                <div key={day} className={'day' + (kind ? ' ' + kind : '')}>
                  <b>{day}</b>{label}
                </div>
              ))}
            </div>
            <p className="week-note">Четверг — обжарка. Пятница — развозим заказы по Минску.</p>
          </div>
        </section>

        <section className="about" id="about">
          <div className="wrap">
            <div>
              <h2>Кто мы и почему важна свежесть</h2>
              <p>Мы — Аня и Дмитрий. Раньше работали бариста, а с 2019 года обжариваем кофе сами: небольшими партиями по 5 кг.</p>
              <p>Свежий кофе пахнет ярче и вкуснее заваривается, со временем аромат уходит. Поэтому мы жарим по четвергам, а в пятницу уже везём заказы.</p>
            </div>
            <div className="facts">
              {FACTS.map(([big, text]) => (
                <div className="fact" key={big}><b>{big}</b><span>{text}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="products" id="products">
          <div className="wrap">
            <h2>Что жарим</h2>

            {PRODUCTS.map((p) => (
              <div key={p.name} className="item">
                <span className="bean" style={{ '--c': p.roast }} aria-hidden="true" />
                <div>
                  <h3>{p.name}</h3>
                  {p.notes && <p className="notes">{p.notes}</p>}
                </div>
                <div className="spec">
                  <span className="meta">{p.meta}</span>
                  <span className="price">{p.price}</span>
                </div>
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

        <section className="delivery" id="delivery">
          <div className="wrap">
            <h2>Доставка и самовывоз</h2>
            <div className="cards">
              <div className="card">
                <h3>Доставка по Минску</h3>
                <p>Развозим по пятницам. При заказе от 50 BYN доставка бесплатная.</p>
                <p>Подписка всегда приезжает бесплатно.</p>
              </div>
              <div className="card">
                <h3>Самовывоз</h3>
                <p>{ADDRESS}</p>
                <dl>
                  {HOURS.map(([d, t]) => (<span key={d} style={{ display: 'contents' }}><dt>{d}</dt><dd>{t}</dd></span>))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="order" id="order">
          <div className="wrap">
            <div>
              <h2>Оставьте заявку</h2>
              <p className="lead">Оставьте телефон: менеджер перезвонит и оформит заказ или подписку.</p>
              <div className="contacts">
                <div><span>Телефон</span><a href={SUPPORT_TEL}>{SUPPORT_PHONE}</a></div>
                <div><span>Адрес мастерской</span>{ADDRESS}</div>
                <div><span>Часы работы</span>{HOURS.map(([d, t]) => `${d} ${t}`).join(', ')}</div>
              </div>
            </div>
            <div>
              <LeadForm prefill={prefill} />
            </div>
          </div>
        </section>
      </main>

      <footer><div className="wrap">© Кварта · {ADDRESS}</div></footer>
    </>
  )
}
