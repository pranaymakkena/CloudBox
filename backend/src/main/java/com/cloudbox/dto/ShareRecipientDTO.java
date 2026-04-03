package com.cloudbox.dto;

public class ShareRecipientDTO {

    private String email;
    private String permission;

    public ShareRecipientDTO() {
    }

    public ShareRecipientDTO(String email, String permission) {
        this.email = email;
        this.permission = permission;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }
}
