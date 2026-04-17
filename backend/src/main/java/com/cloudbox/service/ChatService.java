package com.cloudbox.service;

import com.cloudbox.model.FileEntity;
import com.cloudbox.model.FileShare;
import com.cloudbox.model.SystemLog;
import com.cloudbox.repository.FileRepository;
import com.cloudbox.repository.FileShareRepository;
import com.cloudbox.repository.SystemLogRepository;
import com.cloudbox.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileShareRepository fileShareRepository;
    private final SystemLogRepository systemLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private volatile long lastRequestTime = 0;

    @Value("${openai.api.key:}")
    private String openAiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    private static final String LANDING_SYSTEM = "You are CloudBox Assistant, a helpful chatbot for the CloudBox cloud storage platform.\n"
            +
            "About CloudBox: secure cloud storage, Free 15GB, Pro 100GB (₹499/mo), Enterprise 1TB (₹1999/mo).\n" +
            "Features: upload up to 50MB, share with View/Download/Edit permissions, public links, collaboration, folders, trash/restore.\n"
            +
            "Keep answers short (2-4 sentences). Be friendly.";

    public ChatService(FileRepository fileRepository, UserRepository userRepository,
            FileShareRepository fileShareRepository, SystemLogRepository systemLogRepository) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileShareRepository = fileShareRepository;
        this.systemLogRepository = systemLogRepository;
    }

    // ── Landing page ──────────────────────────────────────────────────────────
    public String chatLanding(String userMessage) {
        if (isNoKey())
            return fallbackLanding(userMessage);
        String result = callOpenAI(LANDING_SYSTEM, userMessage);
        return result != null ? result : fallbackLanding(userMessage);
    }

    // ── Dashboard — answers from real DB data ─────────────────────────────────
    public String chatDashboard(String userMessage, String userEmail) {
        UserData d = buildUserData(userEmail);
        if (isNoKey())
            return answerFromData(userMessage, d);
        String prompt = "You are CloudBox Assistant. Answer using the user's real data. Be concise.\n\n"
                + d.toContext();
        String result = callOpenAI(prompt, userMessage);
        return result != null ? result : answerFromData(userMessage, d);
    }

    // ── User data record ──────────────────────────────────────────────────────
    private record UserData(
            String email, String plan, long limitMb,
            long totalFiles, long totalBytes, long trashedFiles,
            long images, long docs, long videos, long audio, long others,
            List<String> recentFiles, Set<String> folders,
            List<FileShare> sharedByMe, List<FileShare> sharedWithMe,
            List<SystemLog> recentActivity) {
        String toContext() {
            double usedMb = totalBytes / (1024.0 * 1024);
            double pct = limitMb > 0 ? usedMb * 100.0 / limitMb : 0;
            return String.format(
                    "User:%s Plan:%s Storage:%.1fMB/%dMB(%.1f%%) Files:%d Trash:%d " +
                            "Images:%d Docs:%d Videos:%d Audio:%d Folders:%s Recent:%s " +
                            "SharedByMe:%d SharedWithMe:%d",
                    email, plan, usedMb, limitMb, pct, totalFiles, trashedFiles,
                    images, docs, videos, audio,
                    folders.isEmpty() ? "root" : String.join(",", folders),
                    recentFiles.isEmpty() ? "none" : String.join(",", recentFiles),
                    sharedByMe.size(), sharedWithMe.size());
        }
    }

    private UserData buildUserData(String email) {
        List<FileEntity> files = fileRepository.findByOwnerEmailAndDeletedFalse(email);
        long totalBytes = files.stream().mapToLong(f -> f.getSize() != null ? f.getSize() : 0).sum();
        long trashedFiles = fileRepository.findByOwnerEmailAndDeletedTrue(email).size();

        long images = count(files, "jpg|jpeg|png|gif|webp|svg");
        long docs = count(files, "pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv");
        long videos = count(files, "mp4|mkv|avi|mov|webm");
        long audio = count(files, "mp3|wav|ogg|flac");
        long others = Math.max(0, files.size() - images - docs - videos - audio);

        List<String> recentFiles = files.stream()
                .filter(f -> f.getUploadDate() != null)
                .sorted((a, b) -> b.getUploadDate().compareTo(a.getUploadDate()))
                .limit(5).map(FileEntity::getFileName).toList();

        Set<String> folders = files.stream()
                .map(FileEntity::getFolder).filter(Objects::nonNull).collect(Collectors.toSet());

        var user = userRepository.findByEmail(email).orElse(null);
        long limitMb = (user != null && user.getStorageLimitMb() != null) ? user.getStorageLimitMb() : 15360L;
        String plan = (user != null && user.getPlan() != null) ? user.getPlan().name() : "FREE";

        List<FileShare> sharedByMe = fileShareRepository.findByOwnerEmailOrderByCreatedAtDesc(email);
        List<FileShare> sharedWithMe = fileShareRepository.findBySharedWithOrderByCreatedAtDesc(email);
        List<SystemLog> activity = systemLogRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream().limit(10).toList();

        return new UserData(email, plan, limitMb, files.size(), totalBytes, trashedFiles,
                images, docs, videos, audio, others, recentFiles, folders,
                sharedByMe, sharedWithMe, activity);
    }

    private long count(List<FileEntity> files, String ext) {
        return files.stream().filter(f -> f.getFileName() != null &&
                f.getFileName().toLowerCase().matches(".*\\.(" + ext + ")$")).count();
    }

    // ── Smart answers from real data ──────────────────────────────────────────
    private String answerFromData(String msg, UserData d) {
        String m = msg.toLowerCase();
        double usedMb = d.totalBytes() / (1024.0 * 1024);
        double pct = d.limitMb() > 0 ? usedMb * 100.0 / d.limitMb() : 0;

        if (m.contains("how many file") || m.contains("number of file") || m.contains("file count")
                || m.contains("total file") || m.contains("files do i"))
            return String.format("You have %d file%s: %d image%s, %d document%s, %d video%s, %d audio file%s.",
                    d.totalFiles(), s(d.totalFiles()), d.images(), s(d.images()), d.docs(), s(d.docs()),
                    d.videos(), s(d.videos()), d.audio(), s(d.audio()));

        if (m.contains("storage") || m.contains("space") || m.contains("how much") || m.contains("used"))
            return String.format("You've used %.1f MB of your %d MB (%d GB) — %.1f%% used. Plan: %s.",
                    usedMb, d.limitMb(), d.limitMb() / 1024, pct, d.plan());

        if (m.contains("plan") || m.contains("upgrade") || m.contains("limit"))
            return String.format("You're on the %s plan (%d MB / %d GB). %.1f MB used (%.1f%% full).",
                    d.plan(), d.limitMb(), d.limitMb() / 1024, usedMb, pct);

        if (m.contains("trash") || m.contains("deleted"))
            return d.trashedFiles() == 0 ? "Your trash is empty."
                    : String.format("You have %d file%s in trash.", d.trashedFiles(), s(d.trashedFiles()));

        if (m.contains("share") || m.contains("sharing") || m.contains("shared")) {
            String byMe = d.sharedByMe().isEmpty() ? "none"
                    : d.sharedByMe().stream().limit(3).map(s -> s.getFile().getFileName() + " → " + s.getSharedWith())
                            .collect(Collectors.joining(", "));
            String withMe = d.sharedWithMe().isEmpty() ? "none"
                    : d.sharedWithMe().stream().limit(3)
                            .map(s -> s.getFile().getFileName() + " from " + s.getOwnerEmail())
                            .collect(Collectors.joining(", "));
            return String.format("Shared by you: %d file%s (%s). Shared with you: %d file%s (%s).",
                    d.sharedByMe().size(), s(d.sharedByMe().size()), byMe,
                    d.sharedWithMe().size(), s(d.sharedWithMe().size()), withMe);
        }

        if (m.contains("collab") || m.contains("comment"))
            return d.sharedWithMe().isEmpty() && d.sharedByMe().isEmpty()
                    ? "No collaboration files yet. Share a file with Edit permission to start."
                    : String.format("%d file%s shared with you, %d file%s shared by you for collaboration.",
                            d.sharedWithMe().size(), s(d.sharedWithMe().size()),
                            d.sharedByMe().size(), s(d.sharedByMe().size()));

        if (m.contains("recent") || m.contains("latest") || m.contains("last upload"))
            return d.recentFiles().isEmpty() ? "No files uploaded yet."
                    : "Recent uploads: " + String.join(", ", d.recentFiles()) + ".";

        if (m.contains("folder"))
            return d.folders().isEmpty() ? "All files are in the root folder."
                    : "Your folders: " + String.join(", ", d.folders()) + " (" + d.folders().size() + " total).";

        if (m.contains("activity") || m.contains("history") || m.contains("log") || m.contains("recent action"))
            return d.recentActivity().isEmpty() ? "No recent activity."
                    : "Recent actions: " + d.recentActivity().stream().limit(5)
                            .map(l -> l.getAction().replace("_", " ").toLowerCase())
                            .collect(Collectors.joining(", ")) + ".";

        if (m.contains("image") || m.contains("photo"))
            return String.format("You have %d image file%s.", d.images(), s(d.images()));
        if (m.contains("document") || m.contains("pdf") || m.contains("doc"))
            return String.format("You have %d document%s (PDFs, Word, Excel, etc.).", d.docs(), s(d.docs()));
        if (m.contains("video"))
            return String.format("You have %d video file%s.", d.videos(), s(d.videos()));
        if (m.contains("audio") || m.contains("music") || m.contains("song"))
            return String.format("You have %d audio file%s.", d.audio(), s(d.audio()));
        if (m.contains("notif"))
            return "Notifications are sent for file shares, uploads, and plan changes.";
        if (m.contains("upload") || m.contains("add file"))
            return String.format("You have %d file%s uploaded. Use the Upload page to add more (max 50 MB each).",
                    d.totalFiles(), s(d.totalFiles()));
        if (m.contains("hello") || m.contains("hi") || m.contains("hey"))
            return String.format("Hi! You have %d files using %.1f MB of %d MB. Ask me anything!",
                    d.totalFiles(), usedMb, d.limitMb());

        return String.format(
                "You have %d files, %.1f MB used of %d MB. Ask about files, storage, shares, folders, or activity!",
                d.totalFiles(), usedMb, d.limitMb());
    }

    private String s(long n) {
        return n != 1 ? "s" : "";
    }

    // ── Landing fallback ──────────────────────────────────────────────────────
    private String fallbackLanding(String msg) {
        String m = msg.toLowerCase();
        if (m.contains("feature") || m.contains("special") || m.contains("what can") || m.contains("offer"))
            return "CloudBox features: ☁ Upload (50 MB max), 📁 Folders, 🔗 Public links with expiry, 👥 Share with View/Download/Edit, 💬 Collaboration & comments, 🗑 Trash & restore, 📊 Storage dashboard.";
        if (m.contains("why") || m.contains("benefit") || m.contains("advantage"))
            return "CloudBox gives you secure cloud storage with granular sharing, collaboration, and public links — all in one place. Starts free with 15 GB.";
        if (m.contains("how it work") || m.contains("how does") || m.contains("how to") || m.contains("get started"))
            return "Sign up free → upload files → share with others or create public links. Organize into folders, collaborate with comments, manage from your dashboard.";
        if (m.contains("what is") || m.contains("what's") || m.contains("about cloudbox") || m.contains("tell me"))
            return "CloudBox is a secure cloud file storage platform — upload, organize, share, and collaborate on files with granular permissions and admin controls.";
        if (m.contains("storage") || m.contains("space") || m.contains("how much"))
            return "Free: 15 GB | Pro (₹499/month): 100 GB | Enterprise (₹1999/month): 1 TB.";
        if (m.contains("upload"))
            return "Upload files up to 50 MB from the Upload page. Supports documents, images, videos, audio, and more.";
        if (m.contains("share") || m.contains("sharing"))
            return "Share files with specific users (View/Download/Edit permissions) or create public links with optional expiry.";
        if (m.contains("plan") || m.contains("price") || m.contains("cost") || m.contains("pricing"))
            return "Free (15 GB, ₹0) | Pro (100 GB, ₹499/month) | Enterprise (1 TB, ₹1999/month).";
        if (m.contains("trash") || m.contains("delete") || m.contains("restore"))
            return "Deleted files go to Trash and can be restored anytime. Empty Trash to permanently delete.";
        if (m.contains("folder"))
            return "Create folders from My Folders and move files into them to stay organized.";
        if (m.contains("collab") || m.contains("comment") || m.contains("team"))
            return "Share files with Edit permission for collaboration. Leave comments on shared files from the Collaboration page.";
        if (m.contains("secure") || m.contains("safe") || m.contains("privacy"))
            return "CloudBox uses JWT authentication, MinIO encrypted storage, and permission-based access control.";
        if (m.contains("hello") || m.contains("hi") || m.contains("hey"))
            return "Hi! I'm the CloudBox Assistant. Ask me about features, pricing, how to upload/share files, or anything about CloudBox!";
        return "I can help with CloudBox features, storage plans, file sharing, uploads, and more. What would you like to know?";
    }

    // ── OpenAI call ───────────────────────────────────────────────────────────
    private String callOpenAI(String systemPrompt, String userMessage) {
        long now = System.currentTimeMillis();
        if (now - lastRequestTime < 1000)
            return null;
        lastRequestTime = now;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", "gpt-3.5-turbo");
            body.put("max_tokens", 200);
            body.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)));
            ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_URL,
                    new HttpEntity<>(body, headers), Map.class);
            if (response.getBody() != null) {
                var choices = (List<?>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    var message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            System.err.println("[ChatService] OpenAI error: " + e.getMessage());
        }
        return null;
    }

    private boolean isNoKey() {
        return openAiKey == null || openAiKey.isBlank() || openAiKey.equals("YOUR_OPENAI_API_KEY_HERE");
    }
}
