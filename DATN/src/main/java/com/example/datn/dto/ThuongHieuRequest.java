package com.example.datn.dto;

/** Dữ liệu đầu vào khi tạo hoặc chỉnh sửa thương hiệu. */
public record ThuongHieuRequest(String maThuongHieu, String tenThuongHieu, String moTa, Boolean trangThai) {}
