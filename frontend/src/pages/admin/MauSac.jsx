import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, ColorPicker, Space, App } from 'antd'
import { PlusOutlined, EditOutlined, FilterOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../../api/axios'

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

// Dùng cùng các lớp giao diện với bảng Quản lý sản phẩm; không cần file CSS riêng.
const mauSacStyles = `
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

export default function MauSac() {
    const { message } = App.useApp()
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [form] = Form.useForm()

    const load = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/mau-sac')
            setData(res.data)
        } catch {
            message.error('Không tải được dữ liệu. Kiểm tra backend đã chạy chưa.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const openForm = (record) => {
        setEditing(record)
        form.resetFields()
        form.setFieldsValue(record ?? { maHex: '#1f2a44', trangThai: true })
        setOpen(true)
    }

    const submit = async () => {
        const values = await form.validateFields()
        const hex = typeof values.maHex === 'string' ? values.maHex : values.maHex?.toHexString()
        const body = { ...values, maHex: hex }
        try {
            if (editing) await api.put(`/admin/mau-sac/${editing.id}`, body)
            else await api.post('/admin/mau-sac', body)
            message.success(editing ? 'Cập nhật thành công' : 'Thêm mới thành công')
            setOpen(false)
            load()
        } catch (e) {
            message.error(e.response?.data?.message ?? 'Có lỗi xảy ra')
        }
    }


    const filtered = useMemo(() => data.filter(d =>
        normalize(d.tenMau).includes(normalize(search.trim())) &&
        (status === 'all' || (status === 'on' ? d.trangThai === true : d.trangThai === false))
    ), [data, search, status])
    const resetFilters = () => { setSearch(''); setStatus('all'); setPage(1) }

    const columns = [
        { title: 'STT', width: 70, align: 'center', render: (_, __, i) => (page - 1) * pageSize + i + 1 },
        { title: 'Mã màu', dataIndex: 'maMau', width: 120 },
        { title: 'Tên màu', dataIndex: 'tenMau', width: 180 },
        {
            title: 'Màu', dataIndex: 'maHex', width: 160,
            render: (hex) => (
                <Space>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: hex,
                        border: '1px solid #d9d9d9', display: 'inline-block' }} />
                    {hex}
                </Space>
            ),
        },
        { title: 'Mô tả', dataIndex: 'moTa' },
        {
            title: 'Trạng thái', dataIndex: 'trangThai', width: 130,
            render: (v) => <span className={`ms-status ${v ? 'ms-status-on' : 'ms-status-off'}`}>{v ? 'Hoạt động' : 'Ngừng'}</span>,
        },
        {
            title: 'Thao tác', width: 120, align: 'center',
            render: (_, r) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => openForm(r)} />
                </Space>
            ),
        },
    ]

    return (
        <div className="ms-page">
            <style>{mauSacStyles}</style>
            <section className="ms-panel">
                <div className="ms-heading"><FilterOutlined /> Bộ lọc tìm kiếm</div>
                <div className="ms-grid">
                    <label className="ms-field">
                        <span>Tìm kiếm theo tên màu</span>
                        <Input allowClear prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
                               placeholder="Nhập tên màu cần tìm..." value={search}
                               onChange={e => { setSearch(e.target.value); setPage(1) }} />
                    </label>
                    <label className="ms-field">
                        <span>Trạng thái</span>
                        <Select value={status} onChange={v => { setStatus(v); setPage(1) }}
                                options={[{ value: 'all', label: 'Tất cả trạng thái' }, { value: 'on', label: 'Hoạt động' }, { value: 'off', label: 'Ngừng' }]} />
                    </label>
                </div>
                <div className="ms-bottom">
                    <div className="ms-actions">
                        <Button icon={<ReloadOutlined />} onClick={resetFilters}>Đặt lại bộ lọc</Button>
                        <Button icon={<ReloadOutlined />} onClick={load}>Tải lại</Button>
                        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1c2847', color: '#fff', borderColor: '#1c2847' }}
                                onClick={() => openForm(null)}>Thêm màu</Button>
                    </div>
                </div>
            </section>
            <section className="ms-panel ms-table-panel">
                <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns}
                       scroll={{ x: 850 }} size="middle"
                       pagination={{ current: page, pageSize, pageSizeOptions: [10, 20, 50, 100], showSizeChanger: true,
                           position: ['bottomCenter'], showTotal: total => `Tổng ${total} màu`,
                           onChange: (nextPage, nextSize) => { setPage(nextPage); setPageSize(nextSize) } }}
                       locale={{ emptyText: 'Không tìm thấy màu sắc phù hợp' }} />
            </section>

            <Modal title={editing ? 'Sửa màu sắc' : 'Thêm màu sắc'} open={open} destroyOnClose
                   onOk={submit} onCancel={() => setOpen(false)} okText="Lưu" cancelText="Hủy">
                <Form form={form} layout="vertical">
                    <Form.Item name="maMau" label="Mã màu" rules={[{ required: true, message: 'Nhập mã màu' }]}>
                        <Input placeholder="VD: MAU06" />
                    </Form.Item>
                    <Form.Item name="tenMau" label="Tên màu" rules={[{ required: true, message: 'Nhập tên màu' }]}>
                        <Input placeholder="VD: Xanh navy" />
                    </Form.Item>
                    <Form.Item name="maHex" label="Chọn màu">
                        <ColorPicker showText format="hex" />
                    </Form.Item>
                    <Form.Item name="moTa" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
                    <Form.Item name="trangThai" label="Trạng thái">
                        <Select options={[{ value: true, label: 'Hoạt động' }, { value: false, label: 'Ngừng' }]} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}