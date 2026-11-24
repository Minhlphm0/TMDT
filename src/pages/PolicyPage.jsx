import { Link } from 'react-router-dom'
import PolicyLayout from '../components/PolicyLayout.jsx'
import { policies } from '../data/policies.js'

export default function PolicyPage({ slug }) {
  const policy = policies[slug]
  if (!policy) return <main className="wrap page"><h1>Không tìm thấy chính sách</h1><Link to="/">Về trang chủ</Link></main>
  return <PolicyLayout policy={policy} />
}
