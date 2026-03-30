package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.FolderEntity;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.FolderRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class FolderService {

    private static final String ROOT_FOLDER = "root";

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;
    private final SystemEventService systemEventService;

    public FolderService(
            FolderRepository folderRepository,
            FileRepository fileRepository,
            SystemEventService systemEventService) {
        this.folderRepository = folderRepository;
        this.fileRepository = fileRepository;
        this.systemEventService = systemEventService;
    }

    public List<String> getUserFolders(String userEmail) {
        Set<String> folders = new LinkedHashSet<>();
        folders.add(ROOT_FOLDER);

        folderRepository.findByOwnerEmailOrderByNameAsc(userEmail)
                .stream()
                .map(FolderEntity::getName)
                .filter(name -> !ROOT_FOLDER.equals(name))
                .forEach(folders::add);

        fileRepository.findByOwnerEmail(userEmail)
                .stream()
                .map(FileEntity::getFolder)
                .filter(folder -> folder != null && !folder.isBlank())
                .forEach(folders::add);

        return new ArrayList<>(folders);
    }

    public void createFolder(String userEmail, String folderName) throws IOException {
        String normalizedFolder = normalizeFolderName(folderName);

        if (ROOT_FOLDER.equals(normalizedFolder)) {
            return;
        }

        if (folderRepository.existsByOwnerEmailAndName(userEmail, normalizedFolder)) {
            throw new RuntimeException("Folder already exists");
        }

        FolderEntity folder = new FolderEntity();
        folder.setName(normalizedFolder);
        folder.setOwnerEmail(userEmail);
        folder.setCreatedAt(LocalDateTime.now());
        folderRepository.save(folder);

        systemEventService.log(userEmail, "CREATE_FOLDER", "Created folder " + normalizedFolder);
    }

    public void renameFolder(String userEmail, String oldName, String newName) throws IOException {
        String sourceFolder = normalizeFolderName(oldName);
        String targetFolder = normalizeFolderName(newName);

        if (ROOT_FOLDER.equals(sourceFolder)) {
            throw new RuntimeException("Root folder cannot be renamed");
        }

        if (sourceFolder.equals(targetFolder)) {
            throw new RuntimeException("New folder name must be different");
        }

        if (folderRepository.existsByOwnerEmailAndName(userEmail, targetFolder)) {
            throw new RuntimeException("Target folder already exists");
        }

        List<FileEntity> files = fileRepository.findByFolderAndOwnerEmail(sourceFolder, userEmail);
        for (FileEntity file : files) {
            file.setFolder(targetFolder);
            fileRepository.save(file);
        }

        Optional<FolderEntity> existingFolder = folderRepository.findByOwnerEmailAndName(userEmail, sourceFolder);
        if (existingFolder.isPresent()) {
            FolderEntity folder = existingFolder.get();
            folder.setName(targetFolder);
            folderRepository.save(folder);
        } else {
            FolderEntity folder = new FolderEntity();
            folder.setName(targetFolder);
            folder.setOwnerEmail(userEmail);
            folder.setCreatedAt(LocalDateTime.now());
            folderRepository.save(folder);
        }

        systemEventService.log(userEmail, "RENAME_FOLDER",
                "Renamed folder " + sourceFolder + " to " + targetFolder);
    }

    public void deleteFolder(String userEmail, String folderName) throws IOException {
        String normalizedFolder = normalizeFolderName(folderName);

        if (ROOT_FOLDER.equals(normalizedFolder)) {
            throw new RuntimeException("Root folder cannot be deleted");
        }

        List<FileEntity> files = fileRepository.findByFolderAndOwnerEmail(normalizedFolder, userEmail);
        if (!files.isEmpty()) {
            throw new RuntimeException("Folder is not empty. Move or delete files first");
        }

        folderRepository.findByOwnerEmailAndName(userEmail, normalizedFolder)
                .ifPresent(folderRepository::delete);

        systemEventService.log(userEmail, "DELETE_FOLDER", "Deleted folder " + normalizedFolder);
    }

    public FileEntity moveFile(String userEmail, Long fileId, String targetFolder) throws IOException {
        String normalizedFolder = normalizeFolderName(targetFolder);

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwnerEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        if (normalizedFolder.equals(file.getFolder())) {
            return file;
        }

        ensureFolderExists(userEmail, normalizedFolder);

        String previousFolder = file.getFolder();
        file.setFolder(normalizedFolder);
        FileEntity savedFile = fileRepository.save(file);

        systemEventService.log(userEmail, "MOVE_FILE",
                "Moved " + savedFile.getFileName() + " from " + previousFolder + " to " + normalizedFolder);

        return savedFile;
    }

    public void ensureFolderExists(String userEmail, String folderName) throws IOException {
        String normalizedFolder = normalizeFolderName(folderName);
        if (ROOT_FOLDER.equals(normalizedFolder)) {
            return;
        }

        if (!folderRepository.existsByOwnerEmailAndName(userEmail, normalizedFolder)) {
            FolderEntity folder = new FolderEntity();
            folder.setName(normalizedFolder);
            folder.setOwnerEmail(userEmail);
            folder.setCreatedAt(LocalDateTime.now());
            folderRepository.save(folder);
        }

    }

    private String normalizeFolderName(String folderName) {
        if (folderName == null || folderName.isBlank()) {
            return ROOT_FOLDER;
        }

        String trimmed = folderName.trim();

        if (trimmed.contains("/") || trimmed.contains("\\") || trimmed.contains("..")) {
            throw new RuntimeException("Invalid folder name");
        }

        return trimmed;
    }
}
