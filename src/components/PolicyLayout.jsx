import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { policyLinks } from '../data/policies.js'

export default function PolicyLayout({ policy }) {
  const related = policyLinks.filter(item => item.slug !== policy.slug)
  const [activeSection, setActiveSection] = useState(policy.sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActiveSection(visible[0].target.id)
    }, { rootMargin: '-14% 0px -72% 0px', threshold: 0 })
    policy.sections.forEach(section => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [policy])

  return (
    <main className="wrap page policy-page">
      <nav className="policy-breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link><span>/</span><span>Chính sách</span><span>/</span><span>{policy.title}</span>
      </nav>
      <header className="policy-header">
        <span className="eyebrow blue">PC TECH STORE · THÔNG TIN KHÁCH HÀNG</span>
        <h1>{policy.title}</h1>
        <p>{policy.description}</p>
        <div className="policy-draft"><strong>BẢN DỰ THẢO — CHƯA ĐƯỢC CHỦ CỬA HÀNG PHÊ DUYỆT</strong><span>Chưa có ngày hiệu lực. Nội dung cần được xác nhận trước khi áp dụng.</span></div>
      </header>
      <div className="policy-layout">
        <aside className="policy-toc">
          <h2>Trong trang này</h2>
          <ol>{policy.sections.map(section => <li key={section.id}><a className={activeSection === section.id ? 'active' : ''} aria-current={activeSection === section.id ? 'location' : undefined} href={`#${section.id}`}>{section.title}</a></li>)}</ol>
        </aside>
        <article className="policy-article">
          {policy.sections.map(section => (
            <section className="policy-section" id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
            </section>
          ))}
        </article>
      </div>
      <section className="policy-contact">
        <div><span className="eyebrow blue">CẦN HỖ TRỢ?</span><h2>Liên hệ PC TECH STORE</h2><p>Thông tin liên hệ trên website hiện là dữ liệu mẫu của đồ án. Vui lòng xác nhận kênh liên hệ chính thức trước khi công bố hoặc gửi thông tin cá nhân.</p></div>
        <Link className="btn ghost" to="/gioi-thieu">Thông tin liên hệ <span aria-hidden="true">→</span></Link>
      </section>
      <nav className="policy-related" aria-label="Chính sách liên quan">
        <h2>Chính sách liên quan</h2>
        <div>{related.map(item => <Link key={item.slug} to={`/chinh-sach/${item.slug}`}>{item.title}<span aria-hidden="true"> →</span></Link>)}</div>
      </nav>
    </main>
  )
}
