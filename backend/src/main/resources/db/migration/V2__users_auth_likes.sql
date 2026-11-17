-- Accounts, login sessions, dog ownership and per-user likes.

CREATE TABLE users (
    user_id              serial       PRIMARY KEY,
    email                varchar(254) NOT NULL,
    display_name         varchar(60)  NOT NULL,
    password_hash        varchar(100) NOT NULL,
    security_question    varchar(120) NOT NULL,
    security_answer      varchar(100) NOT NULL,
    created_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

-- One row per logged-in device. Logging out deletes the row.
CREATE TABLE auth_tokens (
    token      varchar(64)  PRIMARY KEY,
    user_id    integer      NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    created_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX auth_tokens_user_idx ON auth_tokens (user_id);

-- Who added a dog. Deleting an account keeps the dog but drops the owner.
ALTER TABLE dogs ADD COLUMN owner_id integer REFERENCES users (user_id) ON DELETE SET NULL;
CREATE INDEX dogs_owner_idx ON dogs (owner_id);

CREATE TABLE dog_likes (
    dog_id     integer     NOT NULL REFERENCES dogs (dog_id) ON DELETE CASCADE,
    user_id    integer     NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (dog_id, user_id)
);

CREATE INDEX dog_likes_user_idx ON dog_likes (user_id);
