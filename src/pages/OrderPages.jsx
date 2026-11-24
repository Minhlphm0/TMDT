import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ClipboardList, FileUp, PackageCheck, Search, Trash2 } from 'lucide-react'
import { createId, readCollection, writeCollection } from '../utils/store.js'
import { deleteEvidenceFiles, saveEvidenceFiles, validateEvidenceFiles } from '../utils/evidence.js'
import { canRequestReturn, remainingReturnQuantity, RETURN_REASONS, RETURN_STATUSES, returnDeadline } from '../utils/returns.js'
import { useStoreRevision } from '../utils/useStoreRevision.js'
import { canRequestCancellation, actualOrderTimeline, normalizeOrderStatus, ORDER_STATUS_LABELS } from '../utils/orders.js'

const money = amount => `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}₫`
const orderDate = order => order.orderedAt ? new Date(order.orderedAt).toLocaleString('vi-VN') : order.date || 'Chưa có dữ liệu'
const orderStatus = order => ORDER_STATUS_LABELS[normalizeOrderStatus(order?.status)] || order?.status || 'Chưa có trạng thái'
const owns = (record, user) => {
  if (!record || !user) return false
  const accountId = user.id || user.userId
  if (accountId && record.userId && String(accountId) === String(record.userId)) return true
  return Boolean(user.email && record.customerEmail && record.customerEmail.toLowerCase() === user.email.toLowerCase())
}

function SignInPrompt() {
  return <div className="empty"><ClipboardList size={34}/><h2>Đăng nhập để xem đơn hàng</h2><p>Danh sách chỉ hiển thị đơn gắn với tài khoản hiện tại.</p><Link className="btn primary" to="/dang-nhap">Đăng nhập <ArrowRight size={16}/></Link></div>
}

export function OrderHistory({ user }) {
  useStoreRevision()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [, setRevision] = useState(0)
  const pageSize = 6
  const orders = user ? readCollection('orders').filter(order => owns(order, user)) : []
  const filtered = orders.filter(order => (status === 'all' || normalizeOrderStatus(order.status) === status) && String(order.id).toLowerCase().includes(query.trim().toLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  if (!user) return <main className="wrap page"><SignInPrompt/></main>
  const createDemoOrder = () => {
    const now = new Date()
    const deliveredAt = now.toISOString()
    const orderedAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const item = { id: 'DEMO-PRODUCT-RETURN', name: 'Sản phẩm demo phục vụ kiểm thử đổi trả', qty: 2, price: 500000, image: '' }
    const demoOrder = { id: createId('DEMO-ORDER'), isDemo: true, customerEmail: user.email, customerName: user.name, status: 'delivered', items: [item], subtotal: 1000000, shipping: 0, total: 1000000, paymentMethod: 'Thanh toán khi nhận hàng (demo)', shippingAddress: { address: 'Địa chỉ minh họa' }, orderedAt, deliveredAt, date: new Date(orderedAt).toLocaleDateString('vi-VN') }
    writeCollection('orders', [demoOrder, ...readCollection('orders')])
    setRevision(value => value + 1)
  }
  return <main className="wrap page order-pages">
    <div className="breadcrumbs"><Link to="/">Trang chủ</Link><span>/</span>Đơn hàng của tôi</div>
    <div className="page-title"><div><span className="eyebrow blue">TÀI KHOẢN CỦA BẠN</span><h1>Đơn hàng <em>của tôi.</em></h1><p>Danh sách đơn hàng đã gắn với tài khoản {user.email}.</p></div><div className="order-page-actions"><Link className="btn outline" to="/yeu-cau-doi-tra">Theo dõi yêu cầu đổi trả <ArrowRight size={16}/></Link><button className="btn ghost" onClick={createDemoOrder}>Tạo đơn demo đã giao</button></div></div>
    <div className="orders-toolbar"><label className="order-search"><Search size={17}/><input value={query} onChange={event => {setPage(1);setQuery(event.target.value)}} placeholder="Tìm theo mã đơn" aria-label="Tìm theo mã đơn"/></label><label className="order-filter">Trạng thái<select value={status} onChange={event => {setPage(1);setStatus(event.target.value)}}><option value="all">Tất cả trạng thái</option>{Object.entries(ORDER_STATUS_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {filtered.length ? <><div className="order-list">{filtered.slice((page-1)*pageSize,page*pageSize).map(order => <article className="order-card" key={order.id}><div className="order-card-main"><div><span className="eyebrow blue">MÃ ĐƠN {order.isDemo&&<i className="demo-tag">DEMO</i>}</span><strong>{order.id}</strong><small>Đặt ngày {orderDate(order)}</small></div><span className={`order-status status-${order.status}`}>{orderStatus(order)}</span><strong>{money(order.total)}</strong><Link className="btn ghost" to={`/don-hang/${encodeURIComponent(order.id)}`}>Chi tiết <ArrowRight size={15}/></Link></div><div className="order-card-items">{(order.items || []).map((item,index)=><span key={`${item.id}-${index}`}>{item.name} × {item.qty}</span>)}</div></article>)}</div>
      {pages > 1 && <nav className="order-pagination" aria-label="Phân trang đơn hàng"><button className="btn outline" disabled={page===1} onClick={()=>setPage(page-1)}>Trước</button><span>Trang {page}/{pages}</span><button className="btn outline" disabled={page===pages} onClick={()=>setPage(page+1)}>Tiếp</button></nav>}</>
      : <div className="empty"><PackageCheck size={34}/><h2>{orders.length ? 'Không tìm thấy đơn hàng phù hợp' : 'Tài khoản chưa có đơn hàng'}</h2><p>{orders.length ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Đơn đặt khi đăng nhập sẽ hiển thị tại đây.'}</p>{!orders.length&&<Link className="btn primary" to="/san-pham">Mua sắm <ArrowRight size={16}/></Link>}</div>}
    <p className="demo-disclaimer">Đơn hàng tạo trước khi liên kết tài khoản sẽ không được gán tự động cho tài khoản này.</p>
  </main>
}

export function OrderDetails({ user, notify }) {
  useStoreRevision()
  const { id } = useParams()
  const order = readCollection('orders').find(item => String(item.id) === id)
  const requests = readCollection('returnRequests')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cancelOpen,setCancelOpen]=useState(false)
  const [cancelReason,setCancelReason]=useState('')
  const [cancelError,setCancelError]=useState('')
  const [previews, setPreviews] = useState([])
  const owned = owns(order, user)
  const orderRequests = requests.filter(request => request.orderId === order?.id && owns(request, user))
  const deadline = returnDeadline(order, orderRequests)
  const products = order?.items || []
  const selected = products.find(item => String(item.id) === selectedProduct)
  const eligibleProducts = products.filter(item => canRequestReturn(order, item, orderRequests).eligible)
  const timeline=actualOrderTimeline(order)
  const cancellationRequests=order?.cancellationRequests||[]

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    let active = true
    queueMicrotask(() => { if (active) setPreviews(urls) })
    return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [files])

  if (!user) return <main className="wrap page"><SignInPrompt/></main>
  if (!order || !owned) return <main className="wrap page"><div className="empty"><h1>Không tìm thấy đơn hàng</h1><p>Đơn hàng không tồn tại hoặc không thuộc tài khoản hiện tại.</p><Link className="btn outline" to="/don-hang">Quay lại đơn hàng</Link></div></main>

  const requestReturn = async event => {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const reason = form.elements.reason.value
    const description = form.elements.description.value.trim()
    if (!selected || !reason || !description) {
      setError('Vui lòng chọn sản phẩm, lý do và mô tả vấn đề.')
      return
    }
    const eligibility = canRequestReturn(order, selected, requests)
    if (!eligibility.eligible || quantity < 1 || quantity > eligibility.remainingQuantity) {
      setError(eligibility.reason || 'Số lượng yêu cầu vượt quá số lượng còn được phép.')
      return
    }
    if (orderRequests.some(request => !['rejected'].includes(request.status) && (request.products || []).some(product => String(product.productId) === String(selected.id)))) {
      setError('Sản phẩm này đã có yêu cầu đang xử lý. Vui lòng theo dõi yêu cầu hiện có.')
      return
    }
    const validation = validateEvidenceFiles(files)
    if (!validation.valid) { setFileError(validation.error); return }
    setBusy(true)
    let evidence = []
    try {
      evidence = await saveEvidenceFiles(files)
      const now = new Date().toISOString()
      const request = {
        id: createId('RT'), orderId: order.id, customerEmail: user.email,
        products: [{ productId: selected.id, name: selected.name, image: selected.image || '', quantity, unitPrice: Number(selected.price) || 0 }],
        reason, description, evidence,
        status: 'pending', createdAt: now, statusHistory: [{ status: 'pending', at: now }],
      }
      const next = [...readCollection('returnRequests'), request]
      writeCollection('returnRequests', next)
      setFormOpen(false); setConfirm(false); setFiles([]); setSelectedProduct(''); setQuantity(1)
      notify('Đã gửi yêu cầu đổi trả. Trạng thái hiện tại: Chờ duyệt.')
    } catch (saveError) {
      if (evidence.length) await deleteEvidenceFiles(evidence.map(file => file.id)).catch(() => {})
      setError(saveError.message || 'Không thể lưu yêu cầu đổi trả.')
    } finally { setBusy(false) }
  }

  const submitCancellation=event=>{event.preventDefault();setCancelError('');const current=readCollection('orders').find(item=>String(item.id)===String(order.id));if(!owns(current,user)||!canRequestCancellation(current)){setCancelError('Đơn hàng hiện không thể gửi yêu cầu hủy hoặc đã có yêu cầu đang chờ.');return}if(!cancelReason.trim()){setCancelError('Vui lòng nhập lý do yêu cầu hủy.');return}if(!window.confirm('Gửi yêu cầu hủy đơn hàng để Admin xem xét?'))return;const now=new Date().toISOString(),request={id:createId('CXL'),status:'pending',reason:cancelReason.trim(),requestedAt:now,requestedBy:{userId:user.id||user.userId||user.email,email:user.email,name:user.name||''}},updated={...current,cancellationRequests:[...(current.cancellationRequests||[]),request]},ordersNow=readCollection('orders');try{writeCollection('orders',ordersNow.map(item=>String(item.id)===String(current.id)?updated:item));setCancelReason('');setCancelOpen(false);notify('Đã gửi yêu cầu hủy. Admin sẽ xem xét đơn hàng.')}catch(saveError){setCancelError(saveError.message||'Không thể lưu yêu cầu hủy.')}}

  const onFiles = event => {
    const next = [...event.target.files]
    const validation = validateEvidenceFiles(next)
    setFileError(validation.valid ? '' : validation.error)
    if (validation.valid) setFiles(next)
    event.target.value = ''
  }

  return <main className="wrap page order-pages">
    <div className="breadcrumbs"><Link to="/">Trang chủ</Link><span>/</span><Link to="/don-hang">Đơn hàng của tôi</Link><span>/</span>{order.id}</div>
    <div className="page-title"><div><span className="eyebrow blue">CHI TIẾT ĐƠN HÀNG {order.isDemo&&<i className="demo-tag">DEMO</i>}</span><h1>Đơn hàng <em>{order.id}</em></h1></div><Link className="btn outline" to="/don-hang"><ArrowLeft size={16}/> Quay lại đơn hàng</Link></div>
    <section className="order-detail-card"><div className="order-detail-grid"><p><small>Ngày đặt</small><strong>{orderDate(order)}</strong></p><p><small>Trạng thái</small><strong>{orderStatus(order)}</strong></p><p><small>Thanh toán</small><strong>{order.paymentMethod || 'Chưa có dữ liệu'}</strong></p><p><small>Địa chỉ nhận</small><strong>{order.shippingAddress?.address || order.address || 'Đơn cũ chưa lưu địa chỉ'}</strong></p><p><small>Ngày giao thực tế</small><strong>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('vi-VN') : 'Chưa có ngày giao'}</strong></p></div></section>
    <section className="order-detail-card"><h2>Tiến trình đơn hàng</h2>{timeline.length?<ol className="return-timeline order-status-timeline">{timeline.map((entry,index)=><li key={entry.id||String(entry.at)+index}><span className="timeline-dot"/><div><strong>{entry.label}</strong><small>{new Date(entry.at).toLocaleString('vi-VN')}</small>{entry.note&&<p>{entry.note}</p>}</div></li>)}</ol>:<p>Đơn hàng cũ chưa lưu lịch sử trạng thái.</p>}</section>
    <section className="order-detail-card"><div className="return-heading"><div><h2>Yêu cầu hủy đơn hàng</h2><p>Đơn chưa chuyển sang vận chuyển có thể gửi yêu cầu để Admin xem xét.</p></div>{canRequestCancellation(order)&&!cancelOpen&&<button className="btn outline" onClick={()=>setCancelOpen(true)}>Yêu cầu hủy</button>}</div>{cancellationRequests.map(request=><article className="cancellation-history" key={request.id}><strong>{request.status==='pending'?'Đang chờ Admin':request.status==='approved'?'Đã duyệt — đơn hàng đã hủy':'Bị từ chối'}</strong><p>Lý do: {request.reason}</p><small>Gửi lúc {new Date(request.requestedAt).toLocaleString('vi-VN')} · {request.requestedBy?.email||user.email}</small>{request.adminReason&&<p>Lý do từ chối: {request.adminReason}</p>}</article>)}{cancelOpen&&<form className="return-form" onSubmit={submitCancellation}><label className="field">Lý do yêu cầu hủy<textarea rows="3" required maxLength={500} value={cancelReason} onChange={event=>setCancelReason(event.target.value)} placeholder="Vui lòng cho biết lý do"/></label>{cancelError&&<p className="form-error" role="alert">{cancelError}</p>}<div className="admin-modal-actions"><button className="btn primary">Gửi yêu cầu</button><button type="button" className="btn outline" onClick={()=>{setCancelOpen(false);setCancelError('')}}>Đóng</button></div></form>}</section>
    <section className="order-detail-card"><h2>Sản phẩm</h2><div className="order-product-list">{products.map((item,index)=><article key={`${item.id}-${index}`}>{item.image ? <img src={item.image} alt=""/> : <div className="order-product-placeholder"><PackageCheck size={20}/></div>}<div><strong>{item.name}</strong><small>Số lượng: {item.qty} · Đơn giá: {money(item.price)}</small></div><strong>{money((Number(item.price)||0)*(Number(item.qty)||0))}</strong></article>)}</div><div className="order-totals"><p><span>Tạm tính</span><strong>{money(order.subtotal ?? products.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.qty)||0),0))}</strong></p><p><span>Phí vận chuyển</span><strong>{money(order.shipping ?? 0)}</strong></p><p className="order-total"><span>Tổng tiền</span><strong>{money(order.total)}</strong></p></div></section>
    <section className="order-detail-card"><div className="return-heading"><div><h2>Yêu cầu đổi trả</h2><p>Thời hạn 7 ngày là cấu hình demo, tính từ ngày giao thực tế.</p></div>{deadline.eligible&&eligibleProducts.length>0&&<button className="btn primary" onClick={()=>{setFormOpen(true);setSelectedProduct(String(eligibleProducts[0].id))}}>Yêu cầu đổi trả</button>}</div><p className={deadline.eligible?'return-eligible':'return-ineligible'}>{deadline.eligible ? `Còn khoảng ${deadline.remainingDays} ngày trong thời hạn demo.` : deadline.reason}</p>
      {orderRequests.length>0&&<div className="order-return-list">{orderRequests.map(request=><Link key={request.id} to="/yeu-cau-doi-tra" className="return-mini"><span>{request.id}</span><strong>{RETURN_STATUSES[request.status] || 'Chờ duyệt'}</strong></Link>)}</div>}
      {formOpen&&<form className="return-form" onSubmit={event=>confirm?requestReturn(event):(event.preventDefault(),setConfirm(true))}><h3>Gửi yêu cầu đổi trả</h3><label className="field">Sản phẩm<select required value={selectedProduct} onChange={event=>{setSelectedProduct(event.target.value);setQuantity(1)}}><option value="">Chọn sản phẩm</option>{eligibleProducts.map(item=><option key={item.id} value={item.id}>{item.name} (còn yêu cầu {remainingReturnQuantity(order,item,orderRequests)})</option>)}</select></label><label className="field">Số lượng<input type="number" min="1" max={selected?remainingReturnQuantity(order,selected,orderRequests):1} value={quantity} onChange={event=>setQuantity(Number(event.target.value))} required/></label><label className="field">Lý do<select name="reason" required defaultValue=""><option value="" disabled>Chọn lý do</option>{Object.entries(RETURN_REASONS).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label><label className="field">Mô tả chi tiết<textarea name="description" rows="4" minLength="8" required placeholder="Mô tả lỗi hoặc tình trạng sản phẩm (tối thiểu 8 ký tự)"/></label><label className="field evidence-input"><span><FileUp size={17}/> Ảnh/video minh chứng</span><small>JPEG, PNG, WebP (tối đa 3 MB/ảnh), MP4/WebM (12 MB/video), tổng tối đa 20 MB; tối đa 5 tệp.</small><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={onFiles}/></label>{fileError&&<p className="form-error">{fileError}</p>}{files.length>0&&<div className="evidence-previews">{files.map((file,index)=><article key={`${file.name}-${index}`}>{file.type.startsWith('image/')?<img src={previews[index]} alt={`Xem trước ${file.name}`}/>:<video src={previews[index]} controls/>}<span>{file.name}</span><button type="button" aria-label={`Xóa ${file.name}`} onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))}><Trash2 size={16}/></button></article>)}</div>}{error&&<p className="form-error">{error}</p>}<div className="return-form-actions"><button className="btn outline" type="button" onClick={()=>{setFormOpen(false);setError('')}}>Hủy</button><button className="btn primary" type="submit" disabled={busy}>Kiểm tra và gửi</button></div>
        {confirm&&<div className="return-confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-return-title"><h3 id="confirm-return-title">Xác nhận gửi yêu cầu</h3><p>Yêu cầu sẽ được lưu ở trạng thái “Chờ duyệt”. Chưa có thao tác hoàn tiền hay phê duyệt tự động.</p><div><button type="button" className="btn outline" onClick={()=>setConfirm(false)}>Quay lại</button><button type="button" className="btn primary" disabled={busy} onClick={()=>document.querySelector('.return-form')?.requestSubmit()}>Xác nhận gửi</button></div></div>}
      </form>}
    </section>
  </main>
}

export function ReturnRequestHistory({ user }) {
  useStoreRevision()
  const requests = user ? readCollection('returnRequests').filter(request => owns(request, user)) : []
  if (!user) return <main className="wrap page"><SignInPrompt/></main>
  return <main className="wrap page order-pages"><div className="breadcrumbs"><Link to="/">Trang chủ</Link><span>/</span><Link to="/don-hang">Đơn hàng</Link><span>/</span>Yêu cầu đổi trả</div><div className="page-title"><div><span className="eyebrow blue">THEO DÕI XỬ LÝ</span><h1>Yêu cầu <em>đổi trả.</em></h1></div><Link className="btn outline" to="/don-hang"><ArrowLeft size={16}/> Quay lại đơn hàng</Link></div>{requests.length?<div className="return-history">{requests.map(request=><article className="order-detail-card" key={request.id}><div className="return-history-head"><div><span className="eyebrow blue">{request.id}</span><h2>Đơn hàng {request.orderId}</h2><small>Gửi lúc {new Date(request.createdAt).toLocaleString('vi-VN')}</small></div><strong className="order-status">{RETURN_STATUSES[request.status] || 'Chờ duyệt'}</strong></div><ul>{request.products?.map(product=><li key={product.productId}>{product.name} × {product.quantity}</li>)}</ul><p>Lý do: {RETURN_REASONS[request.reason] || request.reason}</p>{request.statusHistory?.length ? <ol className="return-timeline">{request.statusHistory.map((entry,index)=><li key={`${entry.status}-${entry.at}-${index}`}><span className="timeline-dot"/><div><strong>{RETURN_STATUSES[entry.status] || entry.status}</strong><small>{new Date(entry.at).toLocaleString('vi-VN')}</small>{entry.note&&<p>{entry.note}</p>}</div></li>)}</ol> : <p>Chưa có cập nhật xử lý ngoài trạng thái hiện tại.</p>}</article>)}</div>:<div className="empty"><ClipboardList size={34}/><h2>Chưa có yêu cầu đổi trả</h2><p>Khi gửi yêu cầu từ chi tiết đơn hàng, tiến trình sẽ xuất hiện ở đây.</p><Link className="btn primary" to="/don-hang">Xem đơn hàng <ArrowRight size={16}/></Link></div>}</main>
}
