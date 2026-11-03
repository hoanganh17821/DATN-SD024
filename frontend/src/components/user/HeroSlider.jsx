import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LeftOutlined, RightOutlined, PauseOutlined, CaretRightOutlined } from '@ant-design/icons'
import { colorsOf, imagesFor, vnd } from '../../data/products'
import ProductImage from './ProductImage'

// Banner ảnh tự thiết kế (poster khuyến mãi...). Đặt file ảnh vào frontend/public rồi khai báo ở đây.
// Ví dụ: { key: 'sale', image: '/banner-sale.jpg', alt: 'Ưu đãi áo polo', to: '/san-pham?km=1' }
const BANNERS = [
    {
        key: 'sale',
        image: '/img/Polo/banner.png',
        alt: 'Ưu đãi áo polo',
        to: '/san-pham?km=1'
    },
]

const BG = ['#1f2a44', '#3b4350', '#6f2332', '#2f4a3c', '#27354f']   // màu nền lần lượt của các slide
const INTERVAL = 5500
const MAX_PRODUCTS = 5

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Ảnh của sản phẩm theo màu đầu tiên. Chưa có ảnh thì ProductImage tự vẽ hình áo.
function artOf(sp) {
    const c = colorsOf(sp)[0]
    return { src: imagesFor(sp, c.ma)[0], color: c.hex, alt: sp.ten }
}

export default function HeroSlider({ products = [] }) {
    const slides = useMemo(() => {
        const picked = [...products]
            .sort((a, b) => (b.hinhAnh?.length ? 1 : 0) - (a.hinhAnh?.length ? 1 : 0))   // sản phẩm có ảnh lên trước
            .slice(0, MAX_PRODUCTS)

        const intro = {
            key: 'intro',
            type: 'intro',
            art: picked[0] ? artOf(picked[0]) : { src: null, color: '#1f2a44', alt: '' },
        }

        const items = picked.map(sp => {
            const v = sp.bienThe.reduce((a, b) => (b.giaBan < a.giaBan ? b : a), sp.bienThe[0])
            const sale = v.giaGoc > v.giaBan ? Math.round((1 - v.giaBan / v.giaGoc) * 100) : 0
            return {
                key: `sp${sp.id}`,
                type: 'product',
                title: sp.ten,
                text: `${sp.chatLieu ? `${sp.chatLieu}. ` : ''}Giá từ ${vnd(v.giaBan)}`,
                sale,
                to: `/san-pham/${sp.id}`,
                art: artOf(sp),
            }
        })

        return [...BANNERS.map(b => ({ ...b, type: 'banner' })), intro, ...items]
    }, [products])

    const n = slides.length
    const [i, setI] = useState(0)
    const [playing, setPlaying] = useState(() => !prefersReducedMotion())
    const [hold, setHold] = useState(false)           // đang rê chuột hoặc đang dùng bàn phím trong slide
    const touchX = useRef(null)

    const cur = Math.min(i, n - 1)
    const go = k => setI(((k % n) + n) % n)

    // Tự chuyển slide. Bấm chuyển tay cũng đặt lại bộ đếm giờ vì phụ thuộc vào "cur".
    useEffect(() => {
        if (!playing || hold || n < 2) return
        const t = setTimeout(() => setI(x => (Math.min(x, n - 1) + 1) % n), INTERVAL)
        return () => clearTimeout(t)
    }, [cur, playing, hold, n])

    const onTouchEnd = e => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 50) go(dx < 0 ? cur + 1 : cur - 1)
    }

    return (
        <section
            className="hs"
            role="region"
            aria-roledescription="carousel"
            aria-label="Sản phẩm nổi bật"
            onMouseEnter={() => setHold(true)}
            onMouseLeave={() => setHold(false)}
            onFocus={() => setHold(true)}
            onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHold(false) }}
            onKeyDown={e => {
                if (e.key === 'ArrowLeft') go(cur - 1)
                if (e.key === 'ArrowRight') go(cur + 1)
            }}
            onTouchStart={e => { touchX.current = e.touches[0].clientX }}
            onTouchEnd={onTouchEnd}
        >
            <div className="hs-track" style={{ transform: `translateX(-${cur * 100}%)` }}
                 aria-live={playing && !hold ? 'off' : 'polite'}>
                {slides.map((s, idx) => {
                    const active = idx === cur
                    const tab = active ? 0 : -1               // slide đang ẩn thì không cho Tab vào
                    return (
                        <div key={s.key} className="hs-slide" role="group" aria-roledescription="slide"
                             aria-label={`${idx + 1} trên ${n}`} aria-hidden={!active}
                             style={{ background: BG[idx % BG.length] }}>

                            {s.type === 'banner' && (
                                <Link to={s.to} className="hs-banner" tabIndex={tab}>
                                    <img src={s.image} alt={s.alt ?? ''} />
                                </Link>
                            )}

                            {s.type !== 'banner' && (
                                <div className="hs-in">
                                    <div className="hs-txt">
                                        {s.type === 'intro' ? (
                                            <>
                                                <h1>Một kiểu áo, nhiều sắc độ</h1>
                                                <p>Polo cổ bẻ, chất liệu cotton và pique, đủ kích cỡ từ S đến XXL.</p>
                                                <div className="hs-cta">
                                                    <Link to="/san-pham" className="btn light" tabIndex={tab}>Xem tất cả áo polo</Link>
                                                    <Link to="/san-pham?km=1" className="btn line-light" tabIndex={tab}>Sản phẩm đang giảm giá</Link>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h2>{s.title}</h2>
                                                <p>
                                                    {s.text}
                                                    {s.sale > 0 && <span className="hs-sale">-{s.sale}%</span>}
                                                </p>
                                                <div className="hs-cta">
                                                    <Link to={s.to} className="btn light" tabIndex={tab}>Xem sản phẩm</Link>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="hs-art">
                                        <ProductImage src={s.art.src} color={s.art.color} alt={s.art.alt} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {n > 1 && (
                <>
                    <button className="hs-arrow prev" aria-label="Slide trước" onClick={() => go(cur - 1)}><LeftOutlined /></button>
                    <button className="hs-arrow next" aria-label="Slide sau" onClick={() => go(cur + 1)}><RightOutlined /></button>

                    <div className="hs-ctrl">
                        <div className="hs-ctrl-in">
                            {slides.map((s, idx) => (
                                <button key={s.key} className={`hs-dot ${idx === cur ? 'on' : ''}`}
                                        aria-label={`Chuyển tới slide ${idx + 1}`} aria-current={idx === cur} onClick={() => go(idx)} />
                            ))}
                            <button className="hs-pause" aria-label={playing ? 'Tạm dừng tự chuyển slide' : 'Tiếp tục tự chuyển slide'}
                                    onClick={() => setPlaying(p => !p)}>
                                {playing ? <PauseOutlined /> : <CaretRightOutlined />}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}