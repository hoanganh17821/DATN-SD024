import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Card, Col, Empty, Input, Radio, Row, Select, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, EyeOutlined, FilterOutlined, QrcodeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import api from '../../api/axios'

const NAVY = '#1c2847'
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase()
const money = v => v == null ? '—' : `${Number(v).toLocaleString('vi-VN')} đ`
const options = (items, key) => [...new Set(items.map(item => item[key]).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b),'vi')).map(v => ({ value:v, label:v }))
const labelStyle = { display: 'block', color: '#667085', fontSize: 12, marginBottom: 7 }
const field = (label, element) => <div><span style={labelStyle}>{label}</span>{element}</div>

export default function BienTheSanPham() {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [brand, setBrand] = useState()
    const [material, setMaterial] = useState()
    const [color, setColor] = useState()
    const [size, setSize] = useState()
    const [status, setStatus] = useState('all')
    const [stockOnly, setStockOnly] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data: products } = await api.get('/admin/san-pham')
            if (!Array.isArray(products)) throw new Error('Dữ liệu sản phẩm không hợp lệ')
            const collected = []
            let failed = 0
            // Giới hạn số request đồng thời để không quá tải backend.
            for (let offset = 0; offset < products.length; offset += 6) {
                const chunk = await Promise.allSettled(products.slice(offset, offset + 6).map(p => api.get(`/admin/san-pham/${p.id}`)))
                chunk.forEach((result) => {
                    if (result.status !== 'fulfilled') { failed++; return }
                    const p = result.value.data
                    ;(p.bienThe ?? []).forEach(v => collected.push({
                        ...v, productId: p.id, maAo: p.maAo, tenAo: p.tenAo,
                        thuongHieu: p.thuongHieu, chatLieu: p.chatLieu,
                    }))
                })
            }
            setRows(collected)
            if (failed) message.warning(`Không tải được biến thể của ${failed} sản phẩm; hãy thử tải lại`)
        } catch (err) {
            message.error(err.response?.data?.message || 'Không tải được danh sách biến thể')
        } finally { setLoading(false) }
    }, [message])
    useEffect(() => { load() }, [load])

    const reset = () => {
        setSearch(''); setBrand(undefined); setMaterial(undefined); setColor(undefined)
        setSize(undefined); setStatus('all'); setStockOnly(false); setPage(1)
    }
    const change = setter => value => { setter(value); setPage(1) }
    const filtered = useMemo(() => rows.filter(r => {
        const text = [r.maAoChiTiet, r.maAo, r.tenAo].join(' ')
        return norm(text).includes(norm(search))
            && (!brand || r.thuongHieu === brand)
            && (!material || r.chatLieu === material)
            && (!color || r.tenMau === color)
            && (!size || r.tenKichThuoc === size)
            && (status === 'all' || Boolean(r.trangThai) === (status === 'on'))
            && (!stockOnly || Number(r.soLuong) > 0)
    }), [rows, search, brand, material, color, size, status, stockOnly])

    const columns = [
        { title: 'STT', width: 65, align: 'center', render: (_, _r, i) => (page-1)*pageSize+i+1 },
        { title: 'MÃ SKU', dataIndex: 'maAoChiTiet', width: 155, render: v => <b>{v || '—'}</b> },
        { title: 'TÊN SẢN PHẨM', dataIndex: 'tenAo', width: 210, ellipsis: true },
        { title: 'MÀU SẮC', dataIndex: 'tenMau', width: 130, render: (v,r) => <Space size={7}><span style={{ width: 13, height: 13, background:r.hex || '#ddd', border:'1px solid #ddd', borderRadius:'50%' }}/>{v || '—'}</Space> },
        { title: 'KÍCH THƯỚC', dataIndex: 'tenKichThuoc', width: 120, align:'center' },
        { title: 'GIÁ BÁN', dataIndex: 'giaBan', width: 145, align:'right', render: money },
        { title: 'SL TỒN', dataIndex: 'soLuong', width: 110, align:'center', render: n => <b>{n ?? 0}</b> },
        { title: 'TRẠNG THÁI', dataIndex: 'trangThai', width: 145, align:'center', render: v => <Tag style={{ border:0, borderRadius:20, color:'white', background: v ? NAVY : '#98a2b3', padding:'3px 10px' }}>{v ? 'Kinh doanh' : 'Ngừng bán'}</Tag> },
        { title: 'HÀNH ĐỘNG', width: 105, align:'center', fixed:'right', render: (_,r) => <Tooltip title="Xem chi tiết sản phẩm và biến thể"><Button type="text" aria-label={`Xem biến thể ${r.maAoChiTiet}`} icon={<EyeOutlined style={{color:NAVY}}/>} onClick={() => navigate(`/admin/san-pham/${r.productId}/xem`, { state: { variantId: r.id } })}/></Tooltip> },
    ]

    return <div style={{ minHeight:'75vh' }}>
        <Typography.Title level={4} style={{margin:'0 0 4px'}}>Biến thể sản phẩm</Typography.Title>
        <Typography.Text type="secondary">Quản lý sản phẩm / Danh sách biến thể</Typography.Text>
        <Card style={{borderRadius:10, marginTop:22, marginBottom:20}} styles={{body:{padding:'22px 24px'}}}>
            <div style={{fontWeight:650, marginBottom:18}}><FilterOutlined/> &nbsp;Bộ lọc tìm kiếm chi tiết</div>
            <Row gutter={[16,18]}>
                <Col xs={24} sm={12} xl={6}>{field('Tìm kiếm', <Input allowClear prefix={<SearchOutlined/>} value={search} onChange={e=>change(setSearch)(e.target.value)} placeholder="Tìm theo mã SKU / tên SP..." />)}</Col>
                <Col xs={24} sm={12} xl={6}>{field('Thương hiệu', <Select allowClear style={{width:'100%'}} value={brand} onChange={change(setBrand)} placeholder="Tất cả thương hiệu" options={options(rows,'thuongHieu')}/>)}</Col>
                <Col xs={24} sm={12} xl={6}>{field('Chất liệu', <Select allowClear style={{width:'100%'}} value={material} onChange={change(setMaterial)} placeholder="Tất cả chất liệu" options={options(rows,'chatLieu')}/>)}</Col>
                <Col xs={24} sm={12} xl={6}>{field('Màu sắc', <Select allowClear style={{width:'100%'}} value={color} onChange={change(setColor)} placeholder="Tất cả màu sắc" options={options(rows,'tenMau')}/>)}</Col>
                <Col xs={24} sm={12} xl={6}>{field('Kích cỡ', <Select allowClear style={{width:'100%'}} value={size} onChange={change(setSize)} placeholder="Tất cả kích cỡ" options={options(rows,'tenKichThuoc')}/>)}</Col>
                <Col xs={24} sm={12} xl={10}>{field('Trạng thái', <Radio.Group value={status} onChange={e=>change(setStatus)(e.target.value)}><Radio value="on">Kinh doanh</Radio><Radio value="off">Ngừng KD</Radio><Radio value="all">Tất cả</Radio></Radio.Group>)}</Col>
                <Col xs={24} sm={12} xl={8}>{field('Tồn kho', <Space><Switch size="small" checked={stockOnly} onChange={change(setStockOnly)} style={{background:stockOnly ? NAVY : undefined}}/>Chỉ hiển thị tồn kho &gt; 0</Space>)}</Col>
            </Row>
            <div style={{display:'flex', flexWrap:'wrap', justifyContent:'flex-end', gap:8, marginTop:20}}>
                <Button icon={<ArrowLeftOutlined/>} onClick={()=>navigate('/admin/san-pham')}>Về danh sách tổng</Button>
                <Button icon={<ReloadOutlined/>} onClick={reset}>Đặt lại</Button>
                <Button icon={<ReloadOutlined/>} onClick={load}>Tải lại dữ liệu</Button>
            </div>
        </Card>
        <Card style={{borderRadius:10}} styles={{body:{padding:20}}}>
            <Table rowKey={r=>`${r.productId}-${r.id}`} loading={loading} dataSource={filtered} columns={columns} scroll={{x:1150}} locale={{emptyText:<Empty description="Không có biến thể phù hợp"/>}} pagination={{ current:page, pageSize, showSizeChanger:true, pageSizeOptions:['10','20','50','100'], onChange:(p,s)=>{setPage(p);setPageSize(s)}, showTotal:n=>`Hiển thị ${n} biến thể`}}/>
        </Card>
    </div>
}
