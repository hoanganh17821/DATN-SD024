import { Card, Col, Row, Statistic, DatePicker, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const stats = [
    { title: 'Tổng doanh thu', value: 4100000, suffix: '₫' },
    { title: 'Đơn hàng thành công', value: 6 },
    { title: 'Đơn hàng hủy', value: 0 },
    { title: 'Tổng sản phẩm bán ra', value: 24 },
    { title: 'Giá trị trung bình đơn', value: 683333, suffix: '₫' },
]

const revenue = Array.from({ length: 12 }, (_, i) => ({
    thang: `T${i + 1}`, doanhThu: Math.round(Math.random() * 40) * 1_000_000,
}))

const orderStatus = [
    ['Chờ xác nhận', 3], ['Đã xác nhận', 2], ['Đang giao', 4], ['Hoàn thành', 6], ['Đã hủy', 0],
]

export default function Dashboard() {
    return (
        <>
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
                    <div><div>Từ ngày</div><DatePicker defaultValue={dayjs().subtract(7, 'day')} format="DD/MM/YYYY" /></div>
                    <div><div>Đến ngày</div><DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" /></div>
                    <Button type="primary" icon={<ReloadOutlined />} style={{ marginLeft: 'auto' }}>
                        Cập nhật dữ liệu
                    </Button>
                </div>
            </Card>

            <Row gutter={[16, 16]}>
                {stats.map(s => (
                    <Col key={s.title} xs={24} md={12} xl={{ flex: '20%' }}>
                        <Card><Statistic title={s.title} value={s.value} suffix={s.suffix}
                                         groupSeparator="." /></Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} xl={16}>
                    <Card title="Xu hướng doanh thu (năm 2026)">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={revenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="thang" />
                                <YAxis tickFormatter={v => `${v / 1_000_000} tr`} />
                                <Tooltip formatter={v => v.toLocaleString('vi-VN') + ' ₫'} />
                                <Line type="monotone" dataKey="doanhThu" stroke="#1f2a44" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card title="Trạng thái đơn hàng">
                        {orderStatus.map(([label, n]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                <span>{label}</span><b>{n}</b>
                            </div>
                        ))}
                    </Card>
                </Col>
            </Row>
        </>
    )
}