import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Card, Col, Empty, Form, Image, Input, InputNumber, Modal, Row, Select, Slider, Space, Spin, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, EyeOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import api from '../../api/axios'
import { imgUrl } from '../../data/products'

const NAVY = '#1C2847'
const money = v => v == null ? '—' : `${Number(v).toLocaleString('vi-VN')}đ`
const normalize = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase()
const uniqueOptions = (items, field) => [...new Set(items.map(row => row[field]).filter(Boolean))].map(value => ({ label: value, value }))

// Trang chỉ xem: mọi bộ lọc thực hiện phía frontend, không ghi dữ liệu về backend.
export default function SanPhamView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message, modal } = App.useApp()
    const [product, setProduct] = useState(null)
    const [photos, setPhotos] = useState([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')
    const [brand, setBrand] = useState()
    const [color, setColor] = useState()
    const [size, setSize] = useState()
    const [stockOnly, setStockOnly] = useState(false)
    const [price, setPrice] = useState(null)
    const [page, setPage] = useState(1)
    const [variantModal, setVariantModal] = useState(null)
    const [viewVariant, setViewVariant] = useState(null)
    const [saving, setSaving] = useState(false)
    const [uploadFiles, setUploadFiles] = useState([])
    const [deletingImageId, setDeletingImageId] = useState(null)
    const [catalog, setCatalog] = useState({ mauSac: [], kichThuoc: [] })
    const [variantForm] = Form.useForm()
    useEffect(() => { api.get('/admin/danh-muc').then(({ data }) => setCatalog(data)).catch(() => message.warning('Không tải được danh mục màu và kích cỡ')) }, [message])
    const openVariant = row => {
        setUploadFiles([])
        setVariantModal(row || 'new')
        variantForm.setFieldsValue(row ? {
            idMau: row.idMau, idKichThuoc: row.idKichThuoc,
            giaBanBanDau: row.giaBanBanDau, giaBan: row.giaBan,
            soLuong: row.soLuong, trangThai: row.trangThai !== false
        } : { idMau: undefined, idKichThuoc: undefined, giaBanBanDau: null, giaBan: null, soLuong: 0, trangThai: true })
    }
    const saveVariant = async () => {
        try {
            const body = await variantForm.validateFields()
            setSaving(true)
            const endpoint = `/admin/san-pham/${id}/bien-the`
            if (variantModal === 'new') await api.post(endpoint, body)
            else await api.put(`${endpoint}/${variantModal.id}`, body)
            let failedUploads = 0
            for (const file of uploadFiles) {
                const fd = new FormData()
                fd.append('file', file)
                fd.append('idMau', String(body.idMau))
                try { await api.post(`/admin/san-pham/${id}/anh`, fd) }
                catch { failedUploads += 1 }
            }
            if (failedUploads) message.warning(`Đã lưu biến thể, nhưng ${failedUploads}/${uploadFiles.length} ảnh tải lên thất bại (mỗi màu tối đa 8 ảnh)`)
            if (!failedUploads) message.success(variantModal === 'new' ? 'Đã thêm biến thể và ảnh' : 'Đã cập nhật biến thể và ảnh')
            setVariantModal(null)
            await load()
        } catch (e) {
            if (!e?.errorFields) message.error(e.response?.data?.message || 'Không thể lưu biến thể')
        } finally { setSaving(false) }
    }

    const deleteImage = photo => {
        modal.confirm({
            title: 'Xóa ảnh sản phẩm?',
            content: 'Ảnh này dùng chung cho các biến thể cùng màu. Xóa ảnh sẽ cập nhật dữ liệu trên hệ thống và không thể hoàn tác.',
            okText: 'Xóa ảnh', okType: 'danger', cancelText: 'Hủy',
            onOk: async () => {
                setDeletingImageId(photo.id)
                try {
                    await api.delete(`/admin/anh/${photo.id}`)
                    setPhotos(current => current.filter(item => item.id !== photo.id))
                    message.success('Đã xóa ảnh thành công')
                } catch (e) { message.error(e.response?.data?.message || 'Xóa ảnh thất bại') }
                finally { setDeletingImageId(null) }
            },
        })
    }
    const [previewUrls, setPreviewUrls] = useState([])
    useEffect(() => {
        const urls = uploadFiles.map(file => URL.createObjectURL(file))
        setPreviewUrls(urls)
        return () => urls.forEach(url => URL.revokeObjectURL(url))
    }, [uploadFiles])
    const currentColorId = Form.useWatch('idMau', variantForm)
    const load = async () => {
        setLoading(true)
        try {
            const [info, images] = await Promise.allSettled([
                api.get(`/admin/san-pham/${id}`),
                api.get(`/admin/san-pham/${id}/anh`),
            ])
            if (info.status === 'fulfilled') setProduct(info.value.data)
            else { setProduct(null); message.error('Không tải được thông tin sản phẩm') }
            if (images.status === 'fulfilled') setPhotos(Array.isArray(images.value.data) ? images.value.data : [])
            else { setPhotos([]); message.warning('Không tải được ảnh sản phẩm') }
        } finally { setLoading(false) }
    }
    useEffect(() => {
        let cancelled = false
        const run = async () => {
            setLoading(true)
            try {
                const [p, a] = await Promise.allSettled([api.get(`/admin/san-pham/${id}`), api.get(`/admin/san-pham/${id}/anh`)])
                if (cancelled) return
                if (p.status === 'fulfilled') setProduct(p.value.data)
                else { setProduct(null); message.error('Không tải được thông tin sản phẩm') }
                if (a.status === 'fulfilled') setPhotos(Array.isArray(a.value.data) ? a.value.data : [])
                else { setPhotos([]); message.warning('Không tải được ảnh sản phẩm') }
            } finally { if (!cancelled) setLoading(false) }
        }
        run()
        return () => { cancelled = true }
    }, [id, message])

    const variants = product?.bienThe ?? []
    const prices = variants.map(v => Number(v.giaBan)).filter(Number.isFinite)
    const minimum = prices.length ? Math.floor(Math.min(...prices)) : 0
    const maximum = prices.length ? Math.ceil(Math.max(...prices)) : 5000000
    const low = Math.min(minimum, maximum)
    const high = Math.max(maximum, low + 1)
    const range = price && price[0] >= low && price[1] <= high ? price : [low, high]
    const brandName = product?.thuongHieu ?? ''

    const reset = () => { setQuery(''); setBrand(undefined); setColor(undefined); setSize(undefined); setStockOnly(false); setPrice(null); setPage(1) }
    const filtered = useMemo(() => variants.filter(v => {
        const sku = v.maAoChiTiet || [product?.maAo, v.tenMau, v.tenKichThuoc].filter(Boolean).join('_')
        const p = Number(v.giaBan)
        return (!query || normalize(`${sku} ${product?.maAo} ${product?.tenAo}`).includes(normalize(query)))
            && (!brand || brand === brandName)
            && (!color || color === v.tenMau)
            && (!size || size === v.tenKichThuoc)
            && (!stockOnly || Number(v.soLuong) > 0)
            && (price == null || (p >= price[0] && p <= price[1]))
    }), [variants, query, brand, color, size, stockOnly, price, brandName, product?.maAo, product?.tenAo])

    const imagesOf = item => {
        const specific = photos.filter(photo => String(photo.idMau) === String(item.idMau))
        return specific.length ? specific : photos.filter(photo => photo.idMau == null)
    }
    const columns = [
        { title: 'STT', width: 60, align: 'center', render: (_, row, index) => (page - 1) * 10 + index + 1 },
        { title: 'MÃ SP', dataIndex: 'maAo', width: 100, render: () => <b>{product?.maAo || '—'}</b> },
        { title: 'MÃ SKU', dataIndex: 'maAoChiTiet', width: 170, render: (v, row) => v || [product?.maAo, row.tenMau, row.tenKichThuoc].join('_') },
        { title: 'ẢNH', width: 90, align: 'center', render: (_, item) => {
                const images = imagesOf(item)
                return images.length ? <Image.PreviewGroup>
                    {images.map((image, index) => <Image key={image.id ?? index} src={imgUrl(image.url)} alt={`Ảnh ${item.tenMau || ''}`} width={48} height={54} style={{ borderRadius: 5, objectFit: 'cover', display: index ? 'none' : undefined }} />)}
                </Image.PreviewGroup> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} style={{ margin: 0 }} />
            } },
        { title: 'THƯƠNG HIỆU', width: 160, render: () => brandName || '—' },
        { title: 'MÀU SẮC', dataIndex: 'tenMau', width: 115, render: (text, item) => <Space size={6}><span style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', border: '1px solid #d9d9d9', background: item.hex || '#ddd' }} />{text || '—'}</Space> },
        { title: 'KÍCH CỠ', dataIndex: 'tenKichThuoc', width: 100, align: 'center' },
        { title: 'GIÁ BÁN', dataIndex: 'giaBan', width: 120, align: 'right', render: money },
        { title: 'GIẢM', width: 90, align: 'center', render: (_, v) => Number(v.giaBanBanDau) > Number(v.giaBan) ? `${Math.round((1 - Number(v.giaBan) / Number(v.giaBanBanDau)) * 100)}%` : '—' },
        { title: 'TỒN KHO', dataIndex: 'soLuong', width: 100, align: 'center', render: v => <b>{v ?? 0}</b> },
        { title: 'TRẠNG THÁI', dataIndex: 'trangThai', width: 135, align: 'center', render: active => <Tag style={{ background: active ? NAVY : '#98a2b3', color: '#fff', border: 0, borderRadius: 20, margin: 0 }}>{active ? 'Kinh doanh' : 'Ngừng bán'}</Tag> },
        { title: 'HÀNH ĐỘNG', width: 115, align: 'center', render: (_, item) => <Space size={2}>
                <Tooltip title="Xem chi tiết biến thể"><Button type="text" icon={<EyeOutlined style={{ color: NAVY }} />} onClick={() => setViewVariant(item)} /></Tooltip>
                <Tooltip title="Cập nhật biến thể"><Button type="text" icon={<EditOutlined style={{ color: NAVY }} />} onClick={() => openVariant(item)} /></Tooltip>
            </Space> },
    ]

    return <Spin spinning={loading}>
        <div style={{ minHeight: '75vh', color: '#20242d' }}>
            <div style={{ marginBottom: 22 }}>
                <Typography.Title level={4} style={{ marginBottom: 4 }}>Chi tiết sản phẩm | {product?.maAo || id}</Typography.Title>
                <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0, color: '#667085' }} onClick={() => navigate('/admin/san-pham')}>Danh sách sản phẩm</Button>
            </div>
            <Card style={{ borderRadius: 10, marginBottom: 22 }} styles={{ body: { padding: '24px 20px' } }}>
                <Row gutter={[16, 18]} align="middle">
                    <Col xs={24} md={11} xl={7}><Input prefix={<SearchOutlined />} value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder="Mã SKU / Tên sản phẩm..." allowClear size="large" /></Col>
                    <Col xs={24} md={13} xl={7}>
                        <div style={{ color: '#667085', fontSize: 12, marginBottom: 2 }}>Giá từ {money(range[0])} đến {money(range[1])}</div>
                        <Slider range min={low} max={high} step={Math.max(1, Math.floor((high - low) / 100))} value={range} onChange={v => { setPrice(v); setPage(1) }} tooltip={{ formatter: money }} styles={{ track: { background: NAVY }, handle: { borderColor: NAVY } }} />
                    </Col>
                    <Col xs={24} xl={10} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button type="primary" icon={<PlusOutlined />} style={{ background: NAVY }} onClick={() => openVariant(null)}>Thêm biến thể</Button>
                        <Button icon={<ReloadOutlined />} onClick={reset}>Đặt lại bộ lọc</Button>
                        <Button icon={<ReloadOutlined />} onClick={load}>Tải lại</Button>
                    </Col>
                </Row>
                <div style={{ borderTop: '1px solid #eef0f3', margin: '14px 0 18px' }} />
                <Row gutter={[14, 12]} align="middle">
                    <Col xs={24} sm={12} md={6}><Select style={{ width: '100%' }} placeholder="Tất cả thương hiệu" allowClear value={brand} onChange={v => { setBrand(v); setPage(1) }} options={brandName ? [{ label: brandName, value: brandName }] : []} /></Col>
                    <Col xs={24} sm={12} md={6}><Select style={{ width: '100%' }} placeholder="Tất cả màu sắc" allowClear value={color} onChange={v => { setColor(v); setPage(1) }} options={uniqueOptions(variants, 'tenMau')} /></Col>
                    <Col xs={24} sm={12} md={6}><Select style={{ width: '100%' }} placeholder="Tất cả kích cỡ" allowClear value={size} onChange={v => { setSize(v); setPage(1) }} options={uniqueOptions(variants, 'tenKichThuoc')} /></Col>
                    <Col xs={24} sm={12} md={6}><Space><Switch size="small" checked={stockOnly} onChange={v => { setStockOnly(v); setPage(1) }} style={{ background: stockOnly ? NAVY : undefined }} />Chỉ tồn kho &gt; 0</Space></Col>
                </Row>
            </Card>
            <Card style={{ borderRadius: 10 }} styles={{ body: { padding: 16 } }}>
                <Table rowKey={row => row.id ?? `${row.idMau}-${row.idKichThuoc}`} columns={columns} dataSource={filtered} size="middle" scroll={{ x: 1420 }} pagination={{ current: page, pageSize: 10, onChange: setPage, showSizeChanger: false, showTotal: total => `Hiển thị ${total} biến thể` }} locale={{ emptyText: <Empty description="Không tìm thấy biến thể phù hợp" /> }} />
            </Card>
        </div>
        <Modal
            title="Chi tiết biến thể"
            open={viewVariant !== null}
            onCancel={() => setViewVariant(null)}
            footer={<Button type="primary" style={{ background: NAVY }} onClick={() => setViewVariant(null)}>Đóng</Button>}
            width={810}
            destroyOnHidden
        >
            {viewVariant && <>
                <div style={{ fontWeight: 600, padding: '12px 0' }}>Thông tin gốc (Chỉ xem)</div>
                <Row gutter={[12, 10]}>
                    <Col xs={24} sm={12}><Input addonBefore="Mã SP" value={product?.maAo || ''} readOnly /></Col>
                    <Col xs={24} sm={12}><Input addonBefore="Thương hiệu" value={product?.thuongHieu || ''} readOnly /></Col>
                    <Col xs={24} sm={12}><Input addonBefore="Chất liệu" value={product?.chatLieu || ''} readOnly /></Col>
                    <Col xs={24} sm={12}><Input addonBefore="Tên SP" value={product?.tenAo || ''} readOnly /></Col>
                </Row>
                <div style={{ borderTop: '1px solid #eef0f3', margin: '20px 0 14px', paddingTop: 14, fontWeight: 600 }}>Thông tin biến thể (Chỉ xem)</div>
                <Row gutter={[14, 12]}>
                    <Col xs={24} sm={12}><div style={{ marginBottom: 5 }}>Mã SKU</div><Input value={viewVariant.maAoChiTiet || '—'} readOnly /></Col>
                    <Col xs={24} sm={12}><div style={{ marginBottom: 5 }}>Trạng thái</div><Input value={viewVariant.trangThai ? 'Kinh doanh' : 'Ngừng bán'} readOnly /></Col>
                    <Col xs={24} sm={12}><div style={{ marginBottom: 5 }}>Màu sắc</div><Input value={viewVariant.tenMau || '—'} readOnly /></Col>
                    <Col xs={24} sm={12}><div style={{ marginBottom: 5 }}>Kích cỡ</div><Input value={viewVariant.tenKichThuoc || '—'} readOnly /></Col>
                    <Col xs={24} sm={8}><div style={{ marginBottom: 5 }}>Giá niêm yết</div><Input value={money(viewVariant.giaBanBanDau)} readOnly /></Col>
                    <Col xs={24} sm={8}><div style={{ marginBottom: 5 }}>Giá bán</div><Input value={money(viewVariant.giaBan)} readOnly /></Col>
                    <Col xs={24} sm={8}><div style={{ marginBottom: 5 }}>Số lượng tồn</div><Input value={String(viewVariant.soLuong ?? 0)} readOnly /></Col>
                </Row>
                <div style={{ borderTop: '1px solid #eef0f3', margin: '20px 0 14px', paddingTop: 14, fontWeight: 600 }}>Hình ảnh biến thể</div>
                {imagesOf(viewVariant).length ? <Image.PreviewGroup>
                    <Space size={12} wrap>
                        {imagesOf(viewVariant).map((photo, index) => <Image key={photo.id ?? index} src={imgUrl(photo.url)} width={104} height={112} style={{ objectFit: 'cover', borderRadius: 8 }} />)}
                    </Space>
                </Image.PreviewGroup> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Biến thể chưa có ảnh" />}
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
                    Thông tin ở chế độ chỉ xem. Để cập nhật, đóng cửa sổ này và chọn biểu tượng bút tại dòng biến thể.
                </Typography.Text>
            </>}
        </Modal>
        <Modal title={variantModal === 'new' ? 'Thêm biến thể' : 'Cập nhật biến thể'} open={variantModal !== null}
               onCancel={() => { if (!saving) setVariantModal(null) }} onOk={saveVariant} okText={variantModal === 'new' ? 'Thêm biến thể' : 'Lưu thay đổi'}
               okButtonProps={{ loading: saving, style: { background: NAVY } }} cancelText="Hủy" width={810} destroyOnHidden>
            <div style={{ fontWeight: 600, padding: '12px 0' }}>Thông tin gốc (Không thể sửa)</div>
            <Row gutter={12}>
                <Col xs={24} sm={12}><Input addonBefore="Mã SP" value={product?.maAo || ''} readOnly /></Col>
                <Col xs={24} sm={12}><Input addonBefore="Thương hiệu" value={product?.thuongHieu || ''} readOnly /></Col>
                <Col xs={24} sm={12} style={{ marginTop: 10 }}><Input addonBefore="Chất liệu" value={product?.chatLieu || ''} readOnly /></Col>
                <Col xs={24} sm={12} style={{ marginTop: 10 }}><Input addonBefore="Sản phẩm" value={product?.tenAo || ''} readOnly /></Col>
            </Row>
            <div style={{ borderTop: '1px solid #eee', margin: '20px 0 14px', paddingTop: 14, fontWeight: 600 }}>Thuộc tính biến thể</div>
            <Form form={variantForm} layout="vertical">
                <Row gutter={14}>
                    <Col xs={24} sm={12}><Form.Item name="idMau" label="Màu sắc" rules={[{ required: true, message: 'Chọn màu sắc' }]}>
                        <Select placeholder="Chọn màu" options={catalog.mauSac.map(m => ({ value: m.id, label: m.tenMau }))} />
                    </Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item name="idKichThuoc" label="Kích cỡ" rules={[{ required: true, message: 'Chọn kích cỡ' }]}>
                        <Select placeholder="Chọn kích cỡ" options={catalog.kichThuoc.map(k => ({ value: k.id, label: k.tenKichThuoc }))} />
                    </Form.Item></Col>
                    <Col xs={24} sm={8}><Form.Item name="giaBanBanDau" label="Giá niêm yết / Giá nhập" rules={[{ required: true, message: 'Nhập giá' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item></Col>
                    <Col xs={24} sm={8}><Form.Item name="giaBan" label="Giá bán" rules={[{ required: true, message: 'Nhập giá bán' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item></Col>
                    <Col xs={24} sm={8}><Form.Item name="soLuong" label="Số lượng tồn" rules={[{ required: true, message: 'Nhập tồn kho' }]}>
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item></Col>
                    <Col xs={24}><Form.Item name="trangThai" label="Trạng thái" valuePropName="checked"><Switch checkedChildren="Kinh doanh" unCheckedChildren="Ngừng bán" /></Form.Item></Col>
                </Row>
            </Form>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Hình ảnh theo màu (tối đa 8 ảnh/màu)</div>
            <input
                id="variant-photo-picker"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => {
                    const files = Array.from(e.target.files || [])
                    const currentSaved = photos.filter(photo => String(photo.idMau) === String(variantForm.getFieldValue('idMau'))).length
                    const remaining = Math.max(0, 8 - currentSaved - uploadFiles.length)
                    if (files.length > remaining) message.warning(`Mỗi màu tối đa 8 ảnh. Bạn chỉ có thể chọn thêm ${remaining} ảnh.`)
                    setUploadFiles(current => [...current, ...files.slice(0, remaining)])
                    e.target.value = ''
                }}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {photos.filter(photo => String(photo.idMau) === String(currentColorId)).map(photo => (
                    <div key={`saved-${photo.id}`} style={{ width: 104, position: 'relative' }}>
                        <Image src={imgUrl(photo.url)} width={104} height={112} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <Button danger size="small" icon={<DeleteOutlined />} loading={deletingImageId === photo.id} disabled={saving} onClick={() => deleteImage(photo)} style={{ width: '100%', marginTop: 5 }}>Xóa ảnh</Button>
                    </div>
                ))}
                {uploadFiles.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} style={{ width: 104, position: 'relative' }}>
                        <Image src={previewUrls[index]} width={104} height={112} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <Button danger size="small" icon={<DeleteOutlined />} disabled={saving} title="Bỏ ảnh vừa chọn" onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))} style={{ width: '100%', marginTop: 5 }}>Bỏ ảnh</Button>
                    </div>
                ))}
                <label htmlFor="variant-photo-picker" style={{ width: 104, height: 112, border: '1px dashed #9aa5b7', background: '#f7f8fa', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: NAVY, gap: 8 }}>
                    <PlusOutlined style={{ fontSize: 23 }} />
                    <span style={{ fontSize: 12 }}>Thêm ảnh</span>
                </label>
            </div>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                Chọn ảnh JPG, PNG hoặc WebP. Ảnh vừa chọn hiển thị ngay bên trên; nhấn Bỏ ảnh để bỏ khỏi danh sách trước khi lưu.
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 10, fontSize: 12 }}>
                Ảnh được lưu theo màu sản phẩm. Cơ sở dữ liệu hiện chỉ có màu và kích cỡ cho biến thể; chưa hỗ trợ cỡ áo, tay áo hoặc QR riêng.
            </Typography.Text>
        </Modal>
    </Spin>
}
