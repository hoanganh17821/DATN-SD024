package com.example.datn.controller;

import com.example.datn.dto.KichThuocRequest;
import com.example.datn.dto.KichThuocResponse;
import com.example.datn.service.KichThuocService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/kich-thuoc")
@RequiredArgsConstructor
public class KichThuocController {
    private final KichThuocService service;

    @GetMapping
    public List<KichThuocResponse> all() {
        return service.all();
    }

    @PostMapping
    public KichThuocResponse create(@RequestBody KichThuocRequest input) {
        return service.create(input);
    }

    @PutMapping("/{id}")
    public KichThuocResponse update(@PathVariable Integer id, @RequestBody KichThuocRequest input) {
        return service.update(id, input);
    }
}
