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

    public FileUploadService(
        @Value("${cloudinary.cloud-name}") String cloudName,
        @Value("${cloudinary.api-key}") String apiKey,
        @Value("${cloudinary.api-secret}") String apiSecret) {
        log.info("[DEBUG] Initializing FileUploadService with Cloudinary cloudName: {}, apiKey: {} (length: {})", 
            cloudName, apiKey != null && apiKey.length() > 4 ? apiKey.substring(0, 4) + "..." : apiKey, 
            apiKey != null ? apiKey.length() : 0);
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret
        ));
    }

    // Upload single image to Cloudinary
    // Returns: { url, publicId }
    public Map<String, String> uploadImage(MultipartFile file, String folder) {
        log.info("[DEBUG] Starting image upload. Folder: {}, File name: {}, File size: {} bytes, ContentType: {}", 
            folder, file != null ? file.getOriginalFilename() : "null", 
            file != null ? file.getSize() : "null", file != null ? file.getContentType() : "null");
        if (file == null || file.isEmpty()) {
            log.error("[DEBUG] File parameter is null or empty");
            throw new IllegalArgumentException("File cannot be null or empty");
        }
        try {
            log.info("[DEBUG] Invoking Cloudinary SDK upload...");
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", "belledonne/" + folder, "resource_type", "image"));
            log.info("[DEBUG] Cloudinary response received: {}", result);
            
            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            log.info("[DEBUG] Parsed Cloudinary secure_url: {}, public_id: {}", url, publicId);
            
            if (url == null || publicId == null) {
                log.error("[DEBUG] secure_url or public_id is null. Result keys: {}", result.keySet());
            }
            
            Map<String, String> resultMap = new java.util.HashMap<>();
            resultMap.put("url", url);
            resultMap.put("publicId", publicId);
            return resultMap;
        } catch (IOException e) {
            log.error("[DEBUG] IOException caught during Cloudinary upload", e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[DEBUG] Unexpected exception caught during Cloudinary upload", e);
            throw new RuntimeException("Failed to upload image due to unexpected error: " + e.getMessage(), e);
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
