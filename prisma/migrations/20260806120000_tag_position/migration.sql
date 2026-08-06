-- Ordre d'affichage des étiquettes (drag & drop).
ALTER TABLE "Tag" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill : positions selon l'ordre alphabétique actuel, pour préserver
-- l'affichage existant tant que l'utilisateur n'a pas réordonné.
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "name" ASC) - 1 AS rn
  FROM "Tag"
)
UPDATE "Tag" SET "position" = ordered.rn
FROM ordered
WHERE "Tag"."id" = ordered."id";

-- CreateIndex
CREATE INDEX "Tag_position_idx" ON "Tag"("position");
