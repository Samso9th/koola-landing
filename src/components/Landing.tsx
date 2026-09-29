'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Brand from './Brand';
import { copy, type Lang, type Role } from './copy';

gsap.registerPlugin(ScrollTrigger);
const roles: Role[] = ['customer', 'vendor', 'rider', 'affiliate'];
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [menu, setMenu] = useState(false);
  const [paused, setPaused] = useState(false);
  const [meal, setMeal] = useState(0);
  const [role, setRole] = useState<Role>('customer');
  const [status, setStatus] = useState<'idle'|'saving'|'success'|'error'>('idle');
  const [error, setError] = useState('');
  const t = copy[lang];
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  useEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia(root);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.hero-line', { y: 60, opacity: 0, rotationX: -12, duration: .9, stagger: .11, ease: 'power3.out' });
      gsap.from('.hero-copy > p, .hero-actions, .hero-footnote', { y: 16, opacity: 0, delay: .3, stagger: .08, duration: .7, ease: 'power3.out' });
      gsap.from('.plate-float', { scale: .84, rotation: -12, opacity: 0, duration: 1.2, ease: 'power3.out' });
      gsap.to('.plate-float', { y: -13, rotation: 2, duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2 });
      gsap.to('.orbit-label', { rotation: 360, duration: 80, repeat: -1, ease: 'none' });
      gsap.from('.food-tag', { y: 24, rotation: -10, opacity: 0, delay: .6, duration: .8, ease: 'back.out(1.3)' });
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => gsap.from(el, {
        y: 35, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      }));
      const elem = stage.current;
      const tilt = elem?.querySelector('.plate-tilt');
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || !elem || !tilt) return;
        const b = elem.getBoundingClientRect();
        gsap.to(tilt, { rotationY: (e.clientX - b.left - b.width / 2) / b.width * 12, rotationX: -(e.clientY - b.top - b.height / 2) / b.height * 12, duration: .6, ease: 'power2.out', overwrite: true });
      };
      const leave = () => { if (tilt) gsap.to(tilt, { rotationX: 0, rotationY: 0, duration: .7, overwrite: true }); };
      elem?.addEventListener('pointermove', move);
      elem?.addEventListener('pointerleave', leave);
      const visibility = () => { gsap.globalTimeline.paused(document.hidden); };
      document.addEventListener('visibilitychange', visibility);
      return () => { elem?.removeEventListener('pointermove', move); elem?.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility); if (tilt) gsap.set(tilt, { clearProps: 'transform' }); gsap.globalTimeline.paused(false); };
    });
    return () => mm.revert();
  }, [paused]);
  const chooseRole = (next: Role) => {
    setRole(next); setStatus('idle');
    document.querySelector('#join')?.scrollIntoView({ behavior: 'auto' });
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#signup-name')?.focus({ preventScroll: true }), 0);
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (status === 'saving') return;
    const data = new FormData(e.currentTarget);
    setStatus('saving'); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ name: data.get('name'), email: data.get('email'), phone: data.get('phone'), city: data.get('city'), role, consent: data.get('consent') === 'on', website: data.get('website') || '' }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error(({ invalid_lead: 'Please check your name, email and Nigerian phone number, then try again.', rate_limited: 'Too many attempts. Please wait a few minutes and try again.', service_unavailable: 'Signups are temporarily unavailable. Please try again shortly.' } as Record<string,string>)[result?.error] || t.error);
      setStatus('success');
    } catch (err) { setError(err instanceof Error && err.name !== 'AbortError' ? err.message : t.error); setStatus('error'); }
    finally { clearTimeout(timeout); }
  }
  return <div ref={root} className={paused ? 'site motion-paused' : 'site'}>
    <a className="skip" href="#main">{lang === 'en' ? 'Skip to content' : 'Tsallaka zuwa abun ciki'}</a>
    <header className="site-header">
      <a href="#" className="brand-link" aria-label="Koola home"><Brand /></a>
      <nav className={menu ? 'main-nav open' : 'main-nav'} aria-label={lang === 'en' ? 'Main navigation' : 'Babban menu'}>
        {['how', 'together', 'questions'].map((id, i) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{t.nav[i]}</a>)}
      </nav>
      <div className="header-actions"><button className="language" type="button" onClick={() => setLang(lang === 'en' ? 'ha' : 'en')} aria-label={lang === 'en' ? 'Switch to Hausa' : 'Switch to English'}>{lang === 'en' ? 'HA' : 'EN'} <span aria-hidden="true">↗</span></button><a className="button button-small header-join" href="#join">{t.join} <span aria-hidden="true">↗</span></a><button className="menu-button" type="button" aria-expanded={menu} onClick={() => setMenu(!menu)} aria-label={menu ? t.close : t.menu}>{menu ? '×' : '☰'}</button></div>
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy"><p className="eyebrow"><span className="status-dot" />{t.coming}</p><h1 id="hero-heading"><span className="hero-line">{t.title[0]}</span><span className="hero-line second-line">{t.title[1]}</span></h1><p className="hero-intro">{t.intro}</p><div className="hero-actions"><a className="button button-primary" href="#join">{t.join}<span aria-hidden="true">↗</span></a><span className="small-note">{t.heroNote}</span></div><div className="hero-footnote"><span className="city-pips" aria-hidden="true"><i>K</i><i>K</i></span>{t.cities}</div></div>
        <div className="hero-visual" ref={stage}><div className="sun-disc" aria-hidden="true"/><div className="orbit-label" aria-hidden="true"><span>KOOLA</span><span>GOOD FOOD</span><span>GOOD MOOD</span></div><div className="plate-tilt"><div className="plate-float"><Image className={meal===0 ? 'plate active' : 'plate'} src="/media/koola-food-hero.png" width={1536} height={1024} alt={meal===0 ? 'Jollof rice with grilled chicken and golden plantain on a cream plate' : ''} priority /><Image className={meal===1 ? 'plate masa active' : 'plate masa'} src="/media/koola-masa.png" width={1320} height={1168} alt={meal===1 ? 'Golden masa with pepper dipping sauce on a cream plate' : ''} /></div></div><div className="food-tag"><span className="food-tag-top">{t.taste}</span><strong>{t.dish[meal]}</strong><span>{t.dishNote[meal]}</span><div className="tag-dots" aria-label={lang==='en' ? 'Choose a dish to preview' : 'Zaɓi abinci'}>{t.dish.map((dish,i)=><button key={dish} type="button" aria-label={dish} aria-pressed={meal===i} onClick={()=>setMeal(i)}><span/></button>)}</div></div><button type="button" className="motion-toggle" onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused ? '▷' : 'Ⅱ'} {paused ? t.play : t.pause}</button></div>
      </section>
      <div className="city-ribbon" aria-hidden="true"><span>KANO</span><i>✳</i><span>KATSINA</span><i>✳</i><span>{t.scroll}</span><i>✳</i><span>KANO</span><i>✳</i><span>KATSINA</span></div>
      <section id="how" className="how section-shell"><div className="section-heading" data-reveal><p className="eyebrow">{t.howLabel}</p><h2>{t.howTitle}</h2></div><div className="steps">{t.steps.map(([title,body],i)=><article className="step" key={i} data-reveal><div className="step-number">0{i+1}<span aria-hidden="true">↗</span></div><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section className="channels section-shell"><div className="channel-copy" data-reveal><p className="eyebrow">{t.channelLabel}</p><h2>{t.channelTitle}</h2><p>{t.channelBody}</p><div className="channel-list">{['iOS & Android', 'WhatsApp', 'Telegram', lang==='en' ? 'Web ordering' : 'Yanar gizo'].map(channel=><div key={channel}><span>{channel}</span><small>{t.soon}</small></div>)}</div></div><div className="phone-scene" data-reveal><span className="phone-caption">{lang==='en' ? 'A little preview of what’s cooking.' : 'Ga ɗan abin da muke shiryawa.'}</span><div className="phone"><div className="phone-camera"/><div className="phone-top"><Brand/><span>09:41</span></div><p className="phone-eyebrow">{lang==='en' ? 'A GOOD DAY FOR GOOD FOOD' : 'RANAR ABINCI MAI DAƊI'}</p><h3>{lang==='en' ? 'What sounds good?' : 'Me kake so?'}</h3><div className="phone-pills"><span>{lang==='en' ? 'For you' : 'Domin kai'}</span><span>Masa</span><span>Jollof</span></div><div className="phone-meal"><Image src="/media/koola-food-hero.png" width={400} height={267} alt=""/><span>{t.dish[0]}</span><small>{lang==='en' ? 'Something to look forward to.' : 'Abin da za mu jira.'}</small></div><div className="phone-note">{t.soon} <span aria-hidden="true">↗</span></div></div><span className="scene-sticker">{lang==='en' ? 'Good food,\ngood mood.' : 'Abinci\nmai daɗi.'}</span></div></section>
      <section id="together" className="community section-shell"><div className="community-heading" data-reveal><p className="eyebrow">{t.communityLabel}</p><h2>{t.communityTitle}</h2><p>{t.communityBody}</p></div><div className="partner-list">{t.roles.map(([key,title,body,cta],i)=><article key={key} data-reveal><span className="partner-index">0{i+1}</span><div><h3>{title}</h3><p>{body}</p></div><button type="button" onClick={()=>chooseRole(key as Role)}>{cta}<span aria-hidden="true">↗</span></button></article>)}</div></section>
      <section id="questions" className="faq section-shell"><div data-reveal><p className="eyebrow">{lang==='en' ? 'BEFORE YOUR FIRST ORDER' : 'KAFIN ODARKA TA FARKO'}</p><h2>{t.faqTitle}</h2></div><div className="faq-list">{t.faqs.map(([q,a])=><details key={q}><summary>{q}<span className="faq-plus" aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
      <section id="join" className="join section-shell"><div className="join-copy" data-reveal><p className="eyebrow">{t.formLabel}</p><h2>{t.formTitle}</h2><p>{t.formBody}</p><div className="join-art" aria-hidden="true"><span className="carrier-only"><Image src="/brand/koola-master.png" alt="" width={1536} height={1024}/></span><span className="join-city">KANO<br/>KATSINA</span></div></div><div className="form-panel">{status==='success' ? <div className="success" role="status"><span aria-hidden="true">✓</span><h3>{t.success}</h3><p>{t.successBody}</p><button className="button" type="button" onClick={()=>setStatus('idle')}>{t.another}</button></div> : <form onSubmit={submit}>
        <fieldset className="role-picker"><legend>{t.role}</legend>{roles.map((r,i)=><label key={r} className={r===role ? 'selected' : ''}><input type="radio" name="role" value={r} checked={role===r} onChange={()=>setRole(r)}/>{t.roleNames[i]}</label>)}</fieldset>
        <label htmlFor="signup-name">{t.name}</label><input id="signup-name" name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder={lang==='en' ? 'First and last name' : 'Suna da sunan mahaifi'}/>
        <label htmlFor="signup-email">{t.email}</label><input id="signup-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com"/>
        <div className="form-row"><div><label htmlFor="signup-phone">{t.phone}</label><input id="signup-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={10} maxLength={20} placeholder="0801 234 5678"/></div><div><label htmlFor="signup-city">{t.city}</label><select id="signup-city" name="city" required defaultValue=""><option value="" disabled>{lang==='en' ? 'Choose city' : 'Zaɓi gari'}</option><option>Kano</option><option>Katsina</option></select></div></div>
        <div className="honey" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
        <label className="consent"><input type="checkbox" name="consent" required/><span>{t.consent}</span></label><p className="data-note">{t.data}</p>
        {status==='error' && <p className="form-error" role="alert">{lang==='en' ? error : t.error}</p>}
        <button type="submit" className="button form-submit" disabled={status==='saving'}>{status==='saving' ? t.pending : t.submit}<span aria-hidden="true">↗</span></button>
      </form>}</div></section>
    </main><footer className="footer"><div><Brand large/><p>{t.footer}</p></div><div><p>{t.rights}</p><span>koola.store</span><p className="footer-small">© {new Date().getFullYear()} Koola</p></div></footer>
  </div>;
}
