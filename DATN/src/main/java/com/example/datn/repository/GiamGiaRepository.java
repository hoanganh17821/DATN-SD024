package com.example.datn.repository;


import com.example.datn.entity.GiamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GiamGiaRepository extends JpaRepository<GiamGia, Integer> {
    Optional<GiamGia> findByMaGiamGiaIgnoreCase(String maGiamGia);

    // Tăng số lượt dùng, chỉ thành công khi còn lượt (an toàn khi nhiều người dùng cùng lúc)
    @Modifying
    @Query("update GiamGia g set g.soLuongDaDung = g.soLuongDaDung + 1 " +
            "where g.id = :id and g.soLuongDaDung < g.soLuong")
    int tryUse(@Param("id") Integer id);

    // Trả lại một lượt dùng mã khi hủy đơn
    @Modifying
    @Query("update GiamGia g set g.soLuongDaDung = g.soLuongDaDung - 1 " +
            "where g.id = :id and g.soLuongDaDung > 0")
    int hoanLuot(@Param("id") Integer id);
}
