package edu.scu.campaws.controller;

import edu.scu.campaws.dto.MapMarkerResponse;
import edu.scu.campaws.service.WalkSessionService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/map")
public class MapController {
    private final WalkSessionService sessions;

    public MapController(WalkSessionService sessions) {
        this.sessions = sessions;
    }


    @GetMapping("/dogs")
    public List<MapMarkerResponse> getAnonymousDogMarkers() {
        return sessions.getPublicMarkers();
    }
}