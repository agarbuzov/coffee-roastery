const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'yclid']

// Источник заявки. Первая рекламная метка запоминается на время сессии.
export function getAttribution() {
  let saved = {}
  try { saved = JSON.parse(sessionStorage.getItem('lead_attr') || '{}') } catch {}

  const params = new URLSearchParams(location.search)
  const hasNew = KEYS.some((k) => params.get(k))

  if (hasNew || !saved.landing_url) {
    saved = {}
    for (const k of KEYS) {
      const v = params.get(k)
      if (v) saved[k] = v.slice(0, 255)
    }
    saved.landing_url = location.href.slice(0, 2048)
    if (document.referrer) saved.referrer = document.referrer.slice(0, 2048)
    try { sessionStorage.setItem('lead_attr', JSON.stringify(saved)) } catch {}
  }
  return saved
}
