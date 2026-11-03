package com.example.datn.repository;

import com.example.datn.entity.ChatLieu;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatLieuRepository extends JpaRepository<ChatLieu, Integer> {
    boolean existsByMaChatLieuIgnoreCase(String ma);
    boolean existsByMaChatLieuIgnoreCaseAndIdNot(String ma, Integer id);
}