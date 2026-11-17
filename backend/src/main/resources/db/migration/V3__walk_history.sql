-- Finished walks, used for walk statistics. Live locations are never stored here.
CREATE TABLE walk_history (
    walk_id         serial           PRIMARY KEY,
    user_id         integer          NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    dog_id          integer          REFERENCES dogs (dog_id) ON DELETE SET NULL,
    started_at      timestamptz      NOT NULL,
    ended_at        timestamptz      NOT NULL,
    distance_meters double precision NOT NULL CHECK (distance_meters >= 0),
    public_sharing  boolean          NOT NULL DEFAULT false,
    CHECK (ended_at >= started_at)
);

CREATE INDEX walk_history_user_idx ON walk_history (user_id, started_at DESC);
