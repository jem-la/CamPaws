package edu.scu.campaws.controller;

import edu.scu.campaws.dto.StartWalkRequest;
import edu.scu.campaws.dto.StartWalkResponse;
import edu.scu.campaws.dto.WalkLocationUpdateRequest;
import edu.scu.campaws.dto.WalkHistoryDtos.SaveWalkRequest;
import edu.scu.campaws.dto.WalkHistoryDtos.WalkStats;
import edu.scu.campaws.dto.WalkHistoryDtos.WalkSummary;
import edu.scu.campaws.service.AuthService;
import edu.scu.campaws.service.WalkHistoryService;
import edu.scu.campaws.service.WalkSessionService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/walks")
public class WalkController {
    private final WalkSessionService sessions;
    private final AuthService auth;
    private final WalkHistoryService history;

    public WalkController(WalkSessionService sessions, AuthService auth, WalkHistoryService history) {
        this.sessions = sessions;
        this.auth = auth;
        this.history = history;
    }

    @PostMapping("/history")
    @ResponseStatus(HttpStatus.CREATED)
    public WalkSummary saveWalk(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody SaveWalkRequest request) {
        return history.save(auth.currentUser(authorization).getUserId(), request);
    }

    @GetMapping("/stats")
    public WalkStats stats(@RequestHeader(name = "Authorization", required = false) String authorization) {
        return history.stats(auth.currentUser(authorization).getUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StartWalkResponse startWalk(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody StartWalkRequest request) {
        int userId = auth.currentUser(authorization).getUserId();
        if (request == null) {
            throw new IllegalArgumentException("Walk details are required.");
        }
        return sessions.startWalk(
                userId, request.dogId(), request.publicSharing(), request.latitude(), request.longitude());
    }

    @PutMapping("/{walkId}/location")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLocation(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int walkId,
            @RequestBody WalkLocationUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Coordinates are required.");
        }
        sessions.updateLocation(
                walkId, auth.currentUser(authorization).getUserId(), request.latitude(), request.longitude());
    }

    @PostMapping("/{walkId}/end")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void endWalk(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable int walkId) {
        sessions.endWalk(walkId, auth.currentUser(authorization).getUserId());
    }
}