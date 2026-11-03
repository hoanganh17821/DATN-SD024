package com.example.datn.controller;

import com.example.datn.dto.ThuongHieuRequest;
import com.example.datn.dto.ThuongHieuResponse;
import com.example.datn.service.ThuongHieuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/thuong-hieu")
@RequiredArgsConstructor
public class ThuongHieuController {
    private final ThuongHieuService service;

    @GetMapping
    public List<ThuongHieuResponse> all() {
        return service.all();
    }

    @PostMapping
    public ThuongHieuResponse create(@RequestBody ThuongHieuRequest input) {
        return service.create(input);
    }

    @PutMapping("/{id}")
    public ThuongHieuResponse update(@PathVariable Integer id, @RequestBody ThuongHieuRequest input) {
        return service.update(id, input);
    }
}
