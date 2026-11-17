-- Comments on dog profiles. Deleting a dog or an account removes its comments.
CREATE TABLE dog_comments (
    comment_id serial       PRIMARY KEY,
    dog_id     integer      NOT NULL REFERENCES dogs (dog_id) ON DELETE CASCADE,
    user_id    integer      NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    body       varchar(500) NOT NULL,
    created_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX dog_comments_dog_idx ON dog_comments (dog_id, created_at);
