import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Input, Select, Space, Switch, App, Radio, Tooltip } from 'antd'
import {
    FilterOutlined, SearchOutlined, PlusOutlined, EyeOutlined,
    ReloadOutlined, ExportOutlined, UnorderedListOutlined,
} from '@ant-design/icons'
import api from '../../api/axios'
// Giao diện được khai báo ngay trong file này, không cần SanPham.css

const productPageStyles = '.sp-management { color: #172033; font-size: 13px; }\n.sp-panel { background: #fff; border: 1px solid #e8eaee; border-radius: 9px; box-shadow: 0 3px 16px rgba(66,44,31,.045); padding: 20px 22px; margin-bottom: 18px; }\n.sp-heading { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 14px; margin-bottom: 19px; }\n.sp-filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }\n.sp-field { display: flex; flex-direction: column; min-width: 0; gap: 6px; }\n.sp-field > span, .sp-field-title { font-size: 12px; color: #667085; }\n.sp-field .ant-select { width: 100%; }\n.sp-field .ant-input-affix-wrapper, .sp-field .ant-select-selector { border-radius: 22px !important; min-height: 34px; }\n.sp-field .ant-select-single { height: 34px; }\n.sp-bottom-controls { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-top: 20px; }\n.sp-state-filter { display: flex; flex-direction: column; gap: 7px; }\n.sp-state-filter .ant-radio-group { border: 1px solid #e5e7eb; padding: 7px 10px; border-radius: 24px; white-space: nowrap; }\n.sp-state-filter .ant-radio-wrapper { font-size: 12px; margin-right: 13px; }\n.sp-state-filter .ant-radio-wrapper:last-child { margin-right: 0; }\n.sp-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }\n.sp-actions .ant-btn { border: 0; background: #f3f4f6; color: #1f2937; border-radius: 22px; height: 33px; padding-inline: 14px; font-size: 12px; font-weight: 600; box-shadow: none; }\n.sp-actions .ant-btn:hover { background: #e7e9ed !important; color: #1d2939 !important; }\n.sp-actions .sp-reset { background: #fff; border: 1px solid #d0d5dd; }\n.sp-table-panel { padding: 18px 20px 12px; }\n.sp-table-panel .ant-table-thead > tr > th { background: #f7f8fa !important; color: #243044 !important; font-size: 11px; font-weight: 700; padding: 14px 12px !important; white-space: nowrap; }\n.sp-table-panel .ant-table-thead > tr > th:first-child { border-radius: 5px 0 0 5px !important; }\n.sp-table-panel .ant-table-thead > tr > th:last-child { border-radius: 0 5px 5px 0 !important; }\n.sp-table-panel .ant-table-tbody > tr > td { font-size: 12px; padding: 14px 12px !important; border-bottom: 1px solid #eef0f3; }\n.sp-table-panel .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }\n.sp-status { display: inline-block; padding: 5px 12px; border-radius: 16px; font-size: 11px; color: white; white-space: nowrap; }\n.sp-status-on { background: #1d2a4b; }\n.sp-status-off { background: #98a2b3; }\n.sp-eye { color: #1d2a4b; }\n.sp-muted { color: #98a2b3; }\n.sp-management .ant-switch.ant-switch-checked { background: #1d2a4b; }\n.sp-management .ant-radio-checked .ant-radio-inner { border-color: #1d2a4b; background: #1d2a4b; }\n.sp-table-panel .ant-pagination-item-active { background: #1d2a4b; border-color: #1d2a4b; }\n.sp-table-panel .ant-pagination-item-active a { color: #fff; }\n.sp-table-footer { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: #667085; margin-top: -25px; pointer-events: none; }\n@media (max-width: 1050px) { .sp-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .sp-bottom-controls { align-items: flex-start; } .sp-actions { justify-content: flex-start; } .sp-table-footer { margin-top: 10px; } }\n@media (max-width: 600px) { .sp-panel { padding: 14px; } .sp-filter-grid { grid-template-columns: 1fr; } .sp-state-filter .ant-radio-group { white-space: normal; } .sp-table-footer { flex-wrap: wrap; } }\n\n/* Giữ màu cùng hệ thống Admin POLO HOUSE */\n.sp-management { color: #111827; }\n.sp-panel { border: 1px solid #eaecf0; box-shadow: none; border-radius: 10px; }\n.sp-heading { color: #111827; }\n.sp-actions .ant-btn { background: #f7f8fa; border: 1px solid #e4e7ec; color: #344054; border-radius: 8px; }\n.sp-actions .ant-btn:hover { background: #edf0f5 !important; color: #17233e !important; border-color: #cfd6e2 !important; }\n.sp-actions .sp-reset { background: white; }\n.sp-table-panel .ant-table-thead > tr > th { background: #f7f8fa !important; color: #172033 !important; font-size: 12px; }\n.sp-table-panel .ant-table-tbody > tr > td { color: #283142; }\n.sp-status-on { background: #1c2847; }\n.sp-status-off { background: #98a2b3; }\n.sp-management .ant-switch.ant-switch-checked { background: #1c2847; }\n.sp-management .ant-radio-checked .ant-radio-inner { background: #1c2847; border-color: #1c2847; }\n.sp-table-panel .ant-pagination-item-active { background: #1c2847; border-color: #1c2847; }\n.sp-field .ant-input-affix-wrapper, .sp-field .ant-select-selector { border-radius: 7px !important; }\n.sp-state-filter .ant-radio-group { border-radius: 7px; }\n'

const ALL = 'all'
const normalize = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export default function SanPham() {
    const { message } = App.useApp()
    const navigate = useNavigate()
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [material, setMaterial] = useState(ALL)
    const [brand, setBrand] = useState(ALL)
    const [status, setStatus] = useState(ALL)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [updatingId, setUpdatingId] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/san-pham')
            setData(Array.isArray(res.data) ? res.data : [])
        } catch {
            message.error('Không tải được danh sách sản phẩm. Vui lòng kiểm tra kết nối backend.')
        } finally {
            setLoading(false)
        }
    }, [message])

    useEffect(() => { load() }, [load])

    const materials = useMemo(() => [...new Set(data.map(x => x.chatLieu).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'vi')), [data])
    const brands = useMemo(() => [...new Set(data.map(x => x.thuongHieu).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'vi')), [data])

    const filtered = useMemo(() => data.filter(d => {
        const text = normalize(`${d.maAo ?? ''} ${d.tenAo ?? ''}`)
        return text.includes(normalize(search.trim()))
            && (material === ALL || d.chatLieu === material)
            && (brand === ALL || d.thuongHieu === brand)
            && (status === ALL || (status === 'on' ? d.trangThai === true : d.trangThai === false))
    }), [data, search, material, brand, status])

    const changeFilter = (setter) => (value) => { setter(value); setPage(1) }
    const reset = () => { setSearch(''); setMaterial(ALL); setBrand(ALL); setStatus(ALL); setPage(1) }

    const toggle = async (record, value) => {
        setUpdatingId(record.id)
        try {
            await api.put(`/admin/san-pham/${record.id}/trang-thai`, null, { params: { value } })
            await load()
            message.success(value ? 'Đã bật sản phẩm; các biến thể đã tắt vẫn giữ nguyên trạng thái' : 'Đã ngừng kinh doanh sản phẩm và toàn bộ biến thể')
        } catch {
            message.error('Không cập nhật được trạng thái sản phẩm')
        } finally {
            setUpdatingId(null)
        }
    }

    const exportExcel = () => {
        if (!filtered.length) { message.warning('Không có sản phẩm để xuất'); return }
        const header = ['STT', 'Mã sản phẩm', 'Tên sản phẩm', 'Chất liệu', 'Thương hiệu', 'SL tồn', 'Trạng thái']
        const rows = filtered.map((r, i) => [i + 1, r.maAo, r.tenAo, r.chatLieu, r.thuongHieu, r.tongTon,
            r.trangThai ? 'Kinh doanh' : 'Ngừng kinh doanh'])
        const csv = '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
        const a = document.createElement('a')
        a.href = url
        a.download = 'danh-sach-san-pham.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        message.success('Đã xuất danh sách (CSV mở được bằng Excel)')
    }

    const columns = [
        { title: 'STT', key: 'stt', width: 62, align: 'center', render: (_, __, index) => (page - 1) * pageSize + index + 1 },
        { title: 'MÃ SẢN PHẨM', dataIndex: 'maAo', key: 'maAo', width: 135, render: t => <strong>{t || '—'}</strong> },
        { title: 'TÊN SẢN PHẨM', dataIndex: 'tenAo', key: 'tenAo', ellipsis: true, width: 185 },
        { title: 'CHẤT LIỆU', dataIndex: 'chatLieu', key: 'chatLieu', width: 120, render: t => t || '—' },
        { title: 'THƯƠNG HIỆU', dataIndex: 'thuongHieu', key: 'thuongHieu', width: 145, render: t => t || '—' },
        { title: 'SL TỒN', dataIndex: 'tongTon', key: 'tongTon', width: 90, align: 'center', render: t => <strong>{t ?? 0}</strong> },
        // Backend chưa lưu hoặc trả về danh mục sản phẩm, nên chưa thể hiển thị giá trị thật.
        { title: 'DANH MỤC', key: 'category', width: 115, render: () => <span className="sp-muted">—</span> },
        { title: 'TRẠNG THÁI', dataIndex: 'trangThai', key: 'trangThai', width: 132, align: 'center', render: value => (
                <span className={`sp-status ${value ? 'sp-status-on' : 'sp-status-off'}`}>{value ? 'Kinh doanh' : 'Ngừng kinh doanh'}</span>
            ) },
        { title: 'HÀNH ĐỘNG', key: 'actions', width: 120, align: 'center', render: (_, record) => (
                <Space size={12}>
                    <Tooltip title={record.trangThai ? 'Ngừng kinh doanh' : 'Bật kinh doanh'}>
                        <Switch size="small" checked={!!record.trangThai} loading={updatingId === record.id}
                                disabled={updatingId !== null} onChange={checked => toggle(record, checked)} />
                    </Tooltip>
                    <Tooltip title="Xem sản phẩm (chỉ đọc)">
                        <Button className="sp-eye" type="text" size="small" icon={<EyeOutlined />}
                                onClick={() => navigate(`/admin/san-pham/${record.id}/xem`)} aria-label={`Xem sản phẩm ${record.maAo}`} />
                    </Tooltip>
                </Space>
            ) },
    ]

    return (
        <div className="sp-management">
            <style>{productPageStyles}</style>
            <section className="sp-panel sp-filter-panel">
                <div className="sp-heading"><FilterOutlined /> Bộ lọc tìm kiếm</div>
                <div className="sp-filter-grid">
                    <label className="sp-field"><span>Tìm kiếm</span>
                        <Input allowClear prefix={<SearchOutlined className="sp-muted" />} placeholder="Tìm theo mã / tên sản phẩm..."
                               value={search} onChange={e => changeFilter(setSearch)(e.target.value)} />
                    </label>
                    <label className="sp-field"><span>Chất liệu</span>
                        <Select value={material} onChange={changeFilter(setMaterial)} options={[{ value: ALL, label: 'Tất cả chất liệu' },
                            ...materials.map(x => ({ value: x, label: x }))]} />
                    </label>
                    <label className="sp-field"><span>Thương hiệu</span>
                        <Select value={brand} onChange={changeFilter(setBrand)} options={[{ value: ALL, label: 'Tất cả thương hiệu' },
                            ...brands.map(x => ({ value: x, label: x }))]} />
                    </label>
                    <label className="sp-field"><span>Danh mục</span>
                        <Tooltip title="Cần bổ sung dữ liệu danh mục ở backend để sử dụng bộ lọc này">
                            <Select disabled value={ALL} options={[{ value: ALL, label: 'Chưa có dữ liệu danh mục' }]} />
                        </Tooltip>
                    </label>
                </div>
                <div className="sp-bottom-controls">
                    <div className="sp-state-filter"><span className="sp-field-title">Trạng thái</span>
                        <Radio.Group value={status} onChange={e => changeFilter(setStatus)(e.target.value)}>
                            <Radio value="on">Kinh doanh</Radio>
                            <Radio value="off">Ngừng kinh doanh</Radio>
                            <Radio value={ALL}>Tất cả</Radio>
                        </Radio.Group>
                    </div>
                    <div className="sp-actions">
                        <Button icon={<ExportOutlined />} onClick={exportExcel}>Xuất Excel</Button>
                        <Button icon={<PlusOutlined />} onClick={() => navigate('/admin/san-pham/them')}>Thêm sản phẩm chi tiết</Button>
                        <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/admin/bien-the-san-pham')}>Danh sách chi tiết sản phẩm</Button>
                        <Button className="sp-reset" icon={<ReloadOutlined />} onClick={reset}>Đặt lại bộ lọc</Button>
                    </div>
                </div>
            </section>

            <section className="sp-panel sp-table-panel">
                <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns}
                       scroll={{ x: 1120 }} size="middle" tableLayout="fixed"
                       pagination={{ current: page, pageSize, pageSizeOptions: [10, 20, 50, 100], showSizeChanger: true,
                           position: ['bottomCenter'], onChange: (p, size) => { setPage(p); setPageSize(size) },
                           showTotal: (total) => `Hiển thị ${total} bản ghi` }}
                       locale={{ emptyText: 'Không tìm thấy sản phẩm phù hợp' }} />
                <div className="sp-table-footer"><span>Hiển thị <b>{filtered.length ? Math.min((page - 1) * pageSize + 1, filtered.length) : 0}–{Math.min(page * pageSize, filtered.length)}</b> / <b>{filtered.length}</b> bản ghi</span>
                    <span>Hiển thị tối đa {pageSize} bản ghi / trang</span></div>
            </section>
        </div>
    )
}
