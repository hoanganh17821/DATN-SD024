package com.example.datn.repository;

import com.example.datn.entity.ThuongHieu;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThuongHieuRepository extends JpaRepository<ThuongHieu, Integer> {
    boolean existsByMaThuongHieuIgnoreCase(String ma);
    boolean existsByMaThuongHieuIgnoreCaseAndIdNot(String ma, Integer id);
}