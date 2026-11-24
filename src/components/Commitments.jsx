import { Link } from 'react-router-dom'
import { PackageCheck, ShieldCheck, Truck, Wrench } from 'lucide-react'

const items = [
  { slug: 'warranty', Icon: ShieldCheck, title: 'An tâm chính hãng', detail: 'Bảo hành theo tiêu chuẩn hãng' },
  { slug: 'shipping', Icon: Truck, title: 'Giao hàng toàn quốc', detail: 'Miễn phí đơn từ 2 triệu' },
  { Icon: Wrench, title: 'Kỹ thuật tận tâm', detail: 'Hỗ trợ trước và sau mua' },
  { slug: 'return', Icon: PackageCheck, title: 'Đổi trả dễ dàng', detail: 'Xem điều kiện đổi trả' },
]

export default function Commitments() {
  return <section className="wrap benefits">{items.map(({ slug, Icon, title, detail }) => {
    const content = <><Icon/><strong>{title}</strong><span>{detail}</span></>
    return slug ? <Link className="benefit-link" to={`/chinh-sach/${slug}`} key={title}>{content}</Link> : <div key={title}>{content}</div>
  })}</section>
}
