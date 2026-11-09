-- Dog profiles with their photos and last-seen location.
-- Location is stored as plain latitude/longitude (easy to send to Google Maps) and as a
-- PostGIS geography point computed from them, which powers "dogs near me" queries.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SEQUENCE dogs_dog_id_seq;

CREATE TABLE dogs (
    dog_id              integer      PRIMARY KEY DEFAULT nextval('dogs_dog_id_seq'),
    name                varchar(80)  NOT NULL,
    temperament         varchar(120),
    can_be_petted       boolean      NOT NULL DEFAULT false,
    campus_frequency    varchar(120),
    fur_color           varchar(120),
    location            varchar(120),             -- human-readable spot, e.g. "Library lawn"
    about               varchar(120),
    petting_policy      varchar(3)   NOT NULL DEFAULT 'ask'
                                     CHECK (petting_policy IN ('ask', 'yes', 'no')),
    added_by            varchar(120),
    like_count          integer      NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    last_seen_latitude  double precision CHECK (last_seen_latitude BETWEEN -90 AND 90),
    last_seen_longitude double precision CHECK (last_seen_longitude BETWEEN -180 AND 180),
    last_seen_point     geography(Point, 4326) GENERATED ALWAYS AS (
                            CASE
                                WHEN last_seen_latitude IS NULL THEN NULL
                                ELSE ST_SetSRID(ST_MakePoint(last_seen_longitude, last_seen_latitude), 4326)::geography
                            END
                        ) STORED,
    created_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT dogs_location_pair CHECK ((last_seen_latitude IS NULL) = (last_seen_longitude IS NULL))
);

ALTER SEQUENCE dogs_dog_id_seq OWNED BY dogs.dog_id;

CREATE INDEX dogs_last_seen_point_idx ON dogs USING GIST (last_seen_point);
CREATE INDEX dogs_name_lower_idx ON dogs (lower(name));
CREATE INDEX dogs_leaderboard_idx ON dogs (like_count DESC, dog_id);

CREATE TABLE dog_photos (
    dog_id     integer       NOT NULL REFERENCES dogs (dog_id) ON DELETE CASCADE,
    sort_order integer       NOT NULL,
    url        varchar(2048) NOT NULL,
    PRIMARY KEY (dog_id, sort_order)
);
