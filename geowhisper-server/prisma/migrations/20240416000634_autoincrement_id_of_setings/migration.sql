-- AlterTable
CREATE SEQUENCE settings_id_seq;
ALTER TABLE "Settings" ALTER COLUMN "id" SET DEFAULT nextval('settings_id_seq');
ALTER SEQUENCE settings_id_seq OWNED BY "Settings"."id";
