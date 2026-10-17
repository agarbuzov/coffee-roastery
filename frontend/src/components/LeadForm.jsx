import { useEffect, useRef, useState } from 'react'
import { API_URL, SUPPORT_PHONE, SUPPORT_TEL } from '../config.js'
import { getAttribution } from '../attribution.js'

const PHONE_RE = /^(?:\+?375|80)(25|29|33|44)\d{7}$/
const PHONE_ERR = 'Введите белорусский номер в формате +375 29 123-45-67 (коды операторов: 25, 29, 33, 44)'
const FIELDS = ['name', 'phone', 'interest', 'comment']
const INTERESTS = [
  ['subscription', 'Подписка'],
  ['one_time', 'Разовый заказ'],
  ['question', 'Вопрос'],
]
const EMPTY = { name: '', phone: '', interest: '', comment: '' }

const isPhoneValid = (v) => PHONE_RE.test(v.replace(/[\s\-()]/g, ''))

function validate(v) {
  const e = {}
  if (v.name.trim().length < 2) e.name = 'Введите имя — не короче двух символов'
  if (!isPhoneValid(v.phone.trim())) e.phone = PHONE_ERR
  if (!v.interest) e.interest = 'Выберите, что вас интересует'
  return e
}

export default function LeadForm({ prefill }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})     // { phone: 'текст ошибки', ... }
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [failure, setFailure] = useState(null) // { title, text } — ошибка отправки
  const [attribution] = useState(getAttribution)

  const formRef = useRef(null)
  const nameRef = useRef(null)
  const bannerRef = useRef(null)
  const doneRef = useRef(null)
  const sendingRef = useRef(false)

  // Клик по товару в каталоге заполняет форму
  useEffect(() => {
    if (!prefill) return
    setStatus('idle')
    setForm((f) => ({ ...f, interest: prefill.interest, comment: prefill.comment }))
    setErrors((e) => ({ ...e, interest: undefined }))
    const t = setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 50)
    return () => clearTimeout(t)
  }, [prefill])

  useEffect(() => { if (failure) bannerRef.current?.focus() }, [failure])
  useEffect(() => { if (status === 'done') doneRef.current?.focus() }, [status])

  const focusInvalid = () =>
    setTimeout(() => formRef.current?.querySelector('.invalid input, .invalid textarea')?.focus(), 0)

  const change = (key) => (ev) => {
    setForm((f) => ({ ...f, [key]: ev.target.value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onPhoneBlur = () => {
    const v = form.phone.trim()
    if (v && !isPhoneValid(v)) setErrors((e) => ({ ...e, phone: PHONE_ERR }))
  }

  const fail = (title, text) =>
    setFailure({
      title,
      text: text || `Данные в форме сохранены. Нажмите «Отправить ещё раз» или позвоните нам: ${SUPPORT_PHONE}.`,
    })

  // Ошибки валидации от бэкенда: {fields:[...]} или стандартный FastAPI {detail:[...]}
  function applyServerErrors(data) {
    const list = Array.isArray(data?.fields)
      ? data.fields.map((f) => [f.field, f.message])
      : (data?.detail || []).map((d) => {
          const field = d.loc?.[d.loc.length - 1]
          return [field, field === 'phone' ? PHONE_ERR : d.msg]
        })
    const next = {}
    for (const [field, msg] of list) if (FIELDS.includes(field)) next[field] = msg
    if (Object.keys(next).length) {
      setErrors(next)
      focusInvalid()
    } else {
      fail('Не удалось отправить заявку', data?.message)
    }
  }

  async function submit(ev) {
    ev?.preventDefault()
    if (sendingRef.current) return
    setFailure(null)

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      focusInvalid()
      return
    }

    if (!navigator.onLine) {
      fail('Нет соединения с интернетом', 'Проверьте сеть и нажмите «Отправить ещё раз».')
      return
    }

    sendingRef.current = true
    setStatus('sending')
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          interest: form.interest,
          comment: form.comment.trim() || null,
          attribution,
        }),
      })

      if (res.ok) {
        setStatus('done')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (res.status === 422) applyServerErrors(data)
      else if (res.status === 429) fail('Слишком много попыток', `Подождите минуту и отправьте заявку ещё раз или позвоните: ${SUPPORT_PHONE}.`)
      else fail('Не удалось отправить заявку', data?.message)
    } catch {
      fail('Не удалось отправить заявку', `Сервер не отвечает. Данные в форме сохранены — попробуйте ещё раз через минуту или позвоните: ${SUPPORT_PHONE}.`)
    } finally {
      clearTimeout(timer)
      sendingRef.current = false
      setStatus((s) => (s === 'sending' ? 'idle' : s))
    }
  }

  function sendAnother() {
    setForm(EMPTY)
    setErrors({})
    setFailure(null)
    setStatus('idle')
  }

  if (status === 'done') {
    return (
      <div className="done" ref={doneRef} tabIndex={-1}>
        <h3>Заявка отправлена</h3>
        <p>Менеджер перезвонит вам в рабочее время. Если вопрос срочный, позвоните: <a href={SUPPORT_TEL}>{SUPPORT_PHONE}</a>.</p>
        <button className="btn ghost sm" type="button" onClick={sendAnother}>Отправить ещё одну заявку</button>
      </div>
    )
  }

  return (
    <form ref={formRef} noValidate onSubmit={submit}>
      {failure && (
        <div className="banner show" ref={bannerRef} role="alert" tabIndex={-1}>
          <strong>{failure.title}</strong>
          <span>{failure.text}</span>
          <div className="acts">
            <button className="btn sm" type="button" onClick={submit}>Отправить ещё раз</button>
            <a className="btn ghost sm" href={SUPPORT_TEL}>Позвонить</a>
          </div>
        </div>
      )}

      <div className={'field' + (errors.name ? ' invalid' : '')}>
        <label htmlFor="name">Имя</label>
        <input id="name" ref={nameRef} type="text" autoComplete="given-name" maxLength={100}
               value={form.name} onChange={change('name')} aria-invalid={!!errors.name} />
        <p className="err">{errors.name}</p>
      </div>

      <div className={'field' + (errors.phone ? ' invalid' : '')}>
        <label htmlFor="phone">Телефон</label>
        <input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+375 29 123-45-67"
               value={form.phone} onChange={change('phone')} onBlur={onPhoneBlur} aria-invalid={!!errors.phone} />
        <p className="hint">Белорусский номер: +375 29 123-45-67</p>
        <p className="err">{errors.phone}</p>
      </div>

      <fieldset className={errors.interest ? 'invalid' : ''}>
        <legend>Что интересует</legend>
        <div className="seg">
          {INTERESTS.map(([value, label]) => (
            <span key={value} style={{ display: 'contents' }}>
              <input id={`i-${value}`} type="radio" name="interest" value={value}
                     checked={form.interest === value} onChange={change('interest')} />
              <label htmlFor={`i-${value}`}>{label}</label>
            </span>
          ))}
        </div>
        <p className="err">{errors.interest}</p>
      </fieldset>

      <div className={'field' + (errors.comment ? ' invalid' : '')}>
        <label htmlFor="comment">Комментарий <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(необязательно)</span></label>
        <textarea id="comment" maxLength={1000} value={form.comment} onChange={change('comment')} />
        <p className="err">{errors.comment}</p>
      </div>

      <button className="btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
      </button>
    </form>
  )
}
