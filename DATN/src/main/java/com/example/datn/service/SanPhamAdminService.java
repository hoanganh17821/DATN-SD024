package com.example.datn.service;

import com.example.datn.dto.SanPhamAdminResponse;
import com.example.datn.dto.SanPhamRequest;
import com.example.datn.entity.*;
import com.example.datn.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SanPhamAdminService {
    private final SanPhamRepository spRepo;
    private final SanPhamChiTietRepository ctRepo;
    private final MauSacRepository mauRepo;
    private final KichThuocRepository sizeRepo;
    private final ChatLieuRepository clRepo;
    private final ThuongHieuRepository thRepo;

    @Transactional(readOnly = true)
    public List<SanPhamAdminResponse> getAll() {
        Map<Integer, List<SanPhamChiTiet>> byProduct = ctRepo.findAllForAdmin().stream()
                .collect(Collectors.groupingBy(v -> v.getSanPham().getId()));
        return spRepo.findAllForAdmin().stream()
                .map(sp -> toResponse(sp, byProduct.getOrDefault(sp.getId(), List.of()), false))
                .toList();
    }

    @Transactional(readOnly = true)
    public SanPhamAdminResponse getOne(Integer id) {
        SanPham sp = spRepo.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        return toResponse(sp, ctRepo.findAllByProductId(id), true);
    }

    @Transactional
    public SanPhamAdminResponse create(SanPhamRequest r) {
        if (spRepo.existsByMaAo(r.maAo().trim())) throw new RuntimeException("Mã sản phẩm đã tồn tại");
        SanPham sp = new SanPham();
        applyProduct(sp, r);
        spRepo.save(sp);
        syncVariants(sp, r);
        return getOne(sp.getId());
    }

    @Transactional
    public SanPhamAdminResponse update(Integer id, SanPhamRequest r) {
        SanPham sp = spRepo.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        if (spRepo.existsByMaAoAndIdNot(r.maAo().trim(), id)) throw new RuntimeException("Mã sản phẩm đã tồn tại");
        applyProduct(sp, r);
        spRepo.save(sp);
        syncVariants(sp, r);
        if (!Boolean.TRUE.equals(sp.getTrangThai())) disableAllVariants(sp.getId());
        return getOne(id);
    }

    @Transactional
    public void setStatus(Integer id, boolean value) {
        SanPham sp = spRepo.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        sp.setTrangThai(value);
        spRepo.save(sp);
        // Khi ngừng bán sản phẩm, tắt tất cả biến thể trong cùng transaction.
        // Khi bật lại sản phẩm, không tự mở lại các biến thể đã tắt trước đó.
        if (!value) disableAllVariants(id);
    }

    private void disableAllVariants(Integer productId) {
        List<SanPhamChiTiet> variants = ctRepo.findAllByProductId(productId);
        for (SanPhamChiTiet v : variants) v.setTrangThai(false);
        ctRepo.saveAll(variants);
    }

    // API thao tác đúng một biến thể, không đồng bộ/xóa các biến thể khác.
    @Transactional
    public SanPhamAdminResponse saveOneVariant(Integer productId, Integer variantId, VariantPatch r) {
        SanPham sp = spRepo.findById(productId).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        SanPhamChiTiet v;
        if (variantId == null) {
            v = new SanPhamChiTiet();
            v.setSanPham(sp);
        } else {
            v = ctRepo.findById(variantId).orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể"));
            if (!v.getSanPham().getId().equals(productId)) throw new RuntimeException("Biến thể không thuộc sản phẩm");
        }
        if (r.giaBan().compareTo(r.giaBanBanDau()) > 0) throw new RuntimeException("Giá bán không được lớn hơn giá niêm yết");
        MauSac m = mauRepo.findById(r.idMau()).orElseThrow(() -> new RuntimeException("Màu không tồn tại"));
        KichThuoc k = sizeRepo.findById(r.idKichThuoc()).orElseThrow(() -> new RuntimeException("Kích thước không tồn tại"));
        boolean duplicated = ctRepo.findAllByProductId(productId).stream().anyMatch(other ->
                !Objects.equals(other.getId(), variantId) && Objects.equals(other.getMauSac().getId(), r.idMau()) && Objects.equals(other.getKichThuoc().getId(), r.idKichThuoc()));
        if (duplicated) throw new RuntimeException("Biến thể màu sắc và kích thước này đã tồn tại");
        v.setMauSac(m);
        v.setKichThuoc(k);
        if (variantId == null) v.setChatLieu(ctRepo.findAllByProductId(productId).stream().map(SanPhamChiTiet::getChatLieu).filter(Objects::nonNull).findFirst().orElse(null));
        v.setMaAoChiTiet(sp.getMaAo() + "-" + m.getMaMau() + "-" + k.getTenKichThuoc());
        v.setGiaBanBanDau(r.giaBanBanDau());
        v.setGiaBan(r.giaBan());
        v.setSoLuong(r.soLuong());
        if (!Boolean.TRUE.equals(sp.getTrangThai()) && !Boolean.FALSE.equals(r.trangThai()))
            throw new IllegalStateException("Sản phẩm đang ngừng kinh doanh; không thể bật biến thể");
        v.setTrangThai(Boolean.TRUE.equals(sp.getTrangThai()) && (r.trangThai() == null || r.trangThai()));
        ctRepo.save(v);
        return getOne(productId);
    }

    public record VariantPatch(
            @jakarta.validation.constraints.NotNull Integer idMau,
            @jakarta.validation.constraints.NotNull Integer idKichThuoc,
            @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.DecimalMin("0") BigDecimal giaBanBanDau,
            @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.DecimalMin("0") BigDecimal giaBan,
            @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Min(0) Integer soLuong,
            Boolean trangThai) {}

    // ---------------------------------------------------------------

    private void applyProduct(SanPham sp, SanPhamRequest r) {
        sp.setMaAo(r.maAo().trim());
        sp.setTenAo(r.tenAo().trim());
        sp.setMoTa(r.moTa());
        sp.setTrangThai(r.trangThai() != null ? r.trangThai() : true);
        if (r.idThuongHieu() != null) {
            sp.setThuongHieu(thRepo.findById(r.idThuongHieu())
                    .orElseThrow(() -> new RuntimeException("Thương hiệu không tồn tại")));
        } else if (sp.getThuongHieu() == null) {
            // Shop chỉ có 1 thương hiệu: tự gán thương hiệu đầu tiên
            sp.setThuongHieu(thRepo.findAll(Sort.by("id")).stream().findFirst().orElse(null));
        }
    }

    // Đồng bộ biến thể: thêm mới / cập nhật / ngừng bán những biến thể không còn trong form
    private void syncVariants(SanPham sp, SanPhamRequest r) {
        ChatLieu cl = r.idChatLieu() == null ? null : clRepo.findById(r.idChatLieu())
                                                      .orElseThrow(() -> new RuntimeException("Chất liệu không tồn tại"));

        Map<String, SanPhamChiTiet> existing = ctRepo.findAllByProductId(sp.getId()).stream()
                .collect(Collectors.toMap(
                        v -> v.getMauSac().getId() + "-" + v.getKichThuoc().getId(),
                        v -> v, (a, b) -> a));

        Set<String> kept = new HashSet<>();
        for (SanPhamRequest.BienTheRequest b : r.bienThe()) {
            if (b.giaBan().compareTo(b.giaBanBanDau()) > 0)
                throw new RuntimeException("Giá bán không được lớn hơn giá niêm yết");
            String key = b.idMau() + "-" + b.idKichThuoc();
            if (!kept.add(key)) throw new RuntimeException("Có biến thể bị trùng màu và kích thước");

            MauSac m = mauRepo.findById(b.idMau()).orElseThrow(() -> new RuntimeException("Màu không tồn tại"));
            KichThuoc k = sizeRepo.findById(b.idKichThuoc()).orElseThrow(() -> new RuntimeException("Kích thước không tồn tại"));

            SanPhamChiTiet v = existing.get(key);
            if (v == null) {
                v = new SanPhamChiTiet();
                v.setSanPham(sp);
                v.setMauSac(m);
                v.setKichThuoc(k);
            }
            v.setChatLieu(cl);
            v.setMaAoChiTiet(sp.getMaAo() + "-" + m.getMaMau() + "-" + k.getTenKichThuoc());
            v.setGiaBanBanDau(b.giaBanBanDau());
            v.setGiaBan(b.giaBan());
            v.setSoLuong(b.soLuong());
            v.setTrangThai(Boolean.TRUE.equals(sp.getTrangThai()) && (b.trangThai() != null ? b.trangThai() : true));
            ctRepo.save(v);
        }

        // Không xóa cứng: biến thể có thể đã nằm trong hóa đơn / giỏ hàng
        existing.forEach((key, v) -> {
            if (!kept.contains(key)) {
                v.setTrangThai(false);
                ctRepo.save(v);
            }
        });
    }

    private SanPhamAdminResponse toResponse(SanPham sp, List<SanPhamChiTiet> all, boolean withVariants) {
        List<SanPhamChiTiet> active = all.stream()
                .filter(v -> Boolean.TRUE.equals(v.getTrangThai())).toList();

        int tongTon = active.stream().mapToInt(v -> v.getSoLuong() != null ? v.getSoLuong() : 0).sum();
        List<BigDecimal> prices = active.stream().map(SanPhamChiTiet::getGiaBan).filter(Objects::nonNull).toList();
        BigDecimal giaTu = prices.stream().min(Comparator.naturalOrder()).orElse(null);
        BigDecimal giaDen = prices.stream().max(Comparator.naturalOrder()).orElse(null);

        Map<Integer, SanPhamAdminResponse.MauInfo> colors = new LinkedHashMap<>();
        for (SanPhamChiTiet v : active) {
            MauSac m = v.getMauSac();
            colors.putIfAbsent(m.getId(), new SanPhamAdminResponse.MauInfo(
                    m.getId(), m.getTenMau(), m.getMaHex() != null ? m.getMaHex() : "#cccccc"));
        }

        ChatLieu cl = all.stream().map(SanPhamChiTiet::getChatLieu).filter(Objects::nonNull).findFirst().orElse(null);
        ThuongHieu th = sp.getThuongHieu();

        List<SanPhamAdminResponse.BienThe> bienThe = !withVariants ? List.of() : all.stream().map(v ->
                                                                                                  new SanPhamAdminResponse.BienThe(
                                                                                                          v.getId(),
                                                                                                          v.getMauSac().getId(), v.getMauSac().getTenMau(),
                                                                                                          v.getMauSac().getMaHex() != null ? v.getMauSac().getMaHex() : "#cccccc",
                                                                                                          v.getKichThuoc().getId(), v.getKichThuoc().getTenKichThuoc(),
                                                                                                          v.getGiaBanBanDau(), v.getGiaBan(),
                                                                                                          v.getSoLuong(), v.getTrangThai(), v.getMaAoChiTiet())).toList();

        return new SanPhamAdminResponse(
                sp.getId(), sp.getMaAo(), sp.getTenAo(), sp.getMoTa(), sp.getTrangThai(),
                th != null ? th.getId() : null, th != null ? th.getTenThuongHieu() : null,
                cl != null ? cl.getId() : null, cl != null ? cl.getTenChatLieu() : null,
                active.size(), tongTon, giaTu, giaDen,
                new ArrayList<>(colors.values()), bienThe);
    }
}
