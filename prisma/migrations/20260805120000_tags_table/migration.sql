-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TagToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TagToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_TagToTask_B_index" ON "_TagToTask"("B");

-- AddForeignKey
ALTER TABLE "_TagToTask" ADD CONSTRAINT "_TagToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTask" ADD CONSTRAINT "_TagToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration des données : convertit Task.tags (text[]) en lignes Tag + relations.
-- Un id déterministe (md5 du nom) évite les doublons ; couleur pseudo-aléatoire
-- mais stable, choisie dans la palette sémantique.
INSERT INTO "Tag" ("id", "name", "color")
SELECT md5(name), name,
       (ARRAY['blue','green','yellow','red','gray'])[1 + (abs(hashtext(name)) % 5)]
FROM (SELECT DISTINCT unnest("tags") AS name FROM "Task") AS distinct_tags;

INSERT INTO "_TagToTask" ("A", "B")
SELECT md5(tag_name), t."id"
FROM "Task" t, unnest(t."tags") AS tag_name;

-- AlterTable : suppression de la colonne une fois les données migrées.
ALTER TABLE "Task" DROP COLUMN "tags";
