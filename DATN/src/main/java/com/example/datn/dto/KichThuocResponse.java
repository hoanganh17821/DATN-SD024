package com.example.datn.dto;

/** Dữ liệu trả về cho trang quản trị; tên thuộc tính giữ tương thích Frontend. */
public record KichThuocResponse(Integer id, String maKichThuoc, String tenKichThuoc, String moTa, Boolean trangThai) {}
