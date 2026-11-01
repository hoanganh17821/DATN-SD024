package com.example.datn.repository;


import com.example.datn.entity.HoaDon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface HoaDonRepository extends JpaRepository<HoaDon, Integer> {
    boolean existsByMaHoaDon(String maHoaDon);

    Page<HoaDon> findByKhachHang_Id(Integer idKhachHang, Pageable pageable);

    Page<HoaDon> findByKhachHang_IdAndTrangThai(Integer idKhachHang, String trangThai, Pageable pageable);

    Optional<HoaDon> findByMaHoaDonAndKhachHang_Id(String maHoaDon, Integer idKhachHang);

    // Đổi trạng thái chỉ khi đơn đang ở trạng thái "cu". Trả về 0 nếu đơn đã bị đổi bởi người khác.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update HoaDon h set h.trangThai = :moi where h.id = :id and h.trangThai = :cu")
    int doiTrangThai(@Param("id") Integer id, @Param("cu") String cu, @Param("moi") String moi);
}