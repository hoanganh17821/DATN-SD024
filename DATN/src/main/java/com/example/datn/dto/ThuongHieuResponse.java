package com.example.datn.dto;

/** Dữ liệu trả về cho trang quản trị; tên thuộc tính giữ tương thích Frontend. */
public record ThuongHieuResponse(Integer id, String maThuongHieu, String tenThuongHieu, String moTa, Boolean trangThai) {}
