package com.example.datn.dto;

/** Dữ liệu đầu vào khi tạo hoặc chỉnh sửa chất liệu. */
public record ChatLieuRequest(String maChatLieu, String tenChatLieu, String moTa, Boolean trangThai) {}
