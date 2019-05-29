--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE "member"
(
  "account_id" INTEGER NOT NULL UNIQUE,
  "account_name" TEXT,
  "status" INTEGER NOT NULL DEFAULT 0,
  "achivement_enabled" INTEGER NOT NULL DEFAULT 1,
  "rank_enabled" INTEGER NOT NULL DEFAULT 1,
  "discord_id" TEXT,
  "updated_at" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  PRIMARY KEY("account_id")
)


--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE member;
