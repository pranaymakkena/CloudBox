package com.cloudbox.dto;

import java.util.List;

public class ShareFileRequest {

    private Long fileId;
    private String sharedWith; // single recipient (kept for backward compat)
    private List<String> sharedWithList; // multiple recipients (backward compat)
    private String permission; // single permission for all (backward compat)
    private List<ShareRecipientDTO> recipients; // new format: granular permissions per recipient

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getSharedWith() {
        return sharedWith;
    }

    public void setSharedWith(String sharedWith) {
        this.sharedWith = sharedWith;
    }

    public List<String> getSharedWithList() {
        return sharedWithList;
    }

    public void setSharedWithList(List<String> sharedWithList) {
        this.sharedWithList = sharedWithList;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }

    public List<ShareRecipientDTO> getRecipients() {
        return recipients;
    }

    public void setRecipients(List<ShareRecipientDTO> recipients) {
        this.recipients = recipients;
    }
}
