package com.example.datn.repository;

import com.example.datn.entity.KichThuoc;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KichThuocRepository extends JpaRepository<KichThuoc, Integer> {
    boolean existsByMaKichThuocIgnoreCase(String ma);
    boolean existsByMaKichThuocIgnoreCaseAndIdNot(String ma, Integer id);
}
