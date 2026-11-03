package com.example.datn.dto;

/** Dữ liệu trả về cho trang quản trị; tên thuộc tính giữ tương thích Frontend. */
public record ChatLieuResponse(Integer id, String maChatLieu, String tenChatLieu, String moTa, Boolean trangThai) {}
