package edu.scu.campaws.controller;

import edu.scu.campaws.dto.StartWalkRequest;
import edu.scu.campaws.dto.StartWalkResponse;
import edu.scu.campaws.dto.WalkLocationUpdateRequest;
import edu.scu.campaws.service.WalkSessionService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/walks")
public class WalkController {
    private final WalkSessionService sessions;

    public WalkController(WalkSessionService sessions) {
        this.sessions = sessions;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StartWalkResponse startWalk(
            @RequestBody StartWalkRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Walk details are required."
            );
        }

        return sessions.startWalk(
                request.dogId(),
                request.publicSharing(),
                request.latitude(),
                request.longitude()
        );
    }

    @PutMapping("/{walkId}/location")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLocation(
            @PathVariable int walkId,
            @RequestHeader(
                    name = "X-Walk-Token",
                    required = false) String token,
            @RequestBody WalkLocationUpdateRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Coordinates are required."
            );
        }

        sessions.updateLocation(
                walkId,
                token,
                request.latitude(),
                request.longitude()
        );
    }

    @PostMapping("/{walkId}/end")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void endWalk(
            @PathVariable int walkId,
            @RequestHeader(
                    name = "X-Walk-Token",
                    required = false) String token) {

        sessions.endWalk(walkId, token);
    }
}