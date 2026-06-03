package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementResponse {
    private List<UserAdminResponse> content;
    private int totalPages;
    private long totalElements;
    private int number;
    private int size;
    private long totalCustomers;
    private long activeUsers;
    private long blockedUsers;
    private long totalAdministrators;
}
