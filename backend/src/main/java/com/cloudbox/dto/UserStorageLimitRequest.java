package com.cloudbox.dto;

public class UserStorageLimitRequest {
    private Long storageLimitMb;

    public Long getStorageLimitMb() {
        return storageLimitMb;
    }

    public void setStorageLimitMb(Long storageLimitMb) {
        this.storageLimitMb = storageLimitMb;
    }
}
