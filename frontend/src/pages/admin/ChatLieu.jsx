import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, App, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, FilterOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../../api/axios'

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const styles = `
.ms-page { color: #111827; font-size: 13px; }
.ms-panel { background: #fff; border: 1px solid #eaecf0; border-radius: 10px; padding: 20px 22px; margin-bottom: 18px; }
.ms-heading { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 700; margin-bottom: 19px; }
.ms-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; max-width: 780px; }
.ms-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.ms-field > span, .ms-field-title { font-size: 12px; color: #667085; }
.ms-field .ant-input-affix-wrapper, .ms-field .ant-select-selector { border-radius: 7px !important; min-height: 35px; }
.ms-field .ant-select { width: 100%; height: 35px; }
.ms-bottom { display: flex; justify-content: flex-end; align-items: flex-end; gap: 14px; flex-wrap: wrap; margin-top: 20px; }
.ms-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ms-actions .ant-btn { height: 34px; background: #f7f8fa; border: 1px solid #e4e7ec; color: #344054; border-radius: 8px; font-size: 12px; font-weight: 600; box-shadow: none; }
.ms-actions .ant-btn:hover { background: #edf0f5 !important; color: #17233e !important; border-color: #cfd6e2 !important; }
.ms-table-panel { padding: 18px 20px 12px; }
.ms-table-panel .ant-table-thead > tr > th { background: #f7f8fa !important; color: #172033 !important; font-size: 12px; font-weight: 700; padding: 14px 12px !important; white-space: nowrap; }
.ms-table-panel .ant-table-tbody > tr > td { font-size: 12px; color: #283142; padding: 14px 12px !important; border-bottom: 1px solid #eef0f3; }
.ms-table-panel .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
.ms-status { display: inline-block; border-radius: 16px; padding: 5px 12px; font-size: 11px; color: #fff; white-space: nowrap; }
.ms-status-on { background: #1c2847; }
.ms-status-off { background: #98a2b3; }
.ms-table-panel .ant-pagination-item-active { background: #1c2847; border-color: #1c2847; }
.ms-table-panel .ant-pagination-item-active a { color: #fff; }
.ms-table-panel .ant-btn { border-radius: 7px; }
@media (max-width: 650px) { .ms-grid { grid-template-columns: 1fr; } .ms-panel { padding: 14px; } }
`

export default function ChatLieu() {
    const { message } = App.useApp()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [form] = Form.useForm()
    const load = async () => {
        setLoading(true)
        try {
            const response = await api.get('/admin/chat-lieu')
            setRows(Array.isArray(response.data) ? response.data : [])
        } catch (err) { message.error(err.response?.data?.message || 'Không tải được danh sách chất liệu') }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    const filtered = useMemo(() => rows.filter(r =>
        (normalize(r.tenChatLieu).includes(normalize(search.trim())) || normalize(r.maChatLieu).includes(normalize(search.trim()))) &&
        (status === 'all' || (status === 'on' ? r.trangThai === true : r.trangThai === false))
    ), [rows, search, status])
    const showForm = (record = null) => {
        setEditing(record)
        form.resetFields()
        form.setFieldsValue(record || { trangThai: true })
        setOpen(true)
    }
    const submit = async () => {
        let values
        try { values = await form.validateFields() } catch { return }
        setSaving(true)
        try {
            if (editing) await api.put(`/admin/chat-lieu/${editing.id}`, values)
            else await api.post('/admin/chat-lieu', values)
            message.success(editing ? 'Cập nhật chất liệu thành công' : 'Thêm chất liệu thành công')
            setOpen(false)
            await load()
        } catch (err) { message.error(err.response?.data?.message || err.response?.data?.error || 'Không lưu được chất liệu') }
        finally { setSaving(false) }
    }
    const columns = [
        { title: 'STT', width: 70, align: 'center', render: (_, __, i) => (page - 1) * pageSize + i + 1 },
        { title: 'Mã chất liệu', dataIndex: 'maChatLieu', width: 160 },
        { title: 'Tên chất liệu', dataIndex: 'tenChatLieu', width: 220 },
        { title: 'Mô tả', dataIndex: 'moTa', render: v => v || '—' },
        { title: 'Trạng thái', dataIndex: 'trangThai', width: 150,
            render: v => <span className={`ms-status ${v ? 'ms-status-on' : 'ms-status-off'}`}>{v ? 'Hoạt động' : 'Ngừng'}</span> },
        { title: 'Thao tác', width: 110, align: 'center', render: (_, r) =>
                <Space><Tooltip title="Chỉnh sửa"><Button aria-label="Chỉnh sửa chất liệu" icon={<EditOutlined />} onClick={() => showForm(r)} /></Tooltip></Space> }
    ]
    return <div className="ms-page">
        <style>{styles}</style>
        <section className="ms-panel">
            <div className="ms-heading"><FilterOutlined /> Bộ lọc tìm kiếm</div>
            <div className="ms-grid">
                <label className="ms-field"><span>Tìm theo mã hoặc tên chất liệu</span>
                    <Input allowClear prefix={<SearchOutlined style={{ color: '#98a2b3' }} />} placeholder="Nhập mã hoặc tên chất liệu..."
                           value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></label>
                <label className="ms-field"><span>Trạng thái</span>
                    <Select value={status} onChange={v => { setStatus(v); setPage(1) }}
                            options={[{ value: 'all', label: 'Tất cả trạng thái' }, { value: 'on', label: 'Hoạt động' }, { value: 'off', label: 'Ngừng' }]} /></label>
            </div>
            <div className="ms-bottom"><div className="ms-actions">
                <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setStatus('all'); setPage(1) }}>Đặt lại bộ lọc</Button>
                <Button icon={<ReloadOutlined />} onClick={load}>Tải lại</Button>
                <Button icon={<PlusOutlined />} style={{ background: '#1c2847', color: '#fff', borderColor: '#1c2847' }} onClick={() => showForm()}>Thêm chất liệu</Button>
            </div></div>
        </section>
        <section className="ms-panel ms-table-panel">
            <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} scroll={{ x: 800 }}
                   pagination={{ current: page, pageSize, pageSizeOptions: [10,20,50,100], showSizeChanger: true,
                       position: ['bottomCenter'], showTotal: total => `Tổng ${total} chất liệu`,
                       onChange: (p, s) => { setPage(p); setPageSize(s) } }}
                   locale={{ emptyText: 'Không tìm thấy chất liệu phù hợp' }} />
        </section>
        <Modal title={editing ? 'Sửa chất liệu' : 'Thêm chất liệu'} open={open} onCancel={() => setOpen(false)}
               onOk={submit} confirmLoading={saving} okText="Lưu" cancelText="Hủy" destroyOnClose>
            <Form form={form} layout="vertical">
                <Form.Item name="maChatLieu" label="Mã chất liệu" rules={[{ required:true, whitespace:true, message:'Vui lòng nhập mã chất liệu' }]}>
                    <Input maxLength={50} /></Form.Item>
                <Form.Item name="tenChatLieu" label="Tên chất liệu" rules={[{ required:true, whitespace:true, message:'Vui lòng nhập tên chất liệu' }]}>
                    <Input maxLength={150} /></Form.Item>
                <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={3} maxLength={255} showCount /></Form.Item>
                <Form.Item name="trangThai" label="Trạng thái"><Select options={[{ value:true, label:'Hoạt động' }, { value:false, label:'Ngừng' }]} /></Form.Item>
            </Form>
        </Modal>
    </div>
}
