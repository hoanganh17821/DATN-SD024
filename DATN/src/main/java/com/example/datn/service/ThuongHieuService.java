package com.example.datn.service;

import com.example.datn.entity.ThuongHieu;
import com.example.datn.dto.ThuongHieuRequest;
import com.example.datn.dto.ThuongHieuResponse;
import com.example.datn.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThuongHieuService {
    private final ThuongHieuRepository repository;

    @Transactional(readOnly = true)
    public List<ThuongHieuResponse> all() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ThuongHieuResponse create(ThuongHieuRequest input) {
        validate(input);
        if (repository.existsByMaThuongHieuIgnoreCase(input.maThuongHieu().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã thương hiệu đã tồn tại");
        }
        ThuongHieu item = new ThuongHieu();
        apply(item, input);
        return toResponse(repository.save(item));
    }

    @Transactional
    public ThuongHieuResponse update(Integer id, ThuongHieuRequest input) {
        validate(input);
        ThuongHieu item = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thương hiệu"));
        if (repository.existsByMaThuongHieuIgnoreCaseAndIdNot(input.maThuongHieu().trim(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã thương hiệu đã tồn tại");
        }
        apply(item, input);
        return toResponse(repository.save(item));
    }

    private void validate(ThuongHieuRequest input) {
        if (input == null || input.maThuongHieu() == null || input.maThuongHieu().isBlank()
                || input.tenThuongHieu() == null || input.tenThuongHieu().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã và tên thương hiệu không được trống");
        }
    }

    private void apply(ThuongHieu item, ThuongHieuRequest input) {
        item.setMaThuongHieu(input.maThuongHieu().trim());
        item.setTenThuongHieu(input.tenThuongHieu().trim());
        item.setMoTa(input.moTa());
        item.setTrangThai(input.trangThai() == null ? true : input.trangThai());
    }


    private ThuongHieuResponse toResponse(ThuongHieu item) {
        return new ThuongHieuResponse(
                item.getId(), item.getMaThuongHieu(), item.getTenThuongHieu(),
                item.getMoTa(), item.getTrangThai()
        );
    }
}
