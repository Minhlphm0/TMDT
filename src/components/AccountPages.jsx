import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, LogIn, LogOut, UserRound } from 'lucide-react'
import { authenticateAccount, registerAccount, saveAccountSession } from '../utils/account.js'

export function Auth({ register, setUser, notify }) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    setBusy(true)

    try {
      let account
      if (register) {
        if (data.password !== data.confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.')
        if (!data.acceptTerms) throw new Error('Vui lòng đồng ý với điều khoản sử dụng.')
        account = await registerAccount(localStorage, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        })
        saveAccountSession(localStorage, sessionStorage, account, true)
        notify('Đăng ký thành công')
      } else {
        account = await authenticateAccount(localStorage, data.identifier, data.password)
        saveAccountSession(localStorage, sessionStorage, account, remember)
        notify('Đăng nhập thành công')
      }

      setUser(account)
      navigate('/')
    } catch (error) {
      notify(error.message || 'Không thể hoàn tất thao tác.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="wrap page">
      <div className="auth-layout">
        <div className="auth-art">
          <span className="eyebrow blue">PC TECH STORE · MEMBER</span>
          <h1>Your setup.<br />Your <em>story.</em></h1>
          <p>Tham gia cộng đồng PC TECH để nhận tư vấn và cập nhật ưu đãi mới nhất.</p>
          <div className="auth-art-image">
            <img src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=85" alt="Góc máy tính" />
          </div>
        </div>

        <form className="form-panel auth-form" onSubmit={submit}>
          <span className="eyebrow blue">{register ? 'TẠO TÀI KHOẢN' : 'CHÀO MỪNG TRỞ LẠI'}</span>
          <h2>{register ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>
          <p>{register ? 'Theo dõi đơn hàng và lưu sản phẩm yêu thích.' : 'Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng.'}</p>

          {register ? (
            <>
              <AuthField label="Họ và tên" name="name" autoComplete="name" required />
              <AuthField label="Email" name="email" type="email" autoComplete="email" required />
              <AuthField label="Số điện thoại" name="phone" type="tel" autoComplete="tel" pattern="[0-9+().\s-]{9,18}" required />
            </>
          ) : (
            <AuthField label="Email hoặc số điện thoại" name="identifier" autoComplete="username" required />
          )}

          <label className="field password-field">
            Mật khẩu
            <input name="password" type={showPassword ? 'text' : 'password'} minLength={8} autoComplete={register ? 'new-password' : 'current-password'} required placeholder="Tối thiểu 8 ký tự" />
            <button className="password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {register && (
            <>
              <label className="field">
                Xác nhận mật khẩu
                <input name="confirmPassword" type={showPassword ? 'text' : 'password'} minLength={8} autoComplete="new-password" required placeholder="Nhập lại mật khẩu" />
              </label>
              <label className="terms-check"><input name="acceptTerms" type="checkbox" required />Tôi đồng ý với điều khoản sử dụng.</label>
              <p className="security-note">Mật khẩu được băm bằng PBKDF2 có salt trước khi lưu trên thiết bị.</p>
            </>
          )}

          {!register && (
            <div className="auth-options">
              <label className="terms-check"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />Ghi nhớ đăng nhập</label>
              <button type="button" className="text-button" onClick={() => notify('Khôi phục mật khẩu cần backend; đây là bản mô phỏng.')}>Quên mật khẩu?</button>
            </div>
          )}

          <button className="btn primary full" disabled={busy}>
            {busy ? 'Vui lòng chờ...' : register ? 'Đăng ký' : 'Đăng nhập'} <ArrowRight size={17} />
          </button>
          <div className="auth-switch">
            {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link to={register ? '/dang-nhap' : '/dang-ky'}>{register ? 'Đăng nhập' : 'Đăng ký ngay'}</Link>
          </div>
        </form>
      </div>
      <p className="demo-disclaimer">Tài khoản chỉ mô phỏng trên trình duyệt; không phải hệ thống xác thực bảo mật thực tế.</p>
    </main>
  )
}

function AuthField({ label, name, type = 'text', required, autoComplete, pattern }) {
  return <label className="field">{label}<input name={name} type={type} required={required} autoComplete={autoComplete} pattern={pattern} placeholder={label} /></label>
}

export function AccountProfile({ user, onLogout }) {
  if (!user) {
    return <main className="wrap page account-empty"><UserRound size={38} /><h1>Bạn chưa đăng nhập</h1><p>Đăng nhập để xem thông tin tài khoản và đơn hàng.</p><Link className="btn primary" to="/dang-nhap"><LogIn size={17} /> Đăng nhập</Link></main>
  }

  return (
    <main className="wrap page">
      <div className="breadcrumbs"><Link to="/">Trang chủ</Link><span>/</span>Thông tin tài khoản</div>
      <div className="page-title"><div><span className="eyebrow blue">TÀI KHOẢN CỦA BẠN</span><h1>Xin chào, <em>{user.name}</em></h1><p>Quản lý thông tin và theo dõi hoạt động mua sắm.</p></div></div>
      <section className="account-profile-card">
        <span className="account-profile-avatar"><UserRound size={26} /></span>
        <div><span className="eyebrow blue">THÔNG TIN CÁ NHÂN</span><h2>{user.name}</h2><p>{user.email}</p><p>{user.phone || 'Chưa thêm số điện thoại'}</p></div>
        <Check className="account-verified" size={20} />
      </section>
      <div className="account-profile-actions"><Link className="btn outline" to="/don-hang">Đơn hàng của tôi <ArrowRight size={16} /></Link><button className="btn outline" onClick={onLogout}><LogOut size={16} /> Đăng xuất</button></div>
    </main>
  )
}
