package com.belledonne.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class FileUploadService {

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public FileUploadService(
        @Value("${cloudinary.cloud-name}") String cloudName,
        @Value("${cloudinary.api-key}") String apiKey,
        @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret
        ));
    }

    // Upload single image to Cloudinary
    // Returns: { url, publicId }
    public Map<String, String> uploadImage(MultipartFile file, String folder) {
        // Fallback to Base64 if placeholders are detected
        if ("placeholder-cloud".equals(cloudName) || "000000000000000".equals(apiKey) || "placeholder-secret".equals(apiSecret)) {
            log.warn("Cloudinary credentials not configured. Using Base64 fallback.");
            return uploadBase64Fallback(file);
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", "belledonne/" + folder, "resource_type", "image"));
            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            return Map.of("url", url, "publicId", publicId);
        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary. Falling back to Base64 representation.", e);
            try {
                return uploadBase64Fallback(file);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to upload image: " + ex.getMessage());
            }
        }
    }

    private Map<String, String> uploadBase64Fallback(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String contentType = file.getContentType();
            if (contentType == null) {
                contentType = "image/png";
            }
            String base64 = java.util.Base64.getEncoder().encodeToString(bytes);
            String url = "data:" + contentType + ";base64," + base64;
            return Map.of("url", url, "publicId", "base64-fallback-" + java.util.UUID.randomUUID().toString());
        } catch (IOException e) {
            log.error("Failed to convert image to Base64", e);
            throw new RuntimeException("Failed to convert image: " + e.getMessage());
        }
    }

    // Delete image from Cloudinary by publicId
    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary", e);
        }
    }

    // Upload multiple images (for products)
    public List<String> uploadMultipleImages(List<MultipartFile> files, String folder) {
        List<String> urls = new ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    Map<String, String> res = uploadImage(file, folder);
                    urls.add(res.get("url"));
                }
            }
        }
        return urls;
    }
}
