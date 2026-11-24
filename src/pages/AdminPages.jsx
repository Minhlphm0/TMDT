import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ClipboardList, LayoutDashboard, LogOut, PackageCheck, Search, ShieldCheck, X } from 'lucide-react'
import { ADMIN_DEMO_CREDENTIALS, authenticateDemoAdmin, clearAdminSession, getAdminSession, saveAdminSession } from '../utils/adminAuth.js'
import { getEvidenceFile } from '../utils/evidence.js'
import { products as readCatalog } from '../data/products.js'
import { calculateRefundCap, REFUND_METHODS, RETURN_REASONS, RETURN_STATUSES, RETURN_TRANSITIONS, validateApprovalQuantity, validateRefund, validateReturnTransition } from '../utils/returns.js'
import { createId, readCollection, writeCollections } from '../utils/store.js'
import { useStoreRevision } from '../utils/useStoreRevision.js'
import { consumeInventory, getAvailableStock, releaseInventory } from '../utils/inventory.js'
import { allowedOrderTransitions, createOrderStatusEvent, normalizeOrderStatus, ORDER_STATUS_LABELS } from '../utils/orders.js'

export function AdminRouteMode({ children }) {
  useEffect(()=>{document.body.classList.add('admin-route');return()=>document.body.classList.remove('admin-route')},[])
  return children
}

const money = amount => `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}₫`
const orderById = id => readCollection('orders').find(order => String(order.id) === String(id))
const adminStatusType = status => ['refunded','exchanged'].includes(status) ? 'complete' : status === 'rejected' ? 'rejected' : status === 'pending' ? 'pending' : 'processing'

export function AdminProtected({ children }) {
  return getAdminSession() ? children : <Navigate to="/admin/dang-nhap" replace />
}

export function AdminLogin() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState(ADMIN_DEMO_CREDENTIALS.email)
  const [password, setPassword] = useState(ADMIN_DEMO_CREDENTIALS.password)
  if (getAdminSession()) return <Navigate to="/admin" replace />
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const admin = await authenticateDemoAdmin(localStorage, email, password)
      saveAdminSession(sessionStorage, admin)
      navigate('/admin', { replace: true })
    } catch (loginError) { setError(loginError.message || 'Không thể đăng nhập Admin.') }
    finally { setBusy(false) }
  }
  return <main className="wrap page admin-login-page"><form className="form-panel admin-login-card" onSubmit={submit}><span className="admin-mark"><ShieldCheck size={28}/></span><span className="eyebrow blue">PC TECH STORE · QUẢN TRỊ DEMO</span><h1>Đăng nhập Admin</h1><p>Khu vực mô phỏng quản lý yêu cầu đổi trả.</p><label className="field">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="field">Mật khẩu<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p className="form-error">{error}</p>}<button className="btn primary full" disabled={busy}>{busy?'Đang kiểm tra...':'Đăng nhập'}</button><div className="admin-credential-note"><strong>Tài khoản demo</strong><span>{ADMIN_DEMO_CREDENTIALS.email}</span><span>{ADMIN_DEMO_CREDENTIALS.password}</span></div><p className="demo-disclaimer">Phiên đăng nhập dùng SessionStorage. Đây là phân quyền frontend để demo, không bảo vệ dữ liệu như backend.</p></form></main>
}

function AdminShell({ children, notify }) {
  const admin = getAdminSession()
  const navigate = useNavigate()
  const logout = () => { clearAdminSession(); notify('Đã đăng xuất Admin'); navigate('/admin/dang-nhap', { replace: true }) }
  return <div className="admin-shell wrap"><aside className="admin-sidebar"><Link to="/admin" className="brand"><span className="brand-mark"><ShieldCheck size={22}/></span><span>PC TECH<span className="brand-light">ADMIN</span><small>DEMO CONTROL PANEL</small></span></Link><div className="admin-who"><b>{admin?.name}</b><small>{admin?.email}</small><span className="demo-tag">DEMO</span></div><nav><Link to="/admin"><LayoutDashboard size={17}/> Tổng quan</Link><Link to="/admin/don-hang"><PackageCheck size={17}/> Đơn hàng</Link><Link to="/admin/kho-hang"><PackageCheck size={17}/> Kho hàng</Link><Link to="/admin/doi-tra"><ClipboardList size={17}/> Yêu cầu đổi trả</Link></nav><button className="admin-logout" onClick={logout}><LogOut size={16}/> Đăng xuất</button><p>Quyền quản trị chỉ mô phỏng trên trình duyệt.</p></aside><main className="admin-main">{children}</main></div>
}

export function AdminDashboard({ notify }) {
  useStoreRevision()
  const orders=readCollection('orders')
  const orderCards=[['Tổng đơn hàng',orders.length,'all'],['Chờ xác nhận',orders.filter(o=>normalizeOrderStatus(o.status)==='pending').length,'pending'],['Đang xử lý',orders.filter(o=>['confirmed','processing'].includes(normalizeOrderStatus(o.status))).length,'processing'],['Đang vận chuyển',orders.filter(o=>normalizeOrderStatus(o.status)==='shipping'||normalizeOrderStatus(o.status)==='shipped').length,'shipping'],['Đã giao',orders.filter(o=>normalizeOrderStatus(o.status)==='delivered').length,'delivered'],['Đã hủy',orders.filter(o=>normalizeOrderStatus(o.status)==='cancelled').length,'cancelled']]
  const [today] = useState(()=>new Date().toLocaleDateString('vi-VN'))
  const requests = readCollection('returnRequests')
  return <AdminShell notify={notify}><header className="admin-page-heading"><div><span className="eyebrow blue">BẢNG ĐIỀU KHIỂN</span><h1>Tổng quan <em>đơn hàng.</em></h1><p>Số liệu được tổng hợp từ Store hiện tại.</p></div><span className="admin-date">{today}</span></header><section className="admin-stats order-stats">{orderCards.map(([label,value,kind])=><Link key={kind} className={`admin-stat stat-${kind}`} to={`/admin/don-hang${kind==='all'?'':`?status=${kind}`}`}><span>{label}</span><strong>{value}</strong><small>Đơn hàng</small></Link>)}</section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Đơn hàng mới nhất</h2><p>Danh sách sắp xếp theo thời gian đặt.</p></div><Link className="btn outline" to="/admin/don-hang">Tất cả đơn hàng <ArrowRight size={16}/></Link></div>{orders.length?<AdminOrderTable orders={[...orders].sort((a,b)=>new Date(b.orderedAt||b.createdAt||0)-new Date(a.orderedAt||a.createdAt||0)).slice(0,5)}/>:<div className="admin-empty"><PackageCheck size={26}/><p>Chưa có đơn hàng.</p></div>}</section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Yêu cầu đổi trả mới nhất</h2><p>Danh sách sắp xếp theo thời gian gửi.</p></div><Link className="btn outline" to="/admin/doi-tra">Tất cả yêu cầu <ArrowRight size={16}/></Link></div>{requests.length?<AdminRequestTable requests={[...requests].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5)}/>:<div className="admin-empty"><ClipboardList size={26}/><p>Chưa có yêu cầu đổi trả.</p></div>}</section><p className="admin-disclaimer">Admin demo không gửi email, không chuyển tiền và không cập nhật dữ liệu backend.</p></AdminShell>
}

function AdminRequestTable({ requests }) {
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Mã yêu cầu</th><th>Mã đơn</th><th>Khách hàng</th><th>Ngày gửi</th><th>Sản phẩm</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>{requests.map(request=><tr key={request.id}><td><strong>{request.id}</strong></td><td>{request.orderId}</td><td>{request.customerEmail||'Không có email'}</td><td>{new Date(request.createdAt).toLocaleDateString('vi-VN')}</td><td>{request.products?.map(product=>`${product.name} × ${product.quantity}`).join(', ')}</td><td>{RETURN_REASONS[request.reason]||request.reason||'—'}</td><td><span className={`admin-badge badge-${adminStatusType(request.status)}`}>{RETURN_STATUSES[request.status]||request.status}</span></td><td><Link className="admin-view-link" to={`/admin/doi-tra/${encodeURIComponent(request.id)}`}>Xem <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>
}

export function AdminReturnList({ notify }) {
  useStoreRevision()
  const [query,setQuery]=useState('')
  const [searchParams]=useSearchParams()
  const [status,setStatus]=useState(searchParams.get('status')||'all')
  const [sort,setSort]=useState('newest')
  const [page,setPage]=useState(1)
  const pageSize=10
  const requests=readCollection('returnRequests')
  const filtered=requests.filter(request=>(status==='all'||(status==='processing'?['receiving','inspecting','refunding','exchanging'].includes(request.status):status==='complete'?['refunded','exchanged'].includes(request.status):request.status===status))&&`${request.id} ${request.orderId}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>(new Date(b.createdAt)-new Date(a.createdAt))*(sort==='newest'?1:-1))
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize))
  return <AdminShell notify={notify}><header className="admin-page-heading"><div><span className="eyebrow blue">QUẢN LÝ HỒ SƠ</span><h1>Yêu cầu <em>đổi trả.</em></h1><p>{requests.length} yêu cầu trong kho dữ liệu.</p></div><Link className="btn outline" to="/admin"><ArrowLeft size={16}/> Tổng quan</Link></header><div className="admin-filters"><label><Search size={16}/><input value={query} onChange={e=>{setPage(1);setQuery(e.target.value)}} placeholder="Tìm mã yêu cầu hoặc mã đơn"/></label><select value={status} onChange={e=>{setPage(1);setStatus(e.target.value)}}><option value="all">Tất cả trạng thái</option>{Object.entries(RETURN_STATUSES).map(([key,label])=><option value={key} key={key}>{label}</option>)}<option value="processing">Đang xử lý</option><option value="complete">Đã hoàn thành</option></select><select value={sort} onChange={e=>{setPage(1);setSort(e.target.value)}}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select></div>{filtered.length?<><AdminRequestTable requests={filtered.slice((page-1)*pageSize,page*pageSize)}/>{pages>1&&<div className="admin-pagination"><button className="btn outline" disabled={page===1} onClick={()=>setPage(page-1)}>Trước</button><span>{page}/{pages}</span><button className="btn outline" disabled={page===pages} onClick={()=>setPage(page+1)}>Tiếp</button></div>}</>:<div className="admin-empty"><ClipboardList size={28}/><h2>Không có yêu cầu phù hợp</h2><p>Hãy thay đổi từ khóa hoặc bộ lọc.</p></div>}</AdminShell>
}

const ORDER_STATUSES = ORDER_STATUS_LABELS
const orderMoney = amount => `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}₫`

function AdminOrderTable({ orders }) {
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Điện thoại</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead><tbody>{orders.map(order=>{const status=normalizeOrderStatus(order.status);return <tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.customerName||'Khách hàng'}<small>{order.customerEmail||''}</small></td><td>{order.customerPhone||order.shippingAddress?.phone||'—'}</td><td>{order.orderedAt||order.createdAt?new Date(order.orderedAt||order.createdAt).toLocaleDateString('vi-VN'):'—'}</td><td>{orderMoney(order.total)}</td><td>{order.paymentMethod||'—'}</td><td><span className={`admin-badge badge-${status==='delivered'?'complete':status==='cancelled'?'rejected':status==='pending'?'pending':'processing'}`}>{ORDER_STATUSES[status]||status||'Chưa có trạng thái'}</span></td><td><Link className="admin-view-link" to={`/admin/don-hang/${encodeURIComponent(order.id)}`}>Chi tiết <ArrowRight size={14}/></Link></td></tr>})}</tbody></table></div>
}

export function AdminInventory({ notify }) {
  useStoreRevision()
  const products=readCatalog
  const inventory=readCollection('inventory')
  const movements=[...readCollection('inventoryMovements')].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,15)
  const save=(event,product)=>{event.preventDefault();const form=new FormData(event.currentTarget),onHand=Number(form.get('onHand')),note=String(form.get('reason')||'').trim(),records=readCollection('inventory'),old=records.find(item=>String(item.productId)===String(product.id));if(!Number.isInteger(onHand)||onHand<0){notify('Số lượng tồn phải là số nguyên không âm.');return}if(onHand<(old?.reserved||0)){notify('Tồn kho không thể thấp hơn số lượng đang giữ cho đơn hàng.');return}if(!note){notify('Vui lòng ghi lý do điều chỉnh tồn kho.');return}const now=new Date().toISOString(),nextItem={productId:product.id,productName:product.name,onHand,reserved:old?.reserved||0,updatedAt:now};const next=old?records.map(item=>String(item.productId)===String(product.id)?nextItem:item):[...records,nextItem];const movement={id:`STOCK-${Date.now()}-${product.id}`,productId:product.id,productName:product.name,action:'adjust',previousOnHand:old?.onHand??null,onHand,reserved:nextItem.reserved,reason:note,actorId:getAdminSession()?.email||'admin-demo',createdAt:now};try{writeCollections({inventory:next,inventoryMovements:[...readCollection('inventoryMovements'),movement]});notify('Đã cập nhật tồn kho và lưu lịch sử.')}catch(error){notify(error.message||'Không thể lưu tồn kho.')}}
  return <AdminShell notify={notify}><header className="admin-page-heading"><div><span className="eyebrow blue">QUẢN LÝ BÁN HÀNG</span><h1>Tồn kho <em>sản phẩm.</em></h1><p>Sản phẩm chỉ có thể đặt sau khi Admin cấu hình số lượng thực tế.</p></div></header><div className="admin-inventory-list">{products.map(product=>{const stock=getAvailableStock(inventory,product.id),record=inventory.find(item=>String(item.productId)===String(product.id));return <form key={product.id} className="admin-panel admin-inventory-row" onSubmit={event=>save(event,product)}><div><strong>{product.name}</strong><small>{product.brand} · {stock.configured?`Có thể bán ${stock.available} / ${stock.onHand} (đang giữ ${stock.reserved})`:'Chưa thiết lập tồn kho'}</small></div><label className="field">Tồn thực<input name="onHand" type="number" min={record?.reserved||0} step="1" defaultValue={record?.onHand??''} placeholder="Nhập số lượng đã xác nhận" required/></label><label className="field">Lý do điều chỉnh<input name="reason" required placeholder="Nhập kho, kiểm kê..."/></label><button className="btn primary">Lưu số lượng</button></form>})}</div><section className="admin-panel"><h2>Lịch sử thay đổi tồn kho</h2>{movements.length?<div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Thời gian</th><th>Sản phẩm</th><th>Thao tác</th><th>Số lượng</th><th>Lý do</th><th>Người thực hiện</th></tr></thead><tbody>{movements.map(row=><tr key={row.id}><td>{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td>{row.productName||products.find(item=>String(item.id)===String(row.productId))?.name||row.productId}</td><td>{row.action}</td><td>{row.action==='adjust'?`${row.previousOnHand??'—'} → ${row.onHand}`:`${row.quantity} (${row.reserved} đang giữ)`}</td><td>{row.reason}</td><td>{row.actorId}</td></tr>)}</tbody></table></div>:<p>Chưa có lịch sử tồn kho.</p>}</section></AdminShell>
}

export function AdminOrderList({ notify }) {
  useStoreRevision()
  const [params]=useSearchParams()
  const [query,setQuery]=useState(''),[status,setStatus]=useState(params.get('status')||'all'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[sort,setSort]=useState('newest'),[page,setPage]=useState(1)
  const pageSize=10,orders=readCollection('orders')
  const filtered=orders.filter(order=>{const date=new Date(order.orderedAt||order.createdAt||0),day=Number.isFinite(date.getTime())?date.toISOString().slice(0,10):'';return (status==='all'||normalizeOrderStatus(order.status)===status)&&(!from||day>=from)&&(!to||day<=to)&&`${order.id} ${order.customerName||''} ${order.customerEmail||''} ${order.customerPhone||order.shippingAddress?.phone||''}`.toLowerCase().includes(query.trim().toLowerCase())}).sort((a,b)=>(new Date(a.orderedAt||a.createdAt||0)-new Date(b.orderedAt||b.createdAt||0))*(sort==='newest'?-1:1))
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize))
  return <AdminShell notify={notify}><header className="admin-page-heading"><div><span className="eyebrow blue">QUẢN LÝ BÁN HÀNG</span><h1>Đơn <em>hàng.</em></h1><p>{filtered.length} / {orders.length} đơn hàng phù hợp.</p></div><Link className="btn outline" to="/admin">Tổng quan</Link></header><div className="admin-filters"><label><Search size={16}/><input value={query} onChange={event=>{setPage(1);setQuery(event.target.value)}} placeholder="Tìm mã đơn, tên, email hoặc số điện thoại"/></label><select value={status} onChange={event=>{setPage(1);setStatus(event.target.value)}}><option value="all">Tất cả trạng thái</option>{Object.entries(ORDER_STATUSES).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select><label>Từ ngày<input type="date" value={from} onChange={event=>{setPage(1);setFrom(event.target.value)}}/></label><label>Đến ngày<input type="date" value={to} onChange={event=>{setPage(1);setTo(event.target.value)}}/></label><select value={sort} onChange={event=>{setPage(1);setSort(event.target.value)}}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select></div>{filtered.length?<><AdminOrderTable orders={filtered.slice((page-1)*pageSize,page*pageSize)}/>{pages>1&&<div className="admin-pagination"><button className="btn outline" disabled={page===1} onClick={()=>setPage(page-1)}>Trước</button><span>{page}/{pages}</span><button className="btn outline" disabled={page===pages} onClick={()=>setPage(page+1)}>Tiếp</button></div>}</>:<div className="admin-empty"><PackageCheck size={28}/><h2>{orders.length?'Không tìm thấy đơn hàng phù hợp':'Chưa có đơn hàng'}</h2><p>Thử đổi từ khóa hoặc bộ lọc.</p></div>}</AdminShell>
}
export function AdminOrderDetail({ notify }) {
  useStoreRevision()
  const { id }=useParams()
  const order=readCollection('orders').find(item=>String(item.id)===id)
  const admin=getAdminSession()
  const status=normalizeOrderStatus(order?.status)
  const [nextStatus,setNextStatus]=useState('')
  const [rejectReason,setRejectReason]=useState('')
  const pendingCancel=(order?.cancellationRequests||[]).find(request=>request.status==='pending')
  if(!order)return <AdminShell notify={notify}><div className="admin-empty"><h1>Không tìm thấy đơn hàng</h1><Link to="/admin/don-hang" className="btn outline">Quay lại danh sách</Link></div></AdminShell>
  const updateStatus=()=>{
    if(!allowedOrderTransitions(status,{cancellationPending:Boolean(pendingCancel)}).includes(nextStatus)){notify('Bước trạng thái này không hợp lệ.');return}
    if(!window.confirm(`Xác nhận chuyển đơn hàng sang “${ORDER_STATUSES[nextStatus]}”?`))return
    const now=new Date().toISOString(),event=createOrderStatusEvent({from:status,to:nextStatus,actor:{...admin,role:'admin'},note:'Cập nhật trạng thái đơn hàng',at:now}),updated={...order,status:nextStatus,lastUpdatedAt:now,lastUpdatedBy:admin?.email||'admin-demo',statusHistory:[...(order.statusHistory||[]),event]},orders=readCollection('orders'),notifications=[...readCollection('notifications'),{id:createId('NTF'),title:'Cập nhật đơn hàng',message:`Đơn ${order.id}: ${ORDER_STATUSES[nextStatus]}`,read:false,userId:order.userId,customerEmail:order.customerEmail,relatedId:order.id,href:`/don-hang/${encodeURIComponent(order.id)}`,createdAt:now}],changes={orders:orders.map(item=>item.id===order.id?updated:item),notifications}
    if(nextStatus==='delivered'){updated.deliveredAt=now;if(order.inventoryStatus==='reserved'){changes.inventory=consumeInventory(readCollection('inventory'),order.items||[]);updated.inventoryStatus='consumed';changes.orders=orders.map(item=>item.id===order.id?updated:item);changes.inventoryMovements=[...readCollection('inventoryMovements'),...(order.items||[]).map(item=>({id:createId('STOCK'),productId:item.id,quantity:Number(item.qty)||0,action:'consume',reason:'Đơn hàng đã giao',orderId:order.id,actorId:admin?.email||'admin-demo',createdAt:now}))]}}
    try{writeCollections(changes);notify('Đã cập nhật trạng thái và lưu lịch sử đơn hàng.')}catch(error){notify(error.message||'Không thể cập nhật đơn hàng.')}
  }
  const decideCancellation=(decision,event)=>{event.preventDefault();if(!pendingCancel){notify('Không còn yêu cầu hủy đang chờ.');return}const reason=rejectReason.trim();if(decision==='rejected'&&!reason){notify('Nhập lý do từ chối.');return}if(!window.confirm(decision==='approved'?'Duyệt yêu cầu và hủy đơn hàng?':'Từ chối yêu cầu hủy đơn hàng?'))return;const now=new Date().toISOString(),orders=readCollection('orders'),requests=(order.cancellationRequests||[]).map(request=>request.id===pendingCancel.id?{...request,status:decision,decisionAt:now,adminEmail:admin?.email||'',adminName:admin?.name||'Admin',adminReason:reason}:request),updated={...order,cancellationRequests:requests,lastUpdatedAt:now,lastUpdatedBy:admin?.email||'admin-demo'},changes={};if(decision==='approved'){if(!['pending','confirmed','processing'].includes(status)){notify('Đơn hàng đã chuyển sang vận chuyển và không thể hủy.');return}updated.status='cancelled';updated.inventoryStatus=order.inventoryStatus==='reserved'?'released':order.inventoryStatus;updated.statusHistory=[...(order.statusHistory||[]),createOrderStatusEvent({from:status,to:'cancelled',actor:{...admin,role:'admin'},note:`Duyệt yêu cầu hủy: ${pendingCancel.reason}`,at:now})];if(order.inventoryStatus==='reserved'){changes.inventory=releaseInventory(readCollection('inventory'),order.items||[]);changes.inventoryMovements=[...readCollection('inventoryMovements'),...(order.items||[]).map(item=>({id:createId('STOCK'),productId:item.id,quantity:Number(item.qty)||0,action:'release',reason:'Đơn hàng được duyệt hủy',orderId:order.id,actorId:admin?.email||'admin-demo',createdAt:now}))]}}changes.orders=orders.map(item=>item.id===order.id?updated:item);changes.notifications=[...readCollection('notifications'),{id:createId('NTF'),title:decision==='approved'?'Đã duyệt hủy đơn hàng':'Yêu cầu hủy bị từ chối',message:decision==='approved'?'Đơn hàng đã được hủy.':`Yêu cầu hủy bị từ chối: ${reason}`,read:false,userId:order.userId,customerEmail:order.customerEmail,relatedId:order.id,href:`/don-hang/${encodeURIComponent(order.id)}`,createdAt:now}];try{writeCollections(changes);setRejectReason('');notify(decision==='approved'?'Đã hủy đơn và giải phóng hàng đã giữ.':'Đã từ chối yêu cầu hủy.')}catch(error){notify(error.message||'Không thể xử lý yêu cầu hủy.')}}
  const items=order.items||[]
  return <AdminShell notify={notify}><header className="admin-page-heading"><div><span className="eyebrow blue">CHI TIẾT ĐƠN HÀNG</span><h1>{order.id}</h1><p>{order.customerName||'Khách hàng'} · {order.customerEmail||'Không có email'}</p></div><Link className="btn outline" to="/admin/don-hang"><ArrowLeft size={16}/> Danh sách</Link></header><div className="admin-detail-grid"><section className="admin-panel"><h2>Thông tin nhận hàng</h2><dl className="admin-details"><dt>Người nhận</dt><dd>{order.shippingAddress?.name||order.customerName||'—'}</dd><dt>Email</dt><dd>{order.shippingAddress?.email||order.customerEmail||'—'}</dd><dt>Điện thoại</dt><dd>{order.shippingAddress?.phone||order.customerPhone||'—'}</dd><dt>Địa chỉ</dt><dd>{order.shippingAddress?.address||'—'}</dd><dt>Thanh toán</dt><dd>{order.paymentMethod||'—'} · {order.paymentStatus||'Chưa có dữ liệu'}</dd><dt>Ngày đặt</dt><dd>{new Date(order.orderedAt||order.createdAt||0).toLocaleString('vi-VN')}</dd><dt>Kho hàng</dt><dd>{order.inventoryStatus||'Đơn cũ không có dữ liệu giữ kho'}</dd></dl><h3>Sản phẩm</h3>{items.map((item,index)=><article className="admin-request-product" key={`${item.id}-${index}`}><strong>{item.name} × {item.qty}</strong><span>{orderMoney(item.price)} / sản phẩm · {orderMoney((Number(item.price)||0)*(Number(item.qty)||0))}</span></article>)}<div className="order-totals"><p><span>Tạm tính</span><strong>{orderMoney(order.subtotal)}</strong></p><p><span>Phí vận chuyển</span><strong>{orderMoney(order.shipping)}</strong></p><p className="order-total"><span>Tổng tiền</span><strong>{orderMoney(order.total)}</strong></p></div></section><section className="admin-panel"><h2>Trạng thái và lịch sử</h2><p><span className={`admin-badge badge-${status==='delivered'?'complete':status==='cancelled'?'rejected':status==='pending'?'pending':'processing'}`}>{ORDER_STATUSES[status]||status||'Chưa có trạng thái'}</span></p><label className="field">Chuyển trạng thái<select value={nextStatus} onChange={event=>setNextStatus(event.target.value)}><option value="">Chọn bước tiếp theo</option>{allowedOrderTransitions(status,{cancellationPending:Boolean(pendingCancel)}).map(key=><option value={key} key={key}>{ORDER_STATUSES[key]}</option>)}</select></label><button className="btn primary" disabled={!nextStatus} onClick={updateStatus}>Xác nhận cập nhật</button>{pendingCancel&&<div className="admin-cancellation"><h3>Yêu cầu hủy đang chờ</h3><p><b>Lý do:</b> {pendingCancel.reason}</p><p><b>Người gửi:</b> {pendingCancel.requestedBy?.name||pendingCancel.requestedBy?.email||order.customerEmail||'Khách hàng'}</p><p><b>Thời gian:</b> {new Date(pendingCancel.requestedAt).toLocaleString('vi-VN')}</p><label className="field">Lý do từ chối<input value={rejectReason} onChange={event=>setRejectReason(event.target.value)} placeholder="Bắt buộc khi từ chối"/></label><div className="admin-modal-actions"><button className="btn primary" onClick={event=>decideCancellation('approved',event)}>Duyệt và hủy đơn</button><button className="btn outline" onClick={event=>decideCancellation('rejected',event)}>Từ chối</button></div></div>}{(order.cancellationRequests||[]).length>0&&<><h3>Lịch sử yêu cầu hủy</h3><ol className="return-timeline">{order.cancellationRequests.map(request=><li key={request.id}><span className="timeline-dot"/><div><strong>{request.status==='pending'?'Chờ xử lý':request.status==='approved'?'Đã duyệt':'Đã từ chối'}</strong><small>{new Date(request.requestedAt).toLocaleString('vi-VN')} · {request.requestedBy?.email||order.customerEmail}</small><p>{request.reason}</p>{request.adminReason&&<p>Lý do từ chối: {request.adminReason}</p>}</div></li>)}</ol></>}<h3>Lịch sử thay đổi</h3>{order.statusHistory?.length?<ol className="return-timeline">{order.statusHistory.map((entry,index)=>{const eventStatus=normalizeOrderStatus(entry.to||entry.status);return <li key={entry.id||String(entry.at)+index}><span className="timeline-dot"/><div><strong>{ORDER_STATUSES[eventStatus]||eventStatus}</strong><small>{entry.at?new Date(entry.at).toLocaleString('vi-VN'):'Không có thời gian'} · {entry.actorName||entry.adminName||entry.actorId||entry.adminEmail||'Hệ thống'}</small>{entry.note&&<p>{entry.note}</p>}</div></li>})}</ol>:<p>Đơn hàng cũ chưa có lịch sử trạng thái.</p>}</section></div></AdminShell>
}

function EvidenceGallery({ metadata }) {
  const [files,setFiles]=useState([])
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(metadata.length>0)
  useEffect(()=>{let active=true;const urls=[];(async()=>{try{const found=await Promise.all(metadata.map(item=>getEvidenceFile(item.id)));const views=found.filter(Boolean).map(item=>({ ...item, url:URL.createObjectURL(item.blob) }));urls.push(...views.map(item=>item.url));if(active)setFiles(views);if(found.some(item=>!item))setError('Một số tệp không còn trong IndexedDB của trình duyệt này.')}catch{if(active)setError('Không đọc được kho tệp minh chứng trong IndexedDB.')}finally{if(active)setLoading(false)}})();return()=>{active=false;urls.forEach(URL.revokeObjectURL)}},[metadata])
  if(!metadata.length)return <p>Không có tệp minh chứng.</p>
  if(loading)return <p role="status">Đang tải tệp minh chứng…</p>
  return <div className="admin-evidence">{error&&<p className="admin-error">{error}</p>}{files.map(file=><article key={file.id}>{file.type.startsWith('image/')?<a href={file.url} target="_blank" rel="noreferrer"><img src={file.url} alt={file.name}/></a>:<video src={file.url} controls/>}<span>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</span></article>)}</div>
}

export function AdminReturnDetail({ notify }) {
  useStoreRevision()
  const { id }=useParams()
  const request=readCollection('returnRequests').find(item=>item.id===id)
  const [modal,setModal]=useState(null)
  const [note,setNote]=useState('')
  const [amount,setAmount]=useState('')
  const [method,setMethod]=useState('wallet')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const admin=getAdminSession()
  const order=request?orderById(request.orderId):null
  if(!request)return <AdminShell notify={notify}><div className="admin-empty"><h1>Không tìm thấy yêu cầu</h1><Link to="/admin/doi-tra" className="btn outline">Quay lại danh sách</Link></div></AdminShell>
  const doTransition=async()=>{
    setError('')
    const target=modal?.status
    const check=validateReturnTransition(request.status,target)
    if(!check.valid){setError(check.error);return}
    if(target==='rejected'&&!note.trim()){setError('Cần ghi rõ lý do từ chối.');return}
    if(target==='approved'){
      const current=readCollection('returnRequests')
      const quantityCheck=validateApprovalQuantity(request,current,order)
      if(!quantityCheck.valid){setError(quantityCheck.error);return}
    }
    let refund=null
    if(target==='refunding'){
      const validation=validateRefund(request,order,amount,method)
      if(!validation.valid){setError(validation.error);return}
      refund={amount:validation.amount,method,methodLabel:REFUND_METHODS[method],note:note.trim(),isSimulated:true,recordedAt:new Date().toISOString()}
    }
    const now=new Date().toISOString(),historyEntry={status:target,at:now,adminEmail:admin.email,adminName:admin.name,note:note.trim()}
    const nextRequest={...request,status:target,statusHistory:[...(request.statusHistory||[]),historyEntry],lastUpdatedAt:now,lastUpdatedBy:admin.email}
    if(target==='rejected')nextRequest.rejectionReason=note.trim()
    if(refund)nextRequest.refund=refund
    if(target==='approved')nextRequest.approvedAt=now
    if(['refunded','exchanged','rejected'].includes(target))nextRequest.completedAt=now
    const all=readCollection('returnRequests').map(item=>item.id===request.id?nextRequest:item)
    const notifications=readCollection('notifications')
    const notification={id:createNotificationId(),type:'return-status',customerEmail:request.customerEmail,title:`Yêu cầu ${request.id} đã cập nhật`,message:`Trạng thái yêu cầu đổi trả: ${RETURN_STATUSES[target]}.`,relatedId:request.id,createdAt:now,read:false}
    setBusy(true)
    try{
      writeCollections({returnRequests:all,notifications:[notification,...notifications]})
      setModal(null);setNote('');setAmount('');notify('Đã cập nhật trạng thái yêu cầu.')
    }catch(saveError){setError(saveError.message||'Không lưu được thay đổi; dữ liệu trước đó được giữ nguyên.')}
    finally{setBusy(false)}
  }
  const cap=calculateRefundCap(request,order)
  const available=RETURN_TRANSITIONS[request.status]||[]
  const buttons=available.map(status=>({status,label:({approved:'Duyệt yêu cầu',rejected:'Từ chối',receiving:'Xác nhận nhận hàng',inspecting:'Bắt đầu kiểm tra',refunding:'Chọn hoàn tiền',exchanging:'Chọn đổi hàng',refunded:'Xác nhận đã hoàn (mô phỏng)',exchanged:'Xác nhận đã đổi hàng'})[status]}))
  const modalTitle=modal?.status==='rejected'?'Từ chối yêu cầu':modal?.status==='refunding'?'Ghi nhận phương án hoàn tiền mô phỏng':modal?.status==='exchanging'?'Xác nhận hướng đổi hàng':`Xác nhận: ${RETURN_STATUSES[modal?.status]||''}`
  return <AdminShell notify={notify}><header className="admin-page-heading"><div><span className="eyebrow blue">CHI TIẾT YÊU CẦU</span><h1>{request.id}</h1><p>Đơn {request.orderId} · <span className={`admin-badge badge-${adminStatusType(request.status)}`}>{RETURN_STATUSES[request.status]||request.status}</span></p></div><Link className="btn outline" to="/admin/doi-tra"><ArrowLeft size={16}/> Danh sách</Link></header><div className="admin-detail-grid"><section className="admin-panel"><h2>Thông tin yêu cầu</h2><dl className="admin-details"><dt>Khách hàng</dt><dd>{request.customerEmail||'Không có email'}</dd><dt>Ngày gửi</dt><dd>{new Date(request.createdAt).toLocaleString('vi-VN')}</dd><dt>Lý do</dt><dd>{RETURN_REASONS[request.reason]||request.reason}</dd><dt>Mô tả</dt><dd>{request.description||'Không có mô tả'}</dd><dt>Đơn hàng</dt><dd>{request.orderId} · Tổng {money(order?.total)}</dd></dl><h3>Sản phẩm yêu cầu</h3>{request.products?.map(product=><article className="admin-request-product" key={product.productId}><strong>{product.name} × {product.quantity}</strong><span>Đơn giá {money(product.unitPrice)} · Thành tiền {money(product.unitPrice*product.quantity)}</span></article>)}<h3>Minh chứng</h3><EvidenceGallery metadata={request.evidence||[]}/></section><section className="admin-panel"><h2>Lịch sử xử lý</h2>{request.statusHistory?.length?<ol className="return-timeline">{request.statusHistory.map((event,index)=><li key={`${event.at}-${index}`}><span className="timeline-dot"/><div><strong>{RETURN_STATUSES[event.status]||event.status}</strong><small>{new Date(event.at).toLocaleString('vi-VN')} · {event.adminName||event.adminEmail||'Khách hàng'}</small>{event.note&&<p>{event.note}</p>}</div></li>)}</ol>:<p>Chưa có lịch sử trạng thái.</p>}{request.rejectionReason&&<p className="admin-error">Lý do từ chối: {request.rejectionReason}</p>}{request.refund&&<div className="admin-refund-info"><h3>Hoàn tiền mô phỏng</h3><p>{money(request.refund.amount)} · {request.refund.methodLabel}</p><small>Chưa có giao dịch tiền thật.</small></div>}{buttons.length>0&&<div className="admin-actions"><h3>Cập nhật bước tiếp theo</h3>{buttons.map(action=><button className={`btn ${['rejected'].includes(action.status)?'outline':'primary'}`} key={action.status} onClick={()=>{setModal(action);setError('');setAmount(action.status==='refunding'?String(cap):'')}}>{action.label}</button>)}</div>}</section></div>
    {modal&&<div className="admin-modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title"><button className="admin-modal-close" aria-label="Đóng" onClick={()=>setModal(null)}><X size={18}/></button><h2 id="admin-modal-title">{modalTitle}</h2>{modal.status==='rejected'?<label className="field">Lý do từ chối<textarea rows="4" value={note} onChange={e=>setNote(e.target.value)} required/></label>:modal.status==='refunding'?<><p className="refund-cap">Giá trị tối đa theo sản phẩm/số lượng yêu cầu: <strong>{money(cap)}</strong></p><label className="field">Số tiền hoàn<input type="number" min="0" max={cap} value={amount} onChange={e=>setAmount(e.target.value)} required/></label><label className="field">Phương thức<select value={method} onChange={e=>setMethod(e.target.value)}>{Object.entries(REFUND_METHODS).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label><label className="field">Ghi chú<textarea rows="3" value={note} onChange={e=>setNote(e.target.value)}/></label><div className="refund-preview">Số tiền mô phỏng: <strong>{money(amount)}</strong></div></>:<label className="field">Ghi chú xử lý (không bắt buộc)<textarea rows="3" value={note} onChange={e=>setNote(e.target.value)}/></label>}{error&&<p className="form-error">{error}</p>}<p className="admin-modal-warning">Thao tác chỉ cập nhật dữ liệu demo trên trình duyệt; không gửi email, chuyển tiền hoặc thay đổi đơn hàng gốc.</p><div className="admin-modal-actions"><button className="btn outline" onClick={()=>setModal(null)}>Hủy</button><button className="btn primary" onClick={doTransition} disabled={busy}>{busy?'Đang lưu...':'Xác nhận'}</button></div></section></div>}
  </AdminShell>
}

function createNotificationId(){return `NT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
