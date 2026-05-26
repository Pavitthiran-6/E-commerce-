package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.AddressRequest;
import com.belledonne.ecommerce.dto.response.AddressResponse;
import com.belledonne.ecommerce.entity.Address;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.AddressRepository;
import com.belledonne.ecommerce.repository.UserRepository;
import com.belledonne.ecommerce.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressResponse> getAll(UserPrincipal principal) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(principal.getId())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AddressResponse add(UserPrincipal principal, AddressRequest request) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultAddresses(principal.getId());
        }
        Address address = Address.builder()
            .user(user)
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .addressLine1(request.getAddressLine1())
            .addressLine2(request.getAddressLine2())
            .city(request.getCity())
            .state(request.getState())
            .pincode(request.getPincode())
            .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
            .build();
        return toResponse(addressRepository.save(address));
    }

    public AddressResponse update(UserPrincipal principal, Long addressId, AddressRequest request) {
        Address address = getAddress(addressId, principal.getId());
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultAddresses(principal.getId());
        }
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));
        return toResponse(addressRepository.save(address));
    }

    public void delete(UserPrincipal principal, Long addressId) {
        Address address = getAddress(addressId, principal.getId());
        addressRepository.delete(address);
    }

    public AddressResponse setDefault(UserPrincipal principal, Long addressId) {
        clearDefaultAddresses(principal.getId());
        Address address = getAddress(addressId, principal.getId());
        address.setIsDefault(true);
        return toResponse(addressRepository.save(address));
    }

    private void clearDefaultAddresses(UUID userId) {
        addressRepository.findByUserIdAndIsDefaultTrue(userId)
            .ifPresent(a -> { a.setIsDefault(false); addressRepository.save(a); });
    }

    private Address getAddress(Long addressId, UUID userId) {
        Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        if (!address.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }
        return address;
    }

    public AddressResponse toResponse(Address a) {
        return AddressResponse.builder()
            .id(a.getId())
            .fullName(a.getFullName())
            .phone(a.getPhone())
            .addressLine1(a.getAddressLine1())
            .addressLine2(a.getAddressLine2())
            .city(a.getCity())
            .state(a.getState())
            .pincode(a.getPincode())
            .isDefault(a.getIsDefault())
            .createdAt(a.getCreatedAt())
            .build();
    }
}
