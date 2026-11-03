import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CarOutlined, SwapOutlined, WalletOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { searchProducts } from '../../api/storeApi'
import ProductCard from '../../components/user/ProductCard'
import HeroSlider from '../../components/user/HeroSlider'
import { ProductSkeletons } from '../../components/user/Skeleton'
import Shirt from '../../components/user/Shirt'

const FACTS = [
    { icon: <CarOutlined />, title: 'Miễn phí vận chuyển', sub: 'Cho đơn từ 500.000 ₫' },
    { icon: <ClockCircleOutlined />, title: 'Giao hàng 2 đến 4 ngày', sub: 'Toàn quốc' },
    { icon: <SwapOutlined />, title: 'Đổi trả trong 7 ngày', sub: 'Liên hệ cửa hàng để được hỗ trợ' },
    { icon: <WalletOutlined />, title: 'Thanh toán khi nhận hàng', sub: 'Kiểm tra hàng rồi mới trả tiền' },
]

// Sửa danh sách này theo sản phẩm thực tế. "q" là từ khóa tìm kiếm khi bấm vào ô (không cần gõ dấu).
const TILES = [
    {
        title: 'Cổ điển',
        sub: 'Vải pique đứng form',
        q: 'classic',
        bg: '#1f2a44',
        image: '/img/Polo/4phongcach/codien.png'
    },
    {
        title: 'Dáng ôm',
        sub: 'Gọn gàng, ôm nhẹ',
        q: 'slim fit',
        bg: '#3b4350',
        image: '/img/Polo/4phongcach/dangom.png'
    },
    {
        title: 'Thể thao',
        sub: 'Nhẹ, nhanh khô',
        q: 'the thao',
        bg: '#6f2332',
        image: '/img/Polo/4phongcach/thethao.png'
    },
    {
        title: 'Thoáng khí',
        sub: 'Mặc thoải mái hằng ngày',
        q: 'thoang khi',
        bg: '#2f4a3c',
        image: '/img/Polo/4phongcach/thoangkhi.png'
    },
]

const TABS = [
    { key: 'moi', label: 'Mới nhất', params: { sapXep: 'moi' }, all: '/san-pham' },
    { key: 'best', label: 'Bán chạy', params: { sapXep: 'ban-chay' }, all: '/san-pham?sx=ban-chay' },
    { key: 'sale', label: 'Đang giảm giá', params: { sapXep: 'moi', khuyenMai: true }, all: '/san-pham?km=1' },
]

export default function Home() {
    const [slideProducts, setSlideProducts] = useState([])
    const [tab, setTab] = useState(TABS[0])
    const [list, setList] = useState(null)
    const [error, setError] = useState(false)
    const [sale, setSale] = useState(null)       // { phanTram, soMau }

    useEffect(() => { document.title = 'POLO HOUSE | Áo polo cổ bẻ' }, [])

    // Sản phẩm cho slide đầu trang: lấy 12 mẫu mới nhất, slide tự chọn ra các mẫu có ảnh
    useEffect(() => {
        searchProducts({ sapXep: 'moi', trang: 1, kichThuoc: 12 })
            .then(d => setSlideProducts(d.items))
            .catch(() => {})
    }, [])

    // Tìm mức giảm lớn nhất để hiện trên banner ưu đãi
    useEffect(() => {
        searchProducts({ khuyenMai: true, kichThuoc: 48 })
            .then(d => {
                const max = d.items.flatMap(p => p.bienThe)
                    .reduce((m, v) => Math.max(m, v.giaGoc > v.giaBan ? Math.round((1 - v.giaBan / v.giaGoc) * 100) : 0), 0)
                setSale(d.items.length > 0 && max > 0 ? { phanTram: max, soMau: d.tongSanPham } : null)
            })
            .catch(() => {})
    }, [])

    useEffect(() => {
        let ignore = false
        setList(null)
        setError(false)
        searchProducts({ ...tab.params, trang: 1, kichThuoc: 8 })
            .then(d => { if (!ignore) setList(d.items) })
            .catch(() => { if (!ignore) setError(true) })
        return () => { ignore = true }
    }, [tab])

    return (
        <>
            <HeroSlider products={slideProducts} />

            <section className="facts" aria-label="Chính sách cửa hàng">
                {FACTS.map(f => (
                    <div className="fact" key={f.title}>
                        {f.icon}
                        <div><b>{f.title}</b><span className="s">{f.sub}</span></div>
                    </div>
                ))}
            </section>

            <section className="wrap">
                <div className="bar"><h2>Chọn theo phong cách</h2></div>
                <div className="tiles">
                    {TILES.map(t => (
                        <Link
                            key={t.title}
                            to={`/san-pham?q=${encodeURIComponent(t.q)}`}
                            className="tile"
                            style={{ background: t.bg }}
                        >
                            <img
                                src={t.image}
                                alt=""
                                className="tile-image"
                                loading="lazy"
                            />

                            <div className="tile-content">
                                <h3>{t.title}</h3>
                                <p>{t.sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="wrap" style={{ marginTop: 72 }}>
                <div className="bar">
                    <h2>Sản phẩm</h2>
                    <div className="ftabs" role="tablist">
                        {TABS.map(t => (
                            <button key={t.key} role="tab" aria-selected={tab.key === t.key}
                                    className={`ftab ${tab.key === t.key ? 'on' : ''}`} onClick={() => setTab(t)}>{t.label}</button>
                        ))}
                    </div>
                </div>

                {error && <p className="muted">Không tải được sản phẩm. Kiểm tra backend đã chạy chưa.</p>}
                {!list && !error && <ProductSkeletons n={8} />}
                {list && list.length === 0 && (
                    <div className="empty">
                        <p>Chưa có sản phẩm nào trong mục này.</p>
                        <button className="btn" onClick={() => setTab(TABS[0])}>Xem sản phẩm mới nhất</button>
                    </div>
                )}
                {list && list.length > 0 && <div className="grid">{list.map(sp => <ProductCard key={sp.id} sp={sp} />)}</div>}

                <p style={{ marginTop: 36 }}><Link to={tab.all} className="link">Xem tất cả {tab.label.toLowerCase()}</Link></p>
            </section>

            {sale && (
                <section className="promo">
                    <div className="promo-in">
                        <div>
                            <h2>Giảm đến {sale.phanTram}% cho áo polo chọn lọc</h2>
                            <p>{sale.soMau} mẫu đang được giảm giá.</p>
                        </div>
                        <Link to="/san-pham?km=1" className="btn light">Xem áo giảm giá</Link>
                    </div>
                </section>
            )}
        </>
    )
}