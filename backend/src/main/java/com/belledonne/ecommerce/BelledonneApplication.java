package com.belledonne.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BelledonneApplication {
    public static void main(String[] args) {
        SpringApplication.run(BelledonneApplication.class, args);
    }
}
