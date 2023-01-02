module.exports = class Data1672614920228 {
    name = 'Data1672614920228'

    async up(db) {
        await db.query(`CREATE TABLE "staker" ("id" character varying NOT NULL, "latest_claim_block" integer NOT NULL, "account" text NOT NULL, "total_rewards" numeric NOT NULL, "total_unclaimed" numeric NOT NULL, CONSTRAINT "PK_13561f691b22038cfa606fe1161" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_010d8d9f1867008907524e9aa0" ON "staker" ("account") `)
        await db.query(`CREATE TABLE "core" ("id" character varying NOT NULL, "latest_claim_block" integer NOT NULL, "core_id" integer NOT NULL, "total_rewards" numeric NOT NULL, CONSTRAINT "PK_3b1e52368e24baad3e1ad2b7d8b" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_0a9bdb81a03f46475673599791" ON "core" ("core_id") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "staker"`)
        await db.query(`DROP INDEX "public"."IDX_010d8d9f1867008907524e9aa0"`)
        await db.query(`DROP TABLE "core"`)
        await db.query(`DROP INDEX "public"."IDX_0a9bdb81a03f46475673599791"`)
    }
}
