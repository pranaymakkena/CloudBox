package com.cloudbox;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/*
 Main Spring Boot Application
 This is the entry point of the backend
*/

@SpringBootApplication
public class CloudBoxApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudBoxApplication.class, args);
    }
}