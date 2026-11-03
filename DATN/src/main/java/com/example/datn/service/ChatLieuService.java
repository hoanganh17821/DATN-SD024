package com.example.datn.service;

import com.example.datn.entity.ChatLieu;
import com.example.datn.dto.ChatLieuRequest;
import com.example.datn.dto.ChatLieuResponse;
import com.example.datn.repository.ChatLieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatLieuService {
    private final ChatLieuRepository repository;

    @Transactional(readOnly = true)
    public List<ChatLieuResponse> all() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ChatLieuResponse create(ChatLieuRequest input) {
        validate(input);
        if (repository.existsByMaChatLieuIgnoreCase(input.maChatLieu().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã chất liệu đã tồn tại");
        }
        ChatLieu item = new ChatLieu();
        apply(item, input);
        return toResponse(repository.save(item));
    }

    @Transactional
    public ChatLieuResponse update(Integer id, ChatLieuRequest input) {
        validate(input);
        ChatLieu item = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chất liệu"));
        if (repository.existsByMaChatLieuIgnoreCaseAndIdNot(input.maChatLieu().trim(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã chất liệu đã tồn tại");
        }
        apply(item, input);
        return toResponse(repository.save(item));
    }

    private void validate(ChatLieuRequest input) {
        if (input == null || input.maChatLieu() == null || input.maChatLieu().isBlank()
                || input.tenChatLieu() == null || input.tenChatLieu().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã và tên chất liệu không được trống");
        }
    }

    private void apply(ChatLieu item, ChatLieuRequest input) {
        item.setMaChatLieu(input.maChatLieu().trim());
        item.setTenChatLieu(input.tenChatLieu().trim());
        item.setMoTa(input.moTa());
        item.setTrangThai(input.trangThai() == null ? true : input.trangThai());
    }


    private ChatLieuResponse toResponse(ChatLieu item) {
        return new ChatLieuResponse(
                item.getId(), item.getMaChatLieu(), item.getTenChatLieu(),
                item.getMoTa(), item.getTrangThai()
        );
    }
}
