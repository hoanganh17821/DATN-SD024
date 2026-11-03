package com.example.datn.controller;

import com.example.datn.dto.ChatLieuRequest;
import com.example.datn.dto.ChatLieuResponse;
import com.example.datn.service.ChatLieuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/chat-lieu")
@RequiredArgsConstructor
public class ChatLieuController {
    private final ChatLieuService service;

    @GetMapping
    public List<ChatLieuResponse> all() {
        return service.all();
    }

    @PostMapping
    public ChatLieuResponse create(@RequestBody ChatLieuRequest input) {
        return service.create(input);
    }

    @PutMapping("/{id}")
    public ChatLieuResponse update(@PathVariable Integer id, @RequestBody ChatLieuRequest input) {
        return service.update(id, input);
    }
}
